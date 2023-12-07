import { ComponentElem, Elem } from './elem.js';
import { Ref } from './hooks.js';

export let areDepsEqual = (a: any[], b: any[]): boolean => length(a) === length(b) && a.every((x, i) => a[i] === b[i]);

export let $document = document;
export let typeOf = (a: any): string => typeof a;
export let isString = (v: any): v is string => typeOf(v) === 'string';
export let isFunction = (v: any): v is Function => typeOf(v) === 'function';
export let queueTask = (task: () => void) => queueMicrotask(task);
export let illegal = (msg: string) => `bad ${msg}`;
export let length = (arg: string | any[]) => arg.length;
export let truncate = (v: any[] | undefined) => v ? v.length = 0 : undef;
export let appendChild = (node: Node, child: Node) => node.appendChild(child);
export let insertBefore = (parent: Node, ref: Node, child: Node) => parent.insertBefore(child, ref);
export let getRefValue = <T>(ref: Ref<T>): T => ref.value;
export let setRefValue = <T>(ref: Ref<T>, val: T) => ref.value = val;
export let setRef = <T>(elem: ComponentElem | Elem, val: T) => elem.r ? setRefValue(elem.r, val) : undef;
export let remove = (node: ChildNode) => node.remove();
export let removeAttribute = (e: Element, attr: string) => e.removeAttribute(attr);
export let deleteObjectProperty = <T extends { [key: string]: any }, K extends keyof T>(obj: T, property: K) => delete obj[property];
export let undef = undefined;
export let forEach = <T>(a: T[] | Set<T> | undefined, fn: (t: T) => any) => a?.forEach(fn);
export let indexOf = <T>(a: T[] | string, item: any) => a.indexOf(item);
export let STATIC_EMPTY_ARRAY = [];
