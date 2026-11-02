import type { AncientCorpusId } from '@polyglot/ancient-languages';
import {
	getCorpusWorks,
	findWork,
	type UnifiedCanonicalWork
} from '../config/canonicalWorks.js';
import type { Token } from '../services/dbClient.js';

export type ViewMode = 'parallel' | 'greek' | 'english' | 'latin' | 'stacked';

export class ReaderState {
	currentCorpus = $state<AncientCorpusId>('af');
	currentWorkCode = $state<string>('1CLE');
	currentDivision = $state<number>(1);
	currentSection = $state<string | number | null>(null);

	viewMode = $state<ViewMode>('parallel');

	get showGreek(): boolean {
		return this.viewMode === 'parallel' || this.viewMode === 'greek' || this.viewMode === 'stacked';
	}

	get showEnglish(): boolean {
		return this.viewMode === 'parallel' || this.viewMode === 'english' || this.viewMode === 'stacked';
	}

	get showLatin(): boolean {
		return this.currentCorpus === 'af' && (this.viewMode === 'parallel' || this.viewMode === 'latin' || this.viewMode === 'stacked');
	}

	// Lexeme side panel inspection
	selectedToken = $state<Token | null>(null);
	selectedCitation = $state<string | null>(null);
	isSidePanelOpen = $state<boolean>(false);
	activeSidePanelTab = $state<string>('lexeme');

	// Modals
	isWorkModalOpen = $state<boolean>(false);
	isDivisionModalOpen = $state<boolean>(false);
	showHotkeyHelp = $state<boolean>(false);
	isCommandPaletteOpen = $state<boolean>(false);
	showCitationModal = $state<boolean>(false);

	get currentWork(): UnifiedCanonicalWork {
		const target = findWork(this.currentCorpus, this.currentWorkCode);
		if (target) return target;
		const fallback = getCorpusWorks(this.currentCorpus)[0];
		return fallback;
	}

	setCorpus(corpusId: AncientCorpusId, workCode?: string, division?: number, section?: string | number | null) {
		this.currentCorpus = corpusId;
		const works = getCorpusWorks(corpusId);
		const targetWork = workCode ? (findWork(corpusId, workCode) || works[0]) : works[0];
		this.currentWorkCode = targetWork.code;
		this.currentDivision = division !== undefined
			? Math.max(targetWork.minDivision, Math.min(division, targetWork.totalDivisions))
			: targetWork.minDivision;
		this.currentSection = section ?? null;
	}

	setWork(workCode: string, division?: number, section?: string | number | null) {
		const target = findWork(this.currentCorpus, workCode);
		if (target) {
			this.currentWorkCode = target.code;
			this.currentDivision = division !== undefined
				? Math.max(target.minDivision, Math.min(division, target.totalDivisions))
				: target.minDivision;
			this.currentSection = section ?? null;
		}
	}

	setDivision(division: number, section?: string | number | null) {
		const work = this.currentWork;
		this.currentDivision = Math.max(work.minDivision, Math.min(division, work.totalDivisions));
		this.currentSection = section ?? null;
	}

	nextDivision() {
		const work = this.currentWork;
		if (this.currentDivision < work.totalDivisions) {
			this.currentDivision += 1;
			this.currentSection = null;
		}
	}

	prevDivision() {
		const work = this.currentWork;
		if (this.currentDivision > work.minDivision) {
			this.currentDivision -= 1;
			this.currentSection = null;
		}
	}

	openToken(token: Token, citation: string) {
		this.selectedToken = token;
		this.selectedCitation = citation;
		this.activeSidePanelTab = 'lexeme';
		this.isSidePanelOpen = true;
	}

	toggleSidePanel(tab: string = 'lexeme') {
		if (this.isSidePanelOpen && this.activeSidePanelTab === tab) {
			this.isSidePanelOpen = false;
		} else {
			this.activeSidePanelTab = tab;
			this.isSidePanelOpen = true;
		}
	}
}

export const readerState = new ReaderState();
