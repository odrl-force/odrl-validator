import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';

// Expected message of each shape, by requirement (see docs/Requirements.md).
const MESSAGES = {
    R45: 'odrl:absolutePosition is only compatible with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R46: 'odrl:absoluteSpatialPosition is only compatible with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R47: 'odrl:absoluteTemporalPosition is only compatible with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R48: 'odrl:absoluteSize is only compatible with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R49: 'odrl:count is only compatible with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R50: 'The rightOperand of odrl:count should be an xsd:integer.',
    R51: 'odrl:dateTime must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R52: 'The rightOperand of odrl:dateTime must be an xsd:date or xsd:dateTime.',
    R53: 'odrl:delayPeriod must only be used with odrl:eq, odrl:gt or odrl:gteq.',
    R54: 'The rightOperand of odrl:delayPeriod must be an xsd:duration.',
    R55: 'odrl:deliveryChannel should only be used with odrl:eq, odrl:neq, odrl:isAllOf, odrl:isAnyOf or odrl:isNoneOf.',
    R56: 'The rightOperand of odrl:deliveryChannel should be an IRI, a string, or a list of these.',
    R57: 'odrl:elapsedTime must only be used with odrl:eq, odrl:lt, odrl:lteq or odrl:neq.',
    R58: 'The rightOperand of odrl:elapsedTime must be an xsd:duration.',
    R59: 'odrl:event should only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R60: 'The rightOperand of odrl:event should be an IRI or a string.',
    R61: 'odrl:fileFormat should only be used with odrl:eq, odrl:neq, odrl:isA, odrl:isAnyOf or odrl:isNoneOf.',
    R62: 'The rightOperand of odrl:fileFormat should be an IRI, a string, or a list of these.',
    R63: 'odrl:industry should only be used with odrl:eq, odrl:neq, odrl:isA, odrl:isAnyOf or odrl:isNoneOf.',
    R64: 'The rightOperand of odrl:industry should be an IRI, a string, or a list of these.',
    R65: 'odrl:language should only be used with odrl:eq, odrl:neq, odrl:isAnyOf or odrl:isNoneOf.',
    R66: 'The rightOperand of odrl:language should be a string or a list of strings.',
    R67: 'odrl:media should only be used with odrl:eq, odrl:neq, odrl:isAnyOf or odrl:isNoneOf.',
    R68: 'The rightOperand of odrl:media should be a string or a list of strings.',
    R69: 'odrl:meteredTime must only be used with odrl:eq, odrl:lt or odrl:lteq.',
    R70: 'The rightOperand of odrl:meteredTime must be an xsd:duration.',
    R71: 'odrl:payAmount must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R72: 'The rightOperand of odrl:payAmount must be an xsd:decimal.',
    R73: 'odrl:percentage must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R74: 'The rightOperand of odrl:percentage must be an xsd:decimal from 0 to 100.',
    R75: 'odrl:product should only be used with odrl:eq, odrl:neq, odrl:isA, odrl:isAnyOf or odrl:isNoneOf.',
    R76: 'The rightOperand of odrl:product should be an IRI, a string, or a list of these.',
    R77: 'odrl:purpose should only be used with odrl:eq, odrl:neq, odrl:isA, odrl:isAnyOf or odrl:isNoneOf.',
    R78: 'The rightOperand of odrl:purpose should be an IRI, a string, or a list of these.',
    R79: 'odrl:recipient should only be used with odrl:eq, odrl:neq, odrl:isA, odrl:isAnyOf or odrl:isNoneOf.',
    R80: 'The rightOperand of odrl:recipient should be an IRI, a string, or a list of these.',
    R81: 'odrl:relativePosition should only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R82: 'odrl:relativeSpatialPosition should only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R83: 'odrl:relativeTemporalPosition should only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R84: 'odrl:relativeSize should only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R85: 'odrl:resolution should only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R86: 'odrl:spatial must only be used with odrl:eq, odrl:neq, odrl:isAnyOf or odrl:isNoneOf.',
    R87: 'The rightOperand of odrl:spatial must be an IRI.',
    R88: 'odrl:spatialCoordinates should only be used with odrl:eq or odrl:neq.',
    R89: 'odrl:systemDevice should only be used with odrl:eq, odrl:neq, odrl:isAnyOf or odrl:isNoneOf.',
    R90: 'The rightOperand of odrl:systemDevice should be an IRI, a string, or a list of these.',
};

