import { AppStore } from '../store/AppStore.js';
import { I18nService } from './I18nService.js';

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
        const type = state.filters.comparisonType;
        const hasData = years.length >= 1;

        this.toggleElement('no-comparison-data', !hasData);
        this.toggleElement('comparison-chart-container', hasData && state.filters.comparisonChartType === 'bar');
        this.toggleElement('comparison-pie-charts-container', hasData && state.filters.comparisonChartType === 'pie');
        this.toggleElement('comparison-deviation-chart-container', hasData);

        if (!hasData) return;

        const aggregated = this.getAggregatedData(state, years, type);
        const categories = [...new Set(Object.keys(aggregated))].sort();

        if (state.filters.comparisonChartType === 'bar') {
            this.renderBarChart(years, categories, aggregated, state, 'comparison-bar', 'comparison-chart');
        } else {
            this.renderPieCharts(years, aggregated, state);
        }

        this.renderTopCategoriesChart(years, aggregated, state);
    }

    static getAggregatedData(state, years, type) {
        const result = {};
        state.processedTransactions.forEach(t => {
            const year = new Date(t.date).getFullYear().toString();
            if (!years.includes(year)) return;

            const cat = t.displayCategory;
            if (!result[cat]) result[cat] = {};
            if (!result[cat][year]) result[cat][year] = 0;

            let value = 0;
            if (type === 'income' && t.type === 'income') value = t.displayAmount;
            if (type === 'expenses' && t.type === 'expense') value = t.displayAmount;
            if (type === 'net') value = t.type === 'income' ? t.displayAmount : -t.displayAmount;

            result[cat][year] += value;
        });
        return result;
    }

    static renderBarChart(years, categories, data, state, chartId, canvasId) {
        const ctx = document.getElementById(canvasId)?.getContext('2d');
        if (!ctx) return;

        const colors = this.getColors();
        const datasets = years.map((year, i) => ({
            label: year,
            data: categories.map(cat => data[cat][year] || 0),
            backgroundColor: colors[i % colors.length]
        }));

        this.drawChart(chartId, ctx, {
            type: 'bar',
            data: { labels: categories, datasets },
            options: this.getOptions(state)
        });
    }

    static renderTopCategoriesChart(years, data, state) {
        const ctx = document.getElementById('comparison-deviation-chart')?.getContext('2d');
        if (!ctx) return;

        const topCategories = Object.keys(data)
            .map(cat => ({
                name: cat,
                total: Object.values(data[cat]).reduce((sum, val) => sum + Math.abs(val), 0)
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)
            .map(item => item.name);

        const colors = this.getColors();
        const datasets = years.map((year, i) => ({
            label: year,
            data: topCategories.map(cat => data[cat][year] || 0),
            backgroundColor: colors[i % colors.length]
        }));

        this.drawChart('comparison-top10', ctx, {
            type: 'bar',
            data: { labels: topCategories, datasets },
            options: this.getOptions(state)
        });
    }

    static renderPieCharts(years, data, state) {
        const container = document.getElementById('comparison-pie-charts-container');
        if (!container) return;
        container.innerHTML = '';

        years.forEach((year) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl';
            wrapper.innerHTML = `<h3 class="text-center font-bold mb-2 text-slate-800 dark:text-slate-200">${year}</h3><canvas id="pie-${year}"></canvas>`;
            container.appendChild(wrapper);

            const yearData = {};
            Object.keys(data).forEach(cat => {
                if (data[cat][year]) yearData[cat] = Math.abs(data[cat][year]);
            });

            new Chart(document.getElementById(`pie-${year}`), {
                type: 'doughnut',
                data: {
                    labels: Object.keys(yearData),
                    datasets: [{ data: Object.values(yearData), backgroundColor: this.getColors() }]
                },
                options: {
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `${ctx.label}: ${I18nService.formatCurrency(ctx.raw, state.ui.currencySelect.split('_')[0])}`
                            }
                        }
                    }
                }
            });
        });
    }

    static drawChart(id, ctx, config) {
        if (this.charts.has(id)) this.charts.get(id).destroy();
        this.charts.set(id, new Chart(ctx, config));
    }

    static getOptions(state) {
        const currency = state.ui.currencySelect.split('_')[0];
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
                legend: { labels: { color: textColor } }
            }
        };
    }

    static toggleElement(id, show) {
        document.getElementById(id)?.classList.toggle('hidden', !show);
    }

    static getColors() {
        return ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F43F5E', '#00C49F', '#FFBB28'];
    }
}