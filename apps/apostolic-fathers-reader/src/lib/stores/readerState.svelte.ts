import { CANONICAL_WORKS, WORKS_BY_CODE, type CanonicalWork } from '$lib/config/canonicalWorks.generated';
import type { Token } from '$lib/services/dbClient';

class ReaderState {
	currentWorkCode = $state<string>('1CLE');
	currentChapter = $state<number>(1);
	showGreek = $state<boolean>(true);
	showEnglish = $state<boolean>(true);
	showLatin = $state<boolean>(true);

	// Interactive lemma inspection modal
	selectedToken = $state<Token | null>(null);
	selectedCitation = $state<string | null>(null);

	// Quick search panel
	isSearchOpen = $state<boolean>(false);

	get currentWork(): CanonicalWork {
		return WORKS_BY_CODE[this.currentWorkCode] || CANONICAL_WORKS[0];
	}

	setWork(code: string, chapter: number = 1) {
		if (WORKS_BY_CODE[code]) {
			this.currentWorkCode = code;
			this.currentChapter = Math.min(Math.max(1, chapter), this.currentWork.totalChapters);
		}
	}

	setChapter(ch: number) {
		this.currentChapter = Math.min(Math.max(1, ch), this.currentWork.totalChapters);
	}

	nextChapter() {
		if (this.currentChapter < this.currentWork.totalChapters) {
			this.currentChapter += 1;
		} else {
			const currentIndex = CANONICAL_WORKS.findIndex((w) => w.code === this.currentWorkCode);
			if (currentIndex + 1 < CANONICAL_WORKS.length) {
				const nextWork = CANONICAL_WORKS[currentIndex + 1];
				this.currentWorkCode = nextWork.code;
				this.currentChapter = 1;
			}
		}
	}

	prevChapter() {
		if (this.currentChapter > 1) {
			this.currentChapter -= 1;
		} else {
			const currentIndex = CANONICAL_WORKS.findIndex((w) => w.code === this.currentWorkCode);
			if (currentIndex > 0) {
				const prevWork = CANONICAL_WORKS[currentIndex - 1];
				this.currentWorkCode = prevWork.code;
				this.currentChapter = prevWork.totalChapters;
			}
		}
	}

	openLemma(token: Token, citation: string) {
		this.selectedToken = token;
		this.selectedCitation = citation;
	}

	closeLemma() {
		this.selectedToken = null;
		this.selectedCitation = null;
	}

	toggleSearch() {
		this.isSearchOpen = !this.isSearchOpen;
	}
}

export const readerState = new ReaderState();
