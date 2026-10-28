import { useState, useEffect, useRef } from "react";

/* ---------- data (same theme and sources as the other pages) ---------- */
const COINS = [
  { id: "bitcoin", sym: "BTC", name: "Bitcoin", sample: 7670000 },
  { id: "ethereum", sym: "ETH", name: "Ethereum", sample: 223000 },
  { id: "solana", sym: "SOL", name: "Solana", sample: 9640 },
  { id: "binancecoin", sym: "BNB", name: "BNB", sample: 70770 },
  { id: "ripple", sym: "XRP", name: "XRP", sample: 48 },
  { id: "cardano", sym: "ADA", name: "Cardano", sample: 40 },
  { id: "dogecoin", sym: "DOGE", name: "Dogecoin", sample: 14 },
  { id: "tether", sym: "USDT", name: "Tether", sample: 88 },
];

const TOOLS = [
  { href: "/portfolio-balance", label: "Portfolio balance", icon: "M4 6h16M4 12h10M4 18h6" },
  { href: "/cryptosell", label: "How much to sell", icon: "M12 8c-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2m0-8V6m0 12v-2" },
  { href: "/exchangepricegap", label: "Exchange price gap", icon: "M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3-3m-3 3 3 3" },
  { href: "/pricealerts", label: "Price alerts", icon: "M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" },
];

// Illustrative starting rates. Every field stays editable, and rules change, so check current rules.
const COUNTRIES = [
  { id: "none", name: "No tax estimate", rate: 0, tds: 0 },
  { id: "in", name: "India", rate: 30, tds: 1, note: "Flat 30% on gains plus 1% TDS on each sale." },
  { id: "us", name: "United States", rate: 15, tds: 0, note: "Long-term capital gains are often 15%. Short-term gains follow your income tax slab." },
  { id: "uk", name: "United Kingdom", rate: 18, tds: 0, note: "Capital gains tax is 18% or 24%, after the yearly allowance." },
  { id: "other", name: "Other country", rate: 0, tds: 0, note: "Type the rate that applies to you." },
];

// chart colours: solid, no gradients
const C = { net: "#10B981", fee: "#F59E0B", tds: "#0EA5E9", tax: "#EF4444" };
const KEY = "cryptosell-inr-v1";

/* ---------- helpers ---------- */
const num = (v) => (isFinite(parseFloat(v)) && parseFloat(v) > 0 ? parseFloat(v) : 0);
const inr = (n, d = 2) => "₹" + (isFinite(n) ? n : 0).toLocaleString("en-IN", { maximumFractionDigits: d });
const qtyFmt = (n) => (isFinite(n) ? n : 0).toLocaleString("en-IN", { maximumFractionDigits: 6 });

const loadForm = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object") return s;
  } catch {}
  return { coinId: "bitcoin", cash: "", price: "", owned: "", cost: "", fee: "0.5", country: "in", rate: "30", tds: "1" };
};

