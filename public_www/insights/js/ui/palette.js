/** Categorical colours shared by every chart so a category keeps its colour. */
export const CHART_COLORS = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
    '#06B6D4', '#22D3EE', '#F472B6', '#A78BFA', '#FB7185', '#34D399',
    '#FBBF24', '#60A5FA', '#F87171', '#3B82F6', '#2DD4BF', '#F43F5E',
    '#8263FF', '#00C49F', '#FFBB28', '#FF8042', '#0088FE'
];

export const ACCENT_COLOR = '#4F46E5';

export function colorAt(index) {
    return CHART_COLORS[index % CHART_COLORS.length];
}
