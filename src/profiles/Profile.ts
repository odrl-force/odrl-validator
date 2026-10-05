import type { NamedNode, Quad, Quad_Subject, Term } from '@rdfjs/types';
import { DataFactory, Store } from 'n3';
import { createVocabulary } from 'rdf-vocabulary';
import { ODRL } from 'odrl-atomization';
import { RDF } from '../util/Vocabulary';
import { appendToList, findInList } from './ListUtil';
const { quad, blankNode } = DataFactory;

const SHAPE = createVocabulary('http://example.com/', 'AllowedActionValueShape', 'AllowedConstraintValueShape');

 
/**
 * Adds all actions to the `sh:in` list of `:AllowedActionValueShape`.
 *
 * @returns The shapes with the actions added. The input array is returned as is if nothing changed.
 */
export function addActions(shape: Quad[], actions: NamedNode[]): Quad[] {
  const store = new Store(shape);
  const list = findInList(store, SHAPE.terms.AllowedActionValueShape);
  // Not short-circuiting: every action must be added.
  const changed = actions.reduce((acc, action): boolean => appendToList(store, list, action) || acc, false);
  return changed ? store.getQuads(null, null, null, null) : shape;
}
 
/**
 * Adds a single action to `:AllowedActionValueShape`.
 *
 * @param shape - The SHACL shapes as quads. They are not modified.
 * @param action - The action to allow.
 */
export function addAllowedAction(shape: Quad[], action: NamedNode): Quad[] {
  return addActions(shape, [ action ]);
}
 
/**
 * Adds all actions defined in a profile (every IRI typed as `odrl:Action`)
 * to `:AllowedActionValueShape`.
 *
 * @param shape - The SHACL shapes as quads. They are not modified.
 * @param profile - The profile as quads, e.g. the DPV ODRL mapping.
 *
 * @returns The shapes with the profile's actions added.
 */
export function addProfileToShape(shape: Quad[], profile: Quad[]): Quad[] {
  const actions = new Store(profile)
    .getSubjects(RDF.terms.type, ODRL.terms.Action, null)
    .filter((subject): boolean => subject.termType === 'NamedNode') as NamedNode[];
  return addActions(shape, actions);
}
