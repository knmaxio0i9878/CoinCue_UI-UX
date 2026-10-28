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

// chart colours: solid, no gradients
const C = { profit: "#10B981", buy: "#F59E0B", move: "#0EA5E9", sell: "#8B5CF6" };
const KEY = "pricegap-inr-v2";

const DEFAULTS = {
  coinId: "bitcoin", invest: "100000",
  nameA: "Exchange A", priceA: "", feeA: "0.5",
  nameB: "Exchange B", priceB: "", feeB: "0.5",
  transfer: "100", delay: "30", swing: "1",
  example: false, touched: false,
};

/* ---------- helpers ---------- */
const num = (v) => (isFinite(parseFloat(v)) && parseFloat(v) > 0 ? parseFloat(v) : 0);
const inr = (n, d = 2) => (n < 0 ? "-" : "") + "₹" + Math.abs(isFinite(n) ? n : 0).toLocaleString("en-IN", { maximumFractionDigits: d });
const pct = (n, d = 2) => (isFinite(n) ? n : 0).toFixed(d) + "%";
const qtyFmt = (n) => (isFinite(n) ? n : 0).toLocaleString("en-IN", { maximumFractionDigits: 6 });

const loadForm = () => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object") return { ...DEFAULTS, ...s };
  } catch {}
  return DEFAULTS;
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
const chipCls = (on) =>
  "rounded-full border px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/20 " +
  (on ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50");

/* ---------- navbar ---------- */
function Navbar({ isLive, active = "/exchangepricegap" }) {
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

const Step = ({ n, title, sub, children }) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">{n}</span>
      <div>
        <h2 className="text-lg font-semibold leading-8">{title}</h2>
        {sub && <p className="text-sm text-slate-500">{sub}</p>}
      </div>
    </div>
    {children}
  </section>
);

const Field = ({ label, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
    {children}
    {hint && <span className="mt-1.5 block text-sm text-slate-500">{hint}</span>}
  </label>
);

/* ---------- page ---------- */
export const ExchangePriceGap = () => {
  const [f, setF] = useState(loadForm);
  const { live, isLive } = useLivePrices();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setPrice = (k, v) => setF((s) => ({ ...s, [k]: v, example: false, touched: true }));

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(f)); } catch {}
  }, [f]);

  const coin = COINS.find((c) => c.id === f.coinId) ?? COINS[0];
  const market = live[coin.id] ?? coin.sample;
  const nameA = f.nameA.trim() || "Exchange A";
  const nameB = f.nameB.trim() || "Exchange B";

  const fillExample = () =>
    setF((s) => ({ ...s, priceA: String(Math.round(market)), priceB: String(Math.round(market * 1.012)), example: true, touched: false }));

  // First visit: show a worked example so the page is never blank. Wait briefly for live prices.
  useEffect(() => {
    if (f.touched || f.priceA || f.priceB) return;
    const t = setTimeout(fillExample, isLive ? 0 : 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, f.touched, f.priceA, f.priceB]);

  const swap = () =>
    setF((s) => ({ ...s, nameA: s.nameB, priceA: s.priceB, feeA: s.feeB, nameB: s.nameA, priceB: s.priceA, feeB: s.feeA }));
  const startOver = () => setF({ ...DEFAULTS, coinId: f.coinId });

  /* Maths: buy on A, send the coins over, sell on B. */
  const I = num(f.invest);
  const pA = num(f.priceA);
  const pB = num(f.priceB);
  const fA = num(f.feeA) / 100;
  const fB = num(f.feeB) / 100;
  const T = num(f.transfer); // flat network or withdrawal fee in ₹
  const delay = num(f.delay);
  const swing = num(f.swing);
  const drift = Math.min((swing * delay) / 60, 100) / 100;

  const feeTooBig = I > 0 && I * (1 - fA) <= T;
  const ready = I > 0 && pA > 0 && pB > 0 && !feeTooBig;
  const r = ready ? pB / pA : 1;
  const bought = ready ? (I * (1 - fA)) / pA : 0;
  const sent = ready ? bought - T / pA : 0;
  const proceeds = ready ? sent * pB * (1 - fB) : 0;
  const net = ready ? proceeds - I : 0;
  const netPct = ready ? (net / I) * 100 : 0;
  const gross = ready ? I * (r - 1) : 0;
  const buyFeeCost = ready ? I * fA * r : 0;
  const moveCost = ready ? T * r : 0;
  const sellFeeCost = ready ? sent * pB * fB : 0;
  const costs = buyFeeCost + moveCost + sellFeeCost;
  const breakEven = ready ? (I / ((I * (1 - fA) - T) * (1 - fB)) - 1) * 100 : 0;
  const gapPct = pA > 0 && pB > 0 ? (pB / pA - 1) * 100 : 0;
  const worst = ready ? proceeds * (1 - drift) - I : 0;

  const shownNet = useCountUp(net);

  /* verdict in plain words */
  let verdict = { chip: "Waiting for numbers", tone: "bg-slate-800 text-slate-300", line: "" };
  if (ready) {
    if (net <= 0) verdict = { chip: "Not worth it", tone: "bg-red-500/20 text-red-200", line: "You would lose money on this trade." };
    else if (worst <= 0) verdict = { chip: "Risky", tone: "bg-amber-500/20 text-amber-200", line: "Profitable on paper, but a small price drop while you wait could wipe it out." };
    else verdict = { chip: "Looks good", tone: "bg-emerald-500/20 text-emerald-200", line: "You would make a profit if prices stay close to what you entered." };
  }

  const flags = [];
  if (ready) {
    if (net <= 0 && gapPct < 0)
      flags.push({ lvl: "info", text: `${nameB} is cheaper than ${nameA}. Press "Swap buy and sell" to check the other direction.` });
    else if (net <= 0)
      flags.push({ lvl: "red", text: `Fees take ${inr(costs)}, which is more than the ${inr(gross)} the price difference gives you. The difference must be at least ${pct(breakEven)} to break even.` });
    if (net > 0 && netPct < 0.3)
      flags.push({ lvl: "amber", text: `The profit is very small (${pct(netPct)}). A tiny price move can erase it.` });
    if (delay > 60)
      flags.push({ lvl: "red", text: `A ${delay} minute transfer is long. The price difference may disappear before your coins arrive.` });
    else if (delay >= 15)
      flags.push({ lvl: "amber", text: `Your coins spend about ${delay} minutes in transit, and prices can move in that time.` });
    if (net > 0 && worst <= 0)
      flags.push({ lvl: "red", text: `If the price falls ${pct(drift * 100)} while you wait, this trade ends at ${inr(worst)}.` });
    flags.push({ lvl: "info", text: "Prices change every few seconds. Check both prices again right before you trade, and confirm withdrawal fees and limits with each exchange." });
  }
  const flagCls = { red: "bg-red-500/15 text-red-200", amber: "bg-amber-500/15 text-amber-200", info: "bg-slate-800 text-slate-300" };
  const flagIcon = { red: "M12 8v5m0 3.5v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", amber: "M12 9v4m0 3.5v.01M10.3 4.2 2.7 17.5A2 2 0 0 0 4.4 20.5h15.2a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0", info: "M12 11v5m0-8.5v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18" };

  const denom = Math.max(gross, costs, 1);
  const parts = [
    { k: "profit", label: "Profit you keep", amt: Math.max(net, 0), color: C.profit },
    { k: "buy", label: `Fee for buying on ${nameA}`, amt: buyFeeCost, color: C.buy },
    { k: "move", label: "Fee for sending the coins", amt: moveCost, color: C.move },
    { k: "sell", label: `Fee for selling on ${nameB}`, amt: sellFeeCost, color: C.sell },
  ];

  const checklist = [
    { ok: I > 0, text: "How much money you will use" },
    { ok: pA > 0, text: `The price on ${nameA}` },
    { ok: pB > 0, text: `The price on ${nameB}` },
  ];

  const presets = [10000, 50000, 100000, 500000];
  const delays = [["Fast", 10], ["Normal", 30], ["Slow", 60], ["Very slow", 120]];
  const swings = [["Calm", "0.5"], ["Normal", "1"], ["Jumpy", "3"]];

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900 antialiased">
      <Navbar isLive={isLive} />

      <main className="w-full px-4 py-8 pb-28 sm:px-6 lg:px-10 lg:py-10 lg:pb-10">
        <div className="mb-6 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Exchange price gap calculator</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Sometimes the same coin costs less on one exchange than another. This tool checks if buying on the cheaper one and selling on the other still leaves you a profit after all fees.
          </p>
        </div>

        {/* how it works */}
        <ol className="mb-8 grid gap-3 md:grid-cols-3" aria-label="How it works">
          {[
            ["Enter the two prices", "Type the price you see for the coin on each exchange."],
            ["Check the fees", "We filled typical fees and delays. Change them to match your exchanges."],
            ["Read the result", "The right side shows what you would make or lose, step by step."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700">{i + 1}</span>
              <span>
                <b className="block text-base">{t}</b>
                <span className="text-sm text-slate-600">{d}</span>
              </span>
            </li>
          ))}
        </ol>

        {f.example && (
          <div role="status" className="mb-6 flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex gap-2.5 text-sm text-indigo-900">
              <Icon d="M12 11v5m0-8.5v.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>This is an example so you can see how it works. {nameB} is set 1.2% higher than {nameA}. Replace the prices with the ones you see on your exchanges.</span>
            </p>
          </div>
        )}

        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
          {/* left: inputs */}
          <div className="space-y-4">
            <Step n="1" title="What are you trading?">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Coin">
                  <select className={inputCls} value={f.coinId} onChange={(e) => set("coinId", e.target.value)}>
                    {COINS.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.sym})</option>)}
                  </select>
                </Field>
                <Field label="Money you will use (₹)">
                  <input className={inputCls} type="number" min="0" step="any" inputMode="decimal" value={f.invest}
                    onChange={(e) => set("invest", e.target.value)} placeholder="100000" />
                </Field>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button key={p} onClick={() => set("invest", String(p))} className={chipCls(I === p)}>{inr(p, 0)}</button>
                ))}
              </div>
            </Step>

            <Step n="2" title="Enter the price on each exchange" sub="Open both exchanges and copy the price of the coin. Buy on the cheaper one, sell on the higher one.">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { id: "A", role: "Buy here", help: "the cheaper exchange", nk: "nameA", pk: "priceA", box: "border-emerald-200 bg-emerald-50/60", tag: "bg-emerald-100 text-emerald-800" },
                  { id: "B", role: "Sell here", help: "the higher exchange", nk: "nameB", pk: "priceB", box: "border-red-200 bg-red-50/60", tag: "bg-red-100 text-red-800" },
                ].map((x) => (
                  <div key={x.id} className={"space-y-3 rounded-xl border p-4 " + x.box}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={"rounded-full px-2.5 py-0.5 text-sm font-semibold " + x.tag}>{x.role}</span>
                      <span className="text-sm text-slate-600">{x.help}</span>
                    </div>
                    <Field label="Exchange name">
                      <input className={inputCls} value={f[x.nk]} onChange={(e) => set(x.nk, e.target.value)} placeholder={`Exchange ${x.id}`} />
                    </Field>
                    <Field label={`Price of 1 ${coin.sym} (₹)`}>
                      <input className={inputCls} type="number" min="0" step="any" inputMode="decimal" value={f[x.pk]}
                        onChange={(e) => setPrice(x.pk, e.target.value)} placeholder={`e.g. ${Math.round(market)}`} />
                    </Field>
                    <button onClick={() => setPrice(x.pk, String(Math.round(market)))}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 focus-visible:outline-none focus-visible:underline">
                      Use market price ({inr(market, 0)})
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {pA > 0 && pB > 0 && (
                  <span className={"inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold " +
                    (gapPct > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : gapPct < 0 ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-600")}>
                    <Icon d={gapPct >= 0 ? "M12 19V5m0 0-6 6m6-6 6 6" : "M12 5v14m0 0 6-6m-6 6-6-6"} className="h-4 w-4" />
                    {gapPct === 0 ? "Same price on both" : `${nameB} is ${pct(Math.abs(gapPct))} ${gapPct > 0 ? "higher" : "lower"} than ${nameA}`}
                  </span>
                )}
                <button onClick={swap} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/20">
                  <Icon d="M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3-3m-3 3 3 3" className="h-4 w-4 text-indigo-600" />
                  Swap buy and sell
                </button>
              </div>
              {pA > 0 && pB > 0 && gapPct < 0 && (
                <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {nameB} is cheaper, so buying there and selling on {nameA} is the better direction. Press "Swap buy and sell" to switch.
                </p>
              )}
            </Step>

            <Step n="3" title="Fees and transfer time" sub="We filled typical values. Check your exchanges' fee pages and change them if they differ.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`Fee for buying on ${nameA} (%)`} hint="Often between 0.1% and 1%.">
                  <input className={inputCls} type="number" min="0" max="50" step="any" inputMode="decimal" value={f.feeA}
                    onChange={(e) => set("feeA", e.target.value)} placeholder="0.5" />
                </Field>
                <Field label={`Fee for selling on ${nameB} (%)`} hint="Often between 0.1% and 1%.">
                  <input className={inputCls} type="number" min="0" max="50" step="any" inputMode="decimal" value={f.feeB}
                    onChange={(e) => set("feeB", e.target.value)} placeholder="0.5" />
                </Field>
                <Field label="Fee for sending the coins (₹)" hint={`The flat fee ${nameA} charges to withdraw. Enter 0 if it is free.`}>
                  <input className={inputCls} type="number" min="0" step="any" inputMode="decimal" value={f.transfer}
                    onChange={(e) => set("transfer", e.target.value)} placeholder="0" />
                </Field>
                <Field label="How long will the transfer take? (minutes)" hint="Time from pressing withdraw until the coins show up on the other exchange.">
                  <input className={inputCls} type="number" min="0" step="any" inputMode="decimal" value={f.delay}
                    onChange={(e) => set("delay", e.target.value)} placeholder="30" />
                </Field>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {delays.map(([label, d]) => (
                  <button key={d} onClick={() => set("delay", String(d))} className={chipCls(delay === d)}>
                    {label} ({d >= 60 ? `${d / 60} hr` : `${d} min`})
                  </button>
                ))}
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-slate-700">How jumpy is this coin's price?</p>
                <div className="flex flex-wrap gap-2">
                  {swings.map(([label, v]) => (
                    <button key={v} onClick={() => set("swing", v)} className={chipCls(swing === Number(v))}>{label}</button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-slate-500">We use this to estimate how much the price could move while your coins are on their way. Pick Jumpy for small, fast-moving coins.</p>
              </div>
            </Step>

            <div className="flex flex-wrap items-center justify-between gap-3 px-1">
              <p className="max-w-2xl text-sm text-slate-500">
                Estimates only. Real prices, fees and order sizes change quickly, and large orders can fill at worse prices. Tax is not included. This is not financial or tax advice.
              </p>
              <button onClick={startOver} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/20">
                Start over with the example
              </button>
            </div>
          </div>

          {/* right: result */}
          <aside id="result" className="scroll-mt-24">
            <section aria-live="polite" className="rounded-2xl bg-slate-900 p-6 text-white sm:p-8 lg:sticky lg:top-24">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-400">If you do this trade</p>
                <span className={"rounded-full px-3 py-1 text-xs font-semibold " + verdict.tone}>{verdict.chip}</span>
              </div>

              {!ready ? (
                <div className="mt-4">
                  <p className="text-xl font-semibold">
                    {feeTooBig ? "The sending fee is bigger than your money." : "Fill in these to see your result"}
                  </p>
                  {feeTooBig ? (
                    <p className="mt-2 text-sm text-slate-400">Lower the fee for sending the coins, or use more money.</p>
                  ) : (
                    <ul className="mt-4 space-y-2.5">
                      {checklist.map((c) => (
                        <li key={c.text} className="flex items-center gap-2.5 text-sm">
                          <span className={"grid h-5 w-5 place-items-center rounded-full " + (c.ok ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400")}>
                            <Icon d={c.ok ? "m5 12 4.5 4.5L19 7" : "M12 12h.01"} className="h-3 w-3" />
                          </span>
                          <span className={c.ok ? "text-slate-300" : "text-white"}>{c.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button onClick={fillExample} className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/40">
                    Try an example
                  </button>
                </div>
              ) : (
                <>
                  <div className={"mt-3 break-words text-4xl font-bold tabular-nums tracking-tight sm:text-5xl " + (net > 0 ? "text-emerald-400" : "text-red-400")}>
                    {net > 0 ? "+" : ""}{inr(shownNet)}
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    {net > 0 ? "Profit" : "Loss"} of {pct(Math.abs(netPct))} on {inr(I, 0)}. {verdict.line}
                  </p>

                  {/* the trade, step by step */}
                  <div className="mt-6">
                    <p className="mb-3 text-sm font-semibold text-slate-200">Your trade, step by step</p>
                    <ol className="space-y-3">
                      {[
                        { t: `Buy on ${nameA}`, d: `Spend ${inr(I, 0)}. After the ${inr(I * fA)} fee you get ${qtyFmt(bought)} ${coin.sym}.` },
                        { t: `Send to ${nameB}`, d: `The ${inr(T)} sending fee leaves ${qtyFmt(sent)} ${coin.sym}. Allow about ${delay} minutes.` },
                        { t: `Sell on ${nameB}`, d: `After the ${inr(sellFeeCost)} fee you receive ${inr(proceeds)}.` },
                      ].map((s, i) => (
                        <li key={s.t} className="flex gap-3">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-800 text-sm font-bold text-slate-200">{i + 1}</span>
                          <span className="text-sm">
                            <b className="block text-white">{s.t}</b>
                            <span className="text-slate-400">{s.d}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* where the gap goes */}
                  <div className="mt-6 border-t border-slate-800 pt-5">
                    <p className="mb-1 text-sm font-semibold text-slate-200">Where the price difference goes</p>
                    <p className="mb-3 text-sm text-slate-400">The price difference alone is worth {inr(gross)}. Fees take part of it.</p>
                    <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-800">
                      {parts.map((p) => (
                        <i key={p.k} className="h-full transition-all duration-500" style={{ width: (p.amt / denom) * 100 + "%", background: p.color }} />
                      ))}
                    </div>
                    <ul className="mt-4 space-y-2.5">
                      {parts.map((p) => (
                        <li key={p.k} className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-2.5 text-slate-200">
                            <i className="h-3 w-3 shrink-0 rounded-full" style={{ background: p.color }} />
                            <span className="truncate">{p.label}</span>
                          </span>
                          <b className="tabular-nums">{p.k === "profit" ? inr(p.amt) : "-" + inr(p.amt)}</b>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-800 p-4">
                      <span className="block text-sm text-slate-400">Smallest price difference that still pays</span>
                      <b className="mt-1 block text-xl tabular-nums">{pct(breakEven)}</b>
                    </div>
                    <div className="rounded-xl bg-slate-800 p-4">
                      <span className="block text-sm text-slate-400">If the price drops {pct(drift * 100, 1)} while you wait</span>
                      <b className={"mt-1 block text-xl tabular-nums " + (worst > 0 ? "text-emerald-400" : "text-red-400")}>{worst > 0 ? "+" : ""}{inr(worst)}</b>
                    </div>
                  </div>

                  {flags.length > 0 && (
                    <div className="mt-6 space-y-2.5 border-t border-slate-800 pt-5">
                      <p className="text-sm font-semibold text-slate-200">Things to watch</p>
                      {flags.map((fl, i) => (
                        <div key={i} className={"flex gap-2.5 rounded-xl p-3.5 text-sm " + flagCls[fl.lvl]} role={fl.lvl === "red" ? "alert" : undefined}>
                          <Icon d={flagIcon[fl.lvl]} className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{fl.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </aside>
        </div>
      </main>

      {/* small phones: always show the result */}
      <a href="#result" className="fixed inset-x-3 bottom-3 z-20 flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-3.5 text-white shadow-lg lg:hidden">
        <span className="text-sm text-slate-300">{ready ? "Your result" : "Fill in the prices"}</span>
        <span className="flex items-center gap-2 font-bold tabular-nums">
          {ready && <span className={net > 0 ? "text-emerald-400" : "text-red-400"}>{net > 0 ? "+" : ""}{inr(net)}</span>}
          <span className="text-sm font-semibold text-indigo-300">See details</span>
        </span>
      </a>
    </div>
  );
};

export default ExchangePriceGap;