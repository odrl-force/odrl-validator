import type { NamedNode, Quad, Quad_Subject, Term } from '@rdfjs/types';
import { DataFactory, Parser, Store } from 'n3';
import { addProfileToShape } from '../../src/profiles/Profile';
import { SHAPES } from '../../src/shapes/Shapes';
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

/**
 * Reads the values of an RDF list.
 *
 * @param quads - The quads containing the list.
 * @param head - The first node of the list.
 *
 * @returns The values of the list as strings, in order.
 */
function listValues(quads: Quad[], head: Term): string[] {
  const store = new Store(quads);
  const values: string[] = [];
  let node = head;
  while (!node.equals(RDF_NIL)) {
    values.push(store.getObjects(node as Quad_Subject, RDF_FIRST, null)[0].value);
    node = store.getObjects(node as Quad_Subject, RDF_REST, null)[0];
  }
  return values;
}

/**
 * Reads the allowed actions of `:AllowedActionValueShape`.
 *
 * @param quads - The SHACL shapes.
 *
 * @returns The allowed actions as strings, in order.
 */
function allowedActions(quads: Quad[]): string[] {
  return listValues(quads, findInList(quads, SHAPE));
}


// NOTE: could have used rdf jest here
/**
 * Checks whether two arrays hold exactly the same quads, ignoring order.
 *
 * @param actual - The first quads.
 * @param expected - The second quads.
 *
 * @returns True if both hold the same quads.
 */
