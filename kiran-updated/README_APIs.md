# KIRAN heatwave build: APIs (baad me add karne ke liye)

## Abhi chal rahe hain (koi key nahi chahiye)
- Open-Meteo Forecast + Air Quality + Geocoding (temp, humidity, UV, 7-day forecast, PM2.5, ozone)
- NASA EONET (worldwide heat events)
- OpenStreetMap tiles + Nominatim (map, Find me)

## Baad me lagane wale (priority order)
1. Official heat alerts (worldwide): WMO Alert Hub CAP feeds, US NWS alerts API (free), MeteoAlarm (Europe, free), IMD (India, partnership/RSS). Ye `official_heatwave_alert` ka heuristic replace karenge.
2. Climatology (local heatwave threshold): Open-Meteo Historical/Climate API ya Copernicus ERA5 (free). `HZ.hot()` ka 40C / +5C proxy isse replace hoga.
3. SMS + OTP: Twilio ya MSG91. Email: Resend / SendGrid. Push: Firebase Cloud Messaging.
4. Backend + DB (Supabase / Firebase): login, saved places, subscriptions, aur ek cron job jo roz forecast check karke alert bheje.
5. Urban heat island: NASA AppEEARS (MODIS LST) ya Google Earth Engine (free key).
6. Population vulnerability: WorldPop / census (heat-health risk card ka placeholder).
7. Cooling centres / hospitals map: OSM Overpass API (free).
8. Reservoir / groundwater (dry-spell card): India CWC / India-WRIS.
9. AI assistant button: Claude API (server-side key).

## Files
- hazards.js: 12 heat-type formulas + 7-day early-warning outlook (`HZ.outlook`, `HZ.early`, `HZ.forecast`)
- live.js: map, worldwide heat alerts, city cards, report, search
