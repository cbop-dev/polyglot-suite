//env key url per app is: PUBLIC_SUITE_<SLUG>_APP_URL, converted to uppsercase
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';
import portalJson from '$lib/portal.json';
export const prerender = true;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Walk up from apps/portal/src/routes to the monorepo root
/*function findRootDir(): string {
	let curr = resolve(__dirname, '../../../..');
	if (existsSync(resolve(curr, 'portal.json'))) {
		return curr;
	}
	// Fallback to process.cwd() or parent
	curr = process.cwd();
	while (curr !== dirname(curr)) {
		if (existsSync(resolve(curr, 'portal.json'))) {
			return curr;
		}
		curr = dirname(curr);
	}
	return resolve(__dirname, '../../../..');
}*/

const ROOT_DIR =  resolve(__dirname, '../../../..');


const isGithubTarget =
	process.env.TARGET === 'github' ||
	process.env.BUILD_TARGET === 'github' ||
	process.env.ADAPTER === 'github';

if (!isGithubTarget) {
	const envPath = resolve(ROOT_DIR, '.env.deploy');
	if (existsSync(envPath)) {
		const content = readFileSync(envPath, 'utf8');
		for (const line of content.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eqIdx = trimmed.indexOf('=');
			if (eqIdx !== -1) {
				const key = trimmed.slice(0, eqIdx).trim();
				let val = trimmed.slice(eqIdx + 1).trim();
				if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
					val = val.slice(1, -1);
				}
				if (!process.env[key]) {
					process.env[key] = val;
				}
			}
		}
	}
}

/*const ROUTE_CONFIG: Record<string, { slug: string; envKey: string }> = {
	'polyglot-bible-reader': { slug: 'bible', envKey: 'PUBLIC_BIBLE_APP_URL' },
	'biblical-lexeme-explorer': { slug: 'lexemes', envKey: 'PUBLIC_LEXEMES_APP_URL' },
	'ancient-corpora-reader': { slug: 'corpora', envKey: 'PUBLIC_CORPORA_APP_URL' }
};

const DEV_DEFAULT_URLS: Record<string, string> = {
	'polyglot-bible-reader': 'http://localhost:5173',
	'biblical-lexeme-explorer': 'http://localhost:5174',
	'ancient-corpora-reader': 'http://localhost:5175'
};
*/
export interface PortalAppItem {
	id: string;
	slug: string;
	title: string;
	description: string;
	tags: string[];
	url: string;
}

export const load: PageServerLoad = async () => {
	//const rootConfigPath = resolve(ROOT_DIR, 'portal.json');
	if (!portalJson) {
		console.warn(`[Portal] Root portal.json not found!`);
		return { apps: [] };
	}

	const { appsEnabled = [], appsInfo={} } = portalJson as {
		appsEnabled: string[];
		appsInfo: Record<string, any>;
	};
	console.log(`appsEnabled: [${appsEnabled.join(',')}]`)
	const apps: PortalAppItem[] = [];
	Object.entries(appsInfo).forEach(([appName, appInfo]) => {
		if (appsEnabled.includes(appName)) {
			const envKey ="PUBLIC_SUITE_" + appInfo.slug.toLocaleUpperCase().replaceAll(/-/g, '_')+"_APP_URL";
			//const routeMeta = ROUTE_CONFIG[appDir];
			//const slug = routeMeta?.slug || appDir;
			const defaultRelative = `/${appInfo.slug}/`;
			const url = dev
				? (envKey && process.env[envKey]) ||  defaultRelative
				: isGithubTarget
					? defaultRelative
					: (envKey && process.env[envKey]) || defaultRelative;
			console.log("here wer are in : " + appName);
			apps.push({
				id: appName,
				slug: appInfo.slug,
				title: appInfo.title,
				description: appInfo.description,
				tags: appInfo.tags || [],
				url
			});
		}


	});

	/*
	for (const appDir of appsEnabled) {
		const appConfigPath = resolve(ROOT_DIR, 'apps', appDir, 'src/config/portal.json');
		if (!existsSync(appConfigPath)) {
			console.warn(`[Portal] Config not found for "${appDir}" at ${appConfigPath}`);
			continue;
		}

		try {
			const meta = JSON.parse(readFileSync(appConfigPath, 'utf8')) as {
				title: string;
				description: string;
				tags: string[];
				slug: string;
				
			};

			const envKey ="PUBLIC_SUITE_" + appDir.toLocaleUpperCase();
			//const routeMeta = ROUTE_CONFIG[appDir];
			//const slug = routeMeta?.slug || appDir;
			const defaultRelative = `./${meta.slug}/`;
			const url = dev
				? (envKey && process.env[envKey]) ||  defaultRelative
				: isGithubTarget
					? defaultRelative
					: (envKey && process.env[envKey]) || defaultRelative;
			console.log("here wer are in : " + appDir);
			apps.push({
				id: appDir,
				slug: meta.slug,
				title: meta.title,
				description: meta.description,
				tags: meta.tags || [],
				url
			});
		} catch (err: unknown) {
			console.error(`[Portal] Failed parsing metadata for ${appDir}:`, err);
		}
	}
	*/

	console.log("apps:");
	console.log(apps);
	return { apps };
};
