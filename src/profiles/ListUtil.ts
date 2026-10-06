import type { NamedNode, Quad, Quad_Subject, Term } from '@rdfjs/types';
import { DataFactory, Store } from 'n3';
import { SH, RDF } from '../util/Vocabulary';
const { quad, blankNode } = DataFactory;

/**
 * Walks breadth-first over `start` and every blank node reachable from it.
 * Named nodes other than `start` are never entered, so other named shapes are left alone.
 * Cycles between blank nodes are safe: every node is visited once.
 *
 * @param store - The store to walk through.
 * @param start - The node to start from. It is always yielded first, whatever its type.
 *
 * @yields `start`, followed by all blank nodes reachable from it.
 */
function* walkBlankNodes(store: Store, start: Term): Generator<Term> {
  const seen = new Set<string>();
  const queue: Term[] = [ start ];
  while (queue.length > 0) {
    const node = queue.shift()!;
    if (seen.has(node.value)) {
      continue;
    }
    seen.add(node.value);
    yield node;
    for (const object of store.getObjects(node as Quad_Subject, null, null)) {
      if (object.termType === 'BlankNode') {
        queue.push(object);
      }
    }
  }
}

/**
 * Finds the head of the `sh:in` list reachable from `start`,
 * only walking through blank nodes (so other named shapes are never entered).
 *
 * @param quads - The SHACL shapes. They are not modified.
 * @param start - The node to start searching from, typically a named shape.
 * @param path - Restricts the search to the property shape with this `sh:path`.
 *               Needed when one shape holds several lists, e.g. for `odrl:leftOperand` and `odrl:operator`.
 *
 * @returns The first node of the `sh:in` list.
 *
 * @throws Error
 * If no `sh:in` list is found, or if `path` is given and no property shape with that `sh:path` is found.
 */
export function findInList(quads: Quad[], start: Term, path?: NamedNode): Term {
  const store = new Store(quads);
  let scope: Term | undefined = start;
  if (path) {
    scope = [ ...walkBlankNodes(store, start) ]
      .find((node): boolean => store.countQuads(node as Quad_Subject, SH.terms.path, path, null) > 0);
  }
  if (scope) {
    for (const node of walkBlankNodes(store, scope)) {
      const list = store.getObjects(node as Quad_Subject, SH.terms.in, null)[0];
      if (list) {
        return list;
      }
    }
  }
  throw new Error(`No sh:in list found for ${start.value}${path ? ` with sh:path ${path.value}` : ''}.`);
}

/**
 * Appends `value` to the RDF list starting at `head`, unless it is already in the list.
 * A new list node is added at the end; the head and all existing nodes stay the same,
 * so `head` stays valid for the returned quads.
 *
 * @param quads - The quads containing the list. They are not modified.
 * @param head - The first node of the list, e.g. as returned by {@link findInList}.
 * @param value - The value to append.
 *
 * @returns A new array with the quads of the list extended. If the value was already in the list,
 *          the result holds the same quads as `quads`.
 *
 * @throws Error
 * If `head` is `rdf:nil`, since an empty list has no node to attach the value to.
 */
export function appendToList(quads: Quad[], head: Term, value: NamedNode): Quad[] {
  const store = new Store(quads);
  let node = head;
  while (!node.equals(RDF.terms.nil)) {
    if (value.equals(store.getObjects(node as Quad_Subject, RDF.terms.first, null)[0])) {
      return [ ...quads ];
    }
    const rest = store.getObjects(node as Quad_Subject, RDF.terms.rest, null)[0];
    if (rest.equals(RDF.terms.nil)) {
      const added = blankNode();
      const oldEnd = quad(node as Quad_Subject, RDF.terms.rest, RDF.terms.nil);
      return [
        ...quads.filter((q): boolean => !q.equals(oldEnd)),
        quad(node as Quad_Subject, RDF.terms.rest, added),
        quad(added, RDF.terms.first, value),
        quad(added, RDF.terms.rest, RDF.terms.nil),
      ];
    }
    node = rest;
  }
  throw new Error('Cannot append to an empty RDF list.');
}