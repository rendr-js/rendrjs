import { current, Ref } from './hooks.js';
import { setAttr } from './reconcile.js';

export type Component<T> = (props: T) => SlotElem;
export type ComponentElem<T = any> = Elem<T> & { t: Component<T> };
export type ElemType<T = any> = string | Component<T>;
export type SlotElem = null | undefined | false | Elem;
export type Slot = SlotElem | SlotElem[];

export interface Elem<T = any> {
    t?: ElemType<T> // type
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

export let component: RendrComponent = (ty: any, props?: any): any => ({
    t: ty,
    p: props,
    k: props?.key,
    m: props?.memo,
});

export let text = (content: string): Elem<string> => ({
    p: content,
});

export let callComponentFunc = <T>(elem: ComponentElem<T>): Elem => {
    let prev = current.e;
    current.e = elem;
    elem.i = 0;
    let vd = elem.t(elem.p as T);
    current.e = prev;
    return vd || { p: '' };
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
    Omit<Partial<SVGElementTagNameMap[Tag]>, 'style' | 'slot' | 'onclick' | 'oninput' | 'className' | 'classList' | `aria${string}`> &
    { style?: string, class?: string, [key: `aria-${string}`]: string } &
    NarrowedSVGEventHandler<'click', Tag, 'currentTarget'>;

export let element = <Tag extends keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap, Attrs extends RendrAttributes = Tag extends keyof HTMLElementTagNameMap ? HTMLElementAttributes<Tag> : Tag extends keyof SVGElementTagNameMap ? SVGElementAttributes<Tag> : never>(ty: Tag, attrs?: Attrs): Elem<Tag> => {
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
        if (prop === 'key' || prop === 'slot' || prop === 'ref') {
            continue;
        }
        elem.p[prop] = attrs[prop];
    }
    if ('slot' in attrs) {
        if (Array.isArray(elem.c)) {
            for (let i = elem.c.length - 1; i >= 0; i--) {
                elem.c[i] ||= { p: '' };
            }
        } else {
            elem.c = [elem.c || { p: '' }];
        }
    }
    return elem as Elem;
}

let namespacePrefix = 'http://www.w3.org/';
let svgNamespace = namespacePrefix + '2000/svg';
let mathNamespace = namespacePrefix + '1998/Math/MathML';
export let createDom = <T>(elem: Elem<T>, ns?: string | undefined): ChildNode => {
    if (typeof elem.t === 'string') {
        ns = elem.t === 'svg' ? svgNamespace : elem.t === 'math' ? mathNamespace : ns;
        elem.d = ns ? document.createElementNS(ns, elem.t) : document.createElement(elem.t);
        if (elem.r) elem.r.value = elem.d;
        for (let attr in elem.p) {
            if (elem.p[attr]) setAttr(elem.d as HTMLElement, attr, elem.p[attr]);
        }
        if (elem.c) {
            for (let i = 0; i < elem.c.length; i++) {
                elem.d.appendChild(createDom(elem.c[i], ns));
            }
        }
    } else if (elem.t) {
        elem.v = callComponentFunc(elem as ComponentElem<T>);
        return createDom(elem.v, ns);
    } else {
        elem.d = document.createTextNode(elem.p as string);
    }
    return elem.d!;
}
