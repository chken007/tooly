import { describe, expect, it } from 'vitest';
import { beautifyAndSortJSON, beautifyJSON, sortJSON } from './formatters';

describe('JSON formatters', () => {
  it('beautifies valid JSON', () => {
    expect(beautifyJSON('{"answer":42}')).toBe('{\n  "answer": 42\n}');
  });

  it('sorts nested object keys without reordering arrays', () => {
    expect(sortJSON({ z: 1, a: [{ y: 2, b: 3 }] })).toEqual({
      a: [{ b: 3, y: 2 }],
      z: 1,
    });
  });

  it('beautifies and sorts JSON in one operation', () => {
    expect(beautifyAndSortJSON('{"z":1,"a":2}')).toBe(
      '{\n  "a": 2,\n  "z": 1\n}',
    );
  });
});

