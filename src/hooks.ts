import { Atom } from './atom';
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

let getHookData = <T extends EffectRecord[] | MemoRecord[] | any[]>(): [T, number] => {
    let elem = useCurrentElem();
    if (!elem.h) elem.h = [];
    return [elem.h as T, elem.i!++];
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
    reconcile(elem.v!, tip);
    elem.v = tip;
    elem.q!.length = 0;
};

export let current: { e: ComponentElem | undefined } = {
    e: undefined,
};

export let useAtom = <T>(atom: Atom<T>): [T, Dispatch<SetStateAction<T>>] => {
    const elem = useCurrentElem();
    useEffect(() => {
        atom.subs.set(elem, true);
        return () => atom.subs.delete(elem);
    }, [elem]);
    return [atom.state, atom.update];
};

export let useAtomSetter = <T>(atom: Atom<T>): Dispatch<SetStateAction<T>> => atom.update;

export let useAtomValue = <T>(atom: Atom<T>): T => {
    const elem = useCurrentElem();
    useEffect(() => {
        atom.subs.set(elem, true);
        return () => atom.subs.delete(elem);
    }, [elem]);
    return atom.state;
};
