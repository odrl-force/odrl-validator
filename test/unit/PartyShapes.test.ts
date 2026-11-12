import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';

// Expected message
const MESSAGES = {
    partOf: 'A Party must be partOf a PartyCollection, not an Asset or AssetCollection.',
};

// Parametric test function for creating a valid and invalid policy
function policy(type: string): string {
    return `
    @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
    @prefix : <http://example.com/> .

    :policy1 a odrl:Policy ;
        odrl:permission :permission1 .

    :permission1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assignee :party1 .
    :asset1 a odrl:Asset .
    :party1 a odrl:Party ; odrl:partOf :collection1 .
    ${type ? `:collection1 a ${type} .` : ''}
    `;
}

async function validate(type: string) {
    const result = await new ODRLValidator().validate(new Parser().parse(policy(type)));
    return { valid: result.valid, messages: result.validationResults.map(r => r.message) };
}

describe('The party shapes', () => {

    // With a correct type
    test('a Party partOf a PartyCollection is accepted.', async () => {
        expect(await validate('odrl:PartyCollection')).toEqual({ valid: true, messages: [] });
    });

    // Without a type
    test('a Party partOf a collection without a type is accepted.', async () => {
        expect(await validate('')).toEqual({ valid: true, messages: [] });
    });

    // With a wrong type
    test.each([ 'odrl:Asset', 'odrl:AssetCollection' ])('a Party partOf a %s is reported.', async (wrongType) => {
        expect(await validate(wrongType)).toEqual({ valid: false, messages: [ MESSAGES.partOf ] });
    });
});
