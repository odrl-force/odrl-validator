import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';

// Expected message per requirement
const MESSAGES = {
    R104: 'An Asset must be partOf an AssetCollection, not a Party or PartyCollection.',
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
        expect(await validate(wrongType)).toEqual({ valid: false, messages: [ MESSAGES.R104 ] });
    });
});

// Expected message per requirement
const ASSET_MESSAGES = {
    R103: 'An Asset may have one uid, and it must be an IRI.',
    R105: 'An AssetCollection may have one source, and it must be an IRI.',
    R106: 'Each AssetCollection refinement must be a Constraint or LogicalConstraint.',
};

// The target of the rule is asset1, the triples of each case describe it
function assetPolicy(triples: string): string {
    return `
    @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
    @prefix : <http://example.com/> .

    :policy1 a odrl:Set ; odrl:permission :permission1 .
    :permission1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 .

    ${triples}
    `;
}

async function validateAsset(triples: string) {
    const result = await new ODRLValidator().validate(new Parser().parse(assetPolicy(triples)));
    return { valid: result.valid, messages: result.validationResults.map(r => r.message) };
}

describe('The asset requirements', () => {

    // [requirement, asset]
    test.each([
        [ '', ':asset1 a odrl:Asset ; odrl:uid :asset1 .' ],
        [ 'R105', ':asset1 a odrl:AssetCollection ; odrl:source :catalogue .' ],
        [ 'R106', ':asset1 a odrl:AssetCollection ; odrl:source :catalogue ; odrl:refinement [ odrl:leftOperand odrl:count ; odrl:operator odrl:lt ; odrl:rightOperand 10 ] .' ],
        // The normalization (N1) turns hasPolicy into the target of the rules, so it is not checked
        [ 'R121', ':asset1 a odrl:Asset . :asset2 a odrl:Asset ; odrl:hasPolicy "policy1" .' ],
    ])('%s: a valid asset is accepted (%s).', async (_, triples) => {
        expect(await validateAsset(triples)).toEqual({ valid: true, messages: [] });
    });

    // [requirement, asset that breaks it]
    test.each([
        [ 'R103', ':asset1 a odrl:Asset ; odrl:uid :uid1, :uid2 .' ],
        [ 'R103', ':asset1 a odrl:Asset ; odrl:uid "asset1" .' ],
        [ 'R105', ':asset1 a odrl:AssetCollection ; odrl:source "catalogue" .' ],
        [ 'R106', ':asset1 a odrl:AssetCollection ; odrl:source :catalogue ; odrl:refinement [ odrl:leftOperand odrl:count ; odrl:rightOperand 10 ] .' ],
    ])('%s: %s is reported.', async (requirement, triples) => {
        const result = await validateAsset(triples);

        expect(result.valid).toBe(false);
        expect(result.messages).toContain(ASSET_MESSAGES[requirement as keyof typeof ASSET_MESSAGES]);
    });
});
