import { current, Ref } from './hooks.js';
import { setAttr } from './reconcile.js';
import { SVGAttributes } from './svg.js';
import { $document } from './utils.js';

export type Component<T> = (props: T) => SlotElem;
export type ComponentElem<T = any> = Elem<T> & { t: Component<T> };
export type ElemType<T = any> = string | Component<T>;
export type SlotElem = null | undefined | boolean | string | Elem | Component<any>;
export type Slot = SlotElem | SlotElem[];

export interface Elem<T = any> {
    t: ElemType<T> // type
    k?: string // key
    p?: T // props
    r?: Ref // ref
    d?: ChildNode // dom
    c?: Elem[] // children
    u?: boolean // unmounted

    // component data
    v?: Elem // virtual dom
    q?: Elem[] // virtual dom queue
    h?: any[] // hooks
    i?: number // hooks cursor
    m?: any[] // memo
}

type RendrComponent = {
    <T extends { [key: string]: any }>(ty: Component<T>, props: T & { key?: string, memo?: any[] }): Elem<T>
    (ty: Component<void>, props?: { key?: string, memo?: any[] }): Elem<void>
};

export let rendr: RendrComponent = (ty: any, props?: any): any => ({
    t: ty,
    p: props,
    k: props?.key,
    m: props?.memo,
});

export let callComponentFunc = <T>(elem: ComponentElem<T>): Elem => {
    let prev = current.e;
    current.e = elem;
    elem.i = 0;
    let vd = elem.t(elem.p as T);
    current.e = prev;
    return normalizeSlotElem(vd);
}

type EventHandler<
    TargetType extends string,
    EventName extends keyof HTMLElementEventMap,
    Tag extends string & keyof HTMLElementTagNameMap,
> = (e: HTMLElementEventMap[EventName] & { [key in TargetType]: HTMLElementTagNameMap[Tag] }) => void;

type SVGEventHandler<
    TargetType extends string,
    EventName extends keyof SVGElementEventMap,
    Tag extends string & keyof SVGElementTagNameMap,
> = (e: SVGElementEventMap[EventName] & { [key in TargetType]: SVGElementTagNameMap[Tag] }) => void;

export type ClickEvent<T extends HTMLElement> = MouseEvent & { currentTarget: T };
export type InputEvent<T extends HTMLElement> = Event & { target: T };

type NarrowedEventHandler<
    EventName extends keyof HTMLElementEventMap,
    Tag extends string & keyof HTMLElementTagNameMap,
    TargetType extends string,
    HandlerProperty = `on${EventName}`,
> = HandlerProperty extends keyof HTMLElementTagNameMap[Tag] ? { [key in HandlerProperty]?: EventHandler<TargetType, EventName, Tag> } : {};

type NarrowedSVGEventHandler<
    EventName extends keyof SVGElementEventMap,
    Tag extends string & keyof SVGElementTagNameMap,
    TargetType extends string,
    HandlerProperty = `on${EventName}`,
> = HandlerProperty extends keyof SVGElementTagNameMap[Tag] ? { [key in HandlerProperty]?: SVGEventHandler<TargetType, EventName, Tag> } : {};

export type CSSProperties = Partial<CSSStyleDeclaration> & Record<string, string>;

type BooleanValueHTMLElementAttributes = 'contentEditable';

export type RendrAttributes = object & { slot?: Slot, ref?: Ref, key?: string };

export type HTMLElementAttributes<Tag extends string & keyof HTMLElementTagNameMap> =
    Omit<Partial<HTMLElementTagNameMap[Tag]>, BooleanValueHTMLElementAttributes | 'style' | 'slot' | 'onclick' | 'oninput' | 'className' | 'classList' | `aria${string}`> &
    { style?: string, class?: string, [key: `aria-${string}`]: string } &
    { [key in BooleanValueHTMLElementAttributes]?: boolean } &
    NarrowedEventHandler<'input', Tag, 'target'> &
    NarrowedEventHandler<'click', Tag, 'currentTarget'>;

export type SVGElementAttributes<Tag extends string & keyof SVGElementTagNameMap> =
    SVGAttributes &
    NarrowedSVGEventHandler<'click', Tag, 'currentTarget'>;

export let element = <Tag extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, Attrs extends RendrAttributes = Tag extends keyof HTMLElementTagNameMap ? HTMLElementAttributes<Tag> : Tag extends keyof SVGElementTagNameMap ? SVGElementAttributes<Tag> : never>(ty: Tag, attrs?: Attrs | string): Elem<Tag> => {
    let elem: Elem = { t: ty };
    if (!attrs) {
        return elem;
    } else if (typeof attrs === 'string') {
        elem.c = [createTextElem(attrs)];
        return elem;
    }
    elem.p = attrs;
    elem.k = attrs.key;
    elem.c = attrs.slot as Elem[];
    elem.r = attrs.ref;
    delete attrs.key;
    delete attrs.ref;
    delete attrs.slot;
    if (elem.c !== undefined) {
        if (isFalsySlotElem(elem.c)) {
            elem.c = [createTextElem('')];
        } else if (typeof elem.c === 'string') {
            elem.c = [createTextElem(elem.c)];
        } else if (typeof elem.c === 'function') {
            elem.c = [rendr(elem.c)];
        } else if (!Array.isArray(elem.c)) {
            elem.c = [elem.c] as Elem[];
        } else {
            for (let i = elem.c.length - 1; i >= 0; i--) {
                elem.c[i] = normalizeSlotElem(elem.c[i]);
            }
        }
    }
    return elem;
}

let createTextElem = (p: string) => ({ t: '', p });

export let normalizeSlotElem = (elem: SlotElem): Elem => {
    if (isFalsySlotElem(elem)) return createTextElem('');
    if (typeof elem === 'string') return createTextElem(elem);
    if (typeof elem === 'function') return rendr(elem);
    return elem;
};

let isFalsySlotElem = (elem: any): elem is null | undefined | boolean => !elem || elem === true;

let nameSpacePrefix = 'http://www.w3.org/';
let nameSpaceMap: { [key: string]: string } = {
    svg: nameSpacePrefix + '2000/svg',
    math: nameSpacePrefix + '1998/Math/MathML',
};

export let createDom = <T>(elem: Elem<T>, ns?: string | undefined): ChildNode => {
    if (elem.t === '') {
        elem.d = $document.createTextNode(elem.p as string);
    } else if (typeof elem.t === 'string') {
        // @ts-expect-error
        ns = elem.p?.xmlns ?? nameSpaceMap[elem.t] ?? ns;
        elem.d = ns ? $document.createElementNS(ns, elem.t) : $document.createElement(elem.t);
        if (elem.r) elem.r.value = elem.d;
        for (let attr in elem.p) {
            setAttr(elem.d as HTMLElement, attr, elem.p[attr]);
        }
        elem.c?.forEach(c => elem.d!.appendChild(createDom(c, ns)));
    } else {
        elem.v = callComponentFunc(elem as ComponentElem<T>);
        return createDom(elem.v, ns);
    }
    return elem.d!;
}
