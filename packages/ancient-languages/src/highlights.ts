export interface PaletteColor {
	id: number;
	name: string;
	hex: string;
	bgLight: string;
	textLight: string;
	borderLight: string;
	bgDark: string;
	textDark: string;
	borderDark: string;
}

export const HIGHLIGHT_PALETTE: PaletteColor[] = [
	{
		id: 0,
		name: 'Amber',
		hex: '#f59e0b',
		bgLight: 'rgba(245, 158, 11, 0.28)',
		textLight: '#78350f',
		borderLight: 'rgba(245, 158, 11, 0.6)',
		bgDark: 'rgba(245, 158, 11, 0.42)',
		textDark: '#fef3c7',
		borderDark: 'rgba(245, 158, 11, 0.7)'
	},
	{
		id: 1,
		name: 'Sky Blue',
		hex: '#0ea5e9',
		bgLight: 'rgba(14, 165, 233, 0.26)',
		textLight: '#0369a1',
		borderLight: 'rgba(14, 165, 233, 0.6)',
		bgDark: 'rgba(14, 165, 233, 0.42)',
		textDark: '#e0f2fe',
		borderDark: 'rgba(14, 165, 233, 0.7)'
	},
	{
		id: 2,
		name: 'Emerald',
		hex: '#10b981',
		bgLight: 'rgba(16, 185, 129, 0.26)',
		textLight: '#065f46',
		borderLight: 'rgba(16, 185, 129, 0.6)',
		bgDark: 'rgba(16, 185, 129, 0.42)',
		textDark: '#d1fae5',
		borderDark: 'rgba(16, 185, 129, 0.7)'
	},
	{
		id: 3,
		name: 'Rose',
		hex: '#f43f5e',
		bgLight: 'rgba(244, 63, 94, 0.26)',
		textLight: '#9f1239',
		borderLight: 'rgba(244, 63, 94, 0.6)',
		bgDark: 'rgba(244, 63, 94, 0.42)',
		textDark: '#ffe4e6',
		borderDark: 'rgba(244, 63, 94, 0.7)'
	},
	{
		id: 4,
		name: 'Violet',
		hex: '#8b5cf6',
		bgLight: 'rgba(139, 92, 246, 0.26)',
		textLight: '#5b21b6',
		borderLight: 'rgba(139, 92, 246, 0.6)',
		bgDark: 'rgba(139, 92, 246, 0.42)',
		textDark: '#ede9fe',
		borderDark: 'rgba(139, 92, 246, 0.7)'
	},
	{
		id: 5,
		name: 'Orange',
		hex: '#f97316',
		bgLight: 'rgba(249, 115, 22, 0.28)',
		textLight: '#9a3412',
		borderLight: 'rgba(249, 115, 22, 0.6)',
		bgDark: 'rgba(249, 115, 22, 0.42)',
		textDark: '#ffedd5',
		borderDark: 'rgba(249, 115, 22, 0.7)'
	},
	{
		id: 6,
		name: 'Teal',
		hex: '#14b8a6',
		bgLight: 'rgba(20, 184, 166, 0.26)',
		textLight: '#0f766e',
		borderLight: 'rgba(20, 184, 166, 0.6)',
		bgDark: 'rgba(20, 184, 166, 0.42)',
		textDark: '#ccfbf1',
		borderDark: 'rgba(20, 184, 166, 0.7)'
	},
	{
		id: 7,
		name: 'Fuchsia',
		hex: '#d946ef',
		bgLight: 'rgba(217, 70, 239, 0.26)',
		textLight: '#86198f',
		borderLight: 'rgba(217, 70, 239, 0.6)',
		bgDark: 'rgba(217, 70, 239, 0.42)',
		textDark: '#fae8ff',
		borderDark: 'rgba(217, 70, 239, 0.7)'
	},
	{
		id: 8,
		name: 'Lime',
		hex: '#84cc16',
		bgLight: 'rgba(132, 204, 22, 0.30)',
		textLight: '#3f6212',
		borderLight: 'rgba(132, 204, 22, 0.6)',
		bgDark: 'rgba(132, 204, 22, 0.42)',
		textDark: '#ecfccb',
		borderDark: 'rgba(132, 204, 22, 0.7)'
	},
	{
		id: 9,
		name: 'Indigo',
		hex: '#6366f1',
		bgLight: 'rgba(99, 102, 241, 0.26)',
		textLight: '#3730a3',
		borderLight: 'rgba(99, 102, 241, 0.6)',
		bgDark: 'rgba(99, 102, 241, 0.42)',
		textDark: '#e0e7ff',
		borderDark: 'rgba(99, 102, 241, 0.7)'
	},
	{
		id: 10,
		name: 'Coral',
		hex: '#fb7185',
		bgLight: 'rgba(251, 113, 133, 0.26)',
		textLight: '#881337',
		borderLight: 'rgba(251, 113, 133, 0.6)',
		bgDark: 'rgba(251, 113, 133, 0.42)',
		textDark: '#ffe4e6',
		borderDark: 'rgba(251, 113, 133, 0.7)'
	},
	{
		id: 11,
		name: 'Cyan',
		hex: '#06b6d4',
		bgLight: 'rgba(6, 182, 212, 0.26)',
		textLight: '#155e75',
		borderLight: 'rgba(6, 182, 212, 0.6)',
		bgDark: 'rgba(6, 182, 212, 0.42)',
		textDark: '#cffafe',
		borderDark: 'rgba(6, 182, 212, 0.7)'
	},
	{
		id: 12,
		name: 'Yellow',
		hex: '#eab308',
		bgLight: 'rgba(234, 179, 8, 0.30)',
		textLight: '#713f12',
		borderLight: 'rgba(234, 179, 8, 0.6)',
		bgDark: 'rgba(234, 179, 8, 0.42)',
		textDark: '#fef9c3',
		borderDark: 'rgba(234, 179, 8, 0.7)'
	},
	{
		id: 13,
		name: 'Plum',
		hex: '#a855f7',
		bgLight: 'rgba(168, 85, 247, 0.26)',
		textLight: '#6b21a8',
		borderLight: 'rgba(168, 85, 247, 0.6)',
		bgDark: 'rgba(168, 85, 247, 0.42)',
		textDark: '#f3e8ff',
		borderDark: 'rgba(168, 85, 247, 0.7)'
	},
	{
		id: 14,
		name: 'Mint',
		hex: '#2dd4bf',
		bgLight: 'rgba(45, 212, 191, 0.26)',
		textLight: '#134e4a',
		borderLight: 'rgba(45, 212, 191, 0.6)',
		bgDark: 'rgba(45, 212, 191, 0.42)',
		textDark: '#ccfbf1',
		borderDark: 'rgba(21, 184, 166, 0.7)'
	},
	{
		id: 15,
		name: 'Slate',
		hex: '#64748b',
		bgLight: 'rgba(100, 116, 139, 0.26)',
		textLight: '#1e293b',
		borderLight: 'rgba(100, 116, 139, 0.6)',
		bgDark: 'rgba(100, 116, 139, 0.42)',
		textDark: '#f1f5f9',
		borderDark: 'rgba(100, 116, 139, 0.7)'
	}
];

