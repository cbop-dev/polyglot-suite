import { describe, it, expect } from 'vitest';
import { getRowVal, parseJsonField } from '../src/index.js';

describe('@polyglot/db-vfs', () => {
	describe('getRowVal helper', () => {
		it('extracts values from object-mode row', () => {
			const row = { id: 42, work_code: '1clem', text: 'Sample' };
			expect(getRowVal(row, 'id', 0)).toBe(42);
			expect(getRowVal(row, 'work_code', 1)).toBe('1clem');
			expect(getRowVal(row, 'text', 2)).toBe('Sample');
		});

		it('extracts values from array/tuple-mode row', () => {
			const tuple = [42, '1clem', 'Sample'];
			expect(getRowVal(tuple, 'id', 0)).toBe(42);
			expect(getRowVal(tuple, 'work_code', 1)).toBe('1clem');
			expect(getRowVal(tuple, 'text', 2)).toBe('Sample');
		});

		it('falls back when value is missing or undefined', () => {
			const emptyRow = {};
			expect(getRowVal(emptyRow, 'missing', 99, 'default')).toBe('default');
			expect(getRowVal(null, 'missing', 0, null)).toBeNull();
		});
	});

	describe('parseJsonField helper', () => {
		it('parses valid JSON string', () => {
			const str = JSON.stringify([{ w: 'λόγος', l: 'λόγος' }]);
			expect(parseJsonField(str)).toEqual([{ w: 'λόγος', l: 'λόγος' }]);
		});

		it('returns already-parsed object/array without re-parsing', () => {
			const obj = [{ w: 'λόγος' }];
			expect(parseJsonField(obj)).toBe(obj);
		});

		it('returns fallback on invalid JSON', () => {
			expect(parseJsonField('not-json', [])).toEqual([]);
			expect(parseJsonField(null, null)).toBeNull();
		});
	});
});
