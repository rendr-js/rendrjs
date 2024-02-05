import { Dispatch, SetStateAction, UpdateStateAction } from './hooks.js';
import { ComponentElem } from './elem.js';
import { callComponentFuncAndReconcile } from './reconcile.js';

export type AtomSelector<T, R> = (state: T) => R

export interface Atom<T> {
    v: T // state
    u: Dispatch<SetStateAction<T>> // update atom state
    r: () => void // reconcile all subscribers
    c: Set<ComponentElem> // component subscribers
    s: Map<ComponentElem, [any, AtomSelector<any, any>][]> // selectors subscribed to this atom
}

export interface AtomOptions<T> {
    watch?: (prevState: T, newState: T) => void
}

export let createAtom = <T>(initialValue: T, options?: AtomOptions<T>): Atom<T> => {
    let atom: Atom<T> = {
        v: initialValue,
        u: action => {
            let oldState = atom.v;
            atom.v = typeof action === 'function' ? (action as UpdateStateAction<T>)(oldState) : action;
            if (oldState !== atom.v) {
                options?.watch?.(oldState, atom.v);
                queueMicrotask(atom.r);
            }
        },
        r: () => updateAtomSubscribers(atom),
        c: new Set(),
        s: new Map(),
    };
    return atom;
};

let updateAtomSubscribers = <T>(atom: Atom<T>): void => {
    for (let component of [...atom.c.keys()]) {
        if (atom.c.has(component)) {
            callComponentFuncAndReconcile(component, component);
        }
    }
    for (let [component, selects] of [...atom.s.entries()]) {
        for (let i = selects.length - 1; i >= 0;) {
            let [selected, selector] = selects[i--];
            if (selected !== selector(atom.v)) {
                callComponentFuncAndReconcile(component, component);
                break;
            }
        }
    }
};
