import { describe, it, expect, vi } from 'vitest';
import { useState, rendr, useEffect, Slot, p, span, button, div, section, h1 } from '..';
import { waitFor, mount, wait } from './utils';

describe('slot: non-keyed', () => {
    it('string change', async () => {
        const Root = () => {
            const [slot, setSlot] = useState('foo');
            return p({
                onclick: () => setSlot('bar'),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('bar'));
    });

    it('string and elem', async () => {
        const Root = () => {
            const [ty, setTy] = useState('elem');
            return p({
                onclick: () => setTy(t => t === 'elem' ? 'string' : 'elem'),
                slot: ty === 'elem' ? span({ slot: 'foo' }) : 'bar',
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('bar'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('foo'));
    });

    it('remove: end', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1']);
            return p({
                onclick: () => setSlot(s => s.slice(0, s.length - 1)),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('0'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe(''));
    });

    it('remove: all', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return p({
                onclick: () => setSlot([]),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe(''));
    });

    it('remove: front', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1']);
            return p({
                onclick: () => setSlot(s => s.slice(1)),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('1'));
    });

    it('remove: middle', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return p({
                onclick: () => setSlot(['0', '2']),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('02'));
    });

    it('remove and add', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return p({
                onclick: () => setSlot(['0', '3', '2']),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('032'));
    });

    it('add to end', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>([]);
            return p({
                onclick: () => setSlot(s => [...s, `${s.length}`]),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe(''));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('0'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('01'));
    });

    it('swap ends: 2', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1']);
            return p({
                onclick: () => setSlot(['1', '0']),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('10'));
    });

    it('swap ends: 3', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return p({
                onclick: () => setSlot(['2', '1', '0']),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('210'));
    });

    it('swap ends: 4', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3']);
            return p({
                onclick: () => setSlot(['3', '2', '1', '0']),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('0123'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('3210'));
    });

    it('swap mid: 4', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3']);
            return p({
                onclick: () => setSlot(['0', '2', '1', '3']),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('0123'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('0213'));
    });

    it('swap mid: 5', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return p({
                onclick: () => setSlot(['0', '3', '2', '1', '4']),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('03214'));
    });

    it('swap asymmetrically', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return p({
                onclick: () => setSlot(['0', '2', '1', '3', '4']),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('02134'));
    });

    it('rearrange: end to front', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return p({
                onclick: () => setSlot(['4', '0', '1', '2', '3']),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('40123'));
    });

    it('rearrange: end near to front', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return p({
                onclick: () => setSlot(['0', '4', '1', '2', '3']),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('04123'));
    });

    it('rearrange: front to end', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return p({
                onclick: () => setSlot(['1', '2', '3', '4', '0']),
                slot,
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('12340'));
    });

    it('early return', async () => {
        const Root = () => {
            const [changed, setChanged] = useState(false);
            if (!changed) {
                return p({
                    onclick: () => setChanged(true),
                    slot: [
                        span({ slot: 'foo' }),
                    ],
                });
            }
            return p({
                onclick: () => setChanged(false),
                slot: [
                    span({ slot: 'foo' }),
                    span({ slot: 'bar' }),
                    span({ slot: 'bat' }),
                ],
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        para.click();
        await waitFor(() => expect(para.textContent).toBe('foobarbat'));
    });

    it('singleton elem', async () => {
        const spn = span({ slot: 'singleton' });
        const Root = () => {
          const [margin, setMargin] = useState(10);
          return p({
            slot: [
              'bar',
              spn,
            ],
            style: `margin: ${margin}px`,
            onclick: () => setMargin(c => c * 2),
          });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        waitFor(() => expect(para.textContent).toBe('barsingleton'));
        para.click();
        para.click();
        waitFor(() => expect(para.textContent).toBe('barsingleton'));
    });
});

describe('slot: keyed', () => {
    it('remove: end', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1']);
            return p({
                onclick: () => setSlot(s => s.slice(0, s.length - 1)),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('0'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe(''));
    });

    it('remove: front', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1']);
            return p({
                onclick: () => setSlot(s => s.slice(1)),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('1'));
    });

    it('remove: middle', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return p({
                onclick: () => setSlot(['0', '2']),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('02'));
    });

    it('remove: middle component', async () => {
        const Span = ({ slot }: { slot: string }) => span({ slot });
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return p({
                onclick: () => setSlot(['0', '2']),
                slot: slot.map(s => rendr(Span, { slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('02'));
    });

    it('remove and add', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return p({
                onclick: () => setSlot(['0', '3', '2']),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('032'));
    });

    it('add to end', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>([]);
            return p({
                onclick: () => setSlot(s => [...s, `${s.length}`]),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe(''));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('0'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('01'));
    });

    it('swap ends: 2', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1']);
            return p({
                onclick: () => setSlot(['1', '0']),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('10'));
    });

    it('swap ends: 3', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return p({
                onclick: () => setSlot(['2', '1', '0']),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('210'));
    });

    it('swap ends: 4', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3']);
            return p({
                onclick: () => setSlot(['3', '2', '1', '0']),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('0123'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('3210'));
    });

    it('swap mid: 4', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3']);
            return p({
                onclick: () => setSlot(['0', '2', '1', '3']),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('0123'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('0213'));
    });

    it('swap mid: 5', async () => {
        const run = vi.fn(() => {});
        const Item = ({ text }: { text: string }) => {
            useEffect(run, []);
            return span({ slot: text, key: text });
        };
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return p({
                onclick: () => setSlot(['0', '3', '2', '1', '4']),
                slot: slot.map(text => rendr(Item, { text })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('03214'));
        await waitFor(() => expect(run).toHaveBeenCalledTimes(5));
    });

    it('swap asymmetrically', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return p({
                onclick: () => setSlot(['0', '2', '1', '3', '4']),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('02134'));
    });

    it('rearrange: end to front', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return p({
                onclick: () => setSlot(['4', '0', '1', '2', '3']),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('40123'));
    });

    it('rearrange: end near to front', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return p({
                onclick: () => setSlot(['0', '4', '1', '2', '3']),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('04123'));
    });

    it('rearrange: front to end', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return p({
                onclick: () => setSlot(['1', '2', '3', '4', '0']),
                slot: slot.map(s => span({ slot: s, key: s })),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('12340'));
    });
});

describe('attributes', () => {
    it('remove onclick from element', async () => {
        const Root = () => {
            const [listen, setListen] = useState(true);
            const [cnt, setCnt] = useState(0);
            const onclick = listen ? () => setCnt(c => c + 1) : undefined;
            return div({ slot: [
                button({ id: 'inc', slot: 'increment', onclick }),
                button({ id: 'toggle', slot: 'toggle listen', onclick: () => setListen(l => !l) }),
                p({ slot: `${cnt}` })
            ] });
        };
        const wrapper = mount(rendr(Root));
        const inc = wrapper.find('#inc')!;
        const toggle = wrapper.find('#toggle')!;
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('0'));
        inc.click();
        await waitFor(() => expect(para.textContent).toBe('1'));
        toggle.click();
        inc.click();
        await waitFor(() => expect(para.textContent).toBe('1'));
        toggle.click();
        inc.click();
        await waitFor(() => expect(para.textContent).toBe('2'));
      });

      it('update onclick', async () => {
        const Child = ({ onclick }: { onclick: () => void }) => section({
            slot: 'foo',
            onclick: onclick,
        });
        const Root = () => {
            const [state, setState] = useState<{ data: number[] }>({ data: [] });
            const onclick = () => {
                const data = [...state.data];
                data.push(0);
                setState({ data });
            };
            return div({
                slot: [
                    p({ slot: `${state.data.length}` }),
                    rendr(Child, {
                        onclick: onclick,
                    }),
                ],
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        const sec = wrapper.find('section')!;
        waitFor(() => expect(para.textContent).toBe('0'));
        sec.click();
        waitFor(() => expect(para.textContent).toBe('1'));
        sec.click();
        waitFor(() => expect(para.textContent).toBe('2'));
    });

    it('class change', async () => {
        const Root = () => {
            const [className, setClassName] = useState('foo');
            return p({
                slot: 'bar',
                class: className,
                onclick: () => setClassName(c => c + '-'),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        para.click();
        await waitFor(() => expect(para.className).toBe('foo-'));
    });

    it('class remove', async () => {
        const Root = () => {
            const [className, setClassName] = useState<string | undefined>('foo');
            return p({
                slot: 'bar',
                class: className,
                onclick: () => setClassName(undefined),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        para.click();
        await waitFor(() => expect(para.className).toBe(''));
    });

    it('style change', async () => {
        const Root = () => {
            const [margin, setMargin] = useState(10);
            return p({
                slot: 'bar',
                style: `margin: ${margin}px`,
                onclick: () => setMargin(c => c * 2),
            });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        para.click();
        await waitFor(() => expect(para.style.margin).toBe('20px'));
    });

    it('button disabled', async () => {
        const Root = () => {
            const [disabled, setDisabled] = useState(false);
            return div({ slot: [
                button({ id: 'toggled', disabled }),
                button({ id: 'toggler', slot: 'toggle', onclick: () => setDisabled(d => !d) }),
            ] });
        };
        const wrapper = mount(rendr(Root));
        const toggled = wrapper.find('#toggled')!;
        const toggler = wrapper.find('#toggler')!;
        await waitFor(() => expect(toggled.getAttribute('disabled')).toBe(null));
        toggler.click();
        await waitFor(() => expect(toggled.getAttribute('disabled')).not.toBe(null));
        toggler.click();
        await waitFor(() => expect(toggled.getAttribute('disabled')).toBe(null));
    });

    it('can reuse component with children', async () => {
        const heading = h1({ slot: 'foo' });
        const Root = () => {
          const [show, setShow] = useState(true);
          return div({ slot: [
            show && heading,
            button({ id: 'toggler', slot: 'toggle', onclick: () => setShow(s => !s) }),
          ] });
        };
        const wrapper = mount(rendr(Root));
        const toggler = wrapper.find('#toggler')!;
        await waitFor(() => expect(wrapper.find('h1')!.textContent).toBe('foo'));
        toggler.click();
        await waitFor(() => expect(wrapper.find('h1')).toBe(null));
        toggler.click();
        await waitFor(() => expect(wrapper.find('h1')!.textContent).toBe('foo'));
    });
});

describe('memo', () => {
    it('memoizes component', async () => {
        const Child = ({ onclick, slot }: { onclick: () => void, slot: Slot }) => p({ slot, onclick, id: 'foo' });
        const Root = () => {
            const [margin, setMargin] = useState(10);
            return rendr(Child, { onclick: () => setMargin(c => c + 1), slot: `m:${margin}`, memo: [1] });
        };
        const wrapper = mount(rendr(Root));
        const para = wrapper.find('p')!;
        para.click();
        await waitFor(() => expect(para.textContent).toBe('m:10'));
    });
});

describe('non-list keys', () => {
    it('recreates for new key', async () => {
        interface Props {
            onclick: () => void
            slot: Slot
        }
        const effect = vi.fn();
        const Para = ({ onclick, slot }: Props) => {
            return p({ slot, onclick });
        };
        const Span = ({ onclick, slot }: Props) => {
            useEffect(effect, []);
            return span({ slot, onclick });
        };
        const Root = () => {
            const [cnt, setCnt] = useState(0);
            return div({
                slot: [
                    rendr(Para, {
                        onclick: () => setCnt(c => c + 1),
                        slot: `para: ${cnt}`,
                    }),
                    rendr(Span, {
                        key: `span: ${cnt}`,
                        onclick: () => setCnt(c => c + 1),
                        slot: `span: ${cnt}`,
                    }),
                ],
            });
        };
        const wrapper = mount(rendr(Root));
        await waitFor(() => expect(effect).toHaveBeenCalledOnce());
        expect(wrapper.find('p')!.textContent).toBe('para: 0');
        expect(wrapper.find('span')!.textContent).toBe('span: 0');
        wrapper.find('p')!.click();
        await wait(10);
        expect(wrapper.find('p')!.textContent).toBe('para: 1');
        expect(wrapper.find('span')!.textContent).toBe('span: 1');
        expect(effect).toHaveBeenCalledTimes(2);
    });
});
