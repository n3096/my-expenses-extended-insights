import { AppStore } from '../store/AppStore.js';
import { I18nService } from './I18nService.js';
import { CurrencyService } from './CurrencyService.js';
import { escapeHtml } from '../utils/dom.js';
import { CHART_COLORS, colorAt } from '../ui/palette.js';

const TOP_CATEGORY_COUNT = 10;
const MIN_YEARS_FOR_DEVIATION = 2;

export class CompareManager {
    static charts = new Map();

    static init() {
        AppStore.subscribe(state => {
            if (state.transactions.length > 0 && state.ui.currentView === 'comparison') {
                this.render(state);
            }
        });
    }

    static render(state) {
        const years = state.filters.comparisonYears;
        const isBar = state.filters.comparisonChartType === 'bar';
        const hasData = years.length >= 1;
        const canCompare = years.length >= MIN_YEARS_FOR_DEVIATION;

        this.syncChartTypeButtons(isBar);
        this.toggleElement('no-comparison-data', !hasData);
        this.toggleElement('comparison-chart-container', hasData && isBar);
        this.toggleElement('comparison-pie-charts-container', hasData && !isBar);
        this.toggleElement('comparison-deviation-chart-container', canCompare);
        this.toggleElement('no-comparison-deviation-data', hasData && !canCompare);

        if (!hasData) {
            this.destroyAll();
            return;
        }

        const aggregated = this.getAggregatedData(state, years, state.filters.comparisonType);
        const categories = Object.keys(aggregated).sort();

        if (isBar) {
            this.destroyPieCharts();
            this.renderBarChart('comparison-chart', years, categories, aggregated, state);
        } else {
            this.destroyChart('comparison-chart');
            this.renderPieCharts(years, aggregated, state);
        }

        if (canCompare) {
            this.renderTopCategoriesChart(years, aggregated, state);
        } else {
            this.destroyChart('comparison-deviation-chart');
        }
    }

    static getAggregatedData(state, years, type) {
        const result = {};
        state.categoryFilteredTransactions.forEach(t => {
            const year = new Date(t.date).getFullYear().toString();
            if (!years.includes(year)) return;

            const value = this.valueOf(t, type);
            if (value === 0) return;

            const byYear = result[t.displayCategory] ??= {};
            byYear[year] = (byYear[year] ?? 0) + value;
        });
        return result;
    }

    static valueOf(transaction, type) {
        if (type === 'income') return transaction.type === 'income' ? transaction.displayAmount : 0;
        if (type === 'expenses') return transaction.type === 'expense' ? transaction.displayAmount : 0;
        return transaction.type === 'income' ? transaction.displayAmount : -transaction.displayAmount;
    }

    static renderBarChart(canvasId, years, categories, data, state) {
        this.drawChart(canvasId, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: years.map((year, i) => ({
                    label: year,
                    data: categories.map(cat => data[cat]?.[year] ?? 0),
                    backgroundColor: colorAt(i)
                }))
            },
            options: this.getOptions(state)
        });
    }

    static renderTopCategoriesChart(years, data, state) {
        const topCategories = Object.keys(data)
            .map(cat => ({
                name: cat,
                deviation: this.deviationOf(data[cat], years)
            }))
            .sort((a, b) => b.deviation - a.deviation)
            .slice(0, TOP_CATEGORY_COUNT)
            .map(item => item.name);

        this.renderBarChart('comparison-deviation-chart', years, topCategories, data, state);
    }

    /** Spread between the selected years - the categories that changed the most. */
    static deviationOf(byYear, years) {
        const values = years.map(year => byYear[year] ?? 0);
        return Math.max(...values) - Math.min(...values);
    }

    static renderPieCharts(years, data, state) {
        const container = document.getElementById('comparison-pie-charts-container');
        if (!container) return;

        this.destroyPieCharts();
        container.innerHTML = years.map(year => `
            <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
                <h3 class="text-center font-bold mb-2 text-slate-800 dark:text-slate-200">${escapeHtml(year)}</h3>
                <div class="relative h-64"><canvas id="pie-${escapeHtml(year)}"></canvas></div>
            </div>
        `).join('');

        const { currency } = CurrencyService.parseSelection(state.ui.currencySelect);

        years.forEach(year => {
            const yearData = {};
            Object.keys(data).forEach(cat => {
                if (data[cat][year]) yearData[cat] = Math.abs(data[cat][year]);
            });

            this.drawChart(`pie-${year}`, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(yearData),
                    datasets: [{ data: Object.values(yearData), backgroundColor: CHART_COLORS }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.label}: ${I18nService.formatCurrency(ctx.raw, currency)}`
                            }
                        }
                    }
                }
            });
        });
    }

    static syncChartTypeButtons(isBar) {
        document.getElementById('comparison-bar-btn')?.classList.toggle('view-btn', true);
        document.getElementById('comparison-pie-btn')?.classList.toggle('view-btn', true);
        document.getElementById('comparison-bar-btn')?.classList.toggle('active', isBar);
        document.getElementById('comparison-pie-btn')?.classList.toggle('active', !isBar);
    }

    static drawChart(canvasId, config) {
        this.destroyChart(canvasId);
        const canvas = document.getElementById(canvasId);
        if (canvas) this.charts.set(canvasId, new Chart(canvas, config));
    }

    static destroyChart(canvasId) {
        this.charts.get(canvasId)?.destroy();
        this.charts.delete(canvasId);
    }

    static destroyPieCharts() {
        [...this.charts.keys()]
            .filter(id => id.startsWith('pie-'))
            .forEach(id => this.destroyChart(id));
    }

    static destroyAll() {
        [...this.charts.keys()].forEach(id => this.destroyChart(id));
    }

    static getOptions(state) {
        const { currency } = CurrencyService.parseSelection(state.ui.currencySelect);
        const isDark = state.ui.theme === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';

        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        color: textColor,
                        callback: v => I18nService.formatCurrency(v, currency)
                    },
                    grid: { color: isDark ? '#334155' : '#e2e8f0' }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { labels: { color: textColor } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label}: ${I18nService.formatCurrency(ctx.parsed.y, currency)}`
                    }
                }
            }
        };
    }

    static toggleElement(id, show) {
        document.getElementById(id)?.classList.toggle('hidden', !show);
    }
}
