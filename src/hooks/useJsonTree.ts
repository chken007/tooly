import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { childNodeId, matchesJsonSearch, type JsonValue } from '../utils/jsonWorkspace';

type CollapsedState = Record<string, boolean>;

export function useJsonTree(jsonInput: string, viewportKey: string) {
  const [parsedJson, setParsedJson] = useState<JsonValue | undefined>(undefined);
  const [error, setError] = useState('');
  const [collapsedPaths, setCollapsedPaths] = useState<CollapsedState>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMatch, setActiveMatch] = useState(-1);
  const treeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveMatch(-1);
      if (!jsonInput.trim()) {
        setParsedJson(undefined);
        setError('');
        return;
      }
      try {
        setParsedJson(JSON.parse(jsonInput.trim()));
        setError('');
        setCollapsedPaths({});
      } catch (err) {
        setParsedJson(undefined);
        setError(err instanceof Error ? err.message : 'Invalid JSON');
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [jsonInput]);

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
    if (!tree || activeNodeId === undefined) return;
    const revealActive = () => {
      const active = tree.querySelector<HTMLElement>('[data-search-active="true"]');
      if (!active || tree.clientHeight === 0) return;
      const bounds = active.getBoundingClientRect();
      const treeBounds = tree.getBoundingClientRect();
      // Scroll only this tree, including when a layout change reveals or resizes it.
      tree.scrollTop += bounds.top - treeBounds.top - (tree.clientHeight - bounds.height) / 2;
      if (bounds.left < treeBounds.left || bounds.right > treeBounds.right) {
        tree.scrollLeft += bounds.left - treeBounds.left - 16;
      }
    };
    revealActive();
    const observer = new ResizeObserver(revealActive);
    observer.observe(tree);
    return () => observer.disconnect();
  }, [activeNodeId, collapsedPaths, viewportKey]);

  const getIsCollapsed = useCallback((nodeId: string) => collapsedPaths[nodeId] === true, [collapsedPaths]);
  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedPaths(previous => ({ ...previous, [nodeId]: !previous[nodeId] }));
  }, []);
  const expandAll = useCallback(() => setCollapsedPaths({}), []);
  const collapseAll = useCallback(() => {
    if (parsedJson === undefined) return;
    const paths: CollapsedState = {};
    const collect = (value: JsonValue, nodeId: string) => {
      if (value !== null && typeof value === 'object' && Object.keys(value).length > 0) {
        paths[nodeId] = true;
        for (const [key, child] of Object.entries(value)) collect(child, childNodeId(nodeId, key));
      }
    };
    collect(parsedJson, '$');
    setCollapsedPaths(paths);
  }, [parsedJson]);

  const changeSearch = (query: string) => {
    setSearchTerm(query);
    setActiveMatch(-1);
  };
  const clearTree = () => {
    setParsedJson(undefined);
    setError('');
    setCollapsedPaths({});
    changeSearch('');
  };

  return {
    parsedJson, error, setError, searchTerm, changeSearch, activeMatch, searchMatches,
    activeNodeId, navigateSearch, getIsCollapsed, toggleCollapse, expandAll, collapseAll,
    clearTree, treeRef, searchRef, hasInput: jsonInput.trim() !== '',
  };
}

export type JsonTreeState = ReturnType<typeof useJsonTree>;
