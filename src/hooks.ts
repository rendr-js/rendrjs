import { Atom, ReadonlyAtom } from './atom.js';
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

export var isUpdater = <T>(value: SetStateAction<T>): value is UpdateStateAction<T> => typeof value === 'function';

export var useCurrentElem = (): ComponentElem => {
    if (!current.e) throw 'bad hook';
    return current.e;
};

var getHookData = <T extends EffectRecord[] | MemoRecord[] | any[]>(): [T, number, ComponentElem] => {
    var elem = useCurrentElem();
    elem.h ??= [];
    return [elem.h as T, elem.i!++, elem];
};

export var useState = <S>(initialValue: S): [S, Dispatch<SetStateAction<S>>] => {
    var [states, cursor] = getHookData();
    if (states.length <= cursor) {
        states.push(initialValue);
    }
    var ref = useRef(current.e!);
    ref.value = current.e!;
    var setState = useCallback((action: SetStateAction<S>) => {
        var elem = ref.value;
        if (elem.u) throw 'bad set state';
        var newValue: S = isUpdater(action) ? action(states[cursor]) : action;
        if (states[cursor] !== newValue) {
            states[cursor] = newValue;
            elem.q ??= [];
            elem.q!.push(callComponentFunc(elem));
            queueMicrotask(() => flush(elem));
        }
    }, []);
    return [states[cursor], setState];
};

export var useEffect = (effect: () => (void | (() => void)), deps: any[]) => {
    var [effects, cursor, elem] = getHookData();
    if (effects.length <= cursor) {
        var ef = { d: deps } as EffectRecord;
        effects.push(ef);
        queueMicrotask(() => {
            if (!elem.u) ef.t = effect();
        });
        return;
    }
    var ef = effects[cursor] as EffectRecord;
    if (!areDepsEqual(deps, ef.d)) {
        ef.d = deps;
        queueMicrotask(() => {
            ef.t?.();
            if (!elem.u) ef.t = effect();
        });
    }
};

export var useImmediateEffect = (effect: () => (void | (() => void)), deps: any[]) => {
    var [effects, cursor] = getHookData();
    if (effects.length <= cursor) {
        effects.push({ d: deps, t: effect() });
        return;
    }
    var ef = effects[cursor] as EffectRecord;
    if (!areDepsEqual(deps, ef.d)) {
        ef.d = deps;
        ef.t?.();
        ef.t = effect();
    }
};

export var useDeferredEffect = (effect: () => (void | (() => void)), deps: any[]) => {
    var first = useRef(false);
    useEffect(() => {
        if (!first.value) {
            first.value = true;
            return;
        }
        effect();
    }, deps);
};

export var useMemo = <T>(create: () => T, deps: any[]): T => {
    var [memos, cursor] = getHookData();
    if (memos.length <= cursor) {
        var value = create();
        memos.push({
            d: deps,
            v: value,
        } as MemoRecord);
        return value;
    }
    var memo = memos[cursor] as MemoRecord;
    if (!areDepsEqual(deps, memo.d)) {
        memo.d = deps;
        memo.v = create();
    }
    return memo.v;
};

export var useCallback = <T extends Function>(cb: T, deps: any[]): T => useMemo(() => cb, deps);

export interface Ref<T = any> {
    value: T
}

export var useRef = <T>(initialValue: T): Ref<T> => useMemo<Ref<T>>(() => ({ value: initialValue }), []);

var flush = (elem: Elem) => {
    var tip = elem.q?.pop();
    if (tip) {
        if (elem.q) elem.q.length = 0;
        reconcile(elem.v!, tip);
        elem.v = tip;
    }
};

export var current: { e: ComponentElem | undefined } = {
    e: undefined,
};

var useAtomSubscription = <T>(atom: Atom<T> | ReadonlyAtom<T>) => {
    var elem = useCurrentElem();
    useImmediateEffect(() => {
        atom.c.add(elem);
        return () => atom.c.delete(elem);
    }, [elem]);
};

export var useAtom = <T>(atom: Atom<T>): [T, Dispatch<SetStateAction<T>>] => {
    useAtomSubscription(atom);
    return [atom.s, atom.u];
};

export var useAtomSetter = <T>(atom: Atom<T>): Dispatch<SetStateAction<T>> => atom.u;

export var useAtomValue = <T>(atom: Atom<T> | ReadonlyAtom<T>): T => {
    useAtomSubscription(atom);
    return atom.s;
};

export var useAtomSelector = <T, R>(atom: Atom<T> | ReadonlyAtom<T>, selector: (state: T) => R): R => {
    var elem = useCurrentElem();
    useImmediateEffect(() => {
        var selected = selector(atom.s);
        var selects = atom.f.get(elem);
        if (!selects) {
            atom.f.set(elem, [[selected, selector]]);
        } else {
            selects.push([selected, selector]);
        }
        return () => atom.f.delete(elem);
    }, [elem, selector]);
    return selector(atom.s);
};
