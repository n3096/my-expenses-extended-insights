import { I18nService } from './I18nService.js';

export class TransactionParser {
    static parse(csvText) {
        const delimiter = this.#detectDelimiter(csvText);
        const lines = csvText.trim().split(/\r?\n/);

        if (lines.length < 2) return { transactions: [], alerts: [] };

        const headers = this.#parseCsvRow(lines.shift(), delimiter).map(h => h.trim().toLowerCase());

        const idx = {
            date: this.#findIdx(headers, ['date', 'datum']),
            amount: this.#findIdx(headers, ['amount', 'betrag', 'summe']),
            income: headers.indexOf('income'),
            expense: headers.indexOf('expense'),
            currency: this.#findIdx(headers, ['currency', 'währung', 'curr']),
            category: this.#findIdx(headers, ['category', 'kategorie']),
            desc: this.#findIdx(headers, ['description', 'verwendungszweck', 'payee'])
        };

        const rawTransactions = [];
        lines.forEach((line, i) => {
            const values = this.#parseCsvRow(line, delimiter);
            if (values.length <= Math.max(idx.date, idx.amount === -1 ? 0 : idx.amount)) return;

            const date = this.#parseDate(values[idx.date]);
            if (isNaN(date.getTime())) return;

            let amount = 0;
            let type = 'expense';

            if (idx.income !== -1 && idx.expense !== -1) {
                const inc = this.#parseNumeric(values[idx.income]);
                const exp = this.#parseNumeric(values[idx.expense]);
                if (inc > 0) { amount = inc; type = 'income'; }
                else { amount = exp; type = 'expense'; }
            } else {
                const val = this.#parseNumeric(values[idx.amount]);
                amount = Math.abs(val);
                type = val >= 0 ? 'income' : 'expense';
            }

            const rawCat = idx.category !== -1 ? (values[idx.category] || '') : '';
            const mainCategory = rawCat.includes(' > ') ? rawCat.split(' > ')[0].trim() : rawCat.trim();

            let currency = 'EUR';
            if (idx.currency !== -1 && values[idx.currency]) {
                currency = values[idx.currency].trim().toUpperCase();
            }

            rawTransactions.push({
                id: `t-${i}-${Date.now()}`,
                date: date.toISOString(),
                amount,
                type,
                currency,
                category: mainCategory || 'Unkategorisiert',
                description: idx.desc !== -1 ? (values[idx.desc] || '') : ''
            });
        });

        return { transactions: rawTransactions, alerts: [] };
    }

    static #detectDelimiter(text) {
        const firstLine = text.split('\n')[0];
        return firstLine.includes(';') ? ';' : ',';
    }

    static #parseCsvRow(row, delimiter) {
        const regex = new RegExp(`${delimiter}(?=(?:[^"]*"[^"]*")*[^"]*$)`);
        return row.split(regex).map(v => v.replace(/^"|"$/g, '').trim());
    }

    static #findIdx(headers, aliases) {
        return headers.findIndex(h => aliases.some(a => h.includes(a)));
    }

    static #parseNumeric(val) {
        if (!val) return 0;
        const clean = val.replace(/[^0-9,\.-]/g, '');
        if (clean.includes(',') && clean.includes('.')) return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
        return parseFloat(clean.replace(',', '.'));
    }

    static #parseDate(str) {
        const parts = str.split(/[./-]/);
        if (parts.length === 3) {
            let [d, m, y] = parts;
            if (d.length === 4) [y, m, d] = parts;
            const fullYear = y.length === 2 ? `20${y}` : y;
            return new Date(fullYear, m - 1, d, 12, 0, 0);
        }
        return new Date(str);
    }
}