/**
 * Returns the palette color for a given color index safely.
 */
export function getPaletteColor(colorIndex: number): PaletteColor {
	if (typeof colorIndex !== 'number' || isNaN(colorIndex)) {
		return HIGHLIGHT_PALETTE[0];
	}
	const safeIndex = Math.abs(Math.floor(colorIndex)) % HIGHLIGHT_PALETTE.length;
	return HIGHLIGHT_PALETTE[safeIndex];
}

/**
 * Calculates the next available color index not currently in use.
 * If all colors in the palette are in use, cycles based on the collection size.
 */
export function getNextPaletteColorIndex(
	usedIndices: Iterable<number>,
	paletteSize: number = HIGHLIGHT_PALETTE.length
): number {
	const used = new Set<number>();
	let count = 0;
	for (const idx of usedIndices) {
		if (typeof idx === 'number' && !isNaN(idx)) {
			used.add(idx);
			count++;
		}
	}

	for (let i = 0; i < paletteSize; i++) {
		if (!used.has(i)) {
			return i;
		}
	}

	return count % paletteSize;
}

/**
 * Generates an inline CSS style string for highlighting a token.
 */
export function getHighlightInlineStyle(colorIndex: number, isDark: boolean = false): string {
	const pal = getPaletteColor(colorIndex);
	const bg = isDark ? pal.bgDark : pal.bgLight;
	const text = isDark ? pal.textDark : pal.textLight;
	const border = isDark ? pal.borderDark : pal.borderLight;
	return `background-color: ${bg}; color: ${text}; border-bottom: 2px solid ${border}; border-radius: 4px; padding: 1px 3px; font-weight: 600;`;
}

/**
 * Normalizes Strong's Concordance identifier (e.g. 'G03056' -> 'G3056').
 */
export function normalizeStrongsId(s?: string): string {
	if (!s) return '';
	return s.trim().toUpperCase().replace(/^[A-Z]*0+/, (m) => m[0]);
}
