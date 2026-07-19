export interface RegexMatch {
  value: string;
  index: number;
  groups: string[];
  namedGroups: Record<string, string>;
}

export interface RegexResult {
  matches: RegexMatch[];
  replacement: string;
  truncated: boolean;
}

const VALID_FLAGS = new Set(['d', 'g', 'i', 'm', 's', 'u', 'v', 'y']);

export function normalizeRegexFlags(flags: string): string {
  const uniqueFlags = [...new Set(flags.split(''))];
  const invalidFlag = uniqueFlags.find(flag => !VALID_FLAGS.has(flag));
  if (invalidFlag) throw new Error(`Unsupported regex flag: ${invalidFlag}`);
  if (uniqueFlags.includes('u') && uniqueFlags.includes('v')) {
    throw new Error('The u and v flags cannot be used together');
  }
  return uniqueFlags.join('');
}

export function evaluateRegex(
  pattern: string,
  flags: string,
  input: string,
  replacement = '',
  maxMatches = 500,
): RegexResult {
  if (!pattern) return { matches: [], replacement: input, truncated: false };

  const normalizedFlags = normalizeRegexFlags(flags);
  const expression = new RegExp(pattern, normalizedFlags);
  const matches: RegexMatch[] = [];
  let match: RegExpExecArray | null;
  let truncated = false;

  while ((match = expression.exec(input)) !== null) {
    matches.push({
      value: match[0],
      index: match.index,
      groups: match.slice(1).map(group => group ?? ''),
      namedGroups: Object.fromEntries(
        Object.entries(match.groups ?? {}).map(([name, value]) => [name, value ?? '']),
      ),
    });

    if (matches.length >= maxMatches) {
      truncated = expression.global && expression.lastIndex < input.length;
      break;
    }

    if (!expression.global && !expression.sticky) break;
    if (match[0] === '') expression.lastIndex += 1;
  }

  return {
    matches,
    replacement: input.replace(new RegExp(pattern, normalizedFlags), replacement),
    truncated,
  };
}

