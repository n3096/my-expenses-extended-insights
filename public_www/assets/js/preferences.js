import { resolveLanguage } from './i18n.js';

const THEME_KEY = 'theme';
const LANGUAGE_KEY = 'language';

/** localStorage is unavailable in private modes and inside sandboxed frames. */
function read(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function write(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* preference simply is not remembered */
    }
}

export const Preferences = {
    /** Stored choice, otherwise whatever the operating system asks for. */
    theme() {
        const stored = read(THEME_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    saveTheme(theme) {
        write(THEME_KEY, theme);
    },

    /** Stored choice, otherwise the browser language, otherwise the default. */
    language() {
        return resolveLanguage(read(LANGUAGE_KEY) ?? navigator.language);
    },

    saveLanguage(lang) {
        write(LANGUAGE_KEY, lang);
    }
};

/**
 * Applies a theme to the document and keeps the two toggle icons in sync.
 * The visible icon is the one you would switch *to*.
 */
export function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.getElementById('theme-icon-light')?.classList.toggle('hidden', !isDark);
    document.getElementById('theme-icon-dark')?.classList.toggle('hidden', isDark);
    return theme;
}

/** Wires a toggle button; returns a function that reports the current theme. */
export function initTheme(buttonId = 'theme-toggle', { onChange } = {}) {
    let current = applyTheme(Preferences.theme());

    document.getElementById(buttonId)?.addEventListener('click', () => {
        current = applyTheme(current === 'dark' ? 'light' : 'dark');
        Preferences.saveTheme(current);
        onChange?.(current);
    });

    return () => current;
}
