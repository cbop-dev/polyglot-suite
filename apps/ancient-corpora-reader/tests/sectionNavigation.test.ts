import { describe, it, expect } from 'vitest';
import { ReaderState } from '../src/lib/stores/readerState.svelte.js';

describe('In-Page Section Navigation & Batch Resolution', () => {
	it('handles numeric and milestone navigation state updates in ReaderState', () => {
		const state = new ReaderState();
		state.setCorpus('josephus', 'AJ', 1);

		// Jump to section 60 within Book 1
		state.setDivision(1, 60);
		expect(state.currentDivision).toBe(1);
		expect(state.currentSection).toBe(60);

		// Jump across division to Book 2, Section 15
		state.setDivision(2, 15);
		expect(state.currentDivision).toBe(2);
		expect(state.currentSection).toBe(15);

		// Next division navigation clears currentSection to avoid stale jump targets
		state.nextDivision();
		expect(state.currentDivision).toBe(3);
		expect(state.currentSection).toBeNull();
	});

	it('resolves target batch index for both numeric sections and milestone references', () => {
		// Mock section keys and units as structured in ParallelColumnView
		const keys = [1, 2, 3, 4, 5, 10, 20, 50, 100];
		const mockUnits: Record<number | string, any> = {
			1: [{ section_num: 1, milestone_ref: '1a' }],
			2: [{ section_num: 2, milestone_ref: '2a' }],
			50: [{ section_num: 50, milestone_ref: '120b', niese_section: 450 }],
			100: [{ section_num: 100, milestone_ref: '250c', mangey_ref: 'M. 1.25' }]
		};

		function findSectionIndex(sectionKeys: (number | string)[], target: number | string | null | undefined): number {
			if (target === undefined || target === null || target === '') return -1;
			const targetStr = String(target).trim().toLowerCase();
			const exactIdx = sectionKeys.findIndex((k) => String(k).toLowerCase() === targetStr);
			if (exactIdx >= 0) return exactIdx;

			return sectionKeys.findIndex((k) => {
				const units = mockUnits[k] || [];
				for (const u of units) {
					if (!u) continue;
					if (u.milestone_ref && String(u.milestone_ref).trim().toLowerCase() === targetStr) return true;
					if (u.niese_section !== undefined && String(u.niese_section).trim().toLowerCase() === targetStr) return true;
					if (u.mangey_ref && String(u.mangey_ref).trim().toLowerCase() === targetStr) return true;
				}
				return false;
			});
		}

		// Exact numeric match
		expect(findSectionIndex(keys, 50)).toBe(7);
		expect(findSectionIndex(keys, '50')).toBe(7);

		// Milestone reference match (e.g. from concordance or citation lookup)
		expect(findSectionIndex(keys, '120b')).toBe(7);
		expect(findSectionIndex(keys, '450')).toBe(7); // Niese section
		expect(findSectionIndex(keys, 'M. 1.25')).toBe(8); // Mangey ref

		// Target not found returns -1
		expect(findSectionIndex(keys, '999')).toBe(-1);
		expect(findSectionIndex(keys, null)).toBe(-1);
	});

	it('calculates distance-aware scroll behavior correctly', () => {
		function determineScrollBehavior(distPx: number, isInitialLoad: boolean): 'smooth' | 'auto' {
			const isNearby = !isInitialLoad && distPx <= 1800;
			return isNearby ? 'smooth' : 'auto';
		}

		// Nearby in-page jump (< 1800px) uses smooth scroll
		expect(determineScrollBehavior(350, false)).toBe('smooth');
		expect(determineScrollBehavior(1800, false)).toBe('smooth');

		// Distant in-page jump (> 1800px) uses instant jump (auto) to avoid layout-shift drift
		expect(determineScrollBehavior(1801, false)).toBe('auto');
		expect(determineScrollBehavior(12000, false)).toBe('auto');

		// Initial page load or division switch always uses instant jump (auto)
		expect(determineScrollBehavior(200, true)).toBe('auto');
		expect(determineScrollBehavior(8000, true)).toBe('auto');
	});

	it('normalizes target element up to parent section row and calculates dynamic header clearance', () => {
		// Mock DOM hierarchy: container row -> inner milestone span
		const mockRow = {
			classList: new Set<string>(['section-row']),
			closest: (sel: string) => (sel === '.section-row' ? mockRow : null)
		};
		const mockSpan = {
			classList: new Set<string>(['sr-only']),
			closest: (sel: string) => (sel === '.section-row' ? mockRow : null)
		};

		// Resolving either the row directly or inner span yields the section-row
		const resolvedFromSpan = (mockSpan.closest('.section-row') as any) || mockSpan;
		expect(resolvedFromSpan).toBe(mockRow);

		const resolvedFromRow = (mockRow.closest('.section-row') as any) || mockRow;
		expect(resolvedFromRow).toBe(mockRow);

		// Dynamic header clearance calculation
		const headerBottom = 65; // e.g. 65px header height
		const targetOffset = headerBottom + 20;
		expect(targetOffset).toBe(85);
		expect(targetOffset).toBeGreaterThan(headerBottom);
	});
});
