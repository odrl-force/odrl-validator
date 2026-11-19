import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';

// Expected message
const MESSAGES = {
    partOf: 'An Asset must be partOf an AssetCollection, not a Party or PartyCollection.',
};

// Parametric test function for creating a valid and invalid policy
function policy(type: string): string {
    return `
    @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
    @prefix : <http://example.com/> .

    :policy1 a odrl:Policy ;
        odrl:permission :permission1 .

    :permission1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 .
    :asset1 a odrl:Asset ; odrl:partOf :collection1 .
    ${type ? `:collection1 a ${type} .` : ''}
    `;
}

async function validate(type: string) {
    const result = await new ODRLValidator().validate(new Parser().parse(policy(type)));
    return { valid: result.valid, messages: result.validationResults.map(r => r.message) };
}

describe('The asset shapes', () => {

    // With a correct type
    test('an Asset partOf an AssetCollection is accepted.', async () => {
        expect(await validate('odrl:AssetCollection')).toEqual({ valid: true, messages: [] });
    });

    // Without a type
    test('an Asset partOf a collection without a type is accepted.', async () => {
        expect(await validate('')).toEqual({ valid: true, messages: [] });
    });

    // With a wrong type
    test.each([ 'odrl:Party', 'odrl:PartyCollection' ])('an Asset partOf a %s is reported.', async (wrongType) => {
        expect(await validate(wrongType)).toEqual({ valid: false, messages: [ MESSAGES.partOf ] });
    });
});
