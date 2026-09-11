import { readFile } from 'node:fs/promises';

const MODULES = new URL('../../node_modules/', import.meta.url);

/**
 * The pages load their libraries from CDNs. Tests serve the same versions from
 * node_modules instead, so a run is deterministic and works offline.
 */
const LIBRARIES = [
    {
        name: 'chart.js',
        pattern: '**/chart.umd.min.js',
        file: 'chart.js/dist/chart.umd.js',
        // The version the pages pin, asserted against the markup below.
        version: '4.4.2',
        referencedAs: /chart\.js@([\d.]+)/
    },
    {
        name: 'pdfjs-dist',
        pattern: '**/pdf.min.mjs',
        file: 'pdfjs-dist/build/pdf.min.mjs',
        version: '4.3.136',
        referencedAs: /pdf\.js\/([\d.]+)\/pdf\.min\.mjs/
    }
];

/** Fails loudly when a page bumps a library without the tests following. */
export async function assertPinnedVersions(pages) {
    const markup = (await Promise.all(pages.map(page => readFile(page, 'utf8')))).join('\n');

    for (const { name, version, referencedAs } of LIBRARIES) {
        const found = markup.match(referencedAs)?.[1];
        if (found && found !== version) {
            throw new Error(
                `${name}: pages load ${found}, tests serve ${version}. ` +
                `Update the version in package.json and tests/support/cdn.mjs.`
            );
        }
    }
}

export async function stubCdns(page, { tailwindCss }) {
    const tailwind = `window.tailwind = { config: {} };
        (function () {
            const style = document.createElement('style');
            style.textContent = ${JSON.stringify(tailwindCss)};
            document.head.appendChild(style);
        })();`;

    for (const pattern of ['**/cdn.tailwindcss.com/**', 'https://cdn.tailwindcss.com/', 'https://cdn.tailwindcss.com']) {
        await page.route(pattern, route =>
            route.fulfill({ contentType: 'application/javascript', body: tailwind }));
    }

    for (const { pattern, file } of LIBRARIES) {
        const body = await readFile(new URL(file, MODULES), 'utf8');
        await page.route(pattern, route => route.fulfill({ contentType: 'application/javascript', body }));
    }

    await page.route('**/pdf.worker.min.mjs', async route => route.fulfill({
        contentType: 'application/javascript',
        body: await readFile(new URL('pdfjs-dist/build/pdf.worker.min.mjs', MODULES), 'utf8')
    }));

    await page.route('**/chartjs-adapter-date-fns**', route =>
        route.fulfill({ contentType: 'application/javascript', body: '' }));
    await page.route('**/fonts.googleapis.com/**', route =>
        route.fulfill({ contentType: 'text/css', body: '' }));
    await page.route('**/fonts.gstatic.com/**', route => route.fulfill({ status: 200, body: '' }));

    // No test depends on live rates; a reachable API would make runs non-deterministic.
    await page.route('**/api.phiwi.de/**', route => route.fulfill({ status: 503, body: '' }));
}
