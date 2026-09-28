import { Parser } from "n3"
import { EyelingReasoner } from "n3-utility";
import { ODRLValidator, SHAPES } from "./src"

const policy = `
@prefix : <http://example.com/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix dpv-odrl: <https://w3id.org/dpv/mappings/odrl#> .

:policy1 a odrl:Policy ;
    odrl:profile dpv-odrl: ;
    odrl:permission :perm1 .

:perm1 a odrl:Permission ;
    odrl:assignee :alice ;
    odrl:target :file1 ;
    odrl:action dpv-odrl:Processing .

:alice a odrl:Party .
:bob a odrl:Party .
:file1 a odrl:Asset .
`

const dpvProfile =`
@prefix dpv-odrl: <https://w3id.org/dpv/mappings/odrl#> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix dpv: <https://w3id.org/dpv#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .

dpv-odrl:Processing a odrl:Action, skos:Concept ;
	skos:exactMatch dpv:Processing .
`

const notation3Rule =`

`
async function main() {
    const parser = new Parser();
    const reasoner = new EyelingReasoner();

    const validator = new ODRLValidator();

    const policyQuads = parser.parse(policy)
    // NOTE: the original validator does not work if you add the value as ODRL Action
    const updatedShape = SHAPES + dpvProfile
    const shaclProfileValidator = new ODRLValidator({ shape: parser.parse(SHAPES) })

    const policyAndDPV = [...policyQuads, ...parser.parse(dpvProfile)]
    console.log("Normal ODRL validation of DPV-ODRL policy")
    console.log(await validator.validate(policyQuads));

    console.log("DPV ODRL profile SHACL validation")
    console.log(await shaclProfileValidator.validate(policyQuads));

    //NOTE: shouldn't the first two also not be Violations rather than WARNINGs now?

    // adding DPV terms to the data input does work
    console.log("Attempt two for DPV validation");
    console.log(await validator.validate(policyAndDPV));
    
    // NOTE: I thought to add an N3 rule to add the properties to the allowed list. But it turns out to be an RDF list within an RDF list.
    // This is notoriously hard to work with...

    console.log("Blank node issue")
    console.log(await validator.validate(parser.parse(invalidBlankNodeAction)));

    console.log("Custom action")
    console.log(await validator.validate(parser.parse(customActionBypass)));

    
}

main()

/**
 * Custom actions can bypass the warning by simply being typed as `odrl:Action`.
 *
 * Although `:teleportData` is not part of the official ODRL vocabulary, it
 * satisfies the shape because it is explicitly declared as an `odrl:Action`.
 */
const customActionBypass = `
@prefix : <http://example.com/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .

:policy1 a odrl:Policy ;
  odrl:permission :perm1 .

:perm1 a odrl:Permission ;
  odrl:assignee :alice ;
  odrl:target :file1 ;
  odrl:action :teleportData .

:teleportData a odrl:Action .

:alice a odrl:Party .
:file1 a odrl:Asset .
`;

/**
 * Invalid ODRL policy that is incorrectly accepted because blank nodes are
 * allowed for `odrl:action` (`sh:nodeKind sh:BlankNode`).
 *
 * The action is modeled as an anonymous node of type `odrl:Permission`
 * instead of a valid ODRL action.
 */
const invalidBlankNodeAction = `
@prefix : <http://example.com/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .

:policy1 a odrl:Policy ;
  odrl:permission :perm1 .

:perm1 a odrl:Permission ;
  odrl:assignee :alice ;
  odrl:target :file1 ;
  odrl:action [ a odrl:LeftOperand ] .

:alice a odrl:Party .
:file1 a odrl:Asset .
`;
