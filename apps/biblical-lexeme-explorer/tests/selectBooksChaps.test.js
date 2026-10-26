import { test, expect } from 'vitest';
import { TfBhsDataset } from '$lib/bhs/bhs.js';
import { TfLxxDataset } from '$lib/lxx/tfLXX.js';
import { TfSblGntDataset } from '$lib/sblgnt/tfSblGnt.js';

test('SelectBooksChaps data mapping for BHS, LXX, SBLGNT', () => {
  const datasets = [
    { name: 'BHS', ds: new TfBhsDataset() },
    { name: 'LXX', ds: new TfLxxDataset() },
    { name: 'SBLGNT', ds: new TfSblGntDataset() }
  ];

  for (const { name, ds } of datasets) {
    expect(ds.booksDict).toBeDefined();
    expect(ds.booksDict.books).toBeDefined();
    expect(ds.booksDict.chapters).toBeDefined();

    // Verify bookData mapping
    const bookData = Object.entries(ds.booksDict.books).map(([id, obj]) => ({
      id: id,
      text: obj.abbrev,
      label: obj.abbrev,
      abbrev: obj.abbrev
    }));

    expect(bookData.length).toBeGreaterThan(0);
    for (const b of bookData) {
      expect(b.text).toBeTruthy();
      expect(b.text).not.toBe('Reusable Button');
      expect(b.label).toBeTruthy();
    }

    // Verify chapData mapping
    const chapData = Object.entries(ds.booksDict.chapters).map(([id, chapList]) => ({
      id: id,
      text: ds.booksDict.books?.[id]?.abbrev || id,
      label: ds.booksDict.books?.[id]?.abbrev || id,
      abbrev: ds.booksDict.books?.[id]?.abbrev || id,
      children: Object.entries(chapList).map(([chapId, num]) => ({
        id: chapId,
        text: String(num),
        label: String(num)
      }))
    }));

    expect(chapData.length).toBeGreaterThan(0);
    for (const c of chapData) {
      expect(c.text).toBeTruthy();
      expect(c.text).not.toBe('Reusable Button');
      expect(c.children.length).toBeGreaterThan(0);
      for (const child of c.children) {
        expect(child.text).toBeDefined();
        expect(child.text).not.toBe('Reusable Button');
        expect(Number(child.text)).toBeGreaterThanOrEqual(0);
      }
    }
  }
});
