import { describe, it, expect, vi } from 'vitest';
import { component, useEffect, createAtom, useAtomValue, useAtomSetter, useAtom, element, text } from '..';
import { waitFor, mount, wait } from './utils';
import { useAtomSelector } from '../hooks';

describe('standard', () => {
    it('basic use', async () => {
        const atom = createAtom('foo');
        const Message = () => {
            const msg = useAtomValue(atom);
            return element('p', { slot: text(msg) });
        };
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return element('button', {
                slot: text('bar'),
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            return element('div', { slot: [
                component(Message),
                component(Button),
            ] });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        const btn = wrapper.find('button')!;
        expect(para.textContent).toBe('foo');
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('foo!'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('foo!!'));
    });

    it('can set in effect from subscriber', async () => {
        const atom = createAtom('foo');
        const Message = () => {
            const msg = useAtomValue(atom);
            return element('p', { slot: text(msg) });
        };
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return element('button', {
                slot: text('bar'),
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            const [, setMsg] = useAtom(atom);
            useEffect(() => setMsg('bar'), []);
            return element('div', { slot: [
                component(Message),
                component(Button),
            ] });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        const btn = wrapper.find('button')!;
        await waitFor(() => expect(para.textContent).toBe('bar'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('bar!'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('bar!!'));
    });

    it('updates within memo component', async () => {
        const atom = createAtom('foo');
        const Message = () => {
            const msg = useAtomValue(atom);
            return element('p', { slot: text(msg) });
        };
        const memo = () => component(Message);
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return element('button', {
                slot: text('bar'),
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            return element('div', { slot: [
                component(memo, { memo: [] }),
                component(Button),
            ] });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        const btn = wrapper.find('button')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('foo!'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('foo!!'));
    });

    it('does not re-render parents', async () => {
        const atom = createAtom('foo');
        const btnRunner = vi.fn();
        const compRunner = vi.fn();
        const Message = () => {
            const msg = useAtomValue(atom);
            return element('p', { slot: text(msg) });
        };
        const Button = () => {
            btnRunner();
            const setMsg = useAtomSetter(atom);
            return element('button', {
                slot: text('bar'),
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            compRunner();
            return element('div', { slot: [
                component(Message),
                component(Button),
            ] });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        const btn = wrapper.find('button')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('foo!'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('foo!!'));
        await wait(10);
        expect(btnRunner).toHaveBeenCalledOnce();
        expect(compRunner).toHaveBeenCalledOnce();
    });

    it('does not render when state change unmounts component', async () => {
        const atom = createAtom('foo');
        const msgRunner = vi.fn();
        const Message = () => {
            msgRunner();
            const msg = useAtomValue(atom);
            return element('p', { slot: text(msg) });
        };
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return element('button', {
                slot: text('bar'),
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            const msg = useAtomValue(atom);
            return element('div', { slot: [
                msg.length % 2 === 0 && component(Message),
                component(Button),
            ] });
        };
        const wrapper = mount(component(Root));
        const btn = wrapper.find('button')!;
        expect(wrapper.find('p')).toBe(null);
        btn.click();
        await waitFor(() => expect(wrapper.find('p')!.textContent).toBe('foo!'));
        btn.click();
        await waitFor(() => expect(wrapper.find('p')).toBe(null));
        await wait(10);
        expect(msgRunner).toHaveBeenCalledOnce();
    });

    it('does not needlessly re-render child subs of parent subs', async () => {
        const atom = createAtom('foo');
        const msgRunner = vi.fn();
        const Message = () => {
            msgRunner();
            const msg = useAtomValue(atom);
            return element('p', { slot: text(msg) });
        };
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return element('button', {
                slot: text('bar'),
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            const msg = useAtomValue(atom);
            if (msg === 'never') console.log('never');
            return element('div', { slot: [
                component(Message),
                component(Button),
            ] });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        const btn = wrapper.find('button')!;
        expect(para.textContent).toBe('foo');
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('foo!'));
        await wait(10);
        expect(msgRunner).toHaveBeenCalledTimes(2);
    });
});

describe('selectors', () => {
    it('basic use', async () => {
        const foo = createAtom('foo');
        const msgRunner = vi.fn();
        const msgLenRunner = vi.fn();
        const MessageLength = () => {
            msgLenRunner();
            const msgLength = useAtomSelector(foo, f => f.length);
            return element('p', { slot: text(`${msgLength}`) });
        };
        const Message = () => {
            msgRunner();
            const msg = useAtomValue(foo);
            return element('span', { slot: text(`${msg}`) });
        };
        const Button = () => {
            const setMsg = useAtomSetter(foo);
            return element('button', {
                slot: text('bar'),
                onclick: () => setMsg(s => s === 'foo' ? 'bar' : s === 'bar' ? 'foobar' : 'foo'),
            });
        };
        const Root = () => {
            return element('div', { slot: [
                component(Message),
                component(MessageLength),
                component(Button),
            ] });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        const spn = wrapper.find('span')!;
        const btn = wrapper.find('button')!;
        expect(spn.textContent).toBe('foo');
        expect(para.textContent).toBe('3');
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('3'));
        await waitFor(() => expect(spn.textContent).toBe('bar'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('6'));
        await waitFor(() => expect(spn.textContent).toBe('foobar'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('3'));
        await waitFor(() => expect(spn.textContent).toBe('foo'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('3'));
        await waitFor(() => expect(spn.textContent).toBe('bar'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('6'));
        await waitFor(() => expect(spn.textContent).toBe('foobar'));
        expect(msgRunner).toHaveBeenCalledTimes(6);
        expect(msgLenRunner).toHaveBeenCalledTimes(4);
    });

    it('doesn\'t update after selecting atom already updated', async () => {
        const foo = createAtom('foo');
        const msgRunner = vi.fn();
        const msgLenRunner = vi.fn();
        const MessageLength = () => {
            msgLenRunner();
            const msgLength = useAtomSelector(foo, f => f.length);
            const msg = useAtomValue(foo);
            if (msg.length != msgLength) {
                throw new Error('message length not right');
            }
            return element('p', { slot: text(`${msgLength}`) });
        };
        const Message = () => {
            msgRunner();
            const msg = useAtomValue(foo);
            return element('span', { slot: text(`${msg}`) });
        };
        const Button = () => {
            const setMsg = useAtomSetter(foo);
            return element('button', {
                slot: text('bar'),
                onclick: () => setMsg(s => s === 'foo' ? 'bar' : s === 'bar' ? 'foobar' : 'foo'),
            });
        };
        const Root = () => {
            return element('div', { slot: [
                component(Message),
                component(MessageLength),
                component(Button),
            ] });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        const spn = wrapper.find('span')!;
        const btn = wrapper.find('button')!;
        expect(spn.textContent).toBe('foo');
        expect(para.textContent).toBe('3');
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('3'));
        await waitFor(() => expect(spn.textContent).toBe('bar'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('6'));
        await waitFor(() => expect(spn.textContent).toBe('foobar'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('3'));
        await waitFor(() => expect(spn.textContent).toBe('foo'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('3'));
        await waitFor(() => expect(spn.textContent).toBe('bar'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('6'));
        await waitFor(() => expect(spn.textContent).toBe('foobar'));
        expect(msgRunner).toHaveBeenCalledTimes(6);
        expect(msgLenRunner).toHaveBeenCalledTimes(6);
    });
});

describe('watch', () => {
    it('basic use', async () => {
        const watch = vi.fn((prev, next) => {});
        const msgAtom = createAtom('foo', { watch: (prev, next) => watch(prev, next) });
        const Root = () => {
            const [msg, setMsg] = useAtom(msgAtom);
            return element('div', { slot: [
                element('span', { slot: text(msg) }),
                element('button', {
                    slot: text('bar'),
                    onclick: () => setMsg(s => s === 'foo' ? 'bar' : 'foo'),
                }),
            ] });
        };
        const wrapper = mount(component(Root));
        const btn = wrapper.find('button')!;
        btn.click();
        btn.click();
        await wait(10);
        expect(watch).toHaveBeenCalledTimes(2);
        expect(watch).toHaveBeenNthCalledWith(1, 'foo', 'bar');
        expect(watch).toHaveBeenNthCalledWith(2, 'bar', 'foo');
    });
});
