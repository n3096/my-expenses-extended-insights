import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { startServer } from './support/server.mjs';
import { assertPinnedVersions, stubCdns } from './support/cdn.mjs';
import { createReporter } from './support/report.mjs';

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const SITE_DIR = resolve(TESTS_DIR, '../public_www');

const SPECS = ['dashboard', 'insights', 'filters', 'statement-parser', 'differ', 'preferences'];

/**
 * Class-based visibility only behaves like production when the real utility CSS
 * is present, so it is generated from the pages themselves before the run.
 */
function buildTailwindCss() {
    const workDir = mkdtempSync(join(tmpdir(), 'tw-'));
    const config = join(workDir, 'tailwind.config.js');
    const input = join(workDir, 'in.css');
    const output = join(workDir, 'out.css');

    writeFileSync(config, `module.exports = {
        darkMode: 'class',
        content: ['${SITE_DIR}/**/*.{html,js}'],
        theme: { extend: { fontFamily: { sans: ['Inter', 'sans-serif'] } } }
    };`);
    writeFileSync(input, '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');

    execFileSync('npx', ['tailwindcss', '-c', config, '-i', input, '-o', output, '--minify'], { stdio: 'pipe' });
    const css = readFileSync(output, 'utf8');
    rmSync(workDir, { recursive: true, force: true });
    return css;
}

const pagesToCheck = [
    `${SITE_DIR}/insights/index.html`,
    `${SITE_DIR}/statement-parser/index.html`
];
await assertPinnedVersions(pagesToCheck);

const tailwindCss = buildTailwindCss();
const server = await startServer(SITE_DIR);
const browser = await chromium.launch();

let passed = 0;
let failed = 0;

for (const name of SPECS) {
    const { default: spec } = await import(`./specs/${name}.mjs`);
    const reporter = createReporter(name);
    const page = await browser.newPage();
    const pageErrors = [];

    page.on('pageerror', e => pageErrors.push(`pageerror: ${e.message}`));
    page.on('console', m => {
        if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) {
            pageErrors.push(`console: ${m.text()}`);
        }
    });

    await stubCdns(page, { tailwindCss });
    console.log(`\n${name}`);

    try {
        const expectedErrors = await spec({ page, base: server.url, fixtures: join(TESTS_DIR, 'fixtures'), check: reporter.check }) ?? [];
        const unexpected = pageErrors.filter(e => !expectedErrors.some(allowed => e.includes(allowed)));
        reporter.check('no unexpected page errors', unexpected.length === 0, unexpected.join(' | '));
    } catch (error) {
        reporter.check(`spec crashed: ${error.message.split('\n')[0]}`, false);
    }

    await page.close();
    passed += reporter.results.passed;
    failed += reporter.results.failed;
}

await browser.close();
await server.close();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
