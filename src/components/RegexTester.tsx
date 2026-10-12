import React, { useEffect, useState } from 'react';
import type { RegexResult } from '../utils/regex';

interface RegexTesterProps {
  state: {
    pattern: string;
    flags: string;
    testText: string;
    replacement: string;
  };
  setState: React.Dispatch<React.SetStateAction<RegexTesterProps['state']>>;
}

const FLAG_OPTIONS = [
  { value: 'g', label: 'Global' },
  { value: 'i', label: 'Ignore case' },
  { value: 'm', label: 'Multiline' },
  { value: 's', label: 'Dot all' },
  { value: 'u', label: 'Unicode' },
];

const RegexTester: React.FC<RegexTesterProps> = ({ state, setState }) => {
  const { pattern, flags, testText, replacement } = state;
  const [result, setResult] = useState<RegexResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!pattern) {
      setResult(null);
      setError('');
      return;
    }

    let worker: Worker | undefined;
    let workerTimeout: number | undefined;

    const debounceTimer = window.setTimeout(() => {
      worker = new Worker(new URL('../workers/regexWorker.ts', import.meta.url), {
        type: 'module',
      });
      workerTimeout = window.setTimeout(() => {
        worker?.terminate();
        setResult(null);
        setError('Regex evaluation exceeded 750ms and was stopped');
      }, 750);

      worker.onmessage = (event: MessageEvent<{ result?: RegexResult; error?: string }>) => {
        window.clearTimeout(workerTimeout);
        worker?.terminate();
        if (event.data.error) {
          setResult(null);
          setError(event.data.error);
        } else {
          setResult(event.data.result ?? null);
          setError('');
        }
      };

      worker.postMessage({ pattern, flags, input: testText, replacement });
    }, 150);

    return () => {
      window.clearTimeout(debounceTimer);
      window.clearTimeout(workerTimeout);
      worker?.terminate();
    };
  }, [flags, pattern, replacement, testText]);

  const updateState = (changes: Partial<RegexTesterProps['state']>) => {
    setState(previous => ({ ...previous, ...changes }));
  };

  const toggleFlag = (flag: string) => {
    updateState({
      flags: flags.includes(flag)
        ? flags.replace(flag, '')
        : `${flags}${flag}`,
    });
  };

  const handleClear = () => {
    setState({ pattern: '', flags: 'g', testText: '', replacement: '' });
    setResult(null);
    setError('');
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2 tracking-tight">Regex Tester</h2>
          <p className="text-sm text-stone-500">Test JavaScript regular expressions locally with captures and replacement output.</p>
        </div>
        <button onClick={handleClear} className="btn-secondary text-sm">Clear</button>
      </div>

      <div className="mb-6">
        <label htmlFor="regex-pattern" className="block text-sm font-medium text-stone-700 mb-2">Regular Expression</label>
        <div className="flex items-center border border-stone-200 rounded-xl focus-within:ring-2 focus-within:ring-orange-500/40 focus-within:border-orange-400 overflow-hidden">
          <span className="pl-4 text-stone-400 font-mono">/</span>
          <input
            id="regex-pattern"
            value={pattern}
            onChange={event => updateState({ pattern: event.target.value })}
            className="flex-1 min-w-0 px-2 py-3 font-mono text-sm outline-none"
            placeholder="(?&lt;name&gt;[a-z]+)@(?&lt;domain&gt;[a-z.]+)"
            spellCheck={false}
          />
          <span className="text-stone-400 font-mono">/</span>
          <span className="px-4 text-orange-600 font-mono text-sm min-w-10">{flags}</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {FLAG_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => toggleFlag(option.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                flags.includes(option.value)
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
              }`}
              title={option.label}
            >
              {option.value} · {option.label}
            </button>
          ))}
        </div>
        {error && <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <label htmlFor="regex-test-text" className="block text-sm font-medium text-stone-700 mb-2">Test Text</label>
          <textarea
            id="regex-test-text"
            value={testText}
            onChange={event => updateState({ testText: event.target.value })}
            className="w-full h-[500px] p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 resize-none font-mono text-sm"
            placeholder="Paste text to test against the expression..."
            spellCheck={false}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">Matches</span>
            <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700">
              {result?.matches.length ?? 0}{result?.truncated ? '+' : ''}
            </span>
          </div>
          <div className="h-[282px] overflow-auto p-3 bg-stone-50 rounded-xl border border-stone-200">
            {result?.matches.length ? (
              <div className="space-y-2">
                {result.matches.map((match, index) => (
                  <div key={`${match.index}-${index}`} className="bg-white border border-stone-200 rounded-lg p-3">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="font-mono text-sm text-stone-900 break-all">{match.value || '(empty match)'}</span>
                      <span className="text-xs text-stone-400 flex-shrink-0">index {match.index}</span>
                    </div>
                    {(match.groups.length > 0 || Object.keys(match.namedGroups).length > 0) && (
                      <div className="text-xs text-stone-500 font-mono break-all">
                        {match.groups.length > 0 && <div>groups: {JSON.stringify(match.groups)}</div>}
                        {Object.keys(match.namedGroups).length > 0 && <div>named: {JSON.stringify(match.namedGroups)}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-stone-400 italic">
                {pattern ? 'No matches' : 'Enter a regular expression to begin'}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="regex-replacement" className="block text-sm font-medium text-stone-700 mb-2">Replacement</label>
            <input
              id="regex-replacement"
              value={replacement}
              onChange={event => updateState({ replacement: event.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 font-mono text-sm"
              placeholder="$1 or $&"
              spellCheck={false}
            />
          </div>
          <textarea
            aria-label="Replacement Output"
            value={result?.replacement ?? testText}
            readOnly
            className="w-full h-[130px] p-3 border border-stone-200 rounded-xl bg-stone-50 font-mono text-sm resize-none"
          />
        </div>
      </div>

      <div className="mt-6 text-sm text-stone-600 text-center font-medium bg-orange-50 p-3 rounded-lg border border-orange-100">
        Expressions run in a disposable Web Worker and are stopped if they exceed 750ms.
      </div>
    </div>
  );
};

export default RegexTester;
