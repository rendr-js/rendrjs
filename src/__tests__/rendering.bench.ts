import { describe, bench } from 'vitest';
import { rendr } from '..';
import { mount } from './utils';
import { reconcile } from '../reconcile';
import { Elem, createDom } from '../elem';

const rec = (prev: Elem, next: Elem) => {
  prev.d = createDom(prev);
  reconcile(prev, next);
};

describe('rendering', () => {
  bench('p: ["foo"]', () => {
    const Root = () => rendr('p', { slot: 'foo' });
    mount(rendr(Root));
  });

  bench('div: [p: [string] x 2]', () => {
    const Para = ({ slot }: { slot: string }) => rendr('p', { slot });
    const Root = () => rendr('div', {
      slot: [
        rendr(Para, { slot: 'foo' }),
        rendr(Para, { slot: 'bar' }),
      ],
    });
    mount(rendr(Root));
  });

  bench('div: [p: [string] x 100,000]', () => {
    const Para = ({ slot }: { slot: string }) => rendr('p', { slot });
    const Root = () => rendr('div', {
      slot: new Array(100000).map((_, i) => rendr(Para, { slot: `${i}` })),
    });
    mount(rendr(Root));
  });
});

describe('reconciling', () => {
  bench('p: [string]', () => {
    const prev = rendr('p', { slot: 'foo' });
    const next = rendr('p', { slot: 'bar' });
    rec(prev, next);
  });

  bench('div: [p: [string] x 100,000]', () => {
    const indices = new Array(100000).map((_, i) => i);
    const Para = ({ slot }: { slot: string }) => rendr('p', { slot });
    const prev = rendr('div', {
      slot: indices.map((_, i) => rendr(Para, {
        key: `${i}`,
        slot: `index: ${i}`,
      })),
    });
    indices.reverse();
    const next = rendr('div', {
      slot: indices.map((_, i) => rendr(Para, {
        key: `${i}`,
        slot: `index: ${i}`,
      })),
    });
    rec(prev, next);
  });
});
