import { ComponentElem, createDom, Elem, callComponentFunc } from './elem.js';
import { areDepsEqual } from './utils.js';

type HTMLElementElem = Elem & { d: HTMLElement };

let teardown = (elem: Elem, remove = 0) => {
    if (remove < 0) getDom(elem).remove();
    if (elem.v) {
        elem.u = true;
        if (elem.q) elem.q.length = 0;
        elem.h?.forEach(h => h?.t?.());
        teardown(elem.v);
    } else {
        if (elem.r) elem.r.value = undefined;
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
        // TODO: do we need to know namespace here?
        getDom(oldElem).replaceWith(createDom(newElem));
        return;
    }
    if (oldElem.v) {
        newElem.h = oldElem.h;
        if (oldElem.m && newElem.m && areDepsEqual(oldElem.m, newElem.m)) {
            newElem.v = oldElem.v;
            return;
        }
        if (oldElem.q) {
            oldElem.q.length = 0;
        }
        callComponentFuncAndReconcile(oldElem as ComponentElem, newElem as ComponentElem);
        return;
    }
    newElem.d = oldElem.d;
    if (oldElem.t) {
        for (let attr in newElem.p) {
            let prop = newElem.p[attr];
            if (prop && prop !== oldElem.p[attr]) {
                setAttr(oldElem.d as HTMLElement, attr, prop);
            }
        }
        for (let attr in oldElem.p) {
            let prop = newElem.p[attr];
            if (!prop && !setListenerAttr(oldElem.d as HTMLElement, attr, prop)) {
                (oldElem.d as HTMLElement).removeAttribute(attr);
            }
        }
        if (newElem.r) {
            newElem.r.value = oldElem.d;
        } else if (oldElem.r) {
            oldElem.r.value = undefined;
        }
        reconcileChildren(oldElem as HTMLElementElem, newElem as HTMLElementElem);
    } else if (oldElem.p !== newElem.p) {
        (oldElem.d as Text).data = newElem.p;
    }
}

export let callComponentFuncAndReconcile = (oldElem: ComponentElem, newElem: ComponentElem) => {
    let newElemVdom = callComponentFunc(newElem);
    reconcile(oldElem.v!, newElemVdom);
    newElem.v = newElemVdom;
};

let setListenerAttr = (dom: HTMLElement, attr: string, prop: any) => {
    if (!attr.indexOf('on')) {
        // @ts-expect-error
        dom[attr] = prop;
        return 1;
    }
}

export let setAttr = (dom: HTMLElement, attr: string, prop: any) => {
    if (!setListenerAttr(dom, attr, prop)) {
        dom.setAttribute(attr, prop);
    }
};

let moveBefore = (parent: ParentNode, newChdNextKey: string | undefined, oldChdKey: string | undefined, currDomNode: ChildNode, movingDomNode: ChildNode) => {
    let oldPos = movingDomNode.nextSibling;
    parent.insertBefore(movingDomNode, currDomNode);
    if (currDomNode !== parent.lastChild && newChdNextKey !== oldChdKey) {
        parent.insertBefore(currDomNode, oldPos);
    }
}

type ChilrenMap = { [key: string]: Elem<any> };

let reconcileChildren = (oldElem: HTMLElementElem, newElem: HTMLElementElem) => {
    let newChn = newElem.c ?? [];
    let oldChn = oldElem.c ?? [];
    let newLength = newChn.length;
    let oldLength = oldChn.length;
    let parentDom = newElem.d;
    if (!newLength && oldLength) {
        parentDom.textContent = '';
        oldChn.forEach(teardown);
        return;
    }
    let start = 0;
    
    // prefix
    while (
        start < newLength &&
        start < oldLength &&
        (!newChn[start].k || newChn[start].k === oldChn[start].k)
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
        let oldChd = oldChn[i];
        let oldKey = oldChd.k;
        if (oldKey && (!newChn[i] || oldKey !== newChn[i].k)) {
            oldMap[oldKey] = oldChd;
        }
    }
    
    let chNodes = parentDom.childNodes;
    while (start <= newLength) {
        let newChd = newChn[start];
        let oldChd = oldChn[start];
        if (!oldChd) {
            parentDom.appendChild(createDom(newChd));
        } else if (oldChd.k === newChd.k) {
            reconcile(oldChd, newChd);
        } else {
            let mappedOld = oldMap[newChd.k!];
            let chdDom = chNodes[start];
            if (mappedOld) {
                let oldDom = getDom(mappedOld);
                if (chdDom !== oldDom) {
                    moveBefore(parentDom, newChn[start + 1]?.k, oldChd.k, chdDom, oldDom);
                }
                reconcile(mappedOld, newChd);
                delete oldMap[newChd.k!];
            } else {
                moveBefore(parentDom, newChn[start + 1]?.k, oldChd.k, chdDom, createDom(newChd));
            }
        }
        start++;
    }

    for (let key in oldMap) teardown(oldMap[key], -1);
}
