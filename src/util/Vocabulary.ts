import { createVocabulary } from 'rdf-vocabulary';

// custom vocabulary for Inconsistency Detection
export const DETECTION = createVocabulary('https://w3id.org/force/detection#',
    'Conflict',
    'DeonticConflict',
    'ConstraintConflict',
    'rules',
    'reason'
)

export const SH = createVocabulary('http://www.w3.org/ns/shacl#',
    'in',
    'property',
    'path',
    'targetClass');
 
export const RDF = createVocabulary('http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    'first',
    'rest',
    'nil',
    'type');
 
export const RDFS = createVocabulary('http://www.w3.org/2000/01/rdf-schema#',
    'subClassOf');
 
// Only the terms the profile mechanism needs.
export const ODRL = createVocabulary('http://www.w3.org/ns/odrl/2/',
    'Action',
    'LeftOperand',
    'Operator',
    'ConflictTerm',
    'Rule',
    'Policy',
    'leftOperand',
    'operator',
    'conflict');
 
