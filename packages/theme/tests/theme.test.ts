import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	colorAt,
	getThemeLabel,
	resolveThemeColors,
	getNextPreset,
	THEME_PRESETS
} from '../src/core.ts';
import { generateThemeInitScript } from '../src/dom.ts';

describe('@polyglot/theme core engine', () => {
	it('calculates light and dark colors properly', () => {
		const light = colorAt(0.0, 0.5);
		// Light theme neutral background should be white/off-white
		assert.ok(light.bg[0] >= 240);
		assert.ok(light.bg[1] >= 240);
		assert.ok(light.bg[2] >= 240);
		// Foreground text should be dark
		assert.ok(light.fg[0] <= 50);

		const dark = colorAt(1.0, 0.5);
		// Dark theme neutral background should be very dark/black
		assert.ok(dark.bg[0] <= 10);
		assert.ok(dark.bg[1] <= 10);
		assert.ok(dark.bg[2] <= 10);
		// Foreground text should be light
		assert.ok(dark.fg[0] >= 200);
	});

	it('reflects warmth differences in palette stops', () => {
		const cool = colorAt(0.25, 0.0);
		const warm = colorAt(0.25, 1.0);

		// Cool slate has higher blue component than warm sepia
		assert.ok(cool.bg[2] > cool.bg[0] || cool.bg[2] > 230);
		// Warm sepia has higher red/amber component than blue
		assert.ok(warm.bg[0] > warm.bg[2]);
	});

	it('returns appropriate labels across spectrum', () => {
		assert.equal(getThemeLabel(5), 'Pure Light');
		assert.equal(getThemeLabel(25), 'Warm Light');
		assert.equal(getThemeLabel(45), 'Muted Light');
		assert.equal(getThemeLabel(55), 'Muted Dark');
		assert.equal(getThemeLabel(75), 'Deep Dark');
		assert.equal(getThemeLabel(95), 'High Contrast Dark');
	});

	it('resolves semantic tokens in resolveThemeColors', () => {
		const tokens = resolveThemeColors(25, 50);
		assert.equal(tokens.isDark, false);
		assert.ok(Array.isArray(tokens.bg) && tokens.bg.length === 3);
		assert.ok(Array.isArray(tokens.fg) && tokens.fg.length === 3);
		assert.ok(Array.isArray(tokens.cardBg));
		assert.ok(Array.isArray(tokens.link));
		assert.ok(Array.isArray(tokens.accent));

		const darkTokens = resolveThemeColors(75, 50);
		assert.equal(darkTokens.isDark, true);
	});

	it('cycles presets correctly', () => {
		// Pure Light (0, 0) should cycle to Midnight (75, 50)
		const next1 = getNextPreset(0, 0);
		assert.equal(next1.name, 'Midnight');

		// Midnight (75, 50) should cycle to Parchment (20, 100)
		const next2 = getNextPreset(75, 50);
		assert.equal(next2.name, 'Parchment');

		// Parchment (20, 100) should cycle to Pure Light (0, 0)
		const next3 = getNextPreset(20, 100);
		assert.equal(next3.name, 'Pure Light');
	});

	it('generates no-FOUC init script', () => {
		const script = generateThemeInitScript({
			storageKey: 'ne-reading-theme',
			warmthStorageKey: 'ne-reading-warmth',
			legacyKey: 'ne-theme'
		});
		assert.ok(script.includes('ne-reading-theme'));
		assert.ok(script.includes('ne-reading-warmth'));
		assert.ok(script.includes('ne-theme'));
		assert.ok(script.includes('document.documentElement'));
	});
});
