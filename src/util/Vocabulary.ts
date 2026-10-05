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
    'path');

export const RDF = createVocabulary('http://www.w3.org/1999/02/22-rdf-syntax-ns#', 
    'first', 
    'rest', 
    'nil', 
    'type');