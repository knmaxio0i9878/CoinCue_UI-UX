import { useState, useEffect, useRef } from "react";


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


const COLORS = ["#4F46E5", "#EC4899", "#0D9488", "#F59E0B", "#0EA5E9", "#8B5CF6", "#65A30D", "#EF4444"];


const TOOLS = [
  { href: "/portfolio-balance", label: "Portfolio balance", icon: "M4 6h16M4 12h10M4 18h6", desc: "Pick the mix you want in each coin and see the buy or sell amounts needed to reach it, before tax and fees." },
  { href: "/cryptosell", label: "How much to sell", icon: "M12 8c-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2m0-8V6m0 12v-2", desc: "Enter the cash you need and see how many coins to sell after estimated fees, with optional country tax estimates." },
  { href: "/exchangepricegap", label: "Exchange price gap", icon: "M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3-3m-3 3 3 3", desc: "Compare buy and sell prices on two exchanges and see the gap after trading and transfer fees." },
  { href: "/pricealerts", label: "Price alerts", icon: "M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0", desc: "Set a target price in your currency and get an email or app alert when it is reached." },
];

const KEY = "portfolio-inr-v1";


let uid = Date.now();
const nextId = () => ++uid;
const num = (v) => (isFinite(parseFloat(v)) && parseFloat(v) > 0 ? parseFloat(v) : 0);
const inr = (n, d = 2) => "₹" + (isFinite(n) ? n : 0).toLocaleString("en-IN", { maximumFractionDigits: d });

const loadRows = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved;
  } catch {}
  return [
    { uid: nextId(), coinId: "bitcoin", name: "Bitcoin", qty: "0.05", price: "" },
    { uid: nextId(), coinId: "ethereum", name: "Ethereum", qty: "1", price: "" },
  ];
};

