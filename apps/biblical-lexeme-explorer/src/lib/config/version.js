/**
 * Application version and repository metadata.
 * Injected at build/dev time via Vite's `define` config, with fallback defaults.
 */
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '2.1.2';
export const APP_REPO = typeof __APP_REPO__ !== 'undefined' ? __APP_REPO__ : 'https://github.com/cbop-dev/biblical-lexeme-explorer';
