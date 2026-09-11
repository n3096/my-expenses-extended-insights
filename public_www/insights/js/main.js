import { AppStore } from './store/AppStore.js';
import { TransactionParser } from './services/TransactionParser.js';
import { ExchangeRateService } from './services/ExchangeRateService.js';
import { UIManager } from './ui/UIManager.js';
import { ChartManager } from './ui/ChartManager.js';
import { TableManager } from './ui/TableManager.js';
import { CompareManager } from './services/CompareManager.js';
import { I18nService } from './services/I18nService.js';

class App {
    static async init() {
        try {
            await I18nService.init();
            UIManager.init();
            ChartManager.init();
            TableManager.init();
            CompareManager.init();
            this.bindEvents();

            ExchangeRateService.checkAvailability();
        } catch (e) {
            console.error('Initialisation failed:', e);
        }
    }

    static bindEvents() {
        document.getElementById('csv-file-input')?.addEventListener('change', (e) => this.handleUpload(e));
        document.getElementById('reset-upload-btn')?.addEventListener('click', () => this.reset());
    }

    static async handleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        UIManager.showUploadError(null);
        UIManager.setLoading(true);

        try {
            const { transactions, error } = TransactionParser.parse(await file.text());

            if (error) {
                UIManager.showUploadError(error);
                return;
            }

            if (!ExchangeRateService.isAvailable) await ExchangeRateService.checkAvailability();
            const { rates } = await ExchangeRateService.fetchRatesForTransactions(transactions);

            AppStore.update({
                transactions,
                exchangeRates: rates,
                filters: {
                    categories: new Set(transactions.map(t => t.category)),
                    year: 'all',
                    month: 'all',
                    comparisonYears: []
                }
            });
        } catch (err) {
            console.error('Upload error:', err);
            UIManager.showUploadError('uploadError');
        } finally {
            UIManager.setLoading(false);
            // Clear the input so picking the same file again still fires `change`
            // - otherwise a corrected re-upload of a rejected file does nothing.
            event.target.value = '';
        }
    }

    static reset() {
        const input = document.getElementById('csv-file-input');
        if (input) input.value = '';

        UIManager.showUploadError(null);
        AppStore.update({
            transactions: [],
            filters: { categories: new Set(), year: 'all', month: 'all', comparisonYears: [] }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => App.init());
