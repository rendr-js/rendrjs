import { ComponentElem, createDom, Elem, callComponentFunc, TEXT_NODE_TYPE } from './elem.js';
import { appendChild, areDepsEqual, deleteObjectProperty, insertBefore, isString, length, remove, removeAttribute, setRefValue, setRef, truncate, undef, forEach, STATIC_EMPTY_ARRAY } from './utils.js';

type HTMLElementElem = Elem & { d: HTMLElement };

var teardown = (elem: Elem) => {
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

var getDom = (elem: Elem): ChildNode => {
    while (elem.v) {
        elem = elem.v!;
    }
    return elem.d!;
};

export var reconcile = (oldElem: Elem, newElem: Elem): void => {
    newElem.u = false;
    var oldDom = oldElem.d;
    var newProps = newElem.p;
    var oldProps = oldElem.p;
    if (oldElem.t !== newElem.t) {
        teardown(oldElem);
        getDom(oldElem).replaceWith(createDom(newElem));
    } else if (isString(oldElem.t)) {
        newElem.d = oldDom;
        if (oldElem.t !== TEXT_NODE_TYPE) {
            for (var attr in { ...newProps, ...oldProps }) {
                if (newProps[attr] !== oldProps[attr]) {
                    if (newProps[attr] === undef) {
                        removeAttribute(oldDom as Element, attr);
                    } else {
                        setAttr(oldDom as HTMLElement, attr, newProps[attr]);
                    }
                }
            }
            if (newElem.r) {
                setRefValue(newElem.r, oldDom);
            } else {
                setRef(oldElem, undef);
            }
            reconcileChildren(oldElem as HTMLElementElem, newElem as HTMLElementElem, oldDom as Element);
        } else if (oldProps !== newProps) {
            (oldDom as Text).data = newProps;
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

export var callComponentFuncAndReconcile = (oldElem: ComponentElem, newElem: ComponentElem) => {
    var newElemVdom = callComponentFunc(newElem);
    reconcile(oldElem.v!, newElemVdom);
    newElem.v = newElemVdom;
};

export var setAttr = (dom: HTMLElement, attr: string, prop: any) => {
    if (!prop) {
        removeAttribute(dom, attr);
    } else if (attr === 'class') {
        dom.className = prop;
    } else {
        // @ts-expect-error
        dom[attr] = prop;
    }
};

var moveBefore = (parent: ParentNode, newChn: Elem[], oldChn: Elem[], i: number, currDomNode: ChildNode, movingDomNode: ChildNode) => {
    var oldPos = movingDomNode.nextSibling;
    insertBefore(parent, currDomNode, movingDomNode);
    if (currDomNode !== parent.lastChild && newChn[i+1]?.k !== oldChn[i]?.k) {
        insertBefore(parent, oldPos, currDomNode);
    }
}

type ChilrenMap = { [key: string]: Elem<any> };

var reconcileChildren = (oldElem: HTMLElementElem, newElem: HTMLElementElem, dom: Element) => {
    var newChn = newElem.c ?? STATIC_EMPTY_ARRAY;
    var oldChn = oldElem.c ?? STATIC_EMPTY_ARRAY;
    var newLength = length(newChn);
    var oldLength = length(oldChn);
    if (newLength === 0 && oldLength > 0) {
        (getDom(oldElem) as HTMLElement).innerHTML = '';
        forEach(oldChn, teardown);
        return;
    }
    var start = 0;
    
    // prefix
    while (
        start < newLength &&
        start < oldLength &&
        (newChn[start].k === undef || newChn[start].k === oldChn[start].k)
    ) {
        reconcile(oldChn[start], newChn[start]);
        start++;
    }
    if (start >= newLength) {
        while (start < oldLength) {
            remove(getDom(oldChn[start]));
            teardown(oldChn[start]);
            start++;
        }
        return;
    }

    // suffix
    oldLength--;
    newLength--;
    while (
        newLength > start &&
        oldLength >= start &&
        (newChn[newLength].k === undef || newChn[newLength].k === oldChn[oldLength].k)
    ) {
        reconcile(oldChn[oldLength--], newChn[newLength--]);
    }

    var oldMap = {} as ChilrenMap;
    for (var i = start; i <= oldLength; i++) {
        if (oldChn[i].k && (!newChn[i] || oldChn[i].k !== newChn[i].k)) {
            oldMap[oldChn[i].k!] = oldChn[i];
        }
    }
    
    while (start <= newLength) {
        var newChd = newChn[start];
        var newKey = newChd.k;
        var oldChd = oldChn[start];
        var chdDom = dom.childNodes[start];
        var mappedOld = oldMap[newKey!];
        if (!oldChd) {
            appendChild(dom, createDom(newChd));
        } else if (mappedOld) {
            if (chdDom !== mappedOld.d) {
                moveBefore(dom, newChn, oldChn, start, chdDom, getDom(mappedOld));
            }
            reconcile(mappedOld, newChd);
            deleteObjectProperty(oldMap, newKey!);
        } else if (oldChd.k === newKey) {
            reconcile(oldChd, newChd);
        } else {
            moveBefore(dom, newChn, oldChn, start, chdDom, createDom(newChd));
        }
        start++;
    }

    for (var key in oldMap) {
        remove(getDom(oldMap[key]));
        teardown(oldMap[key]);
    }
}
