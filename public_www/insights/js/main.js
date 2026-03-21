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
        } catch (e) { console.error(e); }
    }

    static bindEvents() {
        document.getElementById('csv-file-input')?.addEventListener('change', (e) => this.handleUpload(e));
    }

    static async handleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        UIManager.setLoading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const { transactions } = TransactionParser.parse(e.target.result);
                await ExchangeRateService.checkAvailability();
                const { rates } = await ExchangeRateService.fetchRatesForTransactions(transactions);

                const allCats = [...new Set(transactions.map(t => t.category))];

                AppStore.update({
                    transactions,
                    exchangeRates: rates,
                    filters: {
                        categories: new Set(allCats),
                        year: 'all',
                        month: 'all',
                        comparisonYears: []
                    }
                });
            } catch (err) {
                console.error("Upload Error:", err);
            } finally {
                UIManager.setLoading(false);
            }
        };
        reader.readAsText(file);
    }
}

document.addEventListener('DOMContentLoaded', () => App.init());