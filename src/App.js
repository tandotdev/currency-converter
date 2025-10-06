import { useState, useEffect, useMemo } from 'react';
import './App.css';

// Using the free and open-source Frankfurter API, no API key needed.
const API_URL = 'https://api.frankfurter.app';

function App() {
  const [amount, setAmount] = useState(1);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [currencies, setCurrencies] = useState([]);
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState('dark');
  const [historyPoints, setHistoryPoints] = useState([]);
  const popularPairs = useMemo(() => ([
    { from: 'USD', to: 'INR' },
    { from: 'USD', to: 'EUR' },
    { from: 'USD', to: 'GBP' }
  ]), []);

  const currencyToFlag = useMemo(() => ({
    USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭', CNY: '🇨🇳', INR: '🇮🇳', NZD: '🇳🇿', SEK: '🇸🇪', NOK: '🇳🇴', DKK: '🇩🇰', PLN: '🇵🇱', CZK: '🇨🇿', HUF: '🇭🇺', RUB: '🇷🇺', BRL: '🇧🇷', MXN: '🇲🇽', ZAR: '🇿🇦', SGD: '🇸🇬', HKD: '🇭🇰', KRW: '🇰🇷', TRY: '🇹🇷', AED: '🇦🇪', SAR: '🇸🇦'
  }), []);

  function getFlag(code) {
    return currencyToFlag[code] || '🌐';
  }

  // Effect to fetch the list of available currencies on component mount
  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const res = await fetch(`${API_URL}/currencies`);
        if (!res.ok) throw new Error('Failed to fetch currencies.');
        const data = await res.json();
        setCurrencies(Object.keys(data));
      } catch (err) {
        setError('Could not load currency data. Please try again later.');
        console.error(err);
      }
    }
    fetchCurrencies();
  }, []); // Empty dependency array means this runs only once

  // Theme initialize and persist
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Manual conversion trigger
  async function convertNow() {
    if (isNaN(amount) || amount <= 0) {
      setConvertedAmount(0);
      return;
    }
    if (fromCurrency === toCurrency) {
      setConvertedAmount(amount);
      return;
    }
    if (!fromCurrency || !toCurrency) return;

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_URL}/latest?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`
      );
      if (!res.ok) throw new Error('Conversion request failed.');
      const data = await res.json();
      setConvertedAmount(data.rates[toCurrency]);
    } catch (err) {
      setError('Failed to get exchange rate.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch historical rates for sparkline
  useEffect(() => {
    async function fetchHistory() {
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        const toISO = (d) => d.toISOString().slice(0, 10);
        const url = `${API_URL}/${toISO(start)}..${toISO(end)}?from=${fromCurrency}&to=${toCurrency}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('History request failed');
        const data = await res.json();
        const points = Object.keys(data.rates)
          .sort()
          .map((date) => data.rates[date][toCurrency]);
        setHistoryPoints(points);
      } catch (e) {
        // Non-critical, just skip chart
        setHistoryPoints([]);
      }
    }
    if (fromCurrency && toCurrency && fromCurrency !== toCurrency) fetchHistory();
  }, [fromCurrency, toCurrency]);

  // Utility: simple SVG sparkline path
  function Sparkline({ points = [], width = 260, height = 60 }) {
    if (!points || points.length === 0) return (
      <svg width={width} height={height} className="sparkline" />
    );
    const min = Math.min(...points);
    const max = Math.max(...points);
    const norm = (v) => {
      if (max === min) return height / 2;
      return height - ((v - min) / (max - min)) * (height - 6) - 3;
    };
    const step = (width - 6) / (points.length - 1);
    const d = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${3 + i * step} ${norm(v)}`).join(' ');
    return (
      <svg width={width} height={height} className="sparkline">
        <path d={d} className="sparkline-path" />
      </svg>
    );
  }

  // Popular pair widget fetcher
  function PopularPair({ from, to }) {
    const [rate, setRate] = useState(null);
    const [pts, setPts] = useState([]);
    useEffect(() => {
      async function run() {
        try {
          const latest = await fetch(`${API_URL}/latest?from=${from}&to=${to}`);
          const latestData = await latest.json();
          setRate(latestData.rates[to]);
        } catch {}
        try {
          const end = new Date();
          const start = new Date();
          start.setDate(end.getDate() - 30);
          const toISO = (d) => d.toISOString().slice(0, 10);
          const url = `${API_URL}/${toISO(start)}..${toISO(end)}?from=${from}&to=${to}`;
          const res = await fetch(url);
          const data = await res.json();
          const p = Object.keys(data.rates).sort().map((k) => data.rates[k][to]);
          setPts(p);
        } catch {}
      }
      run();
    }, [from, to]);
    return (
      <div className="mini-card">
        <div className="mini-header">{from} → {to}</div>
        <div className="mini-rate">{rate ? rate.toFixed(4) : '—'}</div>
        <Sparkline points={pts} width={220} height={48} />
      </div>
    );
  }

  function handleSwap() {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }

  return (
    <div className="hero">
      <div className="hero-inner">
        <div className="header-row">
          <h1 className="hero-title">A cheaper, faster way to send money abroad.</h1>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="converter-card">
          {error && <p className="error">{error}</p>}
          <div className="converter-grid">
            <div className="panel">
              <div className="panel-head">You Send</div>
              <div className="amount-row">
                <input
                  id="amount"
                  className="amount-input"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  disabled={isLoading}
                />
                <div className="currency-select">
                  <span className="flag" aria-hidden>{getFlag(fromCurrency)}</span>
                  <select
                    id="from-currency"
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    disabled={isLoading}
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="meta-row">
                <div className="meta-item">
                  <div className="meta-label">You could save vs banks</div>
                  <div className="meta-value">76.04 {fromCurrency}</div>
                </div>
                <div className="meta-item">
                  <div className="meta-label">Should arrive</div>
                  <div className="meta-value">by December 14th</div>
                </div>
              </div>
            </div>

            <button className="swap-btn" onClick={handleSwap} aria-label="Swap currencies" title="Swap">
              ↔
            </button>

            <div className="panel">
              <div className="panel-head">Recipient Gets</div>
              <div className="amount-row">
                <div className="amount-output">
                  {isLoading ? 'Converting…' : (convertedAmount !== null ? convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—')}
                </div>
                <div className="currency-select">
                  <span className="flag" aria-hidden>{getFlag(toCurrency)}</span>
                  <select
                    id="to-currency"
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    disabled={isLoading}
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card-actions">
            <button className="link-action">Compare Price</button>
            <button className="primary-action" onClick={convertNow} disabled={isLoading}>{isLoading ? 'Converting…' : 'Get Started'}</button>
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-header">Trend (30d)</div>
          <Sparkline points={historyPoints} width={760} height={80} />
        </div>

        <div className="popular-grid">
          {popularPairs.map((p) => (
            <PopularPair key={`${p.from}-${p.to}`} from={p.from} to={p.to} />
          ))}
        </div>

        <p className="rate-info">Using real-time rates from Frankfurter API.</p>
      </div>
    </div>
  );
}

export default App;
