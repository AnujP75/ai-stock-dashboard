import { NextResponse } from 'next/server';
// Removed static import to prevent Next.js webpack from destroying prototype chains
import Sentiment from 'sentiment';
import db from '@/lib/db';

const sentiment = new Sentiment();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tickerParam = searchParams.get('ticker')?.toUpperCase();
  const originalTicker = tickerParam?.trim();
  const ticker = originalTicker?.replace(/[\.\s]+/g, '-');

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

    // Determine if we need to fetch new data (either missing or stale)
    let needsUpdate = historicalData.length < 200;
    if (!needsUpdate && historicalData.length > 0) {
      const lastDateStr = historicalData[historicalData.length - 1].date;
      const lastDate = new Date(lastDateStr);
      // Check if the data is older than ~2 days (to account for weekends)
      const timeDiff = new Date().getTime() - lastDate.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      if (daysDiff > 2) { 
        needsUpdate = true;
      }
    }

    // Force an update if stale or empty
    if (needsUpdate) {
      const past = new Date();
      past.setDate(past.getDate() - 365); // Fetch 1 year required for 200d MA
      const queryOptions = { period1: past, period2: new Date() };
      try {
          const result = await yahooFinance.historical(ticker, queryOptions);
          
          try {
            const insert = db.prepare('INSERT OR REPLACE INTO historical_data (ticker, date, close) VALUES (?, ?, ?)');
            const insertMany = db.transaction((rows) => {
              for (const row of rows) {
                insert.run(ticker, row.date.toISOString().split('T')[0], row.close);
              }
            });
            insertMany(result);
            // Re-query from DB to ensure format matches
            historicalData = stmt.all(ticker) as { date: string, close: number }[];
          } catch (dbErr) {
            // On deployed Vercel apps, SQLite is read-only. We catch the attempt-to-write error
            // and simply fall back to the live data stored in memory for this request.
            console.warn("Could not write to local DB (expected on Vercel). Falling back to live data in-memory.");
            historicalData = result.map((row: any) => ({
              date: row.date.toISOString().split('T')[0],
              close: row.close
            }));
          }
      } catch (e) {
          console.warn("Could not fetch historical data from Yahoo Finance", e);
      }
    }

    // 2. Real-time / Contemporary Data
    let quote;
    try {
      quote = await yahooFinance.quote(ticker) as any;
      if (!quote) throw new Error("Stock quote not found");
    } catch (e: any) {
      return NextResponse.json(
        { error: `Could not fetch data for '${originalTicker}'. Please check if the symbol is valid.` }, 
        { status: 404 }
      );
    }
    
    // 3. News & Sentiment (Switched to Yahoo Finance Search for unbreakable reliability)
    let newsArticles: any[] = [];
    let avgSentiment = 0;
    
    try {
      const searchRes = await yahooFinance.search(ticker, { quotesCount: 0, newsCount: 5 });
      if (searchRes && searchRes.news) {
        const financialLexicon = {
          surge: 3, surges: 3, jump: 2, jumps: 2, gain: 2, gains: 2, rally: 3, rallies: 3, grow: 2, growth: 2,
          beat: 3, beats: 3, up: 1, higher: 1, buy: 2, upgrade: 3, upgrades: 3, bull: 2, bullish: 3, breakout: 2,
          profit: 2, profits: 2, dividend: 1, raise: 2, raises: 2, soar: 3, soars: 3, rebound: 2, rebounds: 2,
          plunge: -3, plunges: -3, drop: -2, drops: -2, fall: -2, falls: -2, loss: -3, losses: -3, down: -1,
          lower: -1, sell: -2, downgrade: -3, downgrades: -3, bear: -2, bearish: -3, miss: -2, misses: -2,
          crash: -4, crashes: -4, slump: -3, slumps: -3, warning: -2, lawsuit: -3, probe: -2, investigation: -2,
          cut: -2, cuts: -2, lawsuits: -3, bankruptcy: -4, fraud: -4, short: -2
        };
        let totalScore = 0;
        newsArticles = searchRes.news.map((item: any) => {
          const title = item.title;
          const score = sentiment.analyze(title || '', { extras: financialLexicon }).score;
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
    // we only want a roughly 1-month trend chart (approx 22 trading days).
    const chartData = historicalData.slice(-22);

    return NextResponse.json({
        ticker,
        name: quote.shortName || quote.longName || ticker,
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
