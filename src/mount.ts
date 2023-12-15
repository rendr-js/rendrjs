import { Elem, SlotElem, createDom, normalizeSlotElem } from './elem.js';

export let mount = (root: HTMLElement, elem: SlotElem) => {
    root.appendChild(createDom(normalizeSlotElem(elem)));
};