function useCountUp(target, ms = 600) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf;
    const tick = (t) => {
      const p = Math.min((t - start) / ms, 1);
      const v = a + (target - a) * (1 - Math.pow(1 - p, 3));
      from.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

function useLivePrices() {
  const [live, setLive] = useState({});
  const [isLive, setIsLive] = useState(false);
  useEffect(() => {
    let off = false;
    const load = async () => {
      try {
        const ids = COINS.map((c) => c.id).join(",");
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr`);
        const d = await r.json();
        if (off || !d.bitcoin?.inr) return;
        setLive(Object.fromEntries(COINS.filter((c) => d[c.id]?.inr).map((c) => [c.id, d[c.id].inr])));
        setIsLive(true);
      } catch {
        if (!off) setIsLive(false);
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { off = true; clearInterval(t); };
  }, []);
  return { live, isLive };
}

const Icon = ({ d, className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d={d} />
  </svg>
);

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/15";

/* ---------- navbar ---------- */
function Navbar({ isLive, active = "/cryptosell" }) {
  const [open, setOpen] = useState(false);
  const link = (t, mobile) =>
    `flex items-center gap-${mobile ? 3 : 2} rounded-lg px-3.5 py-${mobile ? 3 : 2} text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/20 ` +
    (t.href === active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900");
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
        <a href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <Icon d="M12 3v18M16 7.5c0-1.4-1.8-2.5-4-2.5s-4 1.1-4 2.5S9.8 10 12 10s4 1.1 4 2.5-1.8 2.5-4 2.5-4-1.1-4-2.5" className="h-4 w-4" />
          </span>
          CoinCue
        </a>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Tools">
          {TOOLS.map((t) => (
            <a key={t.href} href={t.href} aria-current={t.href === active ? "page" : undefined} className={link(t)}>
              <Icon d={t.icon} className="h-4 w-4" />
              {t.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className={"hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:inline-flex " + (isLive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>
            <i className={"h-2 w-2 rounded-full " + (isLive ? "animate-pulse bg-emerald-500" : "bg-slate-400")} />
            {isLive ? "Live ₹ prices" : "Sample prices"}
          </span>
          <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Toggle menu"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden">
            <Icon d={open ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Tools">
          {TOOLS.map((t) => (
            <a key={t.href} href={t.href} className={link(t, true)}>
              <Icon d={t.icon} className="h-5 w-5" />
              {t.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

const Step = ({ n, title, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <div className="mb-4 flex items-center gap-3">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">{n}</span>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
    {children}
  </section>
);

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-600">{label}</span>
    {children}
    {hint && <span className="mt-1.5 block text-sm text-slate-500">{hint}</span>}
  </label>
);

/* ---------- page ---------- */
export const CryptoSell = () => {
  const [f, setF] = useState(loadForm);
  const { live, isLive } = useLivePrices();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(f)); } catch {}
  }, [f]);

  const coin = COINS.find((c) => c.id === f.coinId) ?? COINS[0];
  const market = live[coin.id] ?? coin.sample;
  const price = num(f.price) || market;
  const country = COUNTRIES.find((c) => c.id === f.country) ?? COUNTRIES[0];
  const taxOn = f.country !== "none";

  const chooseCountry = (id) => {
    const c = COUNTRIES.find((x) => x.id === id);
    setF((s) => ({ ...s, country: id, rate: String(c.rate), tds: String(c.tds) }));
  };

  /* Maths: net = gross * (1 - fee - tds - rate * gainShare), so gross = net / that factor. */
  const cash = num(f.cash);
  const feeP = num(f.fee) / 100;
  const tdsP = taxOn ? num(f.tds) / 100 : 0;
  const rateP = taxOn ? num(f.rate) / 100 : 0;
  const cost = num(f.cost);
  const gainShare = cost > 0 ? Math.max(0, 1 - cost / price) : 1; // no buy price entered: assume the whole sale is gain
  const factor = 1 - feeP - tdsP - rateP * gainShare;
  const valid = cash > 0 && price > 0 && factor > 0.01;

  const gross = valid ? cash / factor : 0;
  const coins = valid ? gross / price : 0;
  const feeAmt = gross * feeP;
  const tdsAmt = gross * tdsP;
  const taxAmt = gross * rateP * gainShare;
  const owned = num(f.owned);
  const short = valid && owned > 0 && coins > owned;
  const left = valid && owned > 0 ? Math.max(owned - coins, 0) : 0;

  const shownCoins = useCountUp(coins);
  const shownGross = useCountUp(gross);

  const parts = [
    { k: "net", label: "You receive", amt: valid ? cash : 0, color: C.net },
    { k: "fee", label: "Trading fee", amt: feeAmt, color: C.fee },
    ...(taxOn ? [{ k: "tds", label: "Tax at source (TDS)", amt: tdsAmt, color: C.tds }, { k: "tax", label: "Estimated tax on gain", amt: taxAmt, color: C.tax }] : []),
  ];
  const presets = [10000, 50000, 100000, 500000];

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900 antialiased">
      <Navbar isLive={isLive} />

      <main className="w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">How much crypto should I sell?</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Enter the cash you need. We work out how many coins to sell after estimated trading fees, with an optional country tax estimate.
          </p>
        </div>

        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
          {/* left: inputs */}
          <div className="order-2 space-y-4 lg:order-1">
            <Step n="1" title="How much cash do you need?">
              <Field label="Cash you want in hand (₹)" hint="This is the amount you receive after fees and tax.">
                <input className={inputCls + " text-xl font-semibold"} type="number" min="0" step="any" inputMode="decimal" value={f.cash}
                  onChange={(e) => set("cash", e.target.value)} placeholder="e.g. 50000" />
              </Field>
              <div className="mt-3 flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button key={p} onClick={() => set("cash", String(p))}
                    className={"rounded-full border px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/20 " +
                      (num(f.cash) === p ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50")}>
                    {inr(p, 0)}
                  </button>
                ))}
              </div>
            </Step>

            <Step n="2" title="Which coin will you sell?">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Coin">
                  <select className={inputCls} value={f.coinId} onChange={(e) => set("coinId", e.target.value)}>
                    {COINS.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.sym})</option>)}
                  </select>
                </Field>
                <Field label="Selling price per coin (₹)" hint={`Leave empty for the market price: ${inr(market)}`}>
                  <input className={inputCls} type="number" min="0" step="any" inputMode="decimal" value={f.price}
                    onChange={(e) => set("price", e.target.value)} placeholder={String(market)} />
                </Field>
                <Field label={`How many ${coin.sym} do you own? (optional)`} hint="We warn you if you need more than this.">
                  <input className={inputCls} type="number" min="0" step="any" inputMode="decimal" value={f.owned}
                    onChange={(e) => set("owned", e.target.value)} placeholder="0" />
                </Field>
                <Field label="Trading fee (%)" hint="Check your exchange. Many charge 0.1% to 1%.">
                  <input className={inputCls} type="number" min="0" max="50" step="any" inputMode="decimal" value={f.fee}
                    onChange={(e) => set("fee", e.target.value)} placeholder="0.5" />
                </Field>
              </div>
            </Step>

            <Step n="3" title="Tax estimate (optional)">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Country">
                  <select className={inputCls} value={f.country} onChange={(e) => chooseCountry(e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                {taxOn && (
                  <Field label={`Your average buy price per ${coin.sym} (₹)`} hint="Tax applies to the gain. Empty means we treat the whole sale as gain.">
                    <input className={inputCls} type="number" min="0" step="any" inputMode="decimal" value={f.cost}
                      onChange={(e) => set("cost", e.target.value)} placeholder="0" />
                  </Field>
                )}
                {taxOn && (
                  <Field label="Tax rate on gains (%)">
                    <input className={inputCls} type="number" min="0" max="100" step="any" inputMode="decimal" value={f.rate}
                      onChange={(e) => set("rate", e.target.value)} placeholder="0" />
                  </Field>
                )}
                {taxOn && (
                  <Field label="Tax taken at source (%)" hint="Withheld from each sale, such as India's 1% TDS.">
                    <input className={inputCls} type="number" min="0" max="100" step="any" inputMode="decimal" value={f.tds}
                      onChange={(e) => set("tds", e.target.value)} placeholder="0" />
                  </Field>
                )}
              </div>
              {taxOn && country.note && (
                <p className="mt-4 flex gap-2.5 rounded-xl bg-slate-50 p-3.5 text-sm text-slate-600">
                  <Icon d="M12 8v5m0 3.5v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <span>{country.note} These starting rates are examples. Rules change, so confirm yours before you sell.</span>
                </p>
              )}
            </Step>

            <p className="px-1 text-sm text-slate-500">
              Estimates only. Prices move, and real fees and tax depend on your account and situation. This is not financial or tax advice.
            </p>
          </div>

          {/* right: result */}
          <aside className="order-1 lg:order-2">
            <section aria-live="polite" className="rounded-2xl bg-slate-900 p-6 text-white sm:p-8 lg:sticky lg:top-24">
              <p className="text-sm font-medium text-slate-400">You should sell</p>
              <div className="mt-2 break-words text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
                {valid ? qtyFmt(shownCoins) : "0"} <span className="text-2xl text-slate-400">{coin.sym}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {valid ? `Worth ${inr(shownGross)} before fees and tax, at ${inr(price)} per ${coin.sym}` : cash > 0 && factor <= 0.01 ? "Fees and tax take almost everything. Check the rates you entered." : "Enter the cash you need to begin"}
              </p>

              {short && (
                <div role="alert" className="mt-5 flex gap-2.5 rounded-xl bg-red-500/15 p-3.5 text-sm text-red-200">
                  <Icon d="M12 8v5m0 3.5v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>You need {qtyFmt(coins - owned)} {coin.sym} more than you own. Lower the cash amount or add another coin.</span>
                </div>
              )}

              <div className="mt-6">
                <p className="mb-1.5 text-sm font-medium text-slate-300">Where the sale goes</p>
                <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-800">
                  {valid && parts.map((p) => (
                    <i key={p.k} className="h-full transition-all duration-500" style={{ width: (p.amt / gross) * 100 + "%", background: p.color }} />
                  ))}
                </div>
              </div>

              <ul className="mt-5 space-y-3">
                {parts.map((p) => (
                  <li key={p.k} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <i className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
                      <span className="truncate text-slate-200">{p.label}</span>
                    </span>
                    <b className="tabular-nums">{inr(p.amt)}</b>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3 border-t border-slate-800 pt-3 text-sm">
                  <span className="text-slate-300">Total sale value</span>
                  <b className="text-base tabular-nums">{inr(gross)}</b>
                </li>
              </ul>

              {valid && owned > 0 && !short && (
                <p className="mt-5 rounded-xl bg-slate-800 p-3.5 text-sm text-slate-300">
                  You keep <b className="text-white">{qtyFmt(left)} {coin.sym}</b> ({((left / owned) * 100).toFixed(1)}% of what you own).
                </p>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CryptoSell;