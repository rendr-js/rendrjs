import { describe, it, expect, vi } from 'vitest';
import { rendr, useEffect, createAtom, useAtomValue, useAtomSetter, useAtom } from '..';
import { waitFor, mount } from './utils';

describe('atoms', () => {
    it('basic use', async () => {
        const atom = createAtom('foo');
        const Message = () => {
            const msg = useAtomValue(atom);
            return rendr('p', { slot: msg });
        };
        const Button = () => {
        const setMsg = useAtomSetter(atom);
            return rendr('button', {
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            return rendr('div', { slot: [
                rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        const button = wrapper.find('button')!;
        expect(p.textContent).toBe('foo');
        button.click();
        await waitFor(() => expect(p.textContent).toBe('foo!'));
        button.click();
        await waitFor(() => expect(p.textContent).toBe('foo!!'));
    });

    it('can set in effect from subscriber', async () => {
        const atom = createAtom('foo');
        const Message = () => {
            const msg = useAtomValue(atom);
            return rendr('p', { slot: msg });
        };
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return rendr('button', {
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            const [, setMsg] = useAtom(atom);
            useEffect(() => setMsg('bar'), []);
            return rendr('div', { slot: [
                rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        const button = wrapper.find('button')!;
        await waitFor(() => expect(p.textContent).toBe('bar'));
        button.click();
        await waitFor(() => expect(p.textContent).toBe('bar!'));
        button.click();
        await waitFor(() => expect(p.textContent).toBe('bar!!'));
    });

    it('updates within memo component', async () => {
        const atom = createAtom('foo');
        const Message = () => {
            const msg = useAtomValue(atom);
            return rendr('p', { slot: msg });
        };
        const memo = () => rendr(Message);
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return rendr('button', {
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            return rendr('div', { slot: [
                rendr(memo, { memo: [] }),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        const button = wrapper.find('button')!;
        await waitFor(() => expect(p.textContent).toBe('foo'));
        button.click();
        await waitFor(() => expect(p.textContent).toBe('foo!'));
        button.click();
        await waitFor(() => expect(p.textContent).toBe('foo!!'));
    });

    it('does not re-render parents', async () => {
        const atom = createAtom('foo');
        const btnRunner = vi.fn();
        const compRunner = vi.fn();
        const Message = () => {
            const msg = useAtomValue(atom);
            return rendr('p', { slot: msg });
        };
        const Button = () => {
            btnRunner();
            const setMsg = useAtomSetter(atom);
            return rendr('button', {
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            compRunner();
            return rendr('div', { slot: [
                rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        const button = wrapper.find('button')!;
        await waitFor(() => expect(p.textContent).toBe('foo'));
        button.click();
        await waitFor(() => expect(p.textContent).toBe('foo!'));
        button.click();
        await waitFor(() => expect(p.textContent).toBe('foo!!'));
        await waitFor(() => expect(btnRunner).toHaveBeenCalledOnce());
        await waitFor(() => expect(compRunner).toHaveBeenCalledOnce());
    });

    it('does not render when state change unmounts component', async () => {
        const atom = createAtom('foo');
        const msgRunner = vi.fn();
        const Message = () => {
            msgRunner();
            const msg = useAtomValue(atom);
            return rendr('p', { slot: msg });
        };
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return rendr('button', {
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            const msg = useAtomValue(atom);
            return rendr('div', { slot: [
                msg.length % 2 === 0 && rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const button = wrapper.find('button')!;
        expect(wrapper.find('p')).toBe(null);
        button.click();
        await waitFor(() => expect(wrapper.find('p')!.textContent).toBe('foo!'));
        button.click();
        await waitFor(() => expect(wrapper.find('p')).toBe(null));
        await waitFor(() => expect(msgRunner).toHaveBeenCalledOnce());
    });

    it('does not needlessly re-render child subs of parent subs', async () => {
        const atom = createAtom('foo');
        const msgRunner = vi.fn();
        const Message = () => {
            msgRunner();
            const msg = useAtomValue(atom);
            return rendr('p', { slot: msg });
        };
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return rendr('button', {
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            const msg = useAtomValue(atom);
            if (msg === 'never') console.log('never');
            return rendr('div', { slot: [
                rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        const button = wrapper.find('button')!;
        await waitFor(() => expect(p.textContent).toBe('foo'));
        button.click();
        await waitFor(() => expect(msgRunner).toHaveBeenCalledOnce());
    });
});