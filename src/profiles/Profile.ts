import type { NamedNode, Quad, Term } from '@rdfjs/types';
import { DataFactory, Store } from 'n3';
import { createVocabulary } from 'rdf-vocabulary';
import { ODRL, RDF, RDFS, SH, XSD } from '../util/Vocabulary';
import { appendToList, findInList } from './ListUtil';
const { literal, quad, blankNode, namedNode } = DataFactory;

const SHAPE_NAMESPACE = 'http://example.com/';
/** Namespace of the shapes generated from a profile, kept apart from the handcrafted ones. */
const GENERATED_SHAPE_NAMESPACE = `${SHAPE_NAMESPACE}profile-shape/`;

const SHAPE = createVocabulary(SHAPE_NAMESPACE,
  'AllowedActionValueShape',
  'AllowedConstraintValueShape',
  'ConflictStrategyShape',
  'LogicalConstraintShape',
  'PolicyShape',
  'RuleShape');

/**
 * Describes one `sh:in` list in our SHACL file that holds the allowed ODRL terms of one kind,
 * e.g. the allowed actions, or the allowed left operands.
 */
export interface AllowedValueList {
  /** The ODRL class that profile terms relate to, e.g. `odrl:LeftOperand`. */
  type: NamedNode;
  /** The named shape in our SHACL file that contains the list. */
  shape: NamedNode;
  /**
   * The `sh:path` of the property shape that contains the list.
   * Only needed when the shape contains several lists, e.g. one for `odrl:leftOperand` and one for `odrl:operator`.
   */
  path?: NamedNode;
  /**
   * How profile terms relate to {@link AllowedValueList.type}:
   * `instance` (default) for `ex:term a type`, `subClassOf` for `ex:term rdfs:subClassOf type` (transitively).
   */
  relation?: 'instance' | 'subClassOf';
}

/**
 * All `sh:in` lists of our SHACL file that a profile can extend.
 * This is the single place to register another one.
 *
 * Right operands are absent on purpose: the shapes accept any literal, IRI or `odrl:RightOperand`.
 */
export const ALLOWED_VALUE_LISTS: Record<'action' | 'leftOperand' | 'operator' | 'conflictTerm' | 'policyType', AllowedValueList> = {
  action: {
    type: ODRL.terms.Action,
    shape: SHAPE.terms.AllowedActionValueShape,
  },
  leftOperand: {
    type: ODRL.terms.LeftOperand,
    shape: SHAPE.terms.AllowedConstraintValueShape,
    path: ODRL.terms.leftOperand,
  },
  operator: {
    type: ODRL.terms.Operator,
    shape: SHAPE.terms.AllowedConstraintValueShape,
    path: ODRL.terms.operator,
  },
  conflictTerm: {
    type: ODRL.terms.ConflictTerm,
    shape: SHAPE.terms.ConflictStrategyShape,
    path: ODRL.terms.conflict,
  },
  policyType: {
    type: ODRL.terms.Policy,
    shape: SHAPE.terms.PolicyShape,
    path: RDF.terms.type,
    relation: 'subClassOf',
  },
};

// ---------------------------------------------------------------------------
// Reading the profile
// ---------------------------------------------------------------------------

/** Keeps the named nodes. Blank nodes are dropped, since our shapes cannot reference them. */
function namedNodes(terms: Term[]): NamedNode[] {
  return terms.filter((term): boolean => term.termType === 'NamedNode') as NamedNode[];
}

/** The named subjects in the profile typed with `type`, e.g. `ex:term a odrl:LeftOperand`. */
function instancesOf(profile: Store, type: NamedNode): NamedNode[] {
  return namedNodes(profile.getSubjects(RDF.terms.type, type, null));
}

/**
 * All named subjects below `root` in the profile via `predicate`, transitively,
 * e.g. all subclasses (`rdfs:subClassOf`) or all subproperties (`rdfs:subPropertyOf`).
 * `root` itself is not included.
 */
function descendantsOf(profile: Store, root: Term, predicate: NamedNode): NamedNode[] {
  const found = new Map<string, NamedNode>();
  const queue: Term[] = [ root ];
  while (queue.length > 0) {
    for (const sub of namedNodes(profile.getSubjects(predicate, queue.shift()!, null))) {
      if (!found.has(sub.value) && !sub.equals(root)) {
        found.set(sub.value, sub);
        queue.push(sub);
      }
    }
  }
  return [ ...found.values() ];
}

/** All named classes below `superClass` in the profile, direct and indirect. */
export function subclassesOf(profile: Store, superClass: Term): NamedNode[] {
  return descendantsOf(profile, superClass, RDFS.terms.subClassOf);
}

