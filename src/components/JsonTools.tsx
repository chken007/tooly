import React, { useState, useCallback, memo, useMemo } from 'react';
import { applyJqFilter } from '../utils/jq';

interface JsonToolsProps {
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

// Memoized tree node component
interface TreeNodeProps {
  nodeKey: string;
  value: any;
  path: string;
  depth: number;
  isLast: boolean;
  isCollapsed: boolean;
  searchTerm: string;
  onToggle: (path: string) => void;
  onCopyPath: (path: string) => void;
  getIsCollapsed: (path: string) => boolean;
}

const TreeNode = memo(({ 
  nodeKey, 
  value, 
  path, 
  depth, 
  isLast, 
  searchTerm,
  onToggle, 
  onCopyPath,
  getIsCollapsed 
}: TreeNodeProps) => {
  const indent = depth * 16;

  const handleCopy = (e: React.MouseEvent, copyPath: string) => {
    e.stopPropagation();
    onCopyPath(copyPath);
  };

  // Check if this node matches search
  const matchesSearch = searchTerm && (
    nodeKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (typeof value === 'number' && value.toString().includes(searchTerm))
  );

  const highlightClass = matchesSearch ? 'bg-yellow-200 rounded px-0.5' : '';

  // Render primitive values inline
  if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    let valueElement: React.ReactNode;
    if (value === null) {
      valueElement = <span className={`text-stone-400 italic ${highlightClass}`}>null</span>;
    } else if (typeof value === 'boolean') {
      valueElement = <span className={`text-purple-600 font-medium ${highlightClass}`}>{value.toString()}</span>;
    } else if (typeof value === 'number') {
      valueElement = <span className={`text-amber-600 font-medium ${highlightClass}`}>{value}</span>;
    } else {
      valueElement = <span className={`text-emerald-600 ${highlightClass}`}>"{value}"</span>;
    }

    return (
      <div style={{ marginLeft: indent }}>
        {nodeKey && (
          <>
            <span 
              className={`text-sky-600 font-medium cursor-pointer hover:text-orange-500 ${highlightClass}`}
              onClick={(e) => handleCopy(e, path)}
            >
              "{nodeKey}"
            </span>
            <span className="text-stone-500">: </span>
          </>
        )}
        {valueElement}
        {!isLast && <span className="text-stone-500">,</span>}
      </div>
    );
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const isCollapsed = getIsCollapsed(path);
    const isEmpty = value.length === 0;

    return (
      <div style={{ marginLeft: indent }}>
        {nodeKey && (
          <>
            <span 
              className={`text-sky-600 font-medium cursor-pointer hover:text-orange-500 ${highlightClass}`}
              onClick={(e) => handleCopy(e, path)}
            >
              "{nodeKey}"
            </span>
            <span className="text-stone-500">: </span>
          </>
        )}
        {!isEmpty && (
          <button
            onClick={() => onToggle(path)}
            className="inline-flex items-center justify-center w-4 h-4 mr-1 text-white bg-orange-400 hover:bg-orange-500 rounded-full text-xs font-bold select-none"
          >
            {isCollapsed ? '+' : '−'}
          </button>
        )}
        <span 
          className="text-stone-700 font-semibold cursor-pointer hover:text-orange-600"
          onClick={(e) => handleCopy(e, path)}
        >
          [
        </span>
        {isEmpty ? (
          <span className="text-stone-700 font-semibold">]</span>
        ) : isCollapsed ? (
          <>
            <span className="text-stone-400 text-xs ml-1">{value.length} items</span>
            <span className="text-stone-700 font-semibold">]</span>
          </>
        ) : (
          <>
            {value.map((item, index) => {
              const itemPath = path === '' ? `[${index}]` : `${path}[${index}]`;
              return (
                <TreeNode
                  key={index}
                  nodeKey=""
                  value={item}
                  path={itemPath}
                  depth={depth + 1}
                  isLast={index === value.length - 1}
                  isCollapsed={getIsCollapsed(itemPath)}
                  searchTerm={searchTerm}
                  onToggle={onToggle}
                  onCopyPath={onCopyPath}
                  getIsCollapsed={getIsCollapsed}
                />
              );
            })}
            <div style={{ marginLeft: indent }}>
              <span className="text-stone-700 font-semibold">]</span>
            </div>
          </>
        )}
        {!isLast && <span className="text-stone-500">,</span>}
      </div>
    );
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value);
    const isCollapsed = getIsCollapsed(path);
    const isEmpty = keys.length === 0;

    return (
      <div style={{ marginLeft: indent }}>
        {nodeKey && (
          <>
            <span 
              className={`text-sky-600 font-medium cursor-pointer hover:text-orange-500 ${highlightClass}`}
              onClick={(e) => handleCopy(e, path)}
            >
              "{nodeKey}"
            </span>
            <span className="text-stone-500">: </span>
          </>
        )}
        {!isEmpty && (
          <button
            onClick={() => onToggle(path)}
            className="inline-flex items-center justify-center w-4 h-4 mr-1 text-white bg-orange-400 hover:bg-orange-500 rounded-full text-xs font-bold select-none"
          >
            {isCollapsed ? '+' : '−'}
          </button>
        )}
        <span 
          className="text-stone-700 font-semibold cursor-pointer hover:text-orange-600"
          onClick={(e) => handleCopy(e, path)}
        >
          {"{"}
        </span>
        {isEmpty ? (
          <span className="text-stone-700 font-semibold">{"}"}</span>
        ) : isCollapsed ? (
          <>
            <span className="text-stone-400 text-xs ml-1">{keys.length} keys</span>
            <span className="text-stone-700 font-semibold">{"}"}</span>
          </>
        ) : (
          <>
            {keys.map((key, index) => {
              const keyPath = path === '' ? key : `${path}.${key}`;
              return (
                <TreeNode
                  key={key}
                  nodeKey={key}
                  value={value[key]}
                  path={keyPath}
                  depth={depth + 1}
                  isLast={index === keys.length - 1}
                  isCollapsed={getIsCollapsed(keyPath)}
                  searchTerm={searchTerm}
                  onToggle={onToggle}
                  onCopyPath={onCopyPath}
                  getIsCollapsed={getIsCollapsed}
                />
              );
            })}
            <div style={{ marginLeft: indent }}>
              <span className="text-stone-700 font-semibold">{"}"}</span>
            </div>
          </>
        )}
        {!isLast && <span className="text-stone-500">,</span>}
      </div>
    );
  }

  return <div style={{ marginLeft: indent }}>{String(value)}</div>;
});

