import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';

// Expected message of each shape, by requirement (see docs/Requirements.md).
const MESSAGES = {
    R45: 'odrl:absolutePosition is only compatible with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R46: 'odrl:absoluteSpatialPosition is only compatible with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R47: 'odrl:absoluteTemporalPosition is only compatible with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R48: 'odrl:absoluteSize is only compatible with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R49: 'odrl:count is only compatible with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R50: 'The rightOperand of odrl:count must be an xsd:integer.',
    R51: 'odrl:dateTime must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R52: 'The rightOperand of odrl:dateTime must be an xsd:date or xsd:dateTime.',
    R53: 'odrl:delayPeriod must only be used with odrl:eq, odrl:gt or odrl:gteq.',
    R54: 'The rightOperand of odrl:delayPeriod must be an xsd:duration.',
    R55: 'odrl:deliveryChannel must only be used with odrl:eq, odrl:neq, odrl:isAllOf, odrl:isAnyOf or odrl:isNoneOf.',
    R56: 'The rightOperand of odrl:deliveryChannel should be an IRI, a string, or a list of these.',
    R57: 'odrl:elapsedTime must only be used with odrl:eq, odrl:lt, odrl:lteq or odrl:neq.',
    R58: 'The rightOperand of odrl:elapsedTime must be an xsd:duration.',
    R59: 'odrl:event must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R60: 'The rightOperand of odrl:event should be an IRI or a string.',
    R61: 'odrl:fileFormat must only be used with odrl:eq, odrl:neq, odrl:isA, odrl:isAnyOf or odrl:isNoneOf.',
    R62: 'The rightOperand of odrl:fileFormat should be an IRI, a string, or a list of these.',
    R63: 'odrl:industry must only be used with odrl:eq, odrl:neq, odrl:isA, odrl:isAnyOf or odrl:isNoneOf.',
    R64: 'The rightOperand of odrl:industry should be an IRI, a string, or a list of these.',
    R65: 'odrl:language must only be used with odrl:eq, odrl:neq, odrl:isAnyOf or odrl:isNoneOf.',
    R66: 'The rightOperand of odrl:language should be a string or a list of strings.',
    R67: 'odrl:media must only be used with odrl:eq, odrl:neq, odrl:isAnyOf or odrl:isNoneOf.',
    R68: 'The rightOperand of odrl:media should be a string or a list of strings.',
    R69: 'odrl:meteredTime must only be used with odrl:eq, odrl:lt or odrl:lteq.',
    R70: 'The rightOperand of odrl:meteredTime must be an xsd:duration.',
    R71: 'odrl:payAmount must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R72: 'The rightOperand of odrl:payAmount must be an xsd:decimal.',
    R73: 'odrl:percentage must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R74: 'The rightOperand of odrl:percentage must be an xsd:decimal from 0 to 100.',
    R75: 'odrl:product must only be used with odrl:eq, odrl:neq, odrl:isA, odrl:isAnyOf or odrl:isNoneOf.',
    R76: 'The rightOperand of odrl:product should be an IRI, a string, or a list of these.',
    R77: 'odrl:purpose must only be used with odrl:eq, odrl:neq, odrl:isA, odrl:isAnyOf or odrl:isNoneOf.',
    R78: 'The rightOperand of odrl:purpose should be an IRI, a string, or a list of these.',
    R79: 'odrl:recipient must only be used with odrl:eq, odrl:neq, odrl:isA, odrl:isAnyOf or odrl:isNoneOf.',
    R80: 'The rightOperand of odrl:recipient should be an IRI, a string, or a list of these.',
    R81: 'odrl:relativePosition must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R82: 'odrl:relativeSpatialPosition must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R83: 'odrl:relativeTemporalPosition must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R84: 'odrl:relativeSize must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R85: 'odrl:resolution must only be used with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.',
    R86: 'odrl:spatial must only be used with odrl:eq, odrl:neq, odrl:isAnyOf or odrl:isNoneOf.',
    R87: 'The rightOperand of odrl:spatial must be an IRI.',
    R88: 'odrl:spatialCoordinates must only be used with odrl:eq or odrl:neq.',
    R89: 'odrl:systemDevice must only be used with odrl:eq, odrl:neq, odrl:isAnyOf or odrl:isNoneOf.',
    R90: 'The rightOperand of odrl:systemDevice should be an IRI, a string, or a list of these.',
    R91: 'odrl:timeInterval must only be used with odrl:eq.',
    R92: 'The rightOperand of odrl:timeInterval must be an xsd:duration.',
    R93: 'odrl:unitOfCount must only be used with odrl:eq or odrl:neq.',
    R94: 'The rightOperand of odrl:unitOfCount should be a string.',
    R95: 'odrl:version must only be used with odrl:eq, odrl:neq, odrl:isAnyOf or odrl:isNoneOf.',
    R96: 'The rightOperand of odrl:version should be a string or a list of strings.',
    R97: 'odrl:virtualLocation must only be used with odrl:eq, odrl:neq, odrl:isAnyOf or odrl:isNoneOf.',
    R98: 'The rightOperand of odrl:virtualLocation should be a string or a list of strings.',
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
        [ 'R45', 'odrl:absolutePosition', '"100,200"', 'odrl:lt', 'odrl:isA', 'Violation' ],
        [ 'R46', 'odrl:absoluteSpatialPosition', '"xywh=160,120,320,240"', 'odrl:lt', 'odrl:isA', 'Violation' ],
        [ 'R47', 'odrl:absoluteTemporalPosition', '"192"^^xsd:decimal', 'odrl:lt', 'odrl:isA', 'Violation' ],
        [ 'R48', 'odrl:absoluteSize', '"1000"^^xsd:integer', 'odrl:lt', 'odrl:isA', 'Violation' ],
        [ 'R49', 'odrl:count', '"5"^^xsd:integer', 'odrl:lt', 'odrl:isA', 'Violation' ],
        [ 'R51', 'odrl:dateTime', '"2026-12-31"^^xsd:date', 'odrl:lt', 'odrl:isA', 'Violation' ],
        [ 'R53', 'odrl:delayPeriod', '"PT60M"^^xsd:duration', 'odrl:gteq', 'odrl:lt', 'Violation' ],
        [ 'R55', 'odrl:deliveryChannel', ':mobile', 'odrl:isAnyOf', 'odrl:lt', 'Violation' ],
        [ 'R57', 'odrl:elapsedTime', '"PT60M"^^xsd:duration', 'odrl:lteq', 'odrl:gt', 'Violation' ],
        [ 'R59', 'odrl:event', ':fifaWorldCup2020', 'odrl:gt', 'odrl:isA', 'Violation' ],
        [ 'R61', 'odrl:fileFormat', '( "image/jpeg" "image/png" )', 'odrl:isAnyOf', 'odrl:isAllOf', 'Violation' ],
        [ 'R63', 'odrl:industry', '( :publishing :financial )', 'odrl:isNoneOf', 'odrl:isAllOf', 'Violation' ],
        [ 'R65', 'odrl:language', '"en"', 'odrl:eq', 'odrl:isA', 'Violation' ],
        [ 'R67', 'odrl:media', '( "electronic" "print" )', 'odrl:isAnyOf', 'odrl:isAllOf', 'Violation' ],
        [ 'R69', 'odrl:meteredTime', '"PT60M"^^xsd:duration', 'odrl:lteq', 'odrl:neq', 'Violation' ],
        [ 'R71', 'odrl:payAmount', '"10.50"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Violation' ],
        [ 'R73', 'odrl:percentage', '"50"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Violation' ],
        [ 'R75', 'odrl:product', ':Publication', 'odrl:isA', 'odrl:lt', 'Violation' ],
        [ 'R77', 'odrl:purpose', '<https://w3id.org/dpv#Marketing>', 'odrl:isA', 'odrl:gt', 'Violation' ],
        [ 'R79', 'odrl:recipient', ':alice', 'odrl:eq', 'odrl:lt', 'Violation' ],
        [ 'R81', 'odrl:relativePosition', '"50"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Violation' ],
        [ 'R82', 'odrl:relativeSpatialPosition', '"50"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Violation' ],
        [ 'R83', 'odrl:relativeTemporalPosition', '"50"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Violation' ],
        [ 'R84', 'odrl:relativeSize', '"200"^^xsd:decimal', 'odrl:lteq', 'odrl:isA', 'Violation' ],
        [ 'R85', 'odrl:resolution', '"1200"^^xsd:integer', 'odrl:lteq', 'odrl:isA', 'Violation' ],
        [ 'R86', 'odrl:spatial', '<https://www.wikidata.org/wiki/Q29>', 'odrl:eq', 'odrl:lt', 'Violation' ],
        [ 'R88', 'odrl:spatialCoordinates', '"40.4168,-3.7038"', 'odrl:neq', 'odrl:isA', 'Violation' ],
        [ 'R89', 'odrl:systemDevice', '( :laptop42 "device-1234" )', 'odrl:isAnyOf', 'odrl:isA', 'Violation' ],
        [ 'R91', 'odrl:timeInterval', '"P7D"^^xsd:duration', 'odrl:eq', 'odrl:lt', 'Violation' ],
        [ 'R93', 'odrl:unitOfCount', '"perUser"', 'odrl:neq', 'odrl:isAnyOf', 'Violation' ],
        [ 'R95', 'odrl:version', '"2.0"', 'odrl:eq', 'odrl:lt', 'Violation' ],
        [ 'R97', 'odrl:virtualLocation', '( "intranet" "vpn" )', 'odrl:isNoneOf', 'odrl:isA', 'Violation' ],
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
        [ 'R92', 'odrl:timeInterval', '"P7D"^^xsd:duration' ],
        [ 'R94', 'odrl:unitOfCount', '"perUser"' ],
        [ 'R96', 'odrl:version', '"2.0"' ],
        [ 'R96', 'odrl:version', '( "1.0" "2.0" )' ],
        [ 'R98', 'odrl:virtualLocation', '"https://example.com/intranet"' ],
        [ 'R98', 'odrl:virtualLocation', '( "intranet" "vpn" )' ],
    ])('%s: %s with rightOperand %s is accepted.', async (_, leftOperand, rightOperand) => {
        expect(await validate(leftOperand, 'odrl:eq', rightOperand)).toEqual({ valid: true, messages: [] });
    });

    // [requirement, leftOperand, wrong rightOperand, severity]
    const wrongCases: [keyof typeof MESSAGES, string, string, Severity][] = [
        [ 'R50', 'odrl:count', '"five"', 'Violation' ],
        [ 'R50', 'odrl:count', '"5.5"^^xsd:decimal', 'Violation' ],
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
        [ 'R92', 'odrl:timeInterval', '"weekly"', 'Violation' ],
        [ 'R92', 'odrl:timeInterval', '"7"^^xsd:integer', 'Violation' ],
        [ 'R94', 'odrl:unitOfCount', ':perUser', 'Warning' ],
        [ 'R94', 'odrl:unitOfCount', '( "perUser" "perDevice" )', 'Warning' ],
        [ 'R96', 'odrl:version', '"2"^^xsd:integer', 'Warning' ],
        [ 'R96', 'odrl:version', '( "1.0" :v2 )', 'Warning' ],
        [ 'R98', 'odrl:virtualLocation', ':intranet', 'Warning' ],
        [ 'R98', 'odrl:virtualLocation', '( "intranet" :vpn )', 'Warning' ],
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
