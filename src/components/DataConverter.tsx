import React, { useState } from 'react';
import { convertData, type DataFormat } from '../utils/dataConverter';

interface DataConverterProps {
  state: {
    input: string;
    output: string;
    sourceFormat: DataFormat;
    targetFormat: DataFormat;
  };
  setState: React.Dispatch<React.SetStateAction<DataConverterProps['state']>>;
}

const FORMAT_LABELS: Record<DataFormat, string> = {
  json: 'JSON',
  csv: 'CSV',
  yaml: 'YAML',
};

const DataConverter: React.FC<DataConverterProps> = ({ state, setState }) => {
  const { input, output, sourceFormat, targetFormat } = state;
  const [error, setError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const updateState = (changes: Partial<DataConverterProps['state']>) => {
    setState(previous => ({ ...previous, ...changes }));
  };

  const handleConvert = () => {
    try {
      updateState({ output: convertData(input, sourceFormat, targetFormat) });
      setError('');
    } catch (conversionError) {
      updateState({ output: '' });
      setError(conversionError instanceof Error ? conversionError.message : 'Conversion failed');
    }
  };

  const handleSwap = () => {
    setState({
      input: output,
      output: input,
      sourceFormat: targetFormat,
      targetFormat: sourceFormat,
    });
    setError('');
  };

  const handleSourceChange = (format: DataFormat) => {
    updateState({
      sourceFormat: format,
      targetFormat: format === targetFormat
        ? (format === 'json' ? 'csv' : 'json')
        : targetFormat,
      output: '',
    });
  };

  const handleTargetChange = (format: DataFormat) => {
    updateState({
      targetFormat: format,
      sourceFormat: format === sourceFormat
        ? (format === 'json' ? 'csv' : 'json')
        : sourceFormat,
      output: '',
    });
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyFeedback(true);
      window.setTimeout(() => setCopyFeedback(false), 1500);
    } catch {
      setError('Failed to copy output');
    }
  };

  const handleClear = () => {
    setState({ input: '', output: '', sourceFormat: 'json', targetFormat: 'csv' });
    setError('');
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 mb-2 tracking-tight">Data Converter</h2>
          <p className="text-sm text-stone-500">Convert JSON, CSV, and YAML locally in your browser.</p>
        </div>
        <button onClick={handleClear} className="btn-secondary text-sm">Clear</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-6 items-start">
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <label htmlFor="data-converter-input" className="text-sm font-medium text-stone-700">Input</label>
            <select
              value={sourceFormat}
              onChange={event => handleSourceChange(event.target.value as DataFormat)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm font-medium text-stone-700"
              aria-label="Source format"
            >
              {Object.entries(FORMAT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <textarea
            id="data-converter-input"
            value={input}
            onChange={event => updateState({ input: event.target.value, output: '' })}
            className="w-full h-[560px] p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 resize-none font-mono text-sm"
            placeholder={`Paste ${FORMAT_LABELS[sourceFormat]} here...`}
            spellCheck={false}
          />
        </div>

        <div className="flex lg:flex-col items-center justify-center gap-2 lg:pt-52">
          <button onClick={handleConvert} disabled={!input.trim()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            Convert
          </button>
          <button onClick={handleSwap} disabled={!output} className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed" title="Swap input and output">
            ⇄ Swap
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <label htmlFor="data-converter-output" className="text-sm font-medium text-stone-700">Output</label>
            <div className="flex items-center gap-2">
              <select
                value={targetFormat}
                onChange={event => handleTargetChange(event.target.value as DataFormat)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-sm font-medium text-stone-700"
                aria-label="Target format"
              >
                {Object.entries(FORMAT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <button onClick={handleCopy} disabled={!output} className="text-sm text-stone-500 hover:text-stone-700 px-2 py-1 rounded hover:bg-stone-100 disabled:opacity-50">
                {copyFeedback ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <textarea
            id="data-converter-output"
            value={output}
            readOnly
            className="w-full h-[560px] p-4 border border-stone-200 rounded-xl bg-stone-50 font-mono text-sm resize-none"
            placeholder={`${FORMAT_LABELS[targetFormat]} output will appear here...`}
          />
        </div>
      </div>

      {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{error}</div>}

      <div className="mt-6 text-sm text-stone-600 text-center font-medium bg-orange-50 p-3 rounded-lg border border-orange-100">
        CSV values are parsed with headers and automatic number/boolean detection. Spreadsheet formulas are escaped on export.
      </div>
    </div>
  );
};

export default DataConverter;

