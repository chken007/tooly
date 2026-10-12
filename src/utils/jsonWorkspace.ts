export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type ImmersiveLayout = 'single' | 'columns' | 'rows' | 'grid';

export const immersivePaneCount = (layout: ImmersiveLayout) =>
  layout === 'single' ? 1 : layout === 'grid' ? 4 : 2;

export function toJqPath(path: string) {
  return path === '' ? '.' : path.startsWith('[') ? path : `.${path}`;
}

export function childNodeId(parent: string, key: string) {
  return `${parent}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`;
}

export function matchesJsonSearch(key: string, value: JsonValue, query: string): boolean {
  if (!query) return false;
  return key.toLowerCase().includes(query) ||
    ((value === null || typeof value !== 'object') && String(value).toLowerCase().includes(query));
}