// A Warning keeps the policy valid; a Violation makes it invalid.
type Severity = 'Warning' | 'Violation';

// Parametric test function for creating a valid policy with a single constraint.
function policy(leftOperand: string, operator: string, rightOperand: string): string {
    return `
    @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
    @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
    @prefix : <http://example.com/> .

    :policy1 a odrl:Policy ;
        odrl:permission :permission1 .

    :permission1 a odrl:Permission ;
        odrl:action odrl:use ;
        odrl:target :resourceX ;
        odrl:constraint :constraint1 .

    :constraint1 a odrl:Constraint ;
        odrl:leftOperand ${leftOperand} ;
        odrl:operator ${operator} ;
        odrl:rightOperand ${rightOperand} .

    :resourceX a odrl:Asset .
    `;
}

async function validate(leftOperand: string, operator: string, rightOperand: string) {
    const validator = new ODRLValidator();
    const result = await validator.validate(new Parser().parse(policy(leftOperand, operator, rightOperand)));
    return { valid: result.valid, messages: result.validationResults.map(r => r.message) };
}

describe('The constraint operator shapes', () => {

    // [requirement, leftOperand, rightOperand, allowed operator, not allowed operator, severity]
    const cases: [keyof typeof MESSAGES, string, string, string, string, Severity][] = [
        [ 'R45', 'odrl:absolutePosition', '"100,200"', 'odrl:lt', 'odrl:isA', 'Warning' ],
        [ 'R46', 'odrl:absoluteSpatialPosition', '"xywh=160,120,320,240"', 'odrl:lt', 'odrl:isA', 'Warning' ],
        [ 'R47', 'odrl:absoluteTemporalPosition', '"192"^^xsd:decimal', 'odrl:lt', 'odrl:isA', 'Warning' ],
        [ 'R48', 'odrl:absoluteSize', '"1000"^^xsd:integer', 'odrl:lt', 'odrl:isA', 'Warning' ],
        [ 'R49', 'odrl:count', '"5"^^xsd:integer', 'odrl:lt', 'odrl:isA', 'Warning' ],
        [ 'R51', 'odrl:dateTime', '"2026-12-31"^^xsd:date', 'odrl:lt', 'odrl:isA', 'Violation' ],
        [ 'R53', 'odrl:delayPeriod', '"PT60M"^^xsd:duration', 'odrl:gteq', 'odrl:lt', 'Violation' ],
        [ 'R55', 'odrl:deliveryChannel', ':mobile', 'odrl:isAnyOf', 'odrl:lt', 'Warning' ],
        [ 'R57', 'odrl:elapsedTime', '"PT60M"^^xsd:duration', 'odrl:lteq', 'odrl:gt', 'Violation' ],
        [ 'R59', 'odrl:event', ':fifaWorldCup2020', 'odrl:gt', 'odrl:isA', 'Warning' ],
        [ 'R61', 'odrl:fileFormat', '( "image/jpeg" "image/png" )', 'odrl:isAnyOf', 'odrl:isAllOf', 'Warning' ],
        [ 'R63', 'odrl:industry', '( :publishing :financial )', 'odrl:isNoneOf', 'odrl:isAllOf', 'Warning' ],
        [ 'R65', 'odrl:language', '"en"', 'odrl:eq', 'odrl:isA', 'Warning' ],
        [ 'R67', 'odrl:media', '( "electronic" "print" )', 'odrl:isAnyOf', 'odrl:isAllOf', 'Warning' ],
        [ 'R69', 'odrl:meteredTime', '"PT60M"^^xsd:duration', 'odrl:lteq', 'odrl:neq', 'Violation' ],
        [ 'R71', 'odrl:payAmount', '"10.50"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Violation' ],
        [ 'R73', 'odrl:percentage', '"50"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Violation' ],
        [ 'R75', 'odrl:product', ':Publication', 'odrl:isA', 'odrl:lt', 'Warning' ],
        [ 'R77', 'odrl:purpose', '<https://w3id.org/dpv#Marketing>', 'odrl:isA', 'odrl:gt', 'Warning' ],
        [ 'R79', 'odrl:recipient', ':alice', 'odrl:eq', 'odrl:lt', 'Warning' ],
        [ 'R81', 'odrl:relativePosition', '"50"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Warning' ],
        [ 'R82', 'odrl:relativeSpatialPosition', '"50"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Warning' ],
        [ 'R83', 'odrl:relativeTemporalPosition', '"50"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Warning' ],
        [ 'R84', 'odrl:relativeSize', '"200"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Warning' ],
        [ 'R85', 'odrl:resolution', '"1200"^^xsd:integer', 'odrl:lteq', 'odrl:isA', 'Warning' ],
        [ 'R86', 'odrl:spatial', '<https://www.wikidata.org/wiki/Q29>', 'odrl:eq', 'odrl:lt', 'Violation' ],
        [ 'R88', 'odrl:spatialCoordinates', '"40.4168,-3.7038"', 'odrl:neq', 'odrl:isA', 'Warning' ],
        [ 'R89', 'odrl:systemDevice', '( :laptop42 "device-1234" )', 'odrl:isAnyOf', 'odrl:isA', 'Warning' ],
    ];

    test.each(cases)('%s: %s with an allowed operator is accepted.', async (_, leftOperand, rightOperand, allowed) => {
        expect(await validate(leftOperand, allowed, rightOperand)).toEqual({ valid: true, messages: [] });
    });

    test.each(cases)('%s: %s with a not allowed operator is reported.', async (requirement, leftOperand, rightOperand, _, notAllowed, severity) => {
        expect(await validate(leftOperand, notAllowed, rightOperand)).toEqual({
            valid: severity === 'Warning',
            messages: [ MESSAGES[requirement] ],
        });
    });
});

