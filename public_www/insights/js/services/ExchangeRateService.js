export const EXCHANGE_RATE_API_BASE = 'https://api.phiwi.de/exchange-rates/v1/EUR';

export class ExchangeRateService {
    static isAvailable = false;

    static async checkAvailability() {
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');

            const response = await fetch(`${EXCHANGE_RATE_API_BASE}/${year}/${month}`);
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

        if (this.isAvailable) {
            indicator.className = 'inline-flex items-center px-4 py-2 border border-green-300 dark:border-green-800 shadow-sm text-sm font-medium rounded-md text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-900/30';
            indicator.innerHTML = `
                <svg class="-ml-1 mr-3 h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span data-i18n-key="apiAvailable">API Online & Ready</span>
            `;
        } else {
            indicator.className = 'inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-800 shadow-sm text-sm font-medium rounded-md text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/30';
            indicator.innerHTML = `
                <svg class="-ml-1 mr-3 h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span data-i18n-key="apiUnavailable">API Offline</span>
            `;
        }

        window.dispatchEvent(new Event('i18n-update-required'));
    }

    static async fetchRatesForTransactions(transactions) {
        if (!this.isAvailable) {
            return { rates: {}, alerts: [{ type: 'error', message: 'API unavailable. Currency conversion limited.' }] };
        }

        const requiredDates = [...new Set(
            transactions
                .filter(t => t.currency !== 'EUR')
                .map(t => {
                    const dateStr = typeof t.date === 'string' ? t.date : t.date.toISOString();
                    return dateStr.split('T')[0];
                })
        )];

        if (requiredDates.length === 0) {
            return { rates: {}, alerts: [] };
        }

        const endpoints = this.determineEndpoints(requiredDates);
        return await this.executeRequests(endpoints);
    }

    static determineEndpoints(dates) {
        const months = new Set(dates.map(date => date.substring(0, 7)));
        const years = new Set(dates.map(date => date.substring(0, 4)));
        const endpoints = [];

        if (months.size === 1) {
            const [year, month] = Array.from(months)[0].split('-');
            endpoints.push(`${EXCHANGE_RATE_API_BASE}/${year}/${month}`);
        } else {
            years.forEach(year => {
                endpoints.push(`${EXCHANGE_RATE_API_BASE}/${year}`);
            });
        }

        return endpoints;
    }

    static async executeRequests(endpoints) {
        const combinedRates = {};
        const alerts = [];

        const fetchPromises = endpoints.map(async (url) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    alerts.push({ type: 'warning', message: `Failed to fetch rates from: ${url}` });
                    return;
                }

                const data = await response.json();
                if (data.success && data.rates) {
                    Object.assign(combinedRates, data.rates);
                }
            } catch (error) {
                alerts.push({ type: 'warning', message: `Network error fetching: ${url}` });
            }
        });

        await Promise.all(fetchPromises);

        return { rates: combinedRates, alerts };
    }
}