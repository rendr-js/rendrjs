import { Atom, ReadonlyAtom } from './atom';
import { ComponentElem, Elem, callComponentFunc } from './elem';
import { reconcile } from './reconcile';
import { areDepsEqual, getRefValue, illegal, isFunction, length, queueTask, setRefValue, setRef, truncateElemQ, undef, STATIC_EMPTY_ARRAY } from './utils';

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

export let isUpdater = <T>(value: SetStateAction<T>): value is UpdateStateAction<T> => isFunction(value);

export let useCurrentElem = (): ComponentElem => {
    if (!current.e) throw illegal('hook');
    return current.e;
};

let getHookData = <T extends EffectRecord[] | MemoRecord[] | any[]>(): [T, number, ComponentElem] => {
    let elem = useCurrentElem();
    elem.h ??= [];
    return [elem.h as T, elem.i!++, elem];
};

export let useState = <S>(initialValue: S): [S, Dispatch<SetStateAction<S>>] => {
    let [states, cursor] = getHookData();
    if (length(states) <= cursor) {
        states.push(initialValue);
    }
    let ref = useRef(current.e!);
    setRefValue(ref, current.e!);
    let setState = useCallback((action: SetStateAction<S>) => {
        let elem = getRefValue(ref);
        if (elem.u) throw illegal('set state');
        let newValue: S = isUpdater(action) ? action(states[cursor]) : action;
        if (states[cursor] !== newValue) {
            states[cursor] = newValue;
            elem.q ??= [];
            elem.q!.push(callComponentFunc(elem));
            queueTask(() => flush(elem));
        }
    }, STATIC_EMPTY_ARRAY);
    return [states[cursor], setState];
};

export let useEffect = (effect: () => (void | (() => void)), deps: any[]) => {
    let [effects, cursor, elem] = getHookData();
    if (length(effects) <= cursor) {
        let ef = { d: deps } as EffectRecord;
        effects.push(ef);
        queueTask(() => {
            if (!elem.u) ef.t = effect();
        })
        return;
    }
    let ef = effects[cursor] as EffectRecord;
    if (!areDepsEqual(deps, ef.d)) {
        ef.d = deps;
        queueTask(() => {
            ef.t?.();
            if (!elem.u) ef.t = effect();
        });
    }
};

export let useImmediateEffect = (effect: () => (void | (() => void)), deps: any[]) => {
    let [effects, cursor] = getHookData();
    if (length(effects) <= cursor) {
        effects.push({ d: deps, t: effect() });
        return;
    }
    let ef = effects[cursor] as EffectRecord;
    if (!areDepsEqual(deps, ef.d)) {
        ef.d = deps;
        ef.t?.();
        ef.t = effect();
    }
};

export let useDeferredEffect = (effect: () => (void | (() => void)), deps: any[]) => {
    let first = useRef(false);
    useEffect(() => {
        if (!getRefValue(first)) {
            setRefValue(first, true);
            return;
        }
        effect();
    }, deps);
};

export let useMemo = <T>(create: () => T, deps: any[]): T => {
    let [memos, cursor] = getHookData();
    if (length(memos) <= cursor) {
        let value = create();
        memos.push({
            d: deps,
            v: value,
        } as MemoRecord);
        return value;
    }
    let memo = memos[cursor] as MemoRecord;
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

export let useRef = <T>(initialValue: T): Ref<T> => useMemo<Ref<T>>(() => ({ value: initialValue }), STATIC_EMPTY_ARRAY);

let flush = (elem: Elem) => {
    let tip = elem.q?.pop();
    if (tip) {
        truncateElemQ(elem);
        reconcile(elem.v!, tip);
        elem.v = tip;
    }
};

export let current: { e: ComponentElem | undefined } = {
    e: undef,
};

let useAtomSubscription = <T>(atom: Atom<T> | ReadonlyAtom<T>) => {
    let elem = useCurrentElem();
    useImmediateEffect(() => {
        atom.c.add(elem);
        return () => atom.c.delete(elem);
    }, [elem]);
};

export let useAtom = <T>(atom: Atom<T>): [T, Dispatch<SetStateAction<T>>] => {
    useAtomSubscription(atom);
    return [atom.s, atom.u];
};

export let useAtomSetter = <T>(atom: Atom<T>): Dispatch<SetStateAction<T>> => atom.u;

export let useAtomValue = <T>(atom: Atom<T> | ReadonlyAtom<T>): T => {
    useAtomSubscription(atom);
    return atom.s;
};

export let useAtomSelector = <T, R>(atom: Atom<T> | ReadonlyAtom<T>, selector: (state: T) => R): R => {
    let elem = useCurrentElem();
    useImmediateEffect(() => {
        let selected = selector(atom.s);
        let selects = atom.f.get(elem);
        if (!selects) {
            atom.f.set(elem, [[selected, selector]]);
        } else {
            selects.push([selected, selector]);
        }
        return () => atom.c.delete(elem);
    }, [elem, selector]);
    return selector(atom.s);
};
