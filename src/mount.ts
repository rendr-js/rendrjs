import { Elem, createDom } from './elem.js';

export var mount = (root: HTMLElement, elem: Elem) => {
    root.appendChild(createDom(elem));
};
