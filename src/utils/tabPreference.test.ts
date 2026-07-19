import { describe, expect, it, vi } from 'vitest';
import {
  ACTIVE_TAB_STORAGE_KEY,
  DEFAULT_TAB_ID,
  loadActiveTab,
  saveActiveTab,
} from './tabPreference';

describe('tab preferences', () => {
  it('loads a known tab', () => {
    const storage = {
      getItem: vi.fn(() => 'regex'),
      setItem: vi.fn(),
    };

    expect(loadActiveTab(storage)).toBe('regex');
    expect(storage.getItem).toHaveBeenCalledWith(ACTIVE_TAB_STORAGE_KEY);
  });

  it('falls back when the stored tab is missing or unknown', () => {
    const missingStorage = { getItem: vi.fn(() => null), setItem: vi.fn() };
    const staleStorage = { getItem: vi.fn(() => 'removed-tab'), setItem: vi.fn() };

    expect(loadActiveTab(missingStorage)).toBe(DEFAULT_TAB_ID);
    expect(loadActiveTab(staleStorage)).toBe(DEFAULT_TAB_ID);
  });

  it('ignores unavailable browser storage', () => {
    const unavailableStorage = {
      getItem: vi.fn(() => {
        throw new Error('Storage unavailable');
      }),
      setItem: vi.fn(() => {
        throw new Error('Storage unavailable');
      }),
    };

    expect(loadActiveTab(unavailableStorage)).toBe(DEFAULT_TAB_ID);
    expect(() => saveActiveTab('data', unavailableStorage)).not.toThrow();
  });

  it('saves only the active tab identifier', () => {
    const storage = { getItem: vi.fn(() => null), setItem: vi.fn() };

    saveActiveTab('data', storage);

    expect(storage.setItem).toHaveBeenCalledWith(ACTIVE_TAB_STORAGE_KEY, 'data');
  });
});
