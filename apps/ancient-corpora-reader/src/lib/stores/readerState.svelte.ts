import { SvelteSet } from 'svelte/reactivity';
import type { AncientCorpusId } from '@polyglot/ancient-languages';
import {
	getCorpusWorks,
	findWork,
	type CorpusWork
} from '../config/corpora.data.js';
import {
	getCorpusConfig,
	type CorpusConfig
} from '../config/corpora.js';
import type { Token } from '../services/dbClient.js';

export type ViewMode = 'parallel' | 'greek' | 'english' | 'latin' | 'stacked' | 'single';

export class ReaderState {
	currentCorpus = $state<AncientCorpusId>('af');
	currentWorkCode = $state<string>('1CLE');
	currentDivision = $state<number>(1);
	currentSection = $state<string | number | null>(null);

	viewMode = $state<ViewMode>('parallel');

	// Reactive language/version visibility set
	visibleLanguages = $state<SvelteSet<string>>(new SvelteSet(['grc', 'lat', 'eng']));

	get currentCorpusConfig(): CorpusConfig {
		return getCorpusConfig(this.currentCorpus);
	}

	isLanguageVisible(langOrVersion: string): boolean {
		if (this.visibleLanguages.has(langOrVersion)) return true;
		const cfg = this.currentCorpusConfig;
		const version = cfg.textVersions.find((v) => v.id === langOrVersion);
		if (version && this.visibleLanguages.has(version.language)) return true;
		for (const v of cfg.textVersions) {
			if (v.language === langOrVersion && this.visibleLanguages.has(v.id)) return true;
		}
		return false;
	}

	toggleLanguage(langOrVersion: string) {
		if (this.visibleLanguages.has(langOrVersion)) {
			if (this.visibleLanguages.size > 1) {
				this.visibleLanguages.delete(langOrVersion);
			}
		} else {
			this.visibleLanguages.add(langOrVersion);
		}
	}

	setVisibleLanguages(languages: string[]) {
		this.visibleLanguages.clear();
		for (const l of languages) {
			this.visibleLanguages.add(l);
		}
	}

	// Backwards-compatibility bridge for Phase 3 components:
	get showGreek(): boolean {
		if (this.viewMode === 'greek') return true;
		if (this.viewMode === 'english' || this.viewMode === 'latin') return false;
		return this.isLanguageVisible('grc');
	}

	get showEnglish(): boolean {
		if (this.viewMode === 'english') return true;
		if (this.viewMode === 'greek' || this.viewMode === 'latin') return false;
		return this.isLanguageVisible('eng');
	}

	get showLatin(): boolean {
		if (this.viewMode === 'latin') return true;
		if (this.viewMode === 'greek' || this.viewMode === 'english') return false;
		return this.isLanguageVisible('lat');
	}

	// Lexeme side panel inspection
	selectedToken = $state<Token | null>(null);
	selectedCitation = $state<string | null>(null);
	selectedScriptureCitation = $state<{
		bookCode?: string;
		chapter?: number;
		verse?: number;
		display?: string;
		bookName?: string;
	} | null>(null);
	isSidePanelOpen = $state<boolean>(false);
	activeSidePanelTab = $state<string>('lexeme');

	// Modals
	isCorpusModalOpen = $state<boolean>(false);
	isWorkModalOpen = $state<boolean>(false);
	isDivisionModalOpen = $state<boolean>(false);
	showHotkeyHelp = $state<boolean>(false);
	isCommandPaletteOpen = $state<boolean>(false);
	showCitationModal = $state<boolean>(false);

	get currentWork(): CorpusWork {
		const target = findWork(this.currentCorpus, this.currentWorkCode);
		if (target) return target;
		const fallback = getCorpusWorks(this.currentCorpus)[0];
		return fallback;
	}

	closeSidePanel() {
		this.isSidePanelOpen = false;
		this.selectedToken = null;
		this.selectedCitation = null;
		this.selectedScriptureCitation = null;
	}

	setCorpus(corpusId: AncientCorpusId, workCode?: string, division?: number, section?: string | number | null) {
		this.closeSidePanel();
		this.currentCorpus = corpusId;
		const cfg = getCorpusConfig(corpusId);
		const defaultLangs = cfg.textVersions
			.filter((v) => v.isDefaultVisible)
			.map((v) => v.language);
		this.setVisibleLanguages(defaultLangs.length > 0 ? Array.from(new Set(defaultLangs)) : [cfg.primaryLanguage]);

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
			this.closeSidePanel();
			this.currentWorkCode = target.code;
			this.currentDivision = division !== undefined
				? Math.max(target.minDivision, Math.min(division, target.totalDivisions))
				: target.minDivision;
			this.currentSection = section ?? null;
		}
	}

	setDivision(division: number, section?: string | number | null) {
		this.closeSidePanel();
		const work = this.currentWork;
		this.currentDivision = Math.max(work.minDivision, Math.min(division, work.totalDivisions));
		this.currentSection = section ?? null;
	}

	nextDivision() {
		const work = this.currentWork;
		if (this.currentDivision < work.totalDivisions) {
			this.closeSidePanel();
			this.currentDivision += 1;
			this.currentSection = null;
		}
	}

	prevDivision() {
		const work = this.currentWork;
		if (this.currentDivision > work.minDivision) {
			this.closeSidePanel();
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

	openScriptureCitation(
		bookCode?: string,
		chapter?: number,
		verse?: number,
		display?: string,
		bookName?: string
	) {
		this.selectedScriptureCitation = { bookCode, chapter, verse, display, bookName };
		this.activeSidePanelTab = 'scripture';
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
