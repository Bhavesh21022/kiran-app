'use strict';
/* ============================================================================
   KIRAN Heatwave Engine  (heat-only build)
   12 heat signal types, all using the TRATA pattern:
   normalize -> weighted score -> logit probability -> official-alert override -> confidence.
   Data honesty: each field is LIVE (Open-Meteo, key-less) or PLACEHOLDER (neutral default,
   labelled in the UI). needsAPI on every result lists what to plug in later.
   ============================================================================ */
const HZ = { calc: {}, fetch: {} };
const avg = a => a.reduce((s, v) => s + (v || 0), 0) / (a.length || 1);
HZ.nrm = (v, min, max, inv) => { if (inv) return v <= min ? 100 : v >= max ? 0 : (max - v) / (max - min) * 100; return v <= min ? 0 : v >= max ? 100 : (v - min) / (max - min) * 100; };
HZ.logit = (b0, terms) => { let l = b0; terms.forEach(([b, x]) => l += b * x); return Math.round(100 / (1 + Math.exp(-l)) * 100) / 100; };
HZ.band = s => s < 25 ? 'LOW' : s < 50 ? 'MODERATE' : s < 75 ? 'HIGH' : 'EXTREME';
HZ.mk = (hazard, score, prob, confidence, ts, freshness, alert, source, factors, rec, needsAPI, fieldSrc) => ({
  hazard, riskScore: Math.round(score * 100) / 100, riskLevel: HZ.band(score), probability: prob, confidence, timestamp: ts, dataFreshness: freshness,
  officialAlert: alert, officialAlertSource: source, mainFactors: factors, recommendation: rec, modelVersion: '2.0.0-heat', needsAPI: needsAPI || [], fieldSrc: fieldSrc || {} });
const nowISO = () => new Date().toISOString();
const OM = 'https://api.open-meteo.com/v1/forecast', OM_AQ = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const jget = async u => { const r = await fetch(u); if (!r.ok) throw new Error(r.status); return r.json(); };
const fs = (live, ph = []) => Object.assign(Object.fromEntries(live.map(k => [k, 'LIVE (Open-Meteo)'])), Object.fromEntries(ph.map(k => [k, 'PLACEHOLDER'])));
const CLIM = 'Climatology API (Open-Meteo Historical / ERA5) for true local heatwave thresholds';
const OFFICIAL = 'Official heat-alert feed (IMD / NWS / MeteoAlarm / WMO Alert Hub)';

/* ---------- heat maths ---------- */
HZ.hot = (mx, base) => mx >= 40 || (mx >= 32 && mx - base >= 5);   // proxy hot-day rule until a climatology API is wired
HZ.hi = (c, rh) => { const T = c * 9 / 5 + 32; let h;             // NWS Rothfusz heat index
  if (T < 80) h = 0.5 * (T + 61 + (T - 68) * 1.2 + rh * 0.094);
  else { h = -42.379 + 2.04901523 * T + 10.14333127 * rh - .22475541 * T * rh - .00683783 * T * T - .05481717 * rh * rh + .00122874 * T * T * rh + .00085282 * T * rh * rh - .00000199 * T * T * rh * rh;
    if (rh < 13 && T <= 112) h -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17); else if (rh > 85 && T <= 87) h += ((rh - 85) / 10) * ((87 - T) / 5); }
  return (h - 32) * 5 / 9; };
HZ.wetbulb = (t, rh) => t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) + Math.atan(t + rh) - Math.atan(rh - 1.676331) + 0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035; // Stull 2011
HZ.wbgt = (t, rh, sw, ws) => .7 * HZ.wetbulb(t, rh) + .2 * (t + .02 * sw / (1 + .3 * ws)) + .1 * t;   // outdoor estimate (globe temp approximated from solar + wind)

/* ---------- shared live data: ONE Open-Meteo call per place feeds every heat type ---------- */
HZ._c = {}; const TI = 14;
HZ.base = (lat, lon) => { const k = lat.toFixed(2) + ',' + lon.toFixed(2), c = HZ._c[k]; if (c && Date.now() - c.t < 6e5) return c.p;
  const p = jget(`${OM}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,shortwave_radiation&hourly=relative_humidity_2m,shortwave_radiation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum&past_days=${TI}&forecast_days=7&timezone=auto`);
  HZ._c[k] = { t: Date.now(), p }; p.catch(() => delete HZ._c[k]); return p; };
