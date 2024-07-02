import { ComponentElem, createDom, Elem, callComponentFunc } from './elem.js';
import { areDepsEqual } from './utils.js';

type HTMLElementElem = Elem & { d: HTMLElement };

let teardown = (elem: Elem, remove = 0) => {
    if (remove < 0) getDom(elem).remove();
    if (elem.r) elem.r.value = undefined;
    if (elem.v) {
        elem.u = true;
        if (elem.q) elem.q.length = 0;
        elem.h?.forEach(h => h?.t?.());
        elem.h = undefined;
        teardown(elem.v);
    } else {
        elem.c?.forEach(teardown);
    }
}

let getDom = (elem: Elem): ChildNode => {
    while (elem.v) elem = elem.v!;
    return elem.d!;
};

export let reconcile = (oldElem: Elem, newElem: Elem): void => {
    newElem.u = false;
    let oldDom = getDom(oldElem);
    let newProps = newElem.p;
    let oldProps = oldElem.p;
    if (oldElem.t !== newElem.t) {
        teardown(oldElem);
        oldDom.replaceWith(createDom(newElem));
    } else if (!oldElem.t) {
        newElem.d = oldDom;
        if (oldProps !== newProps) {
            (oldDom as Text).data = newProps;
        }
    } else if (typeof oldElem.t === 'string') {
        newElem.d = oldDom;
        for (let attr in { ...newElem.p, ...oldElem.p }) {
            let prop = newElem.p[attr];
            if (prop !== oldElem.p[attr]) {
                setAttr(oldElem.d as HTMLElement, attr, prop);
            }
        }
        if (newElem.r) {
            newElem.r.value = oldDom;
        } else if (oldElem.r) {
            oldElem.r.value = undefined;
        }
        reconcileChildren(oldElem as HTMLElementElem, newElem as HTMLElementElem, oldDom as Element);
    } else {
        newElem.h = oldElem.h;
        if (oldElem.m && newElem.m && areDepsEqual(oldElem.m, newElem.m)) {
            newElem.v = oldElem.v;
        } else {
            if (oldElem.q) oldElem.q.length = 0;
            callComponentFuncAndReconcile(oldElem as ComponentElem, newElem as ComponentElem);
        }
    }
}

export let callComponentFuncAndReconcile = (oldElem: ComponentElem, newElem: ComponentElem) => {
    let newElemVdom = callComponentFunc(newElem);
    reconcile(oldElem.v!, newElemVdom);
    newElem.v = newElemVdom;
};

export let setAttr = (dom: HTMLElement, attr: string, prop: any) => {
    if (!attr.indexOf('on') || attr === 'value') {
        // @ts-expect-error
        dom[attr] = prop;
    } else if (prop) {
        dom.setAttribute(attr, prop);
    } else {
        dom.removeAttribute(attr);
    }
};

let moveBefore = (parent: ParentNode, newChn: Elem[], oldChn: Elem[], i: number, currDomNode: ChildNode, movingDomNode: ChildNode) => {
    let oldPos = movingDomNode.nextSibling;
    parent.insertBefore(movingDomNode, currDomNode);
    if (currDomNode !== parent.lastChild && newChn[i+1]?.k !== oldChn[i]?.k) {
        parent.insertBefore(currDomNode, oldPos);
    }
}

type ChilrenMap = { [key: string]: Elem<any> };

let reconcileChildren = (oldElem: HTMLElementElem, newElem: HTMLElementElem, dom: Element) => {
    let newChn = newElem.c ?? [];
    let oldChn = oldElem.c ?? [];
    let newLength = newChn.length;
    let oldLength = oldChn.length;
    if (!newLength && oldLength) {
        (getDom(oldElem) as HTMLElement).innerHTML = '';
        oldChn.forEach(teardown);
        return;
    }
    let start = 0;

    // prefix
    while (
        start < newLength &&
        start < oldLength &&
        (newChn[start].k === undefined || newChn[start].k === oldChn[start].k)
    ) {
        reconcile(oldChn[start], newChn[start]);
        start++;
    }
    if (start >= newLength) {
        while (start < oldLength) teardown(oldChn[start++], -1);
        return;
    }

    // suffix
    oldLength--;
    newLength--;
    while (
        newLength > start &&
        oldLength >= start &&
        (!newChn[newLength].k || newChn[newLength].k === oldChn[oldLength].k)
    ) {
        reconcile(oldChn[oldLength--], newChn[newLength--]);
    }

    let oldMap = {} as ChilrenMap;
    for (let i = start; i <= oldLength; i++) {
        if (oldChn[i].k && (!newChn[i] || oldChn[i].k !== newChn[i].k)) {
            oldMap[oldChn[i].k!] = oldChn[i];
        }
    }

    while (start <= newLength) {
        let newChd = newChn[start];
        let newKey = newChd.k;
        let oldChd = oldChn[start];
        let chdDom = dom.childNodes[start];
        let mappedOld = oldMap[newKey!];
        if (!oldChd) {
            dom.appendChild(createDom(newChd));
        } else if (mappedOld) {
            if (chdDom !== mappedOld.d) {
                moveBefore(dom, newChn, oldChn, start, chdDom, getDom(mappedOld));
            }
            reconcile(mappedOld, newChd);
            delete oldMap[newKey!];
        } else if (oldChd.k === newKey) {
            reconcile(oldChd, newChd);
        } else {
            moveBefore(dom, newChn, oldChn, start, chdDom, createDom(newChd));
        }
        start++;
    }

    for (let key in oldMap) teardown(oldMap[key], -1);
}