export const TAB_DEFINITIONS = [
  { id: 'json', label: 'JSON Tools' },
  { id: 'data', label: 'Data Converter' },
  { id: 'regex', label: 'Regex Tester' },
  { id: 'diff', label: 'Diff Master' },
  { id: 'converter', label: 'Smart Converter' },
  { id: 'time', label: 'Time Converter' },
  { id: 'wizard', label: 'List Wizard' },
] as const;

export type TabId = typeof TAB_DEFINITIONS[number]['id'];

export const DEFAULT_TAB_ID: TabId = 'json';
export const ACTIVE_TAB_STORAGE_KEY = 'tooly.activeTab.v1';

interface TabStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function isTabId(value: unknown): value is TabId {
  return typeof value === 'string'
    && TAB_DEFINITIONS.some(tab => tab.id === value);
}

function getBrowserStorage(): TabStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadActiveTab(storage = getBrowserStorage()): TabId {
  if (!storage) return DEFAULT_TAB_ID;

  try {
    const storedTab = storage.getItem(ACTIVE_TAB_STORAGE_KEY);
    return isTabId(storedTab) ? storedTab : DEFAULT_TAB_ID;
  } catch {
    return DEFAULT_TAB_ID;
  }
}

export function saveActiveTab(tabId: TabId, storage = getBrowserStorage()): void {
  if (!storage) return;

  try {
    storage.setItem(ACTIVE_TAB_STORAGE_KEY, tabId);
  } catch {
    // Storage can be unavailable in restricted or private browser contexts.
  }
}
