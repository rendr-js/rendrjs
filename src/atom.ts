import { Dispatch, SetStateAction, isUpdater } from './hooks';
import { ComponentElem } from './elem';
import { callComponentFuncAndReconcile } from './reconcile';
import { isFunction, queueTask, typeOf } from './utils';

export interface Atom<T> {
    s: T // state
    u: Dispatch<SetStateAction<T>> // update atom state
    c: Set<ComponentElem> // component subscribers
    a: Set<Atom<any> | ReadonlyAtom<any>> // atoms subscribed to this atom
    r: () => void // reconsile all subscribers
}

interface Deriver<T> {
    d: AtomDerivation<T> // state derivation
}

export type AtomGetter = <A>(atom: Atom<A> | ReadonlyAtom<A>) => A;
export type ReadonlyAtom<T> = Omit<Atom<T>, 'u'> & Deriver<T>;
export type AtomDerivation<T> = (get: AtomGetter) => T;

type CreateAtom<T> = {
    (derivation: AtomDerivation<T>): ReadonlyAtom<T>
    (initialValue: T): Atom<T>
};

export let createAtom: CreateAtom<any> = (config: any): any => isFunction(config) ? createDerivedAtom(config) : createStandardAtom(config);

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
};
