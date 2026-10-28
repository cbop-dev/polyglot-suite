import { writable, get } from 'svelte/store';

export const server = '';

export const debug = writable(false);

export const levels = {
    RIDICULOUS: -100,
    DEBUG: 0,
    INFO: 1,
    LOG: 2,
    WARNING: 3,
    ERROR: 4,
    NONE: 100
};

let defaultLevel = 0;

export function mylog(msg: any, debugOn: boolean = get(debug), thelevel: number = defaultLevel): void {
    if (debugOn && thelevel >= defaultLevel) {
        console.log(msg);
    }
}

export function setLogLevel(level: number): boolean {
    let success = false;
    if (Object.values(levels).includes(level)) {
        success = true;
    }
    return success;
}

export let log = {
    debug,
    defaultLevel,
    levels,
    mylog,
    setLogLevel
};

export default {
    debug,
    mylog
};
