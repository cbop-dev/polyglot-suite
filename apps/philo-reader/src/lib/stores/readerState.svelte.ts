import { CANONICAL_WORKS, WORKS_BY_CODE, type CanonicalWork } from '$lib/config/canonicalWorks.generated';
import type { Token } from '$lib/services/dbClient';

export interface CitationTarget {
	workCode: string;
	chapter: number;
	section?: number | null;
	mangeyRef?: string | null;
	isSupplement?: boolean;
}

export class ReaderState {
	currentWorkCode = $state<string>('OPIF');
	currentChapter = $state<number>(1);
	currentSection = $state<number | null>(null);
	showGreek = $state<boolean>(true);
	showEnglish = $state<boolean>(true);

	// Interactive lemma inspection modal
	selectedToken = $state<Token | null>(null);
	selectedCitation = $state<string | null>(null);

	// Unified Side Panel & Tabs ('lexeme' | 'search' | 'highlights')
	isSidePanelOpen = $state<boolean>(false);
	activeSidePanelTab = $state<'lexeme' | 'search' | 'highlights'>('search');

	get isSearchOpen(): boolean {
		return this.isSidePanelOpen && this.activeSidePanelTab === 'search';
	}
	set isSearchOpen(val: boolean) {
		if (val) {
			this.openSearchTab();
		} else if (this.activeSidePanelTab === 'search') {
			this.isSidePanelOpen = false;
		}
	}

	// Modals with search/filter
	isBookModalOpen = $state<boolean>(false);
	isChapterModalOpen = $state<boolean>(false);
	showHotkeyHelp = $state<boolean>(false);
	hotkeysEnabled = $state<boolean>(true);

	// Command palette jump modal
	isCommandPaletteOpen = $state<boolean>(false);

	// Academic citation modal
	citationTarget = $state<CitationTarget | null>(null);

	get currentWork(): CanonicalWork {
		return WORKS_BY_CODE[this.currentWorkCode] || CANONICAL_WORKS[0];
	}

	setWork(code: string, chapter: number = 1, section: number | null = null) {
		const target = WORKS_BY_CODE[code];
		if (target) {
			this.currentWorkCode = code;
			this.currentChapter = Math.min(Math.max(1, chapter), target.totalBooks);
			this.currentSection = section;
		}
	}

	setChapter(ch: number, section: number | null = null) {
		this.currentChapter = Math.min(Math.max(1, ch), this.currentWork.totalBooks);
		this.currentSection = section;
	}

	nextChapter() {
		if (this.currentChapter < this.currentWork.totalBooks) {
			this.currentChapter += 1;
			this.currentSection = null;
		} else {
			const currentIndex = CANONICAL_WORKS.findIndex((w) => w.code === this.currentWorkCode);
			if (currentIndex + 1 < CANONICAL_WORKS.length) {
				const nextWork = CANONICAL_WORKS[currentIndex + 1];
				this.currentWorkCode = nextWork.code;
				this.currentChapter = 1;
				this.currentSection = null;
			}
		}
	}

	prevChapter() {
		if (this.currentChapter > 1) {
			this.currentChapter -= 1;
			this.currentSection = null;
		} else {
			const currentIndex = CANONICAL_WORKS.findIndex((w) => w.code === this.currentWorkCode);
			if (currentIndex > 0) {
				const prevWork = CANONICAL_WORKS[currentIndex - 1];
				this.currentWorkCode = prevWork.code;
				this.currentChapter = prevWork.totalBooks;
				this.currentSection = null;
			}
		}
	}

	openLemma(token: Token, citation: string) {
		this.selectedToken = token;
		this.selectedCitation = citation;
		this.activeSidePanelTab = 'lexeme';
		this.isSidePanelOpen = true;
	}

	closeLemma() {
		this.selectedToken = null;
		this.selectedCitation = null;
	}

	openSearchTab() {
		this.activeSidePanelTab = 'search';
		this.isSidePanelOpen = true;
	}

	openHighlightsTab() {
		this.activeSidePanelTab = 'highlights';
		this.isSidePanelOpen = true;
	}

	toggleSidePanel() {
		this.isSidePanelOpen = !this.isSidePanelOpen;
	}

	toggleSearch() {
		if (this.isSidePanelOpen && this.activeSidePanelTab === 'search') {
			this.isSidePanelOpen = false;
		} else {
			this.openSearchTab();
		}
	}

	toggleCommandPalette() {
		this.isCommandPaletteOpen = !this.isCommandPaletteOpen;
	}

	openBookModal() {
		this.isBookModalOpen = true;
	}

	openChapterModal() {
		this.isChapterModalOpen = true;
	}

	toggleHotkeyHelp() {
		this.showHotkeyHelp = !this.showHotkeyHelp;
	}

	openCitation(
		workCode: string = this.currentWorkCode,
		chapter: number = this.currentChapter,
		section?: number | null,
		mangeyRef?: string | null,
		isSupplement: boolean = false
	) {
		this.citationTarget = { workCode, chapter, section, mangeyRef, isSupplement };
	}

	closeCitation() {
		this.citationTarget = null;
	}

	/**
	 * Closes any open modal, dialog, or drawer in priority order.
	 * Returns true if an overlay was closed, or false if nothing was open.
	 */
	closeAllPopups(): boolean {
		if (this.isBookModalOpen) {
			this.isBookModalOpen = false;
			return true;
		}
		if (this.isChapterModalOpen) {
			this.isChapterModalOpen = false;
			return true;
		}
		if (this.showHotkeyHelp) {
			this.showHotkeyHelp = false;
			return true;
		}
		if (this.isCommandPaletteOpen) {
			this.isCommandPaletteOpen = false;
			return true;
		}
		if (this.citationTarget) {
			this.closeCitation();
			return true;
		}
		if (this.selectedToken) {
			this.closeLemma();
			return true;
		}
		if (this.isSidePanelOpen) {
			this.isSidePanelOpen = false;
			return true;
		}
		return false;
	}
}

export const readerState = new ReaderState();
