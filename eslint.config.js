import js from '@eslint/js';
import globals from 'globals';
import html from 'eslint-plugin-html';
import htmlParser from '@html-eslint/parser';
import htmlPlugin from '@html-eslint/eslint-plugin';

const browserGlobals = {
    ...globals.browser,
    Chart: 'readonly',
    tailwind: 'writable'
};

export default [
    { ignores: ['node_modules/**'] },

    {
        files: ['public_www/**/*.js'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: browserGlobals
        }
    },

    // Scripts embedded in the single-file tools are extracted and linted too.
    {
        files: ['public_www/**/*.html'],
        plugins: { html },
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: browserGlobals
        },
        settings: { 'html/javascript-mime-types': ['text/javascript', 'module'] }
    },

    // Markup itself: duplicate ids are the failure mode this codebase is prone to,
    // since every renderer reaches into the DOM by id.
    {
        files: ['public_www/**/*.html'],
        plugins: { '@html-eslint': htmlPlugin },
        languageOptions: { parser: htmlParser },
        rules: {
            '@html-eslint/no-duplicate-id': 'error',
            '@html-eslint/no-duplicate-attrs': 'error',
            '@html-eslint/require-closing-tags': ['error', { selfClosing: 'never' }],
            '@html-eslint/no-obsolete-tags': 'error',
            '@html-eslint/require-doctype': 'error',
            '@html-eslint/require-li-container': 'error'
        }
    },

    {
        files: ['tests/**/*.mjs', 'eslint.config.js'],
        ...js.configs.recommended,
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: { ...globals.node, ...browserGlobals }
        }
    }
];
