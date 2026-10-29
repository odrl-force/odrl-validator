import { Quad } from "@rdfjs/types";
import { Parser, Store, Writer } from 'n3';
import { IODRLValidator, ODRLProfile, ValidatorResult } from "./Types";
import { DataFactory } from 'rdf-data-factory';
import { Validator } from "shacl-engine"
import { EyelingReasoner } from 'n3-utility'
import { RDF } from "odrl-atomization";
import { RULES } from "./rules/Rules";
import { SHAPES } from "./shapes/Shapes";
import { DETECTION, ODRL } from "./util/Vocabulary";
import { Normalizer } from "./Normalisation";
import { addProfileToShape, subclassesOf } from "./profiles/Profile";

const POLICY_TYPES: string[] = [
    ODRL.Policy,
    ODRL.Agreement,
    ODRL.Assertion,
    ODRL.Offer,
    ODRL.Privacy,
    ODRL.Request,
    ODRL.Set,
    ODRL.Ticket
];

export class ODRLValidator implements IODRLValidator {
    private normalizer: Normalizer;
    private shaclValidator: Validator;
    private readonly profiles: ODRLProfile[];
    private policyTypes: string[]
    private n3Rules: string;

    protected shaclStore: Store;

    public constructor(config?: {
        shape?: Quad[],
        n3Rules?: string,
        profiles?: ODRLProfile[];
    }) {
        let shape: Quad[] = new Parser().parse(SHAPES);
        let n3Rules: string = RULES;
        let profiles: ODRLProfile[] = []
        if (config) {
            shape = config.shape ?? shape;
            n3Rules = config.n3Rules ?? n3Rules;
            profiles = config.profiles ?? profiles;
        }
        this.policyTypes = POLICY_TYPES
        for (const profile of profiles) {
            // Constantly update the shape with the profiles
            shape = addProfileToShape(shape, profile.quads)
            // Add the policy types defined by the profile (rdfs:subClassOf odrl:Policy)
            this.policyTypes.push(...subclassesOf(new Store(profile.quads), ODRL.terms.Policy).map(type => type.value));
        }
        const shapeStore = new Store(shape);

        this.profiles = profiles;
        this.shaclValidator = new Validator(shapeStore, { factory: new DataFactory() });
        this.n3Rules = n3Rules;

        this.normalizer = new Normalizer();
        this.shaclStore = shapeStore;
    }

    public async validate(policies: Quad[]): Promise<ValidatorResult> {
        const output: ValidatorResult = {
            valid: false,
            validationResults: [],
            conflicts: []
        }

        // No valid RDF or No ODRL policies provided
        if (!policies || policies.length === 0 ||
            !policies.some(q => q.predicate.value === RDF.type && this.policyTypes.includes(q.object.value))) {
            output.valid = false;
            output.validationResults.push({
                message: "No valid policy provided"
            });
            return output;
        }

        // Normalization of the policies
        let normalizedPolicies: Quad[];
        try {
            normalizedPolicies = await this.normalizer.normalise(policies);
        } catch (error) {
            output.valid = false;
            output.validationResults.push({
                message: "Normalization step failed. " + error
            });
            return output;
        }

        const normalizedPolicyStore = new Store(normalizedPolicies)

        // Warn about profiles that the policies use, but that the validator does not support
        const supportedProfiles = this.profiles.map(profile => profile.uri);
        for (const quad of normalizedPolicyStore.getQuads(null, ODRL.terms.profile, null, null)) {                   
            if (!supportedProfiles.includes(quad.object.value)) {
                output.validationResults.push({
                    message: `Profile ${quad.object.value} is not supported: terms from this profile are not validated.`,
                    focusNode: quad.subject.value,
                    severity: "http://www.w3.org/ns/shacl#Warning"
                });
            }
        }

        // SHACL Validation
        const report = await this.shaclValidator.validate({ dataset: normalizedPolicyStore });
        if (report.conforms === false) {

            const getResults = (result: any): any[] => {
                if (result.results && result.results.length > 0) {
                    return result.results.flatMap((r: any) => getResults(r));
                };

                const messages =
                    result.message?.map((m: any) => m.value)
                    ?? result._message?.()?.map((m: any) => m.value)
                    ?? [];

                return messages.map((message: string) => ({
                    message,
                    focusNode: result.focusNode?.value,
                    valueNode: result.value?.value,
                    severity: result.severity?.value
                }));
            };

            output.validationResults.push(...report.results.flatMap((result: any) =>
                getResults(result)
            ));

            const duplicatedErrorResults = new Set<string>();

            output.validationResults = output.validationResults.filter((result: any) => {
                const key = JSON.stringify(result);
                return duplicatedErrorResults.has(key) ? false : duplicatedErrorResults.add(key);
            });

            const hasViolation = output.validationResults.some((result: any) =>
                result.severity === "http://www.w3.org/ns/shacl#Violation"
            );

            output.valid = !hasViolation;

            // If there are any violations, conflict detection does not make sense
            if (hasViolation) {
                return output;
            }
        } else {
            output.valid = true;
        }

        // Notation3 Conflict Detection
        const conflictReasoningResult = await new EyelingReasoner().reason(new Store(normalizedPolicies), this.n3Rules);

        const conflicts = conflictReasoningResult.getQuads(null, RDF.type, DETECTION.Conflict, null);
        for (const conflict of conflicts) {

            // NOTE: we expect that the inconsistency detection rules are well formed. 
            // That is they produce an output with two rules and a reason.
            const reason = conflictReasoningResult.getObjects(conflict.subject, DETECTION.reason, null)[0].value;
            const rules: string[] = conflictReasoningResult.getObjects(conflict.subject, DETECTION.rules, null).map(object => object.value);
            output.conflicts.push({
                message: reason,
                type: "DeonticConflict",
                severity: "error",
                ruleA: rules[0],
                ruleB: rules[1]
            });
        }
        return output;
    }
}