HZ.inp = b => { const c = b.current, D = b.daily, H = b.hourly, mx = D.temperature_2m_max, mn = D.temperature_2m_min, base = avg(mx.slice(0, TI)), hot = i => mx[i] != null && HZ.hot(mx[i], base);
  let dp = 0, fw = 0, wn = 0, dry = 0;
  for (let i = TI - 1; i >= 0 && dp < 7 && hot(i); i--) dp++;
  for (let i = TI + 1; i < mx.length && hot(i); i++) fw++;
  for (let i = TI; i >= 0 && mn[i] >= 25; i--) wn++;
  for (let i = TI; i >= 0 && (D.precipitation_sum[i] || 0) < 1; i--) dry++;
  const p = TI * 24 + 15, h = H.relative_humidity_2m[p] ?? c.relative_humidity_2m;
  return { ts: nowISO(), t: c.temperature_2m, h: c.relative_humidity_2m, app: c.apparent_temperature, tmax: mx[TI], night: mn[TI], base, tomorrow: mx[TI + 1] ?? mx[TI],
    durPrev: dp, hotToday: hot(TI), dur: dp + (hot(TI) ? 1 : 0), fwd: fw, warmNights: wn, dryDays: dry, rain14: avg(D.precipitation_sum.slice(0, TI)) * TI, uv: D.uv_index_max[TI] ?? 0,
    pk: { t: mx[TI], h, sw: H.shortwave_radiation[p] ?? 0, ws: (H.wind_speed_10m[p] ?? 5) / 3.6 } }; };

/* ---------- 7-day early-warning outlook (the core of KIRAN) ---------- */
HZ.outlook = (mx, mn, hm, ti, n = 7) => { const base = avg(mx.slice(Math.max(0, ti - 14), ti)), hot = i => mx[i] != null && HZ.hot(mx[i], base),
    dur = i => { let c = 0; while (c < 7 && i - c >= 0 && hot(i - c)) c++; return c; };
  return Array.from({ length: n }, (_, k) => { const i = ti + k; if (mx[i] == null) return null; const d = dur(i);
    const r = HZ.calc.heatwave({ current_temperature_c: mx[i], humidity_percent: hm[i] ?? 40, duration_days: d, night_temperature_c: mn[i], forecast_temperature_c: mx[i + 1] ?? mx[i], official_heatwave_alert: d >= 2 && hot(i) });
    return { i: k, tmax: mx[i], tmin: mn[i], score: r.riskScore, level: r.riskLevel, prob: r.probability, dur: d, alert: r.officialAlert }; }).filter(Boolean); };
HZ.early = out => { const k = out.findIndex(o => o.score >= 50), pk = Math.max(...out.map(o => o.score));
  return { k, peak: pk, text: k === 0 ? 'Heatwave conditions today' : k === 1 ? 'Heatwave risk from tomorrow' : k > 1 ? `Heatwave risk in ${k} days` : pk >= 25 ? 'Warming trend: moderate heat this week' : 'No heatwave signal in 7 days' }; };
HZ.forecast = async (lat, lon) => { const d = await HZ.base(lat, lon), D = d.daily;
  const out = HZ.outlook(D.temperature_2m_max, D.temperature_2m_min, D.time.map((_, i) => d.hourly.relative_humidity_2m[i * 24 + 15]), TI); out.forEach((o, k) => o.date = D.time[TI + k]); return out; };

/* ---------- builder for the 11 non-composite types ---------- */
const H = (name, sc, pr, conf, x, al, fac, rec, needs, live, ph) => { if (al) sc = Math.max(sc, 85);
  return HZ.mk(name, sc, pr, al ? 95 : conf, x.ts, 'LIVE', al, al ? 'KIRAN_threshold_estimate' : null, fac, rec, needs, fs(live, ph)); };