/**
 * The profile properties that relate a policy to `ruleClass`:
 * `rdfs:range ruleClass` and `rdfs:domain` either `odrl:Policy` or a profile subclass of it.
 */
function policyPropertiesFor(profile: Store, ruleClass: NamedNode): NamedNode[] {
  const policyClasses = [ ODRL.terms.Policy, ...subclassesOf(profile, ODRL.terms.Policy) ];
  return namedNodes(profile.getSubjects(RDFS.terms.range, ruleClass, null))
    .filter((property): boolean =>
      policyClasses.some((cls): boolean => profile.countQuads(property, RDFS.terms.domain, cls, null) > 0));
}

// ---------------------------------------------------------------------------
// Extending the shapes: one function per profile feature.
// Each takes the shapes and returns a new, extended array. None modifies its input.
// ---------------------------------------------------------------------------

/**
 * Adds the profile's actions, left operands, operators, conflict terms and policy types
 * to the matching `sh:in` list (see {@link ALLOWED_VALUE_LISTS}).
 *
 * @throws Error - If the profile has terms for a list that `shape` does not contain.
 */
function addAllowedValues(shape: Quad[], profile: Store): Quad[] {
  let result = shape;
  for (const list of Object.values(ALLOWED_VALUE_LISTS)) {
    const terms = list.relation === 'subClassOf' ?
      subclassesOf(profile, list.type) :
      instancesOf(profile, list.type);
    // Only look the list up when there is something to add, so shapes without this list don't cause an error.
    if (terms.length === 0) {
      continue;
    }
    const head = findInList(result, list.shape, list.path);
    for (const term of terms) {
      result = appendToList(result, head, term);
    }
  }
  return result;
}

/**
 * Makes every shape that targets a class also target that class's profile subclasses,
 * e.g. `ex:MyOffer rdfs:subClassOf odrl:Offer` is validated by all shapes that target `odrl:Offer`.
 */
function addSubclassTargets(shape: Quad[], profile: Store): Quad[] {
  const added: Quad[] = [];
  for (const target of shape.filter((q): boolean => q.predicate.equals(SH.terms.targetClass))) {
    for (const subclass of subclassesOf(profile, target.object)) {
      added.push(quad(target.subject, SH.terms.targetClass, subclass));
    }
  }
  return [ ...shape, ...added ];
}

/**
 * Makes `:LogicalConstraintShape` accept the profile's subproperties of `odrl:operand`,
 * like `odrl:and`, `odrl:or`, `odrl:xone` and `odrl:andSequence`. For each subproperty `p`:
 *
 * - `:LogicalConstraintShape sh:targetSubjectsOf p` is added;
 * - `p` is appended to the `sh:alternativePath` list of the shape.
 *
 * @throws Error - If the profile has operand subproperties and the shape has no `sh:alternativePath` list.
 */
function addOperandSubproperties(shape: Quad[], profile: Store): Quad[] {
  const operands = descendantsOf(profile, ODRL.terms.operand, RDFS.terms.subPropertyOf);
  if (operands.length === 0) {
    return shape;
  }
  const logicalShape = SHAPE.terms.LogicalConstraintShape;
  const head = findInList(shape, logicalShape, undefined, SH.terms.alternativePath);
  let result = shape;
  for (const operand of operands) {
    result = appendToList(result, head, operand);
    result = [ ...result, quad(logicalShape, SH.terms.targetSubjectsOf, operand) ];
  }
  return result;
}

/**
 * The shape generated for a profile rule class.
 * It lives in its own namespace and contains the full IRI of the class, so it can never overlap
 * with a handcrafted shape or with the shape of a same-named class from another profile.
 */
function ruleShapeFor(ruleClass: NamedNode): NamedNode {
  return namedNode(`${GENERATED_SHAPE_NAMESPACE}${encodeURIComponent(ruleClass.value)}`);
}


/**
 * A shape of its own that checks that a rule is referenced through at least one of `properties`:
 *
 * ```ttl
 * <myRuleShape/referenced> a sh:NodeShape ;
 *     sh:targetClass p:MyRule ;
 *     sh:or (
 *         [ sh:path [ sh:inversePath p:a ] ; sh:minCount 1 ]
 *         [ sh:path [ sh:inversePath p:b ] ; sh:minCount 1 ]
 *     ) ;
 *     sh:message "..." .
 * ```
 *
 * It is `sh:or` over single inverse paths because SHACL engines disagree on inverse and alternative paths combined:
 * rdf-validate-shacl throws on the inverse of an alternative, and shacl-engine gives wrong results for both nestings.
 * It is a separate shape so the message only belongs to this check.
 *
 * @param ruleClass - The rule class to check.
 * @param properties - The properties that may reference the rule. At least one.
 */
