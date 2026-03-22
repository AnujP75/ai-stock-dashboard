import { NextResponse } from 'next/server';
// Removed static import to prevent Next.js webpack from destroying prototype chains
import Sentiment from 'sentiment';
import db from '@/lib/db';

const sentiment = new Sentiment();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker')?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  try {
    // Dynamic import to preserve 'this' context required by yahoo-finance2
    const { default: YahooFinanceClass } = await import('yahoo-finance2');
    const yahooFinance = new (YahooFinanceClass as any)();

    // 1. Static Historic Data
    // Query local SQLite for history
    const stmt = db.prepare('SELECT date, close FROM historical_data WHERE ticker = ? ORDER BY date ASC');
    let historicalData = stmt.all(ticker) as { date: string, close: number }[];

    // If static db is empty for this ticker, populate it once
    if (historicalData.length < 200) {
      const past = new Date();
      past.setDate(past.getDate() - 365); // Fetch 1 year required for 200d MA
      const queryOptions = { period1: past };
      try {
          const result = await yahooFinance.historical(ticker, queryOptions);
          const insert = db.prepare('INSERT OR IGNORE INTO historical_data (ticker, date, close) VALUES (?, ?, ?)');
          const insertMany = db.transaction((rows) => {
            for (const row of rows) {
              insert.run(ticker, row.date.toISOString().split('T')[0], row.close);
            }
          });
          insertMany(result);
          historicalData = stmt.all(ticker) as { date: string, close: number }[];
      } catch (e) {
          console.warn("Could not fetch historical for DB seeding", e);
      }
    }

    // 2. Real-time / Contemporary Data
    const quote = await yahooFinance.quote(ticker) as any;
    
    // 3. News & Sentiment (Switched to Yahoo Finance Search for unbreakable reliability)
    let newsArticles: any[] = [];
    let avgSentiment = 0;
    
    try {
      const searchRes = await yahooFinance.search(ticker, { quotesCount: 0, newsCount: 5 });
      if (searchRes && searchRes.news) {
        let totalScore = 0;
        newsArticles = searchRes.news.map((item: any) => {
          const title = item.title;
          const score = sentiment.analyze(title || '').score;
          totalScore += score;
          return {
            title,
            url: item.link,
            source: item.publisher,
            sentiment: score,
            publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toISOString() : new Date().toISOString()
          };
        });
        if (newsArticles.length > 0) {
          avgSentiment = totalScore / newsArticles.length;
        }
      }
    } catch (e) {
      console.warn("Native News search failed", e);
    }

    // 4. Signal Logic (Combine Tech + Sentiment)
    let signal = "HOLD";
    // Technical check: current price vs 1-week ago if available
    let techValue = 0;
    if (historicalData.length >= 5) {
      const lastWeek = historicalData[historicalData.length - 5].close;
      if (quote.regularMarketPrice && quote.regularMarketPrice > lastWeek * 1.02) techValue = 1;
      else if (quote.regularMarketPrice && quote.regularMarketPrice < lastWeek * 0.98) techValue = -1;
    }
    
    const combinedScore = techValue + (avgSentiment > 1 ? 1 : avgSentiment < -1 ? -1 : 0);
    
    if (combinedScore >= 1) signal = "BUY";
    else if (combinedScore <= -1) signal = "SELL";

    // 5. Advanced Metrics (Volatility & Moving Averages)
    let ma50 = 0, ma200 = 0;
    let trendInsight = "Insufficient data for trend analysis";
    
    if (historicalData.length >= 50) {
      const last50 = historicalData.slice(-50).map(d => d.close);
      ma50 = last50.reduce((a,b) => a+b, 0) / 50;
    }
    if (historicalData.length >= 200) {
      const last200 = historicalData.slice(-200).map(d => d.close);
      ma200 = last200.reduce((a,b) => a+b, 0) / 200;
      
      if (ma50 > ma200) trendInsight = "Stock is in an upward trend (50-day > 200-day average).";
      else trendInsight = "Stock is in a downward trend (50-day < 200-day average).";
    } else if (ma50 > 0) {
      trendInsight = "50-day average computed, but 200-day requires more history.";
    }

    // Volatility (30-day standard deviation of daily returns)
    let volatilityScore = 0;
    let volatilityInsight = "Insufficient data for volatility";
    
    if (historicalData.length >= 31) {
      const recent31 = historicalData.slice(-31).map(d => d.close);
      const returns = [];
      for (let i = 1; i < recent31.length; i++) {
        returns.push((recent31[i] - recent31[i-1]) / recent31[i-1]);
      }
      const meanReturn = returns.reduce((a,b)=>a+b,0) / returns.length;
      const variance = returns.reduce((squ, n) => squ + Math.pow(n - meanReturn, 2), 0) / (returns.length - 1);
      volatilityScore = Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
      
      if (volatilityScore > 0.40) volatilityInsight = `${ticker} shows high volatility — suitable for aggressive investors.`;
      else if (volatilityScore > 0.20) volatilityInsight = `${ticker} shows moderate volatility — standard risk profile.`;
      else volatilityInsight = `${ticker} shows low volatility — suitable for conservative investors.`;
    }

    // Trim historical data payload so we don't send 365 days of graph data to UI, 
    // we only want a 30-day trend chart.
    const chartData = historicalData.slice(-30);

    return NextResponse.json({
        ticker,
        quote: {
            price: quote.regularMarketPrice,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent
        },
        historical: chartData,
        news: newsArticles,
        sentimentScore: avgSentiment,
        signal,
        volatility: { score: volatilityScore, insight: volatilityInsight },
        movingAverages: { ma50, ma200, insight: trendInsight }
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
