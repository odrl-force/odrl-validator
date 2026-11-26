import { NamedNode, Quad, Term } from "@rdfjs/types";
import { Quad_Subject, Store } from "n3";
import { Atomizer, ODRL, RDF } from "odrl-atomization";

/**
 * ODRL Normalization is the process of applying a series of transformations to produce an irreducible standard form of an ODRL Policy.
 * There are several reasons why a standard form is desirable:
 * It simplifies policy structure validation and makes the evaluation process easier as well.
 * 
 * See following wiki for more information regarding normalization of ODRL policies: https://www.w3.org/2016/poe/wiki/Validation
 */
export interface INormalizer {
    normalise(quads: Quad[]): Promise<Quad[]>
}

export class Normalizer implements INormalizer {

    async normalise(quads: Quad[]): Promise<Quad[]> {
        // Order according to https://www.w3.org/2016/poe/wiki/Validation#N1._Internalization_of_parties_and_assets_declared_out_of_the_policy
        // N1, N2, N3, N10, N4, N6, N7, N8, N9, N5

        // N1. Internalization of parties and assets declared out of the policy
        const internalizedPolicies = internalization(quads);

        // N2. Type declaration of policy elements
        // Infer the class of ODRL Rules based on its relation.
        // This is currently done for the following test cases of the ODRL Validator: 38, 39, 40, 45, 70, 71.
        // Note that 45 is still (rightfully) false. An agreement must have an assigner
        const typedPolicies = inferPolicyElementTypes(internalizedPolicies)

        // N3. Application of inheritance rules
        const inferredPolicies = inheritPolicies(typedPolicies)

        // N4. Interiorizing policy-level properties (dealing with compact policies)
        // N5. Expansion from compound to irreducible rules (dealing with composite rules)
        let atomizedODRLPolicies: Quad[];
        try {
            atomizedODRLPolicies = await new Atomizer().atomize(inferredPolicies)
        } catch (error) {
            console.error("Error atomizing policies:", error);
            atomizedODRLPolicies = inferredPolicies
        }
        return atomizedODRLPolicies
    }

}

/**
 * Infers Core ODRL Rule types, constraints and logicalConstraint
 */
export function inferPolicyElementTypes(quads: Quad[]):Quad[] {
    return inferConstraints(inferRules(inferPolicy(quads)));
}

/**
 * Infers the Policy class for the subject of properties that only a Policy can have.
 */
export function inferPolicy(quads:Quad[]):Quad[] {
    const store = new Store(quads)

    const policyRelations: NamedNode[] = [
        ODRL.terms.permission,
        ODRL.terms.prohibition,
        ODRL.terms.obligation,
        ODRL.terms.profile,
        ODRL.terms.inheritFrom,
    ];

    for (const relation of policyRelations) {
        for (const policy of store.getQuads(null, relation, null, null)) {
            store.addQuad(policy.subject as Quad_Subject, RDF.terms.type, ODRL.terms.Policy);
        }
    }
    return store.getQuads(null, null, null, null);
}

export function inferConstraints(quads: Quad[]):Quad[]  {
    const store = new Store(quads)

    const constraintRelations: [NamedNode, NamedNode][] = [
        [ODRL.terms.leftOperand, ODRL.terms.Constraint],
        [ODRL.terms.rightOperand, ODRL.terms.Constraint],
        [ODRL.terms.operator, ODRL.terms.Constraint],
        [ODRL.terms.operand, ODRL.terms.LogicalConstraint],
    ];

    for (const [relation, constraintClass] of constraintRelations) {
        for (const constraint of store.getQuads(null, relation, null, null)) {
            store.addQuad(constraint.subject as Quad_Subject, RDF.terms.type, constraintClass);
        }
    }
    return store.getQuads(null, null, null, null);
}
/**
 * Infers the class of ODRL Rules based on its relation.
 */
export function inferRules(quads: Quad[]):Quad[]  {
    const store = new Store(quads)

    // Each relation linking to a rule, mapped to the class that rule must have.
    const ruleRelations: [NamedNode, NamedNode][] = [
        [ODRL.terms.permission, ODRL.terms.Permission],
        [ODRL.terms.prohibition, ODRL.terms.Prohibition],
        [ODRL.terms.obligation, ODRL.terms.Duty],
        [ODRL.terms.duty, ODRL.terms.Duty],
        [ODRL.terms.consequence, ODRL.terms.Duty],
        [ODRL.terms.remedy, ODRL.terms.Duty],
    ];

    for (const [relation, ruleClass] of ruleRelations) {
        for (const rule of store.getQuads(null, relation, null, null)) {
            store.addQuad(rule.object as Quad_Subject, RDF.terms.type, ruleClass);
        }
    }

    return store.getQuads(null, null, null, null);
}

