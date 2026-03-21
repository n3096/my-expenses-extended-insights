import { AppStore } from '../store/AppStore.js';

export class CurrencyService {
    static processTransactions(transactions, exchangeRates, targetCurrency) {
        if (!transactions) return [];

        return transactions.map(t => {
            let displayAmount = t.amount;
            let displayCurrency = t.currency;

            if (targetCurrency === 'EUR_CONVERTED') {
                displayCurrency = 'EUR';
                if (t.currency === 'JPY') {
                    const dateStr = typeof t.date === 'string' ? t.date.split('T')[0] : t.date.toISOString().split('T')[0];
                    const rate = exchangeRates[dateStr]?.JPY;
                    displayAmount = rate ? t.amount / rate : t.amount / 160;
                }
            } else if (targetCurrency === 'JPY_CONVERTED') {
                displayCurrency = 'JPY';
                if (t.currency === 'EUR') {
                    const dateStr = typeof t.date === 'string' ? t.date.split('T')[0] : t.date.toISOString().split('T')[0];
                    const rate = exchangeRates[dateStr]?.JPY;
                    displayAmount = rate ? t.amount * rate : t.amount * 160;
                }
            } else if (targetCurrency === 'EUR') {
                if (t.currency !== 'EUR') displayAmount = 0;
            } else if (targetCurrency === 'JPY') {
                if (t.currency !== 'JPY') displayAmount = 0;
            }

            return {
                ...t,
                displayAmount,
                displayCurrency,
                displayCategory: t.displayCategory || t.mainCategory,
                description: t.description || '',
                account: t.account || ''
            };
        });
    }
}