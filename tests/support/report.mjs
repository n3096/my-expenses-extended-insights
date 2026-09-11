export function createReporter(suite) {
    const results = { passed: 0, failed: 0 };

    return {
        results,
        check(label, ok, detail = '') {
            const status = ok ? 'PASS' : 'FAIL';
            results[ok ? 'passed' : 'failed']++;
            console.log(`  ${status}  ${label}${detail ? ` :: ${detail}` : ''}`);
        },
        suite
    };
}
