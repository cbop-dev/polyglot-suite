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

	it('switches corpus to Philo and updates active work/division', () => {
		const state = new ReaderState();
		state.setCorpus('philo');
		expect(state.currentCorpus).toBe('philo');
		expect(state.currentWorkCode).toBe('OPIF');
		expect(state.currentDivision).toBe(1);
		expect(state.showLatin).toBe(false); // Philo does not show Latin
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
});
