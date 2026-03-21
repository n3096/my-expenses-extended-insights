import { AppStore } from '../store/AppStore.js';

export class ChartManager {
    static instances = new Map();

    static init() {
        AppStore.subscribe(state => {
            if (state.transactions.length > 0) this.update(state);
        });
    }

    static update(state) {
        const currency = state.ui.currencySelect.split('_')[0];
        const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });

        if (state.ui.currentView === 'dashboard') {
            const data = state.timeFilteredTransactions;
            const income = data.filter(t => t.type === 'income').reduce((s,t) => s + t.displayAmount, 0);
            const expenses = data.filter(t => t.type === 'expense').reduce((s,t) => s + t.displayAmount, 0);

            this.setTxt('total-income', formatter.format(income));
            this.setTxt('total-expenses', formatter.format(-expenses));
            this.setTxt('net-savings', formatter.format(income - expenses));

            this.renderExpenseChart(state.timeFilteredTransactions);
        }

        if (state.ui.currentView === 'timeline') {
            this.renderCategoryTimeline(state);
            this.renderTotalNetTimeline(state);
        }
    }

    static renderCategoryTimeline(state) {
        const canvas = document.getElementById('timeline-chart');
        if (!canvas) return;

        const timeframe = document.getElementById('timeframe-select')?.value || '1y';
        const type = document.getElementById('timeline-chart-type-select')?.value || 'periodic';
        const periods = this.getPeriods(state.processedTransactions, timeframe);

        const allSortedCats = [...new Set(state.processedTransactions.map(t => t.displayCategory))].sort();
        const activeCategories = [...state.filters.categories];

        const datasets = activeCategories.map((cat) => {
            const colorIdx = allSortedCats.indexOf(cat);
            let running = 0;
            const values = periods.map(p => {
                const pData = state.processedTransactions.filter(t => this.isInPeriod(t.date, p, timeframe));
                const inc = pData.filter(t => t.displayCategory === cat && t.type === 'income').reduce((s,t) => s + t.displayAmount, 0);
                const exp = pData.filter(t => t.displayCategory === cat && t.type === 'expense').reduce((s,t) => s + t.displayAmount, 0);

                const val = inc - exp;
                if (type === 'cumulative') { running += val; return running; }
                return val;
            });

            return {
                label: cat,
                data: values,
                borderColor: this.getColors()[colorIdx % this.getColors().length],
                backgroundColor: this.getColors()[colorIdx % this.getColors().length] + '22',
                tension: 0.3,
                fill: type === 'cumulative',
                pointRadius: 3
            };
        });

        this.draw('timeline-chart', {
            type: 'line',
            data: { labels: periods.map(p => p.label), datasets },
            options: this.getOptions(state, true)
        });
    }

    static renderTotalNetTimeline(state) {
        const canvas = document.getElementById('total-timeline-chart');
        if (!canvas) return;

        const timeframe = document.getElementById('timeframe-select')?.value || 'max';
        const type = document.getElementById('timeline-chart-type-select')?.value || 'cumulative';
        const periods = this.getPeriods(state.processedTransactions, timeframe);

        let runningNet = 0;
        const allTimePeriods = this.getPeriods(state.processedTransactions, 'max');
        const netDataMap = new Map();

        allTimePeriods.forEach(p => {
            const d = state.processedTransactions.filter(t => this.isInPeriod(t.date, p, 'max'));
            const inc = d.filter(t => t.type === 'income').reduce((s,t) => s + t.displayAmount, 0);
            const exp = d.filter(t => t.type === 'expense').reduce((s,t) => s + t.displayAmount, 0);

            const periodNet = inc - exp;
            runningNet += periodNet;
            netDataMap.set(p.key, { cumulative: runningNet, periodic: periodNet });
        });

        const displayValues = periods.map(p => {
            const entry = netDataMap.get(p.key);
            return entry ? entry[type] : 0;
        });

        this.draw('total-timeline-chart', {
            type: 'line',
            data: {
                labels: periods.map(p => p.label),
                datasets: [{
                    label: type === 'cumulative' ? 'Gesamtvermögen' : 'Nettoergebnis',
                    data: displayValues,
                    borderColor: '#4F46E5',
                    backgroundColor: '#4F46E522',
                    fill: true,
                    tension: 0.1,
                    pointRadius: 2
                }]
            },
            options: this.getOptions(state, true)
        });
    }

    static getOptions(state, allowNegative) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: !allowNegative,
                    ticks: {
                        callback: (v) => new Intl.NumberFormat(undefined, {
                            style: 'currency', currency: state.ui.currencySelect.split('_')[0], maximumSignificantDigits: 3
                        }).format(v)
                    },
                    grid: {
                        color: (ctx) => ctx.tick.value === 0 ? '#ef4444' : 'rgba(0,0,0,0.1)',
                        lineWidth: (ctx) => ctx.tick.value === 0 ? 2 : 1
                    }
                }
            },
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }
        };
    }

    static draw(id, config) {
        if (this.instances.has(id)) this.instances.get(id).destroy();
        const canvas = document.getElementById(id);
        if (canvas) this.instances.set(id, new Chart(canvas, config));
    }

    static setTxt(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

    static getPeriods(data, timeframe) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        let start;
        const isWeekly = timeframe === '1m';
        if (timeframe === 'max') {
            const dates = data.map(t => new Date(t.date)).sort((a,b) => a-b);
            start = dates.length ? new Date(dates[0]) : new Date();
            start.setDate(1);
        } else {
            const count = parseInt(timeframe);
            const unit = timeframe.slice(-1);
            if (unit === 'y') {
                start = new Date(now.getFullYear() - count, now.getMonth(), 1);
            } else {
                start = new Date(now.getFullYear(), now.getMonth() - count + 1, 1);
            }
        }
        const periods = [];
        let curr = new Date(start);
        const endOfRange = new Date(now.getFullYear(), now.getMonth(), 1);
        if (isWeekly) {
            curr = new Date(now);
            curr.setDate(now.getDate() - 28);
            for (let i = 0; i < 5; i++) {
                const ws = new Date(curr);
                const we = new Date(curr);
                we.setDate(curr.getDate() + 7);
                periods.push({ key: `w-${ws.getTime()}`, label: `${ws.getDate().toString().padStart(2, '0')}.${(ws.getMonth() + 1).toString().padStart(2, '0')}.`, start: ws, end: we });
                curr.setDate(curr.getDate() + 7);
            }
        } else {
            while (curr <= endOfRange) {
                const m = (curr.getMonth() + 1).toString().padStart(2, '0');
                const y = curr.getFullYear();
                periods.push({ key: `${m}.${y}`, label: `${m}.${y}`, month: curr.getMonth(), year: y });
                curr.setMonth(curr.getMonth() + 1);
            }
        }
        return periods;
    }

    static isInPeriod(dateStr, period, timeframe) {
        const d = new Date(dateStr);
        if (timeframe === '1m') return d >= period.start && d < period.end;
        return d.getMonth() === period.month && d.getFullYear() === period.year;
    }

    static renderExpenseChart(data) {
        const canvas = document.getElementById('expense-chart');
        if (!canvas) return;
        const cats = {};
        data.filter(t => t.type === 'expense').forEach(t => cats[t.displayCategory] = (cats[t.displayCategory] || 0) + t.displayAmount);
        this.draw('expense-chart', {
            type: 'doughnut',
            data: { labels: Object.keys(cats), datasets: [{ data: Object.values(cats), backgroundColor: this.getColors(), borderWidth: 1 }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    static getColors() {
        return ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#22D3EE', '#F472B6', '#A78BFA', '#FB7185', '#34D399', '#FBBF24', '#60A5FA', '#F87171', '#3B82F6', '#2DD4BF', '#F43F5E', '#8263FF', '#00C49F', '#FFBB28', '#FF8042', '#0088FE'];
    }
}