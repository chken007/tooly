import { describe, expect, it } from 'vitest';
import { beautifyLooseJson } from './looseJson';

describe('loose JSON formatting', () => {
  it('formats valid JSON', () => {
    expect(beautifyLooseJson('{"value":1}')).toBe('{\n  "value": 1\n}');
  });

  it('repairs common object syntax mistakes', () => {
    expect(beautifyLooseJson("{value: 'ok',}")).toBe('{\n  "value": "ok"\n}');
  });

  it('adds missing closing delimiters', () => {
    expect(beautifyLooseJson('{"items":[1,2]')).toBe(
      '{\n  "items": [\n    1,\n    2\n  ]\n}',
    );
  });

  it('rejects content that cannot be repaired', () => {
    expect(() => beautifyLooseJson('plain text')).toThrow('Content is not JSON');
  });
});

