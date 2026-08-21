import { AppStore } from '../store/AppStore.js';
import { I18nService } from '../services/I18nService.js';
import { escapeHtml } from '../utils/dom.js';
import { colorAt } from './palette.js';

export class UIManager {
    static init() {
        this.bindEvents();
        AppStore.subscribe(state => this.render(state));
        this.updateTheme(AppStore.state.ui.theme);
    }

    static render(state) {
        const hasData = state.transactions.length > 0;
        document.getElementById('upload-section')?.classList.toggle('hidden', hasData);
        document.getElementById('dashboard-section')?.classList.toggle('hidden', !hasData);

        if (hasData) {
            this.syncFilterDropdowns(state);
            this.syncComparisonYears(state);
            this.updateViewVisibility(state.ui.currentView);
            this.renderCategoryModalList(state);
            this.renderMissingRatesWarning(state);
        }

        // Runs for the upload screen too - the language can be switched before
        // a file has been picked.
        I18nService.updateDOM();
        const langSwitcher = document.getElementById('lang-switcher');
        if (langSwitcher) langSwitcher.value = state.ui.currentLang;
    }

    static showUploadError(messageKey) {
        const el = document.getElementById('upload-error');
        if (!el) return;
        el.textContent = messageKey ? I18nService.get(messageKey) : '';
        el.classList.toggle('hidden', !messageKey);
    }

    static renderCategoryModalList(state) {
        const container = document.getElementById('category-list-container');
        if (!container) return;

        const categories = this.getCategories(state);
        const renderedCategories = container.dataset.categories;

        // Rebuilding the list on every store update would drop the scroll
        // position, so only the checkbox states are synced unless the set of
        // categories itself changed.
        if (renderedCategories !== categories.join('\u0000')) {
            container.dataset.categories = categories.join('\u0000');
            container.innerHTML = categories.map((cat, index) => `
                <div class="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg">
                    <input type="checkbox" id="cat-filter-${index}" value="${escapeHtml(cat)}" class="cat-filter-cb w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600">
                    <label for="cat-filter-${index}" class="flex-grow text-sm cursor-pointer dark:text-slate-200">${escapeHtml(cat)}</label>
                </div>
            `).join('');
        }

        container.querySelectorAll('.cat-filter-cb').forEach(cb => {
            cb.checked = state.filters.categories.has(cb.value);
        });
    }

    static renderMissingRatesWarning(state) {
        const banner = document.getElementById('missing-rates-warning');
        if (!banner) return;

        banner.classList.toggle('hidden', state.missingRates === 0);
        if (state.missingRates > 0) {
            banner.textContent = I18nService.format('missingRatesWarning', { count: state.missingRates });
        }
    }

    /** All categories present in the uploaded file, independent of the active filters. */
    static getCategories(state) {
        return [...new Set(state.processedTransactions.map(t => t.displayCategory))].sort();
    }

    static syncComparisonYears(state) {
        const container = document.getElementById('comparison-year-selector');
        if (!container) return;

        const years = this.getYears(state);

        if (container.dataset.years !== years.join(',')) {
            container.dataset.years = years.join(',');
            container.innerHTML = years.map((yr, idx) => `
                <label class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-slate-600 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                    <input type="checkbox" class="year-checkbox w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" value="${yr}">
                    <span class="w-3 h-3 rounded-full" style="background-color: ${colorAt(idx)}"></span>
                    ${yr}
                </label>
            `).join('');
        }

        container.querySelectorAll('.year-checkbox').forEach(cb => {
            cb.checked = state.filters.comparisonYears.includes(cb.value);
        });
    }

    static getYears(state) {
        return [...new Set(state.transactions.map(t => new Date(t.date).getFullYear()))].sort((a, b) => b - a);
    }

    static updateTheme(theme) {
        const isDark = theme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        document.getElementById('theme-icon-light')?.classList.toggle('hidden', isDark);
        document.getElementById('theme-icon-dark')?.classList.toggle('hidden', !isDark);
    }

    static updateViewVisibility(view) {
        document.querySelectorAll('.view-container').forEach(v => v.classList.toggle('hidden', v.id !== `${view}-view`));
        document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    }

