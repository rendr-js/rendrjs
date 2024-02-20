import { Atom } from './atom.js';
import { ComponentElem, Elem, callComponentFunc } from './elem.js';
import { reconcile } from './reconcile.js';
import { areDepsEqual } from './utils.js';

export type UpdateStateAction<S> = (state: S) => S;
export type SetStateAction<S> = S | UpdateStateAction<S>;
export type Dispatch<A> = (value: A) => void;

export interface EffectRecord {
    d: any[]
    t?: (() => void) | void
}

export interface MemoRecord {
    d: any[]
    v: any
}

let getHookData = <T extends EffectRecord[] | MemoRecord[] | any[]>(): [T, number, ComponentElem] => {
    let elem = current.e!;
    elem.h ??= [];
    return [elem.h as T, elem.i!++, elem];
};

export let useState = <S>(initialValue: S): [S, Dispatch<SetStateAction<S>>] => {
    let [states, cursor, elem] = getHookData();
    if (states.length <= cursor) {
        states.push(initialValue);
    }
    let ref = useRef(elem);
    ref.value = elem;
    let setState = (action: SetStateAction<S>) => {
        let elem = ref.value;
        if (elem.u) throw 'bad set state';
        let newValue: S = typeof action === 'function' ? (action as UpdateStateAction<S>)(states[cursor]) : action;
        if (states[cursor] !== newValue) {
            states[cursor] = newValue;
            elem.q ??= [];
            elem.q!.push(callComponentFunc(elem));
            queueMicrotask(() => {
                let tip = elem.q!.pop();
                if (tip) {
                    elem.q!.length = 0;
                    reconcile(elem.v!, tip);
                    elem.v = tip;
                }
            });
        }
    };
    return [states[cursor], setState];
};

export let useEffect = (effect: () => (void | (() => void)), deps: any[]) => {
    let [effects, cursor, elem] = getHookData();
    let record = effects[cursor] as EffectRecord;
    if (!record) {
        record = { d: deps };
        effects.push(record);
        queueMicrotask(() => {
            if (!elem.u) record.t = effect();
        });
    } else if (!areDepsEqual(deps, record.d)) {
        record.d = deps;
        queueMicrotask(() => {
            record.t?.();
            if (!elem.u) record.t = effect();
        });
    }
};

export let useImmediateEffect = (effect: () => (void | (() => void)), deps: any[]) => {
    let [effects, cursor] = getHookData();
    let record = effects[cursor] as EffectRecord;
    if (!record) {
        record = {
            d: deps,
            t: effect(),
        };
        effects.push(record);
    } else if (!areDepsEqual(deps, record.d)) {
        record.t?.();
        record.d = deps;
        record.t = effect();
    }
};

export let useMemo = <T>(create: () => T, deps: any[]): T => {
    let [memos, cursor] = getHookData();
    let memo = memos[cursor] as MemoRecord | undefined;
    if (!memo) {
        memo = {
            v: create(),
            d: deps,
        };
        memos.push(memo);
        return memo.v;
    }
    if (!areDepsEqual(deps, memo.d)) {
        memo.d = deps;
        memo.v = create();
    }
    return memo.v;
};

export let useCallback = <T extends Function>(cb: T, deps: any[]): T => useMemo(() => cb, deps);

export interface Ref<T = any> {
    value: T
}

export let useRef = <T>(initialValue: T): Ref<T> => useMemo<Ref<T>>(() => ({ value: initialValue }), []);

export let current: { e: ComponentElem | undefined } = {
    e: undefined,
};

let useAtomSubscription = <T>(atom: Atom<T>) => {
    let elem = current.e!;
    useImmediateEffect(() => {
        atom.c.add(elem);
        return () => atom.c.delete(elem);
    }, [elem]);
};

export let useAtom = <T>(atom: Atom<T>): [T, Dispatch<SetStateAction<T>>] => {
    useAtomSubscription(atom);
    return [atom.v, atom.u];
};

export let useAtomSetter = <T>(atom: Atom<T>): Dispatch<SetStateAction<T>> => atom.u;

export let useAtomValue = <T>(atom: Atom<T>): T => {
    useAtomSubscription(atom);
    return atom.v;
};

export let useAtomSelector = <T, R>(atom: Atom<T>, selector: (state: T) => R): R => {
    let elem = current.e!;
    let selected = selector(atom.v);
    useImmediateEffect(() => {
        let selects = atom.s.get(elem);
        if (!selects) {
            atom.s.set(elem, [[selected, selector]]);
        } else {
            selects.push([selected, selector]);
        }
        return () => atom.s.delete(elem);
    }, [elem, selector, selected]);
    return selected;
};
