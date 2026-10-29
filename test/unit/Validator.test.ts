import type { NamedNode, Quad } from '@rdfjs/types';
import { ODRLProfile } from "../../src/Types";
import { DataFactory } from 'n3';
import { ODRL, RDF, RDFS, XSD } from '../../src/util/Vocabulary';
import { ODRLValidator } from '../../src/Validator';
const {quad, namedNode, blankNode, literal} = DataFactory;

describe('The ODRL Validator', (): void => {
    let policyQuads :Quad[]
    let policyIRI: string;
    let rule1IRI : string;

    beforeEach(() => { 
        policyIRI = "https://example.org/Policy"
        rule1IRI = "https://example.org/rule1"
        policyQuads = [
                quad(namedNode(policyIRI), RDF.terms.type, ODRL.terms.Set),
                quad(namedNode(policyIRI), ODRL.terms.permission, namedNode(rule1IRI)),
                quad(namedNode(rule1IRI), RDF.terms.type, ODRL.terms.Permission),
                quad(namedNode(rule1IRI), ODRL.terms.action, ODRL.terms.read),
                quad(namedNode(rule1IRI), ODRL.terms.assignee, namedNode("https://example.org/Alice")),
                quad(namedNode(rule1IRI), ODRL.terms.target, namedNode("https://example.org/x")),
                
            ]
    })

    describe('for profiles', (): void => {
        let profileQuads: Quad[];
        let profile: ODRLProfile ;
        let profileURI: string;
        let profileAction: NamedNode
        let profileLeftOperand: NamedNode;
        let profileOperator: NamedNode;
        let profileConflictTerm: NamedNode;
        let profilePolicy: NamedNode;
        let profileRule: NamedNode;
        let profileLogicalOp: NamedNode;
        // The policy declares that it uses the profile
        let profileDeclaration: Quad;
        const newRuleNode = namedNode("https://example.org/ruleprofile")
 
        // A permission of the policy with an action, an assignee and a target. 
        // `extra` can add more about the rule, e.g. a constraint.
        const permissionQuads = (action: NamedNode, extra: Quad[] = []): Quad[] => [
            quad(namedNode(policyIRI), ODRL.terms.permission, newRuleNode),
            quad(newRuleNode, RDF.terms.type, ODRL.terms.Permission),
            quad(newRuleNode, ODRL.terms.action, action),
            quad(newRuleNode, ODRL.terms.assignee, namedNode("https://example.org/Alice")),
            quad(newRuleNode, ODRL.terms.target, namedNode("https://example.org/x")),
            ...extra,
        ];
 
        // A constraint on newRuleNode
        const constraintNode = namedNode("https://example.org/constraintprofile")
        const constraintQuads = (leftOperand: NamedNode, operator: NamedNode): Quad[] => [
            quad(newRuleNode, ODRL.terms.constraint, constraintNode),
            quad(constraintNode, RDF.terms.type, ODRL.terms.Constraint),
            quad(constraintNode, ODRL.terms.leftOperand, leftOperand),
            quad(constraintNode, ODRL.terms.operator, operator),
            quad(constraintNode, ODRL.terms.rightOperand, literal("5", XSD.terms.integer)),
        ];


        beforeEach(() => {
            profileURI = "https://example.org/profile#"
 
            profileAction = namedNode(profileURI + "Act" );
            profileLeftOperand = namedNode(profileURI + "Left");
            profileOperator = namedNode(profileURI + "Op");
            profileConflictTerm = namedNode(profileURI + "Conf");
            profilePolicy = namedNode(profileURI + "MyPolicy");
            profileRule = namedNode(profileURI + "MyRule");
            profileLogicalOp = namedNode(profileURI + "myLogicalOp");
            profileQuads = [
                quad(profileAction, RDF.terms.type, ODRL.terms.Action),
                quad(profileLeftOperand, RDF.terms.type, ODRL.terms.LeftOperand),
                quad(profileOperator, RDF.terms.type, ODRL.terms.Operator),
                quad(profileConflictTerm, RDF.terms.type, ODRL.terms.ConflictTerm),
                quad(profilePolicy, RDFS.terms.subClassOf, ODRL.terms.Policy),
                quad(profileRule, RDFS.terms.subClassOf, ODRL.terms.Rule),
                quad(profileLogicalOp, RDFS.terms.subPropertyOf, ODRL.terms.operand),
            ]
            profile = {
                uri: profileURI,
                quads: profileQuads
            }
            profileDeclaration = quad(namedNode(policyIRI), ODRL.terms.profile, namedNode(profile.uri))
        })


        it("successfully creates the constructor for profiles.", async ()=> {
            new ODRLValidator({profiles:[profile]});
            new ODRLValidator();
        })

        describe('with an action', (): void => {
            it("validates policies that use a profile action.", async ()=> {
                const validator = new ODRLValidator({profiles:[profile]});
                policyQuads.push(
                    profileDeclaration,
                    ...permissionQuads(profileAction),
                )
                const result = await validator.validate(policyQuads);
                expect(result.valid).toBe(true);
                // A profile present, but the profile not loaded in the validator must also throw a violation
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
 
            it("fails when a profile action is part of a rule without a profile", async ()=> {
                policyQuads.push(
                    ...permissionQuads(profileAction),
                )
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
        })
        describe('with a left operand', (): void => {
            it("validates policies that use a profile left operand.", async ()=> {
                const validator = new ODRLValidator({profiles:[profile]});
                policyQuads.push(
                    profileDeclaration,
                    ...permissionQuads(ODRL.terms.read, constraintQuads(profileLeftOperand, ODRL.terms.eq)),
                )
                const result = await validator.validate(policyQuads);
                expect(result.valid).toBe(true);
                // A profile present, but the profile not loaded in the validator must also throw a violation
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
 
            it("fails when a profile left operand is part of a rule without a profile", async ()=> {
                policyQuads.push(
                    ...permissionQuads(ODRL.terms.read, constraintQuads(profileLeftOperand, ODRL.terms.eq)),
                )
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
        })
 
        describe('with an operator', (): void => {
            it("validates policies that use a profile operator.", async ()=> {
                const validator = new ODRLValidator({profiles:[profile]});
                policyQuads.push(
                    profileDeclaration,
                    ...permissionQuads(ODRL.terms.read, constraintQuads(ODRL.terms.count, profileOperator)),
                )
                const result = await validator.validate(policyQuads);
                expect(result.valid).toBe(true);
                // A profile present, but the profile not loaded in the validator must also throw a violation
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
 
            it("fails when a profile operator is part of a rule without a profile", async ()=> {
                policyQuads.push(
                    ...permissionQuads(ODRL.terms.read, constraintQuads(ODRL.terms.count, profileOperator)),
                )
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
        })
 
        describe('with a conflict term', (): void => {
            it("validates policies that use a profile conflict term.", async ()=> {
                const validator = new ODRLValidator({profiles:[profile]});
                policyQuads.push(
                    profileDeclaration,
                    quad(namedNode(policyIRI), ODRL.terms.conflict, profileConflictTerm),
                )
                const result = await validator.validate(policyQuads);
                expect(result.valid).toBe(true);
                // A profile present, but the profile not loaded in the validator must also throw a violation
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
 
            it("fails when a profile conflict term is part of a policy without a profile", async ()=> {
                policyQuads.push(
                    quad(namedNode(policyIRI), ODRL.terms.conflict, profileConflictTerm),
                )
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
        })
 
        describe('with a policy subclass', (): void => {
            const profilePolicyIRI = namedNode("https://example.org/ProfilePolicy")
            // A policy of the subclass with one valid permission
            const profilePolicyQuads = (declareProfile: boolean): Quad[] => [
                quad(profilePolicyIRI, RDF.terms.type, profilePolicy),
                ...(declareProfile ? [ quad(profilePolicyIRI, ODRL.terms.profile, namedNode(profile.uri)) ] : []),
                quad(profilePolicyIRI, ODRL.terms.permission, newRuleNode),
                quad(newRuleNode, RDF.terms.type, ODRL.terms.Permission),
                quad(newRuleNode, ODRL.terms.action, ODRL.terms.read),
                quad(newRuleNode, ODRL.terms.assignee, namedNode("https://example.org/Alice")),
                quad(newRuleNode, ODRL.terms.target, namedNode("https://example.org/x")),
            ];
 
            it("validates policies that use a profile policy subclass.", async ()=> {
                const validator = new ODRLValidator({profiles:[profile]});
                policyQuads.push(...profilePolicyQuads(true))
                const result = await validator.validate(policyQuads);
                expect(result.valid).toBe(true);
                // A profile present, but the profile not loaded in the validator must also throw a violation
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
 
            it("fails when a profile policy subclass is used without a profile", async ()=> {
                policyQuads.push(...profilePolicyQuads(false))
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
 
            it("validates instances of a profile policy subclass like policies.", async ()=> {
                const validator = new ODRLValidator({profiles:[profile]});
                // This policy is invalid: it has no permission, prohibition or obligation.
                // Only a validator that knows the profile has a PolicyShape that targets the subclass.
                policyQuads.push(
                    quad(profilePolicyIRI, RDF.terms.type, profilePolicy),
                    quad(profilePolicyIRI, ODRL.terms.profile, namedNode(profile.uri)),
                )
                expect((await validator.validate(policyQuads)).valid).toBe(false);
            })
        })
 
        describe('with a rule subclass', (): void => {
            // A rule of the subclass with an action, an assignee and a target
            const profileRuleQuads = (): Quad[] => [
                quad(namedNode(policyIRI), ODRL.terms.permission, newRuleNode),
                quad(newRuleNode, RDF.terms.type, profileRule),
                quad(newRuleNode, ODRL.terms.action, ODRL.terms.read),
                quad(newRuleNode, ODRL.terms.assignee, namedNode("https://example.org/Alice")),
                quad(newRuleNode, ODRL.terms.target, namedNode("https://example.org/x")),
            ];
 
            it("validates policies that use a profile rule subclass.", async ()=> {
                const validator = new ODRLValidator({profiles:[profile]});
                policyQuads.push(
                    profileDeclaration,
                    ...profileRuleQuads(),
                )
                const result = await validator.validate(policyQuads);
                expect(result.valid).toBe(true);
                // A profile present, but the profile not loaded in the validator must also throw a violation
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
 
            it("fails when a profile rule subclass is used without a profile", async ()=> {
                policyQuads.push(...profileRuleQuads())
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
 
            it("validates instances of a profile rule subclass like rules.", async ()=> {
                const validator = new ODRLValidator({profiles:[profile]});
                // This rule is invalid: it has no action and no target.
                // Only a validator that knows the profile has a RuleShape that targets the subclass.
                policyQuads.push(
                    profileDeclaration,
                    quad(newRuleNode, RDF.terms.type, profileRule),
                )
                expect((await validator.validate(policyQuads)).valid).toBe(false);
            })
        })
 
        describe('with a subproperty of odrl:operand', (): void => {
            // A logical constraint on newRuleNode: ex:myLogicalOp ( constraint1 constraint2 )
            const logicalConstraintQuads = (): Quad[] => {
                const logicalConstraint = namedNode("https://example.org/logicalconstraint")
                const constraint1 = namedNode("https://example.org/constraint1")
                const constraint2 = namedNode("https://example.org/constraint2")
                const list1 = blankNode()
                const list2 = blankNode()
                return [
                    quad(newRuleNode, ODRL.terms.constraint, logicalConstraint),
                    quad(logicalConstraint, profileLogicalOp, list1),
                    quad(list1, RDF.terms.first, constraint1),
                    quad(list1, RDF.terms.rest, list2),
                    quad(list2, RDF.terms.first, constraint2),
                    quad(list2, RDF.terms.rest, RDF.terms.nil),
 
                    quad(constraint1, ODRL.terms.leftOperand, ODRL.terms.count),
                    quad(constraint1, ODRL.terms.operator, ODRL.terms.lt),
                    quad(constraint1, ODRL.terms.rightOperand, literal("5", XSD.terms.integer)),
                    quad(constraint2, ODRL.terms.leftOperand, ODRL.terms.count),
                    quad(constraint2, ODRL.terms.operator, ODRL.terms.gt),
                    quad(constraint2, ODRL.terms.rightOperand, literal("1", XSD.terms.integer)),
                ];
            }
 
            it("validates policies that use a profile subproperty of odrl:operand.", async ()=> {
                const validator = new ODRLValidator({profiles:[profile]});
                policyQuads.push(
                    profileDeclaration,
                    ...permissionQuads(ODRL.terms.read, logicalConstraintQuads()),
                )
                const result = await validator.validate(policyQuads);
                expect(result.valid).toBe(true);
                // A profile present, but the profile not loaded in the validator must also throw a violation
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
 
            it("fails when a profile subproperty of odrl:operand is part of a rule without a profile", async ()=> {
                policyQuads.push(
                    ...permissionQuads(ODRL.terms.read, logicalConstraintQuads()),
                )
                expect((await new ODRLValidator().validate(policyQuads)).valid).toBe(false);
            })
        })
    })
})
