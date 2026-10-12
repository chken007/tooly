import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toJqPath, immersivePaneCount, type ImmersiveLayout } from '../utils/jsonWorkspace';
import { JsonSearch, JsonTreeView } from './JsonTreeView';
import JsonImmersiveWorkspace from './JsonImmersiveWorkspace';
import { useBrowserPreference } from '../hooks/useBrowserPreference';
import { useJsonTree } from '../hooks/useJsonTree';
import { applyJqFilter } from '../utils/jq';

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

const isPaneWidth = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 20 && value <= 80;

const JsonTools: React.FC<JsonToolsProps> = ({ state, setState, immersive, setImmersive }) => {
  const { jsonInput, jqFilter } = state;
  
  const setJsonInput = (value: string) => setState(prev => ({ ...prev, jsonInput: value }));
  const setJqFilter = (value: string) => setState(prev => ({ ...prev, jqFilter: value }));
  
  const [layout, setLayout] = useState<ImmersiveLayout>('single');
  const tree = useJsonTree(jsonInput, `${immersive}:${layout}`);
  const { parsedJson, error, setError, expandAll, collapseAll, searchRef } = tree;
  const [filteredResult, setFilteredResult] = useState<unknown>(null);
  const [filterError, setFilterError] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<'input' | 'tree' | 'filter' | null>(null);
  const [clipboardError, setClipboardError] = useState('');
  const [paneWidth, setPaneWidth, preferenceError] = useBrowserPreference('tooly.jsonPaneWidth', 50, isPaneWidth);
  const panesRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const activePaneRef = useRef(0);
  const immersiveButtonRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ pointerId: number; width: number } | null>(null);

  useEffect(() => {
    const currentSearch = () => immersive
      ? workspaceRef.current?.querySelector<HTMLInputElement>(`[data-pane-index="${activePaneRef.current}"] input[type="search"]`)
      : searchRef.current;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && immersive) {
        event.preventDefault();
        setImmersive(false);
        requestAnimationFrame(() => immersiveButtonRef.current?.focus());
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        currentSearch()?.focus();
        currentSearch()?.select();
      }
    };
    window.addEventListener('keydown', handleKey);
    if (immersive) currentSearch()?.focus();
    return () => window.removeEventListener('keydown', handleKey);
  }, [immersive, setImmersive, searchRef]);

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

  const copyPath = useCallback(async (path: string) => {
    const jqPath = toJqPath(path);
    setState(previous => ({ ...previous, jqFilter: jqPath }));
    try {
      await navigator.clipboard.writeText(jqPath);
      setClipboardError('');
    } catch (err) {
      setClipboardError(`Could not copy to clipboard: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [setState]);

  // Improved JQ filter parser that handles .key[].subkey patterns
  const applyFilter = useCallback(() => {
    if (parsedJson === undefined || !jqFilter.trim()) {
      setFilteredResult(null);
      setFilterError('');
      return;
    }

    try {
      const filter = jqFilter.trim();
      
      const result = applyJqFilter(parsedJson, filter);
      setFilteredResult(result);
      setFilterError('');
    } catch (err) {
      setFilteredResult(null);
      setFilterError(err instanceof Error ? err.message : 'Filter error');
    }
  }, [parsedJson, jqFilter]);

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
    tree.clearTree();
    setFilteredResult(null);
    setFilterError('');
    setClipboardError('');
  };

  const searchBox = <JsonSearch tree={tree} />;
  const treeView = <JsonTreeView tree={tree} immersive={immersive} onCopyPath={copyPath} />;

  const notices = (clipboardError || preferenceError) && (
    <div role="alert" className="mb-3 text-sm text-red-600">{clipboardError || preferenceError}</div>
  );

  return (
    <>
      <JsonImmersiveWorkspace
        immersive={immersive}
        layout={layout}
        onLayoutChange={next => {
          setLayout(next);
          if (activePaneRef.current >= immersivePaneCount(next)) activePaneRef.current = 0;
        }}
        onActivePane={index => { activePaneRef.current = index; }}
        workspaceRef={workspaceRef}
        primaryPane={immersive ? (
          <>
            <div className="flex flex-wrap gap-3">
              <button onClick={handlePaste} className="btn-primary text-sm" title="Paste JSON from clipboard. Press Escape to exit immersive view.">
                Paste
              </button>
              {searchBox}
            </div>
            {notices}
            {treeView}
          </>
        ) : null}
      />
      {!immersive && <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-6">
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
      </div>}
    </>
  );
};

export default JsonTools;
