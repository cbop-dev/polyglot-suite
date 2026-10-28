/**
 * Core reading-theme engine with contrast-invariant piecewise interpolation.
 * Supports light to dark with smooth warmth/temperature control
 * (cool slate, neutral solarized, warm sepia/parchment).
 *
 * Framework-agnostic and zero-dependency.
 */

export type RGB = [number, number, number];

export type ColorStop = [number, RGB, RGB];

// --- COOL PALETTE ---
export const LIGHT_STOPS_COOL: ColorStop[] = [
	[0.00, [255, 255, 255], [26, 26, 26]],    // pure black on white
	[0.25, [240, 244, 248], [15, 23, 42]],    // cool slate-50
	[0.50, [226, 232, 240], [51, 65, 85]]     // cool slate-200
];

export const DARK_STOPS_COOL: ColorStop[] = [
	[0.50, [15, 23, 42], [148, 163, 184]],    // deep slate
	[0.75, [9, 14, 25], [100, 116, 139]],     // darker slate
	[1.00, [0, 0, 5], [200, 210, 220]]        // pure black-blue
];

// --- NEUTRAL PALETTE (Solarized base) ---
export const LIGHT_STOPS_NEUTRAL: ColorStop[] = [
	[0.00, [255, 255, 255], [26, 26, 26]],    // pure black on white
	[0.25, [253, 246, 227], [7, 54, 66]],     // Solarized base3 / base02 (parchment)
	[0.50, [238, 232, 213], [101, 123, 131]]  // Solarized base2 / base00 (soft light edge)
];

export const DARK_STOPS_NEUTRAL: ColorStop[] = [
	[0.50, [7, 54, 66], [131, 148, 150]],     // Solarized base02 / base0 (soft dark edge)
	[0.75, [0, 43, 54], [147, 161, 161]],     // Solarized base03 / base1 (slate/midnight)
	[1.00, [0, 0, 0], [255, 255, 255]]        // pure white on black
];

// --- WARM PALETTE ---
export const LIGHT_STOPS_WARM: ColorStop[] = [
	[0.00, [255, 250, 240], [40, 20, 10]],    // floral white
	[0.25, [245, 222, 179], [60, 30, 15]],    // wheat / sepia
	[0.50, [222, 184, 135], [90, 50, 30]]     // burlywood / dark sepia
];

export const DARK_STOPS_WARM: ColorStop[] = [
	[0.50, [45, 35, 30], [180, 160, 140]],    // espresso
	[0.75, [25, 20, 15], [150, 130, 110]],    // deep mocha
	[1.00, [5, 0, 0], [220, 200, 180]]        // warm black
];

export const LINK_LIGHT: RGB = [31, 77, 138];  // navy
export const LINK_DARK: RGB  = [122, 176, 232]; // sky
export const ACC_LIGHT: RGB  = [107, 52, 16];  // brick
export const ACC_DARK: RGB   = [212, 165, 116]; // ochre

// Lemma button stops: deep burgundy on light backgrounds, refined slate/ocean blue on dark
export const LEMMA_BTN_LIGHT_STOPS: [number, RGB][] = [
	[0.00, [140, 24, 40]],   // deep wine / crimson (#8c1828)
	[0.25, [160, 28, 42]],   // rich burgundy (#a01c2a)
	[0.50, [185, 30, 45]]    // warm carmine (#b91e2d)
];

export const LEMMA_BTN_DARK_STOPS: [number, RGB][] = [
	[0.50, [30, 88, 140]],   // deep slate blue (#1e588c)
	[0.75, [36, 105, 162]],  // rich ocean sapphire (#2469a2)
	[1.00, [42, 120, 182]]   // refined steel blue (#2a78b6)
];

// Lookup/Action button stops (inverted contrast: dark fill on light page, light fill on dark page)
export const LOOKUP_BTN_LIGHT_STOPS: [number, RGB][] = [
	[0.00, [15, 23, 42]],    // deep slate black (#0f172a)
	[0.25, [24, 34, 52]],    // rich dark slate ink (#182234)
	[0.50, [35, 48, 68]]     // slate-800 (#233044)
];

export const LOOKUP_BTN_DARK_STOPS: [number, RGB][] = [
	[0.50, [238, 242, 246]],  // light slate / ivory (#eef2f6)
	[0.75, [248, 250, 252]],  // clean light slate (#f8fafc)
	[1.00, [255, 255, 255]]   // pure white (#ffffff)
];

