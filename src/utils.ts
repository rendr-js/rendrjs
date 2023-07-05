export let areDepsEqual = (a: any[], b: any[]): boolean => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = a.length - 1; i >= 0; i--) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

export let $document = document;
export let typeOf = (a: any): string => typeof a;
export let isString = (v: any): v is string => typeOf(v) == 'string';
export let isFunction = (v: any): v is Function => typeOf(v) == 'function';
export let queueTask = (task: () => void) => queueMicrotask(task);
export let illegal = (msg: string) => Error(`illegal ${msg}`);