describe('The constraint rightOperand shapes', () => {

    // [requirement, leftOperand, rightOperand]
    test.each([
        [ 'R50', 'odrl:count', '"5"^^xsd:integer' ],
        [ 'R52', 'odrl:dateTime', '"2026-12-31"^^xsd:date' ],
        [ 'R52', 'odrl:dateTime', '"2026-12-31T10:00:00Z"^^xsd:dateTime' ],
        [ 'R54', 'odrl:delayPeriod', '"PT60M"^^xsd:duration' ],
        [ 'R56', 'odrl:deliveryChannel', ':mobile' ],
        [ 'R56', 'odrl:deliveryChannel', '"mobile"' ],
        [ 'R56', 'odrl:deliveryChannel', '( :mobile "web" )' ],
        [ 'R58', 'odrl:elapsedTime', '"PT60M"^^xsd:duration' ],
        [ 'R60', 'odrl:event', ':fifaWorldCup2020' ],
        [ 'R60', 'odrl:event', '"FIFA World Cup 2020"' ],
        [ 'R60', 'odrl:event', 'odrl:policyUsage' ],
        [ 'R62', 'odrl:fileFormat', '"image/jpeg"' ],
        [ 'R62', 'odrl:fileFormat', '<http://www.iana.org/assignments/media-types/image/jpeg>' ],
        [ 'R62', 'odrl:fileFormat', '( "image/jpeg" "image/png" )' ],
        [ 'R64', 'odrl:industry', ':publishing' ],
        [ 'R64', 'odrl:industry', '"financial"' ],
        [ 'R64', 'odrl:industry', '( :publishing "financial" )' ],
        [ 'R66', 'odrl:language', '"en"' ],
        [ 'R66', 'odrl:language', '( "en" "es" )' ],
        [ 'R68', 'odrl:media', '"print"' ],
        [ 'R68', 'odrl:media', '( "electronic" "print" )' ],
        [ 'R70', 'odrl:meteredTime', '"PT60M"^^xsd:duration' ],
        [ 'R72', 'odrl:payAmount', '"10.50"^^xsd:decimal' ],
        [ 'R72', 'odrl:payAmount', '10.5' ],
        [ 'R74', 'odrl:percentage', '"50"^^xsd:decimal' ],
        [ 'R74', 'odrl:percentage', '"0.0"^^xsd:decimal' ],
        [ 'R74', 'odrl:percentage', '"100.0"^^xsd:decimal' ],
        [ 'R76', 'odrl:product', ':magazine' ],
        [ 'R76', 'odrl:product', '"magazine"' ],
        [ 'R76', 'odrl:product', '( :magazine "newspaper" )' ],
        [ 'R78', 'odrl:purpose', '<https://w3id.org/dpv#ResearchAndDevelopment>' ],
        [ 'R78', 'odrl:purpose', '"research"' ],
        [ 'R78', 'odrl:purpose', '( :research "education" )' ],
        [ 'R80', 'odrl:recipient', ':alice' ],
        [ 'R80', 'odrl:recipient', '"Bob"' ],
        [ 'R80', 'odrl:recipient', '( :alice "Bob" )' ],
        [ 'R87', 'odrl:spatial', '<https://www.wikidata.org/wiki/Q29>' ],
        [ 'R90', 'odrl:systemDevice', ':laptop42' ],
        [ 'R90', 'odrl:systemDevice', '"device-1234"' ],
        [ 'R90', 'odrl:systemDevice', '( :laptop42 "device-1234" )' ],
    ])('%s: %s with rightOperand %s is accepted.', async (_, leftOperand, rightOperand) => {
        expect(await validate(leftOperand, 'odrl:eq', rightOperand)).toEqual({ valid: true, messages: [] });
    });

    // [requirement, leftOperand, wrong rightOperand, severity]
    const wrongCases: [keyof typeof MESSAGES, string, string, Severity][] = [
        [ 'R50', 'odrl:count', '"five"', 'Warning' ],
        [ 'R50', 'odrl:count', '"5.5"^^xsd:decimal', 'Warning' ],
        [ 'R52', 'odrl:dateTime', '"tomorrow"', 'Violation' ],
        [ 'R52', 'odrl:dateTime', '"5"^^xsd:integer', 'Violation' ],
        [ 'R52', 'odrl:dateTime', '"2026-13-45"^^xsd:date', 'Violation' ],
        [ 'R54', 'odrl:delayPeriod', '"60 minutes"', 'Violation' ],
        [ 'R54', 'odrl:delayPeriod', '"60"^^xsd:integer', 'Violation' ],
        [ 'R56', 'odrl:deliveryChannel', '"5"^^xsd:integer', 'Warning' ],
        [ 'R56', 'odrl:deliveryChannel', '( :mobile "5"^^xsd:integer )', 'Warning' ],
        [ 'R58', 'odrl:elapsedTime', '"60 minutes"', 'Violation' ],
        [ 'R58', 'odrl:elapsedTime', '"60"^^xsd:integer', 'Violation' ],
        [ 'R60', 'odrl:event', '"2020"^^xsd:integer', 'Warning' ],
        [ 'R60', 'odrl:event', '( :fifaWorldCup2020 :olympics2020 )', 'Warning' ],
        [ 'R62', 'odrl:fileFormat', '"5"^^xsd:integer', 'Warning' ],
        [ 'R62', 'odrl:fileFormat', '( "image/gif" "5"^^xsd:integer )', 'Warning' ],
        [ 'R64', 'odrl:industry', '"5"^^xsd:integer', 'Warning' ],
        [ 'R64', 'odrl:industry', '( :publishing "5"^^xsd:integer )', 'Warning' ],
        [ 'R66', 'odrl:language', ':english', 'Warning' ],
        [ 'R66', 'odrl:language', '( "en" :spanish )', 'Warning' ],
        [ 'R68', 'odrl:media', ':print', 'Warning' ],
        [ 'R68', 'odrl:media', '( "print" :advertising )', 'Warning' ],
        [ 'R70', 'odrl:meteredTime', '"60 minutes"', 'Violation' ],
        [ 'R70', 'odrl:meteredTime', '"60"^^xsd:integer', 'Violation' ],
        [ 'R72', 'odrl:payAmount', '"10 EUR"', 'Violation' ],
        [ 'R72', 'odrl:payAmount', '"abc"^^xsd:decimal', 'Violation' ],
        [ 'R74', 'odrl:percentage', '"100.5"^^xsd:decimal', 'Violation' ],
        [ 'R74', 'odrl:percentage', '"-1"^^xsd:decimal', 'Violation' ],
        [ 'R74', 'odrl:percentage', '"50%"', 'Violation' ],
        [ 'R76', 'odrl:product', '"5"^^xsd:integer', 'Warning' ],
        [ 'R76', 'odrl:product', '( :magazine "5"^^xsd:integer )', 'Warning' ],
        [ 'R78', 'odrl:purpose', '"5"^^xsd:integer', 'Warning' ],
        [ 'R78', 'odrl:purpose', '( :research "5"^^xsd:integer )', 'Warning' ],
        [ 'R80', 'odrl:recipient', '"5"^^xsd:integer', 'Warning' ],
        [ 'R80', 'odrl:recipient', '( :alice "5"^^xsd:integer )', 'Warning' ],
        [ 'R87', 'odrl:spatial', '"ES"', 'Violation' ],
        // Lists are blank nodes, so they are not allowed either (to be discussed for isAnyOf/isNoneOf).
        [ 'R87', 'odrl:spatial', '( <https://www.wikidata.org/wiki/Q29> <https://www.wikidata.org/wiki/Q142> )', 'Violation' ],
        [ 'R90', 'odrl:systemDevice', '"5"^^xsd:integer', 'Warning' ],
        [ 'R90', 'odrl:systemDevice', '( :laptop42 "5"^^xsd:integer )', 'Warning' ],
    ];

    test.each(wrongCases)('%s: %s with rightOperand %s is reported.', async (requirement, leftOperand, rightOperand, severity) => {
        expect(await validate(leftOperand, 'odrl:eq', rightOperand)).toEqual({
            valid: severity === 'Warning',
            messages: [ MESSAGES[requirement] ],
        });
    });
});

describe('The constraint shapes on constraints without an explicit type', () => {

    test('R51 and R52: an untyped odrl:dateTime constraint is also checked.', async () => {
        const untypedPolicy = `
        @prefix odrl: <http://www.w3.org/ns/odrl/2/> .
        @prefix : <http://example.com/> .

        :policy1 a odrl:Policy ;
            odrl:permission :permission1 .

        :permission1 a odrl:Permission ;
            odrl:action odrl:use ;
            odrl:target :resourceX ;
            odrl:constraint [
                odrl:leftOperand odrl:dateTime ;
                odrl:operator odrl:isA ;
                odrl:rightOperand "2018-01-01"
            ] .

        :resourceX a odrl:Asset .
        `;
        const result = await new ODRLValidator().validate(new Parser().parse(untypedPolicy));

        expect(result.valid).toBe(false);
        expect(result.validationResults.map(r => r.message).sort()).toEqual([ MESSAGES.R52, MESSAGES.R51 ].sort());
    });
});
