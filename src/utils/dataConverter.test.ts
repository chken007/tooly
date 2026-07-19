import { describe, expect, it } from 'vitest';
import { convertData, parseData, serializeData } from './dataConverter';

describe('data conversion', () => {
  it('converts JSON arrays to CSV and back', () => {
    const csv = convertData('[{"name":"Ada","active":true}]', 'json', 'csv');
    expect(csv).toBe('name,active\nAda,true');
    expect(JSON.parse(convertData(csv, 'csv', 'json'))).toEqual([
      { name: 'Ada', active: true },
    ]);
  });

  it('converts JSON to YAML and back', () => {
    const yaml = convertData('{"service":{"port":3000}}', 'json', 'yaml');
    expect(yaml).toContain('service:');
    expect(parseData(yaml, 'yaml')).toEqual({ service: { port: 3000 } });
  });

  it('protects spreadsheet formulas in CSV output', () => {
    expect(serializeData([{ value: '=1+1' }], 'csv')).toBe('value\n"\'=1+1"');
  });

  it('reports malformed input with its source format', () => {
    expect(() => convertData('{bad', 'json', 'yaml')).toThrow('Could not parse JSON');
  });
});

