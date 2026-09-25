// @ts-nocheck
'use strict';
/* KIRAN heatwave live layer (heat-only build): Open-Meteo, OpenWeatherMap, NASA EONET, Leaflet + OSM */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a = 0, b = 100) => Math.min(b, Math.max(a, v));
const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);

/* ---------- API PROTECTION & CACHING ---------- */
const API_CACHE = new Map();
const API_INFLIGHT = new Map();
let API_COOLDOWN_UNTIL = 0;

async function getJSON(u, ttl = 5 * 60 * 1000) {
  const now = Date.now();
  const cached = API_CACHE.get(u);
  if (cached && now - cached.t < ttl) return cached.data;

  if (now < API_COOLDOWN_UNTIL) {
    const secondsLeft = Math.ceil((API_COOLDOWN_UNTIL - now) / 1000);
    throw new Error(`429 cooldown ${secondsLeft}s`);
  }

  if (API_INFLIGHT.has(u)) return API_INFLIGHT.get(u);

  const request = (async () => {
    try {
      const r = await fetch(u);
      if (r.status === 429) {
        const retryAfter = Number(r.headers.get('Retry-After')) || 60;
        API_COOLDOWN_UNTIL = Date.now() + Math.min(Math.max(retryAfter, 30), 300) * 1000;
        throw new Error('429');
      }
      if (!r.ok) throw new Error(String(r.status));
      const data = await r.json();
      API_CACHE.set(u, { t: Date.now(), data });
      return data;
    } finally {
      API_INFLIGHT.delete(u);
    }
  })();

  API_INFLIGHT.set(u, request);
  return request;
}

const calcHTSI = (t, rh, s, w) => {
  const score = Math.max(0, (t - 20) * 2.5) + ((rh / 100) * 15) + ((s / 1000) * 15) - Math.min(10, w * 0.5);
  return Math.round(clamp(score, 0, 100));
};

const score = at => Math.round(clamp((at - 27) / 22 * 100));
const BLABEL = { LOW: 'Safe', MODERATE: 'Moderate', HIGH: 'High', EXTREME: 'Extreme' };
const level = s => BLABEL[HZ.band(s)];
function hzName(id) { return (I18N.T[I18N.lang].hazardNames || {})[id] || (HZ.LIST.find(h => h.id === id) || {}).name || id; }
const EONET_CAT = Object.fromEntries(HZ.LIST.map(h => [h.id, 'tempExtremes']));
let hazardCache = {};
const LC = { Safe: '#2f9e6a', Moderate: '#e0a100', High: '#e4572e', Extreme: '#b3122f' };
const CLS = { Safe: 'safe', Moderate: 'watch', High: 'moderate', Extreme: 'high' };
const AC = { red: '#e5383b', orange: '#f77f00', yellow: '#f2c200' };

/* ---------- OpenWeatherMap API Integration ---------- */
const OW_API_KEY = "adb58d23f26ae70a6aaa9cca2e47eb9f";

