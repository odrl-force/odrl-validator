import type { Quad, Quad_Subject, Term } from "@rdfjs/types";
import { Parser, Store } from 'n3';
import { IODRLValidator, ODRLProfile, ValidationResult, ValidatorResult } from "./Types";
import { DataFactory } from 'rdf-data-factory';
import { Validator } from "shacl-engine"
import { EyelingReasoner } from 'n3-utility'
import { RDF } from "odrl-atomization";
import { RULES } from "./rules/Rules";
import { SHAPES } from "./shapes/Shapes";
import { DETECTION, ODRL, RDFS, SH } from "./util/Vocabulary";
import { Normalizer } from "./Normalisation";
import { addProfileToShape, subclassesOf } from "./profiles/Profile";

const POLICY_TYPES: readonly string[] = [
    ODRL.Policy,
    ODRL.Agreement,
    ODRL.Assertion,
    ODRL.Offer,
    ODRL.Privacy,
    ODRL.Request,
    ODRL.Set,
    ODRL.Ticket
];

/** One policy, with everything needed to validate it on its own. */
interface PolicyUnit {
    policy: Term;
    /** All quads reachable from the policy. Quads that point to other policies are left out. */
    quads: Quad[];
    /** The supported profiles the policy declares, sorted. */
    profiles: string[];
    /** The profiles the policy declares that this validator does not support. */
    unsupportedProfiles: string[];
}

/** Identifies a term. A blank node and a named node with the same value stay apart. */
function termKey(term: Term): string {
    return `${term.termType}|${term.value}`;
}

export class ODRLValidator implements IODRLValidator {
    private normalizer: Normalizer;
    private n3Rules: string;

    /** The shapes for plain ODRL. The profiles a policy declares are added on top of these. */
    private readonly shape: Quad[];
    /** The profiles this validator supports, by the IRI a policy declares with `odrl:profile`. */
    private readonly profiles: Map<string, ODRLProfile>;
    /** The ODRL policy classes, plus the subclasses of `odrl:Policy` of every supported profile. Only used to find policies. */
    private readonly policyTypes: string[];
    /** One SHACL validator per set of profiles, created when the first policy with that set is validated. */
    private readonly shaclValidators: Map<string, Validator> = new Map();

    public constructor(config?: {
        shape?: Quad[],
        n3Rules?: string,
        profiles?: ODRLProfile[];
    }) {
        this.shape = config?.shape ?? new Parser().parse(SHAPES);
        this.n3Rules = config?.n3Rules ?? RULES;
        this.profiles = new Map((config?.profiles ?? []).map((profile): [string, ODRLProfile] => [profile.uri, profile]));

        const policyTypes = new Set<string>(POLICY_TYPES);
        for (const profile of this.profiles.values()) {
            // Add the policy types defined by the profile (rdfs:subClassOf odrl:Policy)
            for (const type of subclassesOf(new Store(profile.quads), ODRL.terms.Policy)) {
                policyTypes.add(type.value);
            }
        }
        this.policyTypes = [...policyTypes];
        this.normalizer = new Normalizer();
    }

