import { useEffect, useState } from './hooks.js';
import { Component, SlotElem, rendr } from './elem.js';

export interface LazyConfig<T> {
    import: () => Promise<{ default: Component<T> }>
    fallback: SlotElem
}

type Lazy = {
    (config: LazyConfig<void>): Component<void>
    <T extends { [key: string]: any }>(config: LazyConfig<T>): Component<T>
};

export var lazy: Lazy = <T>(config: LazyConfig<T>): Component<T> => {
    var comp: any = undefined;
    return (props: any) => {
        var [slot, setSlot] = useState({ val: comp ?? (() => config.fallback) });
        useEffect(() => {
            if (!comp) {
                config.import().then(e => {
                    setSlot({ val: e.default });
                    comp = e.default;
                });
            }
        }, []);
        return rendr(slot.val, props);
    };
};