async function fetchWeatherData(lat, lon, cityName) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OW_API_KEY}&units=metric`;
  const data = await getJSON(url);
  return {
    temperature: data.main.temp,
    humidity: data.main.humidity,
    apparent_temperature: data.main.feels_like,
    description: data.weather[0].description
  };
}

const WX = 'https://api.open-meteo.com/v1/forecast';
const IN_CITIES = [['New Delhi', 28.61, 77.21], ['Mumbai', 19.08, 72.88], ['Kolkata', 22.57, 88.36], ['Chennai', 13.08, 80.27], ['Bengaluru', 12.97, 77.59], ['Hyderabad', 17.39, 78.49], ['Ahmedabad', 23.02, 72.57], ['Jaipur', 26.91, 75.79], ['Vadodara', 22.31, 73.18], ['Nagpur', 21.15, 79.09], ['Lucknow', 26.85, 80.95], ['Bhopal', 23.26, 77.41], ['Surat', 21.17, 72.83], ['Pune', 18.52, 73.85], ['Kanpur', 26.44, 80.33], ['Indore', 22.71, 75.85]];
const WORLD_CITIES = [['Phoenix', 33.45, -112.07, 'USA'], ['Dubai', 25.2, 55.27, 'UAE'], ['Riyadh', 24.71, 46.68, 'Saudi Arabia'], ['Kuwait City', 29.38, 47.99, 'Kuwait'], ['Karachi', 24.86, 67.01, 'Pakistan'], ['Baghdad', 33.31, 44.36, 'Iraq'], ['Cairo', 30.04, 31.24, 'Egypt'], ['Seville', 37.39, -5.98, 'Spain'], ['Athens', 37.98, 23.73, 'Greece'], ['Bangkok', 13.76, 100.5, 'Thailand'], ['Lagos', 6.52, 3.38, 'Nigeria'], ['Perth', -31.95, 115.86, 'Australia']];
const CITIES = [...IN_CITIES.map(c => [...c, 'India']), ...WORLD_CITIES];
const TIPS = () => I18N.T[I18N.lang].tips;
const ST = { 'New Delhi': 'Delhi', Mumbai: 'Maharashtra', Kolkata: 'West Bengal', Chennai: 'Tamil Nadu', Bengaluru: 'Karnataka', Hyderabad: 'Telangana', Ahmedabad: 'Gujarat', Jaipur: 'Rajasthan', Vadodara: 'Gujarat', Nagpur: 'Maharashtra', Lucknow: 'Uttar Pradesh', Bhopal: 'Madhya Pradesh', Surat: 'Gujarat', Pune: 'Maharashtra', Kanpur: 'Uttar Pradesh', Indore: 'Madhya Pradesh' };
let cs = [], alerts = [], eonet = [], modelAlerts = [], catFilter = null, repMap = null, cur = { name: 'Vadodara', lat: 22.31, lon: 73.18 };

function openPanel(html) {
  panelContent.innerHTML = '<button class="panel-close" aria-label="Close">×</button>' + html;
  panel.classList.add('open'); 
  panel.setAttribute('aria-hidden', 'false'); 
  document.body.style.overflow = 'hidden';
  $('.panel-close', panelContent).onclick = closePage; 
  panel.scrollTop = 0;
}

/* ---------- maps (Leaflet + OpenStreetMap) ---------- */
function mkMap(id, c, z) {
  const m = L.map(id, { attributionControl: false, zoomControl: false }).setView(c, z);
  m._t = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
  L.control.attribution({ prefix: false }).addAttribution('© OSM · CARTO · Esri').addTo(m);
  return m;
}
const map = mkMap('liveMap', [22.5, 79], 5), alertLayer = L.layerGroup().addTo(map), riskLayer = L.layerGroup().addTo(map), meLayer = L.layerGroup().addTo(map), mk = {};
const setLayer = l => {
  [['alerts', alertLayer], ['risk', riskLayer]].forEach(([k, g]) => {
    if (l === 'all' || l === k) g.addTo(map);
    else map.removeLayer(g);
  });
};
const activate = l => $(`.map-control[data-layer="${l}"]`).click();
$$('.map-control[data-layer]').forEach(b => {
  b.onclick = () => {$$('.map-control[data-layer]').forEach(x => x.classList.toggle('active', x === b));
    setLayer(b.dataset.layer);
  };
});
$('#zoomIn').onclick = () => map.zoomIn(); 
$('#zoomOut').onclick = () => map.zoomOut();
$('#mapExpand').onclick = () => { 
  const f = $('.map-card').classList.toggle('full'); 
  document.body.style.overflow = f ? 'hidden' : ''; 
  setTimeout(() => map.invalidateSize(), 250); 
};
document.addEventListener('keydown', e => { 
  if (e.key === 'Escape' && $('.map-card.full'))$('#mapExpand').click(); 
});

/* ---------- worldwide heatwave alerts ---------- */
async function loadAlerts() {
  const d = await getJSON('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&category=tempExtremes&limit=100');
  eonet = d.events.filter(e => e.geometry?.length && !/cold|freez|frost|snow|chill/i.test(e.title)).map(e => {
    const g = e.geometry[e.geometry.length - 1]; let co = g.coordinates; while (Array.isArray(co[0])) co = co[0];
    return { id: e.id, title: e.title, cat: 'tempExtremes', catName: 'Heatwave · NASA EONET', lvl: 'orange', date: g.date, lat: co[1], lon: co[0], link: e.sources?.[0]?.url || e.link };
  });
  rebuildAlerts();
}

function rebuildAlerts() {
  const rank = { red: 0, orange: 1, yellow: 2 };
  alerts = [...modelAlerts, ...eonet].sort((a, b) => rank[a.lvl] - rank[b.lvl] || b.date.localeCompare(a.date));
  drawAlerts(); 
  renderCards();
}

function drawAlerts() {
  alertLayer.clearLayers();
  alerts.filter(a => !catFilter || a.cat === catFilter).forEach(a => {
    mk[a.id] = L.circleMarker([a.lat, a.lon], { radius: 9, color: '#fff', weight: 2, fillColor: AC[a.lvl], fillOpacity: .95 }).addTo(alertLayer)
      .bindPopup(`<b>${esc(a.title)}</b><br>${a.lvl.toUpperCase()} · ${esc(a.catName)}<br>${a.date.slice(0, 10)}${a.link ? `<br><a href="${esc(a.link)}" target="_blank" rel="noopener">Source</a>` : ''}`);
  });
  const n = l => alerts.filter(a => a.lvl === l).length;
  $('#mapNote').innerHTML = alerts.length ? `<span class="legend red"></span>${n('red')} red <span class="legend amber"></span>${n('orange')} orange <span class="legend" style="background:#f2c200"></span>${n('yellow')} yellow · heatwave alerts, worldwide` : 'Heatwave alerts unavailable';
}

function openAlerts() {
  const by = l => alerts.filter(a => a.lvl === l);
  openPanel(`<p class="panel-kicker">Heatwave · worldwide · live</p><h2>Heat alerts.</h2><p class="panel-lead">Heat events reported by NASA EONET, plus KIRAN's own 7-day early-warning alerts for 24 watch cities across India and the world. Red / Orange / Yellow are KIRAN estimates, not official warnings.</p>` +
    (alerts.length ? ['red', 'orange', 'yellow'].map(l => `<h3 style="color:${AC[l]};margin:34px 0 0">● ${l.toUpperCase()} (${by(l).length})</h3><div class="panel-grid" style="margin-top:14px">${by(l).slice(0, 12).map(a => `<button class="panel-tile al-tile" data-id="${esc(a.id)}" style="border-left:4px solid ${AC[l]}"><h3>${esc(a.title)}</h3><p>${esc(a.catName)} ·${a.date.slice(0, 10)} · tap to see on map</p></button>`).join('') || '<p class="panel-lead">None right now.</p>'}</div>`).join('') : '<p class="panel-lead">Alerts are loading, or NASA EONET could not be reached.</p>'));
  $$('.al-tile', panelContent).forEach(b => {
    b.onclick = () => { 
      const a = alerts.find(x => x.id === b.dataset.id); 
      closePage(); 
      activate('all'); 
      catFilter = null; 
      drawAlerts();
      $('.map-card').scrollIntoView({ behavior: 'smooth' }); 
      map.flyTo([a.lat, a.lon], 6); 
      setTimeout(() => mk[a.id]?.openPopup(), 900); 
    };
  });
}

/* ---------- live dashboard ---------- */
let nationalLoading = false;

/* ---------- live dashboard ---------- */
let nationalLoading = false;

