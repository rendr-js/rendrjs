import { Elem, createDom } from './elem.js';

export let mount = (root: HTMLElement, elem: Elem) => {
    root.appendChild(createDom(elem));
};
