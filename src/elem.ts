import { current, Ref } from './hooks';
import { setAttr } from './reconcile';
import { $document, isString } from './utils';

export type Component<T> = (props: T) => SlotElem;
export type ComponentElem<T = any> = Elem<T> & { t: Component<T> };
export type ElemType<T = any> = string | Component<T>;
export type SlotElem = null | undefined | boolean | string | Elem;
export type Slot = SlotElem | SlotElem[];
export let TEXT_NODE_TYPE = '0';

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

type Rendr = {
    <Tag extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, Attrs extends RendrAttributes = Tag extends keyof HTMLElementTagNameMap ? HTMLElementAttributes<Tag> : Tag extends keyof SVGElementTagNameMap ? SVGElementAttributes<Tag> : never>(ty: Tag, attrs?: Attrs): Elem<Tag>
    <T extends { [key: string]: any }>(ty: Component<T>, props: T & { key?: string, memo?: any[] }): ComponentElem<T>
    (ty: Component<void>, props?: { key?: string, memo?: any[] }): ComponentElem<void>
};

export let rendr: Rendr = (ty: any, props?: any): any => {
    if (isString(ty)) {
        return element(ty as keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, props);
    }
    return component(ty, props);
};

type RendrComponent = {
    <T extends { [key: string]: any }>(ty: Component<T>, props: T & { key?: string, memo?: any[] }): Elem<T>
    (ty: Component<void>, props?: { key?: string, memo?: any[] }): Elem<void>
};

export let component: RendrComponent = (ty: any, props?: any): any => ({
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

let undefineableAttributes: Record<string, boolean> = {
    onclick: true,
};

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

type RendrAttributes = object & { slot?: Slot, ref?: Ref, key?: string };

export type HTMLElementAttributes<Tag extends string & keyof HTMLElementTagNameMap> =
    Omit<Partial<HTMLElementTagNameMap[Tag]>, BooleanValueHTMLElementAttributes | 'style' | 'slot' | 'onclick' | 'oninput'> &
    { style?: CSSProperties } &
    { [key in BooleanValueHTMLElementAttributes]?: boolean } &
    NarrowedEventHandler<'input', Tag, 'target'> &
    NarrowedEventHandler<'click', Tag, 'currentTarget'>;

export type SVGElementAttributes<Tag extends string & keyof SVGElementTagNameMap> =
    Omit<Partial<SVGElementTagNameMap[Tag]>, 'style' | 'slot' | 'onclick'> &
    { style?: CSSProperties } &
    { slot?: Slot, ref?: Ref, key?: string } &
    NarrowedSVGEventHandler<'click', Tag, 'currentTarget'>;

let element = <Tag extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, Attrs extends RendrAttributes = Tag extends keyof HTMLElementTagNameMap ? HTMLElementAttributes<Tag> : Tag extends keyof SVGElementTagNameMap ? SVGElementAttributes<Tag> : never>(ty: Tag, attrs?: Attrs): Elem<Tag> => {
    if (!attrs) {
        return {
            t: ty,
        };
    }
    let elem = {
        t: ty,
        p: {} as { [key: string]: any },
        k: attrs.key,
        c: attrs.slot,
        r: attrs.ref,
    };
    let prop: string & keyof (typeof attrs);
    for (prop in attrs) {
        if (prop === 'key' || prop === 'slot' || prop === 'ref' || prop === 'memo' || (!undefineableAttributes[prop] && attrs[prop] === undefined)) {
            continue;
        }
        elem.p[prop] = attrs[prop];
    }
    if ('slot' in attrs) {
        if (isFalsySlotElem(elem.c)) {
            elem.c = [{ t: TEXT_NODE_TYPE, p: '' }];
        } else if (isString(elem.c)) {
            elem.c = [{ t: TEXT_NODE_TYPE, p: elem.c }];
        } else if (!Array.isArray(elem.c)) {
            elem.c = [elem.c] as Elem[];
        } else {
            for (let i = elem.c.length - 1; i >= 0; i--) {
                elem.c[i] = normalizeSlotElem(elem.c[i]);
            }
        }
    }
    return elem as Elem;
}

let normalizeSlotElem = (elem: SlotElem): Elem => {
    if (isFalsySlotElem(elem)) return { t: TEXT_NODE_TYPE, p: '' };
    if (isString(elem)) return { t: TEXT_NODE_TYPE, p: elem };
    return elem;
};

let isFalsySlotElem = (elem: any): elem is null | undefined | boolean => elem === undefined || elem === null || elem === false || elem === true;

let nameSpacePrefix = 'http://www.w3.org/';
let nameSpaceMap: { [key: string]: string } = {
    svg: nameSpacePrefix + '2000/svg',
    math: nameSpacePrefix + '1998/Math/MathML',
};

let getNameSpace = (elem: Elem & { t: string }): string | undefined => (elem.p && elem.p.xmlns) || nameSpaceMap[elem.t];

export let createDom = <T>(elem: Elem<T>, ns?: string | undefined): ChildNode => {
   if (isString(elem.t)) {
        if (elem.t === TEXT_NODE_TYPE) {
            elem.d = $document.createTextNode(elem.p as string);
        } else {
            ns = getNameSpace(elem as { t: string }) ?? ns;
            elem.d = ns ? $document.createElementNS(ns, elem.t) : $document.createElement(elem.t);
            if (elem.r) elem.r.current = elem.d;
            for (let attr in elem.p) {
                setAttr(elem.d as Element, attr, elem.p[attr]);
            }
            if (elem.c) {
                for (let i = 0; i < elem.c.length; i++) {
                    elem.d.appendChild(createDom(elem.c[i], ns));
                }
            }
        }
    } else {
        elem.v = callComponentFunc(elem as ComponentElem<T>);
        return createDom(elem.v, ns);
    }
    return elem.d!;
}
