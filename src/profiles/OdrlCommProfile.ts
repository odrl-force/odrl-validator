export const ODRL_COMM_PROFILE: string = `@prefix dct: <http://purl.org/dc/terms/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix vann: <http://purl.org/vocab/vann/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

odrl: a owl:Ontology ;
  rdfs:label "ODRL Community Vocabulary"@en ;
  owl:versionInfo "0.1" ;
  dct:created "2024-08-10"^^xsd:date ;
  dct:modified "2026-03-02"^^xsd:date ;
  dct:creator "Beatriz Esteves", "Renato Iannella" ;
  dct:contributor "W3C ODRL Community Group" ;
  dct:publisher "W3C ODRL Community Group" ;
  dct:description "This ontology contains a community-supplied set of general terms that are useful across difference use cases where the usage of ODRL policies is desirable."@en ;
  vann:preferredNamespacePrefix "odrl-comm"@en ;
  vann:preferredNamespaceUri "http://www.w3.org/ns/odrl/2/" ;
  dct:conformsTo <https://www.w3.org/TR/odrl-model/> ;
  dct:license <https://www.w3.org/Consortium/Legal/2002/ipr-notice-20021231#Copyright/> .

<http://www.w3.org/ns/odrl/2/#policySubClassesCommunity> a skos:Collection ;
  skos:prefLabel "Policy Community Subclasses"@en ;
  skos:scopeNote "ODRL Community Vocabulary Terms"@en ;
  skos:member odrl:Preference .

odrl:Preference a skos:Concept, rdfs:Class, owl:Class ;
  rdfs:label "Preference Policy"@en ;
  rdfs:isDefinedBy odrl: ;
  rdfs:comment "A Preference Policy is a policy that contains information about the assigner's preferences over an Asset which MAY not be satisfied."@en ;
  skos:definition "A Preference Policy is a policy that contains information about the assigner's preferences over an Asset which MAY not be satisfied."@en ;
  dct:source <https://github.com/w3c/odrl/issues/21>, <https://w3id.org/oac#Preference> ;
  skos:example "If a preference policy set by a party A does not match a request from party B, the request can still be accepted if party A accepts party B's request conditions."@en ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .

<http://www.w3.org/ns/odrl/2/#partyRolesCommunity> a skos:Collection ;
  skos:prefLabel "Party Community Functions"@en ;
  skos:scopeNote "ODRL Community Vocabulary Terms"@en ;
  skos:member odrl:issuedPolicy .

odrl:issuedPolicy a skos:Concept, rdf:Property, owl:ObjectProperty ;
  rdfs:label "Issued policy"@en ;
  rdfs:isDefinedBy odrl: ;
  rdfs:comment "Indicates that a Party issued a Policy."@en ;
  skos:definition "Indicates that a Party issued a Policy."@en ;
  dct:source <https://github.com/w3c/odrl/issues/21> ;
  skos:example "Method used to indicate that a party, e.g., Alice, has issued a policy, e.g., related to her preferences for data sharing."@en ;
  rdfs:domain odrl:Party ;
  rdfs:range odrl:Policy .

<http://www.w3.org/ns/odrl/2/#actionsCommunity> a skos:Collection ;
  skos:prefLabel "Community Actions for Rules"@en ;
  skos:scopeNote "ODRL Community Vocabulary Terms"@en ;
  skos:member odrl:create .

odrl:create a skos:Concept, odrl:Action ;
  rdfs:label "Create"@en ;
  rdfs:isDefinedBy odrl: ;
  rdfs:comment "To create the Asset."@en ;
  skos:definition "To create the Asset."@en ;
  dct:source <https://github.com/w3c/odrl/issues/35> .

<http://www.w3.org/ns/odrl/2/#constraintRelationalOperatorsCommunity> a skos:Collection ;
  skos:prefLabel "Community Constraint Operators"@en ;
  skos:scopeNote "ODRL Community Vocabulary Terms"@en ;
  skos:member odrl:isNotA, odrl:typeOf .

odrl:isNotA a skos:Concept, odrl:Operator, owl:NamedIndividual ;
  rdfs:label "Is not a"@en ;
  rdfs:isDefinedBy odrl: ;
  rdfs:comment "Indicates that a given value is not an instance of the Right Operand of the Constraint."@en ;
  skos:definition "Indicates that a given value is not an instance of the Right Operand of the Constraint."@en ;
  dct:source <https://github.com/w3c/odrl/issues/27>, <https://w3id.org/oac#isNotA> ;
  skos:example "The purpose constraint of a rule can not be an instance of academic research purpose."@en .

odrl:typeOf a skos:Concept, odrl:Operator, owl:NamedIndividual ;
  rdfs:label "Type of"@en ;
  rdfs:isDefinedBy odrl: ;
  rdfs:comment "Indicates that a given value is of a similar type of the Right Operand of the Constraint."@en ;
  skos:definition "Indicates that a given value is of a similar type of the Right Operand of the Constraint."@en ;
  dct:source <https://github.com/w3c/odrl/issues/28>, <https://w3id.org/oac#semantic>, <https://w3id.org/aiup#seq>, <https://w3id.org/oac#subclass> ;
  skos:example "The purpose constraint of a rule can be a subclass of research and development such as academic research, non-commercial research or commercial research."@en .

<http://www.w3.org/ns/odrl/2/#constraintLeftOperandsCommunity> a skos:Collection ;
  skos:prefLabel "Community Constraint Left Operands"@en ;
  skos:scopeNote "ODRL Community Vocabulary Terms"@en ;
  skos:member odrl:payPercentage .

odrl:payPercentage a skos:Concept, owl:NamedIndividual, odrl:LeftOperand ;
  rdfs:label "Payment Percentage"@en ;
  rdfs:isDefinedBy odrl: ;
  rdfs:comment "The payment is a percentage of the transaction amount."@en ;
  skos:definition "The payment is a percentage of the transaction amount."@en ;
  dct:source <https://github.com/w3c/odrl/issues/148> .
`