# Tooly

Simple tools for everyday coding.

Tooly is a free, open-source developer toolbox that runs entirely in the browser. It has no ads, accounts, or server-side processing for the data you paste into its tools.

Try it at [tooly.one](https://www.tooly.one/).

## Features

- **JSON Tools** — Format, search, explore, and filter JSON with a focused jq-like path syntax.
- **Smart Converter** — Encode and decode Base64, Base64URL, URL, JWT, UTF-8 Hex, and Unicode escapes.
- **Diff Master** — Compare text by line or character, including normalized JSON comparison.
- **List Wizard** — Calculate intersections, unions, differences, and symmetric differences.
- **Time Converter** — Convert seconds or milliseconds since the Unix epoch across common time zones.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer

## Development

```bash
git clone https://github.com/chken007/tooly.git
cd tooly
npm ci
npm run dev
```

The development server is available at `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

Run the complete local verification pipeline with:

```bash
npm run check
```

Playwright requires its Chromium build before the first end-to-end test run:

```bash
npx playwright install chromium
```

Pull requests run the same checks in GitHub Actions.

## Supported JSON filters

Tooly intentionally implements a small, browser-native subset of jq syntax rather than bundling the jq runtime.

```text
.data.items[0]
.users[].email
.config.settings.theme
keys
length
type
```

## Project structure

```text
tooly/
├── e2e/                    # Playwright smoke tests
├── public/                 # Static assets and web metadata
├── src/
│   ├── components/         # React tool interfaces
│   ├── utils/              # Pure conversion and formatting logic
│   ├── App.tsx             # Application shell and navigation
│   └── index.tsx           # Browser entry point
├── .github/workflows/      # Continuous integration
├── playwright.config.ts
├── vitest.config.ts
└── vite.config.ts
```

## Technology

- React 19 and TypeScript
- Vite
- Tailwind CSS
- Vitest and Playwright
- ESLint

## Privacy and JWT behavior

Inputs are processed locally in the browser. The JWT tool decodes token segments for inspection; it does not validate signatures or token trust.

## Contributing

Issues and pull requests are welcome. Keep changes focused, add tests for logic changes, and run `npm run check` before opening a pull request.

## License

[MIT](LICENSE)
