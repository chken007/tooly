import Papa from 'papaparse';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export type DataFormat = 'json' | 'csv' | 'yaml';

export function convertData(input: string, source: DataFormat, target: DataFormat): string {
  if (!input.trim()) return '';
  if (source === target) throw new Error('Choose two different formats');
  return serializeData(parseData(input, source), target);
}

export function parseData(input: string, format: DataFormat): unknown {
  try {
    if (format === 'json') return JSON.parse(input);
    if (format === 'yaml') return parseYaml(input);

    const result = Papa.parse<Record<string, unknown>>(input, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
    });
    if (result.errors.length) throw new Error(result.errors[0].message);
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : `Invalid ${format.toUpperCase()}`;
    throw new Error(`Could not parse ${format.toUpperCase()}: ${message}`);
  }
}

export function serializeData(value: unknown, format: DataFormat): string {
  if (format === 'json') return JSON.stringify(value, null, 2);
  if (format === 'yaml') return stringifyYaml(value, { indent: 2, lineWidth: 0 });

  if (!Array.isArray(value)) {
    if (typeof value === 'object' && value !== null) value = [value];
    else throw new Error('CSV output requires an object or an array of rows');
  }

  return Papa.unparse(value as object[], {
    header: true,
    newline: '\n',
    escapeFormulae: true,
  });
}

