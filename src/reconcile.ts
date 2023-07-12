import { ComponentElem, createDom, Elem, callComponentFunc, TEXT_NODE_TYPE } from './elem';
import { areDepsEqual, isString } from './utils';

type HTMLElementElem = Elem & { d: HTMLElement };

let teardown = (elem: Elem) => {
    if (elem.r) elem.r.current = undefined;
    if (elem.v) {
        if (elem.h) {
            for (let i = elem.h.length - 1; i >= 0; i--) {
                elem.h[i]?.t?.();
            }
        }
        teardown(elem.v);
    } else if (elem.c) {
        for (let i = elem.c.length - 1; i >= 0; i--) {
            teardown(elem.c[i]);
        }
    }
}

let unmount = (elem: Elem): void => {
    elem.u = true;
}

let getDom = (elem: Elem): ChildNode => {
    while (elem.v) {
        elem = elem.v!;
    }
    return elem.d!;
};

export let reconcile = (oldElem: Elem, newElem: Elem): void => {
    newElem.u = false;
    if (oldElem.t !== newElem.t) {
        teardown(oldElem);
        getDom(oldElem).replaceWith(createDom(newElem));
        unmount(oldElem);
        return;
    }
    if (isString(oldElem.t)) {
        newElem.d = oldElem.d;
        if (oldElem.t === TEXT_NODE_TYPE) return reconcileTextElems(oldElem, newElem);
        reconcileVdomElems(oldElem as HTMLElementElem, newElem as HTMLElementElem);
        return;
    }
    reconcileComponents(oldElem as ComponentElem, newElem as ComponentElem);
}

let reconcileTextElems = (oldElem: Elem, newElem: Elem) => {
    if (oldElem.p !== newElem.p) {
        (oldElem.d as Text).data = newElem.p;
    }
};

// TODO: are nested .h hooks transfered or do they need to be?

let reconcileComponents = (oldElem: ComponentElem, newElem: ComponentElem) => {
    newElem.h = oldElem.h;
    if (oldElem.m && newElem.m && areDepsEqual(oldElem.m, newElem.m)) {
        newElem.v = oldElem.v;
        return;
    }
    callComponentFuncAndReconcile(oldElem, newElem);
}

export let callComponentFuncAndReconcile = (oldElem: ComponentElem, newElem: ComponentElem) => {
    let newElemVdom = callComponentFunc(newElem);
    reconcile(oldElem.v!, newElemVdom);
    newElem.v = newElemVdom;
};

let reconcileVdomElems = (oldElem: HTMLElementElem, newElem: HTMLElementElem) => {
    reconcileAttributes(oldElem, newElem);
    reconcileReference(oldElem, newElem);
    reconcileChildren(oldElem, newElem);
}

let CLASS_NAME_ATTR_NAME = 'className';

export let setAttr = (dom: Element, attr: string, prop: any) => {
    if (attr === 'style') {
        for (let styleProp in prop) {
            // @ts-expect-error
            dom.style[styleProp] = prop[styleProp];
        }
    } else if (prop) {
        if (attr === CLASS_NAME_ATTR_NAME || attr.startsWith('on')) {
            // @ts-expect-error
            dom[attr] = prop;
        } else {
            dom.setAttribute(attr, prop);
        }
    } else {
        if (attr === CLASS_NAME_ATTR_NAME || attr.startsWith('on')) {
            // @ts-expect-error
            dom[attr] = prop;
        } else {
            dom.removeAttribute(attr);
        }
    }
};

let reconcileAttributes = (oldElem: HTMLElementElem, newElem: HTMLElementElem) => {
    for (let attr in newElem.p) {
        let prop = newElem.p[attr];
        if (prop !== oldElem.p[attr]) {
            setAttr(oldElem.d, attr, prop);
        }
    }
    for (let attr in oldElem.p) {
        if (newElem.p[attr] === undefined) {
            if (attr === CLASS_NAME_ATTR_NAME) {
                oldElem.d.removeAttribute('class');
            } else {
                oldElem.d.removeAttribute(attr);
            }
        }
    }
}

let reconcileReference = (oldElem: Elem, newElem: Elem) => {
    if (newElem.r) {
        newElem.r.current = oldElem.d;
    } else if (oldElem.r) {
        oldElem.r.current = undefined;
    }
}

let moveBefore = (parent: ParentNode, newChn: Elem[], oldChn: Elem[], i: number, currDomNode: ChildNode, movingDomNode: ChildNode) => {
    let oldPos = movingDomNode.nextSibling;
    parent.insertBefore(movingDomNode, currDomNode);
    if (newChn[i+1]?.k !== oldChn[i]?.k) {
        if (oldPos) {
            parent.insertBefore(currDomNode, oldPos);
        } else if (currDomNode !== parent.lastChild) {
            parent.appendChild(currDomNode);
        }
    }
}

let reconcileChildren = (oldElem: HTMLElementElem, newElem: HTMLElementElem) => {
    let newChn = newElem.c ?? [];
    let oldChn = oldElem.c ?? [];
    let start = 0;
    let oldLength = oldChn.length;
    let newLength = newChn.length;
    
    // prefix
    for (
        let oldChd = oldChn[start], newChd = newChn[start]
    ;
        start < newLength &&
        start < oldLength &&
        (newChd.k === undefined || newChd.k === oldChd.k)
    ;
        oldChd = oldChn[start], newChd = newChn[start]
    ) {
        reconcile(oldChd, newChd);
        start++;
    }

    if (start >= newLength) {
        for (let i = start; i < oldLength; i++) {
            teardown(oldChn[i]);
            getDom(oldChn[i]).remove()
        }
        return;
    }

    // suffix
    oldLength--;
    newLength--;
    for (
        let oldChd = oldChn[oldLength], newChd = newChn[newLength]
    ;
        newLength > start &&
        oldLength >= start &&
        (newChd.k === undefined || newChd.k === oldChd.k)
    ;
        oldChd = oldChn[oldLength], newChd = newChn[newLength]
    ) {
        reconcile(oldChd, newChd);
        oldLength--;
        newLength--;
    }

    let oldMap = new Map<string, Elem>();
    for (let i = start; i <= oldLength; i++) {
        let oldChd = oldChn[i];
        let newChd = newChn[i];
        if (oldChd.k && (!newChd || oldChd.k !== newChd.k)) {
            oldMap.set(oldChd.k, oldChd);
        }
    }

    for (; start <= newLength; start++) {
        let newChd = newChn[start];
        if (!oldChn[start]) {
            oldElem.d.appendChild(createDom(newChd));
            continue;
        }
        let currDomNode = oldElem.d.childNodes[start]; // with frags, start + offset
        // if (!oldMap.size) {
        //     moveBefore(oldElem.d, newChn, oldChn, start, currDomNode, createDom(newChd));
        //     continue;
        // }
        let oldChd = oldMap.get(newChd.k!);
        if (oldChd) {
            oldMap.delete(newChd.k!);
            if (currDomNode !== oldChd.d!) {
                moveBefore(oldElem.d, newChn, oldChn, start, currDomNode, getDom(oldChd));
            }
            reconcile(oldChd, newChd);
            continue;
        }
        oldChd = oldChn[start];
        if (oldChd && oldChd.k === newChd.k) {
            reconcile(oldChd, newChd);
            continue;
        }
        moveBefore(oldElem.d, newChn, oldChn, start, currDomNode, createDom(newChd));
    }

    oldMap.forEach(v => {
        teardown(v);
        getDom(v).remove();
    });
}