/* 1. HEATWAVE (composite TRATA formula) */
HZ.calc.heatwave = function (d) {
  const t = d.current_temperature_c ?? 35, h = d.humidity_percent ?? 30, dur = d.duration_days ?? 0, nt = d.night_temperature_c ?? 25, fc = d.forecast_temperature_c ?? 35, alert = !!d.official_heatwave_alert;
  const a = HZ.nrm(t, 38, 48), b = HZ.nrm(h, 20, 80), c = HZ.nrm(dur, 0, 7), e = HZ.nrm(nt, 25, 35), f = HZ.nrm(fc, 38, 48);
  let score = .35 * a + .20 * e + .20 * c + .15 * b + .10 * f;
  const prob = HZ.logit(-7.5, [[.035, a], [.025, b], [.02, c], [.025, e], [.015, f]]);
  if (alert) score = Math.max(score, 85);
  return HZ.mk('Heatwave', score, prob, alert ? 95 : 85, d.timestamp || nowISO(), 'LIVE', alert, alert ? 'KIRAN_threshold_estimate' : null,
    [`Temperature: ${t}°C (Forecast max: ${fc}°C)`, `Night Temperature: ${nt}°C`, `Hot-spell duration: ${dur} days`, `Humidity: ${h}%`],
    'Stay hydrated and indoors during peak hours. High risk of heat exhaustion/stroke.', [OFFICIAL, CLIM],
    { ...fs(['current_temperature_c', 'humidity_percent', 'duration_days', 'night_temperature_c', 'forecast_temperature_c']), official_heatwave_alert: 'PLACEHOLDER (heuristic: 2+ hot days)' });
};
/* 2. SEVERE HEATWAVE */
HZ.calc.severe = x => { const a = HZ.nrm(x.tmax, 42, 50), b = HZ.nrm(x.tmax - x.base, 4, 12), c = HZ.nrm(x.dur, 0, 5), e = HZ.nrm(x.night, 28, 36);
  const sc = .35 * a + .25 * b + .25 * c + .15 * e, al = x.tmax >= 45 && x.dur >= 2;
  return H('Severe heatwave', sc, HZ.logit(-8, [[.04, a], [.03, b], [.025, c], [.02, e]]), 85, x, al, [`Max today: ${x.tmax}°C`, `Above 14-day normal by ${(x.tmax - x.base).toFixed(1)}°C`, `Hot days in a row: ${x.dur}`, `Night min: ${x.night}°C`],
    'Life-threatening heat. Stay indoors 11 AM–4 PM, check on vulnerable people, keep ORS ready.', [OFFICIAL, CLIM], ['tmax', 'anomaly', 'duration', 'night']); };
/* 3. TEMPERATURE ANOMALY */
HZ.calc.anomaly = x => { const a = HZ.nrm(x.tmax, 35, 48), b = HZ.nrm(Math.max(0, x.tmax - x.base), 0, 8), c = HZ.nrm(Math.abs(x.tmax - x.tomorrow), 0, 5), d = HZ.nrm(x.dur, 0, 7);
  return H('Temperature anomaly', .40 * a + .30 * b + .20 * d + .10 * c, HZ.logit(-5, [[.04, a], [.03, b], [.02, c], [.01, d]]), 90, x, false,
    [`Max today: ${x.tmax}°C`, `Anomaly vs last 14 days: +${Math.max(0, x.tmax - x.base).toFixed(1)}°C`, `Tomorrow max: ${x.tomorrow}°C`], 'Early sign of a heat build-up; feeds the heatwave engine.', [CLIM], ['tmax', 'anomaly', 'change', 'duration']); };
/* 4. WARM NIGHT */
HZ.calc.warmnight = x => { const a = HZ.nrm(x.night, 24, 34), b = HZ.nrm(x.warmNights, 0, 5), c = HZ.nrm(x.nextMin ?? x.night, 24, 34);
  return H('Warm-night heat', .5 * a + .3 * b + .2 * c, HZ.logit(-6, [[.04, a], [.03, b], [.02, c]]), 85, x, x.night >= 30, [`Night minimum: ${x.night}°C`, `Warm nights (≥25°C) in a row: ${x.warmNights}`],
    'Body cannot recover when nights stay hot. Cool the bedroom, hydrate, avoid heavy late meals.', [], ['night', 'warm_nights']); };
