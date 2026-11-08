/**
 * Application version and repository metadata.
 * Injected at build/dev time via Vite's `define` config, with fallback defaults.
 */
export const SUITE_VERSION     =  __SUITE_VERSION__ ??  null;
export const SUITE_REPO = __SUITE_REPO__ ?? 'https://github.com/cbop-dev/polyglot-suite';
