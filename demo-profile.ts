import { Parser } from "n3";
import { ODRLValidator, SHAPES,addProfileToShape, DPV_PROFILE, TOSL_PROFILE } from "./src"
import { Quad } from "@rdfjs/types";
import { write } from "@jeswr/pretty-turtle/dist";

// Uses a DPV action, a DPV left operand and a DPV purpose, none of which are in the ODRL vocabulary.
const DPV_Policy = `
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix dpv-odrl: <https://w3id.org/dpv/mappings/odrl#> .
@prefix ex: <http://example.org/> .

ex:dpvPolicy a odrl:Set ;
  odrl:uid ex:dpvPolicy ;
  odrl:profile dpv-odrl: ;
  odrl:permission [
    a odrl:Permission ;
    odrl:target ex:personalData ;
    odrl:action dpv-odrl:Use ;
    odrl:constraint [
      a odrl:Constraint ;
      odrl:leftOperand dpv-odrl:Purpose ;
      odrl:operator odrl:isAnyOf ;
      odrl:rightOperand ex:ServiceProvision
    ]
  ] .

ex:personalData a odrl:Asset .
`;

const TOSL_Policy = `
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix ex: <http://example.org/> .
@prefix tosl: <https://w3id.org/tosl/> .

ex:toslPolicy a odrl:Set ;
  odrl:profile tosl: ;
  odrl:uid ex:toslPolicy ;
  odrl:permission [
    a odrl:Permission ;
    odrl:target ex:service ;
    odrl:action tosl:remove
  ] .

ex:service a odrl:Asset .
`;

async function main() {
  const parser = new Parser();

  // plain ODRL: only the terms of the ODRL vocabulary are allowed
  const ODRLValidatorPlain = new ODRLValidator();

  // ODRL + profiles: the terms of both profiles are added to the shapes
  const shape : Quad[]= parser.parse(SHAPES)
  const dpvProfileQuads = parser.parse(DPV_PROFILE)
  const toslProfileQuads = parser.parse(TOSL_PROFILE)

  const dpvProfileShape = addProfileToShape(shape,dpvProfileQuads)
  const dpvToslProfileShape =addProfileToShape(dpvProfileShape,toslProfileQuads)

  // NOTE: because quads are the output of the function, it becomes cumbersome. Perhaps build a class around it to make it easier to add a profile?
  // NOTE: For the results, it all turns to true. Though, if the odrl profile is not known by the validator, we should let throw violations and state that the profile is unknown + show a link to documentation
  // IDEA: maybe make it possible for ODRL validators to also run on the fly?


  const ODRLProfileValidator = new ODRLValidator({shape:dpvToslProfileShape})
//  console.log(await write(dpvToslProfileShape, {}))
  for (const [name, policy] of [["DPV", DPV_Policy], ["TOSL", TOSL_Policy]]) {
    console.log(`${name} policy: plain ODRL validation`);
    console.log(await ODRLValidatorPlain.validate(parser.parse(policy)));

    console.log(`${name} policy: ODRL validation with the DPV and TOSL profiles`);
    console.log(await ODRLProfileValidator.validate(parser.parse(policy)));
  }
}

main()