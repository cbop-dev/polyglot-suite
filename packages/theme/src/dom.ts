/**
 * DOM and storage adapters for the reading-theme engine.
 * Applies CSS variables directly to the root element and syncs with localStorage.
 */

import {
	resolveThemeColors,
	rgbCss,
	rgbaCss,
	lerpRgb,
	type ResolvedThemeColors
} from './core.ts';

export interface ThemeDomOptions {
	storageKey?: string;
	warmthStorageKey?: string;
	legacyKey?: string;
	profile?: 'standard' | 'josephus' | 'all';
	customTokens?: (colors: ResolvedThemeColors, root: HTMLElement) => void;
}

export const DEFAULT_THEME_STORAGE_KEY = 'polyglot_reading_theme';
export const DEFAULT_WARMTH_STORAGE_KEY = 'polyglot_reading_warmth';

/**
 * Applies computed theme variables to document.documentElement.
 */
export function applyReadingTheme(
	themeValue: number,
	warmthValue: number = 50,
	options: ThemeDomOptions = {}
): ResolvedThemeColors | null {
	if (typeof document === 'undefined') return null;

	const colors = resolveThemeColors(themeValue, warmthValue);
	const { isDark, bg, fg, inkSoft, inkMuted, rule, cardBg, cardBorder, link, accent, accentLight } = colors;

	const root = document.documentElement;
	const profile = options.profile ?? 'all';

	// Root classes & data attributes
	root.setAttribute('data-theme', isDark ? 'dark' : 'light');
	if (isDark) {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}
	root.style.colorScheme = isDark ? 'dark' : 'light';

	// Standard CSS tokens (Apostolic Fathers, Bible Reader baseline)
	if (profile === 'standard' || profile === 'all') {
		root.style.setProperty('--color-page', rgbCss(bg));
		root.style.setProperty('--color-ink', rgbCss(fg));
		root.style.setProperty('--color-ink-soft', rgbCss(inkSoft));
		root.style.setProperty('--color-rule', rgbCss(rule));
		root.style.setProperty('--color-link', rgbCss(link));
		root.style.setProperty('--color-accent', rgbCss(accent));
		root.style.setProperty('--color-card-bg', rgbCss(cardBg));
		root.style.setProperty('--color-card-border', rgbCss(cardBorder));
	}

	// Josephus Reader specific tokens
	if (profile === 'josephus' || profile === 'all') {
		root.style.setProperty('--page-bg', rgbCss(bg));
		root.style.setProperty('--col-bg', rgbCss(cardBg));
		root.style.setProperty('--popup-bg', rgbCss(cardBg));
		root.style.setProperty('--text', rgbCss(fg));
		root.style.setProperty('--text-mid', rgbCss(inkSoft));
		root.style.setProperty('--text-light', rgbCss(inkMuted));
		root.style.setProperty('--border', rgbCss(rule));
		root.style.setProperty('--accent', rgbCss(link));
		root.style.setProperty('--accent-light', rgbCss(accentLight));
		root.style.setProperty('--input-bg', isDark ? rgbCss(cardBg) : '#ffffff');
		root.style.setProperty('--on-accent', isDark ? '#121415' : '#f5f9f8');
		root.style.setProperty('--greek-hover', rgbaCss(link, isDark ? 0.15 : 0.08));
		root.style.setProperty('--greek-hover-border', rgbaCss(link, isDark ? 0.3 : 0.16));
		root.style.setProperty(
			'--greek-active',
			isDark ? rgbCss(lerpRgb(link, bg, 0.6)) : rgbCss(lerpRgb(link, [255, 255, 255], 0.7))
		);
	}

	// Custom user token hook
	if (options.customTokens) {
		options.customTokens(colors, root);
	}

	return colors;
}

/**
 * Initializes and returns the saved reading warmth value (0..100).
 */
