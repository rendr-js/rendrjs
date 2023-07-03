import { expect, describe, it } from 'vitest';
import { useState, rendr } from '../../src';
import { mount, waitFor } from './utils';

describe('rendering', () => {
    it('slot', async () => {
        const Root = () => rendr('p', { slot: 'foo' });
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(p.textContent).toBe('foo'));
    });

    it('class', async () => {
        const Root = () => rendr('p', { className: 'foo' });
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(p.className).toBe('foo'));
    });

    it('style', async () => {
        const Root = () => rendr('p', { style: { margin: '10px' } });
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(p.style.margin).toBe('10px'));
    });

    it('conditional', async () => {
        const Root = () => {
        return rendr('p', {
            slot: [
            null && rendr('span', { slot: 'foo' }),
            undefined && rendr('span', { slot: 'bar' }),
            false && rendr('span', { slot: 'bat' }),
            true && rendr('span', { slot: 'baz' }),
            ],
        });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(p.textContent).toBe('baz'));
    });

    it('component returns string', async () => {
        const Root = () => rendr('p', { slot: 'foo' });
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(p.textContent).toBe('foo'));
    });

    it('component returns null', async () => {
        const Root = () => rendr('p', { slot: null });
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(p.textContent).toBe(''));
    });

    it('component returns false', async () => {
        const Root = () => rendr('p', { slot: false });
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(p.textContent).toBe(''));
    });

    it('component returns undefined', async () => {
        const Root = () => rendr('p', { slot: undefined });
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        await waitFor(() => expect(p.textContent).toBe(''));
    });
    
    it('svg', async () => {
        const Root = () => rendr('svg', {
            width: 100,
            height: 100,
            slot: [
                rendr('rect', {
                width: 50,
                height: 50,
                style: { strokeWidth: 3 },
                }),
            ],
        });
        const wrapper = mount(rendr(Root));
        const rect = wrapper.find('rect');
        await waitFor(() => expect(rect).not.toBe(null));
    });
});
