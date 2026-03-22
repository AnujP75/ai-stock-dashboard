import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { default: YahooFinanceClass } = await import('yahoo-finance2');
    const yahooFinance = new (YahooFinanceClass as any)({ suppressNotices: ['yahooSurvey'] });

    // Fetch in parallel for speed
    const [gainersRes, losersRes, trendingRes] = await Promise.all([
      yahooFinance.screener({ scrIds: 'day_gainers', count: 10 }),
      yahooFinance.screener({ scrIds: 'day_losers', count: 10 }),
      yahooFinance.trendingSymbols('US', { count: 10 })
    ]);

    // Trending quotes usually just return { symbol: 'AAPL' } in the quotes array, we need some price data if possible
    // But for "Most Discussed", just the symbol and name is fine.
    
    return NextResponse.json({
      gainers: gainersRes?.quotes?.slice(0, 10) || [],
      losers: losersRes?.quotes?.slice(0, 10) || [],
      trending: trendingRes?.quotes?.slice(0, 10) || []
    });
  } catch (error: any) {
    console.error("Market API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