function useCountUp(target, ms = 700) {
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


function Navbar({ isLive }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white">
      <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
        <a href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <Icon d="M12 3v18M16 7.5c0-1.4-1.8-2.5-4-2.5s-4 1.1-4 2.5S9.8 10 12 10s4 1.1 4 2.5-1.8 2.5-4 2.5-4-1.1-4-2.5" className="h-4 w-4" />
          </span>
          CoinCue        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Tools">
          {TOOLS.map((t) => (
            <a key={t.href} href={t.href}
              className="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/20">
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
            <a key={t.href} href={t.href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              <Icon d={t.icon} className="h-5 w-5 text-indigo-600" />
              {t.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}


export default function PortFolio() {
  const [rows, setRows] = useState(loadRows);
  const [pick, setPick] = useState(COINS[2].id);
  const { live, isLive } = useLivePrices();

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch {}
  }, [rows]);

  const marketPrice = (r) => live[r.coinId] ?? COINS.find((c) => c.id === r.coinId)?.sample ?? 0;
  const priceOf = (r) => num(r.price) || marketPrice(r);

  const values = rows.map((r) => num(r.qty) * priceOf(r));
  const total = values.reduce((s, v) => s + v, 0);
  const shown = useCountUp(total);

  const update = (id, field, value) => setRows((rs) => rs.map((r) => (r.uid === id ? { ...r, [field]: value } : r)));
  const remove = (id) => setRows((rs) => rs.filter((r) => r.uid !== id));
  const addCoin = () => {
    const c = COINS.find((x) => x.id === pick);
    setRows((rs) => [...rs, { uid: nextId(), coinId: c.id, name: c.name, qty: "", price: "" }]);
  };
  const addCustom = () => setRows((rs) => [...rs, { uid: nextId(), coinId: null, name: "", qty: "", price: "" }]);

  const counted = values.filter((v) => v > 0).length;

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900 antialiased">
      <Navbar isLive={isLive} />

      <main className="w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Crypto portfolio value calculator</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Enter how many coins you own to see their combined value in rupees and each coin's share of the total. No wallet connection needed.
          </p>
        </div>

        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
          
          <section aria-label="Your coins" className="order-2 space-y-4 lg:order-1">
            {rows.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                No coins yet. Choose one below and press Add coin.
              </div>
            )}

            {rows.map((r, i) => (
              <div key={r.uid} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-base font-bold text-white" style={{ background: COLORS[i % COLORS.length] }}>
                      {(r.name || "?").charAt(0).toUpperCase()}
                    </span>
                    {r.coinId ? (
                      <strong className="truncate text-lg">{r.name}</strong>
                    ) : (
                      <input className={inputCls + " max-w-xs"} value={r.name} onChange={(e) => update(r.uid, "name", e.target.value)} placeholder="Coin name" aria-label="Coin name" />
                    )}
                  </div>
                  <button onClick={() => remove(r.uid)} aria-label={`Remove ${r.name || "coin"}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20">
                    <Icon d="M6 6l12 12M18 6 6 18" className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-600">You own</span>
                    <input className={inputCls} type="number" min="0" step="any" inputMode="decimal" value={r.qty}
                      onChange={(e) => update(r.uid, "qty", e.target.value)} placeholder="0" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-600">Price per coin (₹)</span>
                    <input className={inputCls} type="number" min="0" step="any" inputMode="decimal" value={r.price}
                      onChange={(e) => update(r.uid, "price", e.target.value)}
                      placeholder={r.coinId ? String(marketPrice(r)) : "Enter price"} />
                  </label>
                  <div className="rounded-xl bg-slate-50 px-4 py-2.5 sm:self-end">
                    <span className="block text-sm font-medium text-slate-500">Worth</span>
                    <b className="block truncate text-xl tabular-nums">{inr(values[i])}</b>
                  </div>
                </div>
              </div>
            ))}

            
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:p-5">
              <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Choose a coin to add" className={inputCls + " sm:max-w-xs"}>
                {COINS.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.sym})</option>)}
              </select>
              <button onClick={addCoin}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-base font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/30">
                Add coin
              </button>
              <button onClick={addCustom}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/20">
                Add other coin
              </button>
              <button onClick={() => setRows([])} className="rounded-xl px-4 py-2.5 text-base font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 sm:ml-auto">
                Reset
              </button>
            </div>

            <p className="px-1 text-sm text-slate-500">
              Leave the price empty to use the market price, or type your own. This is not financial or tax advice.
            </p>
          </section>

          
          <aside className="order-1 lg:order-2">
            <section aria-live="polite" className="rounded-2xl bg-slate-900 p-6 text-white sm:p-8 lg:sticky lg:top-24">
              <p className="text-sm font-medium text-slate-400">Total portfolio value</p>
              <div className="mt-2 break-words text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{inr(shown)}</div>
              <p className="mt-2 text-sm text-slate-400">
                {rows.length ? `${counted} of ${rows.length} coins with a value` : "Add a coin to begin"}
              </p>

              <div className="mt-6 flex h-4 w-full overflow-hidden rounded-full bg-slate-800">
                {total > 0 && rows.map((r, i) =>
                  values[i] > 0 ? (
                    <i key={r.uid} className="h-full transition-all duration-500" style={{ width: (values[i] / total) * 100 + "%", background: COLORS[i % COLORS.length] }} />
                  ) : null
                )}
              </div>

              <ul className="mt-5 space-y-2.5">
                {total > 0 && rows.map((r, i) =>
                  values[i] > 0 ? (
                    <li key={r.uid} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <i className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="truncate text-slate-200">{r.name || "Unnamed"}</span>
                      </span>
                      <b className="tabular-nums">{((values[i] / total) * 100).toFixed(1)}%</b>
                    </li>
                  ) : null
                )}
              </ul>
            </section>
          </aside>
        </div>

        
        <section className="mt-12 w-full" aria-label="More tools">
          <h2 className="text-xl font-bold tracking-tight">More tools</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {TOOLS.map((t) => (
              <a key={t.href} href={t.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/20">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon d={t.icon} />
                </span>
                <h3 className="mt-4 text-base font-semibold">{t.label}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}