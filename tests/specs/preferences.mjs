const TOOLS = [
    ['insights', '/insights/index.html', '[data-i18n-key="uploadCsvTitle"]', 'ステップ2：取引をアップロード', '#lang-switcher'],
    ['statement-parser', '/statement-parser/index.html', '[data-i18n-key="mainTitle"]', '明細パーサー', '#lang-switcher'],
    ['differ', '/differ/index.html', '[data-i18n-key="title"]', 'トランザクション比較', '#lang-select']
];

export default async function ({ page, base, check }) {
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.selectOption('#lang-switcher', 'ja');
    if (!(await page.evaluate(() => document.documentElement.classList.contains('dark')))) {
        await page.click('#theme-toggle');
    }

    check('dashboard translates',
        (await page.locator('[data-i18n-key="headerTitle"]').innerText()) === 'ツールダッシュボード');

    for (const [name, url, selector, expected, switcher] of TOOLS) {
        await page.goto(`${base}${url}`, { waitUntil: 'networkidle' });
        const text = (await page.locator(selector).first().innerText()).trim();
        check(`${name} inherits the language`, text === expected, text);
        check(`${name} inherits the theme`,
            await page.evaluate(() => document.documentElement.classList.contains('dark')));
        check(`${name} switcher shows the language`,
            (await page.locator(switcher).inputValue()) === 'ja');
    }
}
