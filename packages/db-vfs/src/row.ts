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

/**
 * Safely unpacks a JSON column that may be:
 * - A gzip-compressed Uint8Array / Buffer / ArrayBuffer BLOB (starts with 0x1f 0x8b)
 * - An uncompressed raw Uint8Array / UTF-8 byte array
 * - A serialized JSON text string
 * - An already-parsed JavaScript object or array
 */
export async function unpackJsonBlob<T = any>(val: any, fallback?: T): Promise<T> {
	if (!val) return fallback as T;
	if (typeof val === 'string') {
		try {
			return JSON.parse(val);
		} catch {
			return fallback as T;
		}
	}

	let bytes: Uint8Array | null = null;
	if (val instanceof Uint8Array) {
		bytes = val;
	} else if (val instanceof ArrayBuffer) {
		bytes = new Uint8Array(val);
	} else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'number') {
		bytes = new Uint8Array(val);
	} else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(val)) {
		bytes = new Uint8Array(val);
	}

	if (bytes) {
		try {
			if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
				if (typeof DecompressionStream !== 'undefined') {
					const body = new Response(bytes as unknown as BodyInit).body;
					if (body) {
						const stream = body.pipeThrough(new DecompressionStream('gzip'));
						const text = await new Response(stream).text();
						return JSON.parse(text);
					}
				}
			}
			return JSON.parse(new TextDecoder().decode(bytes));
		} catch {
			return fallback as T;
		}
	}

	return val;
}
