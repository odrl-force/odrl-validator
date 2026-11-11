import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';
import { SHAPES } from '../../src/shapes/Shapes';
import { addProfileToShape } from '../../src/profiles/Profile';
import { TOSL_PROFILE } from '../../src/profiles/ToslProfile';

// Example policies modelled with TOSL: one file per clause or rule of the contract, plus the full contract.
const EXAMPLES_DIR = join(__dirname, '..', '..', 'data', 'profiles', 'tosl');
const EXAMPLES = [ 'elsevier', 'openai' ].flatMap((dir): string[] => readdirSync(join(EXAMPLES_DIR, dir))
    .filter((file): boolean => file.endsWith('.ttl')).sort().map((file): string => `${dir}/${file}`));

function parse(file: string) {
    return new Parser({ baseIRI: 'http://example.com/' }).parse(readFileSync(join(EXAMPLES_DIR, file), 'utf8'));
}

describe('The TOSL profile', () => {

    const validator = new ODRLValidator({
        shape: addProfileToShape(new Parser().parse(SHAPES), new Parser().parse(TOSL_PROFILE)),
    });

    // A TOSL term that the profile does not add would be a violation, so a valid result means the profile works.
    test.each(EXAMPLES)('validates the example %s.', async (file) => {
        const result = await validator.validate(parse(file));

        expect(result.valid).toBe(true);
    });
});