export function lerp(a: number, b: number, t: number): number {
	return Math.round(a + (b - a) * t);
}

export function lerpRgb(a: RGB, b: RGB, t: number): RGB {
	return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function rgbCss(c: RGB): string {
	return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function rgbaCss(c: RGB, alpha: number): string {
	return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

export function interpolateColorStops(stops: [number, RGB][], t: number): RGB {
	for (let i = 0; i < stops.length - 1; i++) {
		const [t0, c0] = stops[i];
		const [t1, c1] = stops[i + 1];
		if (t >= t0 && t <= t1) {
			const seg = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
			return lerpRgb(c0, c1, seg);
		}
	}
	const last = stops[stops.length - 1];
	return last[1];
}

export function srgbToLinear(c: number): number {
	c = c / 255;
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Convert RGB to DaisyUI OKLCH format string: "L% C H"
 */
export function rgbToDaisyOklch([r, g, b]: RGB): string {
	const lr = srgbToLinear(r);
	const lg = srgbToLinear(g);
	const lb = srgbToLinear(b);

	const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
	const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
	const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

	const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
	const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
	const bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;

	const C = Math.sqrt(a * a + bb * bb);
	let h = Math.atan2(bb, a) * (180 / Math.PI);
	if (h < 0) h += 360;

	return `${(L * 100).toFixed(4)}% ${C.toFixed(6)} ${h.toFixed(6)}`;
}

export function interpolateStops(stops: ColorStop[], t: number): { bg: RGB; fg: RGB } {
	for (let i = 0; i < stops.length - 1; i++) {
		const [t0, bg0, fg0] = stops[i];
		const [t1, bg1, fg1] = stops[i + 1];
		if (t >= t0 && t <= t1) {
			const seg = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
			return { bg: lerpRgb(bg0, bg1, seg), fg: lerpRgb(fg0, fg1, seg) };
		}
	}
	const last = stops[stops.length - 1];
	return { bg: last[1], fg: last[2] };
}

/**
 * Calculates background and foreground text colors for normalized t (0.0=light .. 1.0=dark)
 * and normalized warmth w (0.0=cool .. 0.5=neutral .. 1.0=warm).
 */
export function colorAt(t: number, w: number = 0.5): { bg: RGB; fg: RGB } {
	let stopsA: ColorStop[];
	let stopsB: ColorStop[];
	let blend: number;

	if (w < 0.5) {
		blend = w * 2.0;
		stopsA = t < 0.5 ? LIGHT_STOPS_COOL : DARK_STOPS_COOL;
		stopsB = t < 0.5 ? LIGHT_STOPS_NEUTRAL : DARK_STOPS_NEUTRAL;
	} else {
		blend = (w - 0.5) * 2.0;
		stopsA = t < 0.5 ? LIGHT_STOPS_NEUTRAL : DARK_STOPS_NEUTRAL;
		stopsB = t < 0.5 ? LIGHT_STOPS_WARM : DARK_STOPS_WARM;
	}

	const cA = interpolateStops(stopsA, t);
	const cB = interpolateStops(stopsB, t);

	return {
		bg: lerpRgb(cA.bg, cB.bg, blend),
		fg: lerpRgb(cA.fg, cB.fg, blend)
	};
}

export interface ResolvedThemeColors {
	t: number;
	w: number;
	isDark: boolean;
	bg: RGB;
	fg: RGB;
	inkSoft: RGB;
	inkMuted: RGB;
	rule: RGB;
	cardBg: RGB;
	cardBorder: RGB;
	link: RGB;
	accent: RGB;
	accentLight: RGB;
	lemmaBtnBg: RGB;
	lemmaBtnHover: RGB;
	lemmaBtnBorder: RGB;
	lookupBtnBg: RGB;
	lookupBtnHover: RGB;
	lookupBtnBorder: string;
	lookupBtnText: RGB;
}

/**
 * Resolves a full set of semantic color tokens from slider values (0..100).
 */
export function resolveThemeColors(themeValue: number, warmthValue: number = 50): ResolvedThemeColors {
	const clamped = Math.max(0, Math.min(100, Math.round(themeValue)));
	const clampedWarmth = Math.max(0, Math.min(100, Math.round(warmthValue)));
	const t = clamped / 100;
	const w = clampedWarmth / 100;
	const isDark = clamped >= 50;

	const { bg, fg } = colorAt(t, w);

	const inkSoft = lerpRgb(fg, bg, 0.35);
	const inkMuted = lerpRgb(fg, bg, 0.55);
	const rule = lerpRgb(bg, fg, 0.12);
	const cardBg = isDark ? lerpRgb(bg, fg, 0.06) : lerpRgb(bg, fg, 0.025);
	const cardBorder = isDark ? lerpRgb(bg, fg, 0.14) : lerpRgb(bg, fg, 0.08);

	const link = lerpRgb(LINK_LIGHT, LINK_DARK, t);
	const accent = lerpRgb(ACC_LIGHT, ACC_DARK, t);
	const accentLight = lerpRgb(accent, bg, 0.2);

	// Dynamic Lemma Button colors
	const lemmaBtnBg = t < 0.5
		? interpolateColorStops(LEMMA_BTN_LIGHT_STOPS, t)
		: interpolateColorStops(LEMMA_BTN_DARK_STOPS, t);

	const lemmaBtnHover = isDark
		? lerpRgb(lemmaBtnBg, [255, 255, 255], 0.14)
		: lerpRgb(lemmaBtnBg, [0, 0, 0], 0.16);

	const lemmaBtnBorder = isDark
		? lerpRgb(lemmaBtnBg, [255, 255, 255], 0.28)
		: lerpRgb(lemmaBtnBg, [0, 0, 0], 0.2);

	// Dynamic Lookup Button colors
	const lookupBtnBg = t < 0.5
		? interpolateColorStops(LOOKUP_BTN_LIGHT_STOPS, t)
		: interpolateColorStops(LOOKUP_BTN_DARK_STOPS, t);

	const lookupBtnText: RGB = isDark
		? [15, 23, 42]     // deep dark ink on light button
		: [255, 255, 255]; // crisp white text on dark button

	const lookupBtnHover = isDark
		? lerpRgb(lookupBtnBg, [200, 210, 220], 0.15)
		: lerpRgb(lookupBtnBg, [80, 100, 130], 0.25);

	const lookupBtnBorder = isDark
		? 'rgba(255, 255, 255, 0.35)'
		: 'rgba(0, 0, 0, 0.3)';

	return {
		t,
		w,
		isDark,
		bg,
		fg,
		inkSoft,
		inkMuted,
		rule,
		cardBg,
		cardBorder,
		link,
		accent,
		accentLight,
		lemmaBtnBg,
		lemmaBtnHover,
		lemmaBtnBorder,
		lookupBtnBg,
		lookupBtnHover,
		lookupBtnBorder,
		lookupBtnText
	};
}

export function getThemeLabel(v: number): string {
	if (v < 15) return 'Pure Light';
	if (v < 35) return 'Warm Light';
	if (v < 50) return 'Muted Light';
	if (v < 65) return 'Muted Dark';
	if (v < 85) return 'Deep Dark';
	return 'High Contrast Dark';
}

export interface ThemePreset {
	id: string;
	name: string;
	theme: number;
	warmth: number;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
	pureLight: { id: 'pureLight', name: 'Pure Light', theme: 0, warmth: 0 },
	parchment: { id: 'parchment', name: 'Parchment', theme: 20, warmth: 100 },
	neutralLight: { id: 'neutralLight', name: 'Soft Light', theme: 25, warmth: 50 },
	midnight: { id: 'midnight', name: 'Midnight', theme: 75, warmth: 50 }
};

export const PRESET_CYCLE_LIST: ThemePreset[] = [
	THEME_PRESETS.pureLight,
	THEME_PRESETS.midnight,
	THEME_PRESETS.parchment
];

/**
 * Returns the next preset in cyclic order from current slider values.
 */
export function getNextPreset(currentTheme: number, currentWarmth: number): ThemePreset {
	// Find if currently close to one of the presets
	const idx = PRESET_CYCLE_LIST.findIndex(
		(p) => Math.abs(p.theme - currentTheme) <= 15 && Math.abs(p.warmth - currentWarmth) <= 25
	);

	if (idx === -1) {
		// If custom value, toggle between day and night defaults
		return currentTheme >= 50 ? THEME_PRESETS.pureLight : THEME_PRESETS.midnight;
	}

	return PRESET_CYCLE_LIST[(idx + 1) % PRESET_CYCLE_LIST.length];
}
