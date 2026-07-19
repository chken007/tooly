import { describe, expect, it } from 'vitest';
import { evaluateRegex, normalizeRegexFlags } from './regex';

describe('regex evaluation', () => {
  it('returns global matches and capture groups', () => {
    const result = evaluateRegex('(foo)-(\\d+)', 'g', 'foo-1 and foo-22');
    expect(result.matches).toEqual([
      { value: 'foo-1', index: 0, groups: ['foo', '1'], namedGroups: {} },
      { value: 'foo-22', index: 10, groups: ['foo', '22'], namedGroups: {} },
    ]);
  });

  it('returns named groups and replacement output', () => {
    const result = evaluateRegex('(?<word>[a-z]+)', 'gi', 'One TWO', '[$<word>]');
    expect(result.matches[0].namedGroups).toEqual({ word: 'One' });
    expect(result.replacement).toBe('[One] [TWO]');
  });

  it('handles zero-length global matches without looping forever', () => {
    expect(evaluateRegex('^|$', 'gm', 'a\nb').matches).toHaveLength(4);
  });

  it('validates and deduplicates flags', () => {
    expect(normalizeRegexFlags('ggi')).toBe('gi');
    expect(() => normalizeRegexFlags('uv')).toThrow('cannot be used together');
    expect(() => normalizeRegexFlags('x')).toThrow('Unsupported regex flag');
  });
});