async function loadNational() {
  if (nationalLoading) return;
  nationalLoading = true;
  try {
    const url = `${WX}?latitude=${CITIES.map(c => c[1])}&longitude=${CITIES.map(c => c[2])}&current=temperature_2m,apparent_temperature,relative_humidity_2m,shortwave_radiation,wind_speed_10m&hourly=apparent_temperature,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min&past_days=5&forecast_days=7&timezone=auto`;
    
    let ds;
    try {
      ds = await getJSON(url, 15 * 60 * 1000);
    } catch (apiErr) {
      console.warn("Open-Meteo rate limit hit in loadNational. Using safe fallback data.");
      // Fallback dummy/cached structure so the app doesn't break
      $('#natNote').textContent = 'Live data (Cached / Offline Mode)';
      nationalLoading = false;
      return;
    }

    cs = CITIES.map((c, i) => {
      const dd = ds[i] || ds;
      const mx = dd.daily?.temperature_2m_max || [38, 39, 40, 39, 38, 37, 38];
      const mn = dd.daily?.temperature_2m_min || [25, 26, 26, 25, 24, 25, 25];
      const ti = Math.max(0, mx.length - 7);
      const hm = mx.map((_, k) => dd.hourly?.relative_humidity_2m?.[k * 24 + 15] || 40);
      const out = HZ.outlook(mx, mn, hm, ti);
      const hz = HZ.calc.heatwave({
        current_temperature_c: dd.current?.temperature_2m || 38,
        humidity_percent: dd.current?.relative_humidity_2m || 40,
        duration_days: out[0]?.dur || 1,
        night_temperature_c: mn[ti] || 25,
        forecast_temperature_c: mx[ti] || 38,
        official_heatwave_alert: out[0]?.alert || false
      });
      const curD = dd.current || { temperature_2m: 38, apparent_temperature: 40, relative_humidity_2m: 40, shortwave_radiation: 500, wind_speed_10m: 10 };
      const htsi = calcHTSI(curD.temperature_2m, curD.relative_humidity_2m, curD.shortwave_radiation || 0, curD.wind_speed_10m || 0);

      return {
        name: c[0], lat: c[1], lon: c[2], country: c[3], admin1: ST[c[0]], admin2: c[0],
        t: curD.temperature_2m, at: curD.apparent_temperature, s: htsi, hz, out, early: HZ.early(out)
      };
    });

    const ind = cs.filter(c => c.country === 'India');
    $('#natAvg').innerHTML = Math.round(mean(ind.map(c => c.s))) + '<span>%</span>';
    $('#natNote').textContent = `Live · ${ind.length} Indian cities · HTSI formula`;

    modelAlerts = cs.map(c => {
      const pk = Math.max(c.s, ...c.out.map(o => o.score));
      if (pk < 25) return null;
      return {
        id: 'kc-' + c.name,
        title: `${c.name}, ${c.country} · ${c.s >= 50 ? 'heatwave conditions now' : c.early.text.toLowerCase()}`,
        cat: 'tempExtremes', catName: 'KIRAN 7-day heat forecast',
        lvl: pk >= 75 ? 'red' : pk >= 50 ? 'orange' : 'yellow',
        date: new Date().toISOString(), lat: c.lat, lon: c.lon
      };
    }).filter(Boolean);

    rebuildAlerts();
    const top7 = ind.sort((a, b) => b.s - a.s).slice(0, 7);
    
    const riskRowHtml = top7.map(c => {
      const L0 = level(c.s), k = CLS[L0];
      return '<article class="risk-card risk-card-' + k + '" data-city="' + c.name + '" tabindex="0" role="button">' +
        '<div><p class="eyebrow">' + c.name + '</p><strong>' + c.s + '<small>/100</small></strong><span class="risk-' + k + '">' + L0 + '</span></div>' +
        '<div class="thermal-meter ' + k + '"><i style="width:' + c.s + '%"></i></div>' +
        '<p>' + c.t + '° · feels like ' + c.at + '°<br><b>' + esc(c.early.text) + '</b></p></article>';
    }).join('');
    
    $('#riskRow').innerHTML = riskRowHtml;

    riskLayer.clearLayers();
    cs.forEach(c => {
      L.circleMarker([c.lat, c.lon], { radius: 11, color: '#fff', weight: 2, fillColor: LC[level(c.s)], fillOpacity: .9 })
        .addTo(riskLayer).bindTooltip(`${c.name} · ${c.s}/100 ${level(c.s)}`).on('click', () => showReport(c));
    });

    const days = {};
    const todayKey = ds[0]?.current?.time?.slice(0, 10) || new Date().toISOString().slice(0, 10);
    ds.slice(0, IN_CITIES.length).forEach((d, ci) => {
      d.hourly?.time?.forEach((t, i) => {
        const v = d.hourly.apparent_temperature[i];
        if (v == null) return;
        const m = days[t.slice(0, 10)] ??= {};
        m[ci] = Math.max(m[ci] ?? -99, v);
      });
    });

    const ks = Object.keys(days).sort().filter(k => k <= todayKey);
    if (ks.length > 0) {
      const ser = ks.map(k => mean(Object.values(days[k]).map(score)));
      const y = v => (220 - v * 2.2).toFixed(1);
      const line = ser.map((v, i) => (i ? 'L' : 'M') + (i / (ser.length - 1) * 700).toFixed(1) + ' ' + y(v)).join(' ');

      $('#chartLine').setAttribute('d', line);
      $('#chartArea').setAttribute('d', line + ' V220 H0Z');
      
      const chartXHtml = [0, .33, .66, 1].map(f => 
        '<span>' + new Date(ks[Math.round(f * (ks.length - 1))]).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' }) + '</span>'
      ).join('');
      $('#chartX').innerHTML = chartXHtml;

      scrub($('.chart-card .chart'), ks.map(k => new Date(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })), [{ name: 'Heat risk', vals: ser.map(Math.round), unit: '/100' }]);
    }
    
    renderCards();

    if (!window.liveUpdateTimer) {
      window.liveUpdateTimer = setInterval(loadNational, 15 * 60 * 1000);
    }
  } catch (err) {
    console.error('loadNational failed:', err);
    $('#natNote').textContent = 'Live data unavailable';
  } finally {
    nationalLoading = false;
  }
}

/* ---------- 16-hazard grid ---------- */
function renderCards() {
  $('#disasterGrid').innerHTML = HZ.LIST.map(h => {
    const r = hazardCache[h.id];
    let sub = 'Tap to check', dot = '';
    if (r) { const lvl = BLABEL[r.riskLevel]; dot = `<i class="src-dot" style="background:${LC[lvl]}"></i>`; sub = `${Math.round(r.riskScore)}/100 · ${lvl}${r.dataFreshness === 'MOCK' ? ' · needs API' : r.needsAPI.length ? ' · partial live' : ' · live'}`; }
    return `<button class="disaster-card" data-hz="${h.id}"><span class="card-icon">${h.icon}</span><span><strong>${dot}${esc(hzName(h.id))}</strong><small>${esc(sub)}</small></span><b>↗</b></button>`;
  }).join('');
}
$('#disasterGrid').onclick = e => { const b = e.target.closest('.disaster-card'); if (b) showHazardPanel(b.dataset.hz); };

async function loadAllHazards(lat, lon) {
  const results = await Promise.allSettled(HZ.LIST.map(h => HZ.run(h.id, lat, lon)));
  HZ.LIST.forEach((h, i) => { if (results[i].status === 'fulfilled') hazardCache[h.id] = results[i].value; });
  renderCards();
}