function referencedCheck(ruleClass: NamedNode, properties: NamedNode[]): Quad[] {
  const checkShape = namedNode(`${ruleShapeFor(ruleClass).value}/referenced`);
  const names = properties.map((property): string => property.value).join(' or ');
  const listNodes = properties.map(() => blankNode());
  const quads = [
    quad(checkShape, RDF.terms.type, SH.terms.NodeShape),
    quad(checkShape, SH.terms.targetClass, ruleClass),
    quad(checkShape, SH.terms.or, listNodes[0]),
    quad(checkShape, SH.terms.message, literal(`A ${ruleClass.value} must be referenced through ${names}.`)),
  ];
  properties.forEach((property, i): void => {
    const option = blankNode();
    const path = blankNode();
    quads.push(
      quad(listNodes[i], RDF.terms.first, option),
      quad(listNodes[i], RDF.terms.rest, listNodes[i + 1] ?? RDF.terms.nil),
      quad(option, SH.terms.path, path),
      quad(option, SH.terms.minCount, literal('1', XSD.terms.integer)),
      quad(path, SH.terms.inversePath, property),
    );
  });
  return quads;
}

/**
 * Supports the profile's own rule types. For each subclass `p:MyRule` of `odrl:Rule` (transitively):
 *
 * 1. `:RuleShape sh:targetClass p:MyRule`, so its instances are validated like any other rule;
 * 2. a new shape `<myRuleShape> a sh:NodeShape ; sh:targetClass p:MyRule ; sh:node :RuleShape`
 *    (see {@link ruleShapeFor} for its IRI);
 * 3. for each property `p:myRule` relating a policy to it (see {@link policyPropertiesFor}),
 *    `:PolicyShape sh:targetSubjectsOf p:myRule ; sh:property [ sh:path p:myRule ; sh:node <myRuleShape> ]`;
 * 4. if there is such a property, `<myRuleShape>` requires that at least one node references the rule
 *    through it (see {@link incomingReferenceCheck}).
 */
function addRuleTypes(shape: Quad[], profile: Store): Quad[] {
  const added: Quad[] = [];
  for (const ruleClass of subclassesOf(profile, ODRL.terms.Rule)) {
    const ruleShape = ruleShapeFor(ruleClass);
    const properties = policyPropertiesFor(profile, ruleClass);
 
    added.push(
      quad(SHAPE.terms.RuleShape, SH.terms.targetClass, ruleClass),
      quad(ruleShape, RDF.terms.type, SH.terms.NodeShape),
      quad(ruleShape, SH.terms.targetClass, ruleClass),
      quad(ruleShape, SH.terms.node, SHAPE.terms.RuleShape),
    );
 
    for (const property of properties) {
      const propertyShape = blankNode();
      added.push(
        quad(SHAPE.terms.PolicyShape, SH.terms.targetSubjectsOf, property),
        quad(SHAPE.terms.PolicyShape, SH.terms.property, propertyShape),
        quad(propertyShape, SH.terms.path, property),
        quad(propertyShape, SH.terms.node, ruleShape),
      );
    }
 
    if (properties.length > 0) {
      added.push(...referencedCheck(ruleClass, properties));
    }
  }
  return [ ...shape, ...added ];
}

/**
 * Extends the shapes with everything an {@link https://www.w3.org/TR/odrl-model/#profile-mechanism ODRL profile}
 * defines:
 *
 * - instances of `odrl:Action`, `odrl:LeftOperand`, `odrl:Operator` and `odrl:ConflictTerm`, and subclasses of
 *   `odrl:Policy`, are added to the matching `sh:in` list (see {@link addAllowedValues});
 * - subclasses of the classes the shapes target are added as extra targets (see {@link addSubclassTargets});
 * - subproperties of `odrl:operand` are accepted as logical constraint operands (see {@link addOperandSubproperties});
 * - subclasses of `odrl:Rule` get their own shape, linked from the policy (see {@link addRuleTypes}).
 *
 * @param shape - The SHACL shapes as quads. They are not modified.
 * @param profile - The profile as quads, e.g. the DPV ODRL mapping.
 *
 * @returns A new array with the shapes extended, without duplicate quads.
 *
 * @throws Error
 * If the profile has terms for a list that `shape` does not contain.
 */
export function addProfileToShape(shape: Quad[], profile: Quad[]): Quad[] {
  const profileStore = new Store(profile);

  let result = shape;
  result = addAllowedValues(result, profileStore);
  result = addSubclassTargets(result, profileStore);
  result = addOperandSubproperties(result, profileStore);
  result = addRuleTypes(result, profileStore);

  // A store is a set: this drops quads that were already there or were added twice.
  return new Store(result).getQuads(null, null, null, null);
}