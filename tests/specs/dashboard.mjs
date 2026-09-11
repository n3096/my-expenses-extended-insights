export default async function ({ page, base, check }) {
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });

    const cards = await page.locator('#tool-grid a').count();
    check('lists every tool from tools.json', cards === 3, `${cards} cards`);

    const links = await page.locator('#tool-grid a').evaluateAll(els => els.map(e => e.getAttribute('href')));
    check('links point at the tool folders',
        links.join(',') === 'insights,statement-parser,differ', links.join(','));
}
