# Release Notes

## 0.2.0 (2026-11-19)

- Validates policies that use [ODRL profiles](https://www.w3.org/TR/odrl-model/#profile).
- Makes vocabulary checks stricter: now that profiles are supported, terms that are neither in ODRL nor in a loaded profile are violations.
- Checks constraints on the combination of left operand, operator and right operand. The choices behind these checks are explained in the [requirements](./docs/Requirements.md).

### New
- **Profile support**: `new ODRLValidator({ profiles: [{ uri, quads }] })` (new `ODRLProfile` type). A profile extends the shapes with:
  - its actions, left operands, operators and conflict terms (`a odrl:Action`, `odrl:LeftOperand`, `odrl:Operator`, `odrl:ConflictTerm`);
  - its subclasses of the policy and rule classes (`rdfs:subClassOf`), which are then validated like their parent class;
  - its subproperties of `odrl:operand`, accepted as logical constraint operands.
- **Bundled profiles**: `TOSL_PROFILE`, `DPV_ODRL_PROFILE` and `ODRL_COMM_PROFILE`, plus the `PROFILES` map.
- **Profile utilities exported**: `addProfileToShape`, `subclassesOf`, `ALLOWED_VALUE_LISTS` and the list helpers.
- **Unsupported profile warning**: a policy that declares an `odrl:profile` the validator was not given gets a `sh:Warning`.
- **Operator checks** ([`07-odrl-constraint-operators.ttl`](src/shapes/modules/07-odrl-constraint-operators.ttl)): an operator that does not fit the left operand is a violation. Which combinations fit is our own interpretation; the ODRL specification does not define it.
- **Right operand checks** ([`08-odrl-constraint-right-operands.ttl`](src/shapes/modules/08-odrl-constraint-right-operands.ttl)): the right operand must match the left operand, based on the left operand's description in the [ODRL Vocabulary](https://www.w3.org/TR/odrl-vocab/).

### Changed (stricter)
- **Unknown terms are violations, not warnings**: actions, left operands and operators that are not in the ODRL vocabulary, nor in a loaded profile, now make the policy invalid.
- **Conflict strategy**: `odrl:conflict` must be `odrl:perm`, `odrl:prohibit`, `odrl:invalid` or a conflict term from a loaded profile. Previously any value was accepted if the policy declared some profile.
- **Policy class**: any subject with `odrl:permission`, `odrl:prohibition` or `odrl:obligation` is validated as a policy. At least one of its types must be an ODRL policy class or a profile subclass of `odrl:Policy`. Other types, e.g. `odrl:Asset`, are still allowed.
- **Actions and targets**: an IRI alone no longer passes the action or target check; it must satisfy the action or asset shape.
- **Input without a policy**: input that contains no typed ODRL policy now returns `valid: false` with "No valid policy provided".
- **Normalisation errors**: a failing normalisation step returns a result with the error instead of throwing.


## 0.1.0 (2026-06-29)

Initial release, the version described in the [NXDG26 paper](https://w3id.org/force/papers/NXDG2026) and used by the [demo](https://w3id.org/force/validator/demo).

- Normalisation of policies: rule type inference, internalisation of parties and assets, and atomisation into irreducible rules.
- Syntactic and semantic validation against the ODRL Information Model with SHACL.
- Detection of deontic conflicts (permission vs. prohibition, prohibition vs. duty) with Notation3 rules.
- Node and browser builds.