    static syncFilterDropdowns(state) {
        const y = document.getElementById('year-select');
        const m = document.getElementById('month-select');
        const c = document.getElementById('currency-select');

        if (y) {
            const years = this.getYears(state);
            if (y.dataset.years !== years.join(',')) {
                y.dataset.years = years.join(',');
                y.innerHTML = '<option value="all" data-i18n-key="yearAll"></option>';
                years.forEach(yr => y.add(new Option(yr, yr)));
            }
        }

        if (y) y.value = state.filters.year;
        if (m) m.value = state.filters.month;
        if (c) c.value = state.ui.currencySelect;

        this.setSelectValue('timeframe-select', state.filters.timelineTimeframe);
        this.setSelectValue('timeline-mode-select', state.filters.timelineMode);
        this.setSelectValue('comparison-data-type-select', state.filters.comparisonType);
    }

    static setSelectValue(id, value) {
        const select = document.getElementById(id);
        if (select) select.value = value;
    }

    static bindEvents() {
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            this.updateTheme(newTheme);
            AppStore.update({ ui: { theme: newTheme } });
        });

        document.getElementById('lang-switcher')?.addEventListener('change', (e) => {
            AppStore.update({ ui: { currentLang: e.target.value } });
        });

        document.querySelectorAll('.view-btn').forEach(b => {
            b.addEventListener('click', () => AppStore.update({ ui: { currentView: b.dataset.view } }));
        });

        document.getElementById('year-select')?.addEventListener('change', e => AppStore.update({ filters: { year: e.target.value } }));
        document.getElementById('month-select')?.addEventListener('change', e => AppStore.update({ filters: { month: e.target.value } }));
        document.getElementById('currency-select')?.addEventListener('change', e => AppStore.update({ ui: { currencySelect: e.target.value } }));

        document.querySelectorAll('.comparison-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const isBar = btn.id.includes('bar');
                AppStore.update({ filters: { comparisonChartType: isBar ? 'bar' : 'pie' } });
            });
        });

        document.getElementById('comparison-data-type-select')?.addEventListener('change', e => {
            AppStore.update({ filters: { comparisonType: e.target.value } });
        });

        document.getElementById('timeframe-select')?.addEventListener('change', e => {
            AppStore.update({ filters: { timelineTimeframe: e.target.value } });
        });

        document.getElementById('timeline-mode-select')?.addEventListener('change', e => {
            AppStore.update({ filters: { timelineMode: e.target.value } });
        });

        const filterBtn = document.getElementById('open-category-modal-btn');
        const categoryModal = document.getElementById('category-modal');
        const closeBtn = document.getElementById('close-category-modal-btn');

        document.getElementById('comparison-year-selector')?.addEventListener('change', (e) => {
            if (!e.target.classList.contains('year-checkbox')) return;
            const checked = [...e.currentTarget.querySelectorAll('.year-checkbox:checked')].map(c => c.value);
            AppStore.update({ filters: { comparisonYears: checked } });
        });

        document.getElementById('category-list-container')?.addEventListener('change', (e) => {
            if (!e.target.classList.contains('cat-filter-cb')) return;
            const categories = new Set(AppStore.state.filters.categories);
            if (e.target.checked) categories.add(e.target.value);
            else categories.delete(e.target.value);
            AppStore.update({ filters: { categories } });
        });

        if (filterBtn && categoryModal) {
            filterBtn.addEventListener('click', () => categoryModal.classList.remove('hidden'));

            closeBtn?.addEventListener('click', () => categoryModal.classList.add('hidden'));

            categoryModal.addEventListener('click', (e) => {
                if (e.target === categoryModal) categoryModal.classList.add('hidden');
            });
        }

        document.getElementById('select-all-btn')?.addEventListener('click', () => {
            AppStore.update({ filters: { categories: new Set(this.getCategories(AppStore.state)) } });
        });

        document.getElementById('deselect-all-btn')?.addEventListener('click', () => {
            AppStore.update({ filters: { categories: new Set() } });
        });
    }

    static setLoading(s) {
        document.getElementById('loading-overlay')?.classList.toggle('hidden', !s);
    }
}