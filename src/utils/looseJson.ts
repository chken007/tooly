export function beautifyLooseJson(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('No content to beautify');

  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      throw new Error('Content is not JSON');
    }
  }

  let repaired = trimmed
    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
    .replace(/'/g, '"')
    .replace(/,(\s*[}\]])/g, '$1');

  const openBraces = (repaired.match(/{/g) ?? []).length;
  const closeBraces = (repaired.match(/}/g) ?? []).length;
  const openBrackets = (repaired.match(/\[/g) ?? []).length;
  const closeBrackets = (repaired.match(/\]/g) ?? []).length;

  repaired += '}'.repeat(Math.max(0, openBraces - closeBraces));
  repaired += ']'.repeat(Math.max(0, openBrackets - closeBrackets));

  try {
    return JSON.stringify(JSON.parse(repaired), null, 2);
  } catch {
    throw new Error('Content could not be repaired as JSON');
  }
}

