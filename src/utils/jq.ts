export function applyJqFilter(data: unknown, filter: string): unknown {
  return filter
    .split('|')
    .map(part => part.trim())
    .filter(part => part && part !== '.')
    .reduce((result, expression) => evaluateJqExpression(result, expression), data);
}

export function evaluateJqExpression(data: unknown, expression: string): unknown {
  if (data === null || data === undefined) {
    throw new Error('Cannot filter null/undefined');
  }

  if (expression === 'keys') {
    if (typeof data !== 'object') throw new Error('Cannot get keys of non-object');
    return Array.isArray(data) ? data.map((_, index) => index) : Object.keys(data);
  }

  if (expression === 'length') {
    if (Array.isArray(data) || typeof data === 'string') return data.length;
    if (typeof data === 'object') return Object.keys(data).length;
    throw new Error('Cannot get length');
  }

  if (expression === 'type') {
    if (data === null) return 'null';
    if (Array.isArray(data)) return 'array';
    return typeof data;
  }

  if (expression === '.[]') {
    if (!Array.isArray(data)) throw new Error('Cannot iterate non-array');
    return data;
  }

  if (!expression.startsWith('.')) {
    throw new Error(`Invalid expression: ${expression}`);
  }

  return evaluateTokens(data, tokenizeJqPath(expression.slice(1)));
}

function tokenizeJqPath(path: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let index = 0;

  while (index < path.length) {
    const character = path[index];
    if (character === '.') {
      if (current) tokens.push(current);
      current = '';
      index += 1;
      continue;
    }

    if (character === '[') {
      if (current) tokens.push(current);
      current = '';
      const closingBracket = path.indexOf(']', index);
      if (closingBracket === -1) throw new Error('Unclosed array selector');
      tokens.push(path.slice(index, closingBracket + 1));
      index = closingBracket + 1;
      continue;
    }

    current += character;
    index += 1;
  }

  if (current) tokens.push(current);
  return tokens;
}

function evaluateTokens(data: unknown, tokens: string[]): unknown {
  let result = data;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (result === null || result === undefined) {
      throw new Error('Cannot access property of null/undefined');
    }

    if (token === '[]') {
      if (!Array.isArray(result)) throw new Error('Cannot iterate non-array');
      const remainingTokens = tokens.slice(index + 1);
      return remainingTokens.length
        ? result.map(item => evaluateTokens(item, remainingTokens))
        : result;
    }

    const indexMatch = token.match(/^\[(\d+)\]$/);
    if (indexMatch) {
      if (!Array.isArray(result)) throw new Error('Cannot index non-array');
      const arrayIndex = Number.parseInt(indexMatch[1], 10);
      if (arrayIndex >= result.length) throw new Error(`Index ${arrayIndex} out of bounds`);
      result = result[arrayIndex];
      continue;
    }

    if (typeof result !== 'object' || Array.isArray(result)) {
      throw new Error(`Cannot access "${token}" on non-object`);
    }

    if (!(token in result)) throw new Error(`Key "${token}" not found`);
    result = (result as Record<string, unknown>)[token];
  }

  return result;
}

