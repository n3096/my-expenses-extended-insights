export const DEFAULT_CURRENCY = 'EUR';

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
     * @returns {{ transactions: Array, missingRates: number }}
     */
    static process(transactions, selection, getRate) {
        const { currency: target, nativeOnly } = this.parseSelection(selection);
        let missingRates = 0;

        const processed = transactions
            .filter(t => !nativeOnly || this.currencyOf(t) === target)
            .map(t => {
                const source = this.currencyOf(t);
                let displayAmount = t.amount;
                let rateMissing = false;

                if (!nativeOnly && source !== target) {
                    const sourceRate = getRate(t.date, source);
                    const targetRate = getRate(t.date, target);
                    if (sourceRate && targetRate) {
                        displayAmount = (t.amount / sourceRate) * targetRate;
                    } else {
                        rateMissing = true;
                        missingRates++;
                    }
                }

                return {
                    ...t,
                    displayAmount,
                    displayCurrency: nativeOnly ? source : target,
                    displayCategory: t.category || 'Unkategorisiert',
                    rateMissing
                };
            });

        return { transactions: processed, missingRates };
    }
}
