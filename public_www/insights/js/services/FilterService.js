export class FilterService {
    static getFilteredTransactions(transactions, filters) {
        if (!transactions || !filters) return transactions || [];

        return transactions.filter(t => {
            const date = new Date(t.date);
            const tYear = date.getFullYear().toString();
            const tMonth = String(date.getMonth() + 1).padStart(2, '0');

            if (filters.year !== 'all' && tYear !== filters.year) return false;

            if (filters.month !== 'all' && tMonth !== filters.month.padStart(2, '0')) return false;

            if (filters.categories && filters.categories.size > 0) {
                if (!filters.categories.has(t.displayCategory)) return false;
            }

            if (filters.currencies && filters.currencies.size > 0) {
                if (!filters.currencies.has(t.currency)) return false;
            }

            return true;
        });
    }
}