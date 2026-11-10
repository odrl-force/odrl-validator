import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Parser } from 'n3';
import { SHAPES } from '../../src/shapes/Shapes';

// Informative only: counts how many shapes are checked by a test, it never fails.
// A shape counts as tested when a test expects its exact sh:message.
// The result is written to coverage/shape-coverage.json, which is used for the badge in the README.
const TEST_DIR = join(__dirname, '..');
const OUTPUT_FILE = join(__dirname, '..', '..', 'coverage', 'shape-coverage.json');
const SH_MESSAGE = 'http://www.w3.org/ns/shacl#message';

function testFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry): string[] => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            return testFiles(path);
        }
        return entry.name.endsWith('.test.ts') ? [ path ] : [];
    });
}

function badgeColor(percentage: number): string {
    if (percentage >= 80) {
        return 'brightgreen';
    }
    return percentage >= 50 ? 'yellow' : 'red';
}

describe('The shape coverage', () => {

    test('is reported.', () => {
        const messages = [ ...new Set(new Parser().parse(SHAPES)
            .filter((quad): boolean => quad.predicate.value === SH_MESSAGE)
            .map((quad): string => quad.object.value)) ];
        const tests = testFiles(TEST_DIR).map((file): string => readFileSync(file, 'utf8')).join('\n');
        const untested = messages.filter((message): boolean => !tests.includes(message));
        const tested = messages.length - untested.length;
        const percentage = Math.round(100 * tested / messages.length);

        // Badge in the format of https://shields.io/badges/endpoint-badge
        mkdirSync(join(OUTPUT_FILE, '..'), { recursive: true });
        writeFileSync(OUTPUT_FILE, JSON.stringify({
            schemaVersion: 1,
            label: 'shapes tested',
            message: `${percentage}% (${tested}/${messages.length})`,
            color: badgeColor(percentage),
        }));

        if (untested.length > 0) {
            console.log(`${percentage}% of the shapes tested (${tested}/${messages.length}). Shapes without a test:\n${untested.map((message): string => `- ${message}`).join('\n')}`);
        }
        expect(messages.length).toBeGreaterThan(0);
    });
});
