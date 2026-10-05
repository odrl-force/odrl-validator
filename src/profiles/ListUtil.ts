import type { NamedNode, Quad_Subject, Term } from '@rdfjs/types';
import { DataFactory, Store } from 'n3';
import { SH, RDF } from '../util/Vocabulary';
const { quad, blankNode } = DataFactory;

/**
 * Finds the head of the `sh:in` list reachable from `start`,
 * only walking through blank nodes (so other named shapes are never entered).
 */
export function findInList(store: Store, start: Term): Term {
  const seen = new Set<string>();
  const queue: Term[] = [ start ];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (seen.has(node.value)) {
      continue;
    }
    seen.add(node.value);
    for (const q of store.getQuads(node as Quad_Subject, null, null, null)) {
      if (q.predicate.equals(SH.terms.in)) {
        return q.object;
      }
      if (q.object.termType === 'BlankNode') {
        queue.push(q.object);
      }
    }
  }
  throw new Error(`No sh:in list found for ${start.value}.`);
}
 
/**
 * Appends `value` to the RDF list starting at `head`.
 *
 * @returns False if the value was already in the list.
 */
export function appendToList(store: Store, head: Term, value: NamedNode): boolean {
  let node = head;
  while (!node.equals(RDF.terms.nil)) {
    if (value.equals(store.getObjects(node as Quad_Subject, RDF.terms.first, null)[0])) {
      return false;
    }
    const rest = store.getObjects(node as Quad_Subject, RDF.terms.rest, null)[0];
    if (rest.equals(RDF.terms.nil)) {
      const added = blankNode();
      store.removeQuad(quad(node as Quad_Subject, RDF.terms.rest, RDF.terms.nil));
      store.addQuad(node as Quad_Subject, RDF.terms.rest, added);
      store.addQuad(added, RDF.terms.first, value);
      store.addQuad(added, RDF.terms.rest, RDF.terms.nil);
      return true;
    }
    node = rest;
  }
  throw new Error('Cannot append to an empty RDF list.');
}