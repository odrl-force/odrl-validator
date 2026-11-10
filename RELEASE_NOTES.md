# Release Notes

## 0.2.0 (unreleased)

Adds validation of policies that use [ODRL profiles](https://www.w3.org/TR/odrl-model/#profile), and makes vocabulary checks stricter.

### New
- **Profile support**: `new ODRLValidator({ profiles: [{ uri, quads }] })` (new `ODRLProfile` type). A profile extends the shapes with:
  - its actions, left operands, operators and conflict terms (`a odrl:Action`, `odrl:LeftOperand`, `odrl:Operator`, `odrl:ConflictTerm`);
  - its subclasses of the policy and rule classes (`rdfs:subClassOf`), which are then validated like their parent class;
  - its subproperties of `odrl:operand`, accepted as logical constraint operands.
- **Bundled profiles**: `TOSL_PROFILE`, `DPV_ODRL_PROFILE` and `ODRL_COMM_PROFILE`, plus the `PROFILES` map.
- **Profile utilities exported**: `addProfileToShape`, `subclassesOf`, `ALLOWED_VALUE_LISTS` and the list helpers.
- **Unsupported profile warning**: a policy that declares an `odrl:profile` the validator was not given gets a `sh:Warning`.

### Changed (stricter)
- **Unknown terms are violations, not warnings**: actions, left operands and operators that are not in the ODRL vocabulary, nor in a loaded profile, now make the policy invalid.
- **Conflict strategy**: `odrl:conflict` must be `odrl:perm`, `odrl:prohibit`, `odrl:invalid` or a conflict term from a loaded profile. Previously any value was accepted if the policy declared some profile.
- **Policy class**: any subject with `odrl:permission`, `odrl:prohibition` or `odrl:obligation` is validated as a policy. At least one of its types must be an ODRL policy class or a profile subclass of `odrl:Policy`. Other types, e.g. `odrl:Asset`, are still allowed.
- **Actions and targets**: an IRI alone no longer passes the action or target check; it must satisfy the action or asset shape.
- **Input without a policy**: input that contains no typed ODRL policy now returns `valid: false` with "No valid policy provided".
- **Normalisation errors**: a failing normalisation step returns a result with the error instead of throwing.

### Known limitations
- **Profiles are not scoped per policy**: all loaded profiles are merged into one shape. Terms from one loaded profile are therefore accepted in a policy that declares only another profile, or no profile at all.
- **Profile policy types leak between instances**: the constructor modifies the shared `POLICY_TYPES` list, so profile policy types also count as policy types in validators created later.
- **Policy subclasses**: only profile subclasses of `odrl:Policy` itself are recognised as policy types, not subclasses of `odrl:Set`, `odrl:Offer`, etc.
- **New rule types**: a profile subclass of `odrl:Rule` has no property that links it to a policy, and profiles do not define one yet. 

## 0.1.0 (2026-06-29)

Initial release, the version described in the [NXDG26 paper](https://w3id.org/force/papers/NXDG2026) and used by the [demo](https://w3id.org/force/validator/demo).

- Normalisation of policies: rule type inference, internalisation of parties and assets, and atomisation into irreducible rules.
- Syntactic and semantic validation against the ODRL Information Model with SHACL.
- Detection of deontic conflicts (permission vs. prohibition, prohibition vs. duty) with Notation3 rules.
- Node and browser builds.