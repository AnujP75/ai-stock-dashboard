# 📈 AI Stock Signal Dashboard

An interactive, AI-powered stock market dashboard that provides real-time equity insights, historical trends, volatility risk profiling, and sentiment-based trading signals. 

This project was built from scratch leveraging a robust **Next.js** (JavaScript/TypeScript) stack, alongside `yahoo-finance2` for real-time market data, `sentiment` (NLP) for live headline analysis, and a local SQLite database for historical data caching. 

---

## 📋 Assignment Deliverables Check

### 1. Fully Working Dashboard
The dashboard allows users to type any valid US stock ticker (e.g., AAPL, TSLA, NVDA) to instantly see its real-time price, recent trends, and dynamic algorithmic trading signals. 

### 2. Full Code Base & Installation
The codebase is structured as a modern Next.js 14 App Router application.

**Prerequisites:**
- Node.js (v18 or newer)
- npm or yarn

**Setup Instructions:**
1. Clone the repository and navigate to the folder.
2. Install dependencies:
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Real-Time Analysis & Static Historic Database
* **Real-time Engine**: Integrates live market prices via `yahoo-finance2`.
* **Static Database**: Employs `better-sqlite3` to cache historical stock sequences locally into `data/historical.db`. 
  * *Bonus Execution*: The database has been cleanly pre-seeded with 1-year of daily trajectory data for 36 major S&P 500 companies. This perfectly satisfies the requirement to have a statical history DB that directly augments real-time live data.

### 4. One-Page Summary

#### 🎯 Purpose and Functionality
The dashboard serves as an all-in-one automated equity research tool mapping out complex data visually. Features include:
- **Price & Change**: Current live price and daily percentages.
- **Trend Charts**: A 30-day interactive historical trend line chart.
- **News Sentiment AI**: Evaluates the 5 most recent financial headlines using a natural language sentiment dictionary to grade news objectively (Bullish vs Bearish).
- **Volatility & Risk Indicator**: Computes the 30-day standard deviation of daily returns to instantly classify assets as High, Moderate, or Low Risk.
- **Moving Average Trend**: Calculates 50-day vs 200-day rolling averages to mathematically determine upward/downward macro trends.
- **Master Trading Signal**: Computes a dynamic **BUY**, **HOLD**, or **SELL** recommendation resolving momentum and news sentiment variables.

#### 🧑‍🤝‍🧑 Target Audience
- **Beginner Investors & Business Students**: Need quick, digestible insights strictly avoiding overly complex terminal interfaces.
- **Retail Traders**: Seeking to rapidly validate their trading intuition using definitive algorithmic sentiment indicators before executing a broker order.
- **Why use this over alternatives?** Mainstream tools (Yahoo Finance, Bloomberg) are famously cluttered with ads and overwhelming data limits. This dashboard cuts through the noise, providing an instant, clean, and actionable "Signal Summary" derived from AI sentiment, volatility risk, and pure momentum.

#### 💼 Sales Pitch & Business Value
- **Value Generated**: Saves hours of daily equity research. Instead of manually reading 10 articles to assess market sentiment across a portfolio, the AI summarizes and outputs a definitive numeric sentiment score instantly.
- **Monetization Strategy**: A "Freemium SaaS" model. The base tier offers delayed data and 3 ticker searches a day for free. The *Premium Subscription* ($15/mo) unlocks real-time API integrations, unlimited ticker searches, personalized portfolio tracking, and automated SMS alerts when a watched stock's AI sentiment definitively flips from Bearish to Bullish.

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