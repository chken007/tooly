export function beautifyJSON(input: string): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, 2);
  } catch (error) {
    throw new Error('Invalid JSON format');
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
