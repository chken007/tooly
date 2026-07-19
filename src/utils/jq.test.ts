import { describe, expect, it } from 'vitest';
import { applyJqFilter, evaluateJqExpression } from './jq';

const data = {
  users: [
    { name: 'Ada', active: true },
    { name: 'Linus', active: false },
  ],
  meta: { count: 2 },
};

describe('jq-like filters', () => {
  it('reads nested paths and array indexes', () => {
    expect(evaluateJqExpression(data, '.users[1].name')).toBe('Linus');
  });

  it('maps remaining tokens over array iteration', () => {
    expect(evaluateJqExpression(data, '.users[].name')).toEqual(['Ada', 'Linus']);
  });

  it('supports functions and pipes', () => {
    expect(applyJqFilter(data, '.users | length')).toBe(2);
    expect(evaluateJqExpression(data.meta, 'keys')).toEqual(['count']);
  });

  it('reports invalid paths', () => {
    expect(() => evaluateJqExpression(data, '.missing')).toThrow('Key "missing" not found');
    expect(() => evaluateJqExpression(data, '.users[8]')).toThrow('Index 8 out of bounds');
  });
});

