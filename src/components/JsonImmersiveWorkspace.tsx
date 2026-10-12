import { useCallback, useState, type ReactNode, type RefObject } from 'react';
import { useJsonTree } from '../hooks/useJsonTree';
import { JsonSearch, JsonTreeView } from './JsonTreeView';
import { toJqPath } from './JsonTree';

export type ImmersiveLayout = 'single' | 'columns' | 'rows' | 'grid';

export const immersivePaneCount = (layout: ImmersiveLayout) =>
  layout === 'single' ? 1 : layout === 'grid' ? 4 : 2;

const layouts: { id: ImmersiveLayout; label: string; grid: string }[] = [
  { id: 'single', label: 'Single pane', grid: 'grid-cols-1 grid-rows-1' },
  { id: 'columns', label: 'Side by side', grid: 'grid-cols-2 grid-rows-1' },
  { id: 'rows', label: 'Top and bottom', grid: 'grid-cols-1 grid-rows-2' },
  { id: 'grid', label: 'Four panes', grid: 'grid-cols-2 grid-rows-2' },
];

function LayoutIcon({ layout }: { layout: ImmersiveLayout }) {
  const columns = layout === 'columns' || layout === 'grid' ? 2 : 1;
  const rows = layout === 'rows' || layout === 'grid' ? 2 : 1;
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: columns }, (_, column) => (
          <rect
            key={`${row}-${column}`}
            x={3 + column * 10}
            y={3 + row * 10}
            width={columns === 1 ? 18 : 8}
            height={rows === 1 ? 18 : 8}
            rx="1"
          />
        )),
      )}
    </svg>
  );
}

function IndependentJsonPane({ viewportKey }: { viewportKey: string }) {
  const [jsonInput, setJsonInput] = useState('');
  const [clipboardError, setClipboardError] = useState('');
  const tree = useJsonTree(jsonInput, viewportKey);

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setClipboardError('');
      setJsonInput(text);
    } catch (err) {
      setClipboardError(`Could not read clipboard. Allow clipboard access and try again: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  const copyPath = useCallback(async (path: string) => {
    try {
      await navigator.clipboard.writeText(toJqPath(path));
      setClipboardError('');
    } catch (err) {
      setClipboardError(`Could not copy to clipboard: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button onClick={paste} className="btn-primary text-sm" title="Paste JSON from clipboard. Press Escape to exit immersive view.">
          Paste
        </button>
        <JsonSearch tree={tree} />
      </div>
      {clipboardError && <div role="alert" className="text-sm text-red-600">{clipboardError}</div>}
      <JsonTreeView tree={tree} immersive onCopyPath={copyPath} />
    </>
  );
}

interface JsonImmersiveWorkspaceProps {
  immersive: boolean;
  layout: ImmersiveLayout;
  onLayoutChange: (layout: ImmersiveLayout) => void;
  onActivePane: (index: number) => void;
  workspaceRef: RefObject<HTMLDivElement | null>;
  primaryPane: ReactNode;
}

export default function JsonImmersiveWorkspace({
  immersive, layout, onLayoutChange, onActivePane, workspaceRef, primaryPane,
}: JsonImmersiveWorkspaceProps) {
  const paneCount = immersivePaneCount(layout);
  const grid = layouts.find(option => option.id === layout)!.grid;

  return (
    <div ref={workspaceRef} className={immersive ? 'h-full flex flex-col gap-3 p-4 bg-white overflow-hidden' : 'hidden'}>
      <div className="flex justify-end shrink-0">
        <div role="toolbar" aria-label="Immersive layout" className="flex gap-1 p-1 border border-stone-200 rounded-lg">
          {layouts.map(option => (
            <button
              key={option.id}
              aria-label={option.label}
              aria-pressed={layout === option.id}
              title={option.label}
              onClick={() => onLayoutChange(option.id)}
              className={`p-2 border rounded-md focus-ring transition-colors ${
                layout === option.id
                  ? 'bg-orange-50 border-orange-300 text-orange-600'
                  : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
              }`}
            >
              <LayoutIcon layout={option.id} />
            </button>
          ))}
        </div>
      </div>
      <div className={`grid ${grid} gap-3 flex-1 min-h-0 min-w-0 overflow-hidden`}>
        {[0, 1, 2, 3].map(index => (
          <section
            key={index}
            role="region"
            aria-label={`JSON pane ${index + 1}`}
            data-pane-index={index}
            className={index < paneCount ? 'flex flex-col gap-3 min-h-0 min-w-0' : 'hidden'}
            onFocusCapture={() => onActivePane(index)}
            onPointerDownCapture={() => onActivePane(index)}
          >
            {index === 0 ? primaryPane : (
              <IndependentJsonPane viewportKey={`${immersive}:${layout}:${index < paneCount}`} />
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
