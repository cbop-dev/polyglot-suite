import { describe, it, expect } from 'vitest';
import { getRowVal, parseJsonField, unpackJsonBlob } from '../src/index.js';
import zlib from 'node:zlib';

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

	describe('unpackJsonBlob helper', () => {
		it('unpacks plain JSON string', async () => {
			const str = JSON.stringify([{ w: 'test' }]);
			const res = await unpackJsonBlob(str);
			expect(res).toEqual([{ w: 'test' }]);
		});

		it('decompresses gzip compressed Uint8Array blob', async () => {
			const data = [{ w: 'θεός', l: 'θεός', m: 'N-NSM' }];
			const compressed = zlib.gzipSync(JSON.stringify(data));
			const res = await unpackJsonBlob(new Uint8Array(compressed));
			expect(res).toEqual(data);
		});

		it('unpacks raw UTF-8 byte array', async () => {
			const data = [{ w: 'raw' }];
			const bytes = new TextEncoder().encode(JSON.stringify(data));
			const res = await unpackJsonBlob(bytes);
			expect(res).toEqual(data);
		});

		it('returns fallback on invalid or corrupted blob', async () => {
			const corrupted = new Uint8Array([0x1f, 0x8b, 0x00, 0x00]);
			const res = await unpackJsonBlob(corrupted, null);
			expect(res).toBeNull();
		});
	});
});
