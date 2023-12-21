import { describe, it, expect, vi } from 'vitest';
import { useState, rendr, useEffect, span, p } from '..';
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
            return span({ slot: 'span' });
        };
        const Root = () => {
            const [ty, setTy] = useState('comp');
            return p({
                onclick: () => setTy(t => t === 'comp' ? 'string' : 'comp'),
                slot: ty === 'comp' ? rendr(Child) : 'bar',
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(effect).toHaveBeenCalledOnce());
        para.click();
        await waitFor(() => expect(td).toHaveBeenCalledOnce());
    });

    it('doesn\'t throw in teardown if state is null', async () => {
        const td = vi.fn();
        const effect = vi.fn();
        const Child = () => {
            useState(null);
            useEffect(() => {
                effect();
                return td;
            }, []);
            return span({ slot: 'span' });
        };
        const Root = () => {
            const [ty, setTy] = useState('comp');
            return p({
                onclick: () => setTy(t => t === 'comp' ? 'string' : 'comp'),
                slot: ty === 'comp' ? rendr(Child) : 'bar',
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(effect).toHaveBeenCalledOnce());
        para.click();
        await waitFor(() => expect(td).toHaveBeenCalledOnce());
    });

    it('runs no-dep effect only once', async () => {
        const effect = vi.fn();
        const Root = () => {
            const [slot, setSlot] = useState('foo');
            useEffect(effect, []);
            return p({
                onclick: () => setSlot(s => s + '-'),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        para.click();
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
            return p();
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
            return p({
                onclick: () => setCnt(c => c + 1),
                slot: 'foo',
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(effect).toHaveBeenCalledOnce());
        para.click();
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
            return p({
                onclick: () => setCnt(c => c - 1),
                slot: 'foo',
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(effect).toHaveBeenCalledOnce());
        para.click();
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
            return p({
                onclick: () => setCnt(c => c + 1),
                slot: 'foo',
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(effect).toHaveBeenCalledOnce());
        para.click();
        await waitFor(() => expect(td).toHaveBeenCalledOnce());
        await waitFor(() => expect(effect).toHaveBeenCalledTimes(2));
    });
});