TreeNode.displayName = 'TreeNode';

const JsonTools: React.FC<JsonToolsProps> = ({ state, setState }) => {
  const { jsonInput, jqFilter } = state;
  
  const setJsonInput = (value: string) => setState(prev => ({ ...prev, jsonInput: value }));
  const setJqFilter = (value: string) => setState(prev => ({ ...prev, jqFilter: value }));
  
  const [error, setError] = useState<string>('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [filteredResult, setFilteredResult] = useState<any>(null);
  const [filterError, setFilterError] = useState<string>('');
  const [collapsedPaths, setCollapsedPaths] = useState<CollapsedState>({});
  const [copyFeedback, setCopyFeedback] = useState<'input' | 'tree' | 'filter' | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Parse JSON input with debounce
  const parseJsonInput = useCallback(() => {
    if (!jsonInput.trim()) {
      setParsedJson(null);
      setError('');
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput.trim());
      setParsedJson(parsed);
      setError('');
      setCollapsedPaths({});
    } catch (err) {
      setParsedJson(null);
      setError(err instanceof Error ? err.message : 'Invalid JSON');
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
    if (!parsedJson) return;
    const paths: CollapsedState = {};
    const collect = (obj: any, path: string) => {
      if (Array.isArray(obj) && obj.length > 0) {
        paths[path] = true;
        obj.forEach((item, i) => {
          if (typeof item === 'object' && item !== null) {
            collect(item, path === '' ? `[${i}]` : `${path}[${i}]`);
          }
        });
      } else if (typeof obj === 'object' && obj !== null) {
        const keys = Object.keys(obj);
        if (keys.length > 0) {
          paths[path] = true;
          keys.forEach(key => {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              collect(obj[key], path === '' ? key : `${path}.${key}`);
            }
          });
        }
      }
    };
    collect(parsedJson, '');
    setCollapsedPaths(paths);
  }, [parsedJson]);

  const copyPath = useCallback((path: string) => {
    const jqPath = path === '' ? '.' : (path.startsWith('[') ? path : `.${path}`);
    navigator.clipboard.writeText(jqPath).catch(() => {});
    setState(previous => ({ ...previous, jqFilter: jqPath }));
  }, [setState]);

  // Improved JQ filter parser that handles .key[].subkey patterns
  const applyFilter = useCallback(() => {
    if (!parsedJson || !jqFilter.trim()) {
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
      setCopyFeedback(type);
      setTimeout(() => setCopyFeedback(null), 1500);
    } catch {}
  };

  const handleFormat = () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput.trim());
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch {}
  };

  const handleClear = () => {
    setJsonInput('');
    setJqFilter('');
    setParsedJson(null);
    setFilteredResult(null);
    setError('');
    setFilterError('');
    setCollapsedPaths({});
    setSearchTerm('');
  };

  // Render tree - include collapsedPaths in dependency to re-render on toggle
  const treeElement = useMemo(() => {
    if (!parsedJson) return null;
    return (
      <TreeNode
        nodeKey=""
        value={parsedJson}
        path=""
        depth={0}
        isLast={true}
        isCollapsed={collapsedPaths[''] === true}
        searchTerm={searchTerm}
        onToggle={toggleCollapse}
        onCopyPath={copyPath}
        getIsCollapsed={getIsCollapsed}
      />
    );
  }, [parsedJson, collapsedPaths, searchTerm, toggleCollapse, copyPath, getIsCollapsed]);

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-6">
      <h2 className="text-xl font-semibold text-stone-900 mb-6 tracking-tight">JSON Tools</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Panel - JSON Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
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
            <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Right Panel - Tree View */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-stone-700">Tree View</label>
            <div className="flex space-x-2">
              {parsedJson && (
                <>
                  <button onClick={collapseAll} className="text-xs text-orange-500 hover:text-white hover:bg-orange-500 px-3 py-1.5 rounded-full border border-orange-300 hover:border-orange-500 font-medium">
                    − All
                  </button>
                  <button onClick={expandAll} className="text-xs text-orange-500 hover:text-white hover:bg-orange-500 px-3 py-1.5 rounded-full border border-orange-300 hover:border-orange-500 font-medium">
                    + All
                  </button>
                </>
              )}
              <button onClick={() => parsedJson && handleCopy(JSON.stringify(parsedJson, null, 2), 'tree')} className="text-sm text-stone-500 hover:text-stone-700 px-2 py-1 rounded hover:bg-stone-100" disabled={!parsedJson}>
                {copyFeedback === 'tree' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          {/* Search box */}
          <div className="mb-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 text-sm"
              placeholder="Search keys or values..."
            />
          </div>
          
          <div className="w-full h-[460px] p-4 border border-stone-200 rounded-xl bg-stone-50 overflow-auto font-mono text-sm">
            {parsedJson ? (
              <div className="whitespace-pre-wrap">
                {treeElement}
              </div>
            ) : (
              <div className="text-stone-400 text-center py-20">
                {jsonInput.trim() ? 'Waiting for valid JSON...' : 'Tree view will appear here'}
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-stone-500">
            Click on any key to copy its path to the filter box
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
            disabled={!parsedJson || !jqFilter.trim()}
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
