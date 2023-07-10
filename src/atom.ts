import { Dispatch, SetStateAction, isUpdater } from './hooks';
import { ComponentElem } from './elem';
import { callComponentFuncAndReconcile } from './reconcile';
import { isFunction, queueTask } from './utils';

export type AtomSelector<T, R> = (state: T) => R

export interface Atom<T> {
    s: T // state
    u: Dispatch<SetStateAction<T>> // update atom state
    r: () => void // reconsile all subscribers
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
    <T>(derivation: AtomDerivation<T>): ReadonlyAtom<T>
    <T>(initialValue: T): Atom<T>
};

export let createAtom: CreateAtom = (config: any): any => isFunction(config) ? createDerivedAtom(config) : createStandardAtom(config);

let createStandardAtom = <T>(initialValue: T): Atom<T> => {
    const atom: Atom<T> = {
        s: initialValue,
        u: action => {
            let oldState = atom.s;
            atom.s = isUpdater(action) ? action(oldState) : action;
            if (oldState === atom.s) {
                return;
            }
            queueTask(atom.r);
        },
        r: () => updateAtomSubscribers(atom),
        c: new Set(),
        a: new Set(),
        f: new Map(),
    };
    return atom;
};

let createDerivedAtom = <T>(derivation: AtomDerivation<T>): ReadonlyAtom<T> => {
    const atom: ReadonlyAtom<T> = {
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
    atom.a.forEach(a => a.r());
    for (let [component, selects] of [...atom.f.entries()]) {
        for (let i = selects.length - 1; i >= 0; i--) {
            let [selected, selector] = selects[i];
            let newSelected = selector(atom.s);
            if (selected !== newSelected) {
                callComponentFuncAndReconcile(component, component);
            }
        }
    }
};
