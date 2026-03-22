'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface StockData {
  ticker: string;
  quote: {
    price: number;
    change: number;
    changePercent: number;
  };
  historical: { date: string; close: number }[];
  news: {
    title: string;
    url: string;
    source: string;
    sentiment: number;
    publishedAt: string;
  }[];
  sentimentScore: number;
  signal: 'BUY' | 'HOLD' | 'SELL';
  volatility: { score: number; insight: string; };
  movingAverages: { ma50: number; ma200: number; insight: string; };
}

interface MarketData {
  gainers: any[];
  losers: any[];
  trending: any[];
}

export default function Dashboard() {
  const [tickerInput, setTickerInput] = useState('');
  const [ticker, setTicker] = useState('');
  const [data, setData] = useState<StockData | null>(null);
  const [compareData, setCompareData] = useState<StockData | null>(null);
  
  // Market Overview Data
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load Market Pulse Data
  useEffect(() => {
    async function fetchMarket() {
      try {
        const res = await fetch('/api/market');
        const json = await res.json();
        if (!json.error) {
          setMarketData(json);
        }
      } catch (e) {
        console.error("Market API Error", e);
      } finally {
        setMarketLoading(false);
      }
    }
    fetchMarket();
  }, []);

  const fetchSingleStock = async (symbol: string) => {
    const res = await fetch(`/api/stock?ticker=${symbol}`);
    if (!res.ok) throw new Error(`Failed to fetch ${symbol}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json as StockData;
  };

  useEffect(() => {
    async function loadStockData() {
      if (!ticker) return;
      setLoading(true);
      setError('');
      setData(null);
      setCompareData(null);
      
      try {
        // Check if comparison request
        let t1 = ticker;
        let t2 = '';
        if (ticker.includes('VS') || ticker.includes('VS.')) {
           [t1, t2] = ticker.split(/VS\.?/i).map(s => s.trim());
        } else if (ticker.includes(',')) {
           [t1, t2] = ticker.split(',').map(s => s.trim());
        }

        const primaryData = await fetchSingleStock(t1);
        setData(primaryData);

        if (t2) {
          const secondaryData = await fetchSingleStock(t2);
          setCompareData(secondaryData);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching data. Check ticker symbols.');
      } finally {
        setLoading(false);
      }
    }
    loadStockData();
  }, [ticker]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      setTicker(tickerInput.trim().toUpperCase());
    }
  };

  const getPerformanceDifference = () => {
    if (!data || !compareData) return null;
    
    // Performance typically over 30 days is measured using the start and end of historical array
    const getChange = (d: StockData) => {
      const first = d.historical[0].close;
      const last = d.historical[d.historical.length-1].close;
      return ((last - first) / first) * 100;
    };
    
    const p1 = getChange(data);
    const p2 = getChange(compareData);
    const diff = Math.abs(p1 - p2);
    const winner = p1 > p2 ? data.ticker : compareData.ticker;
    const loser = p1 > p2 ? compareData.ticker : data.ticker;
    const winnerP = p1 > p2 ? p1 : p2;
    const loserP = p1 > p2 ? p2 : p1;
    
    return `${data.ticker} is ${p1 >= 0 ? 'up' : 'down'} ${p1 >= 0 ? '+' : ''}${p1.toFixed(2)}% while ${compareData.ticker} is ${p2 >= 0 ? 'up' : 'down'} ${p2 >= 0 ? '+' : ''}${p2.toFixed(2)}% this month. ${winner} outperformed by ${diff.toFixed(2)}%.`;
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <header className="header">
        <h1 className="title" onClick={() => {setTicker(''); setTickerInput(''); setData(null); setCompareData(null);}} style={{cursor: 'pointer'}}>AI Stock Signal Dashboard</h1>
        <p className="subtitle">Real-time market insights powered by AI logic and historical data.</p>
      </header>

      <div className="search-section">
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '600px' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Enter Stock Ticker (e.g. AAPL) OR Compare (AAPL vs TSLA)"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              style={{ width: '100%' }}
            />
            <button type="submit" className="search-btn">Analyze</button>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#8b949e', marginTop: '0.2rem' }}>
            💡 To compare two assets side-by-side, type the <strong>vs</strong> keyword (e.g., AAPL vs TSLA)
          </p>
        </form>
      </div>

      {error && <div className="error-message badge">{error}</div>}

      {loading && ticker ? (
        <div className="loading">Analyzing market data for {ticker}...</div>
      ) : data ? (
        <div className="dashboard-grid fade-in" style={{ marginTop: '2rem' }}>
          <div className="main-column">
            
            <div className="glass-panel">
              {/* PRIMARY STOCK METRICS */}
              <div className="metric-grid" style={{ marginBottom: compareData ? '1rem' : '2rem' }}>
                <div className="metric-card">
                  <div className="metric-label">{data.ticker} Price</div>
                  <div className="metric-value">
                    ${data.quote.price?.toFixed(2) || '---'}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Today's Change</div>
                  <div className={`metric-value ${data.quote.change >= 0 ? 'metric-positive' : 'metric-negative'}`}>
                    {data.quote.change > 0 ? '+' : ''}{data.quote.change?.toFixed(2)} 
                    ({data.quote.changePercent?.toFixed(2)}%)
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">AI Sentiment</div>
                  <div className={`metric-value ${data.sentimentScore > 0 ? 'metric-positive' : data.sentimentScore < 0 ? 'metric-negative' : ''}`}>
                    {data.sentimentScore > 0 ? '+' : ''}{data.sentimentScore.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* SECONDARY COMPARE STOCK METRICS */}
              {compareData && (
                <>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0' }}></div>
                <div className="metric-grid" style={{ marginBottom: '2rem' }}>
                  <div className="metric-card">
                    <div className="metric-label">{compareData.ticker} Price</div>
                    <div className="metric-value" style={{ color: '#3fb950' }}>
                      ${compareData.quote.price?.toFixed(2) || '---'}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Today's Change</div>
                    <div className={`metric-value ${compareData.quote.change >= 0 ? 'metric-positive' : 'metric-negative'}`}>
                      {compareData.quote.change > 0 ? '+' : ''}{compareData.quote.change?.toFixed(2)} 
                      ({compareData.quote.changePercent?.toFixed(2)}%)
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">AI Sentiment</div>
                    <div className={`metric-value ${compareData.sentimentScore > 0 ? 'metric-positive' : compareData.sentimentScore < 0 ? 'metric-negative' : ''}`}>
                      {compareData.sentimentScore > 0 ? '+' : ''}{compareData.sentimentScore.toFixed(2)}
                    </div>
                  </div>
                </div>
                </>
              )}

              {compareData && (
                <div style={{ padding: '1rem', background: 'rgba(56, 139, 253, 0.1)', borderRadius: '8px', marginBottom: '2rem', borderLeft: '4px solid #58a6ff' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#58a6ff' }}>Performance Difference (1 Month)</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#c9d1d9' }}>{getPerformanceDifference()}</p>
                </div>
              )}

              <div style={{ height: 350, marginTop: '2rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    {/* Combine datasets by letting Recharts process them via Line data={} prop, XAxis uses common date from primary */}
                    <XAxis 
                      dataKey="date" 
                      stroke="#8b949e" 
                      tickFormatter={(val) => val ? val.substring(5) : ''} 
                      allowDuplicatedCategory={false}
                    />
                    <YAxis yAxisId="left" domain={['auto', 'auto']} stroke="#8b949e" tickFormatter={(val) => `$${val}`}/>
                    {compareData && <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} stroke="#3fb950" tickFormatter={(val) => `$${val}`}/>}
                    
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      data={data.historical}
                      name={data.ticker}
                      type="monotone" 
                      dataKey="close" 
                      stroke="#58a6ff" 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 8, fill: '#58a6ff' }}
                    />
                    {compareData && (
                      <Line 
                        yAxisId="right"
                        data={compareData.historical}
                        name={compareData.ticker}
                        type="monotone" 
                        dataKey="close" 
                        stroke="#3fb950" 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 8, fill: '#3fb950' }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          <div className="side-column">
            
            {/* SIGNAL BOARDS */}
            <div className="glass-panel" style={{ textAlign: 'center' }}>
              <div className="metric-label">{data.ticker} Trading Signal</div>
              <div className={`signal-badge signal-${data.signal}`}>
                {data.signal}
              </div>
              {compareData && (
                <>
                  <div style={{ margin: '1.5rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>
                  <div className="metric-label">{compareData.ticker} Trading Signal</div>
                  <div className={`signal-badge signal-${compareData.signal}`}>
                    {compareData.signal}
                  </div>
                </>
              )}
            </div>

            <div className="glass-panel">
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                Advanced Risk Analysis
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{data.ticker} Volatility</span>
                  <span style={{ color: '#58a6ff' }}>{(data.volatility.score * 100).toFixed(1)}%</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#8b949e', fontStyle: 'italic', textAlign: 'left' }}>
                  {data.volatility.insight}
                </p>
              </div>

              {compareData && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{compareData.ticker} Volatility</span>
                    <span style={{ color: '#3fb950' }}>{(compareData.volatility.score * 100).toFixed(1)}%</span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#8b949e', fontStyle: 'italic', textAlign: 'left' }}>
                    {compareData.volatility.insight}
                  </p>
                </div>
              )}
            </div>

            <div className="glass-panel">
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                Latest Financial News {compareData ? `(${data.ticker} & ${compareData.ticker})` : ''}
              </h3>
              <div>
                {[...data.news, ...(compareData?.news || [])].slice(0, 6).map((item, i) => (
                  <div key={i} className="news-item">
                    <h4 className="news-title">
                      <a href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                    </h4>
                    <div className="news-meta">
                      <span>{item.source}</span>
                      <span className={`sentiment-badge ${
                        item.sentiment > 0.5 ? 'sentiment-bullish' : 
                        item.sentiment < -0.5 ? 'sentiment-bearish' : 'sentiment-neutral'
                      }`}>
                        Score: {item.sentiment.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
                {data.news.length === 0 && (!compareData || compareData.news.length === 0) && (
                  <p style={{ color: '#8b949e', fontSize: '0.9rem' }}>No recent news found.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      ) : null}

      {/* GLOBAL MARKET OVERVIEW - NOW RENDERED ALWAYS (APPENDED BELOW) */}
      <div className="market-overview animate-fade-in" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ marginBottom: '0.5rem', color: '#e6edf3' }}>🌍 Global Market Pulse</h2>
        <p className="subtitle" style={{ marginBottom: '2rem' }}>Discover real-time market activity and trending sentiments.</p>
        
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
          
          {/* OPTION A: TOP MOVERS */}
          <div className="glass-panel">
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#58a6ff' }}>🥇 Top 10 Movers (Gainers)</h3>
              <p style={{ color: '#8b949e', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '0.5rem' }}>"These stocks are experiencing unusual market activity"</p>
            </div>
            
            {marketLoading ? (
              <div style={{ textAlign: 'center', color: '#8b949e', padding: '2rem' }}>Loading global market movers...</div>
            ) : marketData?.gainers?.length ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {marketData.gainers.map((g: any, i: number) => (
                  <li key={g.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ color: '#8b949e', fontWeight: 'bold' }}>#{i + 1}</span>
                      <strong style={{ fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => {setTickerInput(g.symbol); setTicker(g.symbol); window.scrollTo(0,0);}} className="hover-underline">{g.symbol}</strong>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600 }}>${g.regularMarketPrice?.toFixed(2)}</div>
                      <div className="metric-positive">+{g.regularMarketChangePercent?.toFixed(2)}%</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#8b949e' }}>Market movers data unavailable.</p>
            )}
          </div>

          {/* OPTION C: MOST DISCUSSED (TRENDING) */}
          <div className="glass-panel">
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#d2a8ff' }}>🥉 Top 10 Most Discussed Stocks</h3>
              <p style={{ color: '#8b949e', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '0.5rem' }}>"Market attention is concentrated on these companies"</p>
            </div>
            
            {marketLoading ? (
              <div style={{ textAlign: 'center', color: '#8b949e', padding: '2rem' }}>Loading trending discussions...</div>
            ) : marketData?.trending?.length ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {marketData.trending.map((t: any, i: number) => (
                  <li key={t.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ color: '#8b949e', fontWeight: 'bold' }}>#{i + 1}</span>
                      <strong style={{ fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => {setTickerInput(t.symbol); setTicker(t.symbol); window.scrollTo(0,0);}} className="hover-underline">{t.symbol}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#8b949e' }}>Trending data unavailable.</p>
            )}
          </div>

        </div>
      </div>

      <div className="disclaimer" style={{ marginTop: '2rem' }}>
        <strong>⚠️ Warning & Disclaimer</strong><br/>
        This dashboard is for informational and educational purposes only. It does not constitute professional, legal, financial, or operational advice. Users rely on this dashboard at their own risk.<br/><br/>
        <strong>🔒 Data Privacy & Intellectual Property</strong><br/>
        No user search data or personal information is collected, stored, or sold. All financial data and news headlines are sourced publicly from Yahoo Finance and remain the exclusive intellectual property of their respective owners. Data is utilized strictly under Fair Use for educational purposes.
      </div>
    </div>
  );
}
