import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';
import { SHAPES } from '../../src/shapes/Shapes';
import { addProfileToShape } from '../../src/profiles/Profile';
import { DPV_ODRL_PROFILE } from '../../src/profiles/DpvOdrlProfile';

// Example policies of the DPV-ODRL mapping, see data/profiles/odrl-dpv/README.md
const EXAMPLES_DIR = join(__dirname, '..', '..', 'data', 'profiles', 'odrl-dpv');
const EXAMPLES = readdirSync(EXAMPLES_DIR).filter((file): boolean => file.endsWith('.ttl')).sort();

function parse(file: string) {
    return new Parser({ baseIRI: 'http://example.com/' }).parse(readFileSync(join(EXAMPLES_DIR, file), 'utf8'));
}

describe('The DPV profile', () => {

    const validator = new ODRLValidator({
        shape: addProfileToShape(new Parser().parse(SHAPES), new Parser().parse(DPV_ODRL_PROFILE)),
    });

    // A DPV term that the profile does not add would be a violation, so a valid result means the profile works.
    test.each(EXAMPLES)('validates the example %s.', async (file) => {
        const result = await validator.validate(parse(file));

        expect(result.valid).toBe(true);
    });
});
