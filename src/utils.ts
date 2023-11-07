import { ComponentElem, Elem } from "./elem";
import { Ref } from "./hooks";

export let areDepsEqual = (a: any[], b: any[]): boolean => {
    if (length(a) !== length(b)) {
        return false;
    }
    for (let i = length(a) - 1; i >= 0; i--) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

export let $document = document;
export let typeOf = (a: any): string => typeof a;
export let isString = (v: any): v is string => typeOf(v) === 'string';
export let isFunction = (v: any): v is Function => typeOf(v) === 'function';
export let queueTask = (task: () => void) => queueMicrotask(task);
export let illegal = (msg: string) => Error(`illegal ${msg}`);
export let length = (arg: string | any[]) => arg.length;
export let truncateElemQ = (elem: ComponentElem | Elem) => elem.q ? elem.q.length = 0 : undefined;
export let appendChild = (node: Node, child: Node) => node.appendChild(child);
export let insertBefore = (parent: Node, ref: Node, child: Node) => parent.insertBefore(child, ref);
export let getCurrent = <T>(ref: Ref<T>): T => ref.current;
export let setCurrent = <T>(ref: Ref<T>, val: T) => ref.current = val;
export let setRef = <T>(elem: ComponentElem | Elem, val: T) => elem.r ? setCurrent(elem.r, val) : undefined;
export let remove = (node: ChildNode) => node.remove();
export let removeAttribute = (e: Element, attr: string) => e.removeAttribute(attr);
export let isListenerAttr = (attr: string) => attr.startsWith('on');
