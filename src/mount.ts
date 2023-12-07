import { Elem, createDom } from './elem.js';
import { appendChild } from './utils.js';

export let mount = (root: HTMLElement, elem: Elem) => {
    appendChild(root, createDom(elem));
};
