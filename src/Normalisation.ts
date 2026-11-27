import { NamedNode, Quad, Term } from "@rdfjs/types";
import { Quad_Subject, Store } from "n3";
import { Atomizer, ODRL, RDF } from "odrl-atomization";
import { DCT } from "./util/Vocabulary";

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

        // N10. Policy replacement
        const replacedPolicies = replacePolicies(inferredPolicies)

        // N4. Interiorizing policy-level properties (dealing with compact policies)
        // N5. Expansion from compound to irreducible rules (dealing with composite rules)
        let atomizedODRLPolicies: Quad[];
        try {
            atomizedODRLPolicies = await new Atomizer().atomize(replacedPolicies)
        } catch (error) {
            console.error("Error atomizing policies:", error);
            atomizedODRLPolicies = replacedPolicies
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
    const parentsOf: DependencyGraph = new Map();
    for (const { subject, object } of inheritQuads) {
        if (store.countQuads(object, null, null, null) === 0) {
            throw new Error(`Policy <${subject.value}> inherits from <${object.value}>, which is not defined in the input. Inheriting from external policies is not supported.`);
        }
        const entry = parentsOf.get(subject.value) ?? { node: subject, dependsOn: [] as Term[] };
        entry.dependsOn.push(object);
        parentsOf.set(subject.value, entry);
    }

    // Parents are resolved before their children, so indirect inheritance follows automatically.
    const order = orderByDependencies(parentsOf, "V24. No policy can inherit directly or indirectly from itself");
    for (const { node: child, dependsOn: parents } of order) {
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

/**
 * Policy replacement (`α dct:isReplacedBy β`).
 * All properties of the replaced policy α are removed and substituted by the properties of β
 * (except `dct:isReplacedBy` and `odrl:uid`). The replacing policy β is kept as is.
 * Chains (α → β → γ) are resolved, so α ends up with the properties of γ.
 *
 * Throws when a policy is replaced by a policy that is not part of the input (external policies are not supported),
 * when a policy is replaced by more than one policy,
 * or when a policy is replaced directly or indirectly by itself.
 */
export function replacePolicies(quads: Quad[]): Quad[] {
    const store = new Store(quads);

    // Map each replaced policy to the policy replacing it.
    const replacementOf: DependencyGraph = new Map();
    for (const { subject, object } of store.getQuads(null, DCT.terms.isReplacedBy, null, null)) {
        if (store.countQuads(object, null, null, null) === 0) {
            throw new Error(`Policy <${subject.value}> is replaced by <${object.value}>, which is not defined in the input. Replacing by external policies is not supported.`);
        }
        const existing = replacementOf.get(subject.value);
        if (existing) {
            throw new Error(`Policy <${subject.value}> is replaced by more than one policy: <${existing.dependsOn[0].value}> and <${object.value}>.`);
        }
        replacementOf.set(subject.value, { node: subject, dependsOn: [object] });
    }

    const excludedProperties = [DCT.terms.isReplacedBy, ODRL.terms.uid];

    // Replacing policies are resolved before the policies they replace, so chains follow automatically.
    const order = orderByDependencies(replacementOf, "No policy can be replaced directly or indirectly by itself");
    for (const { node: replaced, dependsOn: [replacement] } of order) {
        store.removeQuads(store.getQuads(replaced, null, null, null));
        for (const { predicate, object } of store.getQuads(replacement, null, null, null)) {
            if (excludedProperties.some(property => property.equals(predicate))) continue;
            store.addQuad(replaced as Quad_Subject, predicate, object);
        }
    }

    return store.getQuads(null, null, null, null);
}

/**
 * A dependency graph: each node (keyed by its value) with the nodes it depends on.
 */
export type DependencyGraph = Map<string, { node: Term, dependsOn: Term[] }>;

/**
 * Orders the nodes of a dependency graph so every node comes after the nodes it depends on.
 * Only nodes that are a key of the graph are part of the result.
 * Throws an Error with `errorMessage` when the graph is cyclic
 * (a node depends directly or indirectly on itself).
 *
 * E.g. for `p1 → p2`, `p2 → p3` the order is `[p2, p1]`: p2 must first be resolved with p3
 * before p1 can be resolved with the (already resolved) p2.
 */
export function orderByDependencies(
    dependencies: DependencyGraph,
    errorMessage: string
): { node: Term, dependsOn: Term[] }[] {
    // Depth-first search; the post-order lists dependencies before their dependants.
    const VISITING = 1, DONE = 2;
    const state = new Map<string, number>();
    const order: { node: Term, dependsOn: Term[] }[] = [];
    const visit = (node: Term): void => {
        const current = state.get(node.value);
        if (current === VISITING) {
            throw new Error(errorMessage);
        }
        if (current === DONE) return;
        state.set(node.value, VISITING);
        const entry = dependencies.get(node.value);
        for (const dependency of entry?.dependsOn ?? []) {
            visit(dependency);
        }
        state.set(node.value, DONE);
        if (entry) order.push(entry);
    };
    for (const { node } of dependencies.values()) {
        visit(node);
    }
    return order;
}
// The correct order for the transformations would be N1, N2, N3, N10, N4, N6, N7, N8, N9, N5. Pending to be renamed after after no references are found. 

// things we won't do right now
// N6. Inferences derived from odrl:includedIn (useful reasoning for evaluation) -> done in the ODRL Evaluator
// N7. Inferences derived from odrl:implies (useful reasoning for evaluation)
// N8. Inferences derived from odrl:partOf for Asset Collection (useful reasoning for evaluation) -> done in the ODRL Evaluator
// N9. Inferences derived from odrl:partOf for Party Collection (useful reasoning for evaluation) -> done in the ODRL Evaluator
