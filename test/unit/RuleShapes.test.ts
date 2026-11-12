import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';

// Expected message
const MESSAGES = {
    permission: 'A permission must be an odrl:Permission, not a Prohibition or Duty.',
    prohibition: 'A prohibition must be an odrl:Prohibition, not a Permission or Duty.',
    obligation: 'An obligation must be an odrl:Duty, not a Permission or Prohibition.',
    duty: 'A duty must be an odrl:Duty, not a Permission or Prohibition.',
    remedy: 'A remedy must be an odrl:Duty, not a Permission or Prohibition.',
    consequence: 'A consequence must be an odrl:Duty, not a Permission or Prohibition.',
};

// Parametric test function for creating a valid and invalid policy
function policy(subject: string, property: string, type: string): string {
    return `
    @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
    @prefix : <http://example.com/> .

    :policy1 a odrl:Policy ;
        odrl:permission :permission1 ;
        odrl:prohibition :prohibition1 ;
        odrl:obligation :duty1 .

    :permission1 a odrl:Permission ; odrl:action odrl:use ; odrl:target :resourceX .
    :prohibition1 a odrl:Prohibition ; odrl:action odrl:distribute ; odrl:target :resourceX .
    :duty1 a odrl:Duty ; odrl:action odrl:compensate .
    :resourceX a odrl:Asset .

    ${subject} ${property} :rule2 .
    :rule2 ${type ? `a ${type} ;` : ''} odrl:action odrl:inform ; odrl:target :resourceX .
    `;
}

async function validate(subject: string, property: string, type: string) {
    const result = await new ODRLValidator().validate(new Parser().parse(policy(subject, property, type)));
    return { valid: result.valid, messages: result.validationResults.map(r => r.message) };
}

describe('The rule type shapes', () => {

    // [subject, property, correct type, wrong type, expected message]
    const cases: [string, string, string, string, string][] = [
        [ ':policy1', 'odrl:permission', 'odrl:Permission', 'odrl:Prohibition', MESSAGES.permission ],
        [ ':policy1', 'odrl:prohibition', 'odrl:Prohibition', 'odrl:Permission', MESSAGES.prohibition ],
        [ ':policy1', 'odrl:obligation', 'odrl:Duty', 'odrl:Permission', MESSAGES.obligation ],
        [ ':permission1', 'odrl:duty', 'odrl:Duty', 'odrl:Permission', MESSAGES.duty ],
        [ ':prohibition1', 'odrl:remedy', 'odrl:Duty', 'odrl:Prohibition', MESSAGES.remedy ],
        [ ':duty1', 'odrl:consequence', 'odrl:Duty', 'odrl:Permission', MESSAGES.consequence ],
    ];

    // With a correct type
    test.each(cases)('%s %s with a rule of type %s is accepted.', async (subject, property, correctType) => {
        expect(await validate(subject, property, correctType)).toEqual({ valid: true, messages: [] });
    });

    // Without a type
    test.each(cases)('%s %s with a rule without a type is accepted.', async (subject, property) => {
        expect(await validate(subject, property, '')).toEqual({ valid: true, messages: [] });
    });

    // With a wrong type
    test.each(cases)('%s %s with a rule of type %s is reported.', async (subject, property, _, wrongType, message) => {
        expect(await validate(subject, property, wrongType)).toEqual({ valid: false, messages: [ message ] });
    });
});
