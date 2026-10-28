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
  { href: "/portfolio-balance", label: "Portfolio balance", icon: "M4 6h16M4 12h10M4 18h6" },
  { href: "/cryptosell", label: "How much to sell", icon: "M12 8c-1.7 0-3 .9-3 2s1.3 2 3 2 3 .9 3 2-1.3 2-3 2m0-8V6m0 12v-2" },
  { href: "/exchangepricegap", label: "Exchange price gap", icon: "M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3-3m-3 3 3 3" },
  { href: "/pricealerts", label: "Price alerts", icon: "M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" },
];


const ALERT_API = "";
const KEY = "pricealerts-inr-v1";
const EMAIL_KEY = "pricealerts-email-v1";


let uid = Date.now();
const nextId = () => ++uid;
const num = (v) => (isFinite(parseFloat(v)) && parseFloat(v) > 0 ? parseFloat(v) : 0);
const inr = (n, d = 2) => "₹" + (isFinite(n) ? n : 0).toLocaleString("en-IN", { maximumFractionDigits: d });
const pct = (n, d = 1) => (isFinite(n) ? n : 0).toFixed(d) + "%";
const when = (t) => new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const load = (k, fallback) => {
  try {
    const s = JSON.parse(localStorage.getItem(k));
    if (s !== null && s !== undefined) return s;
  } catch {}
  return fallback;
};

