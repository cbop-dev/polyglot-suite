/**
 * Safely extracts a column value from a database query row.
 * Handles both object-mode (row.column_name) and array/tuple-mode (row[columnIndex]) returns
 * from SQLite / sql.js-httpvfs.
 */
export function getRowVal<T = any>(row: any, key: string, index: number, fallback?: T): T {
	if (!row) return fallback as T;
	const val = row[key] !== undefined ? row[key] : row[index];
	return (val !== undefined ? val : fallback) as T;
}

/**
 * Safely parses a JSON text column that may be either a serialized JSON string
 * or already parsed as an Object/Array.
 */
export function parseJsonField<T = any>(val: any, fallback?: T): T {
	if (!val) return fallback as T;
	if (typeof val === 'string') {
		try {
			return JSON.parse(val);
		} catch {
			return fallback as T;
		}
	}
	return val;
}
