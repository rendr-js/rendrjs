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
    if (oldElem.t !== newElem.t) {
        teardown(oldElem);
        getDom(oldElem).replaceWith(createDom(newElem));
        return;
    }
    if (oldElem.v) {
        reconcileComponents(oldElem as ComponentElem, newElem as ComponentElem);
        return;
    }
    newElem.d = oldElem.d;
    if (oldElem.t) {
        reconcileVdomElems(oldElem as HTMLElementElem, newElem as HTMLElementElem);
    } else {
        reconcileTextElems(oldElem, newElem);
    }
}

let reconcileVdomElems = (oldElem: HTMLElementElem, newElem: HTMLElementElem) => {
    reconcileAttributes(oldElem, newElem);
    reconcileReference(oldElem, newElem);
    reconcileChildren(oldElem, newElem);
}

let reconcileTextElems = (oldElem: Elem, newElem: Elem) => {
    if (oldElem.p !== newElem.p) {
        (oldElem.d as Text).data = newElem.p;
    }
};

let reconcileComponents = (oldElem: ComponentElem, newElem: ComponentElem) => {
    newElem.h = oldElem.h;
    if (oldElem.m && newElem.m && areDepsEqual(oldElem.m, newElem.m)) {
        newElem.v = oldElem.v;
        return;
    }
    if (oldElem.q) {
        oldElem.q.length = 0;
    }
    callComponentFuncAndReconcile(oldElem, newElem);
}

let reconcileAttributes = (oldElem: HTMLElementElem, newElem: HTMLElementElem) => {
    for (let attr in { ...newElem.p, ...oldElem.p }) {
        let prop = newElem.p[attr];
        if (prop !== oldElem.p[attr]) {
            setAttr(oldElem.d, attr, prop);
        }
    }
}

let reconcileReference = (oldElem: Elem, newElem: Elem) => {
    if (newElem.r) {
        newElem.r.value = oldElem.d;
    } else if (oldElem.r) {
        oldElem.r.value = undefined;
    }
}

export let callComponentFuncAndReconcile = (oldElem: ComponentElem, newElem: ComponentElem) => {
    let newElemVdom = callComponentFunc(newElem);
    reconcile(oldElem.v!, newElemVdom);
    newElem.v = newElemVdom;
};

export let setAttr = (dom: HTMLElement, attr: string, prop: any) => {
    if (!attr.indexOf('on')) {
        // @ts-expect-error
        dom[attr] = prop;
    } else if (!prop) {
        dom.removeAttribute(attr);
    } else {
        dom.setAttribute(attr, prop);
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

let reconcileChildren = (oldElem: HTMLElementElem, newElem: HTMLElementElem) => {
    let newChn = newElem.c ?? [];
    let oldChn = oldElem.c ?? [];
    let newLength = newChn.length;
    let oldLength = oldChn.length;
    if (!newLength && oldLength) {
        newElem.d.innerHTML = '';
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
        let chdDom = newElem.d.childNodes[start];
        let mappedOld = oldMap[newKey!];
        if (!oldChd) {
            newElem.d.appendChild(createDom(newChd));
        } else if (mappedOld) {
            if (chdDom !== mappedOld.d) {
                moveBefore(newElem.d, newChn, oldChn, start, chdDom, getDom(mappedOld));
            }
            reconcile(mappedOld, newChd);
            delete oldMap[newKey!];
        } else if (oldChd.k === newKey) {
            reconcile(oldChd, newChd);
        } else {
            moveBefore(newElem.d, newChn, oldChn, start, chdDom, createDom(newChd));
        }
        start++;
    }

    for (let key in oldMap) teardown(oldMap[key], -1);
}
