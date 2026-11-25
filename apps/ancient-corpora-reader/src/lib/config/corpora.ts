import * as CorpusTypes from "@polyglot/ancient-languages/corpora-types";
import { CANONICAL_CORPUS_VERSIONS } from "./corpusVersions.generated.js";
import manifest from "../../../corpora.manifest.json";

type ManifestCorpusEntry = Omit<CorpusTypes.CorpusConfig, "textVersions"> & {
	pipeline?: {
		chunkPrefix: string;
		dbTagPrefix: string;
		aliases?: string[];
	};
};

export const CORPORA_CONFIG: Record<string, CorpusTypes.CorpusConfig> = Object.fromEntries(
	(manifest.corpora as ManifestCorpusEntry[]).map(({ pipeline: _pipeline, ...entry }) => [
		entry.id,
		{
			...(entry as Omit<CorpusTypes.CorpusConfig, "textVersions">),
			textVersions: CANONICAL_CORPUS_VERSIONS[entry.id] || []
		}
	])
);

const installedConfigGlob =
	typeof import.meta.glob === 'function'
		? import.meta.glob('../../../static/db/*/config.json')
		: {};

const INSTALLED_CORPUS_IDS: Set<string> = new Set(
	Object.keys(installedConfigGlob)
		.map((path) => path.match(/\/static\/db\/([^/]+)\/config\.json$/)?.[1])
		.filter((id): id is string => Boolean(id))
);

/**
 * Returns true if the corpus database chunks (static/db/<id>/config.json) are installed on disk.
 */
export function isCorpusInstalled(id: string): boolean {
	if (INSTALLED_CORPUS_IDS.size === 0) {
		return id in CORPORA_CONFIG;
	}
	return INSTALLED_CORPUS_IDS.has(id);
}

/**
 * Returns true if the corpus is enabled in configuration.
 */
export function isCorpusEnabled(id: string): boolean {
	const cfg = CORPORA_CONFIG[id];
	return Boolean(cfg && cfg.enabled !== false);
}

/**
 * Return all registered corpora in CORPORA_CONFIG (regardless of install/enabled status).
 */
export function getRegisteredCorpora(): CorpusTypes.CorpusConfig[] {
	return Object.values(CORPORA_CONFIG);
}

/**
 * Return all corpora that are both enabled and installed on disk.
 */
export function getActiveCorpora(): CorpusTypes.CorpusConfig[] {
	return Object.values(CORPORA_CONFIG).filter(
		(cfg) => cfg.enabled !== false && isCorpusInstalled(cfg.id)
	);
}

/**
 * Retrieve the configuration for a given corpus ID, falling back to the first active corpus.
 */
export function getCorpusConfig(id?: string): CorpusTypes.CorpusConfig {
	if (id && id in CORPORA_CONFIG) {
		return CORPORA_CONFIG[id];
	}
	return getActiveCorpora()[0] || CORPORA_CONFIG.af;
}

/**
 * Return all active (enabled and installed) corpora in canonical display order.
 */
export function getAllCorpora(): CorpusTypes.CorpusConfig[] {
	return getActiveCorpora();
}

/**
 * Return all available text versions for a corpus.
 */
export function getCorpusTextVersions(id: string): CorpusTypes.TextVersionConfig[] {
	return getCorpusConfig(id).textVersions;
}
