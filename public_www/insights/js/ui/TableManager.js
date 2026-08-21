import { AppStore } from '../store/AppStore.js';
import { escapeHtml } from '../utils/dom.js';
import { CurrencyService } from '../services/CurrencyService.js';

export class TableManager {
    static init() {
        AppStore.subscribe(state => {
            if (state.transactions.length > 0) this.render(state);
        });

        document.getElementById('transaction-search')?.addEventListener('input', (e) => {
            this.render(AppStore.state, e.target.value.toLowerCase());
        });
    }

    static render(state, searchTerm = '') {
        const { currency } = CurrencyService.parseSelection(state.ui.currencySelect);
        const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency });

        this.renderDashboardTable(state, formatter);

        this.renderDetailedCategoryTable(state, formatter);

        const tbody = document.querySelector('#transactions-table-body');
        if (tbody) {
            let filtered = state.fullyFilteredTransactions;

            if (searchTerm) {
                filtered = filtered.filter(t =>
                    (t.description || '').toLowerCase().includes(searchTerm) ||
                    t.displayCategory.toLowerCase().includes(searchTerm)
                );
            }

            tbody.innerHTML = filtered.map(t => `
                <tr class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm">
                    <td class="px-6 py-4 text-slate-500 whitespace-nowrap">${new Date(t.date).toLocaleDateString()}</td>
                    <td class="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">${escapeHtml(t.displayCategory)}</td>
                    <td class="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-xs">${escapeHtml(t.description || '-')}</td>
                    <td class="px-6 py-4 text-right font-bold whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                        ${t.type === 'income' ? '+' : '-'}${formatter.format(t.displayAmount)}
                    </td>
                    <td class="px-6 py-4 text-right text-xs text-slate-400 whitespace-nowrap">
                        ${(t.amount || 0).toFixed(2)} ${t.currency || ''}
                    </td>
                </tr>
            `).join('');
        }
    }

    static renderDashboardTable(state, formatter) {
        const data = state.fullyFilteredTransactions;
        const tbody = document.querySelector('#dashboard-view table tbody');
        if (!tbody) return;

        const cats = {};
        data.forEach(t => {
            if (!cats[t.displayCategory]) cats[t.displayCategory] = { inc: 0, exp: 0 };
            if (t.type === 'income') cats[t.displayCategory].inc += t.displayAmount;
            else cats[t.displayCategory].exp += t.displayAmount;
        });

        tbody.innerHTML = Object.entries(cats)
            .sort((a,b) => b[1].exp - a[1].exp)
            .map(([name, val]) => `
                <tr class="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td class="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">${escapeHtml(name)}</td>
                    <td class="px-6 py-4 text-right text-green-600 whitespace-nowrap">${val.inc > 0 ? formatter.format(val.inc) : '-'}</td>
                    <td class="px-6 py-4 text-right text-red-600 whitespace-nowrap">${val.exp > 0 ? formatter.format(val.exp) : '-'}</td>
                    <td class="px-6 py-4 text-right font-bold whitespace-nowrap">${formatter.format(val.inc - val.exp)}</td>
                </tr>
            `).join('');
    }

    static renderDetailedCategoryTable(state, formatter) {
        const container = document.getElementById('category-details-container');
        if (!container) return;

        const data = state.fullyFilteredTransactions;
        const cats = {};

        data.forEach(t => {
            if (!cats[t.displayCategory]) cats[t.displayCategory] = { inc: 0, exp: 0 };
            if (t.type === 'income') cats[t.displayCategory].inc += t.displayAmount;
            else cats[t.displayCategory].exp += t.displayAmount;
        });

        container.innerHTML = Object.entries(cats)
            .sort((a, b) => b[1].exp - a[1].exp)
            .map(([name, val]) => {
                const net = val.inc - val.exp;
                return `
                <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <h4 class="font-bold text-slate-900 dark:text-white mb-3 truncate" title="${escapeHtml(name)}">${escapeHtml(name)}</h4>
                    <div class="space-y-1">
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500 dark:text-slate-400">Einnahmen:</span>
                            <span class="text-green-600 font-medium">${val.inc > 0 ? formatter.format(val.inc) : '-'}</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span class="text-slate-500 dark:text-slate-400">Ausgaben:</span>
                            <span class="text-red-600 font-medium">${val.exp > 0 ? formatter.format(val.exp) : '-'}</span>
                        </div>
                    </div>
                    <div class="flex justify-between text-sm mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span class="font-medium text-slate-700 dark:text-slate-300">Netto:</span>
                        <span class="font-bold whitespace-nowrap ${net >= 0 ? 'text-green-600' : 'text-red-600'}">${formatter.format(net)}</span>
                    </div>
                </div>
                `;
            }).join('');
    }
}