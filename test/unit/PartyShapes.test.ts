import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';

// Expected message per requirement
const MESSAGES = {
    R100: 'A Party must be partOf a PartyCollection, not an Asset or AssetCollection.',
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
        expect(await validate(wrongType)).toEqual({ valid: false, messages: [ MESSAGES.R100 ] });
    });
});

// Expected message per requirement
const PARTY_MESSAGES = {
    R99: 'A Party may have one uid, and it must be an IRI.',
    R101: 'A PartyCollection may have one source, and it must be an IRI.',
    R102: 'Each PartyCollection refinement must be a Constraint or LogicalConstraint.',
};

// The assignee of the rule is party1, the triples of each case describe it
function partyPolicy(triples: string): string {
    return `
    @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
    @prefix : <http://example.com/> .

    :policy1 a odrl:Set ; odrl:permission :permission1 .
    :permission1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assignee :party1 .
    :asset1 a odrl:Asset .

    ${triples}
    `;
}

async function validateParty(triples: string) {
    const result = await new ODRLValidator().validate(new Parser().parse(partyPolicy(triples)));
    return { valid: result.valid, messages: result.validationResults.map(r => r.message) };
}

describe('The party requirements', () => {

    // [requirement, party]
    test.each([
        [ '', ':party1 a odrl:Party ; odrl:uid :party1 .' ],
        [ 'R101', ':party1 a odrl:PartyCollection ; odrl:source :employees .' ],
        [ 'R102', ':party1 a odrl:PartyCollection ; odrl:source :employees ; odrl:refinement [ odrl:leftOperand odrl:industry ; odrl:operator odrl:eq ; odrl:rightOperand :publishing ] .' ],
    ])('%s: a valid party is accepted (%s).', async (_, triples) => {
        expect(await validateParty(triples)).toEqual({ valid: true, messages: [] });
    });

    // [requirement, party that breaks it]
    test.each([
        [ 'R99', ':party1 a odrl:Party ; odrl:uid :uid1, :uid2 .' ],
        [ 'R99', ':party1 a odrl:Party ; odrl:uid "party1" .' ],
        [ 'R101', ':party1 a odrl:PartyCollection ; odrl:source "employees" .' ],
        [ 'R102', ':party1 a odrl:PartyCollection ; odrl:source :employees ; odrl:refinement [ odrl:leftOperand odrl:industry ; odrl:rightOperand :publishing ] .' ],
    ])('%s: %s is reported.', async (requirement, triples) => {
        const result = await validateParty(triples);

        expect(result.valid).toBe(false);
        expect(result.messages).toContain(PARTY_MESSAGES[requirement as keyof typeof PARTY_MESSAGES]);
    });
});
