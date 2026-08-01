# bullion-cli

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A lightweight CLI tool for tracking gold spot prices with historical comparisons across multiple timeframes and currencies. Powered by [bullionapi.dev](https://bullionapi.dev).

## Features

- Real-time spot prices for Gold (XAU)
- Historical comparisons: 1 day, 1 week, 1 month, 1 year
- Multi-currency support (USD, EUR, GBP, and more)
- Color-coded output (green for gains, red for losses)
- Clean table formatting with `cli-table3`
- Modular asset architecture — easy to add new assets

## Prerequisites

- **Node.js 18+** (uses native `fetch`)
- A free API key from [bullionapi.dev](https://bullionapi.dev)

## Installation

Install the package globally:

```bash
npm install --global @paulund/bullion-cli
```

### Local development

```bash
git clone https://github.com/paulund/bullion-cli.git
cd bullion-cli
npm install
npm run build
npm link
bullion --help
```

## API Key

Get a free API key at [https://bullionapi.dev](https://bullionapi.dev), then configure it:

```bash
# Option 1 — Set it in your shell profile
export BULLION_API_KEY=your_key_here

# Option 2 — Create ~/.config/bullion/.env
mkdir -p ~/.config/bullion
echo "BULLION_API_KEY=your_key_here" > ~/.config/bullion/.env
```

## Usage

```bash
# Show Gold in USD (default)
bullion

# Filter by asset
bullion --asset gold

# Choose currency
bullion --currency GBP
bullion -c EUR --asset gold

# Short flags
bullion -a gold -c GBP
bullion -m gold          # --metal is alias for --asset

# Help
bullion --help

# View annual central-bank reserve values (Pro or Enterprise)
bullion reserves
bullion reserves --country GB --start 2020 --end 2025
```

The reserves command reads the cached `GET /v1/central-bank-reserves` endpoint. It accepts optional
`--country`, `--start`, and `--end` filters and returns the latest complete observation for each country when
no year bounds are supplied.

### Central-bank reserves example output

```text
Central-bank reserves (1 country)

United Kingdom (GB / GBR) — 2025
  Gold reserve value: $25,000,000,000.00
  Gold share: 12.50%
  Annual gold value change: +$10,000,000,000.00

Source: World Bank, World Development Indicators
Underlying provider: International Monetary Fund, International Financial Statistics
Source updated: 2026-07-13
Methodology: Annual value changes combine holdings changes, gold-price movement, and revisions and do not measure tonnes bought or sold.
```

Annual value changes are derived valuations. They do not measure tonnes bought or sold.

### Example output

```
Gold (XAU)
  Current (USD): $4527.86
┌─────────┬────────────┬───────────┬──────────┐
│ Period  │ Historical │ Change    │ % Change │
├─────────┼────────────┼───────────┼──────────┤
│ 1 Day   │ $4509.69   │ +$18.18   │ +0.40%   │
│ 1 Week  │ $4566.16   │ -$38.30   │ -0.84%   │
│ 1 Month │ $4709.75   │ -$181.89  │ -3.86%   │
│ 1 Year  │ $3342.47   │ +$1185.39 │ +35.46%  │
└─────────┴────────────┴───────────┴──────────┘
```

## Adding new assets

The modular architecture makes it straightforward to add new asset types:

1. Add the asset to [`src/config.ts`](src/config.ts)
2. Wire it through [`src/prices.ts`](src/prices.ts) (if extra logic is needed)

## Configuration

| Variable          | Description                            |
| ----------------- | -------------------------------------- |
| `BULLION_API_KEY` | Your bullionapi.dev API key (required) |

## Development

```bash
npm install         # install dependencies
npm start           # run with tsx (no build needed)
npm run build       # compile to dist/
npm test            # run tests
npm run lint        # ESLint check
```

## Releases

Releases are created automatically after a reviewed PR merges into `main`. PR titles use [Conventional
Commits](https://www.conventionalcommits.org/): `feat:` creates a minor release, `fix:` and `perf:` create
patch releases, and `!` creates a major release. `docs:`, `ci:`, and `chore:` changes do not publish a package.

After the initial manual npm publication, configure npm trusted publishing for `.github/workflows/release.yml` and set the
`NPM_TRUSTED_PUBLISHING_ENABLED` repository variable to `true`. Until then, pushes do not publish; manual dispatches are
dry runs only.

## Project structure

```
bullion-cli/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── bullion-client.ts     # HTTP client for bullionapi.dev
│   ├── prices.ts             # Price calculation & conversion
│   ├── config.ts             # Asset definitions
│   ├── types.ts              # TypeScript interfaces
│   └── format.ts             # Terminal output formatting
└── dist/                     # Compiled JS (built by tsc)
```

## How it works

Unlike most price CLIs that hit their data source directly (and burn through API quotas), `bullion-cli` talks to [bullionapi.dev](https://bullionapi.dev), a cached API layer. This means:

- Fast, consistent response times (single round-trip, no client-side chunking)
- No local cache to manage or stale data to worry about
- Your API key's rate limits are centralized

The API contract is backed by Twelve Data through [api.bullionapi.dev](https://api.bullionapi.dev), which provides the cached price and currency responses consumed by the CLI.

## License

MIT © Paul Underwood (https://github.com/paulund)
