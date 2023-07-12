import { describe, it, expect, vi } from 'vitest';
import { useState, rendr, useEffect, useDeferredEffect } from '..';
import { waitFor, mount, wait } from './utils';

describe('effects', () => {
    it('runs effect and teardown', async () => {
        const td = vi.fn();
        const effect = vi.fn();
        const Child = () => {
            useEffect(() => {
                effect();
                return td;
            }, []);
            return rendr('span', { slot: 'span' });
        };
        const Root = () => {
            const [ty, setTy] = useState('comp');
            return rendr('p', {
                onclick: () => setTy(t => t === 'comp' ? 'string' : 'comp'),
                slot: ty === 'comp' ? rendr(Child) : 'bar',
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(effect).toHaveBeenCalledOnce());
        p.click();
        await waitFor(() => expect(td).toHaveBeenCalledOnce());
    });

    it('runs no-dep effect only once', async () => {
        const effect = vi.fn();
        const Root = () => {
            const [slot, setSlot] = useState('foo');
            useEffect(effect, []);
            return rendr('p', {
                onclick: () => setSlot(s => s + '-'),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        p.click();
        await wait(10);
        expect(effect).toHaveBeenCalledOnce();
    });

    it('can set state in effect with other effects after it', async () => {
            const useFoo = () => {
                const [, setFoo] = useState('foo');
                useEffect(() => setFoo('bar'), []);
                useEffect(() => {}, []);
            };

            const Root = () => {
                useFoo();
                return rendr('p');
            };
            mount(rendr(Root));
    });
    
    it('throws error when used outside of component render function', async () => {
        const fail = vi.fn();
        try {
            useEffect(() => undefined, []);
        } catch (e) {
            fail();
        }
        expect(fail).toHaveBeenCalledOnce();
    });

    it('runs effect when deps array grows', async () => {
        const effect = vi.fn();
        const Root = () => {
            const [cnt, setCnt] = useState(0);
            const deps: number[] = [];
            for (let i = 0; i < cnt; i++) {
                deps.push(i);
            }
            useEffect(effect, deps);
            return rendr('p', {
                onclick: () => setCnt(c => c + 1),
                slot: 'foo',
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(effect).toHaveBeenCalledOnce());
        p.click();
        await waitFor(() => expect(effect).toHaveBeenCalledTimes(2));
    });

    it('runs effect when deps array shrinks', async () => {
        const effect = vi.fn();
        const Root = () => {
            const [cnt, setCnt] = useState(2);
            const deps: number[] = [];
            for (let i = 0; i < cnt; i++) {
                deps.push(i);
            }
            useEffect(effect, deps);
            return rendr('p', {
                onclick: () => setCnt(c => c - 1),
                slot: 'foo',
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(effect).toHaveBeenCalledOnce());
        p.click();
        await waitFor(() => expect(effect).toHaveBeenCalledTimes(2));
    });

    it('runs effect teardown when deps change', async () => {
        const effect = vi.fn();
        const td = vi.fn();
        const Root = () => {
            const [cnt, setCnt] = useState(0);
            useEffect(() => {
                effect();
                return td;
            }, [cnt]);
            return rendr('p', {
                onclick: () => setCnt(c => c + 1),
                slot: 'foo',
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(effect).toHaveBeenCalledOnce());
        p.click();
        await waitFor(() => expect(td).toHaveBeenCalledOnce());
        await waitFor(() => expect(effect).toHaveBeenCalledTimes(2));
    });

    it('runs deferred effect correctly', async () => {
        const effect = vi.fn();
        const Root = () => {
            const [slot, setSlot] = useState('foo');
            useDeferredEffect(effect, [slot]);
            return rendr('p', {
                onclick: () => setSlot(s => s + '-'),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        expect(effect).not.toHaveBeenCalled();
        p.click();
        await wait(10);
        expect(effect).toHaveBeenCalledTimes(1);
        p.click();
        await wait(10);
        expect(effect).toHaveBeenCalledTimes(2);
    });
});
