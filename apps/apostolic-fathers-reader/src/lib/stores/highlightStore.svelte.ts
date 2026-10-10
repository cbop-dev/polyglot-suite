const PALETTE = [
	{ name: 'amber', bg: '#fef3c7', text: '#92400e', darkBg: '#78350f', darkText: '#fde68a' },
	{ name: 'emerald', bg: '#d1fae5', text: '#065f46', darkBg: '#064e3b', darkText: '#a7f3d0' },
	{ name: 'cyan', bg: '#cffafe', text: '#155e75', darkBg: '#164e63', darkText: '#a5f3fc' },
	{ name: 'purple', bg: '#f3e8ff', text: '#6b21a8', darkBg: '#581c87', darkText: '#e9d5ff' },
	{ name: 'rose', bg: '#ffe4e6', text: '#9f1239', darkBg: '#881337', darkText: '#fecdd3' }
];

class HighlightStore {
	highlights = $state<Record<string, number>>({});

	constructor() {
		if (typeof window !== 'undefined') {
			try {
				const saved = localStorage.getItem('af_highlighted_lemmas');
				if (saved) {
					this.highlights = JSON.parse(saved);
				}
			} catch (e) {
				console.warn('Failed to load highlights from localStorage', e);
			}
		}
	}

	toggle(lemma: string) {
		if (!lemma) return;
		if (lemma in this.highlights) {
			delete this.highlights[lemma];
		} else {
			this.highlights[lemma] = 0;
		}
		this.save();
	}

	isHighlighted(lemma: string): boolean {
		return Boolean(lemma && lemma in this.highlights);
	}

	remove(lemma: string) {
		if (lemma in this.highlights) {
			delete this.highlights[lemma];
			this.save();
		}
	}

	clear() {
		this.highlights = {};
		this.save();
	}

	get(lemma: string) {
		if (!lemma || !(lemma in this.highlights)) return null;
		const idx = this.highlights[lemma];
		return PALETTE[idx] || PALETTE[0];
	}

	private save() {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem('af_highlighted_lemmas', JSON.stringify(this.highlights));
			} catch (e) {}
		}
	}
}

export const highlightStore = new HighlightStore();
