import { describe, bench } from 'vitest';
import { areDepsEqual, isString } from '../utils';

describe('utils', () => {
  const a = [1, 'foo', 'bar', false];
  const b = [1, 'foo', 'bar', true];
  bench('areDepsEqual', () => {
    // 14.7 mhz
    areDepsEqual(a, b);
  });
  let val = 4;
  bench('isString', () => {
    isString(val);
  });
});
