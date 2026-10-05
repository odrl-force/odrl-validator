import type { NamedNode, Quad, Quad_Subject, Term } from '@rdfjs/types';
import { DataFactory, Parser, Store } from 'n3';
import { addActions, addAllowedAction } from '../../src/profiles/Profile';
import { appendToList, findInList } from '../../src/profiles/ListUtil';

const { namedNode } = DataFactory;
const parser = new Parser()

const RDF_FIRST = namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first');
const RDF_REST = namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest');
const RDF_NIL = namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil');
 
const SHAPE = namedNode('http://example.com/AllowedActionValueShape');
const USE = namedNode('http://www.w3.org/ns/odrl/2/use');
const TRANSFER = namedNode('http://www.w3.org/ns/odrl/2/transfer');
const READ = namedNode('http://www.w3.org/ns/odrl/2/read');
const WRITE = namedNode('http://www.w3.org/ns/odrl/2/write');

/** Reads the values of the RDF list starting at `head`. */
function listValues(store: Store, head: Term): string[] {
  const values: string[] = [];
  let node = head;
  while (!node.equals(RDF_NIL)) {
    values.push(store.getObjects(node as Quad_Subject, RDF_FIRST, null)[0].value);
    node = store.getObjects(node as Quad_Subject, RDF_REST, null)[0];
  }
  return values;
}
 
/** The allowed actions of `:AllowedActionValueShape` in the given quads. */
function allowedActions(quads: Quad[]): string[] {
  const store = new Store(quads);
  return listValues(store, findInList(store, SHAPE));
}
 
// The simplest possible target: the sh:in list sits directly on the shape.
const SIMPLE_SHAPE = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix ex: <http://example.com/> .

ex:AllowedActionValueShape a sh:NodeShape ;
  sh:in ( odrl:use odrl:transfer ) .
`;
 
// Same, but the list is nested in blank nodes, like in the real shape (sh:or ( [ sh:in (...) ] [ sh:class ... ] )).
const NESTED_SHAPE = `
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix ex: <http://example.com/> .

ex:AllowedActionValueShape a sh:NodeShape ;
  sh:or ( [ sh:in ( odrl:use odrl:transfer ) ] [ sh:class odrl:Action ] ) .
`;


describe('findInList', (): void => {
 
  it('returns the head node of the list.', (): void => {
    const store = new Store(parser.parse(SIMPLE_SHAPE));
    const head = findInList(store, SHAPE);
    expect(store.getObjects(head as Quad_Subject, RDF_FIRST, null)).toEqual([ USE ]);
  });
 
  it('does not walk into other named shapes.', (): void => {
    const store = new Store(parser.parse(`
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix ex: <http://example.com/> .
      ex:AllowedActionValueShape a sh:NodeShape ; sh:node ex:Other .
      ex:Other sh:in ( odrl:read ) .
    `));
    expect(() => findInList(store, SHAPE)).toThrow('No sh:in list found');
  });
 
  it('throws when there is no sh:in list.', (): void => {
    const store = new Store(parser.parse(`
        @prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix ex: <http://example.com/> .
