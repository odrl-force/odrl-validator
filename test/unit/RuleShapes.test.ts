import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';

const MESSAGES = {
    R09: 'An Offer rule must have one assigner.',
    R10: 'An Agreement rule must have one assignee.',
    R11: 'A Rule must have one action.',
    R12: 'Action should be a supported action or a blank node with rdf:value and odrl:refinement.',
    R13: 'Action is neither part of the ODRL Vocabulary nor typed as odrl:Action in a profile.',
    R15: 'Target should be a supported asset or a blank node with rdf:value.',
    R16: 'Target should be a Asset or AssetCollection.',
    R18: 'Assignee should be a supported party or a blank node with rdf:value.',
    R19: 'The assignee should be a Party or PartyCollection.',
    R21: 'Assigner should be a supported party or a blank node with rdf:value.',
    R22: 'The assigner should be a Party or PartyCollection.',
    R23: 'Each constraint must conform to ODRL constraint or ODRL logical constraint.',
    R24: 'The constraint leftOperand should be part of the ODRL vocabulary or typed as odrl:LeftOperand in a profile.',
    R25: 'A Permission must have one odrl:target.',
    R26: 'A duty must be an odrl:Duty, not a Permission or Prohibition.',
    R27: 'A Prohibition must have one odrl:target.',
    R28: 'A remedy must be an odrl:Duty, not a Permission or Prohibition.',
    R29: 'A remedy must not have a consequence.',
    R30: 'A consequence must be an odrl:Duty, not a Permission or Prohibition.',
    R31: 'A collection with refinement must have one source.',
    R32: 'An action outside the ODRL vocabulary requires a declared odrl:profile.',
    R33: 'A constraint term (leftOperand/operator) outside the ODRL vocabulary requires a declared odrl:profile.',
    R112: 'A Rule may have one uid, and it must be an IRI.',
};

// Policy template
function policy(triples: string): string {
    return `
    @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
    @prefix : <http://example.com/> .

    ${triples}

    :asset1 a odrl:Asset .
    :alice a odrl:Party .
    :bob a odrl:Party .
    `;
}

async function validate(triples: string) {
    const result = await new ODRLValidator().validate(new Parser().parse(policy(triples)));
    return { valid: result.valid, messages: result.validationResults.map(r => r.message) };
}

