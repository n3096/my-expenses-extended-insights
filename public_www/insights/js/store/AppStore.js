import { CurrencyService, DEFAULT_CURRENCY } from '../services/CurrencyService.js';
import { FilterService } from '../services/FilterService.js';
import { Preferences } from '../../../assets/js/preferences.js';

export const AppStore = {
    state: {
        transactions: [],
        /** All transactions, converted into the selected display currency. */
        processedTransactions: [],
        /** processedTransactions restricted to the selected year/month. */
        timeFilteredTransactions: [],
        /** processedTransactions restricted to the selected categories. */
        categoryFilteredTransactions: [],
        /** processedTransactions restricted to both year/month and categories. */
        fullyFilteredTransactions: [],
        exchangeRates: {},
        /** Every category in the uploaded file, sorted - independent of any filter. */
        categories: [],
        /** Number of transactions that could not be converted for lack of a rate. */
        missingRates: 0,
        filters: {
            year: 'all',
            month: 'all',
            categories: new Set(),
            comparisonYears: [],
            comparisonType: 'net',
            comparisonChartType: 'bar',
            timelineTimeframe: '1y',
            timelineMode: 'periodic'
        },
        ui: {
            currentLang: Preferences.language(),
            currentView: 'dashboard',
            currencySelect: 'EUR_CONVERTED',
            theme: Preferences.theme()
        }
    },

    listeners: [],
    subscribe(callback) { this.listeners.push(callback); },

    update(newState) {
        const { exchangeRates, ...rest } = newState;
        if (exchangeRates) this.mergeRates(exchangeRates);

        this.state = {
            ...this.state,
            ...rest,
            ui: rest.ui ? { ...this.state.ui, ...rest.ui } : this.state.ui,
            filters: rest.filters ? { ...this.state.filters, ...rest.filters } : this.state.filters
        };

        this.processData();
        this.notify();
    },

    mergeRates(data) {
        if (!data) return;
        const responses = Array.isArray(data) ? data : [data];
        responses.forEach(apiResponse => {
            if (!apiResponse || !apiResponse.metadata) return;
            const year = apiResponse.metadata.year;
            if (!this.state.exchangeRates[year]) this.state.exchangeRates[year] = {};
            if (apiResponse.days) {
                const month = apiResponse.metadata.month;
                if (!this.state.exchangeRates[year][month]) this.state.exchangeRates[year][month] = {};
                for (const [day, dayData] of Object.entries(apiResponse.days)) {
                    this.state.exchangeRates[year][month][day] = dayData.rates;
                }
            } else if (apiResponse.months) {
                for (const [month, monthData] of Object.entries(apiResponse.months)) {
                    if (!this.state.exchangeRates[year][month]) this.state.exchangeRates[year][month] = {};
                    for (const [day, dayData] of Object.entries(monthData)) {
                        this.state.exchangeRates[year][month][day] = dayData.rates;
                    }
                }
            }
        });
    },

    getRate(dateStr, currency) {
        if (!currency || currency === DEFAULT_CURRENCY) return 1;

        // Transactions carry the local calendar day the booking happened on, so
        // the rate has to be looked up with local date parts as well.
        const date = new Date(dateStr);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const monthData = this.state.exchangeRates[year]?.[month];
        if (!monthData) return null;

        const rates = monthData[day] ?? this.nearestDayRates(monthData, day);
        return rates?.[currency] ?? null;
    },

    /** Weekends and holidays have no published rate, so fall back to the closest day. */
    nearestDayRates(monthData, day) {
        const days = Object.keys(monthData).sort();
        if (!days.length) return null;
        const target = Number(day);
        const closest = days.reduce((best, current) =>
            Math.abs(Number(current) - target) < Math.abs(Number(best) - target) ? current : best
        );
        return monthData[closest];
    },

    processData() {
        const { transactions, ui, filters } = this.state;
        if (!transactions.length) {
            this.state.categories = [];
            this.state.missingRates = 0;
            this.state.processedTransactions = [];
            this.state.timeFilteredTransactions = [];
            this.state.categoryFilteredTransactions = [];
            this.state.fullyFilteredTransactions = [];
            return;
        }
        this.state.categories = [...new Set(transactions.map(t => t.category))].sort();

        const { transactions: processed, missingRates } = CurrencyService.process(
            transactions,
            ui.currencySelect,
            (date, currency) => this.getRate(date, currency)
        );
        this.state.processedTransactions = processed;
        this.state.missingRates = missingRates;

        this.state.timeFilteredTransactions = FilterService.byPeriod(processed, filters);
        this.state.categoryFilteredTransactions = FilterService.byCategory(processed, filters);
        this.state.fullyFilteredTransactions = FilterService.byCategory(this.state.timeFilteredTransactions, filters);
    },

    /** A failing subscriber must not stop the remaining ones from rendering. */
    notify() {
        this.listeners.forEach(cb => {
            try {
                cb(this.state);
            } catch (error) {
                console.error('Store subscriber failed:', error);
            }
        });
    }
};