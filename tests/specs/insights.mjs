import { join } from 'node:path';

const TIMEFRAMES = ['1m', '6m', '1y', '2y', '3y', '5y', '10y', 'max'];

const chartTotal = (page, canvasId) => page.evaluate((id) => {
    const chart = Chart.getChart(document.getElementById(id));
    return chart ? chart.data.datasets.flatMap(d => d.data).reduce((a, b) => a + Math.abs(b), 0) : 0;
}, canvasId);

export default async function ({ page, base, fixtures, check }) {
    await page.goto(`${base}/insights/index.html`, { waitUntil: 'networkidle' });
    await page.setInputFiles('#csv-file-input', join(fixtures, 'my-expenses.csv'));
    await page.waitForSelector('#dashboard-section:not(.hidden)');
    await page.selectOption('#lang-switcher', 'de');

    const income = await page.locator('#total-income').innerText();
    check('headline figures render', /\d/.test(income), income);

    const summaryRows = await page.locator('#dashboard-view table tbody tr').count();
    check('summary table lists categories', summaryRows === 5, `${summaryRows} rows`);
    check('category cards render',
        (await page.locator('#category-details-container > div').count()) === 5);

    await page.click('#open-category-modal-btn');
    const labels = await page.locator('#category-list-container label').allInnerTexts();
    check('dialog lists the real categories',
        labels.map(l => l.trim()).join(',') === 'Einkommen,Freizeit,Lebensmittel,Transport,Wohnen',
        labels.join('|'));

    await page.click('#deselect-all-btn');
    check('deselecting empties the summary',
        (await page.locator('#dashboard-view table tbody tr').count()) === 0);
    check('an empty expense chart explains itself',
        await page.locator('#no-expense-data').isVisible());

    await page.click('#select-all-btn');
    check('select-all restores the summary',
        (await page.locator('#dashboard-view table tbody tr').count()) === summaryRows);
    await page.click('#close-category-modal-btn');

    await page.click('.view-btn[data-view="timeline"]');
    for (const timeframe of TIMEFRAMES) {
        await page.selectOption('#timeframe-select', timeframe);
        const category = await chartTotal(page, 'category-timeline-chart');
        const net = await chartTotal(page, 'net-timeline-chart');
        check(`timeline ${timeframe} plots both charts`, category > 0 && net > 0,
            `category=${category.toFixed(2)} net=${net.toFixed(2)}`);
    }

    await page.selectOption('#timeline-mode-select', 'cumulative');
    const endpoints = [];
    for (const timeframe of ['1m', '1y', 'max']) {
        await page.selectOption('#timeframe-select', timeframe);
        endpoints.push(await page.evaluate(() =>
            Chart.getChart(document.getElementById('net-timeline-chart')).data.datasets[0].data.at(-1)));
    }
    check('cumulative endpoint is the overall net whatever the timeframe',
        endpoints.every(v => Math.abs(v - endpoints[0]) < 0.01),
        endpoints.map(v => v.toFixed(2)).join(' / '));
    await page.selectOption('#timeline-mode-select', 'periodic');

    await page.click('.view-btn[data-view="comparison"]');
    check('comparison offers one checkbox per year',
        (await page.locator('.year-checkbox').count()) === 2);
    await page.locator('.year-checkbox').nth(0).check();
    await page.locator('.year-checkbox').nth(1).check();
    check('bar chart has one dataset per year',
        (await page.evaluate(() => Chart.getChart(document.getElementById('comparison-chart')).data.datasets.length)) === 2);
    check('deviation chart ranks categories',
        (await page.evaluate(() => Chart.getChart(document.getElementById('comparison-deviation-chart')).data.labels.length)) >= 3);

    await page.click('.view-btn[data-view="transactions"]');
    check('transaction list shows every row',
        (await page.locator('#transactions-table-body tr').count()) === 12);
    await page.fill('#transaction-search', 'miete');
    check('search narrows the list',
        (await page.locator('#transactions-table-body tr').count()) === 2);
    await page.fill('#transaction-search', '');

    await page.selectOption('#currency-select', 'JPY_ONLY');
    check('"JPY only" keeps only natively booked JPY rows',
        (await page.locator('#transactions-table-body tr').count()) === 1);

    await page.click('#open-category-modal-btn');
    const categoriesInJpyMode = await page.locator('.cat-filter-cb').count();
    await page.click('#select-all-btn');
    await page.click('#close-category-modal-btn');
    await page.selectOption('#currency-select', 'EUR_CONVERTED');
    await page.click('.view-btn[data-view="dashboard"]');
    check('the currency mode does not shrink the category filter',
        categoriesInJpyMode === 5 &&
        (await page.locator('#dashboard-view table tbody tr').count()) === summaryRows);

    await page.selectOption('#lang-switcher', 'ja');
    check('japanese reaches labels and month names',
        (await page.locator('.view-btn[data-view="dashboard"]').innerText()) === 'ダッシュボード' &&
        (await page.locator('#month-select option[value="01"]').innerText()) === '1月');
    await page.selectOption('#lang-switcher', 'de');

    await page.selectOption('#year-select', '2025');
    const rows2025 = await page.locator('#dashboard-view table tbody tr').count();
    check('year filter narrows the summary', rows2025 > 0 && rows2025 < summaryRows, `${rows2025} rows`);
    await page.selectOption('#year-select', 'all');

    await page.click('#reset-upload-btn');
    check('reset returns to the upload screen',
        (await page.locator('#upload-section').isVisible()) &&
        !(await page.locator('#dashboard-section').isVisible()));

    await page.setInputFiles('#csv-file-input', {
        name: 'no-columns.csv', mimeType: 'text/csv', buffer: Buffer.from('foo,bar\n1,2\n')
    });
    await page.waitForSelector('#upload-error:not(.hidden)');
    check('a CSV without date/amount columns is rejected with a message',
        /Spalten/.test(await page.locator('#upload-error').innerText()));
    check('the input is cleared so the same corrected file re-triggers',
        (await page.locator('#csv-file-input').inputValue()) === '');

    await page.setInputFiles('#csv-file-input', join(fixtures, 'foreign-currency.csv'));
    await page.waitForSelector('#dashboard-section:not(.hidden)');
    check('missing rates are counted per day/currency, not per transaction',
        /^2 /.test(await page.locator('#missing-rates-warning').innerText()),
        (await page.locator('#missing-rates-warning').innerText()).slice(0, 40));
}
