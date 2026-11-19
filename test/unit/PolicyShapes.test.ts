import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';

const MESSAGES = {
    R01: 'No valid policy provided',
    R02: 'Policies must have at least one permission, obligation or prohibition.',
    R03: 'Policies must be identified by an IRI.',
    R04: 'A Policy may have one uid, and it must be an IRI.',
    R05: 'Profile must be an IRI.',
    R06: 'inheritFrom must reference an existing odrl:Policy.',
    R07: 'Conflict strategy must appear at most once and be a ConflictTerm: odrl:perm, odrl:prohibit, or odrl:invalid.',
    R08: 'The conflict strategy must be odrl:perm, odrl:prohibit or odrl:invalid, or a conflict term defined in a loaded profile.',
    R107: 'The policy type must be an ODRL policy class, or a subclass of odrl:Policy defined in a loaded profile.',
    R108: 'A permission must be an odrl:Permission, not a Prohibition or Duty.',
    R109: 'An obligation must be an odrl:Duty, not a Permission or Prohibition.',
    R110: 'A prohibition must be an odrl:Prohibition, not a Permission or Duty.',
};

// Policy template
function policy(triples: string): string {
    return `
    @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
    @prefix : <http://example.com/> .

    ${triples}

    :permission1 a odrl:Permission ; 
        odrl:action odrl:use ; 
        odrl:target :asset1 .
    :asset1 a odrl:Asset .
    `;
}

async function validate(triples: string) {
    const result = await new ODRLValidator().validate(new Parser().parse(policy(triples)));
    return { valid: result.valid, messages: result.validationResults.map(r => r.message) };
}

describe('The policy shapes', () => {

    // [requirement, valid policy]
    test.each([
        [ '', ':policy1 a odrl:Set ; odrl:permission :permission1 .' ],
        [ 'R04', ':policy1 a odrl:Set ; odrl:permission :permission1 ; odrl:uid :policy1 .' ],
        [ 'R06', ':policy1 a odrl:Set ; odrl:permission :permission1 ; odrl:inheritFrom :policy2 . :policy2 a odrl:Policy ; odrl:permission :permission1 .' ],
        [ 'R06', ':policy1 a odrl:Set ; odrl:permission :permission1 ; odrl:inheritFrom :policy2 . :policy2 a odrl:Set ; odrl:permission :permission1 .' ],
        [ 'R07', ':policy1 a odrl:Set ; odrl:permission :permission1 ; odrl:conflict odrl:perm .' ],
        [ 'R107', ':policy1 a odrl:Offer ; odrl:permission :permission1 . :permission1 odrl:assigner :alice . :alice a odrl:Party .' ],
        [ 'R108', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 .' ],
        [ 'R108', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 odrl:action odrl:use ; odrl:target :asset1 .' ],
        [ 'R109', ':policy1 a odrl:Set ; odrl:obligation :rule1 . :rule1 a odrl:Duty ; odrl:action odrl:compensate .' ],
        [ 'R109', ':policy1 a odrl:Set ; odrl:obligation :rule1 . :rule1 odrl:action odrl:compensate .' ],
        [ 'R110', ':policy1 a odrl:Set ; odrl:prohibition :rule1 . :rule1 a odrl:Prohibition ; odrl:action odrl:distribute ; odrl:target :asset1 .' ],
        [ 'R110', ':policy1 a odrl:Set ; odrl:prohibition :rule1 . :rule1 odrl:action odrl:distribute ; odrl:target :asset1 .' ],
    ])('%s: a valid policy is accepted (%s).', async (_, triples) => {
        expect(await validate(triples)).toEqual({ valid: true, messages: [] });
    });

    // [requirement, invalid policy]
    test.each([
        [ 'R01', ':asset2 a odrl:Asset .' ],
        [ 'R02', ':policy1 a odrl:Set .' ],
        [ 'R03', '[] a odrl:Set ; odrl:permission :permission1 .' ],
        [ 'R04', ':policy1 a odrl:Set ; odrl:permission :permission1 ; odrl:uid :uid1, :uid2 .' ],
        [ 'R04', ':policy1 a odrl:Set ; odrl:permission :permission1 ; odrl:uid "policy1" .' ],
        [ 'R05', ':policy1 a odrl:Set ; odrl:permission :permission1 ; odrl:profile "myProfile" .' ],
        [ 'R06', ':policy1 a odrl:Set ; odrl:permission :permission1 ; odrl:inheritFrom :asset1 .' ],
        [ 'R07', ':policy1 a odrl:Set ; odrl:permission :permission1 ; odrl:conflict odrl:perm, odrl:prohibit .' ],
        [ 'R08', ':policy1 a odrl:Set ; odrl:permission :permission1 ; odrl:conflict :myStrategy .' ],
        [ 'R107', ':policy0 a odrl:Set ; odrl:permission :permission1 . :policy1 a :MyPolicy ; odrl:permission :permission1 .' ],
        [ 'R108', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Prohibition ; odrl:action odrl:use ; odrl:target :asset1 .' ],
        [ 'R109', ':policy1 a odrl:Set ; odrl:obligation :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:compensate ; odrl:target :asset1 .' ],
        [ 'R110', ':policy1 a odrl:Set ; odrl:prohibition :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:distribute ; odrl:target :asset1 .' ],
    ])('%s: %s is reported.', async (requirement, triples) => {
        const result = await validate(triples);

        expect(result.valid).toBe(false);
        expect(result.messages).toContain(MESSAGES[requirement as keyof typeof MESSAGES]);
    });
});
