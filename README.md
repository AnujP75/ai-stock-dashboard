# 📈 AI Stock Signal Dashboard

An interactive, AI-powered stock market dashboard that provides real-time equity insights, historical trends, volatility risk profiling, and sentiment-based trading signals. 

This project was built from scratch using Google Antigravity leveraging a robust **Next.js** (JavaScript/TypeScript) stack, alongside `yahoo-finance2` for real-time market data, `sentiment` (NLP) for live headline analysis, and a local SQLite database for historical data caching. 

---

## 📋 Dashboard Description
The dashboard allows users to type any valid symbol (including US equity like AAPL, Cryptocurrencies like BTC-USD, and Indices like ^GSPC) directly into the search bar. The robust backend automatically sanitizes inputs (converting spaces/dots into hyphens) before fetching real-time prices, historic trends, and algorithmic scaling signals. Faulty tickers gracefully display an auto-dismissing visual error popup instead of crashing the application.

### Installation
The codebase is structured as a modern Next.js 14 App Router application.

**Prerequisites:**
- Node.js (v18 or newer)
- npm or yarn

**Setup & Installation Instructions:**
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/AnujP75/ai-stock-dashboard.git
   cd ai-stock-dashboard
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

**Deployment & Database Notes for Replication:**
* **Real-time Engine**: Integrates live market prices via `yahoo-finance2` seamlessly.
* **Hybrid Database Strategy**: 
  * *Local Replication:* Employs `better-sqlite3` to cache historical stock data locally into `data/historical.db`. The application checks the database for staleness automatically. If data is missing or older than a few days, it automatically fetches fresh 1-year trajectory data from Yahoo Finance and caches it, serving a 1-year trajectory chart to the UI.
  * *Serverless Deployment (Vercel):* On serverless platforms where local databases are read-only, the application gracefully catches write-errors and serves live, freshly fetched API queries directly in-memory. This ensures the deployed dashboard natively updates daily without any developer intervention or cron-jobs.

---

## ⚖️ Legal & Compliance

### Data Privacy
This application operates strictly under a "No User Data Collected" policy. Search queries, ticker inputs, and session activities are completely ephemeral. They are never saved, tracked, sold, or logged by the server. No cookies are utilized for persistent tracking profiling purposes.

### Intellectual Property Rights & Data Architecture
To ensure strict compliance with Intellectual Property Rights, the data pipeline is architected as follows:
- **Static Historical Database**: Data for the S&P 500 constituents was fetched using open-access developer endpoints via python, and cached locally in SQLite. The database is strictly for singular educational demonstration and does not illegally redistribute proprietary datasets or circumvent licensed bulk data providers.
- **Real-Time Live Data**: Live stock quotes and news headlines are fetched on-the-fly dynamically via the `yahoo-finance2` package. The application respects the API's rate limits and terms. We do not permanently store, cache, or monetize proprietary live data streams.
- **Content Authorship**: All scraped news URLs, headlines, and publication sources remain the exclusive intellectual property of their original publishers. This dashboard aggregates this data stringently under **Fair Use** doctrines for non-commercial, educational, and informational AI/NLP research purposes only. 

### Disclaimer of Liability
This dashboard is for **informational and educational purposes only**. It does not constitute professional, legal, financial, or operational advice. Results may be incomplete, approximate, delayed, or inaccurate. Users rely on the dashboard and its trading signals at their own risk. Insights, claims, or conclusions presented by this system reflect automated analytical choices and do not represent the views of the developer, any instructor, or the University.
