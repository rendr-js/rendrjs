import { describe, bench } from 'vitest';
import { rendr, p, div } from '..';
import { mount } from './utils';
import { reconcile } from '../reconcile';
import { Elem, createDom } from '../elem';

const rec = (prev: Elem, next: Elem) => {
  prev.d = createDom(prev);
  reconcile(prev, next);
};

describe('rendering', () => {
  bench('p: ["foo"]', () => {
    const Root = () => p({ slot: 'foo' });
    mount(rendr(Root));
  });

  bench('div: [p: [string] x 2]', () => {
    const Para = ({ slot }: { slot: string }) => p({ slot });
    const Root = () => div({
      slot: [
        rendr(Para, { slot: 'foo' }),
        rendr(Para, { slot: 'bar' }),
      ],
    });
    mount(rendr(Root));
  });

  bench('div: [p: [string] x 100,000]', () => {
    const Para = ({ slot }: { slot: string }) => p({ slot });
    const Root = () => div({
      slot: new Array(100000).map((_, i) => rendr(Para, { slot: `${i}` })),
    });
    mount(rendr(Root));
  });
});

describe('reconciling', () => {
  bench('p: [string]', () => {
    const prev = p({ slot: 'foo' });
    const next = p({ slot: 'bar' });
    rec(prev, next);
  });

  bench('div: [p: [string] x 100,000]', () => {
    const indices = new Array(100000).map((_, i) => i);
    const Para = ({ slot }: { slot: string }) => p({ slot });
    const prev = div({
      slot: indices.map((_, i) => rendr(Para, {
        key: `${i}`,
        slot: `index: ${i}`,
      })),
    });
    indices.reverse();
    const next = div({
      slot: indices.map((_, i) => rendr(Para, {
        key: `${i}`,
        slot: `index: ${i}`,
      })),
    });
    rec(prev, next);
  });
});
