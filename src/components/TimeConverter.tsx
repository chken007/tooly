import React, { useState, useEffect, useCallback } from 'react';

interface TimezoneInfo {
  name: string;
  timezone: string;
  label: string;
  location: string;
}

const TIMEZONES: TimezoneInfo[] = [
  { name: 'UTC', timezone: 'UTC', label: 'Coordinated Universal Time', location: 'Universal' },
  { name: 'PST/PDT', timezone: 'America/Los_Angeles', label: 'Pacific Time', location: 'US West Coast (LA, SF, Seattle)' },
  { name: 'EST/EDT', timezone: 'America/New_York', label: 'Eastern Time', location: 'US East Coast (NYC, DC, Boston)' },
  { name: 'CST', timezone: 'Asia/Shanghai', label: 'China Standard Time', location: 'Beijing Time (China, HK, Taiwan)' },
  { name: 'IST', timezone: 'Asia/Kolkata', label: 'India Standard Time', location: 'India (Delhi, Mumbai)' },
  { name: 'JST', timezone: 'Asia/Tokyo', label: 'Japan Standard Time', location: 'Japan (Tokyo, Osaka)' },
  { name: 'SGT', timezone: 'Asia/Singapore', label: 'Singapore Time', location: 'Singapore' },
  { name: 'GMT', timezone: 'Europe/London', label: 'Greenwich Mean Time', location: 'UK (London)' },
  { name: 'CET', timezone: 'Europe/Paris', label: 'Central European Time', location: 'Central Europe (Paris, Berlin, Rome)' },
  { name: 'AEDT/AEST', timezone: 'Australia/Sydney', label: 'Australian Eastern Time', location: 'Australia (Sydney, Melbourne)' },
];

const TimeConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [conversions, setConversions] = useState<{ [key: string]: string }>({});
  const [copyFeedback, setCopyFeedback] = useState<string>('');
  const [selectedTimezones, setSelectedTimezones] = useState<string[]>(['UTC', 'PST/PDT']);

  const detectAndConvertEpoch = useCallback((epochStr: string) => {
    if (!epochStr.trim()) {
      setConversions({});
      return;
    }

    // Remove non-numeric characters except dots and spaces
    const cleanInput = epochStr.replace(/[^\d.\s-]/g, '');
    const numbers = cleanInput.split(/\s+/).filter(n => n.length > 0);
    
    const results: { [key: string]: string } = {};

    numbers.forEach((numStr, index) => {
      const num = parseFloat(numStr);
      if (isNaN(num)) return;

      let date: Date;
      const prefix = numbers.length > 1 ? `[${index + 1}] ` : '';

      // Auto-detect if it's seconds or milliseconds
      // If number is less than year 2000 in seconds (946684800), treat as seconds
      // If number is greater than year 2100 in milliseconds (4102444800000), treat as seconds
      if (num < 946684800 || num > 4102444800000) {
        date = new Date(num * 1000); // Treat as seconds
      } else if (num > 9999999999) {
        date = new Date(num); // Treat as milliseconds
      } else {
        date = new Date(num * 1000); // Treat as seconds
      }

      if (isNaN(date.getTime())) {
        selectedTimezones.forEach(tzName => {
          results[`${prefix}${tzName}`] = 'Invalid timestamp';
        });
        return;
      }

      selectedTimezones.forEach(tzName => {
        const tz = TIMEZONES.find(t => t.name === tzName);
        if (!tz) return;
        
        try {
          const formatted = date.toLocaleString('en-US', {
            timeZone: tz.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          });
          results[`${prefix}${tzName}`] = formatted;
        } catch (error) {
          results[`${prefix}${tzName}`] = 'Error converting timezone';
        }
      });
    });

    setConversions(results);
  }, [selectedTimezones]);

  useEffect(() => {
    detectAndConvertEpoch(input);
  }, [input, detectAndConvertEpoch]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`✓ ${label} copied!`);
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopyFeedback('Copy failed');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const handleClear = () => {
    setInput('');
    setConversions({});
  };

  const getCurrentEpoch = () => {
    const now = Date.now();
    setInput(now.toString());
  };

  const toggleTimezone = (timezoneName: string) => {
    setSelectedTimezones(prev => {
      if (prev.includes(timezoneName)) {
        return prev.filter(tz => tz !== timezoneName);
      } else {
        return [...prev, timezoneName];
      }
    });
  };

  const getLineCount = () => {
    return Math.max(1, input.split('\n').length);
  };

  const renderLineNumbers = () => {
    const lineCount = getLineCount();
    return Array.from({ length: lineCount }, (_, i) => (
      <div key={i} className="text-xs text-stone-400 text-right py-0.5 h-6 leading-6">
        {i + 1}
      </div>
    ));
  };

  const getTimezoneColor = (tzName: string) => {
    switch (tzName) {
      case 'PST/PDT': return { text: 'text-blue-600', bg: 'bg-blue-50', circle: 'bg-blue-100 text-blue-700' };
      case 'UTC': return { text: 'text-green-600', bg: 'bg-green-50', circle: 'bg-green-100 text-green-700' };
      case 'IST': return { text: 'text-purple-600', bg: 'bg-purple-50', circle: 'bg-purple-100 text-purple-700' };
      case 'EST/EDT': return { text: 'text-orange-600', bg: 'bg-orange-50', circle: 'bg-orange-100 text-orange-700' };
      case 'CST': return { text: 'text-red-600', bg: 'bg-red-50', circle: 'bg-red-100 text-red-700' };
      case 'JST': return { text: 'text-pink-600', bg: 'bg-pink-50', circle: 'bg-pink-100 text-pink-700' };
      case 'GMT': return { text: 'text-indigo-600', bg: 'bg-indigo-50', circle: 'bg-indigo-100 text-indigo-700' };
      case 'CET': return { text: 'text-teal-600', bg: 'bg-teal-50', circle: 'bg-teal-100 text-teal-700' };
      default: return { text: 'text-stone-600', bg: 'bg-stone-50', circle: 'bg-stone-100 text-stone-700' };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-900 mb-2 tracking-tight">Time Converter</h2>
        <p className="text-stone-500 text-sm">
          Convert epoch timestamps to various timezones. Supports both seconds and milliseconds format.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-stone-700">
              Epoch Timestamp
            </label>
            <div className="flex gap-2">
              <button
                onClick={getCurrentEpoch}
                className="px-3 py-1.5 text-sm font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
              >
                Now
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="flex border border-stone-300 rounded-lg overflow-hidden">
            <div className="w-10 bg-stone-50 border-r border-stone-200 p-2 font-mono text-sm">
              {renderLineNumbers()}
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter epoch timestamp(s)...
Examples:
1640995200 (seconds)
1640995200000 (milliseconds)

Multiple timestamps (prefer new lines):
1640995200
1641081600"
              className="flex-1 h-[480px] p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-orange-400 focus:border-transparent border-none outline-none"
              style={{ lineHeight: '1.5' }}
            />
          </div>
          
          <ul className="text-xs text-stone-500 space-y-1 list-disc list-inside pl-1">
            <li className="pl-1">Automatically detects seconds vs milliseconds format</li>
            <li className="pl-1">Supports multiple timestamps separated by new lines or spaces (prefer new lines for better readability)</li>
            <li className="pl-1">Non-numeric characters are automatically filtered</li>
          </ul>
        </div>

        {/* Output Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-stone-700">
              Converted Times
            </label>
            {copyFeedback && (
              <span className="text-xs text-green-600 font-medium">
                {copyFeedback}
              </span>
            )}
          </div>

          {/* Timezone Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Select Timezones
            </label>
            <div className="flex flex-wrap gap-2">
              {TIMEZONES.map((tz) => (
                <button
                  key={tz.name}
                  onClick={() => toggleTimezone(tz.name)}
                  title={`${tz.label} - ${tz.location}`}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                    selectedTimezones.includes(tz.name)
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {tz.name}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px] overflow-y-auto space-y-2 p-3 bg-stone-50 rounded-lg border">
            {Object.keys(conversions).length === 0 && !input.trim() && (
              <div className="text-stone-500 text-sm italic">
                Enter an epoch timestamp to see conversions...
              </div>
            )}

            {selectedTimezones.length === 0 && input.trim() && (
              <div className="text-stone-500 text-sm italic">
                Select at least one timezone to see conversions...
              </div>
            )}

            {Object.entries(conversions).map(([timezone, time]) => {
              const isError = time.includes('Invalid') || time.includes('Error');
              const timezoneInfo = TIMEZONES.find(tz => timezone.includes(tz.name));
              
              // Extract timestamp number from prefix [1], [2], etc.
              const prefixMatch = timezone.match(/^\[(\d+)\]/);
              const timestampNumber = prefixMatch ? prefixMatch[1] : '1';
              const cleanTimezone = timezone.replace(/^\[\d+\]\s*/, '');
              
              const colors = getTimezoneColor(cleanTimezone);
              
              return (
                <div
                  key={timezone}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border hover:shadow-sm transition-shadow group"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-5 h-5 ${colors.circle} rounded-full flex items-center justify-center text-xs font-medium`}>
                      {timestampNumber}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium text-xs px-2 py-0.5 rounded-md ${colors.text} ${colors.bg}`}>
                          {cleanTimezone}
                        </span>
                        {timezoneInfo && (
                          <span className="text-xs text-stone-500">
                            ({timezoneInfo.label})
                          </span>
                        )}
                      </div>
                      <div className={`font-mono text-xs ${isError ? 'text-red-600' : 'text-stone-700'}`}>
                        {time}
                      </div>
                    </div>
                  </div>
                  
                  {!isError && (
                    <button
                      onClick={() => handleCopy(time, timezone)}
                      className="opacity-0 group-hover:opacity-100 ml-2 px-2 py-1 text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-all"
                      title={`Copy ${timezone} time`}
                    >
                      Copy
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeConverter; 