ex:AllowedActionValueShape a sh:NodeShape .`));
    expect(() => findInList(store, SHAPE)).toThrow(`No sh:in list found for ${SHAPE.value}.`);
  });
 
  it('throws when the start node is unknown.', (): void => {
    const store = new Store(parser.parse(SIMPLE_SHAPE));
    expect(() => findInList(store, namedNode('http://example.com/Unknown'))).toThrow('No sh:in list found');
  });
 
  it('terminates on cycles between blank nodes.', (): void => {
    const store = new Store(parser.parse(`
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.com/> .
      ex:AllowedActionValueShape sh:or _:a .
      _:a sh:or _:b .
      _:b sh:or _:a .
    `));
    expect(() => findInList(store, SHAPE)).toThrow('No sh:in list found');
  });
});
 
describe('appendToList', (): void => {
  let store: Store;
  let head: Term;
 
  beforeEach((): void => {
    store = new Store(parser.parse(SIMPLE_SHAPE));
    head = findInList(store, SHAPE);
  });
 
  it('appends the value at the end of the list and returns true.', (): void => {
    expect(appendToList(store, head, READ)).toBe(true);
    expect(listValues(store, head)).toEqual([ USE.value, TRANSFER.value, READ.value ]);
  });
 
  it('keeps the head of the list the same.', (): void => {
    appendToList(store, head, READ);
    expect(findInList(store, SHAPE)).toEqual(head);
  });
 
  it('only adds a new list node: 2 quads net (the old rest-nil is replaced).', (): void => {
    const before = store.size;
    appendToList(store, head, READ);
    // Removed: last rdf:rest nil. Added: rdf:rest to new node, new rdf:first, new rdf:rest nil.
    expect(store.size).toBe(before + 2);
  });
 
  it('returns false and leaves the list unchanged if the value is the first item.', (): void => {
    const before = store.size;
    expect(appendToList(store, head, USE)).toBe(false);
    expect(store.size).toBe(before);
    expect(listValues(store, head)).toEqual([ USE.value, TRANSFER.value ]);
  });
 
  it('does nothing if the value is already in the list.', (): void => {
    const before = store.size;
    expect(appendToList(store, head, USE)).toBe(false);

    expect(appendToList(store, head, TRANSFER)).toBe(false);
    expect(appendToList(store, head, TRANSFER)).toBe(false);
    expect(appendToList(store, head, TRANSFER)).toBe(false);
    expect(store.size).toBe(before);

    expect(appendToList(store, head, READ)).toBe(true);
    expect(appendToList(store, head, TRANSFER)).toBe(false);
    expect(store.size).not.toBe(before);

  });
 
  it('can append multiple values in a row, in order.', (): void => {
    appendToList(store, head, READ);
    appendToList(store, head, WRITE);
    expect(listValues(store, head)).toEqual([ USE.value, TRANSFER.value, READ.value, WRITE.value ]);
  });
 

  it('works on a list with a single item.', (): void => {
    const single = new Store(parser.parse(`
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
      @prefix ex: <http://example.com/> .
 
      ex:AllowedActionValueShape sh:in ( odrl:use ) .
`));
    const singleHead = findInList(single, SHAPE);
    expect(appendToList(single, singleHead, READ)).toBe(true);
    expect(listValues(single, singleHead)).toEqual([ USE.value, READ.value ]);
  });
 
  it('throws on an empty list.', (): void => {
    expect(() => appendToList(store, RDF_NIL, READ)).toThrow('Cannot append to an empty RDF list.');
  });
});
 
describe('addActions', (): void => {
  it('adds the actions to the list of the shape.', (): void => {
    const shape = parser.parse(SIMPLE_SHAPE);
    const result = addActions(shape, [ READ, WRITE ]);
    expect(allowedActions(result)).toEqual([ USE.value, TRANSFER.value, READ.value, WRITE.value ]);
  });
 
  it('works for a list nested in blank nodes.', (): void => {
    const result = addActions(parser.parse(NESTED_SHAPE), [ READ ]);
    expect(allowedActions(result)).toEqual([ USE.value, TRANSFER.value, READ.value ]);
  });
 
  it('does not modify the input quads.', (): void => {
    const shape = parser.parse(SIMPLE_SHAPE);
    const copy = [ ...shape ];
    addActions(shape, [ READ ]);
    expect(shape).toHaveLength(copy.length);
    shape.forEach((q, i): void => expect(q.equals(copy[i])).toBe(true));
    expect(allowedActions(shape)).toEqual([ USE.value, TRANSFER.value ]);
  });
 
  it('keeps all other quads.', (): void => {
    const shape = parser.parse(SIMPLE_SHAPE);
    const result = addActions(shape, [ READ ]);
    const store = new Store(result);
    // The only quad that disappears is the old rdf:rest nil of the last list node.
    const missing = shape.filter((q): boolean => !store.has(q));
    expect(missing).toHaveLength(1);
    expect(missing[0].predicate.equals(RDF_REST)).toBe(true);
    expect(missing[0].object.equals(RDF_NIL)).toBe(true);
  });
 
  it('returns the same array if the action is already allowed.', (): void => {
    const shape = parser.parse(SIMPLE_SHAPE);
    expect(addActions(shape, [ USE ])).toBe(shape);
  });
 
  it('returns the same array if there are no actions.', (): void => {
    const shape = parser.parse(SIMPLE_SHAPE);
    expect(addActions(shape, [])).toBe(shape);
  });
 
  it('adds new actions and skips existing ones in the same call.', (): void => {
    const result = addActions(parser.parse(SIMPLE_SHAPE), [ USE, READ, TRANSFER, WRITE ]);
    expect(allowedActions(result)).toEqual([ USE.value, TRANSFER.value, READ.value, WRITE.value ]);
  });
 
});
 
describe('addAllowedAction', (): void => {
  const action: NamedNode = namedNode('https://w3id.org/force/detection#Conflict');
 
  it('adds the action to the allowed actions.', (): void => {
    const result = addAllowedAction(parser.parse(SIMPLE_SHAPE), action);
    expect(allowedActions(result)).toEqual([ USE.value, TRANSFER.value, action.value ]);
  });
});
