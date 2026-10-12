import { memo, type MouseEvent, type ReactNode } from 'react';

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

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

interface JsonTreeProps {
  value: JsonValue;
  nodeKey?: string;
  path?: string;
  nodeId?: string;
  isLast?: boolean;
  searchTerm: string;
  activeNodeId: string | undefined;
  onToggle: (nodeId: string) => void;
  onCopyPath: (path: string) => void;
  getIsCollapsed: (nodeId: string) => boolean;
}

const JsonTree = memo(function JsonTree({
  value, nodeKey = '', path = '', nodeId = '$', isLast = true,
  searchTerm, activeNodeId, onToggle, onCopyPath, getIsCollapsed,
}: JsonTreeProps) {
  const isContainer = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  const entries = isContainer ? Object.entries(value) : [];
  const collapsed = getIsCollapsed(nodeId);
  const active = activeNodeId === nodeId;
  const matches = matchesJsonSearch(nodeKey, value, searchTerm.toLowerCase());
  const opening = isArray ? '[' : '{';
  const closing = isArray ? ']' : '}';
  const copyPath = (event: MouseEvent) => {
    event.stopPropagation();
    onCopyPath(path);
  };

  let primitive: ReactNode;
  if (value === null) primitive = <span className="text-stone-400 italic">null</span>;
  else if (typeof value === 'boolean') primitive = <span className="text-purple-600 font-medium">{String(value)}</span>;
  else if (typeof value === 'number') primitive = <span className="text-amber-600 font-medium">{value}</span>;
  else primitive = <span className="text-emerald-600">{JSON.stringify(value)}</span>;

  return (
    <div>
      <span
        data-json-node={nodeId}
        data-search-active={active ? 'true' : undefined}
        className={`inline-block ${active ? 'json-search-active' : matches ? 'json-search-match' : ''}`}
      >
        {nodeKey !== '' && (
          <>
            <span className="text-sky-600 font-medium cursor-pointer hover:text-orange-500" onClick={copyPath}>
              {JSON.stringify(nodeKey)}
            </span>
            <span className="text-stone-500">: </span>
          </>
        )}
        {isContainer ? (
          <>
            {entries.length > 0 && (
              <button
                onClick={() => onToggle(nodeId)}
                aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${nodeKey || 'node'}`}
                aria-expanded={!collapsed}
                className="inline-flex items-center justify-center w-4 h-4 mr-1 text-white bg-orange-400 hover:bg-orange-500 rounded-full text-xs font-bold select-none"
              >
                {collapsed ? '+' : '−'}
              </button>
            )}
            <span className="text-stone-700 font-semibold cursor-pointer hover:text-orange-600" onClick={copyPath}>
              {opening}
            </span>
            {collapsed && entries.length > 0 && (
              <span className="text-stone-400 text-xs mx-1">
                {entries.length} {isArray ? 'items' : 'keys'}
              </span>
            )}
            {(collapsed || entries.length === 0) && <span className="text-stone-700 font-semibold">{closing}</span>}
          </>
        ) : primitive}
        {(!isContainer || collapsed || entries.length === 0) && !isLast && <span className="text-stone-500">,</span>}
      </span>
      {isContainer && !collapsed && entries.length > 0 && (
        <>
          <div className="ml-4">
            {entries.map(([key, child], index) => (
              <JsonTree
                key={key}
                value={child}
                nodeKey={isArray ? '' : key}
                path={isArray ? `${path}[${key}]` : path ? `${path}.${key}` : key}
                nodeId={childNodeId(nodeId, key)}
                isLast={index === entries.length - 1}
                searchTerm={searchTerm}
                activeNodeId={activeNodeId}
                onToggle={onToggle}
                onCopyPath={onCopyPath}
                getIsCollapsed={getIsCollapsed}
              />
            ))}
          </div>
          <div className="text-stone-700 font-semibold">
            {closing}{!isLast && <span className="text-stone-500">,</span>}
          </div>
        </>
      )}
    </div>
  );
});

export default JsonTree;
