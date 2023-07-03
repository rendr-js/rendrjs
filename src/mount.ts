import { Elem, createDom } from './elem';

export let mount = (root: HTMLElement, elem: Elem) => {
    root.appendChild(createDom(elem));
};
