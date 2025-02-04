import { Elem, createDom } from './elem.js';
import { teardown } from './reconcile.js';

export let mount = (root: HTMLElement, elem: Elem) => {
    root.appendChild(createDom(elem));
};

export let unmount = (elem: Elem) => teardown(elem, -1);
