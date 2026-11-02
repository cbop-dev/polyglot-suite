import { CANONICAL_WORKS, getWork, type CanonicalWork } from '$lib/config/canonicalWorks.generated';
import type { Token } from '$lib/services/dbClient';

export interface CitationTarget {
	workCode: string;
	book: number;
	section?: string | number | null;
}

export class ReaderState {
	currentWorkCode = $state<string>('Antiquities');
	currentBook = $state<number>(1);
	currentSection = $state<string | number | null>(null);

	viewMode = $state<'parallel' | 'greek' | 'english' | 'stacked'>('parallel');

	get showGreek(): boolean {
		return this.viewMode === 'parallel' || this.viewMode === 'greek' || this.viewMode === 'stacked';
	}

	get showEnglish(): boolean {
		return this.viewMode === 'parallel' || this.viewMode === 'english' || this.viewMode === 'stacked';
	}

	// Interactive lemma inspection side panel
	selectedToken = $state<Token | null>(null);
	selectedCitation = $state<string | null>(null);

	// Unified Side Panel & Tabs ('lexeme' | 'search' | 'highlights')
	isSidePanelOpen = $state<boolean>(false);
	activeSidePanelTab = $state<'lexeme' | 'search' | 'highlights'>('lexeme');

	// Modals
	isBookModalOpen = $state<boolean>(false);
	isChapterModalOpen = $state<boolean>(false);
	showHotkeyHelp = $state<boolean>(false);
	isCommandPaletteOpen = $state<boolean>(false);
	showBookmarksModal = $state<boolean>(false);
	citationTarget = $state<CitationTarget | null>(null);

	get currentWork(): CanonicalWork {
		return getWork(this.currentWorkCode) || CANONICAL_WORKS[0];
	}

	setWork(code: string, book: number = 1, section: string | number | null = null) {
		const target = getWork(code);
		if (target) {
			this.currentWorkCode = target.code;
			this.currentBook = Math.min(Math.max(1, book), target.totalBooks);
			this.currentSection = section;
		}
	}

	setBook(book: number, section: string | number | null = null) {
		this.currentBook = Math.min(Math.max(1, book), this.currentWork.totalBooks);
		this.currentSection = section;
	}

	nextBook() {
		if (this.currentBook < this.currentWork.totalBooks) {
			this.currentBook += 1;
			this.currentSection = null;
		}
	}

	prevBook() {
		if (this.currentBook > 1) {
			this.currentBook -= 1;
			this.currentSection = null;
		}
	}

	openToken(token: Token, citation: string) {
		this.selectedToken = token;
		this.selectedCitation = citation;
		this.activeSidePanelTab = 'lexeme';
		this.isSidePanelOpen = true;
	}

	toggleSearch(tab: 'lexeme' | 'search' | 'highlights' = 'search') {
		if (this.isSidePanelOpen && this.activeSidePanelTab === tab) {
			this.isSidePanelOpen = false;
		} else {
			this.closeAllModals();
			this.activeSidePanelTab = tab;
			this.isSidePanelOpen = true;
		}
	}

	openBookModal() {
		this.closeAllModals();
		this.isBookModalOpen = true;
	}

	openChapterModal() {
		this.closeAllModals();
		this.isChapterModalOpen = true;
	}

	openCommandPalette() {
		this.closeAllModals();
		this.isCommandPaletteOpen = true;
	}

	openHotkeyHelp() {
		this.closeAllModals();
		this.showHotkeyHelp = true;
	}

	openBookmarksModal() {
		this.closeAllModals();
		this.showBookmarksModal = true;
	}

	openCitation(workCode: string, book: number, section: string | number) {
		this.citationTarget = { workCode, book, section };
	}

	closeAllModals() {
		this.isBookModalOpen = false;
		this.isChapterModalOpen = false;
		this.isCommandPaletteOpen = false;
		this.showHotkeyHelp = false;
		this.showBookmarksModal = false;
		this.citationTarget = null;
		this.isSidePanelOpen = false;
	}
}

export const readerState = new ReaderState();
