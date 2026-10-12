import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import JsonTree, { childNodeId, matchesJsonSearch, type JsonValue } from './JsonTree';
import { useBrowserPreference } from '../hooks/useBrowserPreference';

interface JsonToolsProps {
  immersive: boolean;
  setImmersive: (immersive: boolean) => void;
  state: {
    jsonInput: string;
    jqFilter: string;
  };
  setState: React.Dispatch<React.SetStateAction<{
    jsonInput: string;
    jqFilter: string;
  }>>;
}

// Use object for collapsed state to avoid Set reference issues
type CollapsedState = Record<string, boolean>;

const isPaneWidth = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 20 && value <= 80;

const JsonTools: React.FC<JsonToolsProps> = ({ state, setState, immersive, setImmersive }) => {
  const { jsonInput, jqFilter } = state;
  
  const setJsonInput = (value: string) => setState(prev => ({ ...prev, jsonInput: value }));
  const setJqFilter = (value: string) => setState(prev => ({ ...prev, jqFilter: value }));
  
  const [error, setError] = useState<string>('');
  const [parsedJson, setParsedJson] = useState<JsonValue | undefined>(undefined);
  const [filteredResult, setFilteredResult] = useState<any>(null);
  const [filterError, setFilterError] = useState<string>('');
  const [collapsedPaths, setCollapsedPaths] = useState<CollapsedState>({});
  const [copyFeedback, setCopyFeedback] = useState<'input' | 'tree' | 'filter' | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeMatch, setActiveMatch] = useState(-1);
  const [clipboardError, setClipboardError] = useState('');
  const [paneWidth, setPaneWidth, preferenceError] = useBrowserPreference('tooly.jsonPaneWidth', 50, isPaneWidth);
  const panesRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const immersiveButtonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ pointerId: number; width: number } | null>(null);

  const searchMatches = useMemo(() => {
    const matches: { nodeId: string; ancestors: string[] }[] = [];
    const query = searchTerm.toLowerCase();
    if (!query || parsedJson === undefined) return matches;
    const collect = (value: JsonValue, key: string, nodeId: string, ancestors: string[]) => {
      if (matchesJsonSearch(key, value, query)) matches.push({ nodeId, ancestors });
      if (value !== null && typeof value === 'object') {
        for (const [childKey, child] of Object.entries(value)) {
          collect(child, Array.isArray(value) ? '' : childKey, childNodeId(nodeId, childKey), [...ancestors, nodeId]);
        }
      }
    };
    collect(parsedJson, '', '$', []);
    return matches;
  }, [parsedJson, searchTerm]);

  const activeNodeId = searchMatches[activeMatch]?.nodeId;

  const navigateSearch = (backwards = false) => {
    if (searchMatches.length === 0) return;
    const next = activeMatch < 0
      ? backwards ? searchMatches.length - 1 : 0
      : (activeMatch + (backwards ? -1 : 1) + searchMatches.length) % searchMatches.length;
    setActiveMatch(next);
    setCollapsedPaths(previous => {
      const expanded = { ...previous };
      for (const ancestor of searchMatches[next].ancestors) delete expanded[ancestor];
      return expanded;
    });
  };

  useEffect(() => {
    const tree = treeRef.current;
    const active = tree?.querySelector<HTMLElement>('[data-search-active="true"]');
    if (!tree || !active) return;
    const bounds = active.getBoundingClientRect();
    const treeBounds = tree.getBoundingClientRect();
    // Scroll only the tree, keeping the search field and surrounding page stationary.
    tree.scrollTop += bounds.top - treeBounds.top - (tree.clientHeight - bounds.height) / 2;
    if (bounds.left < treeBounds.left || bounds.right > treeBounds.right) {
      tree.scrollLeft += bounds.left - treeBounds.left - 16;
    }
  }, [activeNodeId, collapsedPaths, immersive]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && immersive) {
        setImmersive(false);
        requestAnimationFrame(() => immersiveButtonRef.current?.focus());
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKey);
    if (immersive) searchRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKey);
  }, [immersive, setImmersive]);

  const updatePaneWidth = (width: number) => setPaneWidth(Math.max(20, Math.min(80, Math.round(width))));
  const resizePanes = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId || !panesRef.current) return;
    const bounds = panesRef.current.getBoundingClientRect();
    const available = bounds.width - 36; // Divider plus the two grid gaps.
    const width = Math.max(20, Math.min(80, Math.round((event.clientX - bounds.left - 18) / available * 100)));
    dragRef.current.width = width;
    // Update during dragging; persist only when the gesture ends.
    panesRef.current.style.setProperty('--json-input-width', `${width}fr`);
    panesRef.current.style.setProperty('--json-tree-width', `${100 - width}fr`);
    event.currentTarget.setAttribute('aria-valuenow', String(width));
    event.currentTarget.setAttribute('aria-valuetext', `${width}% input, ${100 - width}% tree`);
  };
  const finishResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    updatePaneWidth(dragRef.current.width);
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  // Parse JSON input with debounce
  const parseJsonInput = useCallback(() => {
    if (!jsonInput.trim()) {
      setParsedJson(undefined);
      setError('');
      setActiveMatch(-1);
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput.trim());
      setParsedJson(parsed);
      setError('');
      setCollapsedPaths({});
      setActiveMatch(-1);
    } catch (err) {
      setParsedJson(undefined);
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      setActiveMatch(-1);
    }
  }, [jsonInput]);

  React.useEffect(() => {
    const timer = setTimeout(parseJsonInput, 200);
    return () => clearTimeout(timer);
  }, [jsonInput, parseJsonInput]);

  // Stable callback for checking collapsed state
  const getIsCollapsed = useCallback((path: string): boolean => {
    return collapsedPaths[path] === true;
  }, [collapsedPaths]);

  // Toggle collapse with minimal state updates
  const toggleCollapse = useCallback((path: string) => {
    setCollapsedPaths(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  }, []);

  const expandAll = useCallback(() => {
    setCollapsedPaths({});
  }, []);

  const collapseAll = useCallback(() => {
    if (parsedJson === undefined) return;
    const paths: CollapsedState = {};
    const collect = (obj: JsonValue, nodeId: string) => {
      if (typeof obj === 'object' && obj !== null && Object.keys(obj).length > 0) {
        paths[nodeId] = true;
        for (const [key, child] of Object.entries(obj)) collect(child, childNodeId(nodeId, key));
      }
    };
    collect(parsedJson, '$');
    setCollapsedPaths(paths);
  }, [parsedJson]);

  // Stable ref for filter setter
  const setJqFilterRef = useRef(setJqFilter);
  setJqFilterRef.current = setJqFilter;

  const copyPath = useCallback(async (path: string) => {
    const jqPath = path === '' ? '.' : (path.startsWith('[') ? path : `.${path}`);
    setJqFilterRef.current(jqPath);
    try {
      await navigator.clipboard.writeText(jqPath);
      setClipboardError('');
    } catch (err) {
      setClipboardError(`Could not copy to clipboard: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  // Improved JQ filter parser that handles .key[].subkey patterns
  const applyFilter = useCallback(() => {
    if (parsedJson === undefined || !jqFilter.trim()) {
      setFilteredResult(null);
      setFilterError('');
      return;
    }

    try {
      const filter = jqFilter.trim();
      
      // Split by pipe for chaining
      const pipeParts = filter.split('|').map(p => p.trim());
      let result: any = parsedJson;

      for (const pipePart of pipeParts) {
        if (!pipePart || pipePart === '.') continue;
        result = evaluateJqExpression(result, pipePart);
      }

      setFilteredResult(result);
      setFilterError('');
    } catch (err) {
      setFilteredResult(null);
      setFilterError(err instanceof Error ? err.message : 'Filter error');
    }
  }, [parsedJson, jqFilter]);

  // Tokenize and evaluate JQ expression
  const evaluateJqExpression = (data: any, expr: string): any => {
    if (data === null || data === undefined) {
      throw new Error('Cannot filter null/undefined');
    }

    // Handle special functions
    if (expr === 'keys') {
      if (typeof data !== 'object' || data === null) throw new Error('Cannot get keys of non-object');
      return Array.isArray(data) ? data.map((_, i) => i) : Object.keys(data);
    }
    if (expr === 'length') {
      if (Array.isArray(data)) return data.length;
      if (typeof data === 'object' && data !== null) return Object.keys(data).length;
      if (typeof data === 'string') return data.length;
      throw new Error('Cannot get length');
    }
    if (expr === 'type') {
      if (data === null) return 'null';
      if (Array.isArray(data)) return 'array';
      return typeof data;
    }
    if (expr === '.[]') {
      if (!Array.isArray(data)) throw new Error('Cannot iterate non-array');
      return data;
    }

    // Tokenize the expression: split into path segments
    // Handle patterns like: .key1.key2[].subkey or .key[0].subkey
    if (!expr.startsWith('.')) {
      throw new Error(`Invalid expression: ${expr}`);
    }

    const tokens = tokenizeJqPath(expr.slice(1)); // Remove leading dot
    return evaluateTokens(data, tokens);
  };

  // Tokenize a JQ path into segments
  const tokenizeJqPath = (path: string): string[] => {
    const tokens: string[] = [];
    let current = '';
    let i = 0;

    while (i < path.length) {
      const char = path[i];

      if (char === '.') {
        if (current) tokens.push(current);
        current = '';
        i++;
      } else if (char === '[') {
        if (current) tokens.push(current);
        current = '';
        // Find matching ]
        let bracketContent = '';
        i++; // skip [
        while (i < path.length && path[i] !== ']') {
          bracketContent += path[i];
          i++;
        }
        i++; // skip ]
        tokens.push(`[${bracketContent}]`);
      } else {
        current += char;
        i++;
      }
    }

    if (current) tokens.push(current);
    return tokens;
  };

  // Evaluate tokens against data
  const evaluateTokens = (data: any, tokens: string[]): any => {
    let result = data;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (result === null || result === undefined) {
        throw new Error('Cannot access property of null/undefined');
      }

      // Array iteration: []
      if (token === '[]') {
        if (!Array.isArray(result)) {
          throw new Error('Cannot iterate non-array');
        }
        // If there are more tokens, map each element through remaining tokens
        const remainingTokens = tokens.slice(i + 1);
        if (remainingTokens.length > 0) {
          return result.map(item => evaluateTokens(item, remainingTokens));
        }
        return result;
      }

      // Array index: [0], [1], etc.
      const indexMatch = token.match(/^\[(\d+)\]$/);
      if (indexMatch) {
        const idx = parseInt(indexMatch[1], 10);
        if (!Array.isArray(result)) {
          throw new Error('Cannot index non-array');
        }
        if (idx >= result.length) {
          throw new Error(`Index ${idx} out of bounds`);
        }
        result = result[idx];
        continue;
      }

      // Object key
      if (typeof result !== 'object' || result === null) {
        throw new Error(`Cannot access "${token}" on non-object`);
      }
      if (Array.isArray(result)) {
        throw new Error(`Cannot access key "${token}" on array - use index [n] instead`);
      }
      if (!(token in result)) {
        throw new Error(`Key "${token}" not found`);
      }
      result = result[token];
    }

    return result;
  };

  const handleCopy = async (text: string, type: 'input' | 'tree' | 'filter') => {
    try {
      await navigator.clipboard.writeText(text);
      setClipboardError('');
      setCopyFeedback(type);
      setTimeout(() => setCopyFeedback(null), 1500);
    } catch (err) {
      setClipboardError(`Could not copy to clipboard: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardError('');
      setJsonInput(text);
    } catch (err) {
      setClipboardError(`Could not read clipboard. Allow clipboard access and try again: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleFormat = () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput.trim());
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleClear = () => {
    setJsonInput('');
    setJqFilter('');
    setParsedJson(undefined);
    setFilteredResult(null);
    setError('');
    setFilterError('');
    setCollapsedPaths({});
    setSearchTerm('');
    setActiveMatch(-1);
    setClipboardError('');
  };

  const treeElement = useMemo(() => {
    if (parsedJson === undefined) return null;
    return (
      <JsonTree
        value={parsedJson}
        searchTerm={searchTerm}
        activeNodeId={activeNodeId}
        onToggle={toggleCollapse}
        onCopyPath={copyPath}
        getIsCollapsed={getIsCollapsed}
      />
    );
  }, [parsedJson, searchTerm, activeNodeId, toggleCollapse, copyPath, getIsCollapsed]);

  const searchBox = (
    <div className="relative min-w-0 flex-1">
      <input
        ref={searchRef}
        type="search"
        aria-label="Search JSON tree"
        value={searchTerm}
        onChange={event => {
          setSearchTerm(event.target.value);
          setActiveMatch(-1);
        }}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            navigateSearch(event.shiftKey);
          }
        }}
        className="w-full pl-3 pr-24 py-2 border border-stone-200 rounded-lg focus-ring text-sm"
        placeholder="Search keys or values..."
        title="Enter: next result. Shift+Enter: previous. Cmd/Ctrl+F: focus search."
      />
      <span
        role="status"
        aria-label="Search results"
        className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-stone-500"
      >
        {activeMatch < 0 ? 0 : activeMatch + 1} of {searchMatches.length}
      </span>
    </div>
  );

  const treeView = (
    <div
      ref={treeRef}
      role="region"
      aria-label="JSON tree"
      className={`w-full p-4 border border-stone-200 rounded-xl bg-stone-50 overflow-auto font-mono text-sm ${
        immersive ? 'flex-1 min-h-0' : 'h-[460px]'
      }`}
    >
      {immersive && error && <div role="alert" className="mb-3 text-red-600">{error}</div>}
      {parsedJson !== undefined ? (
        <div className="whitespace-pre-wrap break-words">{treeElement}</div>
      ) : (
        <div className="text-stone-400 text-center py-20">
          {jsonInput.trim() ? 'Waiting for valid JSON...' : 'Tree view will appear here'}
        </div>
      )}
    </div>
  );

  const notices = (clipboardError || preferenceError) && (
    <div role="alert" className="mb-3 text-sm text-red-600">{clipboardError || preferenceError}</div>
  );

  if (immersive) {
    return (
      <div className="h-full flex flex-col gap-3 p-4 bg-white">
        <div className="flex gap-3">
          <button onClick={handlePaste} className="btn-primary text-sm" title="Paste JSON from clipboard. Press Escape to exit immersive view.">
            Paste
          </button>
          {searchBox}
        </div>
        {notices}
        {treeView}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-semibold text-stone-900 tracking-tight">JSON Tools</h2>
        <button ref={immersiveButtonRef} onClick={() => setImmersive(true)} className="btn-secondary text-sm" title="Show only Paste, search and tree. Escape exits.">
          Immersive view
        </button>
      </div>
      {notices}
      
      <div
        ref={panesRef}
        className="json-panes mb-6"
        style={{ '--json-input-width': `${paneWidth}fr`, '--json-tree-width': `${100 - paneWidth}fr` } as React.CSSProperties}
      >
        {/* Left Panel - JSON Input */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label htmlFor="json-input" className="block text-sm font-medium text-stone-700">
              JSON Input
            </label>
            <div className="flex space-x-2">
              <button onClick={handleFormat} className="text-sm text-stone-500 hover:text-stone-700 px-2 py-1 rounded hover:bg-stone-100" disabled={!jsonInput}>
                Format
              </button>
              <button onClick={() => handleCopy(jsonInput, 'input')} className="text-sm text-stone-500 hover:text-stone-700 px-2 py-1 rounded hover:bg-stone-100" disabled={!jsonInput}>
                {copyFeedback === 'input' ? '✓ Copied!' : 'Copy'}
              </button>
              <button onClick={handleClear} className="text-sm text-stone-500 hover:text-stone-700 px-2 py-1 rounded hover:bg-stone-100">
                Clear
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-[500px] p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 resize-none font-mono text-sm"
            placeholder='Paste your JSON here...'
          />
          {error && (
            <div role="alert" className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        <div
          role="separator"
          aria-label="Resize JSON panes"
          aria-orientation="vertical"
          aria-controls="json-input"
          aria-valuemin={20}
          aria-valuemax={80}
          aria-valuenow={paneWidth}
          aria-valuetext={`${paneWidth}% input, ${100 - paneWidth}% tree`}
          tabIndex={0}
          className="hidden lg:flex items-center justify-center cursor-col-resize touch-none select-none rounded-lg hover:bg-stone-100 focus-ring"
          onPointerDown={event => {
            if (event.button !== 0) return;
            event.preventDefault();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = { pointerId: event.pointerId, width: paneWidth };
          }}
          onPointerMove={resizePanes}
          onPointerUp={finishResize}
          onPointerCancel={finishResize}
          onLostPointerCapture={finishResize}
          onKeyDown={event => {
            if (event.key === 'ArrowLeft') updatePaneWidth(paneWidth - 2);
            else if (event.key === 'ArrowRight') updatePaneWidth(paneWidth + 2);
            else if (event.key === 'Home') updatePaneWidth(20);
            else if (event.key === 'End') updatePaneWidth(80);
            else return;
            event.preventDefault();
          }}
          title="Drag to resize. Arrow keys adjust; Home/End set the limits."
        >
          <span className="h-12 w-1 rounded-full bg-stone-200" />
        </div>

        {/* Right Panel - Tree View */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label className="block text-sm font-medium text-stone-700">Tree View</label>
            <div className="flex space-x-2">
              {parsedJson !== undefined && (
                <>
                  <button onClick={collapseAll} aria-label="Collapse all" className="text-xs text-orange-500 hover:text-white hover:bg-orange-500 px-3 py-1.5 rounded-full border border-orange-300 hover:border-orange-500 font-medium">
                    − All
                  </button>
                  <button onClick={expandAll} aria-label="Expand all" className="text-xs text-orange-500 hover:text-white hover:bg-orange-500 px-3 py-1.5 rounded-full border border-orange-300 hover:border-orange-500 font-medium">
                    + All
                  </button>
                </>
              )}
              <button onClick={() => parsedJson !== undefined && handleCopy(JSON.stringify(parsedJson, null, 2), 'tree')} className="text-sm text-stone-500 hover:text-stone-700 px-2 py-1 rounded hover:bg-stone-100" disabled={parsedJson === undefined}>
                {copyFeedback === 'tree' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          {/* Search box */}
          <div className="mb-2">
            {searchBox}
          </div>
          
          {treeView}
          <div className="mt-2 text-xs text-stone-500">
            Enter / Shift+Enter: next / previous match. Click a key to copy its filter path.
          </div>
        </div>
      </div>

      {/* JQ Filter Section */}
      <div className="border-t border-stone-200 pt-6">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="jq-filter" className="block text-sm font-medium text-stone-700">JQ Filter</label>
          <div className="text-xs text-stone-500">
            Supports: .key, .key[].subkey, .[0], keys, length, type
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            id="jq-filter"
            type="text"
            value={jqFilter}
            onChange={(e) => setJqFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 font-mono text-sm"
            placeholder=".product_arrangement.fulfillable_items[].id"
          />
          <button
            onClick={applyFilter}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
            disabled={parsedJson === undefined || !jqFilter.trim()}
          >
            Apply
          </button>
        </div>

        {(filteredResult !== null || filterError) && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-stone-700">Filtered Result</label>
              {filteredResult !== null && (
                <button onClick={() => handleCopy(JSON.stringify(filteredResult, null, 2), 'filter')} className="text-sm text-stone-500 hover:text-stone-700 px-2 py-1 rounded hover:bg-stone-100">
                  {copyFeedback === 'filter' ? '✓ Copied!' : 'Copy'}
                </button>
              )}
            </div>
            {filterError ? (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                {filterError}
              </div>
            ) : (
              <div className="p-4 border border-stone-200 rounded-xl bg-stone-50 overflow-auto font-mono text-sm max-h-[300px]">
                <pre className="whitespace-pre-wrap text-stone-800">
                  {JSON.stringify(filteredResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-stone-600 text-center font-medium bg-orange-50 p-3 rounded-lg border border-orange-100">
        Paste JSON to see interactive tree view. Use search to find keys/values. Click paths to copy, then apply JQ filters.
      </div>
    </div>
  );
};

export default JsonTools;
