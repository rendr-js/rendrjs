import { ComponentElem, createDom, Elem, callComponentFunc, TEXT_NODE_TYPE } from './elem';
import { appendChild, areDepsEqual, deleteObjectProperty, insertBefore, isString, length, remove, removeAttribute, setRefValue, setRef, truncateElemQ, undef, forEach, indexOf } from './utils';

type HTMLElementElem = Elem & { d: HTMLElement };

let teardown = (elem: Elem) => {
    setRef(elem, undef);
    if (elem.v) {
        elem.u = true;
        truncateElemQ(elem);
        forEach(elem.h, h => h.t?.());
        teardown(elem.v);
    } else {
        forEach(elem.c, teardown);
    }
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
    } else if (isString(oldElem.t)) {
        newElem.d = oldElem.d;
        if (oldElem.t === TEXT_NODE_TYPE) {
            if (oldElem.p !== newElem.p) {
                (oldElem.d as Text).data = newElem.p;
            }
        } else {
            for (let attr in newElem.p) {
                let newAttrVal = newElem.p[attr];
                if (newAttrVal !== oldElem.p[attr]) {
                    setAttr((oldElem as HTMLElementElem).d, attr, newAttrVal);
                }
            }
            for (let attr in oldElem.p) {
                if (newElem.p[attr] === undef) {
                    removeAttribute((oldElem as HTMLElementElem).d, attr);
                }
            }
            if (newElem.r) {
                setRefValue(newElem.r, oldElem.d);
            } else {
                setRef(oldElem, undef);
            }
            reconcileChildren(oldElem as HTMLElementElem, newElem as HTMLElementElem);
        }
    } else {
        newElem.h = oldElem.h;
        if (oldElem.m && newElem.m && areDepsEqual(oldElem.m, newElem.m)) {
            newElem.v = oldElem.v;
        } else {
            truncateElemQ(oldElem);
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
    if (attr === 'class') {
        dom.className = prop;
    } else if (prop || !indexOf(attr, 'on') || !indexOf(attr, 'aria')) {
        // @ts-expect-error
        dom[attr] = prop;
    } else {
        removeAttribute(dom, attr);
    }
};

let moveBefore = (parent: ParentNode, newChn: Elem[], oldChn: Elem[], i: number, currDomNode: ChildNode, movingDomNode: ChildNode) => {
    let oldPos = movingDomNode.nextSibling;
    insertBefore(parent, currDomNode, movingDomNode);
    if (newChn[i+1]?.k !== oldChn[i]?.k) {
        if (oldPos) {
            insertBefore(parent, oldPos, currDomNode);
        } else if (currDomNode !== parent.lastChild) {
            appendChild(parent, currDomNode);
        }
    }
}

let reconcileChildren = (oldElem: HTMLElementElem, newElem: HTMLElementElem) => {
    let newChn = newElem.c ?? [];
    let oldChn = oldElem.c ?? [];
    let start = 0;
    let oldLength = length(oldChn);
    let newLength = length(newChn);
    
    // prefix
    for (
        let oldChd = oldChn[start], newChd = newChn[start]
    ;
        start < newLength &&
        start < oldLength &&
        (newChd.k === undef || newChd.k === oldChd.k)
    ;
        oldChd = oldChn[start], newChd = newChn[start]
    ) {
        reconcile(oldChd, newChd);
        start++;
    }

    if (start >= newLength) {
        for (let i = start; i < oldLength; i++) {
            teardown(oldChn[i]);
            remove(getDom(oldChn[i]));
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
        (newChd.k === undef || newChd.k === oldChd.k)
    ;
        oldChd = oldChn[oldLength], newChd = newChn[newLength]
    ) {
        reconcile(oldChd, newChd);
        oldLength--;
        newLength--;
    }

    let oldMap: { [key: string]: Elem<any> } = {};
    for (let i = start; i <= oldLength; i++) {
        let oldChd = oldChn[i];
        let newChd = newChn[i];
        if (oldChd.k && (!newChd || oldChd.k !== newChd.k)) {
            oldMap[oldChd.k] = oldChd;
        }
    }

    for (; start <= newLength; start++) {
        let newChd = newChn[start];
        if (!oldChn[start]) {
            appendChild(oldElem.d, createDom(newChd));
            continue;
        }
        let currDomNode = oldElem.d.childNodes[start];
        let oldChd = oldMap[newChd.k!];
        if (oldChd) {
            deleteObjectProperty(oldMap, newChd.k!);
            if (currDomNode !== oldChd.d!) {
                moveBefore(oldElem.d, newChn, oldChn, start, currDomNode, getDom(oldChd));
            }
            reconcile(oldChd, newChd);
        } else {
            oldChd = oldChn[start];
            if (oldChd && oldChd.k === newChd.k) {
                reconcile(oldChd, newChd);
            } else {
                moveBefore(oldElem.d, newChn, oldChn, start, currDomNode, createDom(newChd));
            }
        }
    }

    for (let key in oldMap) {
        teardown(oldMap[key]);
        remove(getDom(oldMap[key]));
    }
}
