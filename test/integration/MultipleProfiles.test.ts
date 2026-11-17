import type { NamedNode, Quad } from '@rdfjs/types';
import { DataFactory, Parser } from 'n3';
import { ODRLProfile, ValidationResult, ValidatorResult } from '../../src/Types';
import { ODRL, RDF, RDFS, XSD } from '../../src/util/Vocabulary';
import { ODRLValidator } from '../../src/Validator';
import { DPV_ODRL_PROFILE, TOSL_PROFILE } from '../../src/profiles';
const { quad, namedNode, literal } = DataFactory;

const VIOLATION = 'http://www.w3.org/ns/shacl#Violation';
const WARNING = 'http://www.w3.org/ns/shacl#Warning';

describe('The ODRL Validator with multiple profiles', (): void => {
    const EX = 'https://example.org/';
    const alice = namedNode(EX + 'Alice');
    const asset = namedNode(EX + 'x');

    // Two policies. Each test decides which profile they declare and which terms they use.
    let policyA: NamedNode;
    let policyB: NamedNode;
    let ruleA: NamedNode;
    let ruleB: NamedNode;

    // Two profiles, each defining one term of every kind
    let profileA: ODRLProfile;
    let profileB: ODRLProfile;
    let actionA: NamedNode;
    let actionB: NamedNode;
    let leftOperandA: NamedNode;
    let leftOperandB: NamedNode;
    let operatorA: NamedNode;
    let operatorB: NamedNode;
    let conflictTermA: NamedNode;
    let conflictTermB: NamedNode;
    let policyTypeA: NamedNode;
    let policyTypeB: NamedNode;

    let validator: ODRLValidator;

    // A profile that defines one term of every kind in its own namespace
    const profileQuads = (uri: string): Quad[] => [
        quad(namedNode(uri + 'Act'), RDF.terms.type, ODRL.terms.Action),
        quad(namedNode(uri + 'Left'), RDF.terms.type, ODRL.terms.LeftOperand),
        quad(namedNode(uri + 'Op'), RDF.terms.type, ODRL.terms.Operator),
        quad(namedNode(uri + 'Conf'), RDF.terms.type, ODRL.terms.ConflictTerm),
        quad(namedNode(uri + 'MyPolicy'), RDFS.terms.subClassOf, ODRL.terms.Policy),
    ];

    // A policy with its type and, when given, the profiles it declares
    const policyQuads = (policy: NamedNode, profiles: ODRLProfile[] = [], type: NamedNode = ODRL.terms.Set): Quad[] => [
        quad(policy, RDF.terms.type, type),
        ...profiles.map((profile): Quad => quad(policy, ODRL.terms.profile, namedNode(profile.uri))),
    ];

    // A permission of a policy with an action, an assignee and a target.
    // The assignee and the target are typed, so that valid policies have no warnings either.
    const permissionQuads = (rule: NamedNode, action: NamedNode, policy: NamedNode): Quad[] => [
        quad(policy, ODRL.terms.permission, rule),
        quad(rule, RDF.terms.type, ODRL.terms.Permission),
        quad(rule, ODRL.terms.action, action),
        quad(rule, ODRL.terms.assignee, alice),
        quad(rule, ODRL.terms.target, asset),
        quad(alice, RDF.terms.type, ODRL.terms.Party),
        quad(asset, RDF.terms.type, ODRL.terms.Asset),
    ];

    // A constraint on a rule
    const constraintQuads = (rule: NamedNode, leftOperand: NamedNode, operator: NamedNode): Quad[] => {
        const constraint = namedNode(rule.value + '-constraint');
        return [
            quad(rule, ODRL.terms.constraint, constraint),
            quad(constraint, RDF.terms.type, ODRL.terms.Constraint),
            quad(constraint, ODRL.terms.leftOperand, leftOperand),
            quad(constraint, ODRL.terms.operator, operator),
            quad(constraint, ODRL.terms.rightOperand, literal('5', XSD.terms.integer)),
        ];
    };

    const violations = (result: ValidatorResult): ValidationResult[] =>
        result.validationResults.filter((r): boolean => r.severity === VIOLATION);
    const violationsOf = (result: ValidatorResult, policy: NamedNode): ValidationResult[] =>
        violations(result).filter((r): boolean => r.policies?.includes(policy.value) ?? false);

    beforeEach((): void => {
        policyA = namedNode(EX + 'PolicyA');
        policyB = namedNode(EX + 'PolicyB');
        ruleA = namedNode(EX + 'ruleA');
        ruleB = namedNode(EX + 'ruleB');

        const uriA = EX + 'profileA#';
        const uriB = EX + 'profileB#';
        profileA = { uri: uriA, quads: profileQuads(uriA) };
        profileB = { uri: uriB, quads: profileQuads(uriB) };
        actionA = namedNode(uriA + 'Act');
        actionB = namedNode(uriB + 'Act');
        leftOperandA = namedNode(uriA + 'Left');
        leftOperandB = namedNode(uriB + 'Left');
        operatorA = namedNode(uriA + 'Op');
        operatorB = namedNode(uriB + 'Op');
        conflictTermA = namedNode(uriA + 'Conf');
        conflictTermB = namedNode(uriB + 'Conf');
        policyTypeA = namedNode(uriA + 'MyPolicy');
        policyTypeB = namedNode(uriB + 'MyPolicy');

        validator = new ODRLValidator({ profiles: [ profileA, profileB ] });
    });

    describe('for a single policy', (): void => {
        it('validates a policy that only uses terms of the profile it declares.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...constraintQuads(ruleA, leftOperandA, operatorA),
                quad(policyA, ODRL.terms.conflict, conflictTermA),
            ]);
            expect(result.validationResults).toEqual([]);
            expect(result.valid).toBe(true);
        });

        it('validates a plain ODRL policy.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA),
                ...permissionQuads(ruleA, ODRL.terms.read, policyA),
            ]);
            expect(result.valid).toBe(true);
        });

        it('fails when a policy without a profile uses an action of a supported profile.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA),
                ...permissionQuads(ruleA, actionA, policyA),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA).length).toBeGreaterThan(0);
        });

        it('fails when a policy uses an action of a supported profile it does not declare.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionB, policyA),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA).some((r): boolean => r.valueNode === actionB.value)).toBe(true);
        });

        it('fails when a policy uses a left operand of a supported profile it does not declare.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...constraintQuads(ruleA, leftOperandB, ODRL.terms.eq),
            ]);
            expect(result.valid).toBe(false);
        });

        it('fails when a policy uses an operator of a supported profile it does not declare.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...constraintQuads(ruleA, leftOperandA, operatorB),
            ]);
            expect(result.valid).toBe(false);
        });

        it('fails when a policy uses a conflict term of a supported profile it does not declare.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                quad(policyA, ODRL.terms.conflict, conflictTermB),
            ]);
            expect(result.valid).toBe(false);
        });

        it('validates a policy that is typed with the policy class of the profile it declares.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ], policyTypeA),
                ...permissionQuads(ruleA, actionA, policyA),
            ]);
            expect(result.valid).toBe(true);
        });

        it('fails when a policy is typed with the policy class of a supported profile it does not declare.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ], policyTypeB),
                ...permissionQuads(ruleA, actionA, policyA),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA).length).toBeGreaterThan(0);
        });

        it('validates a policy that declares both profiles and uses terms of both.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA, profileB ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...constraintQuads(ruleA, leftOperandB, operatorA),
                ...permissionQuads(ruleB, actionB, policyA),
                quad(policyA, ODRL.terms.conflict, conflictTermB),
            ]);
            expect(result.validationResults).toEqual([]);
            expect(result.valid).toBe(true);
        });
    });

    describe('for multiple policies in one input', (): void => {
        it('validates policies that each use the terms of their own profile.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...constraintQuads(ruleA, leftOperandA, operatorA),
                ...policyQuads(policyB, [ profileB ]),
                ...permissionQuads(ruleB, actionB, policyB),
                ...constraintQuads(ruleB, leftOperandB, operatorB),
            ]);
            expect(result.validationResults).toEqual([]);
            expect(result.valid).toBe(true);
        });

        it('validates a profile policy next to a plain ODRL policy.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...policyQuads(policyB),
                ...permissionQuads(ruleB, ODRL.terms.read, policyB),
            ]);
            expect(result.valid).toBe(true);
        });

        it('only reports the policy that uses a term of the profile of the other policy.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...policyQuads(policyB, [ profileB ]),
                // The action of profile A in a policy that declares profile B
                ...permissionQuads(ruleB, actionA, policyB),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA)).toEqual([]);
            expect(violationsOf(result, policyB).length).toBeGreaterThan(0);
            expect(violations(result).every((r): boolean => r.policies?.length === 1 && r.policies[0] === policyB.value)).toBe(true);
        });

        it('only reports the plain ODRL policy that uses a term of the profile of the other policy.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...constraintQuads(ruleA, leftOperandA, operatorA),
                ...policyQuads(policyB),
                ...permissionQuads(ruleB, ODRL.terms.read, policyB),
                ...constraintQuads(ruleB, leftOperandA, ODRL.terms.eq),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA)).toEqual([]);
            expect(violationsOf(result, policyB).length).toBeGreaterThan(0);
        });

        it('reports both policies when they use the terms of each other.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionB, policyA),
                ...policyQuads(policyB, [ profileB ]),
                ...permissionQuads(ruleB, actionA, policyB),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA).some((r): boolean => r.valueNode === actionB.value)).toBe(true);
            expect(violationsOf(result, policyB).some((r): boolean => r.valueNode === actionA.value)).toBe(true);
        });

        it('validates a rule shared by two policies under the profile of each policy.', async (): Promise<void> => {
            const shared = namedNode(EX + 'sharedRule');
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...policyQuads(policyB),
                // One rule with the action of profile A, part of both policies
                ...permissionQuads(shared, actionA, policyA),
                quad(policyB, ODRL.terms.permission, shared),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA)).toEqual([]);
            expect(violationsOf(result, policyB).length).toBeGreaterThan(0);
        });

        it('reports a violation of a rule shared by two policies once, for both policies.', async (): Promise<void> => {
            const shared = namedNode(EX + 'sharedRule');
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...policyQuads(policyB, [ profileB ]),
                // A rule without an action: invalid whatever the profile
                quad(policyA, ODRL.terms.permission, shared),
                quad(policyB, ODRL.terms.permission, shared),
                quad(shared, ODRL.terms.target, asset),
                quad(asset, RDF.terms.type, ODRL.terms.Asset),
            ]);
            expect(result.valid).toBe(false);
            const missingAction = violations(result).filter((r): boolean => r.message === 'A Rule must have one action.');
            expect(missingAction.length).toBeGreaterThan(0);
            for (const violation of violations(result)) {
                expect(violation.policies).toEqual([ policyA.value, policyB.value ]);
            }
            // Every result is reported once, not once per policy
            const keys = result.validationResults.map((r): string => JSON.stringify([ r.focusNode, r.valueNode, r.message, r.severity ]));
            expect(new Set(keys).size).toBe(keys.length);
        });

        it('reports a warning about a party shared by two policies once, for both policies.', async (): Promise<void> => {
            const bob = namedNode(EX + 'Bob');
            // A permission of which the assigner is not typed as a party
            const withAssigner = (rule: NamedNode, action: NamedNode, policy: NamedNode): Quad[] => [
                ...permissionQuads(rule, action, policy),
                quad(rule, ODRL.terms.assigner, bob),
            ];
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...withAssigner(ruleA, actionA, policyA),
                ...policyQuads(policyB, [ profileB ]),
                ...withAssigner(ruleB, actionB, policyB),
            ]);
            expect(result.valid).toBe(true);
            // One warning per rule: each rule belongs to one policy
            const warnings = result.validationResults.filter((r): boolean => r.valueNode === bob.value);
            expect(warnings.map((r): unknown => [ r.focusNode, r.policies ])).toEqual([
                [ ruleA.value, [ policyA.value ] ],
                [ ruleB.value, [ policyB.value ] ],
            ]);
        });

        it('does not validate a policy under the profile of a policy that inherits from it.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                quad(policyA, ODRL.terms.inheritFrom, policyB),
                // The parent uses its own profile, which the child does not declare
                ...policyQuads(policyB, [ profileB ]),
                ...permissionQuads(ruleB, actionB, policyB),
            ]);
            expect(result.validationResults).toEqual([]);
            expect(result.valid).toBe(true);
        });

        it('fails when a policy inherits from something that is not a policy.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                quad(policyA, ODRL.terms.inheritFrom, asset),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA).some((r): boolean => r.valueNode === asset.value)).toBe(true);
        });

        it('does not validate a parent policy with the profile of the policy that inherits from it.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                quad(policyA, ODRL.terms.inheritFrom, policyB),
                // The parent declares no profile, but uses the action of the profile of the child
                ...policyQuads(policyB),
                ...permissionQuads(ruleB, actionA, policyB),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA)).toEqual([]);
            expect(violationsOf(result, policyB).length).toBeGreaterThan(0);
        });

        it('still reports plain ODRL violations for the policy they belong to.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...policyQuads(policyB, [ profileB ]),
                // A rule without an action
                quad(policyB, ODRL.terms.permission, ruleB),
                quad(ruleB, ODRL.terms.target, asset),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA)).toEqual([]);
            expect(violationsOf(result, policyB).length).toBeGreaterThan(0);
        });
    });

    describe('for quads that no policy reaches', (): void => {
        // A permission that is not part of a policy
        const looseRuleQuads = (action: NamedNode): Quad[] =>
            permissionQuads(ruleB, action, policyB).filter((q): boolean => !q.subject.equals(policyB));

        it('validates them with the shapes of plain ODRL.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...looseRuleQuads(ODRL.terms.read),
            ]);
            expect(result.validationResults).toEqual([]);
            expect(result.valid).toBe(true);
        });

        it('fails when they use a term of a supported profile.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...looseRuleQuads(actionA),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA)).toEqual([]);
            expect(violations(result).every((r): boolean => r.policies === undefined)).toBe(true);
        });

        it('validates a node of a policy as plain ODRL when a quad outside of the policy points to it.', async (): Promise<void> => {
            // Known limitation: the rule is valid in its policy, but is also pulled in by the loose quad
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                quad(namedNode(EX + 'catalogEntry'), namedNode('http://purl.org/dc/terms/relation'), ruleA),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA)).toEqual([]);
        });

        it('fails when a loose rule uses a constraint of a policy that has a term of the profile of that policy.', async (): Promise<void> => {
            const constraint = namedNode(ruleA.value + '-constraint');
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                ...constraintQuads(ruleA, leftOperandA, operatorA),
                // The loose rule shares the constraint: valid in the policy, not for a rule without a profile
                ...looseRuleQuads(ODRL.terms.read),
                quad(ruleB, ODRL.terms.constraint, constraint),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA)).toEqual([]);
            expect(violations(result).every((r): boolean => r.policies === undefined)).toBe(true);
            expect(violations(result).some((r): boolean => r.valueNode === leftOperandA.value)).toBe(true);
        });

        it('fails when they are invalid plain ODRL.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
                // A permission without an action or a target
                quad(ruleB, RDF.terms.type, ODRL.terms.Permission),
            ]);
            expect(result.valid).toBe(false);
            expect(violations(result).every((r): boolean => r.focusNode === ruleB.value && r.policies === undefined)).toBe(true);
        });
    });

    describe('for profiles the validator does not support', (): void => {
        const unknown: ODRLProfile = { uri: EX + 'unknownProfile#', quads: [] };
        const unknownAction = namedNode(unknown.uri + 'Act');

        it('warns, and stays valid when the policy only uses ODRL terms.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ unknown ]),
                ...permissionQuads(ruleA, ODRL.terms.read, policyA),
            ]);
            expect(result.valid).toBe(true);
            expect(result.validationResults).toEqual([ expect.objectContaining({
                severity: WARNING,
                policies: [ policyA.value ],
                message: expect.stringContaining(unknown.uri),
            }) ]);
        });

        it('fails when the policy uses a term of that profile.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ unknown ]),
                ...permissionQuads(ruleA, unknownAction, policyA),
            ]);
            expect(result.valid).toBe(false);
            expect(result.validationResults.some((r): boolean => r.severity === WARNING)).toBe(true);
        });

        it('still accepts the terms of the supported profile the policy also declares.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ profileA, unknown ]),
                ...permissionQuads(ruleA, actionA, policyA),
            ]);
            expect(result.valid).toBe(true);
        });

        it('does not accept the terms of a supported profile the policy does not declare.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ unknown ]),
                ...permissionQuads(ruleA, actionA, policyA),
            ]);
            expect(result.valid).toBe(false);
        });

        it('finds a policy with an unknown policy class and reports the class.', async (): Promise<void> => {
            const result = await validator.validate([
                ...policyQuads(policyA, [ unknown ], namedNode(unknown.uri + 'MyPolicy')),
                ...permissionQuads(ruleA, ODRL.terms.read, policyA),
            ]);
            expect(result.valid).toBe(false);
            expect(result.validationResults.some((r): boolean => r.message === 'No valid policy provided')).toBe(false);
            expect(violationsOf(result, policyA).length).toBeGreaterThan(0);
        });
    });

    describe('for validator instances', (): void => {
        it('gives the same results when the same validator is used several times.', async (): Promise<void> => {
            const valid = [
                ...policyQuads(policyA, [ profileA ]),
                ...permissionQuads(ruleA, actionA, policyA),
            ];
            const invalid = [
                ...policyQuads(policyB, [ profileB ]),
                ...permissionQuads(ruleB, actionA, policyB),
            ];
            expect((await validator.validate(valid)).valid).toBe(true);
            expect((await validator.validate(invalid)).valid).toBe(false);
            expect((await validator.validate(valid)).valid).toBe(true);
            expect((await validator.validate(invalid)).valid).toBe(false);
        });

        it('does not share profiles with other validators.', async (): Promise<void> => {
            const policy = [
                ...policyQuads(policyA, [ profileA ], policyTypeA),
                ...permissionQuads(ruleA, actionA, policyA),
            ];
            expect((await validator.validate(policy)).valid).toBe(true);
            // Created after a validator with profiles: knows neither the action nor the policy class
            expect((await new ODRLValidator().validate(policy)).valid).toBe(false);
            expect((await new ODRLValidator({ profiles: [ profileB ] }).validate(policy)).valid).toBe(false);
        });
    });

    describe('for the bundled TOSL and DPV profiles', (): void => {
        const TOSL = 'https://w3id.org/tosl/';
        const DPV_ODRL = 'https://w3id.org/dpv/mappings/odrl#';
        const tosl: ODRLProfile = { uri: TOSL, quads: new Parser().parse(TOSL_PROFILE) };
        const dpv: ODRLProfile = { uri: DPV_ODRL, quads: new Parser().parse(DPV_ODRL_PROFILE) };
        const toslRemove = namedNode(TOSL + 'remove');
        const dpvUse = namedNode(DPV_ODRL + 'Use');
        const bundled = new ODRLValidator({ profiles: [ tosl, dpv ] });

        it('validates a TOSL policy and a DPV policy in one input.', async (): Promise<void> => {
            const result = await bundled.validate([
                ...policyQuads(policyA, [ tosl ]),
                ...permissionQuads(ruleA, toslRemove, policyA),
                ...policyQuads(policyB, [ dpv ]),
                ...permissionQuads(ruleB, dpvUse, policyB),
            ]);
            expect(result.valid).toBe(true);
        });

        it('fails when a TOSL policy uses a DPV action.', async (): Promise<void> => {
            const result = await bundled.validate([
                ...policyQuads(policyA, [ tosl ]),
                ...permissionQuads(ruleA, dpvUse, policyA),
                ...policyQuads(policyB, [ dpv ]),
                ...permissionQuads(ruleB, dpvUse, policyB),
            ]);
            expect(result.valid).toBe(false);
            expect(violationsOf(result, policyA).length).toBeGreaterThan(0);
            expect(violationsOf(result, policyB)).toEqual([]);
        });

        it('fails when a plain ODRL policy uses a TOSL action.', async (): Promise<void> => {
            const result = await bundled.validate([
                ...policyQuads(policyA),
                ...permissionQuads(ruleA, toslRemove, policyA),
            ]);
            expect(result.valid).toBe(false);
        });

        it('validates a policy that declares both profiles and uses actions of both.', async (): Promise<void> => {
            const result = await bundled.validate([
                ...policyQuads(policyA, [ tosl, dpv ]),
                ...permissionQuads(ruleA, toslRemove, policyA),
                ...permissionQuads(ruleB, dpvUse, policyA),
            ]);
            expect(result.valid).toBe(true);
        });
    });
});