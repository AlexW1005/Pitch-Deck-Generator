# QuickBuy — Lazard-style Buy-Side Pitch Generator

A professional Next.js application that generates Lazard-style buy-side stock pitch decks exportable as PowerPoint (.pptx) files.

## Features

- **Auto-filled Financial Data**: Fetches company profiles, financials, ratios, and historical prices from Financial Modeling Prep (FMP) API
- **Professional Charts**: Chart.js-powered visualizations for price performance, revenue growth, and market share
- **PowerPoint Export**: Generate downloadable .pptx files with pptxgenjs
- **Lazard-style Design**: Clean, muted palette with dense but readable layouts
- **Editable Templates**: Subjective slides (investment thesis, valuation, risks) come as templates for user input

## Quick Start

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Configure Environment

Rename `env.example.txt` to `.env.local` and add your FMP API key:

```env
FMP_API_KEY=your_fmp_api_key_here
```

Get a free API key at: https://financialmodelingprep.com/developer/docs/

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing with Sample Tickers

Try these popular tickers to test the application:
- `AAPL` - Apple Inc.
- `GOOGL` - Alphabet Inc.
- `MSFT` - Microsoft Corporation
- `AMZN` - Amazon.com Inc.
- `NVDA` - NVIDIA Corporation

## Project Structure

```
├── components/
│   ├── CompanyForm.tsx      # Main input form
│   ├── SlidePreview.tsx     # Slide thumbnail and preview
│   ├── ChartRenderer.tsx    # Chart.js chart generation
│   ├── PptxExporter.tsx     # PowerPoint export handling
│   ├── ProgressSteps.tsx    # Generation progress indicator
│   ├── LoadingSpinner.tsx   # Loading state component
│   └── ErrorBox.tsx         # Error display components
├── lib/
│   ├── types.ts             # TypeScript type definitions
│   ├── fmpClient.ts         # FMP API client with caching
│   ├── chartHelpers.ts      # Chart.js configuration factories
│   └── pptxTemplates.ts     # PPTX slide generation with pptxgenjs
├── pages/
│   ├── api/
│   │   └── fmp/
│   │       ├── [...endpoint].ts  # Dynamic FMP proxy
│   │       ├── search.ts         # Company search endpoint
│   │       └── company-data.ts   # Aggregated data endpoint
│   ├── _app.tsx             # App wrapper
│   ├── _document.tsx        # Document structure
│   └── index.tsx            # Main page
├── styles/
│   └── globals.css          # Tailwind CSS + custom styles
├── env.example.txt          # Environment variables template
└── README.md
```

## Slide Order (Generated Deck)

1. **Cover** - Company name, ticker, rating badge
2. **Table of Contents** - Auto-generated navigation
3. **Investment Summary** - Key metrics and rating
4. **Company Overview** - Auto-filled from FMP profile
5. **Industry Overview** - Sector/industry with placeholders
6. **Key Metrics** - Revenue, EBITDA, margins, EPS
7. **Financial Summary** - Multi-year financial table
8. **Revenue & Growth** - Bar + line combo chart
9. **Price Performance** - 5-year normalized price chart
10. **Peer Comparison** - Comparable companies table
11. **Market Share** - Pie chart (if data available)
12. **Growth Drivers** - Business model bullets
13. **Investment Thesis** - USER INPUT REQUIRED template
14. **Valuation** - USER INPUT REQUIRED template
15. **Risks & Mitigants** - USER INPUT REQUIRED template
16. **Appendix** - Data sources and disclaimers

## Technologies

- **Next.js 14** - React framework with TypeScript
- **TailwindCSS** - Utility-first CSS styling
- **Chart.js** (via react-chartjs-2) - Financial charts
- **pptxgenjs** - PowerPoint file generation
- **Axios** - HTTP client for API calls

## API Usage

The app uses Financial Modeling Prep (FMP) API endpoints:
- `/profile/{symbol}` - Company profile
- `/income-statement/{symbol}` - Income statements
- `/balance-sheet-statement/{symbol}` - Balance sheets
- `/cash-flow-statement/{symbol}` - Cash flow statements
- `/ratios-ttm/{symbol}` - TTM ratios
- `/key-metrics/{symbol}` - Key financial metrics
- `/enterprise-values/{symbol}` - Enterprise values
- `/historical-price-full/{symbol}` - Historical prices
- `/stock_peers` - Peer companies

All API calls are proxied through `/api/fmp/*` to keep the API key secure.

## Caching

API responses are cached in-memory for 15 minutes (configurable via `CACHE_DURATION_MINUTES` env var) to reduce API calls during development and demos.

## Error Handling

The app handles common error scenarios:
- Invalid ticker symbols
- API rate limiting
- Network errors
- Missing data fields

Users are shown helpful error messages with retry options.

## Customization

### Theme Colors

Users can select a custom accent color via the color picker. This affects:
- Chart accent colors
- Export button styling
- PPTX theme accents

### Chart Toggles

Users can enable/disable individual charts:
- Price Performance (5Y normalized)
- Revenue & Growth (bar + line combo)
- Market Share (pie chart)

## Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

For Vercel deployment:
1. Connect your repository
2. Add `FMP_API_KEY` environment variable
3. Deploy

## Unit Test Suggestions

### fmpClient.ts
- Mock API responses to test data processing
- Test cache hit/miss scenarios
- Test error handling for various HTTP status codes

### ChartRenderer.tsx
- Snapshot tests for chart configurations
- Test dataURL export produces valid PNG data
- Test with empty/missing data

### PptxExporter.tsx
- Test generated file size > 100KB
- Test slide count matches expected
- Test with various form data combinations

## Monetization Ideas

- Save templates / saved pitches behind a paywall
- Pro export formats (custom PowerPoint templates, custom fonts)
- Allow users to save "brand themes" (payment)
- Add multi-user accounts for teams
- PDF export option
- Real-time collaboration features

## Legal Notice

This application aggregates public data for convenience only. Users must verify data and assumptions before making investment decisions. This is NOT investment advice.

## License

MIT

---

Built with ❤️ for financial analysts





