/**
 * Reading-theme engine for Polyglot Bible Reader.
 * Re-exports the unified @polyglot/theme engine while preserving backwards compatibility.
 */

import {
	applyReadingTheme as applyThemeCore,
	initReadingTheme as initThemeCore,
	initReadingWarmth as initWarmthCore,
	saveReadingTheme as saveThemeCore,
	saveReadingWarmth as saveWarmthCore,
	DEFAULT_THEME_STORAGE_KEY,
	DEFAULT_WARMTH_STORAGE_KEY
} from '@polyglot/theme';

export * from '@polyglot/theme';

export const THEME_STORAGE_KEY = 'biblical_reading_theme';
export const WARMTH_STORAGE_KEY = 'biblical_reading_warmth';

const defaultOptions = {
	storageKey: THEME_STORAGE_KEY,
	warmthStorageKey: WARMTH_STORAGE_KEY,
	profile: 'all'
};

export function applyReadingTheme(value, warmth = 50) {
	return applyThemeCore(value, warmth, defaultOptions);
}

export function initReadingTheme() {
	return initThemeCore(defaultOptions);
}

export function initReadingWarmth() {
	return initWarmthCore(defaultOptions);
}

export function saveReadingTheme(value) {
	saveThemeCore(value, THEME_STORAGE_KEY);
}

export function saveReadingWarmth(value) {
	saveWarmthCore(value, WARMTH_STORAGE_KEY);
}