async function showHazardPanel(id) {
  const meta = HZ.LIST.find(h => h.id === id);
  openPanel(`<p class="panel-kicker">${esc(cur.name)} · TRATA formula</p><h2>${meta.icon} ${esc(hzName(id))}</h2><p class="panel-lead">Fetching live data…</p>`);
  let r = hazardCache[id];
  if (!r) { 
    try { 
      r = await HZ.run(id, cur.lat, cur.lon); 
      hazardCache[id] = r; 
      renderCards(); 
    } catch { 
      return openPanel(`<p class="panel-kicker">${esc(cur.name)}</p><h2>${meta.icon} ${esc(hzName(id))}</h2><p class="panel-lead">Live data could not be loaded. Check your connection and try again.</p>`); 
    } 
  }
  const lvl = BLABEL[r.riskLevel], col = LC[lvl];
  
  // Safe loop implementation to avoid parser/destructuring errors
  let srcRows = '';
  if (r.fieldSrc) {
    for (const key in r.fieldSrc) {
      if (Object.prototype.hasOwnProperty.call(r.fieldSrc, key)) {
        srcRows += '<li><b>' + esc(key) + '</b>: ' + esc(r.fieldSrc[key]) + '</li>';
      }
    }
  }
  if (!srcRows) {
    srcRows = '<li>No formula inputs for this state.</li>';
  }

  const mapBtn = EONET_CAT[id] ? `<button class="text-button" id="hzMapLink">View live NASA events for this hazard on map ↗</button>` : '';
  const alertHtml = r.officialAlert ? ` &nbsp; <b>Official alert:</b> ${esc(r.officialAlertSource || 'yes')}` : '';

  openPanel(`<p class="panel-kicker">${esc(cur.name)} · TRATA formula</p><h2>${meta.icon} ${esc(hzName(id))}</h2>
  <p class="panel-lead">Weighted 0–100 risk score, ported directly from the KIRAN/TRATA disaster-formula set. ${r.dataFreshness === 'MOCK' ? 'No free live API exists yet for this hazard, so KIRAN shows a safe default (no event) instead of a fabricated number until one is connected.' : r.needsAPI.length ? 'Some inputs below are live; others are neutral placeholders until an API is connected — see Data sources.' : 'Every input below is pulled live right now.'}</p>
  <div class="rep-sec"><h3>Risk score</h3><div class="rep-risk" style="--c:${col}"><strong>${Math.round(r.riskScore)}</strong><span style="font-size:20px"> / 100 · ${esc(lvl.toUpperCase())}</span><div class="thermal-meter ${CLS[lvl]}" style="margin:14px 0"><i style="width:${Math.round(r.riskScore)}%"></i></div>
  <p class="panel-lead" style="margin:8px 0 0"><b>Modelled probability:</b> ${r.probability}% &nbsp; <b>Confidence:</b> ${r.confidence}%${alertHtml}</p>
  <p class="panel-lead" style="margin:12px 0 0"><b>Key factors</b></p><ul style="margin:8px 0 0;padding-left:20px">${r.mainFactors.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div></div>
  <div class="rep-sec"><h3>Recommendation</h3><p class="panel-lead">${esc(r.recommendation)}</p></div>
  <div class="rep-sec"><h3>Data sources for this score</h3><ul style="margin:8px 0 0;padding-left:20px;font-size:12px;color:var(--muted)">${srcRows}</ul>${r.needsAPI.length ? `<p class="panel-lead" style="margin-top:12px"><b>Connect these to make it fully live:</b> ${r.needsAPI.map(esc).join(' · ')}</p>` : ''}${mapBtn}</div>
  <p class="panel-lead" style="margin-top:24px;font-size:12px">RiskScore = Σ(weight × normalized factor), 0–100, banded Low/Moderate/High/Extreme per the TRATA implementation plan. This is a risk estimate, not an official warning — always defer to IMD/NDMA advisories.</p>`);
  
  const mb = $('#hzMapLink'); 
  if (mb) {
    mb.onclick = () => { 
      closePage(); 
      catFilter = EONET_CAT[id]; 
      activate('all'); 
      drawAlerts(); 
      $('.map-card').scrollIntoView({ behavior: 'smooth' }); 
    };
  }
}

$('#riskRow').onclick = e => { 
  const a = e.target.closest('[data-city]'); 
  if (a) showReport(cs.find(c => c.name === a.dataset.city)); 
};

