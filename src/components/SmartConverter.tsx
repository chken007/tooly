import React, { useState, useEffect, useCallback, useRef } from 'react';

type EncodingType = 'base64' | 'url' | 'jwt' | 'hex' | 'unicode';

interface SmartConverterProps {
  state: {
    leftText: string;
    rightText: string;
    encodingType: EncodingType;
    isHighlightMode: boolean;
    isSorted: boolean;
    isBeautified: boolean;
  };
  setState: React.Dispatch<React.SetStateAction<{
    leftText: string;
    rightText: string;
    encodingType: EncodingType;
    isHighlightMode: boolean;
    isSorted: boolean;
    isBeautified: boolean;
  }>>;
}

const SmartConverter: React.FC<SmartConverterProps> = ({ state, setState }) => {
  // Destructure state from props
  const { leftText, rightText, encodingType, isHighlightMode, isSorted, isBeautified } = state;
  
  // Helper functions to update specific parts of state
  const setLeftText = (value: string) => setState(prev => ({ ...prev, leftText: value }));
  const setRightText = (value: string) => setState(prev => ({ ...prev, rightText: value }));
  const setEncodingType = (value: EncodingType) => setState(prev => ({ ...prev, encodingType: value }));
  const setIsHighlightMode = (value: boolean) => setState(prev => ({ ...prev, isHighlightMode: value }));
  const setIsSorted = (value: boolean) => setState(prev => ({ ...prev, isSorted: value }));
  const setIsBeautified = (value: boolean) => setState(prev => ({ ...prev, isBeautified: value }));
  
  // Local state (not persisted across tabs)
  const [error, setError] = useState('');
  const [lastModified, setLastModified] = useState<'left' | 'right' | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<'left' | 'right' | null>(null);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());
  const highlightRef = useRef<HTMLDivElement>(null);

  // Robust Base64 decoder that can handle partial invalid strings
  const robustBase64Decode = useCallback((input: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let buffer = 0;
    let bitsCollected = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '=') break; // Stop at padding
      
      const charIndex = chars.indexOf(char);
      if (charIndex === -1) continue; // Skip invalid characters
      
      buffer = (buffer << 6) | charIndex;
      bitsCollected += 6;
      
      if (bitsCollected >= 8) {
        bitsCollected -= 8;
        const byte = (buffer >> bitsCollected) & 0xFF;
        result += String.fromCharCode(byte);
      }
    }

    try {
      return decodeURIComponent(escape(result));
    } catch {
      return result; // Return raw result if UTF-8 decoding fails
    }
  }, []);

  // Base64 functions - Robust implementation
  const encodeBase64 = useCallback((text: string): string => {
    try {
      return btoa(unescape(encodeURIComponent(text)));
    } catch (error) {
      throw new Error('Failed to encode as Base64');
    }
  }, []);

  const decodeBase64 = useCallback((text: string): string => {
    try {
      // Clean the input - remove whitespace and non-base64 characters
      let cleanInput = text.replace(/[^A-Za-z0-9+/]/g, '');
      
      // Add padding if missing
      while (cleanInput.length % 4) {
        cleanInput += '=';
      }

      // Try standard atob first
      try {
        return decodeURIComponent(escape(atob(cleanInput)));
      } catch {
        // If atob fails, try manual decoding for partial recovery
        return robustBase64Decode(cleanInput);
      }
    } catch (error) {
      throw new Error('Invalid Base64 string');
    }
  }, [robustBase64Decode]);

  // URL encoding functions
  const encodeURL = useCallback((text: string): string => {
    try {
      return encodeURIComponent(text);
    } catch (error) {
      throw new Error('Failed to encode as URL');
    }
  }, []);

  const decodeURL = useCallback((text: string): string => {
    try {
      return decodeURIComponent(text);
    } catch (error) {
      throw new Error('Invalid URL encoded string');
    }
  }, []);

  // JWT functions
  const decodeJWT = useCallback((token: string): string => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      
      const header = JSON.parse(decodeBase64(parts[0]));
      const payload = JSON.parse(decodeBase64(parts[1]));
      
      return JSON.stringify({
        header,
        payload,
        signature: parts[2]
      });
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }, [decodeBase64]);

  // Hex/ASCII functions
  const encodeHex = useCallback((text: string): string => {
    try {
      return text.split('').map(char => 
        char.charCodeAt(0).toString(16).padStart(2, '0')
      ).join(' ');
    } catch (error) {
      throw new Error('Failed to encode as Hex');
    }
  }, []);

  const decodeHex = useCallback((hex: string): string => {
    try {
      const cleanHex = hex.replace(/\s+/g, '');
      if (cleanHex.length % 2 !== 0) {
        throw new Error('Invalid hex string length');
      }
      
      let result = '';
      for (let i = 0; i < cleanHex.length; i += 2) {
        const hexPair = cleanHex.substr(i, 2);
        const charCode = parseInt(hexPair, 16);
        if (isNaN(charCode)) {
          throw new Error('Invalid hex character');
        }
        result += String.fromCharCode(charCode);
    }
      return result;
    } catch (error) {
      throw new Error('Invalid hex string');
    }
  }, []);

  // Unicode Escape functions
  const encodeUnicode = useCallback((text: string): string => {
    try {
      return text.split('').map(char => {
        const code = char.charCodeAt(0);
        if (code > 127) {
          return '\\u' + code.toString(16).padStart(4, '0');
        }
        return char;
      }).join('');
    } catch (error) {
      throw new Error('Failed to encode as Unicode');
    }
  }, []);

  const decodeUnicode = useCallback((text: string): string => {
    try {
      return text.replace(/\\u([0-9a-fA-F]{4})/g, (_match, code) => {
        return String.fromCharCode(parseInt(code, 16));
      });
    } catch (error) {
      throw new Error('Invalid Unicode escape string');
    }
  }, []);

  // JSON Sort function - recursively sorts all object keys (case-sensitive, standard behavior)
  const sortJSON = useCallback((obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    // Handle arrays - recursively sort contents
    if (Array.isArray(obj)) {
      return obj.map(item => sortJSON(item));
    }

    // Handle objects - sort keys alphabetically (case-sensitive like standard libraries)
    if (typeof obj === 'object') {
      const sortedObj: any = {};
      const keys = Object.keys(obj).sort();
      
      keys.forEach(key => {
        sortedObj[key] = sortJSON(obj[key]);
      });
      
      return sortedObj;
    }

    // Primitive values - return as is
    return obj;
  }, []);

  const handleSort = useCallback(() => {
    if (!rightText.trim()) {
      setError('No content to sort');
      return;
    }

    try {
      const parsed = JSON.parse(rightText.trim());
      const sorted = sortJSON(parsed);
      const formatted = JSON.stringify(sorted, null, 2);
      
      setRightText(formatted);
      setError('');
      setIsSorted(true);
      setIsBeautified(true);
      setIsHighlightMode(false); // Exit highlight mode
      setLastModified('right');
    } catch (err) {
      setError('Cannot sort: Invalid JSON format');
    }
  }, [rightText, sortJSON]);

  const handleBeautify = useCallback(() => {
    if (!rightText.trim()) {
      setError('No content to beautify');
      return;
    }

    try {
      const trimmed = rightText.trim();
      let beautified = trimmed;
      let needsFormatting = true;
      
      // Check if content is already properly beautified JSON
      const isAlreadyBeautifiedJSON = (() => {
        try {
          const parsed = JSON.parse(trimmed);
          const standardFormat = JSON.stringify(parsed, null, 2);
          // Compare with standard format - must match exactly
          return trimmed === standardFormat;
        } catch {
          return false;
        }
      })();

      if (isAlreadyBeautifiedJSON) {
        // Content is already beautified in standard format
        needsFormatting = false;
        beautified = trimmed;
      } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        // Enhanced robust JSON beautification
        // Try standard JSON first
        try {
          const parsed = JSON.parse(trimmed);
          beautified = JSON.stringify(parsed, null, 2);
        } catch {
          // Apply robust fixes for common JSON issues
          let fixed = trimmed;
          
          // 1. Add missing quotes around keys
          fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
          
          // 2. Fix single quotes to double quotes
          fixed = fixed.replace(/'/g, '"');
          
          // 3. Remove trailing commas
          fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
          
          // 4. Try to fix incomplete objects/arrays
          let openBraces = (fixed.match(/{/g) || []).length;
          let closeBraces = (fixed.match(/}/g) || []).length;
          let openBrackets = (fixed.match(/\[/g) || []).length;
          let closeBrackets = (fixed.match(/\]/g) || []).length;
          
          // Add missing closing braces/brackets
          while (openBraces > closeBraces) {
            fixed += '}';
            closeBraces++;
          }
          while (openBrackets > closeBrackets) {
            fixed += ']';
            closeBrackets++;
          }
          
          // Try to parse the fixed version
          try {
            const parsed = JSON.parse(fixed);
            beautified = JSON.stringify(parsed, null, 2);
          } catch {
            // If still fails, try partial line-by-line processing
            const lines = trimmed.split('\n');
            const processedLines: string[] = [];
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              
              // Try to parse individual lines as JSON
              try {
                const parsed = JSON.parse(trimmedLine);
                processedLines.push(JSON.stringify(parsed, null, 2));
              } catch {
                // Try to extract and beautify JSON-like patterns
                const jsonPattern = /\{[^{}]*\}/g;
                const matches = trimmedLine.match(jsonPattern);
                
                if (matches) {
                  let processedLine = trimmedLine;
                  for (const match of matches) {
                    try {
                      const parsed = JSON.parse(match);
                      const beautifiedMatch = JSON.stringify(parsed, null, 2);
                      processedLine = processedLine.replace(match, beautifiedMatch);
                    } catch {
                      // Keep original if can't parse
                    }
                  }
                  processedLines.push(processedLine);
                } else {
                  processedLines.push(line); // Keep original line
                }
              }
            }
            
            beautified = processedLines.join('\n');
          }
        }
      } else {
        // Try standard JSON parsing for non-obvious JSON
        try {
          const parsed = JSON.parse(trimmed);
          beautified = JSON.stringify(parsed, null, 2);
        } catch {
          // Not JSON, keep original
          beautified = trimmed;
        }
      }
      
      // Always update state when Beautify is clicked
      if (needsFormatting && beautified !== trimmed) {
        // Content was formatted
        setRightText(beautified);
        setError('');
        setIsBeautified(true);
        setIsHighlightMode(false);
        setLastModified('right');
      } else if (!needsFormatting) {
        // Content was already beautified, just update the button state
        setError('');
        setIsBeautified(true);
        setIsHighlightMode(false);
      } else {
        // Could not beautify
        setError('Content could not be beautified');
      }
      
    } catch (err) {
      setError('Failed to beautify content: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [rightText]);

  // Toggle collapse/expand for a path and its direct children
  const toggleCollapse = useCallback((path: string, obj: any) => {
    setCollapsedPaths(prev => {
      const newSet = new Set(prev);
      const isCurrentlyCollapsed = newSet.has(path);
      
      if (isCurrentlyCollapsed) {
        // Expanding: remove current path and expand direct children
        newSet.delete(path);
        
        // Also expand all direct children (first level only)
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              const childPath = path === '' ? `[${index}]` : `${path}[${index}]`;
              newSet.delete(childPath);
            }
          });
        } else if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              const childPath = path === '' ? key : `${path}.${key}`;
              newSet.delete(childPath);
            }
          });
        }
      } else {
        // Collapsing: add current path
        newSet.add(path);
      }
      
      return newSet;
    });
  }, []);

  // Render collapsible JSON with syntax highlighting
  const renderCollapsibleJSON = useCallback((obj: any, path: string = '', indentLevel: number = 0): React.ReactElement => {
    
    if (obj === null) {
      return <span className="text-stone-500 italic">null</span>;
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCollapse(path, obj);
            }}
            className="inline-flex items-center justify-center w-4 h-4 mr-1 text-white bg-orange-400 hover:bg-orange-500 rounded-full text-xs font-bold transition-colors"
            style={{ pointerEvents: 'auto' }}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? '+' : '−'}
          </button>
          <span className="text-stone-700 font-semibold">[</span>
          {isCollapsed ? (
            <span className="text-stone-400 text-xs ml-1">{obj.length} items</span>
          ) : (
            <>
              {obj.map((item, index) => (
                <div key={index} className="ml-5">
                  {renderCollapsibleJSON(item, path === '' ? `[${index}]` : `${path}[${index}]`, indentLevel + 1)}
                  {index < obj.length - 1 && <span className="text-stone-500">,</span>}
                </div>
              ))}
            </>
          )}
          {isCollapsed && <span className="text-stone-700 font-semibold">]</span>}
          {!isCollapsed && <span className="text-stone-700 font-semibold">]</span>}
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCollapse(path, obj);
            }}
            className="inline-flex items-center justify-center w-4 h-4 mr-1 text-white bg-orange-400 hover:bg-orange-500 rounded-full text-xs font-bold transition-colors"
            style={{ pointerEvents: 'auto' }}
            title={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? '+' : '−'}
          </button>
          <span className="text-stone-700 font-semibold">{"{"}</span>
          {isCollapsed ? (
            <span className="text-stone-400 text-xs ml-1">{keys.length} keys</span>
          ) : (
            <>
              {keys.map((key, index) => (
                <div key={key} className="ml-5">
                  <span className="text-sky-600 font-medium">"{key}"</span>
                  <span className="text-stone-500">: </span>
                  {renderCollapsibleJSON(obj[key], path === '' ? key : `${path}.${key}`, indentLevel + 1)}
                  {index < keys.length - 1 && <span className="text-stone-500">,</span>}
                </div>
              ))}
            </>
          )}
          {isCollapsed && <span className="text-stone-700 font-semibold">{"}"}</span>}
          {!isCollapsed && <span className="text-stone-700 font-semibold">{"}"}</span>}
        </span>
      );
    }
    
    return <span>{String(obj)}</span>;
  }, [collapsedPaths, toggleCollapse]);

  // Main JSON renderer with error handling
  const highlightJSON = useCallback((jsonString: string): React.ReactElement => {
    if (!jsonString.trim()) {
      return <span className="text-gray-400">No content</span>;
    }

    // Check if it's valid JSON first
    let isValidJSON = false;
    let parsedData: any = null;
    
    try {
      parsedData = JSON.parse(jsonString);
      isValidJSON = true;
    } catch {
      isValidJSON = false;
    }

    if (isValidJSON && parsedData && (typeof parsedData === 'object')) {
      // Valid JSON - render with collapsible structure
      return (
        <div className="whitespace-pre-wrap font-mono text-sm">
          {renderCollapsibleJSON(parsedData)}
        </div>
      );
    } else {
      // Invalid JSON - fall back to simple syntax highlighting
      const lines = jsonString.split('\n');
      const highlightedLines = lines.map((line, index) => {
        let highlighted = line
          // Highlight quoted strings (both valid and invalid)
          .replace(/"([^"]*)":/g, '<span class="text-orange-500 font-semibold">"$1"</span>:')
          .replace(/:\s*"([^"]*)"/g, ': <span class="text-green-600">"$1"</span>')
          // Highlight unquoted keys (common error) with warning color
          .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1<span class="text-yellow-600 font-semibold bg-yellow-100 px-1 rounded">$2</span>:')
          // Highlight single quotes (common error) with warning color
          .replace(/'([^']*)'/g, '<span class="text-yellow-600 bg-yellow-100 px-1 rounded">\'$1\'</span>')
          // Highlight boolean and null values
          .replace(/:\s*(true|false)/g, ': <span class="text-purple-600 font-medium">$1</span>')
          .replace(/:\s*(null)/g, ': <span class="text-stone-500 italic">$1</span>')
          // Highlight numbers (avoid matching time formats)
          .replace(/:\s*(\d+(?:\.\d+)?)\s*([,}\]])/g, ': <span class="text-orange-600 font-medium">$1</span>$2')
          // Highlight structural characters
          .replace(/([{}[\],])/g, '<span class="text-gray-800 font-bold">$1</span>')
          // Highlight trailing commas (common error) with error color
          .replace(/,(\s*[}\]])/g, '<span class="text-red-600 bg-red-100 px-1 rounded">,</span>$1');

        return (
          <div key={index} dangerouslySetInnerHTML={{ __html: highlighted }} />
        );
      });

      return (
        <div className="whitespace-pre-wrap">
          <div className="text-red-600 text-sm mb-2 bg-red-50 p-2 rounded border-l-4 border-red-400">
            ⚠️ Invalid JSON detected. Click Beautify to fix common errors.
          </div>
          {highlightedLines}
        </div>
      );
    }
  }, [renderCollapsibleJSON]);

  // Toggle Highlight mode
  useEffect(() => {
    if (lastModified === 'left' && leftText.trim()) {
      // Decode from left (encoded) to right (plain)
    try {
      setError('');
        let result = '';
        
        if (encodingType === 'base64') {
          result = decodeBase64(leftText);
        } else if (encodingType === 'url') {
          result = decodeURL(leftText);
        } else if (encodingType === 'jwt') {
          result = decodeJWT(leftText);
        } else if (encodingType === 'hex') {
          result = decodeHex(leftText);
        } else if (encodingType === 'unicode') {
          result = decodeUnicode(leftText);
        }
        
        setRightText(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Decode failed');
        setRightText('');
      }
    } else if (lastModified === 'right' && rightText.trim()) {
      // Encode from right (plain) to left (encoded)
      try {
        setError('');
        let result = '';
        
        if (encodingType === 'base64') {
          result = encodeBase64(rightText);
        } else if (encodingType === 'url') {
          result = encodeURL(rightText);
        } else if (encodingType === 'jwt') {
          // JWT is decode-only, can't encode plain text to JWT
          throw new Error('JWT encoding not supported - JWT is decode-only');
        } else if (encodingType === 'hex') {
          result = encodeHex(rightText);
        } else if (encodingType === 'unicode') {
          result = encodeUnicode(rightText);
        }
        
        setLeftText(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Encode failed');
        setLeftText('');
      }
    } else if (lastModified === 'left' && !leftText.trim()) {
      setRightText('');
      setError('');
    } else if (lastModified === 'right' && !rightText.trim()) {
      setLeftText('');
      setError('');
    }
  }, [
    leftText, 
    rightText, 
    encodingType, 
    lastModified, 
    encodeBase64, 
    decodeBase64, 
    decodeJWT, 
    encodeURL, 
    decodeURL, 
    encodeHex, 
    decodeHex, 
    encodeUnicode, 
    decodeUnicode
  ]);

  const handleLeftTextChange = (value: string) => {
    setLeftText(value);
    setLastModified('left');
  };

  const handleRightTextChange = (value: string) => {
    setRightText(value);
    setLastModified('right');
    // Reset all states when content changes
    if (isHighlightMode) {
      setIsHighlightMode(false);
    }
    if (isSorted) {
      setIsSorted(false);
    }
    if (isBeautified) {
      setIsBeautified(false);
    }
  };

  const handleCopyLeft = async () => {
    if (!leftText) return;
    try {
      await navigator.clipboard.writeText(leftText);
      setCopyFeedback('left');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleCopyRight = async () => {
    if (!rightText) return;
    try {
      await navigator.clipboard.writeText(rightText);
      setCopyFeedback('right');
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleClearLeft = () => {
    setLeftText('');
    setLastModified('left');
  };

  const handleClearRight = () => {
    setRightText('');
    setLeftText(''); // Also clear left text
    setError('');
    setLastModified('right');
    setIsHighlightMode(false);
    setIsSorted(false);
    setIsBeautified(false);
  };

  const getEncodingLabel = () => {
    switch (encodingType) {
      case 'base64': return 'Base64';
      case 'url': return 'URL Encoded';
      case 'jwt': return 'JWT Token';
      case 'hex': return 'Hex';
      case 'unicode': return 'Unicode Escaped';
      default: return 'Encoded';
    }
  };

  const getPlaceholder = () => {
    switch (encodingType) {
      case 'base64': return 'Enter Base64 text...';
      case 'url': return 'Enter URL encoded text...';
      case 'jwt': return 'Enter JWT token...';
      case 'hex': return 'Enter hex string (e.g., 48 65 6c 6c 6f)...';
      case 'unicode': return 'Enter Unicode escaped text (e.g., \\u0048\\u0065\\u006c\\u006c\\u006f)...';
      default: return 'Enter encoded text...';
    }
  };

  const getBeautifyButtonText = () => {
    if (isBeautified) {
      return '✨ Beautified';
    }
    return 'Beautify';
  };

  // Toggle Highlight mode
  const handleHighlight = useCallback(() => {
    if (!rightText.trim()) {
      setError('No content to highlight');
      return;
    }

    // Check if content is valid JSON
    try {
      JSON.parse(rightText.trim());
      setIsHighlightMode(!isHighlightMode);
      setError('');
    } catch {
      setError('Cannot highlight: Invalid JSON format');
    }
  }, [rightText, isHighlightMode]);

  // Convert based on which panel was last modified

  // Expand all JSON nodes
  const expandAll = useCallback(() => {
    setCollapsedPaths(new Set());
  }, []);

  // Collapse all JSON nodes
  const collapseAll = useCallback(() => {
    if (!rightText.trim()) return;
    
    try {
      const parsedData = JSON.parse(rightText);
      const allPaths = new Set<string>();
      
      const collectPaths = (obj: any, path: string = '') => {
        if (Array.isArray(obj)) {
          if (obj.length > 0) {
            allPaths.add(path);
            obj.forEach((item, index) => {
              if (typeof item === 'object' && item !== null) {
                collectPaths(item, path === '' ? `[${index}]` : `${path}[${index}]`);
              }
            });
          }
        } else if (typeof obj === 'object' && obj !== null) {
          const keys = Object.keys(obj);
          if (keys.length > 0) {
            allPaths.add(path);
            keys.forEach(key => {
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                collectPaths(obj[key], path === '' ? key : `${path}.${key}`);
              }
            });
          }
        }
      };
      
      collectPaths(parsedData);
      setCollapsedPaths(allPaths);
    } catch {
      // Not valid JSON, do nothing
    }
  }, [rightText]);

  // Check if JSON is valid and has collapsible content
  const hasCollapsibleContent = useCallback(() => {
    if (!rightText.trim()) return false;
    try {
      const parsedData = JSON.parse(rightText);
      return typeof parsedData === 'object' && parsedData !== null;
    } catch {
      return false;
    }
  }, [rightText]);

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
      <h2 className="text-xl font-semibold text-stone-900 mb-6 tracking-tight">Smart Converter</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel - Encoded Text */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="encoded-text" className="block text-sm font-medium text-stone-700">
              {getEncodingLabel()}
        </label>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyLeft}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
                disabled={!leftText}
              >
                {copyFeedback === 'left' ? '✓ Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleClearLeft}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
              >
                Clear
              </button>
            </div>
          </div>
        <textarea
            id="encoded-text"
            value={leftText}
            onChange={(e) => handleLeftTextChange(e.target.value)}
            className="w-full h-[900px] p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 resize-none font-mono text-sm transition-all duration-200"
            placeholder={getPlaceholder()}
        />
      </div>

        {/* Middle Panel - Controls */}
        <div className="lg:col-span-2 flex flex-col items-center justify-start pt-8">
          {/* Encoding Type Selector */}
          <div className="flex flex-col items-center space-y-2 w-full">
            <span className="text-sm font-medium text-stone-700 mb-2">Encoding Type</span>
            <div className="flex flex-col space-y-1 w-full">
              <button
                onClick={() => setEncodingType('base64')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                  encodingType === 'base64'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Base64
              </button>
        <button
                onClick={() => setEncodingType('url')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                  encodingType === 'url'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
        >
                URL Encode
        </button>
        <button
                onClick={() => setEncodingType('jwt')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                  encodingType === 'jwt'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                JWT Decode
        </button>
        <button
                onClick={() => setEncodingType('hex')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                  encodingType === 'hex'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Hex / ASCII
        </button>
        <button
                onClick={() => setEncodingType('unicode')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors w-full ${
                  encodingType === 'unicode'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                Unicode Escape
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Plain Text */}
        <div className="lg:col-span-5">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="plain-text" className="block text-sm font-medium text-stone-700">
              {encodingType === 'jwt' ? 'Decoded JWT' : 'Plain Text'}
            </label>
            <div className="flex space-x-2">
              {/* Show Highlight/Edit button */}
              <button
                onClick={handleHighlight}
                className={`text-sm transition-colors px-3 py-1 rounded ${
                  isHighlightMode 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100'
                }`}
                disabled={!rightText}
                title={isHighlightMode ? "Exit highlight mode to edit" : "Enable syntax highlighting"}
              >
                {isHighlightMode ? '✏️ Edit' : 'Highlight'}
              </button>
              
              {/* Show +All/-All only in Highlight mode */}
              {isHighlightMode && hasCollapsibleContent() && (
                <>
                  <button
                    onClick={collapseAll}
                    className="text-xs text-orange-500 hover:text-white hover:bg-orange-500 transition-all duration-200 px-3 py-1.5 rounded-full border border-orange-300 hover:border-orange-500 font-medium"
                    title="Collapse all JSON nodes"
                  >
                    − All
                  </button>
                  <button
                    onClick={expandAll}
                    className="text-xs text-orange-500 hover:text-white hover:bg-orange-500 transition-all duration-200 px-3 py-1.5 rounded-full border border-orange-300 hover:border-orange-500 font-medium"
                    title="Expand all JSON nodes"
                  >
                    + All
                  </button>
                </>
              )}
              
              {/* Show Sort/Beautify only when NOT in Highlight mode */}
              {!isHighlightMode && (
                <>
                  <button
                    onClick={handleSort}
                    className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
                    disabled={!rightText}
                    title="Sort JSON keys alphabetically"
                  >
                    {isSorted ? '✨ Sorted' : 'Sort'}
                  </button>
                  <button
                    onClick={handleBeautify}
                    className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
                    disabled={!rightText}
                  >
                    {getBeautifyButtonText()}
              </button>
                </>
              )}
              
              <button
                onClick={handleCopyRight}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
                disabled={!rightText}
        >
                {copyFeedback === 'right' ? '✓ Copied!' : 'Copy'}
        </button>
        <button
                onClick={handleClearRight}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100"
        >
          Clear
        </button>
      </div>
          </div>

          {/* Conditional rendering: Highlight mode OR Editable textarea */}
          <div className="relative">
            {isHighlightMode ? (
              /* Highlight Mode: Read-only, collapsible, syntax highlighted */
              <div 
                className="w-full h-[900px] p-4 border border-stone-200 rounded-xl font-mono text-sm overflow-auto bg-white"
                ref={highlightRef}
              >
                {highlightJSON(rightText)}
              </div>
            ) : (
              /* Edit Mode: Editable textarea */
              <textarea
                id="plain-text"
                value={rightText}
                onChange={(e) => handleRightTextChange(e.target.value)}
                className="w-full h-[900px] p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 resize-none font-mono text-sm transition-all duration-200 bg-white text-stone-900"
                placeholder={encodingType === 'jwt' ? 'Decoded JWT will appear here...' : 'Plain text will appear here...'}
                readOnly={encodingType === 'jwt'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Info */}
      <div className="mt-6 text-sm text-stone-600 text-center font-medium bg-orange-50 p-3 rounded-lg border border-orange-100">
        {encodingType === 'jwt' 
          ? '💡 JWT tokens can only be decoded. Enter a JWT token on the left to see its decoded content.'
          : '💡 Type in either panel to automatically convert. Both panels are editable.'
        }
      </div>
    </div>
  );
};

export default SmartConverter; 