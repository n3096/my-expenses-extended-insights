/** Languages every tool on this site offers, and the locale each one formats with. */
export const LOCALES = {
    de: 'de-DE',
    en: 'en-US',
    ja: 'ja-JP'
};

export const SUPPORTED_LANGS = Object.keys(LOCALES);
export const DEFAULT_LANG = 'de';

/** Falls back to the default for anything the site does not translate. */
export function resolveLanguage(candidate) {
    const lang = String(candidate ?? '').split('-')[0];
    return SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

export function localeOf(lang) {
    return LOCALES[resolveLanguage(lang)];
}

/**
 * Minimal translator for the single-file tools.
 *
 * `apply()` fills every `[data-i18n-key]` element from the active pack -
 * inputs get their placeholder, everything else its text content.
 */
export function createTranslator(translations, { onChange } = {}) {
    let lang = DEFAULT_LANG;

    const get = (key) => translations[lang]?.[key] ?? translations[DEFAULT_LANG][key] ?? key;

    const apply = () => {
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const translation = get(el.dataset.i18nKey);
            if (el.tagName === 'INPUT') el.placeholder = translation;
            else el.textContent = translation;
        });
        document.documentElement.lang = lang;
    };

    return {
        get,
        apply,
        format: (key, params = {}) => Object.entries(params).reduce(
            (text, [name, value]) => text.replaceAll(`{${name}}`, value),
            get(key)
        ),
        formatCurrency: (amount, currency) =>
            new Intl.NumberFormat(localeOf(lang), { style: 'currency', currency }).format(amount),
        get lang() { return lang; },
        setLanguage(next) {
            lang = resolveLanguage(next);
            apply();
            onChange?.(lang);
            return lang;
        }
    };
}
