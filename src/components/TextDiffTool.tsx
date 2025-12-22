import React, { useState } from 'react';
import * as Diff from 'diff';

interface DiffPart {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

interface TextDiffToolProps {
  state: {
    leftText: string;
    rightText: string;
    diffMode: 'chars' | 'lines';
  };
  setState: React.Dispatch<React.SetStateAction<{
    leftText: string;
    rightText: string;
    diffMode: 'chars' | 'lines';
  }>>;
}

const TextDiffTool: React.FC<TextDiffToolProps> = ({ state, setState }) => {
  // Destructure state from props
  const { leftText, rightText, diffMode } = state;
  
  // Helper functions to update specific parts of state
  const setLeftText = (value: string) => setState(prev => ({ ...prev, leftText: value }));
  const setRightText = (value: string) => setState(prev => ({ ...prev, rightText: value }));
  const setDiffMode = (value: 'chars' | 'lines') => setState(prev => ({ ...prev, diffMode: value }));
  
  // Local state (not persisted across tabs)
  const [diffParts, setDiffParts] = useState<DiffPart[]>([]);
  const [showDiff, setShowDiff] = useState(false);
  const [showUnified, setShowUnified] = useState(false);
  const [stats, setStats] = useState({ added: 0, removed: 0, unchanged: 0 });

  const processDiff = (leftText: string, rightText: string) => {
    // Use line-level or character-level diff based on user choice
    const diff = diffMode === 'lines' 
      ? Diff.diffLines(leftText, rightText)
      : Diff.diffChars(leftText, rightText);
    
    const processedParts: DiffPart[] = [];
    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    diff.forEach((part) => {
      if (part.added) {
        processedParts.push({
          type: 'added',
          value: part.value
        });
        addedCount += diffMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
      } else if (part.removed) {
        processedParts.push({
          type: 'removed',
          value: part.value
        });
        removedCount += diffMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
      } else {
        processedParts.push({
          type: 'unchanged',
          value: part.value
        });
        unchangedCount += diffMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
      }
    });

    setDiffParts(processedParts);
    setStats({ added: addedCount, removed: removedCount, unchanged: unchangedCount });
  };

  const handleCompare = () => {
    if (!leftText && !rightText) {
      setDiffParts([]);
      setShowDiff(false);
      setStats({ added: 0, removed: 0, unchanged: 0 });
      return;
    }

    processDiff(leftText, rightText);
    setShowDiff(true);
  };

  const handleClear = () => {
    setLeftText('');
    setRightText('');
    setDiffParts([]);
    setShowDiff(false);
    setShowUnified(false);
    setStats({ added: 0, removed: 0, unchanged: 0 });
  };

  const handleDiffModeChange = (newMode: 'chars' | 'lines') => {
    setDiffMode(newMode);
    
    // Re-run comparison if it was already shown
    if (showDiff) {
      // Process diff with the new mode
      const diff = newMode === 'lines' 
        ? Diff.diffLines(leftText, rightText)
        : Diff.diffChars(leftText, rightText);
      
      const processedParts: DiffPart[] = [];
      let addedCount = 0;
      let removedCount = 0;
      let unchangedCount = 0;

      diff.forEach((part) => {
        if (part.added) {
          processedParts.push({
            type: 'added',
            value: part.value
          });
          addedCount += newMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
        } else if (part.removed) {
          processedParts.push({
            type: 'removed',
            value: part.value
          });
          removedCount += newMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
        } else {
          processedParts.push({
            type: 'unchanged',
            value: part.value
          });
          unchangedCount += newMode === 'lines' ? part.value.split('\n').length - 1 : part.value.length;
        }
      });

      setDiffParts(processedParts);
      setStats({ added: addedCount, removed: removedCount, unchanged: unchangedCount });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const renderUnifiedView = () => {
    return (
      <div className="p-4 border border-stone-200 rounded-md bg-white font-mono text-sm leading-relaxed whitespace-pre-wrap h-[750px] overflow-y-auto">
        {diffParts.map((part, index) => {
          let className = '';
          
          switch (part.type) {
            case 'added':
              className = 'bg-green-200 text-green-900 px-1 rounded';
              break;
            case 'removed':
              className = 'bg-red-200 text-red-900 px-1 rounded line-through';
              break;
            case 'unchanged':
              className = 'text-stone-800';
              break;
          }

          return (
            <span key={index} className={className}>
              {part.value}
            </span>
          );
        })}
      </div>
    );
  };

  const renderSideBySide = () => {
    // Split diff parts into left (original) and right (modified) views
    const leftParts: DiffPart[] = [];
    const rightParts: DiffPart[] = [];

    diffParts.forEach((part) => {
      if (part.type === 'removed') {
        leftParts.push(part);
      } else if (part.type === 'added') {
        rightParts.push(part);
      } else {
        leftParts.push(part);
        rightParts.push(part);
      }
    });

    const renderSideWithLineNumbers = (parts: DiffPart[], isLeft: boolean) => {
      // Reconstruct the full text to get line count
      let fullText = '';
      parts.forEach(part => {
        fullText += part.value;
      });
      
      const lines = fullText.split('\n');
      
      return (
        <div className="border border-stone-200 rounded-md bg-white h-[750px] overflow-y-auto">
          <div className="flex text-sm font-mono">
            {/* Line numbers column */}
            <div className="w-12 bg-stone-50 border-r border-stone-200 text-xs text-stone-500 text-right py-4 px-2 select-none flex-shrink-0">
              {lines.map((_, index) => (
                <div key={index} className="h-[21px] leading-[21px]">
                  {index + 1}
                </div>
              ))}
            </div>
            
            {/* Content column */}
            <div className="flex-1 p-4 leading-[21px] whitespace-pre-wrap">
              {parts.map((part, index) => {
                let className = '';
                
                if (isLeft && part.type === 'removed') {
                  className = 'bg-red-200 text-red-900 px-1 rounded';
                } else if (!isLeft && part.type === 'added') {
                  className = 'bg-green-200 text-green-900 px-1 rounded';
                } else if (part.type === 'unchanged') {
                  className = 'text-stone-800';
                }

                return (
                  <span key={index} className={className}>
                    {part.value}
                  </span>
          );
        })}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-stone-700 mb-2">Text A (with deletions)</h4>
          {renderSideWithLineNumbers(leftParts, true)}
        </div>
        <div>
          <h4 className="text-sm font-medium text-stone-700 mb-2">Text B (with additions)</h4>
          {renderSideWithLineNumbers(rightParts, false)}
        </div>
      </div>
    );
  };

  const renderDiffResult = () => {
    if (!showDiff) {
      return (
        <div className="text-stone-500 text-center h-[750px] flex flex-col justify-center">
          <div className="text-lg mb-2">Ready to compare</div>
          <div>Enter text in both fields and click "Compare" to see character-level differences</div>
        </div>
      );
    }

    if (diffParts.length === 0 || (leftText === rightText)) {
      return (
        <div className="text-stone-500 text-center h-[750px] flex flex-col justify-center">
          <div className="text-lg mb-2">✅ No differences found</div>
          <div>Both texts are identical</div>
        </div>
      );
    }

    return showUnified ? renderUnifiedView() : renderSideBySide();
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-stone-900 mb-6 tracking-tight">Text Diff Tool</h2>
      
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="leftText" className="block text-sm font-medium text-stone-700">
              Text A
          </label>
            <button
              onClick={() => copyToClipboard(leftText)}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
          <textarea
            id="leftText"
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            className="w-full h-[350px] p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all resize-none font-mono text-sm"
            placeholder="Enter first text here..."
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="rightText" className="block text-sm font-medium text-stone-700">
              Text B
          </label>
            <button
              onClick={() => copyToClipboard(rightText)}
              className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
          <textarea
            id="rightText"
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            className="w-full h-[350px] p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 transition-all resize-none font-mono text-sm"
            placeholder="Enter second text here..."
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={handleCompare}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
        >
          Compare
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors text-sm font-medium"
        >
          Clear
        </button>

        {/* Diff Mode Toggle */}
        <div className="flex border border-stone-200 rounded-lg overflow-hidden">
          <button
            onClick={() => handleDiffModeChange('lines')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              diffMode === 'lines'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            Lines
          </button>
          <button
            onClick={() => handleDiffModeChange('chars')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-stone-200 ${
              diffMode === 'chars'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            Chars
          </button>
        </div>
        
        {showDiff && diffParts.length > 0 && (
          <button
            onClick={() => setShowUnified(!showUnified)}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              showUnified 
                ? 'bg-stone-600 text-white hover:bg-stone-700' 
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {showUnified ? 'Side-by-Side' : 'Unified View'}
          </button>
        )}
      </div>

      {/* Stats */}
      {showDiff && (
        <div className="mb-4 p-3 bg-stone-50 rounded-md">
          <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="font-medium text-green-800">
                {stats.added} {diffMode === 'lines' ? 'lines' : 'characters'} added
              </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="font-medium text-red-800">
                {stats.removed} {diffMode === 'lines' ? 'lines' : 'characters'} removed
              </span>
              </div>
              <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-stone-400 rounded"></div>
              <span className="font-medium text-stone-700">
                {stats.unchanged} {diffMode === 'lines' ? 'lines' : 'characters'} unchanged
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Diff Output */}
      <div>
        {showDiff && (
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-stone-800">
            {showUnified ? 'Unified View' : 'Side-by-Side Comparison'}
          </h3>
            {diffParts.length > 0 && (
              <span className="text-sm text-stone-600">
              {showUnified ? '(Green = Added, Red = Removed)' : '(Red = Deleted, Green = Added)'}
            </span>
          )}
        </div>
        )}
        <div className="bg-white">
          {renderDiffResult()}
        </div>
      </div>
    </div>
  );
};

export default TextDiffTool; 