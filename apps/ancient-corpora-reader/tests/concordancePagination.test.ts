import { describe, it, expect, vi } from 'vitest';

export function calculatePaginationPills(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
	if (totalPages <= 1) return [];
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}

	const pages = new Set<number>();
	pages.add(1);
	pages.add(totalPages);

	for (let offset = -2; offset <= 2; offset++) {
		const p = currentPage + offset;
		if (p >= 1 && p <= totalPages) {
			pages.add(p);
		}
	}

	const sorted = Array.from(pages).sort((a, b) => a - b);
	const items: (number | 'ellipsis')[] = [];

	for (let i = 0; i < sorted.length; i++) {
		if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
			items.push('ellipsis');
		}
		items.push(sorted[i]);
	}

	return items;
}

export class ConcordancePageManager {
	currentPage = 1;
	pageSize = 50;
	totalCount = 0;
	cache = new Map<number, any[]>();
	fetcher: (offset: number, size: number) => Promise<{ refs: any[]; totalCount: number }>;

	constructor(fetcher: (offset: number, size: number) => Promise<{ refs: any[]; totalCount: number }>, pageSize = 50) {
		this.fetcher = fetcher;
		this.pageSize = pageSize;
	}

	get totalPages(): number {
		return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
	}

	get startIdx(): number {
		return this.totalCount === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
	}

	get endIdx(): number {
		return Math.min(this.currentPage * this.pageSize, this.totalCount);
	}

	async loadInitial(): Promise<any[]> {
		this.cache.clear();
		this.currentPage = 1;
		const res = await this.fetcher(0, this.pageSize);
		this.cache.set(1, res.refs);
		this.totalCount = res.totalCount;
		this.currentPage = 1;
		this.prefetchNext(1);
		return res.refs;
	}

	prefetchNext(page: number): void {
		const next = page + 1;
		if (this.totalCount > 0 && next > this.totalPages) return;
		if (this.cache.has(next)) return;

		const offset = (next - 1) * this.pageSize;
		this.fetcher(offset, this.pageSize)
			.then((res) => {
				this.cache.set(next, res.refs);
			})
			.catch(() => {});
	}

	async goToPage(page: number): Promise<any[]> {
		if (page < 1 || (this.totalCount > 0 && page > this.totalPages)) {
			return this.cache.get(this.currentPage) || [];
		}

		if (this.cache.has(page)) {
			this.currentPage = page;
			this.prefetchNext(page);
			return this.cache.get(page)!;
		}

		const offset = (page - 1) * this.pageSize;
		const res = await this.fetcher(offset, this.pageSize);
		this.cache.set(page, res.refs);
		this.totalCount = res.totalCount;
		this.currentPage = page;
		this.prefetchNext(page);
		return res.refs;
	}
}

describe('Concordance Pagination & Pre-fetching Logic', () => {
	describe('calculatePaginationPills', () => {
		it('returns empty array when total pages is 1', () => {
			expect(calculatePaginationPills(1, 1)).toEqual([]);
		});

		it('returns all page numbers when total pages <= 7', () => {
			expect(calculatePaginationPills(1, 5)).toEqual([1, 2, 3, 4, 5]);
			expect(calculatePaginationPills(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		});

		it('formats nearby pills and ellipsis correctly at the beginning of list', () => {
			const pills = calculatePaginationPills(1, 12);
			expect(pills).toEqual([1, 2, 3, 'ellipsis', 12]);
		});

		it('formats nearby pills and ellipsis on both sides in the middle of list', () => {
			const pills = calculatePaginationPills(6, 12);
			expect(pills).toEqual([1, 'ellipsis', 4, 5, 6, 7, 8, 'ellipsis', 12]);
		});

		it('formats nearby pills and ellipsis at the end of list', () => {
			const pills = calculatePaginationPills(12, 12);
			expect(pills).toEqual([1, 'ellipsis', 10, 11, 12]);
		});
	});

	describe('ConcordancePageManager', () => {
		it('calculates page boundaries and indices correctly', async () => {
			const mockFetcher = vi.fn().mockImplementation(async (offset: number, size: number) => {
				const total = 135;
				const count = Math.min(size, Math.max(0, total - offset));
				return {
					refs: Array.from({ length: count }, (_, i) => ({ id: offset + i })),
					totalCount: total
				};
			});

			const mgr = new ConcordancePageManager(mockFetcher, 50);
			const p1 = await mgr.loadInitial();

			expect(p1.length).toBe(50);
			expect(mgr.currentPage).toBe(1);
			expect(mgr.totalPages).toBe(3);
			expect(mgr.startIdx).toBe(1);
			expect(mgr.endIdx).toBe(50);

			// Pre-fetch for page 2 should have been triggered
			await Promise.resolve(); // flush microtasks
			expect(mgr.cache.has(2)).toBe(true);

			// Navigate to page 2: should hit cache without calling fetcher again for page 2
			const callCountBefore = mockFetcher.mock.calls.length;
			const p2 = await mgr.goToPage(2);
			expect(p2.length).toBe(50);
			expect(mgr.currentPage).toBe(2);
			expect(mgr.startIdx).toBe(51);
			expect(mgr.endIdx).toBe(100);
			// No new call made synchronously for page 2 because it was cached
			expect(mockFetcher.mock.calls.length).toBe(callCountBefore + 1); // Only the prefetch for page 3 was initiated

			// Flush pre-fetch for page 3
			await Promise.resolve();
			expect(mgr.cache.has(3)).toBe(true);

			// Navigate to page 3
			const p3 = await mgr.goToPage(3);
			expect(p3.length).toBe(35); // 135 - 100 = 35
			expect(mgr.currentPage).toBe(3);
			expect(mgr.startIdx).toBe(101);
			expect(mgr.endIdx).toBe(135);
		});
	});

	describe('Lemma Display Mode Persistence', () => {
		const STORAGE_KEY = 'polyglot_lemma_display_mode';

		function resolveDisplayMode(
			externalMode?: 'sidepanel' | 'modal',
			storageMock?: Record<string, string>
		): 'sidepanel' | 'modal' {
			if (externalMode) return externalMode;
			if (storageMock && storageMock[STORAGE_KEY]) {
				const saved = storageMock[STORAGE_KEY];
				if (saved === 'modal' || saved === 'sidepanel') return saved;
			}
			return 'sidepanel';
		}

		it('defaults to sidepanel when storage is empty', () => {
			expect(resolveDisplayMode(undefined, {})).toBe('sidepanel');
		});

		it('persists and restores modal preference between sessions and tokens', () => {
			const storage: Record<string, string> = {};
			// User toggles to modal
			storage[STORAGE_KEY] = 'modal';

			// First lemma open
			expect(resolveDisplayMode(undefined, storage)).toBe('modal');

			// Second lemma open later
			expect(resolveDisplayMode(undefined, storage)).toBe('modal');

			// User toggles back to sidepanel
			storage[STORAGE_KEY] = 'sidepanel';
			expect(resolveDisplayMode(undefined, storage)).toBe('sidepanel');
		});

		it('allows explicit prop override over stored preference', () => {
			const storage: Record<string, string> = { [STORAGE_KEY]: 'modal' };
			expect(resolveDisplayMode('sidepanel', storage)).toBe('sidepanel');
		});
	});
});
