import { describe, it, expect } from 'vitest';
import { ReaderState } from '../src/lib/stores/readerState.svelte.js';

describe('ReaderState Store', () => {
	it('initializes with default Apostolic Fathers settings', () => {
		const state = new ReaderState();
		expect(state.currentCorpus).toBe('af');
		expect(state.currentWorkCode).toBe('1CLE');
		expect(state.currentDivision).toBe(1);
		expect(state.viewMode).toBe('parallel');
		expect(state.showGreek).toBe(true);
		expect(state.showEnglish).toBe(true);
		expect(state.showLatin).toBe(true); // AF supports Latin where extant
	});

	it('supports switching viewMode between parallel, stacked, greek, and english', () => {
		const state = new ReaderState();
		state.viewMode = 'stacked';
		expect(state.viewMode).toBe('stacked');
		expect(state.showGreek).toBe(true);
		expect(state.showEnglish).toBe(true);

		state.viewMode = 'greek';
		expect(state.showGreek).toBe(true);
		expect(state.showEnglish).toBe(false);

		state.viewMode = 'english';
		expect(state.showGreek).toBe(false);
		expect(state.showEnglish).toBe(true);

		state.viewMode = 'parallel';
		expect(state.showGreek).toBe(true);
		expect(state.showEnglish).toBe(true);
	});

	it('switches corpus to Philo and updates active work/division', () => {
		const state = new ReaderState();
		state.setCorpus('philo');
		expect(state.currentCorpus).toBe('philo');
		expect(state.currentWorkCode).toBe('OPIF');
		expect(state.currentDivision).toBe(1);
		expect(state.showLatin).toBe(false); // Philo does not show Latin
	});

	it('manages reactive visibleLanguages dynamically and prevents removing the last visible language', () => {
		const state = new ReaderState();
		// Initial AF state has grc, lat, eng
		expect(state.isLanguageVisible('grc')).toBe(true);
		expect(state.isLanguageVisible('eng')).toBe(true);
		expect(state.isLanguageVisible('lat')).toBe(true);

		// Toggle off Latin
		state.toggleLanguage('lat');
		expect(state.isLanguageVisible('lat')).toBe(false);

		// Toggle off English
		state.toggleLanguage('eng');
		expect(state.isLanguageVisible('eng')).toBe(false);
		expect(state.isLanguageVisible('grc')).toBe(true);

		// Toggling off the last language ('grc') should NOT remove it
		state.toggleLanguage('grc');
		expect(state.isLanguageVisible('grc')).toBe(true);
		expect(state.visibleLanguages.size).toBe(1);

		// Toggle English back on
		state.toggleLanguage('eng');
		expect(state.isLanguageVisible('eng')).toBe(true);
		expect(state.visibleLanguages.size).toBe(2);

		// setVisibleLanguages explicitly
		state.setVisibleLanguages(['grc']);
		expect(state.isLanguageVisible('grc')).toBe(true);
		expect(state.isLanguageVisible('eng')).toBe(false);
	});

	it('updates visibleLanguages automatically when switching corpus to Philo or Josephus', () => {
		const state = new ReaderState();
		expect(state.currentCorpusConfig.id).toBe('af');
		expect(state.isLanguageVisible('lat')).toBe(true);

		// Switch to Philo: defaults to grc, eng
		state.setCorpus('philo');
		expect(state.currentCorpusConfig.id).toBe('philo');
		expect(state.isLanguageVisible('grc')).toBe(true);
		expect(state.isLanguageVisible('eng')).toBe(true);
		expect(state.isLanguageVisible('lat')).toBe(false);

		// Switch to Josephus: defaults to grc, eng
		state.setCorpus('josephus');
		expect(state.currentCorpusConfig.id).toBe('josephus');
		expect(state.isLanguageVisible('grc')).toBe(true);
		expect(state.isLanguageVisible('eng')).toBe(true);
	});

	it('switches corpus to Josephus and clamps division to totalBooks', () => {
		const state = new ReaderState();
		state.setCorpus('josephus', 'War', 5);
		expect(state.currentCorpus).toBe('josephus');
		expect(state.currentWorkCode).toBe('War');
		expect(state.currentDivision).toBe(5);

		// War has 7 books; setDivision(100) should clamp to 7
		state.setDivision(100);
		expect(state.currentDivision).toBe(7);

		// setDivision(-5) should clamp to 1
		state.setDivision(-5);
		expect(state.currentDivision).toBe(1);
	});

	it('supports nextDivision and prevDivision stepping', () => {
		const state = new ReaderState();
		state.setCorpus('af', '1CLE', 1);

		state.nextDivision();
		expect(state.currentDivision).toBe(2);

		state.prevDivision();
		expect(state.currentDivision).toBe(1);

		// Should not step below minDivision (0 for 1CLE)
		state.setDivision(0);
		state.prevDivision();
		expect(state.currentDivision).toBe(0);
	});

	it('opens token and configures lexeme side panel', () => {
		const state = new ReaderState();
		expect(state.isSidePanelOpen).toBe(false);

		state.openToken({ w: 'λόγος', l: 'λόγος', m: 'N-NSM', p: 'N', lang: 'grc' }, '1 Clem. 1:1');
		expect(state.isSidePanelOpen).toBe(true);
		expect(state.activeSidePanelTab).toBe('lexeme');
		expect(state.selectedToken?.w).toBe('λόγος');
		expect(state.selectedCitation).toBe('1 Clem. 1:1');
	});

	it('toggles side panel and search tabs', () => {
		const state = new ReaderState();
		state.toggleSidePanel('search');
		expect(state.isSidePanelOpen).toBe(true);
		expect(state.activeSidePanelTab).toBe('search');

		// Calling toggle again with same tab closes it
		state.toggleSidePanel('search');
		expect(state.isSidePanelOpen).toBe(false);
	});

	it('supports book and section jump navigation across corpora', () => {
		const state = new ReaderState();
		state.setCorpus('josephus', 'Antiquities', 1);

		// Jump to Book 3, Section 110
		state.setDivision(3, 110);
		expect(state.currentDivision).toBe(3);
		expect(state.currentSection).toBe(110);

		// Jump to Section 45 within current book
		state.setDivision(3, 45);
		expect(state.currentDivision).toBe(3);
		expect(state.currentSection).toBe(45);

		// Philo multi-book treatise
		state.setCorpus('philo', 'LEG', 1);
		state.setDivision(2, 50);
		expect(state.currentDivision).toBe(2);
		expect(state.currentSection).toBe(50);
	});

	it('closes side panel and resets token when switching corpus, work, or division', () => {
		const state = new ReaderState();
		state.openToken({ w: 'λόγος', l: 'λόγος', m: 'N-NSM', p: 'N', lang: 'grc' }, '1 Clem. 1:1');
		expect(state.isSidePanelOpen).toBe(true);
		expect(state.selectedToken).not.toBeNull();

		// Switching division closes side panel
		state.setDivision(2);
		expect(state.isSidePanelOpen).toBe(false);
		expect(state.selectedToken).toBeNull();

		// Re-open token and switch via nextDivision
		state.openToken({ w: 'λόγος', l: 'λόγος', m: 'N-NSM', p: 'N', lang: 'grc' }, '1 Clem. 2:1');
		expect(state.isSidePanelOpen).toBe(true);
		state.nextDivision();
		expect(state.isSidePanelOpen).toBe(false);
		expect(state.selectedToken).toBeNull();

		// Re-open token and switch via prevDivision
		state.openToken({ w: 'λόγος', l: 'λόγος', m: 'N-NSM', p: 'N', lang: 'grc' }, '1 Clem. 3:1');
		expect(state.isSidePanelOpen).toBe(true);
		state.prevDivision();
		expect(state.isSidePanelOpen).toBe(false);
		expect(state.selectedToken).toBeNull();

		// Re-open token and switch work
		state.openToken({ w: 'λόγος', l: 'λόγος', m: 'N-NSM', p: 'N', lang: 'grc' }, '1 Clem. 2:1');
		expect(state.isSidePanelOpen).toBe(true);
		state.setWork('2CLE');
		expect(state.isSidePanelOpen).toBe(false);
		expect(state.selectedToken).toBeNull();

		// Re-open token and switch corpus
		state.openToken({ w: 'λόγος', l: 'λόγος', m: 'N-NSM', p: 'N', lang: 'grc' }, '2 Clem. 1:1');
		expect(state.isSidePanelOpen).toBe(true);
		state.setCorpus('philo');
		expect(state.isSidePanelOpen).toBe(false);
		expect(state.selectedToken).toBeNull();
	});
});
