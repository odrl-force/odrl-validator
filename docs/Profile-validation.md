# ODRL Profile Validation

When the ODRL core vocabulary does not fit the use case, ODRL defines [profiles](https://www.w3.org/TR/odrl-model/#profile) to allow expanding the vocabulary (e.g. with with extra actions, left operands, operators, ...).
To validate policies that use a profile, pass the profile to the ODRL Validator.

Two profiles are bundled as Turtle strings:
- `DPV_ODRL_PROFILE`: the Data Privacy Vocabulary profile
- `TOSL_PROFILE`: the Terms of Services Ontology profile

Any other profile works the same way: parse it to quads and pass it together with its IRI.

The example below validates a policy that uses the DPV profile.

```ts
import { Parser } from 'n3';
import { ODRLValidator, DPV_ODRL_PROFILE } from 'odrl-validator';

const parser = new Parser();

const profiles = [{
  uri: 'https://w3id.org/dpv/mappings/odrl#', // the IRI the policy declares with odrl:profile
  quads: parser.parse(DPV_ODRL_PROFILE),
}];
const validator = new ODRLValidator({ profiles });

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

const result = await validator.validate(parser.parse(policy));
// { valid: true, validationResults: [], conflicts: [] }
```

`validationResults` contains the violations and warnings, `conflicts` the detected rule conflicts.