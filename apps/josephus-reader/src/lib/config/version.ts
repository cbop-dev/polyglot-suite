declare const __APP_VERSION__: string;
declare const __APP_REPO__: string;

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.30';
export const APP_REPO = typeof __APP_REPO__ !== 'undefined' ? __APP_REPO__ : 'https://github.com/cbop-dev/polyglot-suite/tree/main/apps/josephus-reader';
