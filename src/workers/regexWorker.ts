import { evaluateRegex } from '../utils/regex';

interface RegexWorkerRequest {
  pattern: string;
  flags: string;
  input: string;
  replacement: string;
}

self.onmessage = (event: MessageEvent<RegexWorkerRequest>) => {
  try {
    const result = evaluateRegex(
      event.data.pattern,
      event.data.flags,
      event.data.input,
      event.data.replacement,
    );
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Regex evaluation failed' });
  }
};

