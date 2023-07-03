
// for cypress :/
// export * from './atom';
// export * from './lazy';
// export * from './elem';
// export * from './hooks';
// export * from './mount';

import {
    rendr,
    Component,
    SlotElem,
    Slot,
    Elem,
    ClickEvent,
    InputEvent,
    CSSProperties,
} from './elem';
import {
    mount,
} from './mount';
import {
    useAtom,
    useAtomSetter,
    useAtomValue,
    useCallback,
    useDeferredEffect,
    useEffect,
    useMemo,
    useRef,
    useState,
    Ref,
    Dispatch,
    SetStateAction,
    UpdateStateAction,
} from './hooks';
import {
    Atom,
    createAtom,
} from './atom';
import {
    LazyConfig,
    lazy,
} from './lazy';


export {
    // elem
    rendr,
    Component,
    SlotElem,
    Slot,
    Elem,
    ClickEvent,
    InputEvent,
    CSSProperties,

    // mount
    mount,

    // lazy
    LazyConfig,
    lazy,

    // atom
    Atom,
    createAtom,

    // hooks
    useAtom,
    useAtomSetter,
    useAtomValue,
    useCallback,
    useDeferredEffect,
    useEffect,
    useMemo,
    useRef,
    useState,
    Ref,
    Dispatch,
    SetStateAction,
    UpdateStateAction,
};

declare global {
    const __DEV__: boolean
}
