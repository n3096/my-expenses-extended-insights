import { AppStore } from '../store/AppStore.js';
import { I18nService } from '../services/I18nService.js';
import { CompareManager } from '../services/CompareManager.js';

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
            I18nService.updateDOM();
        }
    }

    static renderCategoryModalList(state) {
        const container = document.getElementById('category-list-container');
        if (!container) return;

        const uniqueCats = [...new Set(state.transactions.map(t => t.displayCategory || 'Unkategorisiert'))].sort();
        const activeCats = state.filters.categories;

        container.innerHTML = uniqueCats.map(cat => `
            <div class="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg">
                <input type="checkbox" id="cat-${cat}" value="${cat}" class="cat-filter-cb w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" ${activeCats.has(cat) ? 'checked' : ''}>
                <label for="cat-${cat}" class="flex-grow text-sm cursor-pointer dark:text-slate-200">${cat}</label>
            </div>
        `).join('');

        container.querySelectorAll('.cat-filter-cb').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const newCats = new Set(AppStore.state.filters.categories);
                if (e.target.checked) newCats.add(e.target.value);
                else newCats.delete(e.target.value);
                AppStore.update({ filters: { categories: newCats } });
            });
        });
    }

    static syncComparisonYears(state) {
        const container = document.getElementById('comparison-year-selector');
        if (!container) return;

        const years = [...new Set(state.transactions.map(t => new Date(t.date).getFullYear()))].sort((a,b) => b-a);
        const colors = CompareManager.getColors();

        if (container.children.length === years.length) return;

        container.innerHTML = years.map((yr, idx) => {
            const color = colors[idx % colors.length];
            const isChecked = state.filters.comparisonYears.includes(yr.toString());
            return `
                <div class="relative">
                    <input type="checkbox" id="yr-${yr}" class="year-checkbox" value="${yr}" ${isChecked ? 'checked' : ''}>
                    <label for="yr-${yr}" class="year-checkbox-label flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
                        ${yr}
                    </label>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.year-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                const checked = Array.from(container.querySelectorAll('.year-checkbox:checked')).map(c => c.value);
                AppStore.update({ filters: { comparisonYears: checked } });
            });
        });
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

        if (y && y.options.length <= 1) {
            const years = [...new Set(state.transactions.map(t => new Date(t.date).getFullYear()))].sort((a,b) => b-a);
            y.innerHTML = `<option value="all">${I18nService.get('yearAll')}</option>`;
            years.forEach(yr => y.add(new Option(yr, yr)));
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

        if (filterBtn && categoryModal) {
            filterBtn.addEventListener('click', () => categoryModal.classList.remove('hidden'));

            closeBtn?.addEventListener('click', () => categoryModal.classList.add('hidden'));

            categoryModal.addEventListener('click', (e) => {
                if (e.target === categoryModal) categoryModal.classList.add('hidden');
            });
        }

        document.getElementById('select-all-btn')?.addEventListener('click', () => {
            const allCats = new Set(AppStore.state.transactions.map(t => t.displayCategory || 'Unkategorisiert'));
            AppStore.update({ filters: { categories: allCats } });
        });

        document.getElementById('deselect-all-btn')?.addEventListener('click', () => {
            AppStore.update({ filters: { categories: new Set() } });
        });
    }

    static setLoading(s) {
        document.getElementById('loading-overlay')?.classList.toggle('hidden', !s);
    }
}