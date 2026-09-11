import { DEFAULT_CURRENCY } from './CurrencyService.js';

const UNCATEGORIZED = 'Unkategorisiert';
const CATEGORY_SEPARATOR = ' > ';

const COLUMN_ALIASES = {
    date: ['date', 'datum'],
    amount: ['amount', 'betrag', 'summe'],
    currency: ['currency', 'währung', 'curr'],
    category: ['category', 'kategorie'],
    description: ['description', 'verwendungszweck', 'payee']
};

export class TransactionParser {
    /**
     * @returns {{ transactions: Array, error: string|null }} `error` is a
     *          translation key describing why nothing could be read.
     */
    static parse(csvText) {
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length < 2) return { transactions: [], error: 'emptyCsvError' };

        const delimiter = this.#detectDelimiter(lines[0]);
        const headers = this.#parseRow(lines[0], delimiter).map(h => h.toLowerCase());
        const columns = this.#locateColumns(headers);

        if (!this.#hasRequiredColumns(columns)) {
            return { transactions: [], error: 'csvMissingColumns' };
        }

        const transactions = lines.slice(1)
            .map((line, i) => this.#toTransaction(this.#parseRow(line, delimiter), columns, i))
            .filter(Boolean);

        return { transactions, error: transactions.length ? null : 'emptyCsvError' };
    }

    static #locateColumns(headers) {
        const columns = Object.fromEntries(
            Object.entries(COLUMN_ALIASES).map(([name, aliases]) => [
                name,
                headers.findIndex(h => aliases.some(alias => h.includes(alias)))
            ])
        );
        // "Income"/"Expense" are matched exactly - "amount" style aliases would
        // also hit them and pick the wrong column.
        columns.income = headers.indexOf('income');
        columns.expense = headers.indexOf('expense');
        return columns;
    }

    static #hasRequiredColumns(columns) {
        const hasAmount = columns.amount !== -1 || (columns.income !== -1 && columns.expense !== -1);
        return columns.date !== -1 && hasAmount;
    }

    static #toTransaction(values, columns, index) {
        const date = this.#parseDate(values[columns.date]);
        if (!date) return null;

        const { amount, type } = this.#parseAmount(values, columns);
        if (amount === 0) return null;

        return {
            id: `t-${index}`,
            date: date.toISOString(),
            amount,
            type,
            currency: this.#valueAt(values, columns.currency).toUpperCase() || DEFAULT_CURRENCY,
            category: this.#parseCategory(this.#valueAt(values, columns.category)),
            description: this.#valueAt(values, columns.description)
        };
    }

    static #parseAmount(values, columns) {
        if (columns.income !== -1 && columns.expense !== -1) {
            const income = this.#parseNumeric(values[columns.income]);
            if (income > 0) return { amount: income, type: 'income' };
            return { amount: Math.abs(this.#parseNumeric(values[columns.expense])), type: 'expense' };
        }

        const value = this.#parseNumeric(values[columns.amount]);
        return { amount: Math.abs(value), type: value >= 0 ? 'income' : 'expense' };
    }

    static #parseCategory(raw) {
        const main = raw.includes(CATEGORY_SEPARATOR) ? raw.split(CATEGORY_SEPARATOR)[0] : raw;
        return main.trim() || UNCATEGORIZED;
    }

    static #valueAt(values, index) {
        return index === -1 ? '' : (values[index] ?? '').trim();
    }

    static #detectDelimiter(headerLine) {
        return headerLine.includes(';') ? ';' : ',';
    }

    static #parseRow(row, delimiter) {
        const splitOutsideQuotes = new RegExp(`${delimiter}(?=(?:[^"]*"[^"]*")*[^"]*$)`);
        return row.split(splitOutsideQuotes).map(v => v.replace(/^"|"$/g, '').trim());
    }

    static #parseNumeric(value) {
        if (!value) return 0;
        const clean = value.replace(/[^0-9,.-]/g, '');
        const normalized = clean.includes(',') && clean.includes('.')
            ? clean.replace(/\./g, '').replace(',', '.')  // 1.234,56
            : clean.replace(',', '.');
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    /** Accepts dd.MM.yy(yy), dd/MM/yyyy and yyyy-MM-dd. Returns null if unusable. */
    static #parseDate(value) {
        const parts = String(value ?? '').split(/[./-]/);
        if (parts.length !== 3 || parts.some(part => !part)) return null;

        let [day, month, year] = parts;
        if (day.length === 4) [year, month, day] = parts;
        if (year.length === 2) year = `20${year}`;

        // Midday keeps the calendar day stable across time zones.
        const date = new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0);
        return Number.isNaN(date.getTime()) ? null : date;
    }
}
