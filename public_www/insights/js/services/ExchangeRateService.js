import { EXCHANGE_RATE_API } from '../config.js';
import { I18nService } from './I18nService.js';
import { CurrencyService, DEFAULT_CURRENCY } from './CurrencyService.js';

const INDICATOR_CLASSES = {
    base: 'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border',
    online: 'text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-800',
    offline: 'text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800'
};

export class ExchangeRateService {
    static isAvailable = false;

    static #buildUrl(path) {
        const url = new URL(`${EXCHANGE_RATE_API.baseUrl}${path}`);
        url.searchParams.set('key', EXCHANGE_RATE_API.key);
        return url.toString();
    }

    static #monthPath(year, month) {
        return `/${year}/${String(month).padStart(2, '0')}`;
    }

    static async checkAvailability() {
        const now = new Date();
        try {
            const response = await fetch(this.#buildUrl(this.#monthPath(now.getFullYear(), now.getMonth() + 1)));
            this.isAvailable = response.ok;
        } catch (error) {
            console.error('Exchange rate API unreachable:', error);
            this.isAvailable = false;
        }
        this.updateUiIndicator();
        return this.isAvailable;
    }

    static updateUiIndicator() {
        const indicator = document.getElementById('api-status-indicator');
        if (!indicator) return;

        const key = this.isAvailable ? 'apiOnline' : 'apiOffline';
        indicator.className = `${INDICATOR_CLASSES.base} ${this.isAvailable ? INDICATOR_CLASSES.online : INDICATOR_CLASSES.offline}`;
        indicator.dataset.i18nKey = key;
        indicator.textContent = I18nService.get(key);
    }

    /** Loads one month of rates for every month that contains a foreign-currency transaction. */
    static async fetchRatesForTransactions(transactions) {
        if (!this.isAvailable) return { rates: [] };

        const months = [...new Set(
            transactions
                .filter(t => CurrencyService.currencyOf(t) !== DEFAULT_CURRENCY)
                .map(t => this.#monthOf(t.date))
        )];
        if (months.length === 0) return { rates: [] };

        const urls = months.map(month => this.#buildUrl(this.#monthPath(...month.split('-'))));
        return { rates: await this.#fetchAll(urls) };
    }

    /** Local YYYY-MM of a transaction, matching how rates are looked up. */
    static #monthOf(dateStr) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    static async #fetchAll(urls) {
        const responses = await Promise.all(urls.map(url => this.#fetchJson(url)));
        return responses.filter(Boolean);
    }

    static async #fetchJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Exchange rate request failed (${response.status}): ${url}`);
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Exchange rate request failed: ${url}`, error);
            return null;
        }
    }
}
