import { expect, describe, it } from 'vitest';
import { component, element, text } from '..';
import { mount, waitFor } from './utils';

describe('rendering', () => {
    it('slot', async () => {
        const Root = () => element('p', { slot: text('foo') });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
    });

    it('consice slot', async () => {
        const Root = () => element('p', { slot: text('foo') });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
    });

    it('component slot', async () => {
        const Foo = () => text('foo');
        const Root = () => element('p', { slot: component(Foo) });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
    });

    it('component array slot', async () => {
        const Foo = () => text('foo');
        const Bar = () => text('bar');
        const Root = () => element('p', { slot: [component(Foo), component(Bar)] });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foobar'));
    });

    it('class', async () => {
        const Root = () => element('p', { class: 'foo' });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.className).toBe('foo'));
    });

    it('class undefined', async () => {
        const Root = () => element('p', { class: undefined });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.className).toBe(''));
    });

    it('aria-hidden', async () => {
        const Root = () => element('p', { class: 'foo', 'aria-hidden': 'true' });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.getAttribute('aria-hidden')).toBe('true'));
    });

    it('style', async () => {
        const Root = () => element('p', { style: 'margin: 10px' });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.style.margin).toBe('10px'));
    });

    it('conditional', async () => {
        const Root = () => {
            return element('p', {
                slot: [
                    null && element('span', { slot: text('foo') }),
                    undefined && element('span', { slot: text('bar') }),
                    false && element('span', { slot: text('bat') }),
                    true && element('span', { slot: text('baz') }),
                ],
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('baz'));
    });

    it('component returns string', async () => {
        const Root = () => element('p', { slot: text('foo') });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
    });

    it('component returns null', async () => {
        const Root = () => element('p', { slot: null });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe(''));
    });

    it('component returns false', async () => {
        const Root = () => element('p', { slot: false });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe(''));
    });

    it('component returns undefined', async () => {
        const Root = () => element('p', { slot: undefined });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe(''));
    });

    it('component returns component func', async () => {
        const Foo = () => element('p', { slot: text('foo') });
        const Bar = () => component(Foo);
        const Root = () => component(Bar);
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
    });

    it('mount component func', async () => {
        const Root = () => element('p', { slot: text('foo') });
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
    });

    it('svg', async () => {
        const Root = () => element('svg', {
            width: 100,
            height: 100,
            slot: [
                element('rect', {
                    width: 50,
                    height: 50,
                    style: 'strokeWidth: 3',
                }),
            ],
        });
        const wrapper = mount(component(Root));
        const rct = wrapper.find('rect');
        await waitFor(() => expect(rct).not.toBe(null));
    });
});
