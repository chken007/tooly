import JsonTree from './JsonTree';
import type { JsonTreeState } from '../hooks/useJsonTree';

export function JsonSearch({ tree }: { tree: JsonTreeState }) {
  return (
    <div className="relative min-w-[120px] flex-1">
      <input
        ref={tree.searchRef}
        type="search"
        aria-label="Search JSON tree"
        value={tree.searchTerm}
        onChange={event => tree.changeSearch(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            event.preventDefault();
            tree.navigateSearch(event.shiftKey);
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
        {tree.activeMatch < 0 ? 0 : tree.activeMatch + 1} of {tree.searchMatches.length}
      </span>
    </div>
  );
}

interface JsonTreeViewProps {
  tree: JsonTreeState;
  immersive: boolean;
  onCopyPath: (path: string) => void;
}

export function JsonTreeView({ tree, immersive, onCopyPath }: JsonTreeViewProps) {
  return (
    <div
      ref={tree.treeRef}
      role="region"
      aria-label="JSON tree"
      className={`w-full p-4 border border-stone-200 rounded-xl bg-stone-50 overflow-auto font-mono text-sm ${
        immersive ? 'flex-1 min-h-0' : 'h-[460px]'
      }`}
    >
      {immersive && tree.error && <div role="alert" className="mb-3 text-red-600">{tree.error}</div>}
      {tree.parsedJson !== undefined ? (
        <div className="whitespace-pre-wrap break-words">
          <JsonTree
            value={tree.parsedJson}
            searchTerm={tree.searchTerm}
            activeNodeId={tree.activeNodeId}
            onToggle={tree.toggleCollapse}
            onCopyPath={onCopyPath}
            getIsCollapsed={tree.getIsCollapsed}
          />
        </div>
      ) : (
        <div className="text-stone-400 text-center py-20">
          {tree.hasInput ? 'Waiting for valid JSON...' : 'Tree view will appear here'}
        </div>
      )}
    </div>
  );
}
