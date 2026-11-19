This document defines the requirements that must be implemented in the ODRL validator.

The requirements are based on the [ODRL 2.2 information model](https://www.w3.org/TR/odrl-model/) (ODRL 2.2), the [ODRL 2.2 vocabulary](https://www.w3.org/TR/odrl-vocab/) (Vocab) and the [wiki page listing the validation operations](https://www.w3.org/2016/poe/wiki/Validation) (Wiki).

## Normalization
Before the validation, the policies are normalized (`src/Normalisation.ts`). The IDs are the ones of the wiki.

- N1: Parties and assets declared out of the policy (assigneeOf, assignerOf, hasPolicy) are moved into the rules - [Wiki N1](https://www.w3.org/2016/poe/wiki/Validation#N1._Internalization_of_parties_and_assets_declared_out_of_the_policy)
- N2: The type of the policy elements is added when it can be inferred - [Wiki N2](https://www.w3.org/2016/poe/wiki/Validation#N2._Type_declaration_of_policy_elements) - Only rule types
- *N3: The inheritFrom rules are applied, so each policy is self-contained - [Wiki N3](https://www.w3.org/2016/poe/wiki/Validation#N3._Application_of_inheritance_rules) - Not implemented*
- N4: Policy-level properties are copied to each rule (compact policies) - [Wiki N4](https://www.w3.org/2016/poe/wiki/Validation#N4._Interiorizing_policy-level_properties)
- N5: Compound rules are split into rules with one assigner, assignee, action and target - [Wiki N5](https://www.w3.org/2016/poe/wiki/Validation#N5._Expansion_from_compound_to_irreducible_rules)
- *N6: The actions included in the action of a rule are added - [Wiki N6](https://www.w3.org/2016/poe/wiki/Validation#N6._Inferences_derived_from_odrl:includedIn) - Not implemented*
- *N7: The actions implied by the action of a rule are added - [Wiki N7](https://www.w3.org/2016/poe/wiki/Validation#N7._Inferences_derived_from_odrl:implies) - Not implemented*
- *N8: The parts of an AssetCollection are added as targets - [Wiki N8](https://www.w3.org/2016/poe/wiki/Validation#N8._Inferences_derived_from_odrl:partOf_for_Asset_Collection) - Not implemented*
- *N9: The members of a PartyCollection are added as assignees - [Wiki N9](https://www.w3.org/2016/poe/wiki/Validation#N9._Inferences_derived_from_odrl:partOf_for_Party_Collection) - Not implemented*
- *N10: A replaced policy (isReplacedBy) is substituted by the new one - [Wiki N10](https://www.w3.org/2016/poe/wiki/Validation#N10._Policy_Replacement) - Not implemented*

## Compliance

### Policy
- R01: A valid document must contain at least one Policy - Violation - [Wiki V1](https://www.w3.org/2016/poe/wiki/Validation#V1._A_valid_document_must_contain_at_least_one_Policy)
- R02: A policy must include at least one rule (permission, prohibition or obligation) - Violation - [Wiki V2](https://www.w3.org/2016/poe/wiki/Validation#V2._Every_policy_must_have_at_least_one_rule) - [ODRL 2.2 Section 2.1](https://www.w3.org/TR/odrl-model/#policy)
- R03: A policy must be identified by an IRI - Violation - [Wiki V3](https://www.w3.org/2016/poe/wiki/Validation#V3._Every_policy_must_be_identified_by_a_URI) - [ODRL 2.2 Section 2.1](https://www.w3.org/TR/odrl-model/#policy)
- R04: A policy uid must be an IRI and appear at most once - Violation - [ODRL 2.2 Section 2.1](https://www.w3.org/TR/odrl-model/#policy)
- R05: A policy profile must be an IRI - Violation - [ODRL 2.2 Section 2.1](https://www.w3.org/TR/odrl-model/#policy)
- R06: A policy inheritFrom must reference an existing odrl:Policy - Violation - [ODRL 2.2 Section 2.9](https://www.w3.org/TR/odrl-model/#inheritance)
- R07: A policy conflict strategy must appear at most once and be an IRI - Violation - [Wiki V23](https://www.w3.org/2016/poe/wiki/Validation#V23._Every_policy_most_have_at_most_one_conflict_strategy) - [ODRL 2.2 Section 2.10](https://www.w3.org/TR/odrl-model/#conflict)
- R08: A policy conflict strategy must be a known ODRL value or a profile must be declared - Violation - [Wiki V11](https://www.w3.org/2016/poe/wiki/Validation#V11._In_absence_of_profile.2C_only_ODRL_Core_conflict_strategies_can_be_used) - [ODRL 2.2 Section 2.10](https://www.w3.org/TR/odrl-model/#conflict)
- R107: A policy must be typed as an ODRL policy class, or as a subclass of odrl:Policy from a loaded profile - Violation - [ODRL 2.2 Section 2.1](https://www.w3.org/TR/odrl-model/#policy) - [ODRL 2.2 Section 3.3](https://www.w3.org/TR/odrl-model/#profile-mechanism)
- R108: A permission of a policy must not be typed as a Prohibition or Duty - Violation - [Wiki V22](https://www.w3.org/2016/poe/wiki/Validation#V22._Every_prohibition_must_be_disjoint_with_permissions_and_obligations) - [ODRL 2.2 Section 2.6.1](https://www.w3.org/TR/odrl-model/#permission)
- R109: An obligation of a policy must not be typed as a Permission or Prohibition - Violation - [Wiki V22](https://www.w3.org/2016/poe/wiki/Validation#V22._Every_prohibition_must_be_disjoint_with_permissions_and_obligations) - [ODRL 2.2 Section 2.6.4](https://www.w3.org/TR/odrl-model/#duty-policy)
- R110: A prohibition of a policy must not be typed as a Permission or Duty - Violation - [Wiki V22](https://www.w3.org/2016/poe/wiki/Validation#V22._Every_prohibition_must_be_disjoint_with_permissions_and_obligations) - [ODRL 2.2 Section 2.6.2](https://www.w3.org/TR/odrl-model/#prohibition)
- *R111: A policy must not inherit from itself, directly or indirectly - Violation - [Wiki V24](https://www.w3.org/2016/poe/wiki/Validation#V24._No_policy_can_inherit_directly_or_indirectly_from_itself) - [ODRL 2.2 Section 2.9](https://www.w3.org/TR/odrl-model/#inheritance) - Not implemented*

### Rule
- R09: Every rule in an Offer must have exactly one assigner - Violation - [Wiki V4](https://www.w3.org/2016/poe/wiki/Validation#V4._Every_rule_in_an_offer_must_have_exactly_one_assigner) - [ODRL 2.2 Section 2.1.2](https://www.w3.org/TR/odrl-model/#policy-offer)
- R10: Every rule in an Agreement must have exactly one assigner and one assignee - Violation - [Wiki V5](https://www.w3.org/2016/poe/wiki/Validation#V5._Every_rule_in_an_agreement_must_have_exactly_one_assigner) - [Wiki V6](https://www.w3.org/2016/poe/wiki/Validation#V6._Every_rule_in_an_agreement_must_have_exactly_one_assignee) - [ODRL 2.2 Section 2.1.3](https://www.w3.org/TR/odrl-model/#policy-agreement)
- R11: Every rule must have exactly one action - Violation - [ODRL 2.2 Section 2.6](https://www.w3.org/TR/odrl-model/#rule)
- R12: An action must be a known value, or a blank node with rdf:value and refinement - Violation - [ODRL 2.2 Section 2.4](https://www.w3.org/TR/odrl-model/#action)
- R14: A rule may have at most one target - Violation - [ODRL 2.2 Section 2.2.1](https://www.w3.org/TR/odrl-model/#relation)
- R15: A target must be an Asset or an AssetCollection - Violation - [ODRL 2.2 Section 2.2.1](https://www.w3.org/TR/odrl-model/#relation)
- R16: A target should be typed as odrl:Asset or odrl:AssetCollection - Warning - [ODRL 2.2 Section 2.2.1](https://www.w3.org/TR/odrl-model/#relation)
- R17: A rule may have at most one assignee - Violation - [ODRL 2.2 Section 2.3.1](https://www.w3.org/TR/odrl-model/#function)
- R18: An assignee must conform to the Party or PartyCollection shape - Violation - [ODRL 2.2 Section 2.3.1](https://www.w3.org/TR/odrl-model/#function)
- R19: An assignee should be typed as odrl:Party or odrl:PartyCollection - Warning - [ODRL 2.2 Section 2.3.1](https://www.w3.org/TR/odrl-model/#function)
- R20: A rule may have at most one assigner - Violation - [ODRL 2.2 Section 2.3.1](https://www.w3.org/TR/odrl-model/#function)
- R21: An assigner must conform to the Party or PartyCollection shape - Violation - [ODRL 2.2 Section 2.3.1](https://www.w3.org/TR/odrl-model/#function)
- R22: An assigner should be typed as odrl:Party or odrl:PartyCollection - Warning - [ODRL 2.2 Section 2.3.1](https://www.w3.org/TR/odrl-model/#function)
- R23: Each constraint in a rule must be a valid Constraint or LogicalConstraint - Violation - [ODRL 2.2 Section 2.5.3](https://www.w3.org/TR/odrl-model/#constraint-rule)
- R24: Constraint terms must belong to the ODRL vocabulary or be typed in a loaded profile - Violation - [ODRL 2.2 Section 2.5.1](https://www.w3.org/TR/odrl-model/#constraint-class)
- R25: A permission must have exactly one target - Violation - [Wiki V7](https://www.w3.org/2016/poe/wiki/Validation#V7._Every_rule_must_have_exactly_one_target) - [ODRL 2.2 Section 2.6.1](https://www.w3.org/TR/odrl-model/#permission)
- R26: Each duty of a permission must conform to the Duty shape - Violation - [ODRL 2.2 Section 2.6.5](https://www.w3.org/TR/odrl-model/#duty-perm)
- R27: A prohibition must have exactly one target - Violation - [Wiki V7](https://www.w3.org/2016/poe/wiki/Validation#V7._Every_rule_must_have_exactly_one_target) - [ODRL 2.2 Section 2.6.2](https://www.w3.org/TR/odrl-model/#prohibition)
- R28: Each remedy of a prohibition must conform to the Duty shape - Violation - [ODRL 2.2 Section 2.6.7](https://www.w3.org/TR/odrl-model/#duty-prohib)
- R29: A remedy must not have a consequence - Violation - [Wiki V8](https://www.w3.org/2016/poe/wiki/Validation#V8._No_remedy_can_refer_to_a_duty_that_includes_a_consequence_duty) - [ODRL 2.2 Section 2.6.7](https://www.w3.org/TR/odrl-model/#duty-prohib)
- R30: Each consequence of a duty must conform to the Duty shape - Violation - [ODRL 2.2 Section 2.6.6](https://www.w3.org/TR/odrl-model/#duty-conseq)
- R31: A collection with odrl:refinement must have an odrl:source or rdf:value - Violation - [Wiki V9](https://www.w3.org/2016/poe/wiki/Validation#V9._Every_AssetCollection_with_a_refinement_must_have_a_source) - [Wiki V10](https://www.w3.org/2016/poe/wiki/Validation#V10._Every_PartyCollection_with_a_refinement_must_have_a_odrl:source) - [ODRL 2.2 Section 2.5.5](https://www.w3.org/TR/odrl-model/#constraint-asset) - [ODRL 2.2 Section 2.5.6](https://www.w3.org/TR/odrl-model/#constraint-party)
- R32: An action outside the ODRL vocabulary requires a declared odrl:profile - Violation - [Wiki V12](https://www.w3.org/2016/poe/wiki/Validation#V12._In_absence_of_profile.2C_only_ODRL_actions_can_be_used) - [ODRL 2.2 Section 3.3](https://www.w3.org/TR/odrl-model/#profile-mechanism)
- R33: A constraint term outside the ODRL vocabulary requires a declared odrl:profile - Violation - [Wiki V13](https://www.w3.org/2016/poe/wiki/Validation#V13._In_absence_of_profile.2C_only_ODRL_left_operands_can_be_used) - [Wiki V14](https://www.w3.org/2016/poe/wiki/Validation#V14._In_absence_of_profile.2C_only_ODRL_operators_can_be_used) - [ODRL 2.2 Section 3.3](https://www.w3.org/TR/odrl-model/#profile-mechanism)
- R112: A rule may have at most one uid, and it must be an IRI - Violation - [ODRL 2.2 Section 2.6](https://www.w3.org/TR/odrl-model/#rule)

### Action
- R13: An action must belong to the ODRL vocabulary or be typed as odrl:Action in a loaded profile - Violation - [ODRL 2.2 Section 2.4](https://www.w3.org/TR/odrl-model/#action)
- R34: An action refinement must have exactly one rdf:value - Violation - [ODRL 2.2 Section 2.5.4](https://www.w3.org/TR/odrl-model/#constraint-action)
- R35: odrl:includedIn must be odrl:use or odrl:transfer and appear at most once - Violation - [ODRL 2.2 Section 2.4](https://www.w3.org/TR/odrl-model/#action)
- R113: Each implies value must be an Action - Violation - [ODRL 2.2 Section 2.4](https://www.w3.org/TR/odrl-model/#action)
- R114: Each refinement of an action must be a valid Constraint or LogicalConstraint - Violation - [ODRL 2.2 Section 2.5.4](https://www.w3.org/TR/odrl-model/#constraint-action)

### Constraint
- R36: A constraint must have exactly one leftOperand - Violation - [Wiki V17](https://www.w3.org/2016/poe/wiki/Validation#V17._Every_constraint_must_have_exactly_one_left_operand) - [ODRL 2.2 Section 2.5.1](https://www.w3.org/TR/odrl-model/#constraint-class)
- R37: A constraint must have exactly one operator - Violation - [Wiki V18](https://www.w3.org/2016/poe/wiki/Validation#V18._Every_constraint_must_have_exactly_one_operator) - [ODRL 2.2 Section 2.5.1](https://www.w3.org/TR/odrl-model/#constraint-class)
- R38: A constraint must have either rightOperand or rightOperandReference, but not both and not neither - Violation - [Wiki V16](https://www.w3.org/2016/poe/wiki/Validation#V16._Every_constraint_must_have_exactly_one_right_operand) - [ODRL 2.2 Section 2.5.1](https://www.w3.org/TR/odrl-model/#constraint-class)
- R39: The rightOperand must be a literal, IRI, odrl:RightOperand instance, or a list of these - Violation - [ODRL 2.2 Section 2.5.1](https://www.w3.org/TR/odrl-model/#constraint-class)
- R40: The rightOperandReference must be an IRI or a list of IRIs - Violation - [Wiki V20](https://www.w3.org/2016/poe/wiki/Validation#V20._The_values_of_the_property_rightOperandReference_must_be_URIs) - [ODRL 2.2 Section 2.5.1](https://www.w3.org/TR/odrl-model/#constraint-class)
- R41: The leftOperand must belong to the ODRL vocabulary or be typed as odrl:LeftOperand in a loaded profile - Violation - [ODRL 2.2 Section 3.3](https://www.w3.org/TR/odrl-model/#profile-mechanism)
- R42: The operator must be a standard ODRL operator or be typed as odrl:Operator in a loaded profile - Violation - [ODRL 2.2 Section 3.3](https://www.w3.org/TR/odrl-model/#profile-mechanism)
- R43: A LogicalConstraint must contain exactly one of: odrl:and, odrl:or, odrl:xone, odrl:andSequence - Violation - [Wiki V15](https://www.w3.org/2016/poe/wiki/Validation#V15._In_absence_of_profile.2C_only_ODRL_logical_constraints_can_be_used) - [ODRL 2.2 Section 2.5.2](https://www.w3.org/TR/odrl-model/#constraint-logical)
- R44: Each element of a LogicalConstraint must be a valid Constraint - Violation - [Wiki V19](https://www.w3.org/2016/poe/wiki/Validation#V19._The_values_of_every_logical_constraint_must_be_constraints) - [ODRL 2.2 Section 2.5.2](https://www.w3.org/TR/odrl-model/#constraint-logical)
- R115: A constraint may have at most one uid, and it must be an IRI - Violation - [ODRL 2.2 Section 2.5.1](https://www.w3.org/TR/odrl-model/#constraint-class)
- R116: A constraint may have at most one dataType, and it must be an IRI - Violation - [Wiki V21](https://www.w3.org/2016/poe/wiki/Validation#V21._Every_value_of_the_property_odrl:datatype_must_be_of_type_rdfs:Datatype) - [ODRL 2.2 Section 2.5.1](https://www.w3.org/TR/odrl-model/#constraint-class)
- R117: A constraint may have at most one unit - Violation - [ODRL 2.2 Section 2.5.1](https://www.w3.org/TR/odrl-model/#constraint-class)
- R118: A constraint unit should be an IRI - Warning - [ODRL 2.2 Section 2.5.1](https://www.w3.org/TR/odrl-model/#constraint-class)
- R119: A constraint may have at most one status - Violation - [ODRL 2.2 Section 2.5.1](https://www.w3.org/TR/odrl-model/#constraint-class)
- R120: A LogicalConstraint may have at most one uid, and it must be an IRI - Violation - [ODRL 2.2 Section 2.5.2](https://www.w3.org/TR/odrl-model/#constraint-logical)

### Party
- R99: A party may have at most one uid, and it must be an IRI - Violation - [ODRL 2.2 Section 2.3](https://www.w3.org/TR/odrl-model/#party)
- R100: A party partOf must point to a PartyCollection - Violation - [ODRL 2.2 Section 2.3.2](https://www.w3.org/TR/odrl-model/#party-partof)
- R101: A PartyCollection may have at most one source, and it must be an IRI - Violation - [Wiki V10](https://www.w3.org/2016/poe/wiki/Validation#V10._Every_PartyCollection_with_a_refinement_must_have_a_odrl:source) - [ODRL 2.2 Section 2.3](https://www.w3.org/TR/odrl-model/#party)
- R102: Each refinement of a PartyCollection must be a Constraint or LogicalConstraint - Violation - [ODRL 2.2 Section 2.5.6](https://www.w3.org/TR/odrl-model/#constraint-party)

### Asset
- R103: An asset may have at most one uid, and it must be an IRI - Violation - [ODRL 2.2 Section 2.2](https://www.w3.org/TR/odrl-model/#asset)
- R104: An asset partOf must point to an AssetCollection - Violation - [ODRL 2.2 Section 2.2.2](https://www.w3.org/TR/odrl-model/#asset-partof)
- R105: An AssetCollection may have at most one source, and it must be an IRI - Violation - [Wiki V9](https://www.w3.org/2016/poe/wiki/Validation#V9._Every_AssetCollection_with_a_refinement_must_have_a_source) - [ODRL 2.2 Section 2.2](https://www.w3.org/TR/odrl-model/#asset)
- R106: Each refinement of an AssetCollection must be a Constraint or LogicalConstraint - Violation - [ODRL 2.2 Section 2.5.5](https://www.w3.org/TR/odrl-model/#constraint-asset)
- R121: An asset hasPolicy must point to a Policy IRI - Violation - [ODRL 2.2 Section 2.2.3](https://www.w3.org/TR/odrl-model/#policy-has)

## Constraint operator compatibility

- R45: odrl:absolutePosition is only compatible with eq, gt, gteq, lt, lteq, neq - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-absolutePosition)
- R46: odrl:absoluteSpatialPosition is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-absoluteSpatialPosition)
- R47: odrl:absoluteTemporalPosition is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-absoluteTemporalPosition)
- R48: odrl:absoluteSize is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-absoluteSize)
- R49: odrl:count is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-count)
- R51: odrl:dateTime is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-dateTime)
- R53: odrl:delayPeriod is only compatible with eq, gt, gteq - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-delayPeriod)
- R55: odrl:deliveryChannel is only compatible with eq, neq, isAllOf, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-deliveryChannel)
- R57: odrl:elapsedTime is only compatible with eq, lt, lteq, neq - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-elapsedTime)
- R59: odrl:event is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-event)
- R61: odrl:fileFormat is only compatible with eq, neq, isA, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-fileFormat)
- R63: odrl:industry is only compatible with eq, neq, isA, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-industry)
- R65: odrl:language is only compatible with eq, neq, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-language)
- R67: odrl:media is only compatible with eq, neq, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-media)
- R69: odrl:meteredTime is only compatible with eq, lt, lteq - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-meteredTime)
- R71: odrl:payAmount is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-payAmount)
- R73: odrl:percentage is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-percentage)
- R75: odrl:product is only compatible with eq, neq, isA, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-product)
- R77: odrl:purpose is only compatible with eq, neq, isA, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-purpose)
- R79: odrl:recipient is only compatible with eq, neq, isA, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-recipient)
- R81: odrl:relativePosition is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-relativePosition)
- R82: odrl:relativeSpatialPosition is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-relativeSpatialPosition)
- R83: odrl:relativeTemporalPosition is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-relativeTemporalPosition)
- R84: odrl:relativeSize is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-relativeSize)
- R85: odrl:resolution is only compatible with comparison operators - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-resolution)
- R86: odrl:spatial is only compatible with eq, neq, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-spatial)
- R88: odrl:spatialCoordinates is only compatible with eq, neq - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-spatialCoordinates)
- R89: odrl:systemDevice is only compatible with eq, neq, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-systemDevice)
- R91: odrl:timeInterval is only compatible with eq - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-timeInterval)
- R93: odrl:unitOfCount is only compatible with eq, neq - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-unitOfCount)
- R95: odrl:version is only compatible with eq, neq, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-version)
- R97: odrl:virtualLocation is only compatible with eq, neq, isAnyOf, isNoneOf - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-virtualLocation)

**See requirements included ([compatibility](https://docs.google.com/spreadsheets/d/1DTzZ7HJ0AdfZAZlDA73XC3kHF6jSCQxUuJO_-gCRC_Q/edit?usp=drive_link))**

## Constraint rightOperand values
Each XSD datatype also includes its subtypes (e.g. xsd:integer is an xsd:decimal), see https://www.w3.org/TR/xmlschema11-2/#built-in-datatypes.

- R50: The rightOperand for odrl:count must be an xsd:integer, not negative - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-count)
- R52: The rightOperand for odrl:dateTime must be xsd:date or xsd:dateTime - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-dateTime)
- R54: The rightOperand for odrl:delayPeriod must be an xsd:duration - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-delayPeriod)
- R56: The rightOperand for odrl:deliveryChannel must be an IRI, a string, or a list of these - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-deliveryChannel)
- R58: The rightOperand for odrl:elapsedTime must be an xsd:duration - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-elapsedTime)
- R60: The rightOperand for odrl:event must be an IRI or a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-event)
- R62: The rightOperand for odrl:fileFormat must be an IRI or a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-fileFormat)
- R64: The rightOperand for odrl:industry must be an IRI or a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-industry)
- R66: The rightOperand for odrl:language must be a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-language)
- R68: The rightOperand for odrl:media must be a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-media)
- R70: The rightOperand for odrl:meteredTime must be an xsd:duration - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-meteredTime)
- R72: The rightOperand for odrl:payAmount must be an xsd:decimal - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-payAmount)
- R74: The rightOperand for odrl:percentage must be an xsd:decimal between 0 and 100 - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-percentage)
- R76: The rightOperand for odrl:product must be an IRI or a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-product)
- R78: The rightOperand for odrl:purpose must be an IRI or a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-purpose)
- R80: The rightOperand for odrl:recipient must be an IRI or a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-recipient)
- R87: The rightOperand for odrl:spatial must be an IRI or a list of IRIs - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-spatial)
- R90: The rightOperand for odrl:systemDevice must be an IRI or a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-systemDevice)
- R92: The rightOperand for odrl:timeInterval must be an xsd:duration - Violation - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-timeInterval)
- R94: The rightOperand for odrl:unitOfCount must be a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-unitOfCount)
- R96: The rightOperand for odrl:version must be a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-version)
- R98: The rightOperand for odrl:virtualLocation must be a string - Warning - [Vocab](https://www.w3.org/TR/odrl-vocab/#term-virtualLocation)

## Profiles
Terms outside the ODRL vocabulary need a declared profile.

- R122: A declared profile that is not loaded is reported, because its terms are not validated - Warning - [ODRL 2.2 Section 3.3](https://www.w3.org/TR/odrl-model/#profile-mechanism)

## Inconsistencies
Conflicts between rules, detected with N3 rules after the validation.

- I1: A duty and a prohibition with the same assignee, target and action constitute a conflict - Conflict - **New**
- I2: A permission and a prohibition with the same assignee, target and action constitute a conflict - Conflict - **New**
- I3: Two constraints in the same rule with the same left operand and the eq operator must not have different right operands, as the rule could never be satisfied - Conflict - **New**


## Cardinality ODRL model for atomic policies


| Class | Property | Cardinality | Type | Level |
|---|---|---|---|---|
| **Policy** | `uid` | 1 | IRI | MUST |
| Policy | `permission` / `prohibition` / `obligation` | ≥1 (across the three) | Rule | MUST |
| Policy | `profile` | 0..n | IRI | MAY (MUST if non-Core terms are used) |
| Policy | `inheritFrom` | 0..n | IRI | MAY |
| Policy | `conflict` | 0..1 | ConflictTerm | MAY (default `invalid`) |
| **Offer** | `assigner` | 1 | Party | MUST |
| **Agreement** | `assigner` | 1 | Party | MUST |
| Agreement | `assignee` | 1 | Party | MUST |
| **Asset** | `uid` | 0..1 | IRI | SHOULD |
| Asset | `partOf` | 0..n | AssetCollection | MAY |
| **AssetCollection** | `source` | 0..1 | IRI | MAY |
| AssetCollection | `refinement` | 0..n | Constraint | MAY |
| **Party** | `uid` | 0..1 | IRI | SHOULD |
| Party | `partOf` | 0..n | PartyCollection | MAY |
| **PartyCollection** | `source` | 0..1 | IRI | MAY |
| PartyCollection | `refinement` | 0..n | Constraint | MAY |
| **Action** | `refinement` | 0..n | Constraint | MAY |
| Action | `includedIn` | 1 (except `use` / `transfer`) | Action | MUST |
| Action | `implies` | 0..n | Action | MAY |
| **Constraint** | `uid` | 0..1 | IRI | MAY |
| Constraint | `leftOperand` | 1 | LeftOperand | MUST |
| Constraint | `operator` | 1 | Operator | MUST |
| Constraint | `rightOperand` XOR `rightOperandReference` | 1 (one or the other, never both) | literal / IRI / RightOperand (or list, for set operators) | MUST |
| Constraint | `dataType` | 0..1 | datatype | MAY |
| Constraint | `unit` | 0..1 | IRI | MAY |
| Constraint | `status` | 0..1 | value | MAY |
| **LogicalConstraint** | `uid` | 0..1 | IRI | MAY |
| LogicalConstraint | `operand` | 1 (list) | list of Constraint | MUST |
| **Rule** | `action` | 1 | Action | MUST |
| Rule | `relation` (sub-property) | 0..1 | Asset | MAY |
| Rule | `function` (sub-property) | 0..n | Party | MAY |
| Rule | `failure` (sub-property) | 0..n | Rule | MAY |
| Rule | `constraint` | 0..n | Constraint / LogicalConstraint | MAY |
| Rule | `uid` | 0..1 | IRI | MAY |
| **Permission** | `target` | 1 | Asset | MUST |
| Permission | `assigner` | 0..1 | Party | MAY |
| Permission | `assignee` | 0..1 | Party | MAY |
| Permission | `duty` | 0..n | Duty | MAY |
| **Prohibition** | `target` | 1 | Asset | MUST |
| Prohibition | `assigner` | 0..1 | Party | MAY |
| Prohibition | `assignee` | 0..1 | Party | MAY |
| Prohibition | `remedy` | 0..n | Duty | MAY |
| **Duty** | `target` | 0..1 | Asset | MAY |
| Duty | `assigner` | 0..1 | Party | MAY |
| Duty | `assignee` | 0..1 | Party | MAY |
| Duty | `consequence` | 0..n | Duty | MAY (only if referenced by `duty` / `obligation`) |
