export const DPV_ODRL_PROFILE: string = `@prefix dct: <http://purl.org/dc/terms/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix dpv: <https://w3id.org/dpv#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix tech: <https://w3id.org/dpv/tech#> .
@prefix pd: <https://w3id.org/dpv/pd#> .
@prefix vann: <http://purl.org/vocab/vann/> .
@prefix profile: <http://www.w3.org/ns/dx/prof/> .
@prefix dpv-odrl: <https://w3id.org/dpv/mappings/odrl#> .

<https://w3id.org/dpv/mappings/odrl> a owl:Ontology, profile:Profile ;
  profile:isProfileOf odrl:core ;
  profile:hasResource dpv-odrl:profile-html, dpv-odrl:profile-ttl ;
  dct:title "Mapping from DPV to ODRL"@en ;
  vann:preferredNamespacePrefix "dpv-odrl" ;
  vann:preferredNamespaceUri "https://w3id.org/dpv/mappings/odrl#" ;
  rdfs:label "Mapping from DPV to ODRL"@en ;
  dct:created "2025-01-16"^^xsd:date ;
  dct:modified "2026-10-26"^^xsd:date ;
  dct:issued "2026-10-26"^^xsd:date ;
  dct:creator "Beatriz Esteves", "Harshvardhan J. Pandit" ;
  dct:publisher "Beatriz Esteves" ;
  dct:abstract "The 'Mapping from DPV to ODRL' uses the Open Digital Rights Language (ODRL) to define usage control policies that express permissions, prohibitions and duties associated with data and digital services and utilises the Data Privacy Vocabulary (DPV) as a controlled vocabulary for invoking privacy and data protection-specific terms."@en ;
  dct:description "The 'Mapping from DPV to ODRL' uses the Open Digital Rights Language (ODRL) to define usage control policies that express permissions, prohibitions and duties associated with data and digital services and utilises the Data Privacy Vocabulary (DPV) as a controlled vocabulary for invoking privacy and data protection-specific terms."@en ;
  rdfs:comment "This is the RDF ontology for the Mapping from DPV to ODRL."@en ;
  dct:bibliographicCitation "Cite this vocabulary as: Esteves, B., Pandit, H. J. (2026). Bridging DPV and ODRL for Legally-Oriented Usage Control in Data Spaces. (Accepted to be Published) Fourth International Workshop on Semantics in Dataspaces (SDS 2026)"@en ;
  <http://www.w3.org/2003/06/sw-vocab-status/ns#term_status> "stable"@en ;
  dct:source odrl:, <https://w3id.org/dpv> ;
  dct:license <https://www.w3.org/community/about/process/cla/> .

dpv-odrl:profile-html a profile:ResourceDescriptor ;
  dct:title "Mapping from DPV to ODRL HTML specification"@en ;
  profile:hasRole <http://www.w3.org/ns/dx/prof/role/specification> ;
  profile:hasArtifact <https://w3c-cg.github.io/dpv/mappings/odrl/> ;
  dct:format <https://www.iana.org/assignments/media-types/text/html> ;
  dct:conformsTo <https://www.w3.org/TR/html/> .

dpv-odrl:profile-ttl a profile:ResourceDescriptor ;
  dct:title "Mapping from DPV to ODRL Turtle vocabulary"@en ;
  profile:hasRole <http://www.w3.org/ns/dx/prof/role/vocabulary> ;
  profile:hasArtifact <https://w3c-cg.github.io/dpv/mappings/odrl/dpv-odrl.ttl> ;
  dct:format <https://www.iana.org/assignments/media-types/text/turtle> ;
  dct:conformsTo <https://www.w3.org/TR/turtle/> .

dpv-odrl:entityPartyConcepts a skos:Collection ;
  skos:prefLabel "DPV entities mapping terms"@en ;
  skos:scopeNote "Mapping from DPV to ODRL terms"@en ;
  skos:member dpv-odrl:Entity, dpv-odrl:Agent, dpv-odrl:LegalEntity, dpv-odrl:HumanSubject, dpv-odrl:Organisation, dpv-odrl:Recipient, dpv-odrl:Actor .

dpv-odrl:Entity a odrl:Party, odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Entity .

dpv-odrl:Agent a odrl:Party, odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Agent .

dpv-odrl:LegalEntity a odrl:Party, odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:LegalEntity .

dpv-odrl:HumanSubject a odrl:Party, odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:HumanSubject .

dpv-odrl:Organisation a odrl:Party, odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Organisation .

dpv-odrl:Recipient a odrl:Party, odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Recipient ;
  skos:broader odrl:recipient .

dpv-odrl:Actor a odrl:Party, odrl:LeftOperand, skos:Concept ;
  skos:exactMatch tech:Actor .

dpv-odrl:processingActionConcepts a skos:Collection ;
  skos:prefLabel "DPV processing mapping terms"@en ;
  skos:scopeNote "Mapping from DPV to ODRL terms"@en ;
  skos:member dpv-odrl:Processing, dpv-odrl:Tracking, dpv-odrl:Aggregate, dpv-odrl:Anonymise, dpv-odrl:Delete, dpv-odrl:Derive, dpv-odrl:Display, dpv-odrl:Modify, dpv-odrl:Move, dpv-odrl:Transfer, dpv-odrl:Transform, dpv-odrl:Use .

dpv-odrl:Processing a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Processing .

dpv-odrl:Tracking a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Tracking ;
  skos:related odrl:acceptTracking .

dpv-odrl:Aggregate a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Aggregate ;
  skos:related odrl:aggregate .

dpv-odrl:Anonymise a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Anonymise ;
  skos:related odrl:anonymize .

dpv-odrl:Delete a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Delete ;
  skos:related odrl:delete .

dpv-odrl:Derive a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Derive ;
  skos:related odrl:derive .

dpv-odrl:Display a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Display ;
  skos:related odrl:display .

dpv-odrl:Modify a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Modify ;
  skos:related odrl:modify .

dpv-odrl:Move a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Move ;
  skos:related odrl:move .

dpv-odrl:Transfer a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Transfer ;
  skos:related odrl:transfer .

dpv-odrl:Transform a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Transform ;
  skos:related odrl:transform .

dpv-odrl:Use a skos:Concept, odrl:Action ;
  skos:exactMatch dpv:Use ;
  skos:related odrl:use .

dpv-odrl:dataAssetConcepts a skos:Collection ;
  skos:prefLabel "DPV data mapping terms"@en ;
  skos:scopeNote "Mapping from DPV to ODRL terms"@en ;
  skos:member dpv-odrl:Data, dpv-odrl:PersonalData, dpv-odrl:Age, dpv-odrl:Gender, dpv-odrl:Nationality, dpv-odrl:DataSource .

dpv-odrl:Data a odrl:LeftOperand, skos:Concept, odrl:Asset ;
  skos:exactMatch dpv:Data .

dpv-odrl:PersonalData a odrl:LeftOperand, skos:Concept, odrl:Asset ;
  skos:exactMatch dpv:PersonalData .

dpv-odrl:Age a odrl:LeftOperand, skos:Concept, odrl:Asset ;
  skos:exactMatch pd:Age .

dpv-odrl:Gender a odrl:LeftOperand, skos:Concept, odrl:Asset ;
  skos:exactMatch pd:Gender .

dpv-odrl:Nationality a odrl:LeftOperand, skos:Concept, odrl:Asset ;
  skos:exactMatch pd:Nationality .

dpv-odrl:DataSource a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:DataSource .

dpv-odrl:techAssetConcepts a skos:Collection ;
  skos:prefLabel "DPV technology mapping terms"@en ;
  skos:scopeNote "Mapping from DPV to ODRL terms"@en ;
  skos:member dpv-odrl:Technology .

dpv-odrl:Technology a odrl:LeftOperand, skos:Concept, odrl:Asset ;
  skos:exactMatch dpv:Technology .

dpv-odrl:Purpose a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Purpose ;
  skos:broader odrl:purpose .

dpv-odrl:TechnicalOrganisationalMeasure a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:TechnicalOrganisationalMeasure .

dpv-odrl:TechnicalMeasure a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:TechnicalMeasure .

dpv-odrl:OrganisationalMeasure a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:OrganisationalMeasure .

dpv-odrl:LegalMeasure a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:LegalMeasure .

dpv-odrl:PhysicalMeasure a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:PhysicalMeasure .

dpv-odrl:RiskMitigationMeasure a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:RiskMitigationMeasure .

dpv-odrl:Location a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Location ;
  skos:broader odrl:spatial .

dpv-odrl:Law a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Law .

dpv-odrl:LegalBasis a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:LegalBasis .

dpv-odrl:ConsentControl a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:ConsentControl .

dpv-odrl:ContractControl a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:ContractControl .

dpv-odrl:Duration a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Duration ;
  skos:related odrl:elapsedTime, odrl:count .

dpv-odrl:Frequency a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Frequency ;
  skos:related odrl:timeInterval .

dpv-odrl:Right a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Right .

dpv-odrl:Justification a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Justification .

dpv-odrl:Risk a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Risk .

dpv-odrl:RiskLevel a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:RiskLevel .

dpv-odrl:RiskControl a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:RiskControl .

dpv-odrl:Likelihood a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Likelihood .

dpv-odrl:Severity a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Severity .

dpv-odrl:Consequence a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Consequence .

dpv-odrl:Impact a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Impact .

dpv-odrl:Sector a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Sector .

dpv-odrl:Status a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Status .

dpv-odrl:AutomationLevel a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:AutomationLevel .

dpv-odrl:EntityInvolvement a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:EntityInvolvement .

dpv-odrl:HumanInvolvement a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:HumanInvolvement .

dpv-odrl:ProcessingLocation a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:ProcessingLocation .

dpv-odrl:Scale a odrl:LeftOperand, skos:Concept ;
  skos:exactMatch dpv:Scale .

dpv-odrl:leftOperandConcepts a skos:Collection ;
  skos:prefLabel "Left operand terms"@en ;
  skos:scopeNote "Mapping from DPV to ODRL terms"@en ;
  skos:member dpv-odrl:Purpose, dpv-odrl:TechnicalOrganisationalMeasure, dpv-odrl:TechnicalMeasure, dpv-odrl:OrganisationalMeasure, dpv-odrl:LegalMeasure, dpv-odrl:PhysicalMeasure, dpv-odrl:RiskMitigationMeasure, dpv-odrl:Location, dpv-odrl:Law, dpv-odrl:LegalBasis, dpv-odrl:ConsentControl, dpv-odrl:ContractControl, dpv-odrl:Duration, dpv-odrl:Frequency, dpv-odrl:Right, dpv-odrl:Justification, dpv-odrl:Risk, dpv-odrl:RiskLevel, dpv-odrl:RiskControl, dpv-odrl:Likelihood, dpv-odrl:Severity, dpv-odrl:Consequence, dpv-odrl:Impact, dpv-odrl:Sector, dpv-odrl:Status, dpv-odrl:AutomationLevel, dpv-odrl:EntityInvolvement, dpv-odrl:HumanInvolvement, dpv-odrl:ProcessingLocation, dpv-odrl:Scale .

dpv-odrl:rulesConcepts a skos:Collection ;
  skos:prefLabel "Rule terms"@en ;
  skos:scopeNote "Mapping from DPV to ODRL terms"@en ;
  skos:member dpv-odrl:Permission, dpv-odrl:Prohibition, dpv-odrl:Obligation .

dpv-odrl:Permission skos:exactMatch dpv:Permission ;
  skos:closeMatch odrl:Permission .

dpv-odrl:Prohibition skos:exactMatch dpv:Prohibition ;
  skos:closeMatch odrl:Prohibition .

dpv-odrl:Obligation skos:exactMatch dpv:Obligation ;
  skos:closeMatch odrl:Duty .

dpv-odrl:policiesConcepts a skos:Collection ;
  skos:prefLabel "Policy terms"@en ;
  skos:scopeNote "Mapping from DPV to ODRL terms"@en ;
  skos:member dpv-odrl:ContractAmendmentClause, dpv-odrl:ContractConfidentialityClause, dpv-odrl:ContractDisputeResolutionClause, dpv-odrl:ContractJurisdictionClause, dpv-odrl:ContractTerminationClause, dpv-odrl:TermsOfService, dpv-odrl:DataHandlingClause, dpv-odrl:LegalAgreement, dpv-odrl:ConfidentialityAgreement, dpv-odrl:NDA, dpv-odrl:StatisticalConfidentialityAgreement .

dpv-odrl:ContractAmendmentClause a skos:Concept, rdfs:Class, owl:Class ;
  skos:exactMatch dpv:ContractAmendmentClause ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith dpv-odrl:ContractConfidentialityClause, dpv-odrl:ContractDisputeResolutionClause, dpv-odrl:ContractJurisdictionClause, dpv-odrl:ContractTerminationClause, dpv-odrl:TermsOfService, dpv-odrl:DataHandlingClause, dpv-odrl:LegalAgreement, dpv-odrl:ConfidentialityAgreement, dpv-odrl:NDA, dpv-odrl:StatisticalConfidentialityAgreement, odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .

dpv-odrl:ContractConfidentialityClause a skos:Concept, rdfs:Class, owl:Class ;
  skos:exactMatch dpv:ContractConfidentialityClause ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith dpv-odrl:ContractAmendmentClause, dpv-odrl:ContractDisputeResolutionClause, dpv-odrl:ContractJurisdictionClause, dpv-odrl:ContractTerminationClause, dpv-odrl:TermsOfService, dpv-odrl:DataHandlingClause, dpv-odrl:LegalAgreement, dpv-odrl:ConfidentialityAgreement, dpv-odrl:NDA, dpv-odrl:StatisticalConfidentialityAgreement, odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .

dpv-odrl:ContractDisputeResolutionClause a skos:Concept, rdfs:Class, owl:Class ;
  skos:exactMatch dpv:ContractDisputeResolutionClause ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith dpv-odrl:ContractAmendmentClause, dpv-odrl:ContractConfidentialityClause, dpv-odrl:ContractJurisdictionClause, dpv-odrl:ContractTerminationClause, dpv-odrl:TermsOfService, dpv-odrl:DataHandlingClause, dpv-odrl:LegalAgreement, dpv-odrl:ConfidentialityAgreement, dpv-odrl:NDA, dpv-odrl:StatisticalConfidentialityAgreement, odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .

dpv-odrl:ContractJurisdictionClause a skos:Concept, rdfs:Class, owl:Class ;
  skos:exactMatch dpv:ContractJurisdictionClause ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith dpv-odrl:ContractAmendmentClause, dpv-odrl:ContractConfidentialityClause, dpv-odrl:ContractDisputeResolutionClause, dpv-odrl:ContractTerminationClause, dpv-odrl:TermsOfService, dpv-odrl:DataHandlingClause, dpv-odrl:LegalAgreement, dpv-odrl:ConfidentialityAgreement, dpv-odrl:NDA, dpv-odrl:StatisticalConfidentialityAgreement, odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .

dpv-odrl:ContractTerminationClause a skos:Concept, rdfs:Class, owl:Class ;
  skos:exactMatch dpv:ContractTerminationClause ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith dpv-odrl:ContractAmendmentClause, dpv-odrl:ContractConfidentialityClause, dpv-odrl:ContractDisputeResolutionClause, dpv-odrl:ContractJurisdictionClause, dpv-odrl:TermsOfService, dpv-odrl:DataHandlingClause, dpv-odrl:LegalAgreement, dpv-odrl:ConfidentialityAgreement, dpv-odrl:NDA, dpv-odrl:StatisticalConfidentialityAgreement, odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .

dpv-odrl:TermsOfService a skos:Concept, rdfs:Class, owl:Class ;
  skos:exactMatch dpv:TermsOfService ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith dpv-odrl:ContractAmendmentClause, dpv-odrl:ContractConfidentialityClause, dpv-odrl:ContractDisputeResolutionClause, dpv-odrl:ContractJurisdictionClause, dpv-odrl:ContractTerminationClause, dpv-odrl:DataHandlingClause, dpv-odrl:LegalAgreement, dpv-odrl:ConfidentialityAgreement, dpv-odrl:NDA, dpv-odrl:StatisticalConfidentialityAgreement, odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .

dpv-odrl:DataHandlingClause a skos:Concept, rdfs:Class, owl:Class ;
  skos:exactMatch dpv:DataHandlingClause ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith dpv-odrl:ContractAmendmentClause, dpv-odrl:ContractConfidentialityClause, dpv-odrl:ContractDisputeResolutionClause, dpv-odrl:ContractJurisdictionClause, dpv-odrl:ContractTerminationClause, dpv-odrl:TermsOfService, dpv-odrl:LegalAgreement, dpv-odrl:ConfidentialityAgreement, dpv-odrl:NDA, dpv-odrl:StatisticalConfidentialityAgreement, odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .

dpv-odrl:LegalAgreement a skos:Concept, rdfs:Class, owl:Class ;
  skos:exactMatch dpv:LegalAgreement ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith dpv-odrl:ContractAmendmentClause, dpv-odrl:ContractConfidentialityClause, dpv-odrl:ContractDisputeResolutionClause, dpv-odrl:ContractJurisdictionClause, dpv-odrl:ContractTerminationClause, dpv-odrl:TermsOfService, dpv-odrl:DataHandlingClause, dpv-odrl:ConfidentialityAgreement, dpv-odrl:NDA, dpv-odrl:StatisticalConfidentialityAgreement, odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .

dpv-odrl:ConfidentialityAgreement a skos:Concept, rdfs:Class, owl:Class ;
  skos:exactMatch dpv:ConfidentialityAgreement ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith dpv-odrl:ContractAmendmentClause, dpv-odrl:ContractConfidentialityClause, dpv-odrl:ContractDisputeResolutionClause, dpv-odrl:ContractJurisdictionClause, dpv-odrl:ContractTerminationClause, dpv-odrl:TermsOfService, dpv-odrl:DataHandlingClause, dpv-odrl:LegalAgreement, dpv-odrl:NDA, dpv-odrl:StatisticalConfidentialityAgreement, odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .

dpv-odrl:NDA a skos:Concept, rdfs:Class, owl:Class ;
  skos:exactMatch dpv:NDA ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith dpv-odrl:ContractAmendmentClause, dpv-odrl:ContractConfidentialityClause, dpv-odrl:ContractDisputeResolutionClause, dpv-odrl:ContractJurisdictionClause, dpv-odrl:ContractTerminationClause, dpv-odrl:TermsOfService, dpv-odrl:DataHandlingClause, dpv-odrl:LegalAgreement, dpv-odrl:ConfidentialityAgreement, dpv-odrl:StatisticalConfidentialityAgreement, odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .

dpv-odrl:StatisticalConfidentialityAgreement a skos:Concept, rdfs:Class, owl:Class ;
  skos:exactMatch dpv:StatisticalConfidentialityAgreement ;
  rdfs:subClassOf odrl:Policy ;
  owl:disjointWith dpv-odrl:ContractAmendmentClause, dpv-odrl:ContractConfidentialityClause, dpv-odrl:ContractDisputeResolutionClause, dpv-odrl:ContractJurisdictionClause, dpv-odrl:ContractTerminationClause, dpv-odrl:TermsOfService, dpv-odrl:DataHandlingClause, dpv-odrl:LegalAgreement, dpv-odrl:ConfidentialityAgreement, dpv-odrl:NDA, odrl:Agreement, odrl:Offer, odrl:Privacy, odrl:Request, odrl:Ticket, odrl:Assertion .
`