    public async validate(policies: Quad[]): Promise<ValidatorResult> {
        const output: ValidatorResult = {
            valid: false,
            validationResults: [],
            conflicts: []
        }

        // No valid RDF or No ODRL policies provided
        if (!policies || policies.length === 0 || this.findPolicies(new Store(policies)).length === 0) {
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

        // Split the input into one unit per policy, plus the quads that no policy reaches
        const { units, leftover } = this.policyUnits(normalizedPolicyStore);

        const results: ValidationResult[] = [];
        for (const unit of units) {
            // Warn about profiles that the policy uses, but that the validator does not support
            for (const profile of unit.unsupportedProfiles) {
                results.push({
                    message: `Profile ${profile} is not supported: terms from this profile are not recognised.`,
                    focusNode: unit.policy.value,
                    severity: SH.Warning,
                    policies: [unit.policy.value]
                });
            }

            // SHACL Validation of the policy, with the shapes of plain ODRL and the profiles it declares
            const dataset = new Store(unit.quads)
            // Add the Assets and Parties from the profiles such that they not flag SHACL Warnings
            dataset.addQuads(this.profileFeatures(unit.profiles))
            const report = await this.shaclValidatorFor(unit.profiles).validate({ dataset });
            for (const result of report.results as any[]) {
                results.push(...this.parseResult(result).map((parsed): ValidationResult =>
                    ({ ...parsed, policies: [unit.policy.value] })));
            }
        }

        // SHACL Validation of what is left, with the shapes of plain ODRL: nothing there declares a profile
        if (leftover.length > 0) {
            const report = await this.shaclValidatorFor([]).validate({ dataset: new Store(leftover) });
            results.push(...(report.results as any[]).flatMap((result): ValidationResult[] => this.parseResult(result)));
        }

        // The same result for several policies (e.g. about a rule or asset they share) is reported once
        const uniqueResults = new Map<string, ValidationResult>();
        for (const result of results) {
            const key = JSON.stringify([result.focusNode, result.valueNode, result.message, result.severity]);
            const known = uniqueResults.get(key);
            if (!known) {
                uniqueResults.set(key, result);
            } else if (result.policies) {
                known.policies = [...new Set([...(known.policies ?? []), ...result.policies])];
            }
        }
        output.validationResults = [...uniqueResults.values()];

        const hasViolation = output.validationResults.some((result): boolean => result.severity === SH.Violation);
        output.valid = !hasViolation;

        // If there are any violations, conflict detection does not make sense
        if (hasViolation) {
            return output;
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

    /**
     * Finds the policies by their structure, so policies with an unknown class (e.g. from a profile
     * that is not supported) are found as well. A policy is a subject that
     *
     * - has a rule (`odrl:permission`, `odrl:prohibition` or `odrl:obligation`),
     * - declares a profile (`odrl:profile`), or
     * - is typed with an ODRL policy class or a policy class of a supported profile.
     */
    private findPolicies(store: Store): Term[] {
        const found = new Map<string, Term>();
        for (const subject of store.getSubjects(null, null, null)) {
            if (this.isPolicy(store, subject)) {
                found.set(termKey(subject), subject);
            }
        }
        return [...found.values()];
    }

    /** Whether a node is a policy, see {@link findPolicies}. */
    private isPolicy(store: Store, node: Term): boolean {
        if (node.termType === 'Literal') {
            return false;
        }
        const subject = node as Quad_Subject;
        return [ODRL.terms.permission, ODRL.terms.prohibition, ODRL.terms.obligation, ODRL.terms.profile]
            .some((predicate): boolean => store.countQuads(subject, predicate, null, null) > 0)
            || store.getObjects(subject, RDF.type, null).some((type): boolean => this.policyTypes.includes(type.value));
    }

    /**
     * Splits the (normalised) input into one unit per policy.
     *
     * The quads of a policy are those of the policy itself and of every node reachable from it.
     * Other policies are not part of a unit: see {@link reachableQuads}.
     *
     * @returns The units, and the leftover: the quads of every node that is part of no unit,
     *          and of everything reachable from those nodes.
     */
    private policyUnits(store: Store): { units: PolicyUnit[], leftover: Quad[] } {
        const policies = this.findPolicies(store);
        const policyKeys = new Set(policies.map(termKey));
        const reached = new Set<string>(policyKeys);

        const units = policies.map((policy): PolicyUnit => {
            const { quads, nodes } = this.reachableQuads(store, [policy], policyKeys);
            nodes.forEach((node): Set<string> => reached.add(node));
            const declared = store.getObjects(policy as Quad_Subject, ODRL.terms.profile, null).map((profile): string => profile.value);
            return {
                policy,
                quads,
                profiles: [...new Set(declared.filter((profile): boolean => this.profiles.has(profile)))].sort(),
                unsupportedProfiles: [...new Set(declared.filter((profile): boolean => !this.profiles.has(profile)))],
            };
        });

        const roots = store.getSubjects(null, null, null).filter((subject): boolean => !reached.has(termKey(subject)));
        const leftover = roots.length > 0 ? this.reachableQuads(store, roots, policyKeys).quads : [];
        return { units, leftover };
    }

    /**
     * The quads of the start nodes and of every node reachable from them.
     *
     * Policies other than the start nodes are left out completely: quads that point to them are dropped.
     * For `ex:policy odrl:inheritFrom ex:policy2`, the unit of `ex:policy` thus contains nothing of `ex:policy2`.
     * Including the triple `ex:policy odrl:inheritFrom ex:policy2` as well. The Policy Shape expects something of type policy, 
     * so an inheritfrom would then always result into a Violation if kept
     *
     * @returns The quads, and the keys (see {@link termKey}) of the nodes they are about.
     */
    private reachableQuads(store: Store, start: Term[], policyKeys: Set<string>): { quads: Quad[], nodes: Set<string> } {
        const quads: Quad[] = [];
        const nodes = new Set<string>();
        const startKeys = new Set(start.map(termKey));
        const queue: Term[] = [...start];
        while (queue.length > 0) {
            const node = queue.pop()!;
            if (nodes.has(termKey(node))) {
                continue;
            }
            nodes.add(termKey(node));
            for (const quad of store.getQuads(node, null, null, null)) {
                const object = termKey(quad.object);
                if (policyKeys.has(object) && !startKeys.has(object)) {
                    continue;
                }
                quads.push(quad);
                if (quad.object.termType !== 'Literal') {
                    queue.push(quad.object);
                }
            }
        }
        return { quads, nodes };
    }

    /**
     * The SHACL validator for exactly these profiles: the shapes of plain ODRL when there are none.
     * Extending the shapes is slow, so every set of profiles is only built once.
     *
     * @param profiles - The IRIs of supported profiles, sorted.
     */
    private shaclValidatorFor(profiles: string[]): Validator {
        const key = profiles.join(' ');
        let validator = this.shaclValidators.get(key);
        if (!validator) {
            // Constantly update the shape with the profiles
            const shape = profiles.reduce((quads, uri): Quad[] =>
                addProfileToShape(quads, this.profiles.get(uri)!.quads), this.shape);
            validator = new Validator(new Store(shape), { factory: new DataFactory() });
            this.shaclValidators.set(key, validator);
        }
        return validator;
    }

    /** Flattens a SHACL result with its nested results into one result per message. */
    private parseResult(result: any): ValidationResult[] {
        if (result.results && result.results.length > 0) {
            return result.results.flatMap((r: any) => this.parseResult(r));
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
    }

    // extracts all instances and declarations of Party from a profile.
    // Declarations are not resolved transitively
    private profileParties(profile: string): Quad[] {
        const profileStore = new Store(this.profiles.get(profile)?.quads)
        const quads: Quad[] = []
        quads.push(...profileStore.getQuads(null, RDF.terms.type, ODRL.terms.Party, null));
        quads.push(...profileStore.getQuads(null, RDFS.terms.subClassOf, ODRL.terms.Party, null));
        return quads

    }

    // extracts all instances and declarations of Asset from a profile.
    // Declarations are not resolved transitively
    private profileAssets(profile:string): Quad[] {
        const profileStore = new Store(this.profiles.get(profile)?.quads)
        const quads: Quad[] = []
        quads.push(...profileStore.getQuads(null, RDF.terms.type, ODRL.terms.Asset, null));
        quads.push(...profileStore.getQuads(null, RDFS.terms.subClassOf, ODRL.terms.Asset, null));
        return quads
    }
    /**
     * extracts all the parties and assets for the profiles.
     * NOTE: currently not cached
     */
    private profileFeatures(profiles: string[]): Quad[] {
        const quads: Quad[] = []
        for (const profile of profiles) {
            quads.push(...this.profileParties(profile))
            quads.push(...this.profileAssets(profile))
        }
        return quads
    }
}