function useLivePrices() {
  const [live, setLive] = useState({});
  const [isLive, setIsLive] = useState(false);
  const [updated, setUpdated] = useState(null);
  useEffect(() => {
    let off = false;
    const fetchAll = async () => {
      try {
        const ids = COINS.map((c) => c.id).join(",");
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr`);
        const d = await r.json();
        if (off || !d.bitcoin?.inr) return;
        setLive(Object.fromEntries(COINS.filter((c) => d[c.id]?.inr).map((c) => [c.id, d[c.id].inr])));
        setIsLive(true);
        setUpdated(Date.now());
      } catch {
        if (!off) setIsLive(false);
      }
    };
    fetchAll();
    const t = setInterval(fetchAll, 60000);
    return () => { off = true; clearInterval(t); };
  }, []);
  return { live, isLive, updated };
}

const Icon = ({ d, className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d={d} />
  </svg>
);

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-600/15";

/* ---------- navbar ---------- */
function Navbar({ isLive, active = "/pricealerts" }) {
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

const CHANNELS = [
  { id: "app", label: "App alert", desc: "A notification on this device", icon: "M12 18h.01M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2" },
  { id: "email", label: "Email", desc: "A message to your inbox", icon: "M4 6h16v12H4zM4 7l8 6 8-6" },
  { id: "both", label: "Both", desc: "App alert and email", icon: "M5 12l4.5 4.5L19 7" },
];

/* ---------- page ---------- */
export const PriceAlertTool = () => {
  const { live, isLive, updated } = useLivePrices();
  const [alerts, setAlerts] = useState(() => load(KEY, []));
  const [form, setForm] = useState({ coinId: "bitcoin", target: "", channel: "app", email: load(EMAIL_KEY, "") });
  const [error, setError] = useState("");
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");
  const set = (k, v) => { setForm((s) => ({ ...s, [k]: v })); setError(""); };

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(alerts)); } catch {} }, [alerts]);
  useEffect(() => { try { localStorage.setItem(EMAIL_KEY, JSON.stringify(form.email)); } catch {} }, [form.email]);

  const coin = COINS.find((c) => c.id === form.coinId) ?? COINS[0];
  const priceNow = (id) => live[id] ?? COINS.find((c) => c.id === id)?.sample ?? 0;
  const current = priceNow(coin.id);
  const target = num(form.target);
  const diff = target > 0 && current > 0 ? ((target - current) / current) * 100 : 0;
  const direction = target >= current ? "above" : "below";

  /* Check alerts whenever fresh live prices arrive. Sample prices never trigger anything. */
  const fired = useRef(new Set());
  useEffect(() => {
    if (!isLive) return;
    const hit = alerts.filter((a) => a.status === "watching" && live[a.coinId] &&
      (a.direction === "above" ? live[a.coinId] >= a.target : live[a.coinId] <= a.target));
    if (!hit.length) return;
    const now = Date.now();
    setAlerts((as) => as.map((a) => (hit.some((h) => h.id === a.id) ? { ...a, status: "triggered", at: now, hitPrice: live[a.coinId] } : a)));
    hit.forEach((a) => {
      if (fired.current.has(a.id)) return;
      fired.current.add(a.id);
      if ((a.channel === "app" || a.channel === "both") && typeof Notification !== "undefined" && Notification.permission === "granted") {
        try { new Notification(`${a.symbol} hit ${inr(a.target, 0)}`, { body: `${a.symbol} is now ${inr(live[a.coinId], 0)}.` }); } catch {}
      }
    });
  }, [live, isLive, alerts]);

  const askPermission = async () => {
    if (typeof Notification === "undefined") return;
    try { setPerm(await Notification.requestPermission()); } catch {}
  };

  const addAlert = async (e) => {
    e.preventDefault();
    if (target <= 0) return setError("Enter the price you want to be alerted at.");
    if (Math.abs(diff) < 0.01) return setError("That is today's price. Pick a higher or lower target.");
    const needsEmail = form.channel !== "app";
    if (needsEmail && !validEmail(form.email)) return setError("Enter a valid email address to get email alerts.");
    const a = {
      id: nextId(), coinId: coin.id, symbol: coin.sym, name: coin.name, direction, target,
      start: current, channel: form.channel, email: needsEmail ? form.email : "", status: "watching", created: Date.now(),
    };
    setAlerts((as) => [a, ...as]);
    set("target", "");
    if (form.channel !== "email" && perm === "default") askPermission();
    if (ALERT_API) {
      try {
        await fetch(ALERT_API, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: a.id, coinId: a.coinId, symbol: a.symbol, direction: a.direction, target: a.target, channel: a.channel, email: a.email }) });
      } catch {}
    }
  };

  const remove = (id) => setAlerts((as) => as.filter((a) => a.id !== id));
  const rearm = (id) => {
    fired.current.delete(id);
    setAlerts((as) => as.map((a) => (a.id === id ? { ...a, status: "watching", at: undefined, hitPrice: undefined, start: priceNow(a.coinId) } : a)));
  };

  const watching = alerts.filter((a) => a.status === "watching");
  const triggered = alerts.filter((a) => a.status === "triggered");
  const gapTo = (a) => Math.abs((a.target - priceNow(a.coinId)) / priceNow(a.coinId)) * 100;
  const nearest = watching.slice().sort((a, b) => gapTo(a) - gapTo(b))[0];

  const chips = [-10, -5, 5, 10];
  const needsEmail = form.channel !== "app";

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900 antialiased">
      <Navbar isLive={isLive} />

      <main className="w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Crypto price alerts</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Set a target price in rupees and get an email or app alert when a coin reaches it, instead of checking again and again.
          </p>
        </div>

        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
          {/* left: create + list */}
          <div className="order-2 space-y-4 lg:order-1">
            <form onSubmit={addAlert} className="space-y-4" noValidate>
              <Step n="1" title="Pick a coin and a target price">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Coin" hint={`Price now: ${inr(current, 2)}`}>
                    <select className={inputCls} value={form.coinId} onChange={(e) => set("coinId", e.target.value)}>
                      {COINS.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.sym})</option>)}
                    </select>
                  </Field>
                  <Field label="Alert me at this price (₹)">
                    <input className={inputCls + " text-lg font-semibold"} type="number" min="0" step="any" inputMode="decimal" value={form.target}
                      onChange={(e) => set("target", e.target.value)} placeholder={String(Math.round(current * 1.05))} />
                  </Field>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <button type="button" key={c} onClick={() => set("target", String(Math.round(current * (1 + c / 100) * 100) / 100))}
                      className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/20">
                      {c > 0 ? "+" : ""}{c}% ({inr(current * (1 + c / 100), 0)})
                    </button>
                  ))}
                </div>
                {target > 0 && Math.abs(diff) >= 0.01 && (
                  <p className={"mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium " + (direction === "above" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800")}>
                    <Icon d={direction === "above" ? "M12 19V5m0 0-6 6m6-6 6 6" : "M12 5v14m0 0 6-6m-6 6-6-6"} className="h-4 w-4 shrink-0" />
                    {direction === "above"
                      ? `We will alert you when ${coin.sym} rises to ${inr(target, 2)} or higher (+${pct(diff)} from now).`
                      : `We will alert you when ${coin.sym} falls to ${inr(target, 2)} or lower (${pct(diff)} from now).`}
                  </p>
                )}
              </Step>

              <Step n="2" title="How should we tell you?">
                <div role="radiogroup" aria-label="Alert type" className="grid gap-3 sm:grid-cols-3">
                  {CHANNELS.map((c) => (
                    <button type="button" key={c.id} role="radio" aria-checked={form.channel === c.id} onClick={() => set("channel", c.id)}
                      className={"flex items-start gap-3 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/20 " +
                        (form.channel === c.id ? "border-indigo-600 bg-indigo-50" : "border-slate-300 bg-white hover:bg-slate-50")}>
                      <Icon d={c.icon} className={"mt-0.5 h-5 w-5 shrink-0 " + (form.channel === c.id ? "text-indigo-600" : "text-slate-500")} />
                      <span>
                        <b className="block text-base">{c.label}</b>
                        <span className="text-sm text-slate-500">{c.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {needsEmail && (
                  <div className="mt-4">
                    <Field label="Your email address">
                      <input className={inputCls} type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
                    </Field>
                    {!ALERT_API && (
                      <p className="mt-2 text-sm text-amber-700">Email sending is not connected yet, so this alert is saved but no email will go out.</p>
                    )}
                  </div>
                )}

                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

                <button type="submit"
                  className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/30 sm:w-auto">
                  Create alert
                </button>
              </Step>
            </form>


            <section aria-label="Your alerts" className="space-y-3">
              <h2 className="px-1 pt-2 text-xl font-bold tracking-tight">Your alerts</h2>
              {alerts.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                  No alerts yet. Pick a coin and a price above, then press Create alert.
                </div>
              )}
              {alerts.map((a) => {
                const ci = Math.max(COINS.findIndex((c) => c.id === a.coinId), 0);
                const now = priceNow(a.coinId);
                const done = a.status === "triggered";
                const span = a.target - a.start;
                const progress = done ? 100 : span !== 0 ? Math.min(Math.max(((now - a.start) / span) * 100, 0), 100) : 0;
                return (
                  <div key={a.id} className={"rounded-2xl border bg-white p-4 sm:p-5 " + (done ? "border-emerald-300" : "border-slate-200")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-base font-bold text-white" style={{ background: COLORS[ci % COLORS.length] }}>
                          {a.symbol.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <strong className="block truncate text-lg">{a.name} {a.direction === "above" ? "rises to" : "falls to"} {inr(a.target, 2)}</strong>
                          <span className="text-sm text-slate-500">
                            {a.channel === "app" ? "App alert" : a.channel === "email" ? `Email to ${a.email}` : `App alert and email to ${a.email}`}
                          </span>
                        </div>
                      </div>
                      <span className={"shrink-0 rounded-full px-3 py-1 text-xs font-semibold " + (done ? "bg-emerald-100 text-emerald-800" : "bg-indigo-50 text-indigo-700")}>
                        {done ? "Triggered" : "Watching"}
                      </span>
                    </div>

                    <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <i className={"block h-full rounded-full transition-all duration-500 " + (done ? "bg-emerald-500" : "bg-indigo-600")} style={{ width: progress + "%" }} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="text-slate-600">
                        {done ? `Reached ${inr(a.hitPrice, 2)} on ${when(a.at)}` : `Now ${inr(now, 2)}, ${pct(gapTo(a))} to go`}
                      </span>
                      <span className="flex gap-1">
                        {done && (
                          <button onClick={() => rearm(a.id)} className="rounded-lg px-3 py-1.5 font-semibold text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-600/20">Set again</button>
                        )}
                        <button onClick={() => remove(a.id)} aria-label={`Delete alert for ${a.name} at ${inr(a.target, 0)}`}
                          className="rounded-lg px-3 py-1.5 font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20">Delete</button>
                      </span>
                    </div>
                  </div>
                );
              })}
            </section>

            <p className="px-1 text-sm text-slate-500">
              Alerts are checked about once a minute while this page is open. Prices come from CoinGecko and can differ slightly from your exchange. This is not financial advice.
            </p>
          </div>

          {/* right: summary */}
          <aside className="order-1 lg:order-2">
            <section aria-live="polite" className="rounded-2xl bg-slate-900 p-6 text-white sm:p-8 lg:sticky lg:top-24">
              <p className="text-sm font-medium text-slate-400">Alerts watching</p>
              <div className="mt-2 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{watching.length}</div>
              <p className="mt-2 text-sm text-slate-400">
                {isLive ? `Prices checked ${updated ? when(updated) : "just now"}` : "Waiting for live prices. Nothing triggers on sample prices."}
              </p>

              {triggered.length > 0 && (
                <div role="status" className="mt-5 flex gap-2.5 rounded-xl bg-emerald-500/15 p-3.5 text-sm text-emerald-200">
                  <Icon d="M5 12l4.5 4.5L19 7" className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{triggered.length} {triggered.length === 1 ? "alert has" : "alerts have"} been reached. See your alerts list.</span>
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-800 p-4">
                  <span className="block text-sm text-slate-400">Triggered</span>
                  <b className="mt-1 block text-xl tabular-nums">{triggered.length}</b>
                </div>
                <div className="rounded-xl bg-slate-800 p-4">
                  <span className="block text-sm text-slate-400">Closest to target</span>
                  <b className="mt-1 block truncate text-xl tabular-nums">{nearest ? `${nearest.symbol} ${pct(gapTo(nearest))}` : "None"}</b>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-sm font-semibold text-slate-200">App alerts on this device</p>
                {perm === "granted" && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-emerald-300"><Icon d="M5 12l4.5 4.5L19 7" className="h-4 w-4" />Notifications are on.</p>
                )}
                {perm === "default" && (
                  <>
                    <p className="mt-2 text-sm text-slate-400">Allow notifications so we can alert you even when this tab is in the background.</p>
                    <button onClick={askPermission} className="mt-3 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/40">
                      Turn on notifications
                    </button>
                  </>
                )}
                {perm === "denied" && (
                  <p className="mt-2 text-sm text-amber-300">Notifications are blocked. Allow them for this site in your browser settings to get app alerts.</p>
                )}
                {perm === "unsupported" && (
                  <p className="mt-2 text-sm text-slate-400">This browser does not support notifications. Alerts will show on this page instead.</p>
                )}
                <p className="mt-3 text-sm text-slate-400">Keep this page open, because alerts are only checked while it is running.</p>
              </div>

              {watching.length > 0 && (
                <ul className="mt-6 space-y-2.5 border-t border-slate-800 pt-5">
                  {watching.map((a) => {
                    const ci = Math.max(COINS.findIndex((c) => c.id === a.coinId), 0);
                    return (
                      <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <i className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[ci % COLORS.length] }} />
                          <span className="truncate text-slate-200">{a.symbol} {a.direction === "above" ? "above" : "below"} {inr(a.target, 0)}</span>
                        </span>
                        <b className="tabular-nums text-slate-300">{pct(gapTo(a))}</b>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default PriceAlertTool;