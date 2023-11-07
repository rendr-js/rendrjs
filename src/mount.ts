import { Elem, createDom } from './elem';
import { appendChild } from './utils';

export let mount = (root: HTMLElement, elem: Elem) => {
    appendChild(root, createDom(elem));
};
