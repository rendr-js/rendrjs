import { Dispatch, SetStateAction, isUpdater } from './hooks.js';
import { ComponentElem } from './elem.js';
import { callComponentFuncAndReconcile } from './reconcile.js';
import { forEach, isFunction, length, queueTask } from './utils.js';

export type AtomSelector<T, R> = (state: T) => R

export interface Atom<T> {
    s: T // state
    u: Dispatch<SetStateAction<T>> // update atom state
    r: () => void // reconcile all subscribers
    c: Set<ComponentElem> // component subscribers
    a: Set<Atom<any> | ReadonlyAtom<any>> // atoms subscribed to this atom
    f: Map<ComponentElem, [any, AtomSelector<any, any>][]> // selectors subscribed to this atom
}

interface Deriver<T> {
    d: AtomDerivation<T> // state derivation
}

export type AtomGetter = <A>(atom: Atom<A> | ReadonlyAtom<A>) => A;
export type ReadonlyAtom<T> = Omit<Atom<T>, 'u'> & Deriver<T>;
export type AtomDerivation<T> = (get: AtomGetter) => T;

type CreateAtom = {
    <T>(derivation: AtomDerivation<T>, options?: AtomOptions<T>): ReadonlyAtom<T>
    <T>(initialValue: T, options?: AtomOptions<T>): Atom<T>
};

export interface AtomOptions<T> {
    watch?: (prevState: T, newState: T) => void
}

export let createAtom: CreateAtom = (config: any, options?: any): any => isFunction(config) ? createDerivedAtom(config, options) : createStandardAtom(config, options);

let createStandardAtom = <T>(initialValue: T, options?: AtomOptions<T>): Atom<T> => {
    let atom: Atom<T> = {
        s: initialValue,
        u: action => {
            let oldState = atom.s;
            atom.s = isUpdater(action) ? action(oldState) : action;
            if (oldState !== atom.s) {
                options?.watch?.(oldState, atom.s);
                queueTask(atom.r);
            }
        },
        r: () => updateAtomSubscribers(atom),
        c: new Set(),
        a: new Set(),
        f: new Map(),
    };
    return atom;
};

let createDerivedAtom = <T>(derivation: AtomDerivation<T>, options?: AtomOptions<T>): ReadonlyAtom<T> => {
    let atom: ReadonlyAtom<T> = {
        s: null as T,
        d: derivation,
        r: null as unknown as () => void,
        c: new Set(),
        a: new Set(),
        f: new Map(),
    };
    let getter: AtomGetter = <A>(a: Atom<A> | ReadonlyAtom<A>): A => {
        a.a.add(atom);
        return a.s;
    }
    atom.s = derivation(getter);
    atom.r = () => {
        let oldState = atom.s;
        atom.s = atom.d(getter);
        if (atom.s !== oldState) {
            options?.watch?.(oldState, atom.s);
            updateAtomSubscribers(atom);
        }
    }
    return atom;
};

let updateAtomSubscribers = <T>(atom: Atom<T> | ReadonlyAtom<T>): void => {
    for (let component of [...atom.c.keys()]) {
        if (atom.c.has(component)) {
            callComponentFuncAndReconcile(component, component);
        }
    }
    forEach<any>(atom.a, a => a.r());
    for (let [component, selects] of [...atom.f.entries()]) {
        for (let i = length(selects) - 1; i >= 0; i--) {
            let [selected, selector] = selects[i];
            let newSelected = selector(atom.s);
            if (selected !== newSelected) {
                callComponentFuncAndReconcile(component, component);
            }
        }
    }
};
