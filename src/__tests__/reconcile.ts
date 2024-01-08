import { describe, it, expect, vi } from 'vitest';
import { useState, component, useEffect, Slot, element, text } from '..';
import { waitFor, mount, wait } from './utils';

describe('slot: non-keyed', () => {
    it('string change', async () => {
        const Root = () => {
            const [slot, setSlot] = useState('foo');
            return element('p', {
                onclick: () => setSlot('bar'),
                slot: text(slot),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('foo'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('bar'));
    });

    it('string and elem', async () => {
        const Root = () => {
            const [ty, setTy] = useState('elem');
            return element('p', {
                onclick: () => setTy(t => t === 'elem' ? 'string' : 'elem'),
                slot: ty === 'elem' ? element('span', { slot: text('foo') }) : text('bar'),
            });
        };
        const wrapper = mount(component(Root));
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
            return element('p', {
                onclick: () => setSlot(s => s.slice(0, s.length - 1)),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
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
            return element('p', {
                onclick: () => setSlot([]),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe(''));
    });

    it('remove: front', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1']);
            return element('p', {
                onclick: () => setSlot(s => s.slice(1)),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('1'));
    });

    it('remove: middle', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return element('p', {
                onclick: () => setSlot(['0', '2']),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('02'));
    });

    it('remove and add', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return element('p', {
                onclick: () => setSlot(['0', '3', '2']),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('032'));
    });

    it('add to end', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>([]);
            return element('p', {
                onclick: () => setSlot(s => [...s, `${s.length}`]),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
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
            return element('p', {
                onclick: () => setSlot(['1', '0']),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('10'));
    });

    it('swap ends: 3', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return element('p', {
                onclick: () => setSlot(['2', '1', '0']),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('210'));
    });

    it('swap ends: 4', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3']);
            return element('p', {
                onclick: () => setSlot(['3', '2', '1', '0']),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('0123'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('3210'));
    });

    it('swap mid: 4', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3']);
            return element('p', {
                onclick: () => setSlot(['0', '2', '1', '3']),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('0123'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('0213'));
    });

    it('swap mid: 5', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return element('p', {
                onclick: () => setSlot(['0', '3', '2', '1', '4']),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('03214'));
    });

    it('swap asymmetrically', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return element('p', {
                onclick: () => setSlot(['0', '2', '1', '3', '4']),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('02134'));
    });

    it('rearrange: end to front', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return element('p', {
                onclick: () => setSlot(['4', '0', '1', '2', '3']),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('40123'));
    });

    it('rearrange: end near to front', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return element('p', {
                onclick: () => setSlot(['0', '4', '1', '2', '3']),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('04123'));
    });

    it('rearrange: front to end', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return element('p', {
                onclick: () => setSlot(['1', '2', '3', '4', '0']),
                slot: slot.map(t => text(t)),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('12340'));
    });

    it('early return', async () => {
        const Root = () => {
            const [changed, setChanged] = useState(false);
            if (!changed) {
                return element('p', {
                    onclick: () => setChanged(true),
                    slot: [
                        element('span', { slot: text('foo') }),
                    ],
                });
            }
            return element('p', {
                onclick: () => setChanged(false),
                slot: [
                    element('span', { slot: text('foo') }),
                    element('span', { slot: text('bar') }),
                    element('span', { slot: text('bat') }),
                ],
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        para.click();
        await waitFor(() => expect(para.textContent).toBe('foobarbat'));
    });

    it('singleton elem', async () => {
        const spn = element('span', { slot: text('singleton') });
        const Root = () => {
          const [margin, setMargin] = useState(10);
          return element('p', {
            slot: [
              text('bar'),
              spn,
            ],
            style: `margin: ${margin}px`,
            onclick: () => setMargin(c => c * 2),
          });
        };
        const wrapper = mount(component(Root));
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
            return element('p', {
                onclick: () => setSlot(s => s.slice(0, s.length - 1)),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
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
            return element('p', {
                onclick: () => setSlot(s => s.slice(1)),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('1'));
    });

    it('remove: middle', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return element('p', {
                onclick: () => setSlot(['0', '2']),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('02'));
    });

    it('remove: middle component', async () => {
        const Span = ({ slot }: { slot: string }) => element('span', { slot: text(slot) });
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return element('p', {
                onclick: () => setSlot(['0', '2']),
                slot: slot.map(s => component(Span, { slot: s, key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('02'));
    });

    it('remove and add', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return element('p', {
                onclick: () => setSlot(['0', '3', '2']),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('032'));
    });

    it('add to end', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>([]);
            return element('p', {
                onclick: () => setSlot(s => [...s, `${s.length}`]),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
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
            return element('p', {
                onclick: () => setSlot(['1', '0']),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('10'));
    });

    it('swap ends: 3', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2']);
            return element('p', {
                onclick: () => setSlot(['2', '1', '0']),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('012'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('210'));
    });

    it('swap ends: 4', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3']);
            return element('p', {
                onclick: () => setSlot(['3', '2', '1', '0']),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('0123'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('3210'));
    });

    it('swap mid: 4', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3']);
            return element('p', {
                onclick: () => setSlot(['0', '2', '1', '3']),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('0123'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('0213'));
    });

    it('swap mid: 5', async () => {
        const run = vi.fn(() => {});
        const Item = ({ txt }: { txt: string }) => {
            useEffect(run, []);
            return element('span', { slot: text(txt), key: txt });
        };
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return element('p', {
                onclick: () => setSlot(['0', '3', '2', '1', '4']),
                slot: slot.map(txt => component(Item, { txt })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('03214'));
        await waitFor(() => expect(run).toHaveBeenCalledTimes(5));
    });

    it('swap asymmetrically', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return element('p', {
                onclick: () => setSlot(['0', '2', '1', '3', '4']),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('02134'));
    });

    it('rearrange: end to front', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return element('p', {
                onclick: () => setSlot(['4', '0', '1', '2', '3']),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('40123'));
    });

    it('rearrange: end near to front', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return element('p', {
                onclick: () => setSlot(['0', '4', '1', '2', '3']),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('04123'));
    });

    it('rearrange: front to end', async () => {
        const Root = () => {
            const [slot, setSlot] = useState<string[]>(['0', '1', '2', '3', '4']);
            return element('p', {
                onclick: () => setSlot(['1', '2', '3', '4', '0']),
                slot: slot.map(s => element('span', { slot: text(s), key: s })),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('01234'));
        para.click();
        await waitFor(() => expect(para.textContent).toBe('12340'));
    });
    
    it('namespace change', async () => {
        const Root = () => {
            const [showRect, setShowRect] = useState(false);
            const rect = element('rect', {
                width: 50,
                height: 50,
                style: 'strokeWidth: 3',
            });
            const path = element('path', {
                d: 'M150 0 L75 200 L225 200 Z',
            });
            return element('div', {
                slot: [
                    element('button', {
                        onclick: () => setShowRect(s => !s),
                        slot: text('toggle'),
                    }),
                    element('svg', {
                        width: 100,
                        height: 100,
                        slot: showRect ? rect : path,
                    }),
                ],
            });
        };
        const wrapper = mount(component(Root));
        const toggle = wrapper.find('button')!;
        await waitFor(() => expect(wrapper.find('rect')).toBe(null));
        await waitFor(() => expect(wrapper.find('path')).not.toBe(null));
        toggle.click();
        await waitFor(() => expect(wrapper.find('rect')).not.toBe(null));
    });
});

describe('attributes', () => {
    it('remove onclick from element', async () => {
        const Root = () => {
            const [listen, setListen] = useState(true);
            const [cnt, setCnt] = useState(0);
            const btn = listen ? element('button', { id: 'inc', slot: text('increment'), onclick: () => setCnt(c => c + 1) }) : element('button', { id: 'inc', slot: text('increment') });
            return element('div', { slot: [
                btn,
                element('button', { id: 'toggle', slot: text('toggle listen'), onclick: () => setListen(l => !l) }),
                element('p', { slot: text(`${cnt}`) }),
            ] });
        };
        const wrapper = mount(component(Root));
        const inc = wrapper.find('#inc')!;
        const toggle = wrapper.find('#toggle')!;
        const para = wrapper.find('p')!;
        await waitFor(() => expect(para.textContent).toBe('0'));
        inc.click();
        await waitFor(() => expect(para.textContent).toBe('1'));
        toggle.click();
        await wait(10);
        inc.click();
        await wait(10);
        await waitFor(() => expect(para.textContent).toBe('1'));
        toggle.click();
        await wait(10);
        inc.click();
        await waitFor(() => expect(para.textContent).toBe('2'));
      });

      it('update onclick', async () => {
        const Child = ({ onclick }: { onclick: () => void }) => element('section', {
            slot: text('foo'),
            onclick: onclick,
        });
        const Root = () => {
            const [state, setState] = useState<{ data: number[] }>({ data: [] });
            const onclick = () => {
                const data = [...state.data];
                data.push(0);
                setState({ data });
            };
            return element('div', {
                slot: [
                    element('p', { slot: text(`${state.data.length}`) }),
                    component(Child, {
                        onclick: onclick,
                    }),
                ],
            });
        };
        const wrapper = mount(component(Root));
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
            return element('p', {
                slot: text('bar'),
                class: className,
                onclick: () => setClassName(c => c + '-'),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        para.click();
        await waitFor(() => expect(para.className).toBe('foo-'));
    });

    it('class remove', async () => {
        const Root = () => {
            const [className, setClassName] = useState<string | undefined>('foo');
            return element('p', {
                slot: text('bar'),
                class: className,
                onclick: () => setClassName(undefined),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        para.click();
        await waitFor(() => expect(para.className).toBe(''));
    });

    it('style change', async () => {
        const Root = () => {
            const [margin, setMargin] = useState(10);
            return element('p', {
                slot: text('bar'),
                style: `margin: ${margin}px`,
                onclick: () => setMargin(c => c * 2),
            });
        };
        const wrapper = mount(component(Root));
        const para = wrapper.find('p')!;
        para.click();
        await waitFor(() => expect(para.style.margin).toBe('20px'));
    });

    it('button disabled', async () => {
        const Root = () => {
            const [disabled, setDisabled] = useState(false);
            return element('div', { slot: [
                element('button', { id: 'toggled', disabled }),
                element('button', { id: 'toggler', slot: text('toggle'), onclick: () => setDisabled(d => !d) }),
            ] });
        };
        const wrapper = mount(component(Root));
        const toggled = wrapper.find('#toggled')!;
        const toggler = wrapper.find('#toggler')!;
        await waitFor(() => expect(toggled.getAttribute('disabled')).toBe(null));
        toggler.click();
        await waitFor(() => expect(toggled.getAttribute('disabled')).not.toBe(null));
        toggler.click();
        await waitFor(() => expect(toggled.getAttribute('disabled')).toBe(null));
    });

    it('can reuse component with children', async () => {
        const heading = element('h1', { slot: text('foo') });
        const Root = () => {
          const [show, setShow] = useState(true);
          return element('div', { slot: [
            show && heading,
            element('button', { id: 'toggler', slot: text('toggle'), onclick: () => setShow(s => !s) }),
          ] });
        };
        const wrapper = mount(component(Root));
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
        const Child = ({ onclick, slot }: { onclick: () => void, slot: Slot }) => element('p', { slot, onclick, id: 'foo' });
        const Root = () => {
            const [margin, setMargin] = useState(10);
            return component(Child, { onclick: () => setMargin(c => c + 1), slot: text(`m:${margin}`), memo: [1] });
        };
        const wrapper = mount(component(Root));
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
            return element('p', { slot, onclick });
        };
        const Span = ({ onclick, slot }: Props) => {
            useEffect(effect, []);
            return element('span', { slot, onclick });
        };
        const Root = () => {
            const [cnt, setCnt] = useState(0);
            return element('div', {
                slot: [
                    component(Para, {
                        onclick: () => setCnt(c => c + 1),
                        slot: text(`para: ${cnt}`),
                    }),
                    component(Span, {
                        key: `span: ${cnt}`,
                        onclick: () => setCnt(c => c + 1),
                        slot: text(`span: ${cnt}`),
                    }),
                ],
            });
        };
        const wrapper = mount(component(Root));
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
