export const DEFAULT_CURRENCY = 'EUR';
const UNCATEGORIZED = 'Unkategorisiert';

/**
 * Converts transactions into the currency the user selected.
 *
 * The selection is encoded as `<CURRENCY>_<MODE>`:
 *   - `EUR_CONVERTED` converts every transaction into EUR.
 *   - `EUR_ONLY` keeps only the transactions that were booked in EUR.
 */
export class CurrencyService {
    static parseSelection(selection) {
        const [currency, mode] = String(selection ?? '').split('_');
        return {
            currency: (currency || DEFAULT_CURRENCY).toUpperCase(),
            nativeOnly: mode === 'ONLY'
        };
    }

    static currencyOf(transaction) {
        return (transaction.currency || DEFAULT_CURRENCY).toUpperCase();
    }

    /**
     * @param transactions raw transactions
     * @param selection    value of the currency dropdown
     * @param getRate      (isoDate, currency) => rate against the API base currency, or null
     * @returns {{ transactions: Array, missingRates: number }} missingRates counts
     *          distinct day/currency rates, not the transactions that needed them.
     */
    static process(transactions, selection, getRate) {
        const { currency: target, nativeOnly } = this.parseSelection(selection);
        const missing = new Set();

        const rateFor = (date, currency) => {
            const rate = getRate(date, currency);
            if (!rate) missing.add(`${this.#dayOf(date)}|${currency}`);
            return rate;
        };

        const processed = transactions
            .filter(t => !nativeOnly || this.currencyOf(t) === target)
            .map(t => {
                const source = this.currencyOf(t);
                const convertible = !nativeOnly && source !== target;
                const sourceRate = convertible ? rateFor(t.date, source) : null;
                const targetRate = convertible ? rateFor(t.date, target) : null;

                return {
                    ...t,
                    displayAmount: sourceRate && targetRate ? (t.amount / sourceRate) * targetRate : t.amount,
                    displayCurrency: nativeOnly ? source : target,
                    displayCategory: t.category || UNCATEGORIZED
                };
            });

        return { transactions: processed, missingRates: missing.size };
    }

    static #dayOf(dateStr) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
}
