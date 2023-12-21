import { describe, it, expect } from 'vitest';
import { useState, component, lazy, element, text } from '..';
import { waitFor, mount } from './utils';

describe('lazy', () => {
    it('root element is component', async () => {
        const Child = ({ onclick }: { onclick: () => void }) => element('div', { slot: text('foo'), onclick, id: 'foo' });
        const LazyChild = lazy({
            import: () => new Promise<{ default: typeof Child}>(r => setTimeout(() => r({ default: Child }), 10)),
            fallback: element('p', { slot: text('loading') }),
        });
        const Root = () => {
            const [margin, setMargin] = useState(10);
            if (margin > 10) return component(LazyChild, { onclick: () => setMargin(c => c / 2) });
            return element('p', {
                slot: text('bar'),
                style: `margin: ${margin}px`,
                onclick: () => setMargin(c => c * 2),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('bar'));
        para.click();
        await waitFor(() => expect(wrapper.find('p')!.textContent).toBe('loading'));
        await waitFor(() => expect(wrapper.find('#foo')!.textContent).toBe('foo'));
        wrapper.find('#foo')!.click();
        await waitFor(() => expect(wrapper.find('p')!.textContent).toBe('bar'));
    });

    it('props change', async () => {
        const Child = (props: { onclick: () => void, slot: string, style: string }) => element('div', {
            ...props,
            slot: text(props.slot),
            id: 'foo',
        });
        const LazyChild = lazy({
          import: () => new Promise<{ default: typeof Child}>(r => setTimeout(() => r({ default: Child }), 10)),
          fallback: element('p', { slot: text('loading') }),
        });
        const Root = () => {
          const [margin, setMargin] = useState(10);
          if (margin > 10) {
            return component(LazyChild, {
              onclick: () => setMargin(c => c / 2 - 1),
              slot: `foo: ${margin}`,
              style: `margin: ${margin}px`,
            });
          }
          return element('p', {
            slot: text('bar'),
            style: `margin: ${margin}px`,
            onclick: () => setMargin(c => c * 2),
          });
        };
        const wrapper = mount(component(Root));
        await waitFor(() => expect(wrapper.find('p')!.textContent).toBe('bar'));
        wrapper.find('p')!.click();
        await waitFor(() => expect(wrapper.find('p')!.textContent).toBe('loading'));
        await waitFor(() => expect(wrapper.find('#foo')!.textContent).toBe('foo: 20'));
        wrapper.find('#foo')!.click();
        await waitFor(() => expect(wrapper.find('p')!.textContent).toBe('bar'));
        wrapper.find('p')!.click();
        await waitFor(() => expect(wrapper.find('#foo')!.textContent).toBe('foo: 18'));
    });
});