function sameQuads(actual: Quad[], expected: Quad[]): boolean {
  const store = new Store(actual);
  return actual.length === expected.length && expected.every((q): boolean => store.has(q));
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
    const quads = parser.parse(SIMPLE_SHAPE);
    const head = findInList(quads, SHAPE);
    expect(new Store(quads).getObjects(head as Quad_Subject, RDF_FIRST, null)).toEqual([ USE ]);
  });

  it('does not walk into other named shapes.', (): void => {
    const quads = parser.parse(`
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix ex: <http://example.com/> .
      ex:AllowedActionValueShape a sh:NodeShape ; sh:node ex:Other .
      ex:Other sh:in ( odrl:read ) .
    `);
    expect(() => findInList(quads, SHAPE)).toThrow('No sh:in list found');
  });

  it('throws when there is no sh:in list.', (): void => {
    const quads = parser.parse(`
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.com/> .
ex:AllowedActionValueShape a sh:NodeShape .`);
    expect(() => findInList(quads, SHAPE)).toThrow(`No sh:in list found for ${SHAPE.value}.`);
  });

  it('throws when the start node is unknown.', (): void => {
    const quads = parser.parse(SIMPLE_SHAPE);
    expect(() => findInList(quads, namedNode('http://example.com/Unknown'))).toThrow('No sh:in list found');
  });

  it('terminates on cycles between blank nodes.', (): void => {
    const quads = parser.parse(`
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix ex: <http://example.com/> .
      ex:AllowedActionValueShape sh:or _:a .
      _:a sh:or _:b .
      _:b sh:or _:a .
    `);
    expect(() => findInList(quads, SHAPE)).toThrow('No sh:in list found');
  });
  describe('findInList with a path', (): void => {
    const TWO_LISTS = `
  @prefix sh: <http://www.w3.org/ns/shacl#> .
  @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
  @prefix ex: <http://example.com/> .
  ex:AllowedActionValueShape sh:property
    [ sh:path odrl:leftOperand ; sh:or ( [ sh:in ( odrl:count ) ] ) ],
    [ sh:path odrl:operator ; sh:or ( [ sh:in ( odrl:eq ) ] ) ] .
  `;
  
    it('returns the list belonging to the given path.', (): void => {
      const quads = parser.parse(TWO_LISTS);
      const head = findInList(quads, SHAPE, namedNode('http://www.w3.org/ns/odrl/2/operator'));
      expect(listValues(quads, head)).toEqual([ 'http://www.w3.org/ns/odrl/2/eq' ]);
    });
  
    it('throws when no property shape has the path.', (): void => {
      const quads = parser.parse(TWO_LISTS);
      expect(() => findInList(quads, SHAPE, namedNode('http://example.com/other')))
        .toThrow(`No sh:in list found for ${SHAPE.value} with sh:path http://example.com/other.`);
    });
  });
});

 
describe('appendToList', (): void => {
  let quads: Quad[];
  let head: Term;

  beforeEach((): void => {
    quads = parser.parse(SIMPLE_SHAPE);
    head = findInList(quads, SHAPE);
  });

  it('appends the value at the end of the list.', (): void => {
    const result = appendToList(quads, head, READ);
    expect(listValues(result, head)).toEqual([ USE.value, TRANSFER.value, READ.value ]);
  });

  it('keeps the head of the list the same.', (): void => {
    const result = appendToList(quads, head, READ);
    expect(findInList(result, SHAPE)).toEqual(head);
  });

 
  it('only adds a new list node: 2 quads net (the old rest-nil is replaced).', (): void => {
    const result = appendToList(quads, head, READ);
    // Removed: last rdf:rest nil. Added: rdf:rest to new node, new rdf:first, new rdf:rest nil.
    expect(result).toHaveLength(quads.length + 2);
  });
 
  it('does not modify the input.', (): void => {
    const copy = [ ...quads ];
    appendToList(quads, head, READ);
    expect(sameQuads(quads, copy)).toBe(true);
    expect(listValues(quads, head)).toEqual([ USE.value, TRANSFER.value ]);
  });

 
  it('returns the same quads if the value is already in the list, however often it is added.', (): void => {
    expect(sameQuads(appendToList(quads, head, TRANSFER), quads)).toBe(true);

    const extended = appendToList(quads, head, READ);
    expect(sameQuads(appendToList(extended, head, TRANSFER), extended)).toBe(true);
    expect(sameQuads(appendToList(extended, head, READ), extended)).toBe(true);
    expect(extended).toHaveLength(quads.length + 2);
  });
 
  it('can append multiple values in a row, in order.', (): void => {
    const result = appendToList(appendToList(quads, head, READ), head, WRITE);
    expect(listValues(result, head)).toEqual([ USE.value, TRANSFER.value, READ.value, WRITE.value ]);
  });
 

    it('works on a list with a single item.', (): void => {
      const single = parser.parse(`
        @prefix sh: <http://www.w3.org/ns/shacl#> .
        @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
        @prefix ex: <http://example.com/> .
  
        ex:AllowedActionValueShape sh:in ( odrl:use ) .
  `);
      const singleHead = findInList(single, SHAPE);
      const result = appendToList(single, singleHead, READ);
      expect(listValues(result, singleHead)).toEqual([ USE.value, READ.value ]);
    });
  
    it('throws on an empty list.', (): void => {
      expect(() => appendToList(quads, RDF_NIL, READ)).toThrow('Cannot append to an empty RDF list.');
    });
});
 
 
describe('addProfileToShape', (): void => {
  const ODRL_NS = 'http://www.w3.org/ns/odrl/2/';
  const EX = 'http://example.com/';
  const PREFIXES = `
@prefix odrl: <${ODRL_NS}> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix ex: <${EX}> .
`;
  const PROFILE = `${PREFIXES}
ex:Act a odrl:Action .
ex:Left a odrl:LeftOperand .
ex:Op a odrl:Operator .
ex:Conf a odrl:ConflictTerm .
ex:MyPolicy rdfs:subClassOf odrl:Policy .
ex:DeeperPolicy rdfs:subClassOf ex:MyPolicy .
ex:MyOffer rdfs:subClassOf odrl:Offer .
ex:MyRule rdfs:subClassOf odrl:Rule .
ex:MyPermission rdfs:subClassOf odrl:Permission .
`;
  /** @returns A fresh copy of the full SHACL file as quads. */
  const shapes = (): Quad[] => parser.parse(SHAPES);
  /**
   * @param name - The local name of an ODRL term.
   *
   * @returns The ODRL term as a named node.
   */
  const odrl = (name: string): NamedNode => namedNode(ODRL_NS + name);

  /**
   * Reads the values of an `sh:in` list in one of the example shapes.
   *
   * @param quads - The SHACL shapes.
   * @param shape - The local name of the shape holding the list.
   * @param path - The `sh:path` of the property shape holding the list, if the shape holds several.
   *
   * @returns The values of the list as strings, in order.
   */
  function listAt(quads: Quad[], shape: string, path?: NamedNode): string[] {
    return listValues(quads, findInList(quads, namedNode(EX + shape), path));
  }

  /**
   * Reads the `sh:targetClass` values of one of the example shapes.
   *
   * @param quads - The SHACL shapes.
   * @param shape - The local name of the shape.
   *
   * @returns The target classes, abbreviated with the `ex:` and `odrl:` prefixes.
   */
  function targets(quads: Quad[], shape: string): string[] {
    return new Store(quads)
      .getObjects(namedNode(EX + shape), namedNode('http://www.w3.org/ns/shacl#targetClass'), null)
      .map((term): string => term.value.replace(EX, 'ex:').replace(ODRL_NS, 'odrl:'));
  }

  it('adds each concept to its own list only.', (): void => {
    const result = addProfileToShape(shapes(), parser.parse(PROFILE));
    expect(listAt(result, 'AllowedActionValueShape')).toContain(`${EX}Act`);
    expect(listAt(result, 'AllowedConstraintValueShape', odrl('leftOperand'))).toContain(`${EX}Left`);
    expect(listAt(result, 'AllowedConstraintValueShape', odrl('operator'))).toContain(`${EX}Op`);
    expect(listAt(result, 'ConflictStrategyShape', odrl('conflict'))).toContain(`${EX}Conf`);

    expect(listAt(result, 'AllowedActionValueShape')).not.toContain(`${EX}Left`);
    expect(listAt(result, 'AllowedConstraintValueShape', odrl('leftOperand'))).not.toContain(`${EX}Op`);
    expect(listAt(result, 'AllowedConstraintValueShape', odrl('operator'))).not.toContain(`${EX}Left`);
  });

  it('keeps the existing list values in order.', (): void => {
    const result = addProfileToShape(shapes(), parser.parse(PROFILE));
    const conflict = listAt(result, 'ConflictStrategyShape', odrl('conflict'));
    expect(conflict).toEqual([ `${ODRL_NS}perm`, `${ODRL_NS}prohibit`, `${ODRL_NS}invalid`, `${EX}Conf` ]);
  });

  it('adds policy subclasses (transitively) to the shapes that target odrl:Policy.', (): void => {
    const result = addProfileToShape(shapes(), parser.parse(PROFILE));
    expect(targets(result, 'PolicyShape')).toEqual(expect.arrayContaining([ 'ex:MyPolicy', 'ex:DeeperPolicy' ]));
    expect(targets(result, 'PolicyShape')).not.toContain('ex:MyOffer');
    expect(targets(result, 'ConflictStrategyShape'))
      .toEqual(expect.arrayContaining([ 'ex:MyPolicy', 'ex:DeeperPolicy', 'ex:MyOffer' ]));
  });

  it('adds subclasses of Offer only to the Offer shapes.', (): void => {
    const result = addProfileToShape(shapes(), parser.parse(PROFILE));
    expect(targets(result, 'OfferPolicyShape')).toContain('ex:MyOffer');
    expect(targets(result, 'SetPolicyShape')).not.toContain('ex:MyOffer');
  });

  it('adds rule subclasses to the shapes that target them.', (): void => {
    const result = addProfileToShape(shapes(), parser.parse(PROFILE));
    expect(targets(result, 'RuleShape')).toEqual(expect.arrayContaining([ 'ex:MyRule', 'ex:MyPermission' ]));
    expect(targets(result, 'PermissionShape')).toContain('ex:MyPermission');
    expect(targets(result, 'PermissionShape')).not.toContain('ex:MyRule');
    expect(targets(result, 'ProhibitionShape')).not.toContain('ex:MyPermission');
  });

  it('does not modify the input.', (): void => {
    const input = shapes();
    const copy = [ ...input ];
    const result = addProfileToShape(input, parser.parse(PROFILE));
    expect(result).not.toBe(input);
    expect(sameQuads(input, copy)).toBe(true);
  });

  it('is idempotent: applying the profile twice changes nothing the second time.', (): void => {
    const once = addProfileToShape(shapes(), parser.parse(PROFILE));
    const twice = addProfileToShape(once, parser.parse(PROFILE));
    expect(sameQuads(twice, once)).toBe(true);
  });

  it('returns the same quads for an empty profile.', (): void => {
    const input = shapes();
    expect(sameQuads(addProfileToShape(input, []), input)).toBe(true);
  });

  it('ignores untyped terms, blank nodes and blank node subclasses.', (): void => {
    const profile = parser.parse(`${PREFIXES}
ex:Mapped odrl:note "x" .
_:b a odrl:Action .
_:c rdfs:subClassOf odrl:Policy .
`);
    const input = shapes();
    expect(sameQuads(addProfileToShape(input, profile), input)).toBe(true);
  });

  it('terminates on subclass cycles.', (): void => {
    const profile = parser.parse(`${PREFIXES}
ex:A rdfs:subClassOf odrl:Policy, ex:B .
ex:B rdfs:subClassOf ex:A .
`);
    const result = addProfileToShape(shapes(), profile);
    expect(targets(result, 'PolicyShape')).toEqual(expect.arrayContaining([ 'ex:A', 'ex:B' ]));
  });

  it('does not fail on shapes lacking a list the profile has no values for.', (): void => {
    const simple = parser.parse(SIMPLE_SHAPE);
    const result = addProfileToShape(simple, parser.parse(`${PREFIXES} ex:Act a odrl:Action .`));
    expect(allowedActions(result)).toEqual([ USE.value, TRANSFER.value, `${EX}Act` ]);
  });

  it('throws when the profile has values for a list the shapes lack.', (): void => {
    const simple = parser.parse(SIMPLE_SHAPE);
    expect(() => addProfileToShape(simple, parser.parse(`${PREFIXES} ex:Left a odrl:LeftOperand .`)))
      .toThrow('No sh:in list found');
  });
});

