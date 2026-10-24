declare const __APP_VERSION__: string | undefined;
declare const __APP_REPO__: string | undefined;

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.2';
export const APP_REPO = typeof __APP_REPO__ !== 'undefined' ? __APP_REPO__ : 'https://github.com/cbop-dev/polyglot-suite/tree/main/apps/philo-reader';
