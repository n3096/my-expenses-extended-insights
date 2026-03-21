import { ExchangeRateService } from './services/ExchangeRateService.js';

document.addEventListener('DOMContentLoaded', () => {
    ExchangeRateService.checkAvailability();
});

export async function processTransactionsWithRates(allTransactions) {
    const { rates, alerts } = await ExchangeRateService.fetchRatesForTransactions(allTransactions);

    return {
        rates,
        alerts
    };
}