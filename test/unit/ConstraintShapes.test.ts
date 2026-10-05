import { Parser } from 'n3';
import { ODRLValidator } from '../../src/Validator';

const COMPARISON_MESSAGE = 'is only compatible with comparison operators odrl:eq, odrl:gt, odrl:gteq, odrl:lt, odrl:lteq or odrl:neq.';

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

    test.each([
        ['R45', 'odrl:absolutePosition', '"100,200"'],
        ['R46', 'odrl:absoluteSpatialPosition', '"xywh=160,120,320,240"'],
        ['R47', 'odrl:absoluteTemporalPosition', '"192"^^xsd:decimal'],
        ['R48', 'odrl:absoluteSize', '"1000"^^xsd:integer'],
        ['R49', 'odrl:count', '"5"^^xsd:integer'],
        ['R51', 'odrl:dateTime', '"2026-12-31"^^xsd:date'],
    ])('%s: %s with a comparison operator gives no warning.', async (_, leftOperand, rightOperand) => {
        expect(await validate(leftOperand, 'odrl:lt', rightOperand)).toEqual({ valid: true, messages: [] });
    });

    test.each([
        ['R45', 'odrl:absolutePosition', '"100,200"'],
        ['R46', 'odrl:absoluteSpatialPosition', '"xywh=160,120,320,240"'],
        ['R47', 'odrl:absoluteTemporalPosition', '"192"^^xsd:decimal'],
        ['R48', 'odrl:absoluteSize', '"1000"^^xsd:integer'],
        ['R49', 'odrl:count', '"5"^^xsd:integer'],
        ['R51', 'odrl:dateTime', '"2026-12-31"^^xsd:date'],
    ])('%s: %s with a non-comparison operator gives a warning.', async (_, leftOperand, rightOperand) => {
        expect(await validate(leftOperand, 'odrl:isA', rightOperand)).toEqual({
            valid: true,
            messages: [`${leftOperand} ${COMPARISON_MESSAGE}`],
        });
    });
});

describe('The constraint rightOperand shapes', () => {

    test.each([
        ['R50', 'odrl:count', '"5"^^xsd:integer'],
        ['R52', 'odrl:dateTime', '"2026-12-31"^^xsd:date'],
        ['R52', 'odrl:dateTime', '"2026-12-31T10:00:00Z"^^xsd:dateTime'],
    ])('%s: %s with rightOperand %s gives no warning.', async (_, leftOperand, rightOperand) => {
        expect(await validate(leftOperand, 'odrl:lt', rightOperand)).toEqual({ valid: true, messages: [] });
    });

    test.each([
        ['R50', 'odrl:count', '"five"', 'The rightOperand of odrl:count should be an xsd:integer.'],
        ['R50', 'odrl:count', '"5.5"^^xsd:decimal', 'The rightOperand of odrl:count should be an xsd:integer.'],
        ['R52', 'odrl:dateTime', '"tomorrow"', 'The rightOperand of odrl:dateTime should be an xsd:date or xsd:dateTime.'],
        ['R52', 'odrl:dateTime', '"5"^^xsd:integer', 'The rightOperand of odrl:dateTime should be an xsd:date or xsd:dateTime.'],
        ['R52', 'odrl:dateTime', '"2026-13-45"^^xsd:date', 'The rightOperand of odrl:dateTime should be an xsd:date or xsd:dateTime.'],
    ])('%s: %s with rightOperand %s gives a warning.', async (_, leftOperand, rightOperand, message) => {
        expect(await validate(leftOperand, 'odrl:lt', rightOperand)).toEqual({ valid: true, messages: [message] });
    });
});
