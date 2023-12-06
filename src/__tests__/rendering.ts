import { expect, describe, it } from 'vitest';
import { rendr, p, span, svg, rect } from '..';
import { mount, waitFor } from './utils';

describe('rendering', () => {
    it('slot', async () => {
        const Root = () => p({ slot: 'foo' });
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
    });

    it('class', async () => {
        const Root = () => p({ class: 'foo' });
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.className).toBe('foo'));
    });

    it('class undefined', async () => {
        const Root = () => p({ class: undefined });
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.className).toBe(''));
    });

    it('aria-hidden', async () => {
        const Root = () => p({ class: 'foo', ariaHidden: true });
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.ariaHidden).toBe(true));
    });

    it('style', async () => {
        const Root = () => p({ style: 'margin: 10px' });
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.style.margin).toBe('10px'));
    });

    it('conditional', async () => {
        const Root = () => {
            return p({
                slot: [
                    null && span({ slot: 'foo' }),
                    undefined && span({ slot: 'bar' }),
                    false && span({ slot: 'bat' }),
                    true && span({ slot: 'baz' }),
                ],
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('baz'));
    });

    it('component returns string', async () => {
        const Root = () => p({ slot: 'foo' });
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
    });

    it('component returns null', async () => {
        const Root = () => p({ slot: null });
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe(''));
    });

    it('component returns false', async () => {
        const Root = () => p({ slot: false });
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe(''));
    });

    it('component returns undefined', async () => {
        const Root = () => p({ slot: undefined });
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe(''));
    });
    
    it('svg', async () => {
        const Root = () => svg({
            width: 100,
            height: 100,
            slot: [
                rect({
                    width: 50,
                    height: 50,
                    style: { strokeWidth: 3 },
                }),
            ],
        });
        const wrapper = mount(rendr(Root));
        const rct = wrapper.find('rect');
        await waitFor(() => expect(rct).not.toBe(null));
    });
});
