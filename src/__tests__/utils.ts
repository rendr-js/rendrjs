import { Elem, mount as rendrjsmount } from '..';

export const wait = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

export const mount = (elem: Elem) => {
    const root = document.createElement('div');
    rendrjsmount(root, elem);
    return {
        find: (selector: string): HTMLElement | null => root.querySelector(selector),
    };
};

export const waitFor = async (func: () => any) => {
    const start = Date.now();
    let inc = 1;
    while (Date.now() - start < 100) {
        try {
            return func();
        } catch (err) {
            await wait(inc);
            inc *= 2;
            continue;
        }
    }
    func();
};
