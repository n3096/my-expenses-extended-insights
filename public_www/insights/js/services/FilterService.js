export class FilterService {
    static matchesPeriod(transaction, { year, month }) {
        const date = new Date(transaction.date);
        const yearMatches = year === 'all' || date.getFullYear().toString() === year;
        const monthMatches = month === 'all'
            || (date.getMonth() + 1).toString().padStart(2, '0') === String(month).padStart(2, '0');
        return yearMatches && monthMatches;
    }

    static matchesCategory(transaction, { categories }) {
        return categories.has(transaction.displayCategory);
    }

    static byPeriod(transactions, filters) {
        return transactions.filter(t => this.matchesPeriod(t, filters));
    }

    static byCategory(transactions, filters) {
        return transactions.filter(t => this.matchesCategory(t, filters));
    }
}
