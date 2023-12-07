import { ComponentElem, createDom, Elem, callComponentFunc, TEXT_NODE_TYPE } from './elem';
import { appendChild, areDepsEqual, deleteObjectProperty, insertBefore, isString, length, remove, removeAttribute, setRefValue, setRef, truncate, undef, forEach, STATIC_EMPTY_ARRAY } from './utils';

type HTMLElementElem = Elem & { d: HTMLElement };

let teardown = (elem: Elem) => {
    setRef(elem, undef);
    if (elem.v) {
        elem.u = true;
        truncate(elem.q);
        forEach(elem.h, h => h?.t?.());
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
                if (newElem.p[attr] !== oldElem.p[attr]) {
                    setAttr((oldElem as HTMLElementElem).d, attr, newElem.p[attr]);
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
            truncate(oldElem.q);
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
    if (prop) {
        if (attr === 'class') {
            dom.className = prop;
        } else {
            // @ts-expect-error
            dom[attr] = prop;
        }
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

type ChilrenMap = { [key: string]: Elem<any> };

let reconcileChildren = (oldElem: HTMLElementElem, newElem: HTMLElementElem) => {
    let newChn = newElem.c ?? STATIC_EMPTY_ARRAY;
    let oldChn = oldElem.c ?? STATIC_EMPTY_ARRAY;
    let newLength = length(newChn);
    let oldLength = length(oldChn);
    if (newLength === 0 && oldLength > 0) {
        (getDom(oldElem) as HTMLElement).innerHTML = '';
        forEach(oldChn, teardown);
        return;
    }
    let start = 0;
    
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
            remove(getDom(oldChn[i]));
            teardown(oldChn[i]);
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

    let oldMap = {} as ChilrenMap;
    for (let i = start; i <= oldLength; i++) {
        if (oldChn[i].k && (!newChn[i] || oldChn[i].k !== newChn[i].k)) {
            oldMap[oldChn[i].k!] = oldChn[i];
        }
    }
    let currDomNode: ChildNode;
    for (; start <= newLength; start++) {
        let newChd = newChn[start];
        if (!oldChn[start]) {
            appendChild(oldElem.d, createDom(newChd));
            continue;
        }
        currDomNode = oldElem.d.childNodes[start];
        if (oldMap[newChd.k!]) {
            if (currDomNode !== oldMap[newChd.k!].d!) {
                moveBefore(oldElem.d, newChn, oldChn, start, currDomNode, getDom(oldMap[newChd.k!]));
            }
            reconcile(oldMap[newChd.k!], newChd);
            deleteObjectProperty(oldMap, newChd.k!);
        } else if (oldChn[start] && oldChn[start].k === newChd.k) {
            reconcile(oldChn[start], newChd);
        } else {
            moveBefore(oldElem.d, newChn, oldChn, start, currDomNode, createDom(newChd));
        }
    }

    for (let key in oldMap) {
        remove(getDom(oldMap[key]));
        teardown(oldMap[key]);
    }
}
