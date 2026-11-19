import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';

// Expected message per requirement
const MESSAGES = {
    R34: 'An action refinement must have one rdf:value.',
    R35: 'The value of odrl:includedIn should be either odrl:use or odrl:transfer.',
    R113: 'Each implies value should be an Action.',
    R114: 'An action with refinement must have a valid refinement.',
};

// The action of the rule is described by the triples of each case
function policy(action: string, triples = ''): string {
    return `
    @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
    @prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
    @prefix : <http://example.com/> .

    :policy1 a odrl:Set ; odrl:permission :permission1 .
    :permission1 a odrl:Permission ; odrl:action ${action} ; odrl:target :asset1 .
    :asset1 a odrl:Asset .

    ${triples}
    `;
}

async function validate(action: string, triples?: string) {
    const result = await new ODRLValidator().validate(new Parser().parse(policy(action, triples)));
    return { valid: result.valid, messages: result.validationResults.map(r => r.message) };
}

describe('The action shapes', () => {

    // [requirement, action, triples]
    test.each([
        [ '', 'odrl:print', '' ],
        [ 'R34', '[ rdf:value odrl:print ; odrl:refinement [ odrl:leftOperand odrl:resolution ; odrl:operator odrl:lteq ; odrl:rightOperand 1200 ] ]', '' ],
        [ 'R35', 'odrl:print', 'odrl:print odrl:includedIn odrl:use .' ],
        [ 'R113', 'odrl:share', 'odrl:share odrl:implies odrl:distribute .' ],
    ])('%s: a valid action is accepted (%s %s).', async (_, action, triples) => {
        expect(await validate(action, triples)).toEqual({ valid: true, messages: [] });
    });

    // [requirement, action, triples that break it]
    test.each([
        [ 'R34', '[ odrl:refinement [ odrl:leftOperand odrl:resolution ; odrl:operator odrl:lteq ; odrl:rightOperand 1200 ] ]', '' ],
        [ 'R34', '[ rdf:value odrl:print, odrl:display ; odrl:refinement [ odrl:leftOperand odrl:resolution ; odrl:operator odrl:lteq ; odrl:rightOperand 1200 ] ]', '' ],
        [ 'R35', 'odrl:print', 'odrl:print odrl:includedIn odrl:display .' ],
        [ 'R35', 'odrl:print', 'odrl:print odrl:includedIn odrl:use, odrl:transfer .' ],
        [ 'R113', 'odrl:print', 'odrl:print odrl:implies :myAction .' ],
        [ 'R114', '[ rdf:value odrl:print ; odrl:refinement [ odrl:leftOperand odrl:resolution ; odrl:rightOperand 1200 ] ]', '' ],
    ])('%s: %s %s is reported.', async (requirement, action, triples) => {
        const result = await validate(action, triples);

        expect(result.valid).toBe(false);
        expect(result.messages).toContain(MESSAGES[requirement as keyof typeof MESSAGES]);
    });
});
