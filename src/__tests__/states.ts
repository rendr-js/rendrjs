import { describe, it, expect, vi } from 'vitest';
import { useState, rendr, useEffect, Dispatch, SetStateAction } from '..';
import { waitFor, mount, wait } from './utils';

describe('states', () => {
    it('uses state correctly', async () => {
        const Root = () => {
            const [slot, setSlot] = useState('foo');
            return rendr('p', {
                onclick: () => setSlot(t => t === 'foo' ? 'bar' : 'foo'),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        expect(p.textContent).toBe('foo');
        p.click();
        waitFor(() => expect(p.textContent).toBe('bar'));
    });

    it('set state within controlled component works', async () => {
        const Foo = ({ open, setOpen }: { open: boolean, setOpen: Dispatch<SetStateAction<boolean>> }) => {
            const [fooBar, setFooBar] = useState('foo');
            if (!open) {
                return 'none';
            }
            return rendr('span', {
                class: 'foo',
                slot: [
                    fooBar,
                    rendr('span', {
                        class: 'close',
                        slot: 'close',
                        onclick: () => setOpen(false),
                    }),
                ],
                onclick: () => setFooBar(fb => fb === 'foo' ? 'bar' : 'foo'),
            });
        };
        const Root = () => {
            const [open, setOpen] = useState(false);
            return rendr('p', {
                class: 'root',
                slot: [
                    rendr(Foo, { open, setOpen }),
                    rendr('span', {
                        class: 'opener',
                        slot: 'open',
                        onclick: () => setOpen(true),
                    })
                ],
            });
        };
        const wrapper = mount(rendr(Root));
        const root = wrapper.find('.root')!;
        const opener = wrapper.find('.opener')!;
        await waitFor(() => expect(root.textContent).toBe('noneopen'));
        opener.click();
        await wait(10);
        const foo = wrapper.find('.foo')!;
        await waitFor(() => expect(foo.textContent).toBe('fooclose'));
        foo.click();
        await waitFor(() => expect(foo.textContent).toBe('barclose'));
        const close = wrapper.find('.close')!;
        close.click();
        await waitFor(() => expect(root.textContent).toBe('noneopen'));
    });
   
    it('throws error when used outside of component render function', () => {
        const fail = vi.fn();
        try {
            useState('foo');
        } catch (e) {
            fail();
        }
        expect(fail).toHaveBeenCalledOnce();
    });
    
    it('throws error when set state called from unmounted component; doesnt when singleton remounted', async () => {
        const fail = vi.fn();
        const child = rendr(() => {
            const [, setState] = useState(0);
            useEffect(() => {
                setTimeout(() => {
                    try {
                        setState(1);
                    } catch (e) {
                        fail();
                    }
                }, 10);
            }, []);
            return rendr('span', { slot: 'foo' });
        });
        const Root = () => {
            const [hasChild, setHasChild] = useState(true);
            return rendr('p', {
                onclick: () => setHasChild(h => !h),
                slot: hasChild ? child : rendr('span', { slot: 'bar' }),
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        p.click();
        await waitFor(() => expect(fail).toHaveBeenCalledOnce());
        p.click();
        await wait(20);
        expect(fail).toHaveBeenCalledOnce();
    });
});
