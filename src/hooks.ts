import { Atom, ReadonlyAtom } from './atom';
import { ComponentElem, Elem, callComponentFunc } from './elem';
import { reconcile } from './reconcile';
import { areDepsEqual, illegal, isFunction, queueTask } from './utils';

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
    if (!current.e) throw illegal('hook use');
    return current.e;
};

let getHookData = <T extends EffectRecord[] | MemoRecord[] | any[]>(): [T, number, ComponentElem] => {
    let elem = useCurrentElem();
    if (!elem.h) elem.h = [];
    return [elem.h as T, elem.i!++, elem];
};

export let useState = <S>(initialValue: S): [S, Dispatch<SetStateAction<S>>] => {
    let [states, cursor] = getHookData();
    if (states.length <= cursor) {
        states.push(initialValue);
    }
    let ref = useRef(current.e!);
    ref.current = current.e!;
    let setState = useCallback((action: SetStateAction<S>) => {
        let elem = ref.current;
        if (elem.u) throw illegal('set state');
        let newValue: S = isUpdater(action) ? action(states[cursor]) : action;
        if (states[cursor] !== newValue) {
            states[cursor] = newValue;
            if (!elem.q) elem.q = [];
            elem.q!.push(callComponentFunc(elem));
            queueTask(() => flush(elem));
        }
    }, []);
    return [states[cursor], setState];
};

export let useEffect = (effect: () => (void | (() => void)), deps: any[]) => {
    let [effects, cursor, elem] = getHookData();
    if (effects.length <= cursor) {
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
    if (effects.length <= cursor) {
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
    const first = useRef(false);
    useEffect(() => {
        if (!first.current) {
            first.current = true;
            return;
        }
        effect();
    }, deps);
};

export let useMemo = <T>(create: () => T, deps: any[]): T => {
    let [memos, cursor] = getHookData();
    if (memos.length <= cursor) {
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
    current: T
}

export let useRef = <T>(initialValue: T): Ref<T> => useMemo<Ref<T>>(() => ({ current: initialValue }), []);

let flush = (elem: Elem) => {
    let tip = elem.q?.pop();
    if (!tip) return;
    elem.q!.length = 0;
    reconcile(elem.v!, tip);
    elem.v = tip;
};

export let current: { e: ComponentElem | undefined } = {
    e: undefined,
};

let useAtomSubscription = <T>(atom: Atom<T> | ReadonlyAtom<T>) => {
    const elem = useCurrentElem();
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
    const elem = useCurrentElem();
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
