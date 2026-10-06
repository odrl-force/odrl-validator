export const TOSL_PROFILE: string = String.raw`@prefix dct: <http://purl.org/dc/terms/> .
@prefix odrl: <http://www.w3.org/ns/odrl/2/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix tosl: <https://w3id.org/tosl/> .
@prefix vann: <http://purl.org/vocab/vann/> .
@prefix profile: <http://www.w3.org/ns/dx/prof/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

tosl: a owl:Ontology, profile:Profile ;
  profile:isProfileOf odrl:core ;
  rdfs:comment "This is the RDF ontology for the ODLR profile Terms of Service language" ;
  rdfs:label "ODLR Terms of Service Language Profile Version 1" ;
  dct:abstract "An ontology designed to represent contractual terms in Software-as-a-Service (SaaS) Terms of Service (ToS)" ;
  dct:contributor "ISAGroup" ;
  dct:created "2024-11-27"^^xsd:date ;
  dct:creator "Elena Molino", "Jose Maria Cruz", "Jose Maria Garcia", "Antonio Ruiz" ;
  dct:description "The ODLR Profile for Terms of Service Language (TOSL) enhances the understanding and enforcement of legal terms within service agreements. Utilizing the Open Digital Rights Language (ODLR), this profile specifies the obligations, rights, and prohibitions contained in agreements to effectively identify and flag potentially unfair terms. By integrating ODLR's flexible framework, the TSL profile aims to ensure clearer, more enforceable, and fairer terms of service agreements across diverse digital platforms." ;
  dct:license <https://dalicc.net/licenselibrary/CC-BY-4.0> ;
  dct:title "Terms of Service Language Ontology" ;
  dct:modified "2025-03-25"^^xsd:date ;
  vann:preferredNamespacePrefix "tosl" ;
  vann:preferredNamespaceUri "https://w3id.org/tosl/" ;
  owl:versionInfo "1" .

tosl:onDispute a owl:ObjectProperty, skos:Concept ;
  rdfs:label "On Dispute" ;
  rdfs:domain odrl:Policy ;
  rdfs:range tosl:DisputeResolution ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Represents the relationship between a Policy and its associated Dispute Resolution mechanism, specifying how, where, and under which law disputes arising under the Policy will be resolved" .

tosl:DisputeResolution a skos:Concept, owl:Class, rdfs:Class ;
  rdfs:label "Dispute Resolution" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Employed to specify the mechanisms for resolving disputes among the parties involved in the agreement" .

tosl:condition a owl:ObjectProperty, skos:Concept ;
  rdfs:label "Has Condition" ;
  rdfs:domain tosl:DisputeResolution ;
  rdfs:range [
    a owl:Class ;
    owl:unionOf (odrl:Constraint odrl:LogicalConstraint)
  ] ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This relationship enables the specification of particular restrictions that apply to the dispute" .

tosl:governedBy a owl:ObjectProperty, skos:Concept ;
  rdfs:label "Governed By" ;
  rdfs:domain tosl:DisputeResolution ;
  rdfs:range tosl:Law ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Establishes the connection to the specific legal framework that governs the agreement" .

tosl:Law a skos:Concept, owl:Class, rdfs:Class ;
  rdfs:label "Law" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Law refers to the specific statutes and regulations that govern an agreement and are applicable in resolving any disputes arising from it" .

tosl:liability a owl:ObjectProperty, skos:Concept ;
  rdfs:label "With Liability" ;
  rdfs:domain odrl:Policy, odrl:Asset, odrl:Rule ;
  rdfs:range tosl:Liability ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Establishes the relationship between a rule, policy or asset and the applicable liabilities, describing the duties or obligations to be assumed in a specific context" .

tosl:Liability a skos:Concept, owl:Class, rdfs:Class ;
  rdfs:label "Liability" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Liability refers to the specific provisions that define and restrict the extent to which each party in the agreement can be held accountable for damages or losses" .

tosl:liableParty a owl:ObjectProperty, skos:Concept ;
  rdfs:label "Liable Party" ;
  rdfs:domain tosl:Liability ;
  rdfs:range odrl:Party ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This term establishes the connection between liability and a party to whom they apply" .

tosl:targetParty a owl:ObjectProperty, skos:Concept ;
  rdfs:label "Target Party" ;
  rdfs:domain tosl:DisputeResolution, tosl:Liability ;
  rdfs:range odrl:Party ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Specifies the type of party to which the liability or dispute resolution provision is intended to apply." .

tosl:limitation a owl:ObjectProperty, skos:Concept ;
  rdfs:label "Has Limitation" ;
  rdfs:domain tosl:Liability ;
  rdfs:range [
    a owl:Class ;
    owl:unionOf (odrl:Constraint odrl:LogicalConstraint)
  ] ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Defines a relationship that allows specifying particular restrictions or conditions related to the limitation of liabilities of a party" .

tosl:limitationOfLiability a owl:ObjectProperty, skos:Concept ;
  rdfs:label "With Limitation Of Liability" ;
  rdfs:domain odrl:Policy, odrl:Asset, odrl:Rule ;
  rdfs:range tosl:Liability ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Defines the relationship that links a rule, policy or asset to the limitations of liability applicable to one or more parties, specifying the scope and restrictions in cases of damages or breaches" .

tosl:requires a owl:ObjectProperty, skos:Concept ;
  rdfs:label "Requires" ;
  rdfs:domain tosl:Litigation ;
  rdfs:range tosl:Arbitration ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This relationship specifies that all disputes must be resolved through arbitration" .

tosl:Litigation a skos:Concept, owl:Class, rdfs:Class ;
  rdfs:label "Litigation" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Litigation is a legal process in which the provider or customer, acting as the plaintiff, initiates proceedings against the other party, called the defendant, before a civil court in a settlement dispute" ;
  rdfs:subClassOf tosl:DisputeResolution .

tosl:Arbitration a skos:Concept, owl:Class, rdfs:Class ;
  rdfs:label "Arbitration" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Arbitration is a process for resolving disputes without recourse to conventional judicial systems, typically managed by an arbitrator" ;
  rdfs:subClassOf tosl:DisputeResolution .

tosl:takesPlaceIn a owl:ObjectProperty, skos:Concept ;
  rdfs:label "Takes Place In" ;
  rdfs:domain tosl:DisputeResolution ;
  rdfs:range tosl:Jurisdiction ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This term describes the relationship between Dispute Resolution and Jurisdiction, specifying the location where disputes are to be resolved" .

tosl:Jurisdiction a skos:Concept, owl:Class, rdfs:Class ;
  rdfs:label "Jurisdiction" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Jurisdiction refers to the specific location or legal authority where a dispute must be resolved" .

tosl:trigger a owl:ObjectProperty, skos:Concept ;
  rdfs:label "Trigger" ;
  rdfs:domain odrl:Permission ;
  rdfs:range odrl:Duty ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Represents the relationship where a permission can trigger a specific duty for a party" .

tosl:Customer a skos:Concept, owl:Class, rdfs:Class ;
  rdfs:label "Customer" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "A party that uses the service, typically for non-commercial or general purposes." ;
  rdfs:subClassOf odrl:Party .

tosl:BusinessCustomer a skos:Concept, owl:Class, rdfs:Class ;
  rdfs:label "Business Customer" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "A customer who uses the service as part of their business operations or commercial activities." ;
  rdfs:subClassOf tosl:Customer .

tosl:Provider a skos:Concept, owl:Class, rdfs:Class ;
  rdfs:label "Provider" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "A party that offers, manages, or delivers the service." ;
  rdfs:subClassOf odrl:Party .

tosl:Service a skos:Concept, owl:Class, rdfs:Class ;
  rdfs:label "Service" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "An asset that includes the service affected by the action as a resource" ;
  rdfs:subClassOf odrl:Asset .

tosl:UserContent a skos:Concept, owl:Class, rdfs:Class ;
  rdfs:label "User Content" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "An asset that encompasses either all or part of a user's content" ;
  rdfs:subClassOf odrl:Asset .

tosl:procedure a skos:Concept, odrl:Action ;
  rdfs:label "Procedural Action" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "A procedural or administrative action not directly tied to the functional use or transfer of an asset." .

tosl:remove a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Remove" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This action may authorize, obligate, or prohibit the deletion of content from the provided services" ;
  odrl:includedIn odrl:use .

tosl:consent a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Consent" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This action signifies your acceptance of the associated asset" ;
  odrl:includedIn odrl:use .

tosl:allowDownload a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Allow Download" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Allow download refers to the action that permits one of the parties, typically the client, to download personal information or information about contracted services" ;
  odrl:includedIn odrl:use .

tosl:terminate a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Terminate" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This action permits the termination of an asset, whether it be the agreement, services, or any other associated entity" ;
  odrl:includedIn odrl:use .

tosl:publish a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Publish" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This action mandates the public release of an asset" ;
  odrl:includedIn odrl:use .

tosl:integrate a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Integrate" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This action allows, obligates, or prohibits the integration of the provided service with your application." ;
  odrl:includedIn odrl:use .

tosl:develop a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Develop" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This action permits, mandates or prohibits the use of the services to develop a software application." ;
  odrl:includedIn odrl:use .

tosl:evaluate a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Evaluate" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This action permits, mandates, or prohibits evaluating the output or performance of a service or model, including assessments for accuracy, fairness, or safety." ;
  odrl:includedIn odrl:use .

tosl:test a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Test" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This action permits, mandates or prohibits the use of the services to test a software application." ;
  odrl:includedIn odrl:use .

tosl:claim a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Claim" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "To submit a formal request or complaint regarding a perceived infringement or violation, typically related to legal or policy matters." ;
  odrl:includedIn tosl:procedure .

tosl:appeal a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Appeal" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "The user may submit a formal appeal to contest the suspension or termination of their account." ;
  odrl:includedIn tosl:procedure .

tosl:assign a skos:Concept, odrl:Action, owl:NamedIndividual ;
  rdfs:label "Assign" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "To assign or transfer rights and/or obligations under an agreement to another party, such as an affiliate, subsidiary, or successor." ;
  odrl:includedIn odrl:transfer .

tosl:anyLiability a skos:Concept, tosl:Liability, owl:NamedIndividual ;
  rdfs:label "Any Liability" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This liability provision specifies that the designated party may or may not be held liable for damages caused by the other party." .

tosl:physicalInjuries a skos:Concept, tosl:Liability, owl:NamedIndividual ;
  rdfs:label "Physical Injuries" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This provision outlines the liability of the party in cases of physical damages caused to the other party" .

tosl:harmCausedByMalware a skos:Concept, tosl:Liability, owl:NamedIndividual ;
  rdfs:label "Harm Caused By Malware" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "The party is or not is responsible for any damages resulting from malware" .

tosl:discontinuity a skos:Concept, tosl:Liability, owl:NamedIndividual ;
  rdfs:label "Discontinuity" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "The party is not liable for any technical problems, failure, inability to use the services, suspension, disruption, modification, or discontinuance." .

tosl:anyIndirectDamage a skos:Concept, tosl:Liability, owl:NamedIndividual ;
  rdfs:label "Any Indirect Damage" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "The party is not liable for any special, indirect, punitive, incidental, or consequential damages." .

tosl:directDamage a skos:Concept, tosl:Liability, owl:NamedIndividual ;
  rdfs:label "Direct Damage" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "The party is liable for any direct damages." .

tosl:anyLoss a skos:Concept, tosl:Liability, owl:NamedIndividual ;
  rdfs:label "Any Loss" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "The party is not liable for any disclosure, damage, destruction, corruption, failure to store, or loss of data and material." .

tosl:thirdParty a skos:Concept, tosl:Liability, owl:NamedIndividual ;
  rdfs:label "Third Party Responsibility" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "The party is not liable for any action, errors, omissions, representations, warranties, breaches, or negligence owed to third parties." .

tosl:serviceContent a skos:Concept, tosl:Liability, owl:NamedIndividual ;
  rdfs:label "Service Content Liability" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "The party is not liable for any information stored or processed within the services, or for inaccuracies or errors of information, or for content and material posted, software, products, and services on the website." .

tosl:breachOfContract a skos:Concept, tosl:Liability, owl:NamedIndividual, odrl:RightOperand ;
  rdfs:label "Breach of Contract" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "The party is not liable for any failure to perform the contract or fulfill terms and obligations, including unavailability or failure to deliver products and services, or breach of agreement or lack of performance.", "This term refers to a violation or non-fulfillment of the terms as stipulated within the Policy. With the left operand odrl:event, it can be used in the constraint of a Rule that only can be exercised in case of such a breach" .

tosl:legalCompliance a skos:Concept, tosl:Liability, owl:NamedIndividual ;
  rdfs:label "Legal Compliance" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Except as required by law, or to the fullest extent permissible by applicable law, the provider is not liable. Users are solely responsible for ensuring that the Terms of Use or Service comply with all laws, rules, and regulations, and the use of the platform is at their own risk." .

tosl:justification a skos:Concept, owl:NamedIndividual, odrl:LeftOperand ;
  rdfs:label "Justification" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This condition mandates that specific actions can only be undertaken with appropriate justification" .

tosl:totalAmount a skos:Concept, owl:NamedIndividual, odrl:LeftOperand ;
  rdfs:label "Calculate Amount" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This stipulates the amount derived from a previous metric or calculation, which is used to compare against a specified threshold, such as a maximum or minimum allowable amount, in the context of a constraint." .

tosl:inactivityPeriod a skos:Concept, owl:NamedIndividual, odrl:LeftOperand ;
  rdfs:label "Inactivity Period" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This stipulates the duration of time a service may remain inactive or unused, serving as a parameter for triggering specific actions or evaluating compliance with constraints." .

tosl:consumerResidentCountry a skos:Concept, owl:NamedIndividual, odrl:LeftOperand ;
  rdfs:label "Consumer Resident Country" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This stipulates the country of residence of the consumer, used to compare against a list of countries in the context of constraints or conditions." .

tosl:consentType a skos:Concept, owl:NamedIndividual, odrl:LeftOperand ;
  rdfs:label "Consent Type" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This term refers to the specific manner in which consent is given by a party within an agreement, outlining whether it is implicit, explicit, or expressed through other defined actions" .

tosl:compliance a skos:Concept, owl:NamedIndividual, odrl:LeftOperand ;
  rdfs:label "Compliance" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This left operand refers to the adherence to an specific rule or policy. I can be used to refine the semantics of an action that has to be performed in accordance to another policy. Permited values are and IRI, a odrl:Policy or an xsd:string" .

tosl:licensingType a skos:Concept, owl:NamedIndividual, odrl:LeftOperand ;
  rdfs:label "Licensing Type" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This stipulates the type of license or permission required by a party to perform a specific action or activity, such as a written permission." .

tosl:effect a skos:Concept, owl:NamedIndividual, odrl:LeftOperand ;
  rdfs:label "Effect" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This stipulates the effect or impact that an action may or must not cause, serving as a parameter to evaluate the outcomes of an action." .

tosl:implicitConsent a skos:Concept, owl:NamedIndividual, odrl:RightOperand ;
  rdfs:label "Implicit Consent" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This type of consent implies that by merely utilizing the service, the customer agrees to the terms of the agreement by default" .

tosl:writtenPermission a skos:Concept, owl:NamedIndividual, odrl:RightOperand ;
  rdfs:label "Written Permission" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "A formal, documented authorisation required for a party to perform a specified action." .

tosl:explicitConsent a skos:Concept, owl:NamedIndividual, odrl:RightOperand ;
  rdfs:label "Explicit Consent" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This form of consent requires that the customer explicitly affirm or accept the agreement through a formal action, such as signing a document" .

tosl:degradation a skos:Concept, owl:NamedIndividual, odrl:RightOperand ;
  rdfs:label "Degradation" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Indicates a significant and unreasonable degradation of some metric, such as response time or availability, caused by the action of the Rule to the target of the Rule" .

tosl:consumerPlaceCourts a skos:Concept, tosl:Jurisdiction, owl:NamedIndividual ;
  rdfs:label "Consumer Place Courts" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Represents the jurisdiction corresponding to the place of residence of the consumer, typically used in B2C contexts for dispute resolution." .

tosl:consumerPlaceLaw a skos:Concept, tosl:Law, owl:NamedIndividual ;
  rdfs:label "Consumer Place Law" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "Refers to the legal framework applicable in the consumer's country of residence, often used for governing agreements in consumer protection contexts." .

tosl:californiaLaw a skos:Concept, tosl:Law, owl:NamedIndividual ;
  rdfs:label "California Law" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "This instance denotes that the governing law applicable to the agreement is that of California" .

tosl:europeanLaw a skos:Concept, tosl:Law, owl:NamedIndividual ;
  rdfs:label "European Law" ;
  rdfs:isDefinedBy tosl: ;
  skos:definition "this stipulates that the law regulating the agreement is European law" .
`