export function initReadingWarmth(options: ThemeDomOptions = {}): number {
	if (typeof window === 'undefined') return 50;

	const key = options.warmthStorageKey ?? DEFAULT_WARMTH_STORAGE_KEY;
	const legacyKey = options.legacyKey;

	try {
		const stored = localStorage.getItem(key);
		if (stored !== null) {
			const parsed = parseInt(stored, 10);
			if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
				return parsed;
			}
		}

		// Backward compatibility migration from legacy themes (e.g. 'ne-theme')
		if (legacyKey) {
			const legacy = localStorage.getItem(legacyKey);
			if (legacy === 'sepia') return 100;
			if (legacy === 'dark' || legacy === 'light') return 50;
		}

		return 50;
	} catch {
		return 50;
	}
}

/**
 * Saves reading warmth to localStorage.
 */
export function saveReadingWarmth(value: number, key: string = DEFAULT_WARMTH_STORAGE_KEY): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(key, String(Math.round(value)));
	} catch {}
}

/**
 * Initializes, applies, and returns the saved reading theme brightness value (0..100).
 */
export function initReadingTheme(options: ThemeDomOptions = {}): number {
	if (typeof window === 'undefined') return 25;

	const key = options.storageKey ?? DEFAULT_THEME_STORAGE_KEY;
	const legacyKey = options.legacyKey;

	try {
		let themeVal = 25;
		const stored = localStorage.getItem(key);

		if (stored !== null) {
			const parsed = parseInt(stored, 10);
			if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
				themeVal = parsed;
			}
		} else if (legacyKey) {
			// Check legacy key
			const legacy = localStorage.getItem(legacyKey);
			if (legacy === 'dark') themeVal = 75;
			else if (legacy === 'sepia') themeVal = 20;
			else if (legacy === 'light') themeVal = 25;
			else {
				const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
				themeVal = prefersDark ? 75 : 25;
			}
		} else {
			const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
			themeVal = prefersDark ? 75 : 25;
		}

		const warmthVal = initReadingWarmth(options);
		applyReadingTheme(themeVal, warmthVal, options);
		return themeVal;
	} catch {
		applyReadingTheme(25, 50, options);
		return 25;
	}
}

/**
 * Saves reading theme brightness to localStorage.
 */
export function saveReadingTheme(value: number, key: string = DEFAULT_THEME_STORAGE_KEY): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(key, String(Math.round(value)));
	} catch {}
}

/**
 * Generates the inline JavaScript snippet for <head> to eliminate Flash of Unstyled Content (FOUC).
 */
export function generateThemeInitScript(options: ThemeDomOptions = {}): string {
	const themeKey = options.storageKey ?? DEFAULT_THEME_STORAGE_KEY;
	const warmthKey = options.warmthStorageKey ?? DEFAULT_WARMTH_STORAGE_KEY;
	const legacyKey = options.legacyKey ? `'${options.legacyKey}'` : 'null';

	return `(function() {
  try {
    var tk = '${themeKey}';
    var wk = '${warmthKey}';
    var lk = ${legacyKey};
    var t = localStorage.getItem(tk);
    var w = localStorage.getItem(wk);
    var themeVal = 25;
    var warmthVal = 50;

    if (t !== null) {
      themeVal = parseInt(t, 10);
    } else if (lk) {
      var leg = localStorage.getItem(lk);
      if (leg === 'dark') { themeVal = 75; warmthVal = 50; }
      else if (leg === 'sepia') { themeVal = 20; warmthVal = 100; }
      else if (leg === 'light') { themeVal = 25; warmthVal = 50; }
      else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        themeVal = 75;
      }
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      themeVal = 75;
    }

    if (w !== null) {
      warmthVal = parseInt(w, 10);
    }

    var isDark = themeVal >= 50;
    var themeName = isDark ? 'dark' : (warmthVal >= 80 ? 'sepia' : 'light');
    var root = document.documentElement;
    root.setAttribute('data-theme', themeName);
    if (isDark) root.classList.add('dark'); else root.classList.remove('dark');
    root.style.colorScheme = isDark ? 'dark' : 'light';
  } catch(e) {}
})();`;
}
