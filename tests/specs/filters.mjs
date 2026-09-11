import { join } from 'node:path';

const EXPECTED_CONTROLS = {
    dashboard: ['Jahr', 'Monat', 'Währung', 'Kategorien filtern'],
    timeline: ['Zeitbereich', 'Darstellung'],
    comparison: ['Jahre vergleichen', 'Diagrammtyp', 'Daten', 'Währung'],
    transactions: ['Jahr', 'Monat', 'Währung', 'Kategorien filtern']
};

async function visibleControls(page) {
    const controls = [];
    for (const control of await page.locator('.filter-control').all()) {
        if (!(await control.isVisible())) continue;
        controls.push({
            label: (await control.locator('label').first().innerText()).trim(),
            order: Number(await control.evaluate(el => getComputedStyle(el).order)) || 0
        });
    }
    return controls.sort((a, b) => a.order - b.order).map(c => c.label);
}

export default async function ({ page, base, fixtures, check }) {
    await page.goto(`${base}/insights/index.html`, { waitUntil: 'networkidle' });
    await page.setInputFiles('#csv-file-input', join(fixtures, 'my-expenses.csv'));
    await page.waitForSelector('#dashboard-section:not(.hidden)');
    await page.selectOption('#lang-switcher', 'de');

    for (const [view, expected] of Object.entries(EXPECTED_CONTROLS)) {
        await page.click(`.view-btn[data-view="${view}"]`);
        const shown = await visibleControls(page);
        check(`${view} shows exactly the controls that apply to it`,
            JSON.stringify(shown) === JSON.stringify(expected), shown.join(' | '));
    }

    await page.click('.view-btn[data-view="comparison"]');
    await page.locator('.year-checkbox').nth(0).check();
    await page.locator('.year-checkbox').nth(1).check();

    await page.selectOption('#comparison-chart-type-select', 'pie');
    check('chart type switches to one pie per year',
        (await page.locator('#comparison-pie-charts-container canvas').count()) === 2);
    await page.selectOption('#comparison-chart-type-select', 'bar');
    check('and back to a bar chart',
        await page.evaluate(() => !!Chart.getChart(document.getElementById('comparison-chart'))));

    const barTotal = () => page.evaluate(() =>
        Chart.getChart(document.getElementById('comparison-chart'))
            .data.datasets.flatMap(d => d.data).reduce((a, b) => a + Math.abs(b), 0));

    const beforeCurrency = await barTotal();
    await page.selectOption('#currency-select', 'JPY_ONLY');
    const afterCurrency = await barTotal();
    check('the currency control reaches the comparison view',
        beforeCurrency !== afterCurrency,
        `${beforeCurrency.toFixed(2)} -> ${afterCurrency.toFixed(2)}`);
    await page.selectOption('#currency-select', 'EUR_CONVERTED');

    await page.click('.view-btn[data-view="timeline"]');
    await page.selectOption('#timeframe-select', '6m');
    await page.click('.view-btn[data-view="dashboard"]');
    await page.selectOption('#year-select', '2025');
    await page.click('.view-btn[data-view="timeline"]');
    check('the timeline keeps its timeframe across view switches',
        (await page.locator('#timeframe-select').inputValue()) === '6m');

    await page.click('.view-btn[data-view="comparison"]');
    check('the comparison keeps its selected years',
        (await page.locator('.year-checkbox:checked').count()) === 2);
}
