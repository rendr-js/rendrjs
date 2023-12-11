import { Dispatch, SetStateAction, isUpdater } from './hooks.js';
import { ComponentElem } from './elem.js';
import { callComponentFuncAndReconcile } from './reconcile.js';

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

export var createAtom: CreateAtom = (config: any, options?: any): any => typeof config === 'function' ? createDerivedAtom(config, options) : createStandardAtom(config, options);

var createStandardAtom = <T>(initialValue: T, options?: AtomOptions<T>): Atom<T> => {
    var atom: Atom<T> = {
        s: initialValue,
        u: action => {
            var oldState = atom.s;
            atom.s = isUpdater(action) ? action(oldState) : action;
            if (oldState !== atom.s) {
                options?.watch?.(oldState, atom.s);
                queueMicrotask(atom.r);
            }
        },
        r: () => updateAtomSubscribers(atom),
        c: new Set(),
        a: new Set(),
        f: new Map(),
    };
    return atom;
};

var createDerivedAtom = <T>(derivation: AtomDerivation<T>, options?: AtomOptions<T>): ReadonlyAtom<T> => {
    var atom: ReadonlyAtom<T> = {
        s: null as T,
        d: derivation,
        r: null as unknown as () => void,
        c: new Set(),
        a: new Set(),
        f: new Map(),
    };
    var getter: AtomGetter = <A>(a: Atom<A> | ReadonlyAtom<A>): A => {
        a.a.add(atom);
        return a.s;
    }
    atom.s = derivation(getter);
    atom.r = () => {
        var oldState = atom.s;
        atom.s = atom.d(getter);
        if (atom.s !== oldState) {
            options?.watch?.(oldState, atom.s);
            updateAtomSubscribers(atom);
        }
    }
    return atom;
};

var updateAtomSubscribers = <T>(atom: Atom<T> | ReadonlyAtom<T>): void => {
    for (var component of [...atom.c.keys()]) {
        if (atom.c.has(component)) {
            callComponentFuncAndReconcile(component, component);
        }
    }
    atom.a.forEach(a => a.r());
    for (var [component, selects] of [...atom.f.entries()]) {
        for (var i = selects.length - 1; i >= 0; i--) {
            var [selected, selector] = selects[i];
            var newSelected = selector(atom.s);
            if (selected !== newSelected) {
                callComponentFuncAndReconcile(component, component);
            }
        }
    }
};
