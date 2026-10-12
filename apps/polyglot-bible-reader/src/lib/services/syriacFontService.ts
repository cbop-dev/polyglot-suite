/**
 * Syriac font detection and switching utilities.
 */

export interface SyriacFontOption {
	id: string;
	family: string;
	label: string;
	isLocalSystem?: boolean;
}

// All possible candidate fonts in preference order
export const ALL_SYRIAC_FONTS: SyriacFontOption[] = [
	{ id: 'estrangelo-edessa', family: 'Estrangelo Edessa', label: 'Edessa', isLocalSystem: true },
	{ id: 'estrangelo-antioch', family: 'Estrangelo Antioch', label: 'Antioch', isLocalSystem: true },
	{ id: 'estrangelo-nisibin', family: 'Estrangelo Nisibin', label: 'Nisibin', isLocalSystem: true },
	{ id: 'estrangelo-midyat', family: 'Estrangelo Midyat', label: 'Midyat', isLocalSystem: true },
	{ id: 'estrangelo-marcus', family: 'Estrangelo Marcus', label: 'Marcus', isLocalSystem: false },
	{ id: 'noto-sans-syriac', family: 'Noto Sans Syriac', label: 'Noto Sans', isLocalSystem: false }
];

const STORAGE_KEY = 'pbr_syriac_font';
const CSS_VAR_NAME = '--font-syriac-current';

/**
 * Checks if a font is available in the current browser runtime using Canvas measurement
 * against monospace and sans-serif baselines.
 */
export function isFontAvailable(fontName: string, testSample: string = 'ܐܒܓܕܗܘܙܚܛܝ'): boolean {
	if (typeof document === 'undefined') return false;

	// 1. Try document.fonts.check if available
	try {
		if (document.fonts && typeof document.fonts.check === 'function') {
			if (document.fonts.check(`16px "${fontName}"`)) {
				// double check with canvas to avoid false positives on generic fallbacks
			}
		}
	} catch {
		// Ignore and fallback to canvas
	}

	// 2. Accurate Canvas metric comparison
	try {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		if (!ctx) return false;

		const baseFont = 'monospace';
		ctx.font = `72px ${baseFont}`;
		const baseWidth = ctx.measureText(testSample).width;

		ctx.font = `72px "${fontName}", ${baseFont}`;
		const testWidth = ctx.measureText(testSample).width;

		// Also check against a second distinct baseline to prevent accidental identical width
		if (testWidth !== baseWidth) return true;

		const baseFont2 = 'sans-serif';
		ctx.font = `72px ${baseFont2}`;
		const baseWidth2 = ctx.measureText(testSample).width;

		ctx.font = `72px "${fontName}", ${baseFont2}`;
		const testWidth2 = ctx.measureText(testSample).width;

		return testWidth2 !== baseWidth2;
	} catch {
		return false;
	}
}

/**
 * Scans candidate fonts and returns the list of fonts actually available on the device.
 * Always includes bundled web fonts.
 */
export function detectAvailableSyriacFonts(): SyriacFontOption[] {
	if (typeof window === 'undefined') {
		// Server/fallback: return bundled fonts
		return ALL_SYRIAC_FONTS.filter((f) => !f.isLocalSystem);
	}

	const available: SyriacFontOption[] = [];

	for (const font of ALL_SYRIAC_FONTS) {
		if (!font.isLocalSystem) {
			// Bundled web fonts are always available
			available.push(font);
		} else if (isFontAvailable(font.family)) {
			// System font detected
			available.push(font);
		}
	}

	return available;
}

/**
 * Gets the stored Syriac font family or null.
 */
export function getSavedSyriacFont(): string | null {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

/**
 * Persists the selected Syriac font family.
 */
export function saveSyriacFont(fontFamily: string) {
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, fontFamily);
	} catch {
		// Ignore
	}
}

/**
 * Applies the CSS variable to document.documentElement.
 */
export function applySyriacFontCss(fontFamily: string) {
	if (typeof document === 'undefined') return;
	// Always include bundled fallbacks after chosen font
	const fullStack = `"${fontFamily}", "Estrangelo Marcus", "Noto Sans Syriac", serif`;
	document.documentElement.style.setProperty(CSS_VAR_NAME, fullStack);
}
