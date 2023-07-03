import { Dispatch, SetStateAction, isUpdater } from './hooks';
import { ComponentElem } from './elem';
import { callComponentFuncAndReconcile } from './reconcile';
import { queueTask } from './utils';

export interface Atom<T> {
    state: T
    update: Dispatch<SetStateAction<T>>
    subs: Map<ComponentElem, boolean>
}

export let createAtom = <T>(initialValue: T): Atom<T> => {
    const atom: Atom<T> = {
        state: initialValue,
        update: action => {
            let oldState = atom.state;
            atom.state = isUpdater(action) ? action(oldState) : action;
            if (oldState === atom.state) {
                return;
            }
            queueTask(() => {
                for (let elem of [...atom.subs.keys()]) {
                    if (atom.subs.get(elem)) {
                        callComponentFuncAndReconcile(elem, elem);
                    }
                }
            });
        },
        subs: new Map(),
    };
    return atom;
};