describe('The rule shapes', () => {

    // [requirement, valid policy]
    test.each([
        [ '', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assigner :alice ; odrl:assignee :bob .' ],
        // The normalization (N5) splits the rule into one rule per action, target, assignee or assigner
        [ 'R11', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use, odrl:print ; odrl:target :asset1 .' ],
        [ 'R14', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1, :asset2 . :asset2 a odrl:Asset .' ],
        [ 'R17', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assignee :alice, :bob .' ],
        [ 'R20', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assigner :alice, :bob .' ],
        [ 'R26', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:duty :rule2 . :rule2 a odrl:Duty ; odrl:action odrl:compensate .' ],
        [ 'R26', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:duty :rule2 . :rule2 odrl:action odrl:compensate .' ],
        [ 'R28', ':policy1 a odrl:Set ; odrl:prohibition :rule1 . :rule1 a odrl:Prohibition ; odrl:action odrl:print ; odrl:target :asset1 ; odrl:remedy :rule2 . :rule2 a odrl:Duty ; odrl:action odrl:delete .' ],
        [ 'R28', ':policy1 a odrl:Set ; odrl:prohibition :rule1 . :rule1 a odrl:Prohibition ; odrl:action odrl:print ; odrl:target :asset1 ; odrl:remedy :rule2 . :rule2 odrl:action odrl:delete .' ],
        [ 'R30', ':policy1 a odrl:Set ; odrl:obligation :rule1 . :rule1 a odrl:Duty ; odrl:action odrl:compensate ; odrl:consequence :rule2 . :rule2 a odrl:Duty ; odrl:action odrl:inform .' ],
        [ 'R30', ':policy1 a odrl:Set ; odrl:obligation :rule1 . :rule1 a odrl:Duty ; odrl:action odrl:compensate ; odrl:consequence :rule2 . :rule2 odrl:action odrl:inform .' ],
    ])('%s: a valid policy is accepted (%s).', async (_, triples) => {
        expect(await validate(triples)).toEqual({ valid: true, messages: [] });
    });

    // [requirement, invalid policy]
    test.each([
        [ 'R09', ':policy1 a odrl:Offer ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 .' ],
        [ 'R10', ':policy1 a odrl:Agreement ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assigner :alice .' ],
        [ 'R11', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:target :asset1 .' ],
        [ 'R12', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action "use" ; odrl:target :asset1 .' ],
        [ 'R13', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action :myAction ; odrl:target :asset1 .' ],
        [ 'R15', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset2 . :asset2 a odrl:Asset ; odrl:uid "asset2" .' ],
        [ 'R18', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assignee :carol . :carol a odrl:Party ; odrl:uid "carol" .' ],
        [ 'R21', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assigner :carol . :carol a odrl:Party ; odrl:uid "carol" .' ],
        [ 'R23', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:constraint [ odrl:leftOperand odrl:count ; odrl:rightOperand 5 ] .' ],
        [ 'R24', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:constraint [ odrl:leftOperand :myOperand ; odrl:operator odrl:eq ; odrl:rightOperand 5 ] .' ],
        [ 'R25', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use .' ],
        [ 'R26', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:duty :rule2 . :rule2 a odrl:Permission ; odrl:action odrl:compensate ; odrl:target :asset1 .' ],
        [ 'R27', ':policy1 a odrl:Set ; odrl:prohibition :rule1 . :rule1 a odrl:Prohibition ; odrl:action odrl:print .' ],
        [ 'R28', ':policy1 a odrl:Set ; odrl:prohibition :rule1 . :rule1 a odrl:Prohibition ; odrl:action odrl:print ; odrl:target :asset1 ; odrl:remedy :rule2 . :rule2 a odrl:Prohibition ; odrl:action odrl:delete ; odrl:target :asset1 .' ],
        [ 'R29', ':policy1 a odrl:Set ; odrl:prohibition :rule1 . :rule1 a odrl:Prohibition ; odrl:action odrl:print ; odrl:target :asset1 ; odrl:remedy :rule2 . :rule2 odrl:action odrl:delete ; odrl:consequence :rule3 . :rule3 odrl:action odrl:inform .' ],
        [ 'R30', ':policy1 a odrl:Set ; odrl:obligation :rule1 . :rule1 a odrl:Duty ; odrl:action odrl:compensate ; odrl:consequence :rule2 . :rule2 a odrl:Permission ; odrl:action odrl:inform ; odrl:target :asset1 .' ],
        [ 'R31', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :collection1 . :collection1 a odrl:AssetCollection ; odrl:refinement [ odrl:leftOperand odrl:count ; odrl:operator odrl:lt ; odrl:rightOperand 5 ] .' ],
        [ 'R32', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action :myAction ; odrl:target :asset1 .' ],
        [ 'R33', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:constraint [ odrl:leftOperand :myOperand ; odrl:operator odrl:eq ; odrl:rightOperand 5 ] .' ],
        [ 'R112', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:uid "rule1" ; odrl:action odrl:use ; odrl:target :asset1 .' ],
    ])('%s: %s is reported.', async (requirement, triples) => {
        const result = await validate(triples);

        expect(result.valid).toBe(false);
        expect(result.messages).toContain(MESSAGES[requirement as keyof typeof MESSAGES]);
    });

    // [requirement, policy with a warning]
    test.each([
        [ 'R16', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset2 .' ],
        [ 'R16', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target "asset1" .' ],
        [ 'R19', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assignee :carol .' ],
        [ 'R19', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assignee "carol" .' ],
        [ 'R22', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assigner :carol .' ],
        [ 'R22', ':policy1 a odrl:Set ; odrl:permission :rule1 . :rule1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :asset1 ; odrl:assigner "carol" .' ],
    ])('%s: %s is reported as a warning.', async (requirement, triples) => {
        const result = await validate(triples);

        expect(result.valid).toBe(true);
        expect(result.messages).toContain(MESSAGES[requirement as keyof typeof MESSAGES]);
    });
});
