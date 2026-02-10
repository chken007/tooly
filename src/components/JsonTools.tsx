import React, { useState, useCallback } from 'react';

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

const JsonTools: React.FC<JsonToolsProps> = ({ state, setState }) => {
  // Destructure state from props
  const { jsonInput, jqFilter } = state;
  
  // Helper functions to update specific parts of state
  const setJsonInput = (value: string) => setState(prev => ({ ...prev, jsonInput: value }));
  const setJqFilter = (value: string) => setState(prev => ({ ...prev, jqFilter: value }));
  
  // Local state (not persisted across tabs)
  const [error, setError] = useState<string>('');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [filteredResult, setFilteredResult] = useState<any>(null);
  const [filterError, setFilterError] = useState<string>('');
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());
  const [copyFeedback, setCopyFeedback] = useState<'input' | 'tree' | 'filter' | null>(null);

  // Parse JSON input
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
      setCollapsedPaths(new Set());
    } catch (err) {
      setParsedJson(null);
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, [jsonInput]);

  // Auto-parse on input change
  React.useEffect(() => {
    const timer = setTimeout(() => {
      parseJsonInput();
    }, 300);
    return () => clearTimeout(timer);
  }, [jsonInput, parseJsonInput]);

  // Toggle collapse/expand for a path
  const toggleCollapse = useCallback((path: string) => {
    setCollapsedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  // Collect all paths for collapse/expand all
  const collectAllPaths = useCallback((obj: any, path: string = ''): string[] => {
    const paths: string[] = [];
    
    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        paths.push(path);
        obj.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            paths.push(...collectAllPaths(item, path === '' ? `[${index}]` : `${path}[${index}]`));
          }
        });
      }
    } else if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      if (keys.length > 0) {
        paths.push(path);
        keys.forEach(key => {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            paths.push(...collectAllPaths(obj[key], path === '' ? key : `${path}.${key}`));
          }
        });
      }
    }
    
    return paths;
  }, []);

  // Expand all nodes
  const expandAll = useCallback(() => {
    setCollapsedPaths(new Set());
  }, []);

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    if (parsedJson) {
      const allPaths = collectAllPaths(parsedJson);
      setCollapsedPaths(new Set(allPaths));
    }
  }, [parsedJson, collectAllPaths]);

  // Copy JSON path to clipboard
  const copyPath = useCallback(async (path: string) => {
    const jqPath = path.startsWith('[') ? path : `.${path}`;
    try {
      await navigator.clipboard.writeText(jqPath);
      setJqFilter(jqPath);
    } catch (err) {
      // Silently fail
    }
  }, [setJqFilter]);

  // Apply JQ-like filter
  const applyFilter = useCallback(() => {
    if (!parsedJson || !jqFilter.trim()) {
      setFilteredResult(null);
      setFilterError('');
      return;
    }

    try {
      const filter = jqFilter.trim();
      let result: any = parsedJson;

      // Simple JQ-like path parser
      // Supports: .key, .key1.key2, .[0], .key[0], .key[], .key[] | .subkey
      const parts = filter.split('|').map(p => p.trim());
      
      for (const part of parts) {
        if (!part || part === '.') continue;
        
        result = applyFilterPart(result, part);
      }

      setFilteredResult(result);
      setFilterError('');
    } catch (err) {
      setFilteredResult(null);
      setFilterError(err instanceof Error ? err.message : 'Filter error');
    }
  }, [parsedJson, jqFilter]);

  // Apply a single filter part
  const applyFilterPart = (data: any, filterPart: string): any => {
    if (data === null || data === undefined) {
      throw new Error('Cannot filter null/undefined');
    }

    // Handle array iteration: .[]
    if (filterPart === '.[]') {
      if (!Array.isArray(data)) {
        throw new Error('Cannot iterate over non-array');
      }
      return data;
    }

    // Handle .key[] (iterate array at key)
    const iterMatch = filterPart.match(/^\.([a-zA-Z_][a-zA-Z0-9_]*)\[\]$/);
    if (iterMatch) {
      const key = iterMatch[1];
      if (typeof data !== 'object' || data === null) {
        throw new Error(`Cannot access key "${key}" on non-object`);
      }
      const arr = data[key];
      if (!Array.isArray(arr)) {
        throw new Error(`"${key}" is not an array`);
      }
      return arr;
    }

    // Handle .key[index]
    const indexMatch = filterPart.match(/^\.([a-zA-Z_][a-zA-Z0-9_]*)\[(\d+)\]$/);
    if (indexMatch) {
      const key = indexMatch[1];
      const index = parseInt(indexMatch[2], 10);
      if (typeof data !== 'object' || data === null) {
        throw new Error(`Cannot access key "${key}" on non-object`);
      }
      const arr = data[key];
      if (!Array.isArray(arr)) {
        throw new Error(`"${key}" is not an array`);
      }
      return arr[index];
    }

    // Handle .[index]
    const bareIndexMatch = filterPart.match(/^\.\[(\d+)\]$/);
    if (bareIndexMatch) {
      const index = parseInt(bareIndexMatch[1], 10);
      if (!Array.isArray(data)) {
        throw new Error('Cannot index non-array');
      }
      return data[index];
    }

    // Handle [index] (without dot)
    const bareIndexMatch2 = filterPart.match(/^\[(\d+)\]$/);
    if (bareIndexMatch2) {
      const index = parseInt(bareIndexMatch2[1], 10);
      if (!Array.isArray(data)) {
        throw new Error('Cannot index non-array');
      }
      return data[index];
    }

    // Handle nested keys: .key1.key2.key3
    if (filterPart.startsWith('.')) {
      const keys = filterPart.slice(1).split('.');
      let current = data;
      
      for (const key of keys) {
        // Handle key[index] within path
        const keyIndexMatch = key.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\[(\d+)\]$/);
        if (keyIndexMatch) {
          const keyName = keyIndexMatch[1];
          const idx = parseInt(keyIndexMatch[2], 10);
          if (typeof current !== 'object' || current === null) {
            throw new Error(`Cannot access "${keyName}" on non-object`);
          }
          current = current[keyName];
          if (!Array.isArray(current)) {
            throw new Error(`"${keyName}" is not an array`);
          }
          current = current[idx];
        } else if (key) {
          if (typeof current !== 'object' || current === null) {
            throw new Error(`Cannot access "${key}" on non-object`);
          }
          current = current[key];
        }
      }
      
      return current;
    }

    // Handle special functions
    if (filterPart === 'keys') {
      if (typeof data !== 'object' || data === null) {
        throw new Error('Cannot get keys of non-object');
      }
      return Object.keys(data);
    }

    if (filterPart === 'length') {
      if (Array.isArray(data)) {
        return data.length;
      }
      if (typeof data === 'object' && data !== null) {
        return Object.keys(data).length;
      }
      if (typeof data === 'string') {
        return data.length;
      }
      throw new Error('Cannot get length of this type');
    }

    if (filterPart === 'type') {
      if (data === null) return 'null';
      if (Array.isArray(data)) return 'array';
      return typeof data;
    }

    throw new Error(`Unsupported filter: ${filterPart}`);
  };

  // Render JSON tree recursively
  const renderTree = useCallback((obj: any, path: string = '', depth: number = 0): React.ReactElement => {
    const indent = depth * 20;

    if (obj === null) {
      return <span className="text-stone-400 italic">null</span>;
    }

    if (typeof obj === 'boolean') {
      return <span className="text-purple-600 font-medium">{obj.toString()}</span>;
    }

    if (typeof obj === 'number') {
      return <span className="text-amber-600 font-medium">{obj}</span>;
    }

    if (typeof obj === 'string') {
      return <span className="text-emerald-600">"{obj}"</span>;
    }

    if (Array.isArray(obj)) {
      const isCollapsed = collapsedPaths.has(path);
      const isEmpty = obj.length === 0;

      if (isEmpty) {
        return <span className="text-stone-700 font-semibold">[]</span>;
      }

      return (
        <span>
          <button
            onClick={() => toggleCollapse(path)}
            className="inline-flex items-center justify-center w-4 h-4 mr-1 text-white bg-orange-400 hover:bg-orange-500 rounded-full text-xs font-bold transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? '+' : '−'}
          </button>
          <span 
            className="text-stone-700 font-semibold cursor-pointer hover:text-orange-600"
            onClick={() => copyPath(path)}
            title={`Click to copy path: ${path || '.'}`}
          >
            [
          </span>
          {isCollapsed ? (
            <span className="text-stone-400 text-xs ml-1">{obj.length} items</span>
          ) : (
            <>
              {obj.map((item, index) => {
                const itemPath = path === '' ? `[${index}]` : `${path}[${index}]`;
                return (
                  <div key={index} style={{ marginLeft: indent + 20 }}>
                    <span 
                      className="text-stone-400 text-xs mr-2 cursor-pointer hover:text-orange-500"
                      onClick={() => copyPath(itemPath)}
                      title={`Click to copy: ${itemPath}`}
                    >
                      {index}:
                    </span>
                    {renderTree(item, itemPath, depth + 1)}
                    {index < obj.length - 1 && <span className="text-stone-500">,</span>}
                  </div>
                );
              })}
            </>
          )}
          <span className="text-stone-700 font-semibold">]</span>
        </span>
      );
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      const isCollapsed = collapsedPaths.has(path);
      const isEmpty = keys.length === 0;

      if (isEmpty) {
        return <span className="text-stone-700 font-semibold">{"{}"}</span>;
      }

      return (
        <span>
          <button
            onClick={() => toggleCollapse(path)}
            className="inline-flex items-center justify-center w-4 h-4 mr-1 text-white bg-orange-400 hover:bg-orange-500 rounded-full text-xs font-bold transition-colors"
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? '+' : '−'}
          </button>
          <span 
            className="text-stone-700 font-semibold cursor-pointer hover:text-orange-600"
            onClick={() => copyPath(path)}
            title={`Click to copy path: ${path || '.'}`}
          >
            {"{"}
          </span>
          {isCollapsed ? (
            <span className="text-stone-400 text-xs ml-1">{keys.length} keys</span>
          ) : (
            <>
              {keys.map((key, index) => {
                const keyPath = path === '' ? key : `${path}.${key}`;
                return (
                  <div key={key} style={{ marginLeft: indent + 20 }}>
                    <span 
                      className="text-sky-600 font-medium cursor-pointer hover:text-orange-500"
                      onClick={() => copyPath(keyPath)}
                      title={`Click to copy: .${keyPath}`}
                    >
                      "{key}"
                    </span>
                    <span className="text-stone-500">: </span>
                    {renderTree(obj[key], keyPath, depth + 1)}
                    {index < keys.length - 1 && <span className="text-stone-500">,</span>}
                  </div>
                );
              })}
            </>
          )}
          <span className="text-stone-700 font-semibold">{"}"}</span>
        </span>
      );
    }

    return <span>{String(obj)}</span>;
  }, [collapsedPaths, toggleCollapse, copyPath]);

  // Handle copy to clipboard
  const handleCopy = async (text: string, type: 'input' | 'tree' | 'filter') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(type);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      // Silently fail
    }
  };

  // Format JSON input
  const handleFormat = () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput.trim());
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch (err) {
      // Already has error message displayed
    }
  };

  // Clear all
  const handleClear = () => {
    setJsonInput('');
    setJqFilter('');
    setParsedJson(null);
    setFilteredResult(null);
    setError('');
    setFilterError('');
    setCollapsedPaths(new Set());
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-stone-900 mb-6 tracking-tight">JSON Tools</h2>
      
      {/* Main two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Panel - JSON Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="json-input" className="block text-sm font-medium text-stone-700">
              JSON Input
            </label>
            <div className="flex space-x-2">
              <button
                onClick={handleFormat}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
                disabled={!jsonInput}
              >
                Format
              </button>
              <button
                onClick={() => handleCopy(jsonInput, 'input')}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
                disabled={!jsonInput}
              >
                {copyFeedback === 'input' ? '✓ Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleClear}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-[500px] p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 resize-none font-mono text-sm transition-all"
            placeholder='Paste your JSON here...&#10;&#10;Example:&#10;{&#10;  "users": [&#10;    { "name": "Alice", "age": 30 },&#10;    { "name": "Bob", "age": 25 }&#10;  ]&#10;}'
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
            <label className="block text-sm font-medium text-stone-700">
              Tree View
            </label>
            <div className="flex space-x-2">
              {parsedJson && (
                <>
                  <button
                    onClick={collapseAll}
                    className="text-xs text-orange-500 hover:text-white hover:bg-orange-500 transition-all duration-200 px-3 py-1.5 rounded-full border border-orange-300 hover:border-orange-500 font-medium"
                    title="Collapse all nodes"
                  >
                    − All
                  </button>
                  <button
                    onClick={expandAll}
                    className="text-xs text-orange-500 hover:text-white hover:bg-orange-500 transition-all duration-200 px-3 py-1.5 rounded-full border border-orange-300 hover:border-orange-500 font-medium"
                    title="Expand all nodes"
                  >
                    + All
                  </button>
                </>
              )}
              <button
                onClick={() => parsedJson && handleCopy(JSON.stringify(parsedJson, null, 2), 'tree')}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
                disabled={!parsedJson}
              >
                {copyFeedback === 'tree' ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="w-full h-[500px] p-4 border border-stone-200 rounded-xl bg-stone-50 overflow-auto font-mono text-sm">
            {parsedJson ? (
              <div className="whitespace-pre-wrap">
                {renderTree(parsedJson)}
              </div>
            ) : (
              <div className="text-stone-400 text-center py-20">
                {jsonInput.trim() ? 'Waiting for valid JSON...' : 'Tree view will appear here'}
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-stone-500">
            Click on any key or bracket to copy its path to the filter box
          </div>
        </div>
      </div>

      {/* JQ Filter Section */}
      <div className="border-t border-stone-200 pt-6">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="jq-filter" className="block text-sm font-medium text-stone-700">
            JQ Filter
          </label>
          <div className="text-xs text-stone-500">
            Supports: .key, .key1.key2, .[0], .key[], keys, length, type
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            id="jq-filter"
            type="text"
            value={jqFilter}
            onChange={(e) => setJqFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            className="flex-1 px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 font-mono text-sm transition-all"
            placeholder=".users[0].name"
          />
          <button
            onClick={applyFilter}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            disabled={!parsedJson || !jqFilter.trim()}
          >
            Apply
          </button>
        </div>

        {/* Filtered Result */}
        {(filteredResult !== null || filterError) && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-stone-700">
                Filtered Result
              </label>
              {filteredResult !== null && (
                <button
                  onClick={() => handleCopy(JSON.stringify(filteredResult, null, 2), 'filter')}
                  className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
                >
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

      {/* Info */}
      <div className="mt-6 text-sm text-stone-600 text-center font-medium bg-orange-50 p-3 rounded-lg border border-orange-100">
        Paste JSON to see interactive tree view. Click paths to copy them, then apply JQ filters to extract data.
      </div>
    </div>
  );
};

export default JsonTools;
