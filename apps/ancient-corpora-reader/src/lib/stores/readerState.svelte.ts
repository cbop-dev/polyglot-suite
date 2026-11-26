import { SvelteSet } from 'svelte/reactivity';
import type { AncientCorpusId } from '@polyglot/ancient-languages';
import { replaceState,goto} from '$app/navigation';
import {resolve, } from '$app/paths';
import {
	getCorpusWorks,
	findWork,
	type CorpusWork
} from '../config/corpora.data.js';
import {
	getCorpusConfig,
	getApplicableTextVersions
} from '../config/corpora.js';
import type { CorpusConfig } from '@polyglot/ancient-languages/corpora-types';
import type { Token } from '../services/dbClient.js';

export type ViewMode = 'parallel' | 'greek' | 'english' | 'latin' | 'stacked' | 'single';

export class ReaderState {
	currentCorpus = $state<AncientCorpusId>('af');
	currentWorkCode = $state<string>('1CLE');
	currentDivision = $state<number>(1);
	currentSection = $state<string | number | null>(null);
	layoutIsOpen=$state<boolean>(false);
	//for toggling the slider panel.
	showThemeSlider=$state<boolean>(false);
	
	//whether we even use it at all.
	enableThemeslider=$state<boolean>(true);
	viewMode = $state<ViewMode>('parallel');

	// Reactive language/version visibility set
	visibleLanguages = $state<SvelteSet<string>>(new SvelteSet(['grc', 'lat', 'eng']));

	// Per-work column ordering (keyed by `${corpusId}:${workCode}`)
	columnOrdersByWork = $state<Record<string, string[]>>(ReaderState._loadColumnOrders());

	private static _loadColumnOrders(): Record<string, string[]> {
		if (typeof window === 'undefined' || !window.localStorage) return {};
		try {
			const raw = window.localStorage.getItem('acr-column-orders');
			return raw ? JSON.parse(raw) : {};
		} catch {
			return {};
		}
	}

	private _saveColumnOrders() {
		if (typeof window === 'undefined' || !window.localStorage) return;
		try {
			window.localStorage.setItem('acr-column-orders', JSON.stringify(this.columnOrdersByWork));
		} catch {
			// Ignore storage quota / private mode errors
		}
	}

	private _workOrderKey(): string {
		return `${this.currentCorpus}:${this.currentWorkCode}`;
	}

	get currentColumnOrder(): string[] {
		return this.columnOrdersByWork[this._workOrderKey()] ?? [];
	}


	toggleThemeSlider(){
		this.showThemeSlider = !this.showThemeSlider;
	}

	get currentCorpusConfig(): CorpusConfig {
		return getCorpusConfig(this.currentCorpus);
	}

	get currentApplicableVersions() {
		return getApplicableTextVersions(this.currentCorpus, this.currentWorkCode);
	}


	toggleLayoutModal(){
		this.layoutIsOpen=!this.layoutIsOpen;
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

	swapVersion(oldVersionId: string, newVersionId: string) {
		if (!newVersionId || oldVersionId === newVersionId) return;
		const cfg = this.currentCorpusConfig;
		// Normalize any language-level keys to explicit version IDs before swapping
		for (const v of cfg.textVersions) {
			if (this.visibleLanguages.has(v.language)) {
				this.visibleLanguages.delete(v.language);
				if (v.isDefaultVisible) {
					this.visibleLanguages.add(v.id);
				}
			}
		}
		this.visibleLanguages.delete(oldVersionId);
		this.visibleLanguages.add(newVersionId);

		// Preserve the swapped column's slot in per-work column ordering
		const key = this._workOrderKey();
		const order = this.columnOrdersByWork[key];
		if (order && order.includes(oldVersionId)) {
			this.columnOrdersByWork = {
				...this.columnOrdersByWork,
				[key]: order.map((id) => (id === oldVersionId ? newVersionId : id))
			};
			this._saveColumnOrders();
		}
	}

	moveColumn(versionId: string, direction: 'left' | 'right', activeVersionIds?: string[]) {
		const base =
			activeVersionIds && activeVersionIds.length > 0
				? [...activeVersionIds]
				: this.currentApplicableVersions
						.filter((v) => this.isLanguageVisible(v.id))
						.map((v) => v.id);
		const idx = base.indexOf(versionId);
		const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
		if (idx === -1 || targetIdx < 0 || targetIdx >= base.length) return;
		[base[idx], base[targetIdx]] = [base[targetIdx], base[idx]];
		const key = this._workOrderKey();
		this.columnOrdersByWork = { ...this.columnOrdersByWork, [key]: base };
		this._saveColumnOrders();
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
	hotkeysEnabled = $state<boolean>(true);

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

	closeAllModals() {
		this.closeSidePanel();
		this.isCorpusModalOpen = false;
		this.isWorkModalOpen = false;
		this.isDivisionModalOpen = false;
		this.showCitationModal = false;
		this.showHotkeyHelp = false;
		this.isCommandPaletteOpen = false;
		this.showThemeSlider=false;
	}

	private _applyDefaultVersions(corpusId: AncientCorpusId, workCode: string) {
		const cfg = getCorpusConfig(corpusId);
		const applicable = getApplicableTextVersions(corpusId, workCode);
		const defaultVersions = applicable
			.filter((v) => v.isDefaultVisible)
			.map((v) => v.id);
		this.setVisibleLanguages(
			defaultVersions.length > 0
				? Array.from(new Set(defaultVersions))
				: [applicable[0]?.id || cfg.textVersions[0]?.id || cfg.primaryLanguage]
		);
	}

	setCorpus(corpusId: AncientCorpusId, workCode?: string, division?: number, section?: string | number | null) {
		
		this.closeSidePanel();
		//goto(resolve('/')+corpusId);
		this.currentCorpus = corpusId;
		const works = getCorpusWorks(corpusId);
		const targetWork = workCode ? (findWork(corpusId, workCode) || works[0]) : works[0];
		this.currentWorkCode = targetWork.code;
		this._applyDefaultVersions(corpusId, targetWork.code);
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
			this._applyDefaultVersions(this.currentCorpus, target.code);
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
