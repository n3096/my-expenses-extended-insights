import { join } from 'node:path';

export default async function ({ page, base, fixtures, check }) {
    await page.goto(`${base}/statement-parser/index.html`, { waitUntil: 'networkidle' });
    await page.selectOption('#lang-switcher', 'de');

    // Nothing below works unless the pdf.js import succeeded - a failed import
    // aborts the whole module, exactly the bug this page used to ship.
    await page.click('#theme-toggle');
    check('the module runs at all (pdf.js imported)',
        (await page.evaluate(() => localStorage.getItem('theme'))) !== null);

    await page.setInputFiles('#file-input', {
        name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello')
    });
    await page.waitForSelector('#upload-error:not(.hidden)');
    check('an unsupported extension is reported',
        /PDF/.test(await page.locator('#upload-error').innerText()));

    await page.setInputFiles('#file-input', {
        name: 'other.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b\n1,2\n')
    });
    await page.waitForFunction(() =>
        document.getElementById('upload-error').textContent.includes('CSV-Format'));
    check('an unsupported CSV reports the CSV message, not the PDF one',
        /CSV-Format/.test(await page.locator('#upload-error').innerText()));

    await page.setInputFiles('#file-input', join(fixtures, 'paypay-statement.csv'));
    await page.waitForSelector('#result-section:not(.hidden)');
    check('a PayPay statement parses',
        (await page.locator('#bank-name').innerText()) === 'PayPay' &&
        (await page.locator('.transaction-item').count()) === 5);

    const period = await page.locator('#statement-period').innerText();
    check('the statement period is derived from the rows',
        /12\.02\.2024/.test(period) && /17\.02\.2024/.test(period), period);

    await page.fill('#filter-date-from', '2024-02-14');
    await page.dispatchEvent('#filter-date-from', 'change');
    check('the date filter narrows the list',
        (await page.locator('.transaction-item').count()) === 3);

    await page.selectOption('#lang-switcher', 'ja');
    check('switching language re-renders the parsed rows',
        (await page.locator('[data-i18n-key="mainTitle"]').innerText()) === '明細パーサー' &&
        /￥|¥/.test(await page.locator('.main-amount').first().innerText()));

    await page.click('#reset-button');
    check('reset returns to the upload screen',
        await page.locator('#upload-section').isVisible());

    return ['Error processing file'];
}
