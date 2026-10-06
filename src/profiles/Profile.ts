import type { NamedNode, Quad, Term } from '@rdfjs/types';
import { DataFactory, Store } from 'n3';
import { createVocabulary } from 'rdf-vocabulary';
import { ODRL, RDF, RDFS, SH } from '../util/Vocabulary';
import { appendToList, findInList } from './ListUtil';
const { quad } = DataFactory;

const SHAPE = createVocabulary('http://example.com/',
  'AllowedActionValueShape',
  'AllowedConstraintValueShape',
  'ConflictStrategyShape',
  'RuleShape');

/**
 * Describes one `sh:in` list in our SHACL file that holds the allowed ODRL terms of one kind,
 * e.g. the allowed actions, or the allowed left operands.
 *
 * A profile extends such a list by declaring instances of {@link AllowedValueList.type},
 * e.g. `ex:term a odrl:LeftOperand`.
 */
export interface AllowedValueList {
  /** The ODRL class that profile terms are typed with, e.g. `odrl:LeftOperand`. */
  type: NamedNode;
  /** The named shape in our SHACL file that contains the list. */
  shape: NamedNode;
  /**
   * The `sh:path` of the property shape that contains the list.
   * Only needed when the shape contains several lists, e.g. one for `odrl:leftOperand` and one for `odrl:operator`.
   */
  path?: NamedNode;
}
 
/**
 * All `sh:in` lists of our SHACL file that a profile can extend.
 * This is the single place to register another one.
 *
 * Right operands are absent on purpose: the shapes accept any literal, IRI or `odrl:RightOperand`.
 */
export const ALLOWED_VALUE_LISTS: Record<'action' | 'leftOperand' | 'operator' | 'conflictTerm', AllowedValueList> = {
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
};


/**
 * Classes that no shape targets yet, paired with the shape that should validate their (profile) subclasses.
 * A profile's `rdfs:subClassOf odrl:Rule` is validated like any other rule.
 */
const EXTRA_TARGETS: [NamedNode, NamedNode][] = [[ ODRL.terms.Rule, SHAPE.terms.RuleShape ]];


/**
 * Finds the named subjects in a profile that are typed with a class.
 * Blank nodes are skipped, since they cannot be listed as allowed values.
 *
 * @param profile - The profile.
 * @param type - The class the subjects must be typed with, e.g. `odrl:LeftOperand`.
 *
 * @returns The matching named subjects.
 */
function typedNamedNodes(profile: Quad[], type: NamedNode): NamedNode[] {
  return new Store(profile).getSubjects(RDF.terms.type, type, null)
    .filter((subject): boolean => subject.termType === 'NamedNode') as NamedNode[];
}



/**
 * Adds each of `values` to the end of the `sh:in` list described by `list`, skipping values already in it.
 * This changes `store` in place.
 * 
 * @param store - The store containing the SHACL shapes. It is modified.
 * @param list - Which `sh:in` list to extend.
 * @param values - The terms to add to the list.
 *
 * @returns True if at least one value was added.
 *
 * @returns A new array with the shapes extended. It holds the same quads as `shape` if nothing needed adding.
 *
 * @throws Error - If `values` is not empty and the list cannot be found in `shape`.
 */
function addToShapeList(shape: Quad[], concept: AllowedValueList, values: NamedNode[]): Quad[] {
  // Nothing to add: don't look the list up, so shapes without this list don't cause an error.
  if (values.length === 0) {
    return [ ...shape ];
  }
  const list = findInList(shape, concept.shape, concept.path);
  return values.reduce((quads, value): Quad[] => appendToList(quads, list, value), shape);
}


/** All named classes below `root` in the profile, transitively. 
 * 
 * @param profile - The profile.
 * @param superClass - The class to find the subclasses of.
 *
 * @returns The named subclasses, direct and indirect.
 */

function subclassesOf(profile: Store, superClass: Term): NamedNode[] {
  const found = new Map<string, NamedNode>();
  const queue: Term[] = [ superClass ];
  while (queue.length > 0) {
    for (const sub of profile.getSubjects(RDFS.terms.subClassOf, queue.shift()!, null)) {
      if (sub.termType === 'NamedNode' && !found.has(sub.value) && !sub.equals(superClass)) {
        found.set(sub.value, sub);
        queue.push(sub);
      }
    }
  }
  return [ ...found.values() ];
}

/**
 * Makes every shape that targets a class also target that class's profile subclasses.
 * This changes `store` in place.
 * Covers subclasses of Policy (incl. Set, Offer, Agreement), Permission, Prohibition, Duty, Rule and Constraint.
 *
 * @param store - The store containing the SHACL shapes. It is modified.
 * @param profile - The profile, containing the `rdfs:subClassOf` statements.
 *
 * @returns A new array with the extra `sh:targetClass` quads added.
 */
function addSubclassTargets(shape: Quad[], profile: Quad[]): Quad[] {
  const profileStore = new Store(profile);
  const targets: [Term, Term][] = [
    ...shape.filter((q): boolean => q.predicate.equals(SH.terms.targetClass))
      .map((q): [Term, Term] => [ q.object, q.subject ]),
    ...EXTRA_TARGETS,
  ];
  const added = targets.flatMap(([ cls, targetShape ]): Quad[] =>
    subclassesOf(profileStore, cls).map((sub): Quad => quad(targetShape as NamedNode, SH.terms.targetClass, sub)));
  // A store is a set: this drops targets that are already there or were found twice.
  return new Store([ ...shape, ...added ]).getQuads(null, null, null, null);
}





/**
 * Extends the shapes with everything an {@link https://www.w3.org/TR/odrl-model/#profile-mechanism ODRL profile}
 * defines:
 *
 * - instances of `odrl:Action`, `odrl:LeftOperand`, `odrl:Operator` and `odrl:ConflictTerm`
 *   are added to the matching `sh:in` list in our SHACL file (see {@link ALLOWED_VALUE_LISTS});
 * - subclasses of the classes the shapes target (policies, rules, ...) are added as extra targets.
 *
 * @param shape - The SHACL shapes as quads. They are not modified.
 * @param profile - The profile as quads, e.g. the DPV ODRL mapping.
 *
 * @returns A new array with the shapes extended. It holds the same quads as `shape` if the profile adds nothing.
 *
 * @throws Error
 * If the profile has terms for a list that `shape` does not contain.
 */
export function addProfileToShape(shape: Quad[], profile: Quad[]): Quad[] {
  const withLists = Object.values(ALLOWED_VALUE_LISTS).reduce((quads, concept): Quad[] =>
    addToShapeList(quads, concept, typedNamedNodes(profile, concept.type)), shape);
  return addSubclassTargets(withLists, profile);
}