/* 5. HUMID HEAT (heat index) */
HZ.calc.humid = x => { const hi = HZ.hi(x.pk.t, x.pk.h), a = HZ.nrm(hi, 27, 54), b = HZ.nrm(x.pk.h, 30, 90) * (x.pk.t >= 27 ? 1 : 0), c = HZ.nrm(x.night, 24, 34);
  return H('Humid heat', .6 * a + .2 * b + .2 * c, HZ.logit(-6.5, [[.04, a], [.02, b], [.02, c]]), 90, x, hi >= 52, [`Afternoon heat index: ${hi.toFixed(1)}°C`, `Afternoon humidity: ${Math.round(x.pk.h)}%`],
    'Sweat evaporates poorly in humid heat. Rest more often and drink water or ORS.', [], ['temperature', 'humidity']); };
/* 6. HEAT STRESS (WBGT) */
HZ.calc.wbgt = x => { const w = HZ.wbgt(x.pk.t, x.pk.h, x.pk.sw, x.pk.ws), a = HZ.nrm(w, 25, 33), b = HZ.nrm(x.pk.sw, 300, 1000);
  return H('Heat stress (WBGT)', .8 * a + .2 * b, HZ.logit(-6, [[.05, a], [.02, b]]), 80, x, w >= 32, [`Afternoon WBGT (estimate): ${w.toFixed(1)}°C`, `Wet-bulb: ${HZ.wetbulb(x.pk.t, x.pk.h).toFixed(1)}°C`, `Solar: ${Math.round(x.pk.sw)} W/m²`],
    'For outdoor work: at high WBGT use 15-min rest per hour, shade and water. Estimate only; not a site WBGT meter.', ['Site WBGT sensor / Liljegren globe model (optional, for accuracy)'], ['temperature', 'humidity', 'solar', 'wind']); };
/* 7. PROLONGED HEAT SPELL */
HZ.calc.prolonged = x => { const a = HZ.nrm(x.dur, 0, 5), b = HZ.nrm(x.fwd, 0, 5), c = HZ.nrm(x.tmax, 36, 46);
  return H('Prolonged heat spell', .4 * a + .35 * b + .25 * c, HZ.logit(-6.5, [[.035, a], [.03, b], [.02, c]]), 85, x, x.dur + x.fwd >= 4, [`Hot days so far: ${x.dur}`, `More hot days forecast: ${x.fwd}`], 'Long spells drain the body and the power grid. Plan cooling and water for the full spell.', [CLIM], ['duration', 'forecast']); };
/* 8. SUN & UV LOAD */
HZ.calc.uv = x => { const a = HZ.nrm(x.uv, 3, 11), b = HZ.nrm(x.pk.sw, 300, 1000);
  return H('Sun & UV load', .6 * a + .4 * b, HZ.logit(-5.5, [[.04, a], [.03, b]]), 90, x, false, [`UV index (max today): ${x.uv.toFixed(1)}`, `Afternoon solar: ${Math.round(x.pk.sw)} W/m²`], 'Use hat, sunglasses and SPF 30+; avoid direct sun at midday.', [], ['uv', 'solar']); };
/* 9. HEAT + SMOG */
HZ.calc.heataq = x => { const a = HZ.nrm(x.tmax, 32, 46), b = HZ.nrm(x.pm25 ?? 0, 0, 150), c = HZ.nrm(x.o3 ?? 0, 0, 180);
  return H('Heat + smog', .5 * a + .3 * b + .2 * c, HZ.logit(-6, [[.03, a], [.03, b], [.02, c]]), 90, x, false, [`Max temp: ${x.tmax}°C`, `PM2.5: ${(x.pm25 ?? 0).toFixed(0)} µg/m³`, `Ozone: ${(x.o3 ?? 0).toFixed(0)} µg/m³`],
    'Heat with polluted air is harder on lungs and heart. Limit outdoor exertion, use N95 if you must go out.', [], ['tmax', 'pm2_5', 'ozone']); };
/* 10. DRY SPELL & WATER STRESS */
HZ.calc.dryspell = x => { const a = HZ.nrm(x.dryDays, 0, 14), b = HZ.nrm(x.tmax, 30, 45), c = HZ.nrm(x.rain14, 0, 30, true);
  return H('Dry spell & water stress', .4 * a + .35 * b + .25 * c, HZ.logit(-6, [[.03, a], [.03, b], [.02, c]]), 80, x, false, [`Days without rain: ${x.dryDays}`, `Rain in last 14 days: ${x.rain14.toFixed(0)} mm`],
    'Store drinking water, cut non-essential use, watch for tanker/water-supply notices.', ['Reservoir / groundwater level API (e.g. India CWC)'], ['rain', 'temperature']); };