/* ---------- current city score card ---------- */
async function setCity(name, lat, lon, meta = {}) {
  cur = { name, lat, lon, ...meta };
  hazardCache = {};
  renderCards();

  try {
    const [w, a] = await Promise.all([
      getJSON(`${WX}?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,shortwave_radiation,wind_speed_10m&timezone=auto`),
      getJSON(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,uv_index`).catch(() => null)
    ]);
    
    const s = calcHTSI(w.current.temperature_2m, w.current.relative_humidity_2m, w.current.shortwave_radiation || 0, w.current.wind_speed_10m || 0);
    const L0 = level(s), comfort = s, col = LC[L0], aqi = a?.current?.us_aqi, uv = a?.current?.uv_index;
    const bars = [['Heat stress', comfort], ['Air quality', aqi == null ? null : Math.round(clamp(100 - aqi / 2))], ['UV exposure', uv == null ? null : Math.round(clamp(100 - uv / 11 * 100))]].filter(b => b[1] != null);
    
    $('#scoreCard').innerHTML = `<div class="score-top"><p class="eyebrow">Current city score</p><span class="score-status">${L0}</span></div><h3>${esc(name)}</h3><div class="score-row"><div class="score-ring" style="background:radial-gradient(var(--surface-solid) 58%,transparent 59%),conic-gradient(${col} 0 ${comfort}%,#dcebe1 ${comfort}%)"><strong>${comfort}</strong><small>/100</small></div><div><p>Climate comfort</p><strong class="score-up" style="color:${col}">${L0} heat risk</strong><small>${w.current.temperature_2m}° · feels ${w.current.apparent_temperature}°</small></div></div><div class="score-bars">${bars.map(([n, v]) => `<span style="--value:${v}"><i>${n}</i><b>${v}</b></span>`).join('')}</div><p class="do-now">▸ ${esc(TIPS()[L0][0])}</p><button class="full-button" id="scoreReport">View full report <span>↗</span></button>`;
    $('#scoreReport').onclick = () => showReport(cur);
    $('#humNow').textContent = `Humidity now in ${name}: ${w.current.relative_humidity_2m}% · heat index ${HZ.hi(w.current.temperature_2m, w.current.relative_humidity_2m).toFixed(0)}°C`;
  } catch { 
    $('#scoreCard').innerHTML = '<p class="eyebrow">Current city score</p><p>Live data unavailable. Check your connection.</p>'; 
  }
}

/* ---------- location report (8 sections) ---------- */
const wx = (lat, lon) => getJSON(`${WX}?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,shortwave_radiation&hourly=temperature_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max&forecast_days=5&timezone=auto`);
const pth = (v, a, b) => v.map((y, i) => (i ? 'L' : 'M') + (i / (v.length - 1) * 700).toFixed(1) + ' ' + ((210 - (y - a) / ((b - a) || 1) * 200).toFixed(1))).join(' ');
function factors(c) {
  const f = [], t = c.temperature_2m, a = c.apparent_temperature;
  if (t >= 40) f.push(`Air temperature is ${t}°C, in the heatwave range for plains`); else if (t >= 35) f.push(`Air temperature is high at ${t}°C`);
  if (a - t >= 3) f.push(`Humidity makes it feel ${Math.round(a - t)}°C hotter than the air`);
  if (c.relative_humidity_2m >= 60 && t >= 30) f.push(`High humidity (${c.relative_humidity_2m}%) slows sweat evaporation`);
  if (c.shortwave_radiation >= 700) f.push(`Strong sunshine (${Math.round(c.shortwave_radiation)} W/m²)`);
  if (c.wind_speed_10m < 8 && t >= 32) f.push(`Very light wind (${c.wind_speed_10m} km/h) gives little cooling`);
  return f.length ? f : ['No significant heat-stress factor right now'];
}

async function showReport(p) {
  openPanel(`<p class="panel-kicker">Location report</p><h2>${esc(p.name)}</h2><p class="panel-lead">Fetching live data…</p>`);
  let d, hz, fc; 
  try { 
    [d, hz, fc] = await Promise.all([wx(p.lat, p.lon), HZ.run('heatwave', p.lat, p.lon), HZ.forecast(p.lat, p.lon)]); 
  } catch { 
    return openPanel(`<p class="panel-kicker">Location report</p><h2>${esc(p.name)}</h2><p class="panel-lead">Live weather could not be loaded. Check your connection and try again.</p>`); 
  }
  
  hazardCache.heatwave = hz;
  const c = d.current, h = d.hourly, s = Math.round(hz.riskScore), L0 = BLABEL[hz.riskLevel], col = LC[L0];
  const i0 = Math.max(0, h.time.findIndex(t => t.slice(0, 13) === c.time.slice(0, 13)));
  const idx = [...Array(24).keys()].map(k => i0 + k).filter(i => i < h.time.length);
  const at = idx.map(i => h.apparent_temperature[i]), tt = idx.map(i => h.temperature_2m[i]), hs = at.map(score);
  const pk = hs.indexOf(Math.max(...hs)), pkT = h.time[idx[pk]].slice(11, 16), hr = +pkT.slice(0, 2), Lp = level(hs[pk]);
  const part = hr < 5 ? 'night' : hr < 12 ? 'morning' : hr < 16 ? 'afternoon' : hr < 19 ? 'evening' : 'night';
  const status = Lp === 'Safe' ? `Heat stress stays low. Feels-like peaks near ${Math.round(at[pk])}°C around ${pkT}.` : `${{ Moderate: 'Noticeable', High: 'Elevated', Extreme: 'Dangerous' }[Lp]} heat conditions expected during the ${part}: feels-like up to ${Math.round(at[pk])}°C around ${pkT} (risk ${hs[pk]}/100).`;
  
  const tipsList = [...TIPS()[Lp]];
  if (c.relative_humidity_2m >= 60 && c.temperature_2m >= 30) tipsList.push('Humidity is high, so sweat cools you less: rest more often.');
  if (c.shortwave_radiation >= 700) tipsList.push('Strong sun right now: use a hat or umbrella and sunscreen.');
  
  const tile = (k, v) => `<article class="panel-tile"><p>${k}</p><h3 style="font-size:26px;margin:4px 0 0">${v}</h3></article>`;
  const fmt = t => new Date(t).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const xs = [0, .25, .5, .75, 1].map(f => `<span>${h.time[idx[Math.round(f * (idx.length - 1))]].slice(11, 16)}</span>`).join('');
  
  const factorsHtml = factors(c).map(f => '<li>' + esc(f) + '</li>').join('');
  const fcTableRows = fc.map(o => { 
    const Lo = BLABEL[o.level]; 
    return '<tr><td style="padding:10px; border-bottom:1px solid var(--line);">' + (o.i ? fmt(o.date) : 'Today') + '</td>' +
           '<td style="padding:10px; border-bottom:1px solid var(--line);">' + o.tmax + '°</td>' +
           '<td style="padding:10px; border-bottom:1px solid var(--line);">' + o.tmin + '°</td>' +
           '<td style="padding:10px; border-bottom:1px solid var(--line); color:' + LC[Lo] + '; font-weight:700">' + Lo + ' · ' + Math.round(o.score) + '</td>' +
           '<td style="padding:10px; border-bottom:1px solid var(--line);">' + (o.score >= 50 ? 'Heatwave likely' : o.score >= 25 ? 'Watch' : 'None') + '</td></tr>'; 
  }).join('');
  const tipsHtml = tipsList.map(t => '<article class="panel-tile"><p style="font-size:14px;margin:0;color:var(--ink)">' + esc(t) + '</p></article>').join('');

  openPanel(`<p class="panel-kicker">Location report</p><h2>${esc(p.name)}</h2>
  <p class="panel-lead">City: <b>${esc(p.name)}</b> · District: <b>${esc(p.admin2 || '—')}</b> · State: <b>${esc(p.admin1 || '—')}</b> · Country: <b>${esc(p.country || '—')}</b><br>Live data: ${c.time.replace('T', ' ')} (${esc(d.timezone_abbreviation || d.timezone)})</p>
  <div class="rep-sec"><h3>Current conditions</h3><div class="panel-grid" style="margin-top:0">${tile('Temperature', c.temperature_2m + '°C')}${tile('Feels like', c.apparent_temperature + '°C')}${tile('Humidity', c.relative_humidity_2m + '%')}${tile('Wind', c.wind_speed_10m + ' km/h')}${tile('Solar radiation', Math.round(c.shortwave_radiation) + ' W/m²')}</div></div>
  <div class="rep-sec"><h3>Heat risk · Human Thermal Stress formula</h3><div class="rep-risk" style="--c:${col}"><strong>${s}</strong><span style="font-size:20px"> / 100 · ${L0.toUpperCase()}</span><div class="thermal-meter ${CLS[L0]}" style="margin:14px 0"><i style="width:${s}%"></i></div><p class="panel-lead" style="margin:0"><b>Modelled probability:</b> ${hz.probability}% &nbsp; <b>Confidence:</b> ${hz.confidence}%${hz.officialAlert ? ' &nbsp; <b>Heatwave alert active</b>' : ''}</p><p class="panel-lead" style="margin:12px 0 0"><b>Risk factors</b></p><ul style="margin:8px 0 0;padding-left:20px">${factorsHtml}</ul></div></div>
  <div class="rep-sec"><h3>Early warning</h3><div class="rep-risk" style="--c:${LC[BLABEL[HZ.band(HZ.early(fc).peak)]]}"><strong style="font-size:26px">${esc(HZ.early(fc).text)}</strong><p class="panel-lead" style="margin:8px 0 0">Peak 7-day heat risk: ${Math.round(HZ.early(fc).peak)}/100. Forecast-based estimate; follow your national weather service for official warnings.</p></div></div>
  <div class="rep-sec"><h3>Location map</h3><div id="repMap" class="rep-map"></div></div>
  <div class="rep-sec"><h3>Next 24 hours · <span style="color:#5b65f5">heat-risk</span> and <span style="color:#f59e0b">temperature</span></h3><svg class="chart" viewBox="0 0 700 220" preserveAspectRatio="none" style="height:200px;width:100%"><path class="chart-line" d="${pth(hs, 0, 100)}"/><path class="chart-line" style="stroke:#f59e0b" d="${pth(tt, Math.min(...tt) - 1, Math.max(...tt) + 1)}"/></svg><div class="chart-x" style="padding-left:0">${xs}</div></div>
  <div class="rep-sec" style="overflow-x:auto;"><h3>7-day heatwave outlook</h3><table class="rep-table" style="width:100%; border-collapse:collapse; text-align:left;"><tr><th style="padding:10px; border-bottom:1px solid var(--line);">Day</th><th style="padding:10px; border-bottom:1px solid var(--line);">Max</th><th style="padding:10px; border-bottom:1px solid var(--line);">Min</th><th style="padding:10px; border-bottom:1px solid var(--line);">Heat risk</th><th style="padding:10px; border-bottom:1px solid var(--line);">Heatwave</th></tr>${fcTableRows}</table></div>
  <div class="rep-sec"><h3>Heatwave status</h3><div class="rep-risk" style="--c:${LC[Lp]}"><strong style="font-size:30px">${Lp.toUpperCase()} HEAT RISK</strong><p class="panel-lead" style="margin:8px 0 0">${status}</p></div></div>
  <div class="rep-sec"><h3>Precautions for ${esc(p.name)}</h3><div class="panel-grid" style="margin-top:0">${tipsHtml}</div></div>
  <p class="panel-lead" style="margin-top:30px;font-size:12px">Data: Open-Meteo · Map © OpenStreetMap. Headline risk uses KIRAN's weighted heat-stress formula. Not an official warning.</p>`);
  
  scrub($('svg.chart', panelContent), idx.map(i => h.time[i].slice(11, 16)), [{ name: 'Heat risk', vals: hs, unit: '/100' }, { name: 'Temp', vals: tt.map(v => Math.round(v * 10) / 10), unit: '°C' }]);
  setTimeout(() => { 
    if (!$('#repMap')) return; 
    try { repMap?.remove(); } catch { } 
    repMap = mkMap('repMap', [p.lat, p.lon], 11); 
    L.circleMarker([p.lat, p.lon], { radius: 11, color: '#fff', weight: 3, fillColor: col, fillOpacity: 1 }).addTo(repMap).bindTooltip(esc(p.name), { permanent: true, direction: 'top' }); 
  }, 250);
}

/* ---------- search with suggestions ---------- */
function suggest(input, pick) {
  const box = document.createElement('div'); box.className = 'suggest'; input.parentElement.appendChild(box);
  let items = [], t;
  const draw = () => { 
    box.innerHTML = items.map((p, i) => `<button type="button" data-i="${i}"><strong>${esc(p.name)}</strong><small>${esc([p.admin2, p.admin1, p.country].filter(Boolean).join(', '))}</small></button>`).join(''); 
    box.style.display = items.length ? 'block' : 'none'; 
  };
  const look = async q => { 
    try { 
      const d = await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=en`); 
      return (d.results || []).map(r => ({ name: r.name, admin1: r.admin1, admin2: r.admin2, country: r.country, lat: r.latitude, lon: r.longitude })); 
    } catch { 
      return []; 
    } 
  };
  const choose = p => { input.value = p.name; items = []; draw(); pick(p); };
  input.addEventListener('input', () => { 
    clearTimeout(t); 
    const q = input.value.trim(); 
    if (q.length < 2) { items = []; return draw(); } 
    t = setTimeout(async () => { items = await look(q); draw(); }, 250); 
  });
  box.addEventListener('click', e => { const b = e.target.closest('button'); if (b) choose(items[b.dataset.i]); });
  document.addEventListener('click', e => { if (!input.parentElement.contains(e.target)) { items = []; draw(); } });
  return { 
    go: async () => { 
      const q = input.value.trim(); 
      if (!q) return showToast('Type a village, city, state or country.'); 
      const r = items[0] || (await look(q))[0]; 
      r ? choose(r) : showToast(`No place found for "${q}".`); 
    } 
  };
}
const onPick = p => { $('.top-search')?.classList.remove('expanded'); showReport(p); setCity(p.name, p.lat, p.lon, { admin1: p.admin1, admin2: p.admin2, country: p.country }); };
const gs = suggest($('#globalSearch'), onPick);
$('#globalSearch').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); gs.go(); document.getElementById('searchResetBtn')?.click(); } });

/* ---------- Find me: high-accuracy GPS ---------- */
$('#findMeButton').onclick = () => {
  if (!navigator.geolocation) return showToast('Location is not supported by this browser.');
  showToast('Getting your precise location…');
  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude: lat, longitude: lon, accuracy } = pos.coords; 
    meLayer.clearLayers();
    L.circle([lat, lon], { radius: accuracy, color: '#4a8dd8', weight: 1, fillOpacity: .12 }).addTo(meLayer);
    L.circleMarker([lat, lon], { radius: 8, color: '#fff', weight: 3, fillColor: '#2f6fed', fillOpacity: 1 }).addTo(meLayer).bindPopup('You are here');
    map.flyTo([lat, lon], accuracy < 200 ? 16 : 13); 
    $('.map-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    let name = 'Your location', meta = {};
    try { 
      const r = await getJSON(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=14&lat=${lat}&lon=${lon}`), a = r.address || {}; 
      name = a.suburb || a.village || a.town || a.city || a.county || name; 
      meta = { admin1: a.state, admin2: a.state_district || a.county, country: a.country }; 
    } catch { }
    showToast(`${name} · accuracy ±${Math.round(accuracy)} m`); 
    setCity(name, lat, lon, meta);
  }, err => showToast(err.code === 1 ? 'Location permission denied. Allow it in browser settings.' : 'Could not get location. Turn on GPS or try again.'), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
};

/* ---------- graph scrubbing ---------- */
function scrub(svg, labels, series) {
  if (!svg) return; 
  const wrap = svg.parentElement, n = labels.length; 
  wrap.style.position = 'relative'; 
  svg.style.touchAction = 'pan-y'; 
  svg.style.cursor = 'crosshair';
  const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); 
  ['y1:0', 'y2:220', 'stroke:currentColor', 'stroke-opacity:.4', 'vector-effect:non-scaling-stroke'].forEach(a => { 
    const [k, v] = a.split(':'); 
    ln.setAttribute(k, v); 
  }); 
  ln.style.display = 'none'; 
  svg.appendChild(ln);
  const tip = document.createElement('div'); 
  tip.className = 'chart-tip'; 
  wrap.appendChild(tip);
  const move = e => { 
    const r = svg.getBoundingClientRect(), f = clamp((e.clientX - r.left) / r.width, 0, 1), i = Math.round(f * (n - 1)), x = i / (n - 1) * 700, px = svg.offsetLeft + i / (n - 1) * svg.clientWidth;
    ln.setAttribute('x1', x); 
    ln.setAttribute('x2', x); 
    ln.style.display = ''; 
    tip.innerHTML = `<b>${esc(labels[i])}</b>` + series.map(s => `<span>${esc(s.name)}: <b>${s.vals[i]}${s.unit}</b></span>`).join(''); 
    tip.style.display = 'block'; 
    tip.style.left = clamp(px, 70, wrap.clientWidth - 70) + 'px'; 
  };
  svg.addEventListener('pointermove', move); 
  svg.addEventListener('pointerdown', move); 
  svg.addEventListener('pointerleave', () => { ln.style.display = 'none'; tip.style.display = 'none'; });
}

/* ---------- map: base layers & tools ---------- */
const CARTO_KEY = 'cb1_3w80_1_2861ab9e6b2586525a15305a'; 
const ck = u => u.includes('cartocdn') ? `${u}?key=${CARTO_KEY}` : u;
const BASES = { 
  normal: ['https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'], 
  dark: ['https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
  sat: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png'] 
};
let baseLayers = [];
function setBase(k) { 
  baseLayers.forEach(l => map.removeLayer(l)); 
  if (map._t) { map.removeLayer(map._t); map._t = null; }
  baseLayers = BASES[k].map((u, i) => L.tileLayer(ck(u), { subdomains: 'abcd', maxZoom: 19, zIndex: i + 1 }).addTo(map)); 
}
setBase('normal');
map.createPane('heat').style.cssText = 'z-index:350;filter:blur(16px);opacity:.78;pointer-events:none';
const heatLayer = L.layerGroup(), helpLayer = L.layerGroup(); 
let heatData = null;
const HS = [[0, [43, 108, 255]], [15, [47, 191, 155]], [25, [242, 211, 74]], [32, [247, 155, 46]], [38, [228, 71, 46]], [44, [161, 15, 58]], [50, [74, 10, 42]]];
const heatColor = t => { 
  if (t <= 0) return `rgb(${HS[0][1]})`; 
  for (let i = 1; i < HS.length; i++) {
    if (t <= HS[i][0]) { 
      const [a, ca] = HS[i - 1], [b, cb] = HS[i], f = (t - a) / (b - a); 
      return `rgb(${ca.map((v, k) => Math.round(v + (cb[k] - v) * f))})`; 
    }
  } 
  return `rgb(${HS[6][1]})`; 
};
$('.hb-scale i').style.background = `linear-gradient(90deg,${HS.map(([t, c]) => `rgb(${c})${t * 2}%`)})`;
const isOn = k => $(`[data-ov="${k}"]`).classList.contains('active');

let heatLoading = false;
async function loadHeat() {
  if (heatLoading) return;
  heatLoading = true;
  const b = map.getBounds(), S = Math.max(-80, b.getSouth()), N = Math.min(80, b.getNorth()), W = Math.max(-180, b.getWest()), E = Math.min(180, b.getEast()), nx = 8, ny = 6, dla = (N - S) / ny, dlo = (E - W) / nx, pts = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) pts.push([S + (j + .5) * dla, W + (i + .5) * dlo]);
  try {
    const d = await getJSON(`${WX}?latitude=${pts.map(p => p[0].toFixed(2))}&longitude=${pts.map(p => p[1].toFixed(2))}&hourly=temperature_2m&past_days=2&forecast_days=2&timezone=UTC`, 10 * 60 * 1000);
    heatData = { pts, arr: Array.isArray(d) ? d : [d], dla, dlo };
    drawHeat();
  } catch {
    /* Keep existing heat data if API is temporarily unavailable */
  } finally {
    heatLoading = false;
  }
}

function drawHeat() {
  if (!heatData) return; 
  const { pts, arr, dla, dlo } = heatData, times = arr[0].hourly.time, now = Math.max(0, times.findIndex(t => t.slice(0, 13) === new Date().toISOString().slice(0, 13))), h = +$('#hbRange').value, idx = clamp(now + h, 0, times.length - 1);
  heatLayer.clearLayers();
  pts.forEach((p, k) => { 
    const t = arr[k].hourly.temperature_2m[idx]; 
    if (t == null) return;
    L.rectangle([[p[0] - dla / 2, p[1] - dlo / 2], [p[0] + dla / 2, p[1] + dlo / 2]], { pane: 'heat', stroke: false, fillColor: heatColor(t), fillOpacity: 1, interactive: false }).addTo(heatLayer);
    L.marker(p, { interactive: false, icon: L.divIcon({ className: 'heat-lbl', html: Math.round(t) + '°', iconSize: [34, 18] }) }).addTo(heatLayer); 
  });
  $('#hbLabel').textContent = new Date(times[idx] + ':00Z').toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + (h === 0 ? ' · Now' : h < 0 ? ` · ${-h}h ago` : ` · in ${h}h`);
}

async function loadHelp() {
  if (map.getZoom() < 11) return showToast('Zoom into a city to see hospitals and drinking-water points.');
  const b = map.getBounds(), bb = `${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}`;
  try { 
    const d = await getJSON('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(`[out:json][timeout:15];(node["amenity"="hospital"](${bb});node["amenity"="drinking_water"](${bb}););out 80;`)); 
    helpLayer.clearLayers();
    d.elements.forEach(e => { 
      const hp = e.tags.amenity === 'hospital'; 
      L.circleMarker([e.lat, e.lon], { radius: hp ? 9 : 6, color: '#fff', weight: 2, fillColor: hp ? '#e5383b' : '#2f80ed', fillOpacity: .95 }).addTo(helpLayer).bindPopup(`<b>${esc(e.tags['name:en'] || e.tags.name || (hp ? 'Hospital' : 'Drinking water'))}</b><br>${hp ? 'Hospital · heat emergencies' : 'Free drinking water'}`); 
    }); 
  } catch { 
    showToast('Could not load nearby points.'); 
  }
}

$$('[data-base]').forEach(b => b.onclick = () => { $$('[data-base]').forEach(x => x.classList.toggle('active', x === b)); setBase(b.dataset.base); });$$('[data-ov]').forEach(b => b.onclick = () => { 
  const on = b.classList.toggle('active');
  if (b.dataset.ov === 'heat') { 
    on ? heatLayer.addTo(map) : map.removeLayer(heatLayer); 
    $('#heatBar').hidden = !on; 
    if (on) loadHeat(); 
  } else if (on) { 
    helpLayer.addTo(map); 
    loadHelp(); 
  } else {
    map.removeLayer(helpLayer); 
  }
});
$('#hbRange').oninput = drawHeat; 
$('#hbNow').onclick = () => { $('#hbRange').value = 0; drawHeat(); };

let mvT;
map.on('moveend', () => {
  clearTimeout(mvT);
  mvT = setTimeout(() => {
    if (isOn('heat')) loadHeat();
    if (isOn('help')) loadHelp();
  }, 1500);
});
setInterval(() => {
  if (isOn('heat')) loadHeat();
}, 10 * 60 * 1000);

/* ---------- KIRAN AI nowcast ---------- */
const erf = x => { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + .3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x)); };
const Phi = z => .5 * (1 + erf(z / Math.SQRT2));

function sunPos(lat, lon, d = new Date()) { 
  const r = Math.PI / 180, n = d / 864e5 + 2440587.5 - 2451545, L = (280.46 + .9856474 * n) % 360, g = (357.528 + .9856003 * n) % 360 * r, lam = (L + 1.915 * Math.sin(g) + .02 * Math.sin(2 * g)) * r, eps = 23.439 * r,
  dec = Math.asin(Math.sin(eps) * Math.sin(lam)), ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)), ha = (((18.697374558 + 24.06570982441908 * n) % 24) * 15 + lon) * r - ra, la = lat * r;
  return { el: Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha)) / r, az: (Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(ha)) / r + 360) % 360 }; 
}

