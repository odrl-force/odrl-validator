import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';
import { SHAPES } from '../../src/shapes/Shapes';
import { addProfileToShape } from '../../src/profiles/Profile';
import { TOSL_PROFILE } from '../../src/profiles/ToslProfile';

// Example policies modelled with TOSL. One file per clause of the contract.
const EXAMPLES_DIR = join(__dirname, '..', '..', 'data', 'profiles', 'tosl', 'elsevier');
const EXAMPLES = readdirSync(EXAMPLES_DIR).filter((file): boolean => file.endsWith('.ttl')).sort();

// Warnings given when a term is not in the ODRL vocabulary: with the TOSL profile, TOSL terms must not cause them.
const VOCABULARY_WARNINGS = [
    'Action is neither part of the ODRL Vocabulary nor typed as odrl:Action.',
    'The constraint leftOperand should be part of the ODRL vocabulary or typed as odrl:LeftOperand.',
];

function parse(file: string) {
    return new Parser({ baseIRI: 'http://example.com/' }).parse(readFileSync(join(EXAMPLES_DIR, file), 'utf8'));
}

describe('The TOSL profile', () => {

    const validator = new ODRLValidator({
        shape: addProfileToShape(new Parser().parse(SHAPES), new Parser().parse(TOSL_PROFILE)),
    });

    test.each(EXAMPLES)('validates the Elsevier example %s.', async (file) => {
        const result = await validator.validate(parse(file));

        expect(result.valid).toBe(true);
        expect(result.validationResults.filter((r): boolean => VOCABULARY_WARNINGS.includes(r.message))).toEqual([]);
    });
});
