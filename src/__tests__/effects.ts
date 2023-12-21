import { describe, it, expect, vi } from 'vitest';
import { useState, component, useEffect, element, text } from '..';
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
            return element('span', { slot: text('span') });
        };
        const Root = () => {
            const [ty, setTy] = useState('comp');
            return element('p', {
                onclick: () => setTy(t => t === 'comp' ? 'string' : 'comp'),
                slot: ty === 'comp' ? component(Child) : text('bar'),
            });
        };
        const wrapper = mount(component(Root));
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
            return element('span', { slot: text('span') });
        };
        const Root = () => {
            const [ty, setTy] = useState('comp');
            return element('p', {
                onclick: () => setTy(t => t === 'comp' ? 'string' : 'comp'),
                slot: ty === 'comp' ? component(Child) : text('bar'),
            });
        };
        const wrapper = mount(component(Root));
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
            return element('p', {
                onclick: () => setSlot(s => s + '-'),
                slot: text(slot),
            });
        };
        const wrapper = mount(component(Root));
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
            return element('p');
        };
        mount(component(Root));
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
            return element('p', {
                onclick: () => setCnt(c => c + 1),
                slot: text('foo'),
            });
        };
        const wrapper = mount(component(Root));
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
            return element('p', {
                onclick: () => setCnt(c => c - 1),
                slot: text('foo'),
            });
        };
        const wrapper = mount(component(Root));
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
            return element('p', {
                onclick: () => setCnt(c => c + 1),
                slot: text('foo'),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(effect).toHaveBeenCalledOnce());
        para.click();
        await waitFor(() => expect(td).toHaveBeenCalledOnce());
        await waitFor(() => expect(effect).toHaveBeenCalledTimes(2));
    });
});
