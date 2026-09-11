import { AppStore } from '../store/AppStore.js';
import { DEFAULT_LANG, localeOf, resolveLanguage } from '../../../assets/js/i18n.js';

export class I18nService {
    static translations = {
        de: {
            pageTitle: "My Expenses - Erweiterte Einblicke",
            loadingMessage: "Lade Daten...",
            uploadCsvTitle: "Schritt 2: Transaktionen hochladen",
            uploadCsvSubtitle: "Ziehen Sie Ihre CSV-Datei hierher oder klicken Sie zum Auswählen.",
            selectCsvFile: "CSV-Datei auswählen",
            apiChecking: "Prüfe Status...",
            apiOnline: "Kurs-API online",
            apiOffline: "Kurs-API offline",
            backToDashboard: "← Dashboard",
            viewDashboard: "Dashboard",
            viewTimeline: "Zeitverlauf",
            viewComparison: "Vergleich",
            viewTransactions: "Transaktionen",
            currencyLabel: "Währung",
            currencyEurConverted: "EUR (umgerechnet)",
            currencyJpyConverted: "JPY (umgerechnet)",
            currencyEurOnly: "Nur EUR",
            currencyJpyOnly: "Nur JPY",
            yearLabel: "Jahr",
            monthLabel: "Monat",
            filterCategories: "Kategorien filtern",
            uploadNewFile: "Neue Datei hochladen",
            income: "Einnahmen",
            expenses: "Ausgaben",
            netResult: "Nettoergebnis",
            noExpenseData: "Keine Ausgabendaten für diesen Zeitraum vorhanden.",
            transactions: "Transaktionen",
            category: "Kategorie",
            net: "Netto",
            timelineByCategory: "Zeitverlauf nach Kategorien (gefiltert)",
            selectCategories: "Kategorien wählen",
            noCategoryData: "Keine detaillierten Kategoriedaten geladen.",
            noExpenseData: "Keine Ausgabendaten für diesen Zeitraum vorhanden.",
            noTransactionsForFilter: "Keine Transaktionen für diesen Zeitraum und Filter vorhanden.",
            chartType: "Diagrammtyp",
            comparisonDataLabel: "Daten",
            comparisonNet: "Netto",
            comparisonIncome: "Nur Einnahmen",
            originalAmount: "Original",
            search: "Suchen...",
            uploadError: "Die CSV-Datei konnte nicht gelesen werden.",
            csvMissingColumns: "Der CSV-Datei fehlen Spalten für Datum und Betrag (oder Einnahmen/Ausgaben).",
            selectAll: "Alle auswählen",
            deselectAll: "Alle abwählen",
            periodic: "Periodisch",
            cumulative: "Kumulativ",
            timeframe1m: "1 Monat",
            timeframe6m: "6 Monate",
            timeframe1y: "1 Jahr",
            timeframe2y: "2 Jahre",
            timeframe3y: "3 Jahre",
            timeframe5y: "5 Jahre",
            timeframe10y: "10 Jahre",
            timeframeMax: "Max",
            totalNetTimeline: "Gesamtverlauf Nettoergebnis (ungefiltert)",
            timeRange: "Zeitbereich",
            date: "Datum",
            description: "Beschreibung",
            amount: "Betrag",
            noTransactionsForFilter: "Keine Transaktionen für diesen Zeitraum und Filter vorhanden.",
            emptyCsvError: "Die CSV-Datei ist leer oder es konnten keine gültigen Transaktionen gefunden werden.",
            missingRatesWarning: "{count} benötigte Wechselkurse konnten nicht geladen werden. Beträge in Fremdwährung sind möglicherweise unvollständig.",
            months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
            yearAll: "Alle Jahre",
            monthAll: "Alle Monate",
            timelineMode: "Darstellung",
            selectYears: "Jahre vergleichen",
            noComparisonData: "Bitte wählen Sie mindestens ein Jahr aus.",
            comparisonDeviationTitle: "Top 10 Kategorie-Abweichungen",
            noComparisonDeviationData: "Nicht genügend Daten für einen Abweichungsvergleich vorhanden (mind. 2 Jahre benötigt).",
            barChart: "Balkendiagramm",
            pieCharts: "Kreisdiagramme",
            incomeTitle: "Einnahmen",
            expenseTitle: "Ausgaben",
            netTitle: "Ersparnis",
            expenseByCat: "Ausgaben nach Kategorie",
            tableTitle: "Zusammenfassung",
            detailedCategoryTitle: "Detaillierte Kategorie-Ansicht"
        },
        en: {
            pageTitle: "My Expenses - Extended Insight",
            loadingMessage: "Loading data...",
            uploadCsvTitle: "Step 2: Upload Transactions",
            uploadCsvSubtitle: "Drag and drop your CSV file here or click to select.",
            selectCsvFile: "Select CSV file",
            apiChecking: "Checking status...",
            apiOnline: "Rate API online",
            apiOffline: "Rate API offline",
            backToDashboard: "← Dashboard",
            viewDashboard: "Dashboard",
            viewTimeline: "Timeline",
            viewComparison: "Comparison",
            viewTransactions: "Transactions",
            currencyLabel: "Currency",
            currencyEurConverted: "EUR (converted)",
            currencyJpyConverted: "JPY (converted)",
            currencyEurOnly: "EUR only",
            currencyJpyOnly: "JPY only",
            yearLabel: "Year",
            monthLabel: "Month",
            filterCategories: "Filter categories",
            uploadNewFile: "Upload new file",
            income: "Income",
            expenses: "Expenses",
            netResult: "Net result",
            noExpenseData: "No expense data available for this period.",
            transactions: "Transactions",
            category: "Category",
            net: "Net",
            timelineByCategory: "Timeline by Category (filtered)",
            selectCategories: "Choose categories",
            noCategoryData: "No detailed category data loaded.",
            noExpenseData: "No expense data available for this period.",
            noTransactionsForFilter: "No transactions for this period and filter.",
            chartType: "Chart type",
            comparisonDataLabel: "Data",
            comparisonNet: "Net",
            comparisonIncome: "Income only",
            originalAmount: "Original",
            search: "Search...",
            uploadError: "The CSV file could not be read.",
            csvMissingColumns: "The CSV file is missing columns for date and amount (or income/expense).",
            selectAll: "Select all",
            deselectAll: "Deselect all",
            periodic: "Periodic",
            cumulative: "Cumulative",
            timeframe1m: "1 month",
            timeframe6m: "6 months",
            timeframe1y: "1 year",
            timeframe2y: "2 years",
            timeframe3y: "3 years",
            timeframe5y: "5 years",
            timeframe10y: "10 years",
            timeframeMax: "Max",
            totalNetTimeline: "Total Net Result Timeline (unfiltered)",
            timeRange: "Time range",
            date: "Date",
            description: "Description",
            amount: "Amount",
            noTransactionsForFilter: "No transactions for this period and filter.",
            emptyCsvError: "The CSV file is empty or no valid transactions could be found.",
            missingRatesWarning: "{count} required exchange rates could not be loaded. Amounts in foreign currency may be incomplete.",
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            yearAll: "All years",
            monthAll: "All months",
            timelineMode: "Display",
            selectYears: "Compare years",
            noComparisonData: "Please select at least one year.",
            comparisonDeviationTitle: "Top 10 Category Deviations",
            noComparisonDeviationData: "Not enough data for a deviation comparison (min. 2 years required).",
            barChart: "Bar Chart",
            pieCharts: "Pie Charts",
            incomeTitle: "Income",
            expenseTitle: "Expenses",
            netTitle: "Savings",
            expenseByCat: "Expenses by Category",
            tableTitle: "Summary",
            detailedCategoryTitle: "Detailed Category View"
        },
        ja: {
            pageTitle: "My Expenses - 詳細な洞察",
            loadingMessage: "データを読み込み中...",
            uploadCsvTitle: "ステップ2：取引をアップロード",
            uploadCsvSubtitle: "CSVファイルをここにドラッグ＆ドロップするか、クリックして選択します。",
            selectCsvFile: "CSVファイルを選択",
            apiChecking: "ステータスを確認中...",
            apiOnline: "レートAPI オンライン",
            apiOffline: "レートAPI オフライン",
            backToDashboard: "← ダッシュボード",
            viewDashboard: "ダッシュボード",
            viewTimeline: "タイムライン",
            viewComparison: "比較",
            viewTransactions: "取引",
            currencyLabel: "通貨",
            currencyEurConverted: "EUR（換算後）",
            currencyJpyConverted: "JPY（換算後）",
            currencyEurOnly: "EURのみ",
            currencyJpyOnly: "JPYのみ",
            yearLabel: "年",
            monthLabel: "月",
            filterCategories: "カテゴリをフィルター",
            uploadNewFile: "新しいファイルをアップロード",
            income: "収入",
            expenses: "支出",
            netResult: "純損益",
            noExpenseData: "この期間の支出データはありません。",
            transactions: "取引",
            category: "カテゴリ",
            net: "純額",
            timelineByCategory: "カテゴリ別タイムライン（フィルター済み）",
            selectCategories: "カテゴリを選択",
            noCategoryData: "詳細なカテゴリデータがありません。",
            noExpenseData: "この期間の支出データはありません。",
            noTransactionsForFilter: "この期間とフィルターに該当する取引はありません。",
            chartType: "グラフの種類",
            comparisonDataLabel: "データ",
            comparisonNet: "純額",
            comparisonIncome: "収入のみ",
            originalAmount: "元の金額",
            search: "検索...",
            uploadError: "CSVファイルを読み込めませんでした。",
            csvMissingColumns: "CSVファイルに日付と金額（または収入/支出）の列がありません。",
            selectAll: "すべて選択",
            deselectAll: "すべて選択解除",
            periodic: "定期的",
            cumulative: "累積",
            timeframe1m: "1ヶ月",
            timeframe6m: "6ヶ月",
            timeframe1y: "1年",
            timeframe2y: "2年",
            timeframe3y: "3年",
            timeframe5y: "5年",
            timeframe10y: "10年",
            timeframeMax: "最大",
            totalNetTimeline: "総純損益タイムライン（フィルターなし）",
            timeRange: "期間",
            date: "日付",
            description: "説明",
            amount: "金額",
            noTransactionsForFilter: "この期間とフィルターに該当する取引はありません。",
            emptyCsvError: "CSVファイルが空か、有効な取引が見つかりませんでした。",
            missingRatesWarning: "必要な為替レート{count}件が読み込めませんでした。外貨での金額が不完全な場合があります。",
            months: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"],
            yearAll: "すべての年",
            monthAll: "すべての月",
            timelineMode: "表示",
            selectYears: "比較する年",
            noComparisonData: "少なくとも1つの年を選択してください。",
            comparisonDeviationTitle: "トップ10のカテゴリ乖離",
            noComparisonDeviationData: "乖離比較に十分なデータがありません（最低2年必要）。",
            barChart: "棒グラフ",
            pieCharts: "円グラフ",
            incomeTitle: "収入",
            expenseTitle: "支出",
            netTitle: "貯蓄",
            expenseByCat: "カテゴリー別支出",
            tableTitle: "概要",
            detailedCategoryTitle: "詳細カテゴリー表示"
        }
    };

    static async init() {
        this.updateDOM();
        window.addEventListener('i18n-update-required', () => this.updateDOM());
    }

    static get(key) {
        return this.translations[this.currentLang()][key] ?? this.translations[DEFAULT_LANG][key] ?? key;
    }

    static format(key, params = {}) {
        return Object.entries(params).reduce(
            (text, [name, value]) => text.replaceAll(`{${name}}`, value),
            this.get(key)
        );
    }

    static updateDOM() {
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const translation = this.get(el.dataset.i18nKey);
            if (el.tagName === 'INPUT') el.placeholder = translation;
            else el.textContent = translation;
        });

        const months = this.get('months');
        document.querySelectorAll('[data-i18n-month]').forEach(el => {
            el.textContent = months[Number(el.dataset.i18nMonth)];
        });

        document.documentElement.lang = this.currentLang();
    }

    static currentLang() {
        return resolveLanguage(AppStore.state.ui.currentLang);
    }

    static locale() {
        return localeOf(this.currentLang());
    }

    static formatCurrency(amount, currency) {
        return new Intl.NumberFormat(this.locale(), { style: 'currency', currency }).format(amount);
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString(this.locale());
    }
}