export let areDepsEqual = (a: any[], b: any[]): boolean => a.length === b.length && a.every((x, i) => a[i] === b[i]);

export let $document = document;