/**
 * Internalization of parties and assets declared out of the policy.
 * Deals with `assignerOf`, `hasPolicy` and `assigneeOf`.
 */
export function internalization(quads: Quad[]):Quad[]  {
    const store = new Store(quads)

    const assignees = store.getQuads(null, ODRL.terms.assigneeOf, null, null);
    for (const assignee of assignees) {
        store.removeQuad(assignee);
        store.addQuad(assignee.object as Quad_Subject, ODRL.terms.assignee, assignee.subject);
    }

    const assigners = store.getQuads(null, ODRL.terms.assignerOf, null, null);
    for (const assigner of assigners) {
        store.removeQuad(assigner);
        store.addQuad(assigner.object as Quad_Subject, ODRL.terms.assigner, assigner.subject);
    }

    const targets = store.getQuads(null, ODRL.terms.hasPolicy, null, null);
    for (const target of targets) {
        store.removeQuad(target);
        store.addQuad(target.object as Quad_Subject, ODRL.terms.target, target.subject);
    }

    return store.getQuads(null, null, null, null);
}


/**
 * Application of inheritance rules (`odrl:inheritFrom`).
 * A child policy receives the policy-level properties of all its (direct and indirect) parents,
 * after which all `odrl:inheritFrom` triples are removed.
 *
 * Throws when a policy inherits from a policy that is not part of the input (external policies are not supported)
 * or when a policy inherits directly or indirectly from itself.
 * Conflicting `odrl:conflict` values between parent and child are left to the SHACL validation.
 */
export function inheritPolicies(quads: Quad[]): Quad[] {
    const store = new Store(quads);

    const inheritableProperties: NamedNode[] = [
        ODRL.terms.permission,
        ODRL.terms.prohibition,
        ODRL.terms.obligation,
        ODRL.terms.profile,
        ODRL.terms.conflict,
        ODRL.terms.assignee,
        ODRL.terms.assigner,
        ODRL.terms.target,
    ];

    const inheritQuads = store.getQuads(null, ODRL.terms.inheritFrom, null, null);

    // Map each child policy to its parent policies.
    const parentsOf = new Map<string, { child: Term, parents: Term[] }>();
    for (const { subject, object } of inheritQuads) {
        if (store.countQuads(object, null, null, null) === 0) {
            throw new Error(`Policy <${subject.value}> inherits from <${object.value}>, which is not defined in the input. Inheriting from external policies is not supported.`);
        }
        const entry = parentsOf.get(subject.value) ?? { child: subject, parents: [] as Term[] };
        entry.parents.push(object);
        parentsOf.set(subject.value, entry);
    }

    // Depth-first search to detect cycles. The post-order lists parents before their children.
    const VISITING = 1, DONE = 2;
    const state = new Map<string, number>();
    const order: { child: Term, parents: Term[] }[] = [];
    const visit = (policy: Term): void => {
        const current = state.get(policy.value);
        if (current === VISITING) {
            throw new Error("V24. No policy can inherit directly or indirectly from itself");
        }
        if (current === DONE) return;
        state.set(policy.value, VISITING);
        const entry = parentsOf.get(policy.value);
        for (const parent of entry?.parents ?? []) {
            visit(parent);
        }
        state.set(policy.value, DONE);
        if (entry) order.push(entry);
    };
    for (const { child } of parentsOf.values()) {
        visit(child);
    }

    // Parents are resolved before their children, so indirect inheritance follows automatically.
    for (const { child, parents } of order) {
        for (const parent of parents) {
            for (const property of inheritableProperties) {
                for (const { object } of store.getQuads(parent, property, null, null)) {
                    store.addQuad(child as Quad_Subject, property, object);
                }
            }
        }
    }

    store.removeQuads(inheritQuads);
    return store.getQuads(null, null, null, null);
}
// The correct order for the transformations would be N1, N2, N3, N10, N4, N6, N7, N8, N9, N5. Pending to be renamed after after no references are found. 

// things we won't do right now
// N6. Inferences derived from odrl:includedIn (useful reasoning for evaluation) -> done in the ODRL Evaluator
// N7. Inferences derived from odrl:implies (useful reasoning for evaluation)
// N8. Inferences derived from odrl:partOf for Asset Collection (useful reasoning for evaluation) -> done in the ODRL Evaluator
// N9. Inferences derived from odrl:partOf for Party Collection (useful reasoning for evaluation) -> done in the ODRL Evaluator
// N10. Policy Replacement (`α odrl:isReplacedBy β`)
