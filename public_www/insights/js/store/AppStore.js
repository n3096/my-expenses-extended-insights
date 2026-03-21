export const AppStore = {
    state: {
        transactions: [],
        processedTransactions: [],
        timeFilteredTransactions: [],
        fullyFilteredTransactions: [],
        exchangeRates: {},
        filters: {
            year: 'all',
            month: 'all',
            categories: new Set(),
            comparisonYears: [],
            comparisonType: 'net',
            comparisonChartType: 'bar',
            showSubcategories: true
        },
        ui: {
            currentLang: 'de',
            currentView: 'dashboard',
            currencySelect: 'EUR_CONVERTED',
            theme: 'dark'
        }
    },

    listeners: [],
    subscribe(callback) { this.listeners.push(callback); },

    update(newState) {
        if (newState.exchangeRates) {
            this.mergeRates(newState.exchangeRates);
            delete newState.exchangeRates;
        }

        const ui = newState.ui ? { ...this.state.ui, ...newState.ui } : this.state.ui;
        const filters = newState.filters ? { ...this.state.filters, ...newState.filters } : this.state.filters;

        this.state = {
            ...this.state,
            ...newState,
            ui,
            filters
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
        if (!currency || currency === 'EUR') return 1;
        const d = new Date(dateStr);
        const year = d.getUTCFullYear().toString();
        const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = d.getUTCDate().toString().padStart(2, '0');
        const yearData = this.state.exchangeRates[year];
        if (!yearData) return null;
        const monthData = yearData[month];
        if (!monthData) return null;
        const rates = monthData[day] || monthData[Object.keys(monthData).sort()[0]];
        return (rates && rates[currency]) ? rates[currency] : null;
    },

    processData() {
        const { transactions, ui, filters } = this.state;
        if (!transactions.length) return;
        const targetCurrency = ui.currencySelect.split('_')[0].toUpperCase();
        this.state.processedTransactions = transactions.map(t => {
            const transCurrency = (t.currency || 'EUR').toUpperCase();
            const sourceRate = this.getRate(t.date, transCurrency);
            const targetRate = this.getRate(t.date, targetCurrency);
            let displayAmount = t.amount;
            if (sourceRate && targetRate) {
                displayAmount = (t.amount / sourceRate) * targetRate;
            }
            return {
                ...t,
                displayAmount,
                displayCategory: t.category || 'Unkategorisiert'
            };
        });

        this.state.timeFilteredTransactions = this.state.processedTransactions.filter(t => {
            const date = new Date(t.date);
            const yearMatch = filters.year === 'all' || date.getFullYear().toString() === filters.year;
            const monthMatch = filters.month === 'all' || (date.getMonth() + 1).toString().padStart(2, '0') === filters.month.padStart(2, '0');
            return yearMatch && monthMatch;
        });

        this.state.fullyFilteredTransactions = this.state.timeFilteredTransactions.filter(t =>
            filters.categories.has(t.displayCategory)
        );
    },

    notify() { this.listeners.forEach(cb => cb(this.state)); }
};