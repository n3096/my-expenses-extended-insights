const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

/** Escapes a value so it can safely be interpolated into an HTML template string. */
export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => HTML_ENTITIES[char]);
}
