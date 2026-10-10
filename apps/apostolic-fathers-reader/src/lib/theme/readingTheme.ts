/**
 * Reading-theme engine with contrast-invariant piecewise interpolation.
 * Supports light to dark with smooth warmth/temperature control (cool slate, neutral solarized, warm sepia/parchment).
 */

// --- COOL PALETTE ---
const LIGHT_STOPS_COOL: [number, [number, number, number], [number, number, number]][] = [
	[0.00, [255, 255, 255], [26, 26, 26]],    // pure black on white
	[0.25, [240, 244, 248], [15, 23, 42]],    // cool slate-50
	[0.50, [226, 232, 240], [51, 65, 85]]     // cool slate-200
];
const DARK_STOPS_COOL: [number, [number, number, number], [number, number, number]][] = [
	[0.50, [15, 23, 42], [148, 163, 184]],    // deep slate
	[0.75, [9, 14, 25], [100, 116, 139]],     // darker slate
	[1.00, [0, 0, 5], [200, 210, 220]]        // pure black-blue
];

// --- NEUTRAL PALETTE (Solarized base) ---
const LIGHT_STOPS_NEUTRAL: [number, [number, number, number], [number, number, number]][] = [
	[0.00, [255, 255, 255], [26, 26, 26]],    // pure black on white
	[0.25, [253, 246, 227], [7, 54, 66]],     // Solarized base3 / base02 (parchment)
	[0.50, [238, 232, 213], [101, 123, 131]]  // Solarized base2 / base00 (soft light edge)
];
const DARK_STOPS_NEUTRAL: [number, [number, number, number], [number, number, number]][] = [
	[0.50, [7, 54, 66], [131, 148, 150]],     // Solarized base02 / base0 (soft dark edge)
	[0.75, [0, 43, 54], [147, 161, 161]],     // Solarized base03 / base1 (slate/midnight)
	[1.00, [0, 0, 0], [255, 255, 255]]        // pure white on black
];

// --- WARM PALETTE ---
const LIGHT_STOPS_WARM: [number, [number, number, number], [number, number, number]][] = [
	[0.00, [255, 250, 240], [40, 20, 10]],    // floral white
	[0.25, [245, 222, 179], [60, 30, 15]],    // wheat / sepia
	[0.50, [222, 184, 135], [90, 50, 30]]     // burlywood / dark sepia
];
const DARK_STOPS_WARM: [number, [number, number, number], [number, number, number]][] = [
	[0.50, [45, 35, 30], [180, 160, 140]],    // espresso
	[0.75, [25, 20, 15], [150, 130, 110]],    // deep mocha
	[1.00, [5, 0, 0], [220, 200, 180]]        // warm black
];

const LINK_LIGHT: [number, number, number] = [31, 77, 138];  // navy
const LINK_DARK: [number, number, number]  = [122, 176, 232]; // sky
const ACC_LIGHT: [number, number, number]  = [107, 52, 16];  // brick
const ACC_DARK: [number, number, number]   = [212, 165, 116]; // ochre

function lerp(a: number, b: number, t: number): number {
	return Math.round(a + (b - a) * t);
}

function lerpRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
	return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function rgbCss(c: [number, number, number]): string {
	return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function interpolateStops(stops: [number, [number, number, number], [number, number, number]][], t: number) {
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

export function colorAt(t: number, w: number = 0.5) {
	let stopsA, stopsB, blend;

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

export function getThemeLabel(v: number): string {
	if (v < 15) return 'Pure Light';
	if (v < 35) return 'Warm Light';
	if (v < 50) return 'Muted Light';
	if (v < 65) return 'Muted Dark';
	if (v < 85) return 'Deep Dark';
	return 'High Contrast Dark';
}

export const THEME_STORAGE_KEY = 'af_reading_theme';
export const WARMTH_STORAGE_KEY = 'af_reading_warmth';

export function applyReadingTheme(value: number, warmthValue: number = 50) {
	if (typeof document === 'undefined') return;

	const clamped = Math.max(0, Math.min(100, Math.round(value)));
	const clampedWarmth = Math.max(0, Math.min(100, Math.round(warmthValue)));
	const t = clamped / 100;
	const w = clampedWarmth / 100;
	const isDark = clamped >= 50;

	const { bg, fg } = colorAt(t, w);

	const inkSoft = lerpRgb(fg, bg, 0.35);
	const rule = lerpRgb(bg, fg, 0.12);
	const cardBg = isDark ? lerpRgb(bg, fg, 0.06) : lerpRgb(bg, fg, 0.025);
	const cardBorder = isDark ? lerpRgb(bg, fg, 0.14) : lerpRgb(bg, fg, 0.08);

	const link = lerpRgb(LINK_LIGHT, LINK_DARK, t);
	const accent = lerpRgb(ACC_LIGHT, ACC_DARK, t);

	const root = document.documentElement;

	root.setAttribute('data-theme', isDark ? 'dark' : 'light');
	if (isDark) {
		root.classList.add('dark');
	} else {
		root.classList.remove('dark');
	}
	root.style.colorScheme = isDark ? 'dark' : 'light';

	root.style.setProperty('--color-page', rgbCss(bg));
	root.style.setProperty('--color-ink', rgbCss(fg));
	root.style.setProperty('--color-ink-soft', rgbCss(inkSoft));
	root.style.setProperty('--color-rule', rgbCss(rule));
	root.style.setProperty('--color-link', rgbCss(link));
	root.style.setProperty('--color-accent', rgbCss(accent));
	root.style.setProperty('--color-card-bg', rgbCss(cardBg));
	root.style.setProperty('--color-card-border', rgbCss(cardBorder));
}

export function initReadingWarmth(): number {
	if (typeof window === 'undefined') return 50;
	try {
		const stored = localStorage.getItem(WARMTH_STORAGE_KEY);
		if (stored !== null) {
			const parsed = parseInt(stored, 10);
			if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
				return parsed;
			}
		}
		return 50;
	} catch {
		return 50;
	}
}

export function saveReadingWarmth(value: number) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(WARMTH_STORAGE_KEY, String(value));
	} catch {}
}

export function initReadingTheme(): number {
	if (typeof window === 'undefined') return 25;

	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		let themeVal = 25;
		if (stored !== null) {
			const parsed = parseInt(stored, 10);
			if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
				themeVal = parsed;
			}
		} else {
			const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
			themeVal = prefersDark ? 75 : 25;
		}

		applyReadingTheme(themeVal, initReadingWarmth());
		return themeVal;
	} catch {
		applyReadingTheme(25, 50);
		return 25;
	}
}

export function saveReadingTheme(value: number) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(THEME_STORAGE_KEY, String(value));
	} catch {}
}
