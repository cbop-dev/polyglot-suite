export interface BookmarkItem {
  id: string; // e.g. "Antiquities-1-14"
  work: string;
  bookNum: number;
  nieseSec: string;
  snippet: string;
  timestamp: number;
}

const STORAGE_KEY = 'josephus-bookmarks-v1';

export function getBookmarks(): BookmarkItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to parse bookmarks:', err);
    return [];
  }
}

export function isBookmarked(work: string, bookNum: number, nieseSec: string): boolean {
  const id = `${work}-${bookNum}-${nieseSec}`;
  const items = getBookmarks();
  return items.some(item => item.id === id);
}

export function toggleBookmark(work: string, bookNum: number, nieseSec: string, snippet = ''): boolean {
  if (typeof localStorage === 'undefined') return false;
  const id = `${work}-${bookNum}-${nieseSec}`;
  let items = getBookmarks();
  const index = items.findIndex(item => item.id === id);
  let nowBookmarked = false;

  if (index >= 0) {
    items.splice(index, 1);
    nowBookmarked = false;
  } else {
    items.unshift({
      id,
      work,
      bookNum,
      nieseSec,
      snippet: snippet.slice(0, 120).trim(),
      timestamp: Date.now()
    });
    nowBookmarked = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reader-bookmarks-changed', { detail: { items } }));
    }
  } catch (err) {
    console.error('Failed to save bookmarks:', err);
  }

  return nowBookmarked;
}

export function removeBookmark(id: string): void {
  if (typeof localStorage === 'undefined') return;
  let items = getBookmarks();
  items = items.filter(item => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reader-bookmarks-changed', { detail: { items } }));
    }
  } catch (err) {
    console.error('Failed to update bookmarks:', err);
  }
}

export function clearAllBookmarks(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reader-bookmarks-changed', { detail: { items: [] } }));
    }
  } catch (err) {
    console.error('Failed to clear bookmarks:', err);
  }
}
