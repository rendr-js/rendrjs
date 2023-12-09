import { ComponentElem, Elem } from './elem.js';
import { Ref } from './hooks.js';

export var areDepsEqual = (a: any[], b: any[]): boolean => length(a) === length(b) && a.every((x, i) => a[i] === b[i]);

export var $document = document;
export var typeOf = (a: any): string => typeof a;
export var isString = (v: any): v is string => typeOf(v) === 'string';
export var isFunction = (v: any): v is Function => typeOf(v) === 'function';
export var queueTask = (task: () => void) => queueMicrotask(task);
export var illegal = (msg: string) => `bad ${msg}`;
export var length = (arg: string | any[]) => arg.length;
export var truncate = (v: any[] | undefined) => v ? v.length = 0 : undef;
export var appendChild = (node: Node, child: Node) => node.appendChild(child);
export var insertBefore = (parent: Node, ref: Node | null, child: Node) => parent.insertBefore(child, ref);
export var getRefValue = <T>(ref: Ref<T>): T => ref.value;
export var setRefValue = <T>(ref: Ref<T>, val: T) => ref.value = val;
export var setRef = <T>(elem: ComponentElem | Elem, val: T) => elem.r ? setRefValue(elem.r, val) : undef;
export var remove = (node: ChildNode) => node.remove();
export var removeAttribute = (e: Element, attr: string) => e.removeAttribute(attr);
export var deleteObjectProperty = <T extends { [key: string]: any }, K extends keyof T>(obj: T, property: K) => delete obj[property];
export var undef = undefined;
export var forEach = <T>(a: T[] | Set<T> | undefined, fn: (t: T) => any) => a?.forEach(fn);
export var indexOf = <T>(a: T[] | string, item: any) => a.indexOf(item);
export var STATIC_EMPTY_ARRAY = [];
