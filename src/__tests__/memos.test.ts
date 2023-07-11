import { describe, it, expect, vi } from 'vitest';
import { useState, rendr, useMemo } from '..';
import { mount, wait } from './utils';

describe('refs', () => {
    it('initializes memo correctly', () => {
        const Root = () => {
        const slot = useMemo(() => 'foo', []);
            return rendr('p', { slot });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        expect(p.textContent).toBe('foo');
    });
    
    it('initializes memo only once with no deps', async () => {
        const memo = vi.fn(() => 'foo');
        const Root = () => {
            const [, set] = useState(0);
            const slot = useMemo(memo, []);
            return rendr('p', {
                slot,
                onclick: () => set(v => v + 1),
            });
        };
        const wrapper = mount(rendr(Root));
        const p = wrapper.find('p')!;
        p.click();
        await wait(10);
        expect(memo).toHaveBeenCalledOnce();
    });

    it('recomputes memo only when deps change', async () => {
      const memo = vi.fn(() => 'foo');
      const Root = () => {
          const [cnt, setCnt] = useState(0);
          const slot = useMemo(memo, [cnt]);
          return rendr('p', {
              slot,
              onclick: () => setCnt(v => v + 1),
          });
      };
      const wrapper = mount(rendr(Root));
      const p = wrapper.find('p')!;
      expect(memo).toHaveBeenCalledOnce();
      p.click();
      await wait(10);
      expect(memo).toHaveBeenCalledTimes(2);
  });
   
    it('throws error when used outside of component render function', () => {
      const fail = vi.fn();
      try {
        useMemo(() => null, []);
      } catch (e) {
        fail();
      }
      expect(fail).toHaveBeenCalledOnce();
    });
});