/* 11. HEAT-HEALTH RISK */
HZ.calc.health = x => { const hi = HZ.hi(x.pk.t, x.pk.h), a = HZ.nrm(hi, 27, 54), b = HZ.nrm(x.night, 24, 34), c = HZ.nrm(x.dur, 0, 5), v = x.vuln ?? 30;
  return H('Heat-health risk', .35 * a + .2 * b + .2 * c + .25 * v, HZ.logit(-6.5, [[.035, a], [.02, b], [.02, c], [.02, v]]), 75, x, false, [`Afternoon heat index: ${hi.toFixed(1)}°C`, `Hot days in a row: ${x.dur}`, `Vulnerability index: ${v}/100 (placeholder)`],
    'Children, elderly, pregnant women and outdoor workers face the highest risk. Check on them every few hours.', ['Population age / vulnerability dataset (WorldPop, census)', 'Hospital heat-illness admissions (optional)'], ['temperature', 'humidity', 'duration'], ['vulnerability_index']); };
/* 12. URBAN HEAT ISLAND (MOCK until satellite data is connected) */
HZ.calc.uhi = x => HZ.mk('Urban heat island', 0, 0, 50, nowISO(), 'MOCK', false, null, ['No satellite land-surface-temperature data connected: showing default state.'], 'Connect LST data to see how much hotter your neighbourhood is than nearby rural land.',
  ['NASA MODIS/Landsat land-surface temperature (AppEEARS or Earth Engine)', 'Green-cover / building density (OSM, Sentinel-2)'], {});

/* ---------- fetch adapters ---------- */
HZ.fetch.heatwave = async (lat, lon) => { const x = HZ.inp(await HZ.base(lat, lon));
  return { current_temperature_c: x.t, humidity_percent: x.h, duration_days: x.durPrev, night_temperature_c: x.night, forecast_temperature_c: x.tmax, official_heatwave_alert: x.dur >= 2, timestamp: x.ts }; };
['severe', 'anomaly', 'warmnight', 'humid', 'wbgt', 'prolonged', 'uv', 'dryspell', 'health', 'uhi'].forEach(id => HZ.fetch[id] = async (lat, lon) => HZ.inp(await HZ.base(lat, lon)));
HZ.fetch.warmnight = async (lat, lon) => { const b = await HZ.base(lat, lon), x = HZ.inp(b); x.nextMin = Math.max(...b.daily.temperature_2m_min.slice(TI + 1, TI + 4)); return x; };
HZ.fetch.heataq = async (lat, lon) => { const [b, a] = await Promise.all([HZ.base(lat, lon), jget(`${OM_AQ}?latitude=${lat}&longitude=${lon}&current=pm2_5,ozone`).catch(() => null)]);
  const x = HZ.inp(b); x.pm25 = a?.current?.pm2_5 ?? 0; x.o3 = a?.current?.ozone ?? 0; return x; };

/* ---------- registry (order = card order) ---------- */
HZ.LIST = [
  { id: 'heatwave', name: 'Heatwave', icon: '☀' }, { id: 'severe', name: 'Severe heatwave', icon: '♨' }, { id: 'anomaly', name: 'Temperature anomaly', icon: '↗' },
  { id: 'warmnight', name: 'Warm-night heat', icon: '☾' }, { id: 'humid', name: 'Humid heat', icon: '💧' }, { id: 'wbgt', name: 'Heat stress (WBGT)', icon: '🌡' },
  { id: 'prolonged', name: 'Prolonged heat spell', icon: '⏳' }, { id: 'uv', name: 'Sun & UV load', icon: '☼' }, { id: 'heataq', name: 'Heat + smog', icon: '🫁' },
  { id: 'dryspell', name: 'Dry spell & water stress', icon: '☉' }, { id: 'health', name: 'Heat-health risk', icon: '✚' }, { id: 'uhi', name: 'Urban heat island', icon: '🏙' },
];
HZ.run = async (id, lat, lon) => HZ.calc[id](await HZ.fetch[id](lat, lon));
if (typeof module !== 'undefined') module.exports = HZ;
