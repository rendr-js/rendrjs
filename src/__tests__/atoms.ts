import { describe, it, expect, vi } from 'vitest';
import { rendr, useEffect, createAtom, useAtomValue, useAtomSetter, useAtom, button, p, div, span } from '..';
import { waitFor, mount, wait } from './utils';
import { useAtomSelector } from '../hooks';

describe('standard', () => {
    it('basic use', async () => {
        const atom = createAtom('foo');
        const Message = () => {
            const msg = useAtomValue(atom);
            return p({ slot: msg });
        };
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return button({
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            return div({ slot: [
                rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
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
            return p({ slot: msg });
        };
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return button({
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            const [, setMsg] = useAtom(atom);
            useEffect(() => setMsg('bar'), []);
            return div({ slot: [
                rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
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
            return p({ slot: msg });
        };
        const memo = () => rendr(Message);
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return button({
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            return div({ slot: [
                rendr(memo, { memo: [] }),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
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
            return p({ slot: msg });
        };
        const Button = () => {
            btnRunner();
            const setMsg = useAtomSetter(atom);
            return button({
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            compRunner();
            return div({ slot: [
                rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
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
            return p({ slot: msg });
        };
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return button({
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            const msg = useAtomValue(atom);
            return div({ slot: [
                msg.length % 2 === 0 && rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
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
            return p({ slot: msg });
        };
        const Button = () => {
            const setMsg = useAtomSetter(atom);
            return button({
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            const msg = useAtomValue(atom);
            if (msg === 'never') console.log('never');
            return div({ slot: [
                rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        const btn = wrapper.find('button')!;
        expect(para.textContent).toBe('foo');
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('foo!'));
        await wait(10);
        expect(msgRunner).toHaveBeenCalledTimes(2);
    });
});

describe('derived', () => {
    it('basic use', async () => {
        const foo = createAtom('foo');
        const fooLength = createAtom(get => get(foo).length);
        const Message = () => {
            const msgLength = useAtomValue(fooLength);
            return p({ slot: `${msgLength}` });
        };
        const Button = () => {
            const setMsg = useAtomSetter(foo);
            return button({
                slot: 'bar',
                onclick: () => setMsg(s => s + '!'),
            });
        };
        const Root = () => {
            return div({ slot: [
                rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        const btn = wrapper.find('button')!;
        expect(para.textContent).toBe('3');
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('4'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('5'));
    });

    it('does not re-render when used atom state changes but derived atom state does not change', async () => {
        const foo = createAtom('foo');
        const fooLength = createAtom(get => get(foo).length);
        const msgRunner = vi.fn();
        const Message = () => {
            msgRunner();
            const msgLength = useAtomValue(fooLength);
            return p({ slot: `${msgLength}` });
        };
        const Button = () => {
            const setMsg = useAtomSetter(foo);
            return button({
                slot: 'bar',
                onclick: () => setMsg(s => s === 'foo' ? 'bar' : 'foo'),
            });
        };
        const Root = () => {
            return div({ slot: [
                rendr(Message),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        const btn = wrapper.find('button')!;
        expect(para.textContent).toBe('3');
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('3'));
        btn.click();
        await waitFor(() => expect(para.textContent).toBe('3'));
        await wait(10);
        expect(msgRunner).toHaveBeenCalledOnce();
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
            return p({ slot: `${msgLength}` });
        };
        const Message = () => {
            msgRunner();
            const msg = useAtomValue(foo);
            return span({ slot: `${msg}` });
        };
        const Button = () => {
            const setMsg = useAtomSetter(foo);
            return button({
                slot: 'bar',
                onclick: () => setMsg(s => s === 'foo' ? 'bar' : s === 'bar' ? 'foobar' : 'foo'),
            });
        };
        const Root = () => {
            return div({ slot: [
                rendr(Message),
                rendr(MessageLength),
                rendr(Button),
            ] });
        };
        const wrapper = mount(rendr(Root));
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
});

describe('watch', () => {
    it('basic use', async () => {
        const watch = vi.fn((prev, next) => {});
        const msgAtom = createAtom('foo', { watch: (prev, next) => watch(prev, next) });
        const Root = () => {
            const [msg, setMsg] = useAtom(msgAtom);
            return div({ slot: [
                span({ slot: msg }),
                button({
                    slot: 'bar',
                    onclick: () => setMsg(s => s === 'foo' ? 'bar' : 'foo'),
                }),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const btn = wrapper.find('button')!;
        btn.click();
        btn.click();
        await wait(10);
        expect(watch).toHaveBeenCalledTimes(2);
        expect(watch).toHaveBeenNthCalledWith(1, 'foo', 'bar');
        expect(watch).toHaveBeenNthCalledWith(2, 'bar', 'foo');
    });

    it('derived atom', async () => {
        const watch = vi.fn((prev, next) => {});
        const msgAtom = createAtom('foo');
        const msgLenAtom = createAtom(get => get(msgAtom).length, { watch: (prev, next) => watch(prev, next) });
        const Root = () => {
            const [msg, setMsg] = useAtom(msgAtom);
            const msgLen = useAtomValue(msgLenAtom);
            return div({ slot: [
                span({ slot: `${msg}: ${msgLen}` }),
                button({
                    slot: 'bar',
                    onclick: () => setMsg(s => s === 'foo' ? 'foobar' : 'foobarbaz'),
                }),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const btn = wrapper.find('button')!;
        btn.click();
        await wait(10);
        expect(watch).toHaveBeenNthCalledWith(1, 3, 6);
        btn.click();
        await wait(10);
        expect(watch).toHaveBeenNthCalledWith(2, 6, 9);
    });
});
