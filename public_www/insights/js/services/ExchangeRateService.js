export const EXCHANGE_RATE_API_BASE = 'https://api.phiwi.de/exchange-rates/v1/EUR';

export class ExchangeRateService {
    static isAvailable = false;
    static apiKey = 'ytSbcPmtlBijIqq8w76uNVJaGNoNTVJp6PfalmLS1w2sqYplRYRyTowotYTC4BnKapsTD4MA3Xs5ipn5TD1tNS4ov31WYKBEzKqnwWtmtS9aie6CwLw0FoCpqkWn5lVt';

    static #buildUrl(path) {
        const url = new URL(`${EXCHANGE_RATE_API_BASE}${path}`);
        url.searchParams.append('key', this.apiKey);
        return url.toString();
    }

    static async checkAvailability() {
        try {
            const now = new Date();
            const response = await fetch(this.#buildUrl(`/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`));
            this.isAvailable = response.ok;
            this.updateUiIndicator();
        } catch (error) {
            this.isAvailable = false;
            this.updateUiIndicator();
        }
    }

    static updateUiIndicator() {
        const indicator = document.getElementById('api-status-indicator');
        if (!indicator) return;
        indicator.className = this.isAvailable
            ? 'inline-flex items-center px-4 py-2 border border-green-300 dark:border-green-800 shadow-sm text-sm font-medium rounded-md text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-900/30'
            : 'inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-800 shadow-sm text-sm font-medium rounded-md text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/30';
        indicator.innerHTML = this.isAvailable
            ? '<svg class="-ml-1 mr-3 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg><span>API Online</span>'
            : '<svg class="-ml-1 mr-3 h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg><span>API Offline</span>';
    }

    static async fetchRatesForTransactions(transactions) {
        if (!this.isAvailable) return { rates: [], alerts: [] };
        const requiredMonths = [...new Set(
            transactions
                .filter(t => t.currency !== 'EUR')
                .map(t => t.date.substring(0, 7)) // YYYY-MM
        )];
        if (requiredMonths.length === 0) return { rates: [], alerts: [] };
        const endpoints = requiredMonths.map(monthStr => {
            const [year, month] = monthStr.split('-');
            return this.#buildUrl(`/${year}/${month}`);
        });
        return await this.executeRequests(endpoints);
    }

    static async executeRequests(endpoints) {
        const results = [];
        const fetchPromises = endpoints.map(async (url) => {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    results.push(data);
                }
            } catch (e) { console.error(`API Fetch Error: ${url}`, e); }
        });
        await Promise.all(fetchPromises);
        return { rates: results, alerts: [] };
    }
}