import { Parser } from "n3";
import { ODRLValidator, DPV_ODRL_PROFILE, TOSL_PROFILE } from "./src"

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

  // ODRL + profiles: the terms of both profiles are added to the shapes.
  // The uri of a profile is the IRI that a policy declares with odrl:profile.
  const ODRLProfileValidator = new ODRLValidator({
    profiles: [
      { uri: "https://w3id.org/dpv/mappings/odrl#", quads: parser.parse(DPV_ODRL_PROFILE) },
      { uri: "https://w3id.org/tosl/", quads: parser.parse(TOSL_PROFILE) },
    ],
  });

  // NOTE: for the results, it all turns to true. Though, if the odrl profile is not known by the validator,
  // we should throw violations, state that the profile is unknown and show a link to documentation.
  // IDEA: maybe make it possible for ODRL validators to also run on the fly?

  for (const [name, policy] of [["DPV", DPV_Policy], ["TOSL", TOSL_Policy]]) {
    console.log(`${name} policy: plain ODRL validation`);
    console.log(await ODRLValidatorPlain.validate(parser.parse(policy)));

    console.log(`${name} policy: ODRL validation with the DPV and TOSL profiles`);
    console.log(await ODRLProfileValidator.validate(parser.parse(policy)));
  }
}

main()