let profile = 'General', aiLast = null; 
const PROF = { General: 40, 'Outdoor worker': 36, Elderly: 35, Child: 36, Pregnant: 35 };

async function runAI(lat, lon, name) {
  $('#aiCard').innerHTML = '<p class="eyebrow">KIRAN AI · working…</p>';
  try { 
    const d = await getJSON(`${WX}?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,shortwave_radiation,uv_index&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation&daily=temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto`); 
    aiLast = { d, name, lat, lon }; 
    drawAI(); 
  } catch { 
    $('#aiCard').innerHTML = '<p class="eyebrow">KIRAN AI</p><p>Live data unavailable. Check your connection.</p>'; 
  }
}

function drawAI() {
  const { d, name, lat, lon } = aiLast, c = d.current, h = d.hourly, thr = PROF[profile], i0 = Math.max(0, h.time.findIndex(t => t.slice(0, 13) === c.time.slice(0, 13))), tf = i0 + +c.time.slice(14, 16) / 60;
  const at = (a, x) => { const i = Math.floor(x); return a[i] + ((a[i + 1] ?? a[i]) - a[i]) * (x - i); }, r0 = c.temperature_2m - at(h.temperature_2m, tf);
  const P = dh => { 
    const x = tf + dh, T = at(h.temperature_2m, x) + r0 * Math.exp(-dh / (c.shortwave_radiation > 50 ? 3 : 6)), rh = clamp(at(h.relative_humidity_2m, x), 5, 100), ws = at(h.wind_speed_10m, x) / 3.6, q = .1 * at(h.shortwave_radiation, x),
    e = rh / 100 * 6.105 * Math.exp(17.27 * T / (237.7 + T)), AT = T + .348 * e - .7 * ws + .7 * q / (ws + 10) - 4.25, s = (dh > 12 ? 2 : .6 + .9 * Math.sqrt(dh)) * (1 + c.wind_speed_10m / 80);
    return { T, AT, s, p: Math.round((1 - Phi((thr - AT) / s)) * 100), conf: Math.round(clamp(100 - s * 12, 30, 95)) }; 
  };
  const hz = [['Next 30 min', .5], ['Next 1 hour', 1], ['Next 1 day', 24]].map(([l, dh]) => [l, P(dh)]), sun = sunPos(lat, lon), mxT = d.daily.temperature_2m_max[1], mnT = d.daily.temperature_2m_min[1], pMax = Math.round((1 - Phi((40 - mxT) / 2.2)) * 100), worst = Math.max(...hz.map(z => z[1].p));
  const dir = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(c.wind_direction_10m / 45) % 8], col = p => p >= 60 ? LC.Extreme : p >= 35 ? LC.High : p >= 15 ? LC.Moderate : LC.Safe;
  const inp = [['Temperature', c.temperature_2m + '°C'], ['Feels like', c.apparent_temperature + '°C'], ['Humidity', c.relative_humidity_2m + '%'], ['UV index', (c.uv_index ?? 0).toFixed(1)], ['Wind', `${c.wind_speed_10m} km/h from ${dir} (${c.wind_direction_10m}°)`], ['Today max / min', `${d.daily.temperature_2m_max[0]}° / ${d.daily.temperature_2m_min[0]}°`], ['Sun position', sun.el > 0 ? `${sun.el.toFixed(0)}° high, az ${sun.az.toFixed(0)}°` : 'Below horizon']];
  
  $('#aiCard').innerHTML = `<div class="section-heading"><div><p class="eyebrow">KIRAN AI · prediction for ${esc(name)}</p><h2>What the next hours look like.</h2></div></div>
  <div class="prof-row">${Object.keys(PROF).map(k => `<button class="map-control${k === profile ? ' active' : ''}" data-prof="${k}">${k}</button>`).join('')}</div>
  <div class="ai-grid">${hz.map(([l, z]) => `<article class="ai-tile" style="--c:${col(z.p)}"><p class="eyebrow">${l}</p><strong>${z.T.toFixed(1)}°<small> feels${z.AT.toFixed(0)}°</small></strong><div class="thermal-meter"><i style="width:${z.p}\%;background:${col(z.p)}"></i></div><p>Heat-stress chance <b>${z.p}%</b> · ±${z.s.toFixed(1)}° · confidence ${z.conf}%</p></article>`).join('')}</div>
  <p class="ai-line" style="border-color:${col(worst)}">${worst >= 60 ? 'High chance of heat stress: stay in shade or indoors, drink water now.' : worst >= 35 ? 'Rising heat: plan cool breaks and carry water.' : 'Low heat-stress chance in the next day for this profile.'} Tomorrow: max ${mxT}°, min ${mnT}°, chance of ≥40°C is <b>${pMax}%</b>.</p>
  <div class="ai-inputs">${inp.map(([k, v]) => `<span><small>${k}</small><b>${esc(v)}</b></span>`).join('')}</div>
  <p class="panel-lead" style="font-size:11px;margin-top:16px">Model: T̂(t+Δ) = Forecast(t+Δ) + (T₀ − Forecast(t₀))·e^(−Δ/τ) · Apparent temp from humidity, wind and solar load · σ = (0.6+0.9√Δ)·(1+wind/80) · P = 1 − Φ((threshold − AT̂)/σ). A statistical nowcast blending live data with the Open-Meteo model, not a trained ML model, and not an official warning. Threshold for ${profile}: ${thr}°C feels-like.</p>`;
  
  $$('[data-prof]',$('#aiCard')).forEach(b => {
    b.onclick = () => { 
      profile = b.dataset.prof; 
      drawAI(); 
    };
  });
}

/* UPDATE: Urban Heat Island Proxy */
setTimeout(() => {
  if (typeof HZ !== 'undefined' && HZ.calc) {
    HZ.calc.uhi = x => {
      const uhiScore = Math.round(clamp(((x.tmax || 35) - 30) * 3, 0, 100));
      return HZ.mk('Urban heat island', uhiScore, 85, 90, new Date().toISOString(), 'LIVE (Proxy)', false, null, ['City center traps more heat than rural areas.', `Live Max Temp: ${x.tmax}°C`], 'Use cool roofs and increase green cover.', [], {'Temperature Difference': 'LIVE (Open-Meteo Proxy)'});
    };
  }
}, 1000);

/* ---------- boot ---------- */
$('#liveDate').textContent = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
renderCards();

setCity(
  cur.name,
  cur.lat,
  cur.lon
);

I18N.onChange(() => renderCards());

setTimeout(() => {
  loadAlerts().catch(() => {
    $('#mapNote').textContent = 'NASA alerts unavailable';
  });
}, 1000);