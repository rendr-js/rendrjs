import { describe, it, expect, vi } from 'vitest';
import { useState, rendr, useRef } from '..';
import { waitFor, mount } from './utils';

describe('refs', () => {
    it('sets ref on initial render', async () => {
        const Root = () => {
            const ref = useRef('foo');
            return rendr('p', {
                id: 'foo',
                slot: ref.value,
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(p.textContent).toBe('foo'));
    });

    it('sets element ref on initial render', async () => {
        const Root = () => {
            const ref = useRef<HTMLParagraphElement | undefined>(undefined);
            return rendr('p', {
                id: 'foo',
                ref,
                slot: 'bar',
                onclick: () => ref.value ? ref.value.id = 'baz' : undefined,
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        p.click();
        await waitFor(() => expect(p.id).toBe('baz'));
    });

    it('updates element ref during reconciliation', async () => {
        const Root = () => {
            const [hasRef, setHasRef] = useState(true);
            const ref = useRef<HTMLParagraphElement | undefined>(undefined);
            return rendr('p', {
                id: 'foo',
                ref: hasRef ? ref : undefined,
                slot: 'bar',
                onclick: () => {
                    if (ref.value) ref.value.id += '-';
                    setHasRef(h => !h);
                },
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(p.id).toBe('foo'));
        p.click();
        await waitFor(() => expect(p.id).toBe('foo-'));
        p.click();
        await waitFor(() => expect(p.id).toBe('foo-'));
        p.click();
        await waitFor(() => expect(p.id).toBe('foo--'));
    });

    it('removes element ref', async () => {
        const Root = () => {
            const ref = useRef<HTMLParagraphElement | undefined>(undefined);
            const [hasRef, setHasRef] = useState(true);
            const [slot, setSlot] = useState('');
            return rendr('p', {
                ref: hasRef ? ref : undefined,
                slot,
                onclick: () => {
                    setSlot(ref.value ? 'had' : 'had-not');
                    setHasRef(h => !h);
                },
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        p.click();
        await waitFor(() => expect(p.textContent).toBe('had'));
        p.click();
        await waitFor(() => expect(p.textContent).toBe('had-not'));
        p.click();
        await waitFor(() => expect(p.textContent).toBe('had'));
    });

    it('removes element ref by elem removal', async () => {
        const Root = () => {
            const ref = useRef<HTMLSpanElement | undefined>(undefined);
            const [hasRef, setHasRef] = useState(true);
            const [slot, setSlot] = useState('');
            return rendr('p', {
                slot: [
                    hasRef ? rendr('span', { ref }) : undefined,
                    slot,
                ],
                onclick: () => {
                    setSlot(ref.value ? 'had' : 'had-not');
                    setHasRef(h => !h);
                },
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        p.click();
        await waitFor(() => expect(p.textContent).toBe('had'));
        p.click();
        await waitFor(() => expect(p.textContent).toBe('had-not'));
        p.click();
        await waitFor(() => expect(p.textContent).toBe('had'));
    });

    it('throws error when used outside of component render function', () => {
      const fail = vi.fn();
      try {
        useRef('foo');
      } catch (e) {
        fail();
      }
      expect(fail).toHaveBeenCalledOnce();
    });
});
