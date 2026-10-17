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
		accentLight
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
