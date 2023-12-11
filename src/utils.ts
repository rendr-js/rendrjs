import { ComponentElem, Elem } from './elem.js';

export var areDepsEqual = (a: any[], b: any[]): boolean => a.length === b.length && a.every((x, i) => a[i] === b[i]);

export var $document = document;
