import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Informative only: counts how many requirements are checked by a test, it never fails.
// A requirement counts as tested when its ID (e.g. R04) appears in a test file.
// The result is written to coverage/shape-coverage.json, which is used for the badge in the README.
const TEST_DIR = join(__dirname, '..');
const REQUIREMENTS_FILE = join(__dirname, '..', '..', 'docs', 'Requirements.md');
const OUTPUT_FILE = join(__dirname, '..', '..', 'coverage', 'shape-coverage.json');

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

describe('The requirement coverage', () => {

    test('is reported.', () => {
        // Requirement lines look like "- R04: ...", "- N1: ...", "- I1: ..." (or in italics when not implemented)
        const requirements = [ ...readFileSync(REQUIREMENTS_FILE, 'utf8').matchAll(/^- \*?([RNI]\d+):/gm) ]
            .map((match): string => match[1]);
        // This file is left out, it mentions requirement IDs in its comments
        const tests = testFiles(TEST_DIR).filter((file): boolean => file !== __filename)
            .map((file): string => readFileSync(file, 'utf8')).join('\n');
        const untested = requirements.filter((id): boolean => !new RegExp(`\\b${id}\\b`).test(tests));
        const tested = requirements.length - untested.length;
        const percentage = Math.round(100 * tested / requirements.length);

        // Badge in the format of https://shields.io/badges/endpoint-badge
        mkdirSync(join(OUTPUT_FILE, '..'), { recursive: true });
        writeFileSync(OUTPUT_FILE, JSON.stringify({
            schemaVersion: 1,
            label: 'requirements tested',
            message: `${percentage}% (${tested}/${requirements.length})`,
            color: badgeColor(percentage),
        }));

        if (untested.length > 0) {
            console.log(`${percentage}% of the requirements tested (${tested}/${requirements.length}). Requirements without a test: ${untested.join(', ')}`);
        }
        expect(requirements.length).toBeGreaterThan(0);
    });
});
