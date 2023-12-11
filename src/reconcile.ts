import { ComponentElem, createDom, Elem, callComponentFunc } from './elem.js';
import { areDepsEqual } from './utils.js';

type HTMLElementElem = Elem & { d: HTMLElement };

var teardown = (elem: Elem) => {
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

var getDom = (elem: Elem): ChildNode => {
    while (elem.v) {
        elem = elem.v!;
    }
    return elem.d!;
};

export var reconcile = (oldElem: Elem, newElem: Elem): void => {
    newElem.u = false;
    var oldDom = getDom(oldElem);
    var newProps = newElem.p;
    var oldProps = oldElem.p;
    if (oldElem.t !== newElem.t) {
        teardown(oldElem);
        oldDom.replaceWith(createDom(newElem));
    } else if (typeof oldElem.t === 'string') {
        newElem.d = oldDom;
        if (oldElem.t.length) {
            for (var attr in { ...newProps, ...oldProps }) {
                if (newProps[attr] !== oldProps[attr]) {
                    if (newProps[attr] === undefined) {
                        (oldDom as Element).removeAttribute(attr);
                    } else {
                        setAttr(oldDom as HTMLElement, attr, newProps[attr]);
                    }
                }
            }
            if (newElem.r) {
                newElem.r.value = oldDom;
            } else {
                if (oldElem.r) oldElem.r.value = undefined;
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
            if (oldElem.q) oldElem.q.length = 0;
            callComponentFuncAndReconcile(oldElem as ComponentElem, newElem as ComponentElem);
        }
    }
}

export var callComponentFuncAndReconcile = (oldElem: ComponentElem, newElem: ComponentElem) => {
    var newElemVdom = callComponentFunc(newElem);
    reconcile(oldElem.v!, newElemVdom);
    newElem.v = newElemVdom;
};


let CAP_LETTER_RE = new RegExp('[A-Z]', 'g')

let addDash = (m: string) => '-' + m.toLowerCase();
let camelTokebab = (s: string): string => {
  if (s !== s.toLowerCase()) {
    s = s.replace(CAP_LETTER_RE, addDash);
  }
  return s;
}

export var setAttr = (dom: HTMLElement, attr: string, prop: any) => {
    if (!prop) {
        dom.removeAttribute(camelTokebab(attr));
    // } else if (attr === 'class') {
    //     // dom.className = prop;
    //     dom.classList.add(prop);
    } else if (!attr.indexOf('on')) {
        // @ts-expect-error
        dom[attr] = prop;
    } else {
        dom.setAttribute(camelTokebab(attr), prop);
        
    }
};

var moveBefore = (parent: ParentNode, newChn: Elem[], oldChn: Elem[], i: number, currDomNode: ChildNode, movingDomNode: ChildNode) => {
    var oldPos = movingDomNode.nextSibling;
    parent.insertBefore(movingDomNode, currDomNode);
    if (currDomNode !== parent.lastChild && newChn[i+1]?.k !== oldChn[i]?.k) {
        parent.insertBefore(currDomNode, oldPos);
    }
}

type ChilrenMap = { [key: string]: Elem<any> };

var reconcileChildren = (oldElem: HTMLElementElem, newElem: HTMLElementElem, dom: Element) => {
    var newChn = newElem.c ?? [];
    var oldChn = oldElem.c ?? [];
    var newLength = newChn.length;
    var oldLength = oldChn.length;
    if (newLength === 0 && oldLength > 0) {
        (getDom(oldElem) as HTMLElement).innerHTML = '';
        oldChn.forEach(teardown);
        return;
    }
    var start = 0;
    
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
        while (start < oldLength) {
            getDom(oldChn[start]).remove();
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
        (newChn[newLength].k === undefined || newChn[newLength].k === oldChn[oldLength].k)
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

    for (var key in oldMap) {
        getDom(oldMap[key]).remove();
        teardown(oldMap[key]);
    }
}
