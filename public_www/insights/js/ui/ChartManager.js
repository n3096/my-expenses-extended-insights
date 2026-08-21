import { AppStore } from '../store/AppStore.js';
import { I18nService } from '../services/I18nService.js';
import { CurrencyService } from '../services/CurrencyService.js';
import { ACCENT_COLOR, CHART_COLORS, colorAt } from './palette.js';

const WEEKS_IN_SHORT_TIMEFRAME = 5;

export class ChartManager {
    static instances = new Map();

    static init() {
        AppStore.subscribe(state => {
            if (state.transactions.length > 0) this.update(state);
        });
    }

    static update(state) {
        const { currency } = CurrencyService.parseSelection(state.ui.currencySelect);
        const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });

        if (state.ui.currentView === 'dashboard') {
            const data = state.fullyFilteredTransactions;
            const income = data.filter(t => t.type === 'income').reduce((s,t) => s + t.displayAmount, 0);
            const expenses = data.filter(t => t.type === 'expense').reduce((s,t) => s + t.displayAmount, 0);

            this.setTxt('total-income', formatter.format(income));
            this.setTxt('total-expenses', formatter.format(-expenses));
            this.setTxt('net-savings', formatter.format(income - expenses));

            this.renderExpenseChart(data);
        }

        if (state.ui.currentView === 'timeline') {
            this.renderCategoryTimeline(state);
            this.renderTotalNetTimeline(state);
        }
    }

    static renderCategoryTimeline(state) {
        if (!document.getElementById('category-timeline-chart')) return;

        const { timelineTimeframe: timeframe, timelineMode: mode } = state.filters;
        const periods = this.getPeriods(state.processedTransactions, timeframe);
        const netByPeriod = this.sumByPeriodAndCategory(state.processedTransactions, periods, timeframe);

        const allSortedCats = [...new Set(state.processedTransactions.map(t => t.displayCategory))].sort();
        const activeCategories = allSortedCats.filter(cat => state.filters.categories.has(cat));

        const datasets = activeCategories.map(cat => {
            const color = colorAt(allSortedCats.indexOf(cat));
            let running = 0;

            const values = periods.map(period => {
                const value = netByPeriod.get(period.key)?.get(cat) ?? 0;
                if (mode !== 'cumulative') return value;
                running += value;
                return running;
            });

            return {
                label: cat,
                data: values,
                borderColor: color,
                backgroundColor: `${color}22`,
                tension: 0.3,
                fill: mode === 'cumulative',
                pointRadius: 3
            };
        });

        this.draw('category-timeline-chart', {
            type: 'line',
            data: { labels: periods.map(p => p.label), datasets },
            options: this.getOptions(state, { allowNegative: true, showLegend: true })
        });
    }

    static renderTotalNetTimeline(state) {
        if (!document.getElementById('net-timeline-chart')) return;

        const { timelineTimeframe: timeframe, timelineMode: mode } = state.filters;
        const periods = this.getPeriods(state.processedTransactions, timeframe);

        // The cumulative line has to start at the very first transaction, otherwise
        // the selected timeframe would silently reset the running total to zero.
        const allPeriods = this.getPeriods(state.processedTransactions, 'max');
        const netByPeriod = this.sumByPeriod(state.processedTransactions, allPeriods, 'max');

        let running = 0;
        const totals = new Map();
        allPeriods.forEach(period => {
            const periodic = netByPeriod.get(period.key) ?? 0;
            running += periodic;
            totals.set(period.key, { periodic, cumulative: running });
        });

        const values = periods.map(period => totals.get(period.key)?.[mode] ?? 0);

        this.draw('net-timeline-chart', {
            type: 'line',
            data: {
                labels: periods.map(p => p.label),
                datasets: [{
                    label: I18nService.get(mode === 'cumulative' ? 'cumulative' : 'netResult'),
                    data: values,
                    borderColor: ACCENT_COLOR,
                    backgroundColor: `${ACCENT_COLOR}22`,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 2
                }]
            },
            options: this.getOptions(state, { allowNegative: true })
        });
    }

    /** Net amount (income - expense) per period, keyed by period. */
    static sumByPeriod(transactions, periods, timeframe) {
        const totals = new Map();
        this.forEachInPeriod(transactions, periods, timeframe, (period, transaction) => {
            const signed = transaction.type === 'income' ? transaction.displayAmount : -transaction.displayAmount;
            totals.set(period.key, (totals.get(period.key) ?? 0) + signed);
        });
        return totals;
    }

    /** Net amount per period and category, keyed by period then category. */
    static sumByPeriodAndCategory(transactions, periods, timeframe) {
        const totals = new Map(periods.map(period => [period.key, new Map()]));
        this.forEachInPeriod(transactions, periods, timeframe, (period, transaction) => {
            const byCategory = totals.get(period.key);
            const signed = transaction.type === 'income' ? transaction.displayAmount : -transaction.displayAmount;
            byCategory.set(transaction.displayCategory, (byCategory.get(transaction.displayCategory) ?? 0) + signed);
        });
        return totals;
    }

    static forEachInPeriod(transactions, periods, timeframe, callback) {
        const byKey = new Map(periods.map(period => [period.key, period]));
        transactions.forEach(transaction => {
            const period = this.periodOf(transaction.date, periods, byKey, timeframe);
            if (period) callback(period, transaction);
        });
    }

    static periodOf(dateStr, periods, byKey, timeframe) {
        const date = new Date(dateStr);
        if (timeframe === '1m') {
            return periods.find(p => date >= p.start && date < p.end) ?? null;
        }
        return byKey.get(this.monthKey(date)) ?? null;
    }

    static monthKey(date) {
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    }

    static getOptions(state, { allowNegative = false, showLegend = false } = {}) {
        const isDark = state.ui.theme === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        const { currency } = CurrencyService.parseSelection(state.ui.currencySelect);

        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: textColor },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: !allowNegative,
                    ticks: {
                        color: textColor,
                        callback: (v) => new Intl.NumberFormat(undefined, {
                            style: 'currency', currency, maximumSignificantDigits: 3
                        }).format(v)
                    },
                    grid: {
                        color: (ctx) => ctx.tick.value === 0 ? '#ef4444' : gridColor,
                        lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1
                    }
                }
            },
            plugins: {
                legend: { display: showLegend, labels: { color: textColor } },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${I18nService.formatCurrency(ctx.parsed.y, currency)}`
                    }
                }
            }
        };
    }

    static draw(id, config) {
        if (this.instances.has(id)) this.instances.get(id).destroy();
        const canvas = document.getElementById(id);
        if (canvas) this.instances.set(id, new Chart(canvas, config));
    }

    static setTxt(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

    /**
     * Builds the buckets a timeline is drawn on. The range ends at the most recent
     * transaction rather than at "today", so historic exports are not rendered as
     * a run of empty periods.
     */
    static getPeriods(data, timeframe) {
        const end = this.rangeEnd(data);

        if (timeframe === '1m') return this.getWeeklyPeriods(end);

        let start;
        if (timeframe === 'max') {
            const timestamps = data.map(t => new Date(t.date).getTime());
            start = timestamps.length ? new Date(Math.min(...timestamps)) : new Date(end);
            start.setDate(1);
        } else {
            const count = parseInt(timeframe, 10);
            start = timeframe.endsWith('y')
                ? new Date(end.getFullYear() - count, end.getMonth(), 1)
                : new Date(end.getFullYear(), end.getMonth() - count + 1, 1);
        }

        const periods = [];
        const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
        const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cursor <= lastMonth) {
            const key = this.monthKey(cursor);
            periods.push({ key, label: key, month: cursor.getMonth(), year: cursor.getFullYear() });
            cursor.setMonth(cursor.getMonth() + 1);
        }
        return periods;
    }

    static getWeeklyPeriods(end) {
        const periods = [];
        const cursor = new Date(end);
        cursor.setDate(cursor.getDate() - 7 * (WEEKS_IN_SHORT_TIMEFRAME - 1));

        for (let i = 0; i < WEEKS_IN_SHORT_TIMEFRAME; i++) {
            const start = new Date(cursor);
            const stop = new Date(cursor);
            stop.setDate(cursor.getDate() + 7);
            const label = `${start.getDate().toString().padStart(2, '0')}.${(start.getMonth() + 1).toString().padStart(2, '0')}.`;
            periods.push({ key: `w-${start.getTime()}`, label, start, end: stop });
            cursor.setDate(cursor.getDate() + 7);
        }
        return periods;
    }

    static rangeEnd(data) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const timestamps = data.map(t => new Date(t.date).getTime()).filter(Number.isFinite);
        if (!timestamps.length) return now;
        return new Date(Math.min(Math.max(...timestamps), now.getTime()));
    }

    static renderExpenseChart(data) {
        const canvas = document.getElementById('expense-chart');
        if (!canvas) return;
        const cats = {};
        data.filter(t => t.type === 'expense').forEach(t => cats[t.displayCategory] = (cats[t.displayCategory] || 0) + t.displayAmount);

        this.draw('expense-chart', {
            type: 'doughnut',
            data: {
                labels: Object.keys(cats),
                datasets: [{ data: Object.values(cats), backgroundColor: CHART_COLORS, borderWidth: 1 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.label}: ${I18nService.formatCurrency(ctx.raw, CurrencyService.parseSelection(AppStore.state.ui.currencySelect).currency)}`
                        }
                    }
                }
            }
        });
    }

}
