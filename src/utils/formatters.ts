import * as yaml from 'js-yaml';

export function beautifyJSON(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

export function beautifyYAML(input: string): string {
  try {
    const parsed = yaml.load(input);
    return yaml.dump(parsed, { indent: 2, lineWidth: -1 });
  } catch (error) {
    throw new Error('Invalid YAML format');
  }
}

export function isJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function isYAML(str: string): boolean {
  try {
    yaml.load(str);
    return true;
  } catch {
    return false;
  }
}

export function autoFormat(input: string): string {
  const trimmed = input.trim();
  
  // Try JSON first
  if (isJSON(trimmed)) {
    return beautifyJSON(trimmed);
  }
  
  // Try YAML
  if (isYAML(trimmed)) {
    return beautifyYAML(trimmed);
  }
  
  throw new Error('Input is neither valid JSON nor YAML');
}

export function sortJSON(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays - recursively sort contents
  if (Array.isArray(obj)) {
    return obj.map(item => sortJSON(item));
  }

  // Handle objects - sort keys alphabetically
  if (typeof obj === 'object') {
    const sortedObj: any = {};
    const keys = Object.keys(obj).sort();
    
    keys.forEach(key => {
      sortedObj[key] = sortJSON(obj[key]);
    });
    
    return sortedObj;
  }

  // Primitive values - return as is
  return obj;
}

export function beautifyAndSortJSON(input: string): string {
  try {
    const parsed = JSON.parse(input);
    const sorted = sortJSON(parsed);
    return JSON.stringify(sorted, null, 2);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
} 