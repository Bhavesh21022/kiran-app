'use strict';
/* ============================================================================
   KIRAN i18n: English, Hindi, Gujarati, Tamil.
   Covers the static app frame (nav, hero, cards, footer, panels, safety tips).
   Live scientific text generated in hazards.js/live.js (hazard details,
   recommendations, 7-day forecast lines) stays in English for now — see README.
   IMPORTANT: these are best-effort translations. Please have a native speaker
   review Gujarati and Tamil copy before a formal demo.
   ============================================================================ */
(function () {
  const LANGS = [
    { code: 'en', native: 'English' },
    { code: 'hi', native: 'हिंदी' },
    { code: 'gu', native: 'ગુજરાતી' },
    { code: 'ta', native: 'தமிழ்' },
  ];

  const prec = (before, during, hydration, signs, vulnerable, emergency) => ({ before, during, hydration, signs, vulnerable, emergency });

  const T = {
    en: {
      nav: { home: 'Home', alerts: 'Alerts', modelPerformance: 'Model performance', history: 'History', settings: 'Settings', about: 'About' },
      search_ph: 'Search city, state or country',
      live_label: 'Live thermal intelligence',
      greeting: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
      tagline: 'Stay cool. Stay aware.',
      national_average: 'National average', india_heatwave_risk: 'India heatwave risk',
      sos_small: 'Emergency support', sos_label: 'SOS',
      findme_small: 'Your location', findme_label: 'Find me',
      situation_map: 'Situation map', live_conditions: 'Live conditions', tracking: 'Tracking',
      map_all: 'All', map_alerts: 'Alerts', map_risk: 'Risk', map_normal: 'Normal', map_sat: 'Satellite', map_dark: 'Dark', map_heat: 'Heat map', map_help: 'Hospitals & water',
      loading_signals: 'Loading live signals…',
      monitor_by: 'Monitor by heat type', heat_signals: 'Heatwave signals', show_all: 'Show all',
      live_risk: 'Live risk · tracked cities', heat_by_place: 'Heatwave risk by place', explore_signals: 'Explore signals',
      risk_activity: 'Risk activity · India', signals_over_time: 'Signals over time', last_30: 'Last 30 days',
      current_city_score: 'Current city score', loading: 'Loading…', kiran_ai: 'KIRAN AI',
      early_warning_personal: 'Early warning, made personal', get_alerts: 'Get heatwave alerts.', get_alerts_desc: 'Receive a calm, useful signal for the places that matter to you.',
      email: 'Email', phone: 'Phone', city_area: 'City / area code', continue_verify: 'Continue to verification',
      precautions_h: 'Heatwave precautions', small_actions: 'Small actions. Real protection.', preparedness_guide: 'Preparedness guide',
      prec: prec(
        { t: 'Before heatwave', d: 'Plan shade, drinking water, light clothing, and check-ins before temperatures rise. Charge your phone and keep medicines ready.' },
        { t: 'During extreme heat', d: 'Stay in the coolest room, close curtains, avoid 12–4 pm sun, and take frequent rest breaks. Never leave anyone in a parked vehicle.' },
        { t: 'Hydration', d: 'Sip water regularly, even when you are not thirsty. Use ORS after heavy sweating and avoid alcohol or very sugary drinks.' },
        { t: 'Signs of heat stress', d: 'Headache, dizziness, cramps, nausea, unusual tiredness, or heavy sweating need cooling and rest. Confusion or fainting is an emergency.' },
        { t: 'Children & elderly', d: 'Check children, older adults, pregnant people, and people with chronic illness every few hours. Keep them cool and hydrated.' },
        { t: 'Emergency action', d: 'Move to shade, loosen clothing, cool the body with wet cloths, and call 112 or 108 for confusion, fainting, or unconsciousness.' }
      ),
      humidity_h: 'Humidity & heat stress', humidity_title: 'Why humid heat feels heavier.',
      humidity_desc: 'Humidity slows sweat evaporation, so your body loses heat less efficiently. That is why a warm, sticky day can feel much hotter than the thermometer suggests. At 35°C with high humidity, heat stress can build quickly: drink more often, reduce outdoor exertion, choose shade, and take cooling breaks.',
      learn_humidity: 'Learn about humidity',
      footer_tag: 'Clear signals for a changing world.', explore: 'Explore', how_to_use: 'How to use', connect: 'Connect', instagram: 'Instagram', contact_us: 'Contact us', privacy: 'Privacy',
      copyright: '© 2026 KIRAN · Built for safer tomorrows',
      lang_name: 'English',
      pages: {
        contact: { kicker: 'Contact', title: 'Talk to the KIRAN team.', lead: 'Questions or ideas are welcome.', tiles: [['Email', 'hello@kiran.earth'], ['Instagram', 'Coming soon']] },
        privacy: { kicker: 'Privacy', title: 'Your data, kept simple.', lead: 'What KIRAN uses, and why.', tiles: [['Location', 'Used only to show local weather.'], ['Alerts', 'Your email and phone are used only for the alerts you ask for.'], ['Data sources', 'Open-Meteo weather, NASA EONET heat events, map by OpenStreetMap.']] },
        home: { kicker: 'Dashboard', title: 'What is happening near you.', lead: 'KIRAN shows live weather, heat risk, and early warnings in one simple view.', tiles: [['Live map', 'See conditions change on the map.'], ['City score', 'A simple 0-100 heat risk score.'], ['Early alerts', 'Get a warning before the heat rises.']] },
        alerts: { kicker: 'Alerts', title: 'Heatwave alerts.', lead: 'Heatwave alerts and early warnings from around the world.', tiles: [] },
        'model-performance': { kicker: 'Model performance', title: 'How well KIRAN works.', lead: "See how accurate and fast KIRAN's heat predictions are.", tiles: [['Accuracy', '92.4% average forecast accuracy across monitored regions.'], ['Speed', 'Signals processed and surfaced in under 90 seconds.'], ['Coverage', '1,248 locations connected across 28 states.']] },
        history: { kicker: 'History', title: 'What happened before.', lead: 'Review past alerts and saved places.', tiles: [['September 2026', '12 alerts reviewed · 2 were serious'], ['August 2026', '8 alerts reviewed · 1 was serious'], ['Saved places', 'Vadodara · Mumbai · New Delhi']] },
        settings: { kicker: 'Settings', title: 'Make KIRAN yours.', lead: 'Change your theme, language, saved places, and alert settings.', tiles: [['Appearance', 'Light mode'], ['Alert radius', 'Within 25 km of your saved places'], ['Notifications', 'Alerts on · Quiet hours 22:00–07:00']] },
        about: { kicker: 'About KIRAN', title: 'Simple heat warnings for everyone.', lead: 'KIRAN turns weather data into clear, simple warnings that anyone can understand and act on.', tiles: [['Our purpose', 'Make heat safety simple for every age group.'], ['Data promise', 'We use open, trusted weather data.'], ['Contact', 'hello@kiran.earth']] },
        precautions: { kicker: 'Precautions', title: 'Small steps. Real safety.', lead: 'Practical guidance for before, during, and after a hot day. Follow official local warnings for emergencies.', tiles: [['Before heat', 'Plan shade, drinking water, light clothing, medicines, and check-ins. Charge your phone before temperatures rise.'], ['During heat', 'Stay in the coolest room, shade windows, avoid 12–4 pm sun, and take regular cooling breaks. Never leave anyone in a parked vehicle.'], ['Hydration', 'Sip water regularly instead of waiting for thirst. Use ORS after heavy sweating and avoid alcohol or very sugary drinks.'], ['Warning signs', 'Headache, dizziness, cramps, nausea, or unusual tiredness need cooling and rest. Confusion or fainting needs urgent medical help.'], ['Vulnerable people', 'Check children, older adults, pregnant people, and people with chronic illness every few hours. Keep them cool and hydrated.'], ['Emergency action', 'Move to shade, loosen clothing, cool the body with wet cloths, and call 112 or 108 for confusion, fainting, or unconsciousness.']] },
        'how-to-use': { kicker: 'How to use', title: 'Three simple steps.', lead: 'Start with the map, check the signals, and save what matters to you.', tiles: [['1. Look', 'Use the map to see the overall heat picture.'], ['2. Choose', 'Pick a heat type or search your city.'], ['3. Prepare', 'Turn on alerts and follow the safety steps.']] },
      },
      login: { kicker: 'KIRAN account', title: 'Welcome back.', lead: 'Log in to save locations, receive alerts, and personalize your heatwave dashboard.', email_label: 'Email', email_ph: 'you@example.com', password_label: 'Password', password_ph: 'Your password', login_btn: 'Log in', demo: 'Use demo account' },
      profile: { hello: 'Hello, ', lead: 'Your saved places and alerts will appear here.', logout: 'Log out' },
      menu: { kicker: 'KIRAN navigation', title_html: 'Stay curious.<br><em>Stay ready.</em>', open_full: 'Open full {label} view', theme_title: '☼ Day / light mode', theme_desc: 'Switch between light and dark appearance', lang_title: '🌐 Language', lang_desc: 'Choose your preferred language' },
      emergency: { kicker: 'Emergency assistance', title: 'Help is close.', lead: 'Choose the service you need. Numbers are configurable placeholders until a verified regional emergency directory is connected.',
        services: [['✦', 'NDRF', 'Disaster response', '1078'], ['⌁', 'Police', 'Immediate safety assistance', '112'], ['♨', 'Fire & Rescue', 'Fire and rescue response', '101'], ['✚', 'Ambulance', 'Medical emergency response', '108']], call: 'Call {n}' },
      subscription: { step2_eyebrow: 'Step 2 of 3 · Safe demo flow', step2_title: 'Verify your details', step2_lead: 'A real OTP service is not connected yet. Enter any 6-digit demo code to preview the next step.', otp_label: 'Verification code', verify_btn: 'Verify subscription', step3_eyebrow: 'Step 3 of 3', step3_title: 'You are prepared.', step3_lead: 'Heatwave alerts are ready for your saved place in this demo flow.' },
      toasts: { dark_on: 'Dark mode enabled.', day_on: 'Day mode enabled.', logged_in: 'You are logged in. Your KIRAN profile is ready.', logged_out: 'You are logged out.', lang_set: 'Language changed to {lang}.', chatbot: 'AI assistant demo ready — live AI connection can be added later.' },
      blabel: { LOW: 'Safe', MODERATE: 'Moderate', HIGH: 'High', EXTREME: 'Extreme' },
      tips: {
        Safe: ['Normal outdoor activity is fine.', 'Carry water and stay hydrated through the day.'],
        Moderate: ['Drink water regularly, even if you are not thirsty.', 'Take breaks in shade during long outdoor work.', 'Wear light, loose, light-coloured clothing.'],
        High: ['Avoid direct sun between 12 and 4 PM.', 'Drink water or ORS often; limit tea, coffee and alcohol.', 'Check on children, elderly people and outdoor workers every few hours.', 'Never leave children or pets in a parked vehicle.'],
        Extreme: ['Stay indoors in the afternoon; go out only if essential.', 'Drink water or ORS every 20-30 minutes.', 'Dizziness, cramps or confusion: move to shade, cool the body and call 108/112.', 'Keep windows shaded and use a fan or cooler; take cool showers.'],
      },
      hazardNames: { heatwave: 'Heatwave', severe: 'Severe heatwave', anomaly: 'Temperature anomaly', warmnight: 'Warm-night heat', humid: 'Humid heat', wbgt: 'Heat stress (WBGT)', prolonged: 'Prolonged heat spell', uv: 'Sun & UV load', heataq: 'Heat + smog', dryspell: 'Dry spell & water stress', health: 'Heat-health risk', uhi: 'Urban heat island' },
    },

    hi: {
      nav: { home: 'होम', alerts: 'चेतावनी', modelPerformance: 'मॉडल प्रदर्शन', history: 'इतिहास', settings: 'सेटिंग्स', about: 'बारे में' },
      search_ph: 'शहर, राज्य या देश खोजें',
      live_label: 'लाइव ताप जानकारी',
      greeting: { morning: 'सुप्रभात', afternoon: 'नमस्ते', evening: 'शुभ संध्या' },
      tagline: 'ठंडे रहें। सतर्क रहें।',
      national_average: 'राष्ट्रीय औसत', india_heatwave_risk: 'भारत में लू का जोखिम',
      sos_small: 'आपातकालीन सहायता', sos_label: 'SOS',
      findme_small: 'आपका स्थान', findme_label: 'मुझे खोजें',
      situation_map: 'स्थिति मानचित्र', live_conditions: 'लाइव स्थिति', tracking: 'ट्रैकिंग',
      map_all: 'सभी', map_alerts: 'चेतावनी', map_risk: 'जोखिम', map_normal: 'सामान्य', map_sat: 'उपग्रह', map_dark: 'डार्क', map_heat: 'ताप मानचित्र', map_help: 'अस्पताल और पानी',
      loading_signals: 'लाइव जानकारी लोड हो रही है…',
      monitor_by: 'गर्मी के प्रकार अनुसार देखें', heat_signals: 'लू के संकेत', show_all: 'सभी देखें',
      live_risk: 'लाइव जोखिम · निगरानी वाले शहर', heat_by_place: 'स्थान अनुसार लू का जोखिम', explore_signals: 'संकेत देखें',
      risk_activity: 'जोखिम गतिविधि · भारत', signals_over_time: 'समय के साथ संकेत', last_30: 'पिछले 30 दिन',
      current_city_score: 'वर्तमान शहर स्कोर', loading: 'लोड हो रहा है…', kiran_ai: 'KIRAN AI',
      early_warning_personal: 'व्यक्तिगत जल्दी चेतावनी', get_alerts: 'लू की चेतावनी पाएं।', get_alerts_desc: 'आपके लिए महत्वपूर्ण स्थानों के लिए शांत, उपयोगी संकेत पाएं।',
      email: 'ईमेल', phone: 'फ़ोन', city_area: 'शहर / क्षेत्र', continue_verify: 'सत्यापन जारी रखें',
      precautions_h: 'लू से बचाव', small_actions: 'छोटे कदम। असली सुरक्षा।', preparedness_guide: 'तैयारी गाइड',
      prec: prec(
        { t: 'लू से पहले', d: 'छाया, पानी, हल्के कपड़े और हाल-चाल की योजना बनाएं। फोन चार्ज रखें और जरूरी दवाएं साथ रखें।' },
        { t: 'अत्यधिक गर्मी के दौरान', d: 'सबसे ठंडे कमरे में रहें, पर्दे बंद रखें, दोपहर 12–4 बजे की धूप से बचें और बार-बार आराम करें।' },
        { t: 'जलयोजन', d: 'प्यास न लगने पर भी थोड़ी-थोड़ी देर में पानी पिएं। ज्यादा पसीना आने पर ORS लें और शराब या बहुत मीठे पेय से बचें।' },
        { t: 'गर्मी के तनाव के लक्षण', d: 'सिरदर्द, चक्कर, ऐंठन, जी मिचलाना या बहुत थकान हो तो ठंडी जगह आराम करें। भ्रम या बेहोशी आपातकाल है।' },
        { t: 'बच्चे और बुज़ुर्ग', d: 'बच्चों, बुज़ुर्गों, गर्भवती लोगों और पुरानी बीमारी वाले लोगों की हर कुछ घंटों में जांच करें।' },
        { t: 'आपातकालीन कार्रवाई', d: 'छाया में जाएं, कपड़े ढीले करें, गीले कपड़े से शरीर ठंडा करें और भ्रम या बेहोशी में 112 या 108 पर कॉल करें।' }
      ),
      humidity_h: 'नमी और गर्मी का तनाव', humidity_title: 'नम गर्मी भारी क्यों लगती है।',
      humidity_desc: 'नमी बढ़ने पर पसीना धीरे वाष्पित होता है और शरीर कम प्रभावी ढंग से ठंडा होता है। इसलिए चिपचिपा मौसम थर्मामीटर से ज्यादा गर्म महसूस हो सकता है। 35°C और अधिक नमी में छाया चुनें, पानी ज्यादा पिएं, मेहनत कम करें और बार-बार ठंडा होने का ब्रेक लें।',
      learn_humidity: 'नमी के बारे में जानें',
      footer_tag: 'बदलती दुनिया के लिए स्पष्ट संकेत।', explore: 'खोजें', how_to_use: 'उपयोग कैसे करें', connect: 'संपर्क करें', instagram: 'Instagram', contact_us: 'संपर्क करें', privacy: 'गोपनीयता',
      copyright: '© 2026 KIRAN · सुरक्षित कल के लिए बनाया गया',
      lang_name: 'हिंदी',
      pages: {
        contact: { kicker: 'संपर्क', title: 'KIRAN टीम से बात करें।', lead: 'सवाल या सुझाव आपका स्वागत है।', tiles: [['ईमेल', 'hello@kiran.earth'], ['Instagram', 'जल्द आ रहा है']] },
        privacy: { kicker: 'गोपनीयता', title: 'आपका डेटा, सरल रखा गया।', lead: 'KIRAN क्या उपयोग करता है, और क्यों।', tiles: [['स्थान', 'केवल स्थानीय मौसम दिखाने के लिए उपयोग किया जाता है।'], ['चेतावनी', 'आपका ईमेल और फ़ोन केवल आपकी मांगी गई चेतावनियों के लिए उपयोग होता है।'], ['डेटा स्रोत', 'Open-Meteo मौसम, NASA EONET ताप घटनाएं, मानचित्र OpenStreetMap द्वारा।']] },
        home: { kicker: 'डैशबोर्ड', title: 'आपके आस-पास क्या हो रहा है।', lead: 'KIRAN लाइव मौसम, गर्मी का जोखिम और शुरुआती चेतावनी एक ही जगह दिखाता है।', tiles: [['लाइव मानचित्र', 'मानचित्र पर बदलती स्थिति देखें।'], ['शहर स्कोर', 'एक सरल 0-100 गर्मी जोखिम स्कोर।'], ['जल्दी चेतावनी', 'गर्मी बढ़ने से पहले चेतावनी पाएं।']] },
        alerts: { kicker: 'चेतावनी', title: 'लू की चेतावनी।', lead: 'दुनिया भर से लू की चेतावनी और शुरुआती संकेत।', tiles: [] },
        'model-performance': { kicker: 'मॉडल प्रदर्शन', title: 'KIRAN कितनी अच्छी तरह काम करता है।', lead: 'देखें KIRAN की गर्मी भविष्यवाणी कितनी सटीक और तेज़ है।', tiles: [['सटीकता', 'निगरानी वाले क्षेत्रों में औसतन 92.4% सटीकता।'], ['गति', '90 सेकंड से कम में संकेत तैयार।'], ['कवरेज', '28 राज्यों में 1,248 स्थान जुड़े हैं।']] },
        history: { kicker: 'इतिहास', title: 'पहले क्या हुआ।', lead: 'पिछली चेतावनी और सहेजे गए स्थान देखें।', tiles: [['सितंबर 2026', '12 चेतावनी जांची गईं · 2 गंभीर थीं'], ['अगस्त 2026', '8 चेतावनी जांची गईं · 1 गंभीर थी'], ['सहेजे गए स्थान', 'वडोदरा · मुंबई · नई दिल्ली']] },
        settings: { kicker: 'सेटिंग्स', title: 'KIRAN को अपने अनुसार बनाएं।', lead: 'थीम, भाषा, सहेजे गए स्थान और चेतावनी सेटिंग्स बदलें।', tiles: [['रूप', 'लाइट मोड'], ['चेतावनी दायरा', 'आपके सहेजे गए स्थानों से 25 किमी के भीतर'], ['सूचनाएं', 'चेतावनी चालू · शांत समय 22:00–07:00']] },
        about: { kicker: 'KIRAN के बारे में', title: 'सभी के लिए सरल गर्मी चेतावनी।', lead: 'KIRAN मौसम डेटा को स्पष्ट, सरल चेतावनियों में बदलता है जिन्हें कोई भी समझ और उन पर कार्य कर सकता है।', tiles: [['हमारा उद्देश्य', 'हर उम्र के लिए गर्मी से सुरक्षा को सरल बनाना।'], ['डेटा वादा', 'हम खुले, भरोसेमंद मौसम डेटा का उपयोग करते हैं।'], ['संपर्क', 'hello@kiran.earth']] },
        precautions: { kicker: 'सावधानियां', title: 'छोटे कदम। असली सुरक्षा।', lead: 'गर्मी से पहले, गर्मी के दौरान और आपात स्थिति में काम आने वाली व्यावहारिक सलाह।', tiles: [['गर्मी से पहले', 'छाया, पानी, हल्के कपड़े और जरूरी दवाओं की तैयारी करें। तापमान बढ़ने से पहले फोन चार्ज रखें।'], ['गर्मी के दौरान', 'सबसे ठंडे कमरे में रहें, खिड़कियों पर पर्दे रखें, 12–4 बजे की धूप से बचें और ठंडा होने के ब्रेक लें।'], ['जलयोजन', 'प्यास का इंतज़ार किए बिना थोड़ी-थोड़ी देर में पानी पिएं। ज्यादा पसीना आने पर ORS लें और शराब या बहुत मीठे पेय से बचें।'], ['चेतावनी संकेत', 'सिरदर्द, चक्कर, ऐंठन, जी मिचलाना या असामान्य थकान में ठंडी जगह आराम करें। भ्रम या बेहोशी में तुरंत चिकित्सा सहायता लें।'], ['संवेदनशील लोग', 'बच्चों, बुज़ुर्गों, गर्भवती लोगों और पुरानी बीमारी वाले लोगों की हर कुछ घंटों में जांच करें।'], ['आपातकालीन कार्रवाई', 'छाया में जाएं, कपड़े ढीले करें, गीले कपड़े से शरीर ठंडा करें और भ्रम, बेहोशी या अचेत अवस्था में 112 या 108 पर कॉल करें।']] },
        'how-to-use': { kicker: 'उपयोग कैसे करें', title: 'तीन सरल चरण।', lead: 'मानचित्र से शुरू करें, संकेत जांचें और जो जरूरी है उसे सहेजें।', tiles: [['1. देखें', 'कुल गर्मी की स्थिति देखने के लिए मानचित्र का उपयोग करें।'], ['2. चुनें', 'गर्मी का प्रकार चुनें या अपना शहर खोजें।'], ['3. तैयार रहें', 'चेतावनी चालू करें और सुरक्षा कदमों का पालन करें।']] },
      },
      login: { kicker: 'KIRAN खाता', title: 'वापसी पर स्वागत है।', lead: 'स्थान सहेजने, चेतावनी पाने और अपने डैशबोर्ड को अनुकूलित करने के लिए लॉग इन करें।', email_label: 'ईमेल', email_ph: 'you@example.com', password_label: 'पासवर्ड', password_ph: 'आपका पासवर्ड', login_btn: 'लॉग इन करें', demo: 'डेमो खाता उपयोग करें' },
      profile: { hello: 'नमस्ते, ', lead: 'आपके सहेजे गए स्थान और चेतावनी यहाँ दिखेंगी।', logout: 'लॉग आउट करें' },
      menu: { kicker: 'KIRAN नेविगेशन', title_html: 'जिज्ञासु रहें।<br><em>तैयार रहें।</em>', open_full: '{label} का पूरा दृश्य खोलें', theme_title: '☼ दिन / लाइट मोड', theme_desc: 'लाइट और डार्क थीम के बीच बदलें', lang_title: '🌐 भाषा', lang_desc: 'अपनी पसंदीदा भाषा चुनें' },
      emergency: { kicker: 'आपातकालीन सहायता', title: 'मदद पास है।', lead: 'आपको जो सेवा चाहिए उसे चुनें। सत्यापित क्षेत्रीय आपातकालीन निर्देशिका जुड़ने तक ये नंबर अस्थायी हैं।',
        services: [['✦', 'NDRF', 'आपदा प्रतिक्रिया', '1078'], ['⌁', 'पुलिस', 'तुरंत सुरक्षा सहायता', '112'], ['♨', 'अग्निशमन और बचाव', 'आग और बचाव सेवा', '101'], ['✚', 'एम्बुलेंस', 'चिकित्सा आपातकालीन सेवा', '108']], call: '{n} पर कॉल करें' },
      subscription: { step2_eyebrow: 'चरण 2 का 3 · सुरक्षित डेमो', step2_title: 'अपनी जानकारी सत्यापित करें', step2_lead: 'असली OTP सेवा अभी नहीं जुड़ी है। अगले चरण के लिए कोई भी 6 अंकों का डेमो कोड दर्ज करें।', otp_label: 'सत्यापन कोड', verify_btn: 'सदस्यता सत्यापित करें', step3_eyebrow: 'चरण 3 का 3', step3_title: 'आप तैयार हैं।', step3_lead: 'इस डेमो में आपके स्थान के लिए लू की चेतावनी तैयार है।' },
      toasts: { dark_on: 'डार्क मोड चालू।', day_on: 'डे मोड चालू।', logged_in: 'आप लॉग इन हो गए हैं। आपकी KIRAN प्रोफ़ाइल तैयार है।', logged_out: 'आप लॉग आउट हो गए हैं।', lang_set: 'भाषा {lang} में बदल दी गई।', chatbot: 'AI सहायक डेमो तैयार है — असली AI बाद में जोड़ा जा सकता है।' },
      blabel: { LOW: 'सुरक्षित', MODERATE: 'मध्यम', HIGH: 'उच्च', EXTREME: 'अत्यधिक' },
      tips: {
        Safe: ['सामान्य बाहरी गतिविधि ठीक है।', 'दिन भर पानी साथ रखें और शरीर में पानी की कमी न होने दें।'],
        Moderate: ['थोड़ी-थोड़ी देर में पानी पिएं, भले ही प्यास न लगे।', 'लंबे समय तक बाहर काम करते समय छाया में आराम करें।', 'हल्के, ढीले और हल्के रंग के कपड़े पहनें।'],
        High: ['दोपहर 12 से शाम 4 बजे के बीच सीधी धूप से बचें।', 'पानी या ओआरएस बार-बार पिएं; चाय, कॉफी और शराब कम लें।', 'बच्चों, बुज़ुर्गों और बाहर काम करने वालों की हर कुछ घंटों में जांच करें।', 'बच्चों या पालतू जानवरों को कभी भी खड़ी गाड़ी में अकेला न छोड़ें।'],
        Extreme: ['दोपहर में घर के अंदर रहें; बहुत जरूरी होने पर ही बाहर जाएं।', 'हर 20-30 मिनट में पानी या ओआरएस पिएं।', 'चक्कर, ऐंठन या भ्रम महसूस हो तो छाया में जाएं, शरीर को ठंडा करें और 108/112 पर कॉल करें।', 'खिड़कियों पर पर्दा रखें, पंखा या कूलर चलाएं और ठंडे पानी से नहाएं।'],
      },
      hazardNames: { heatwave: 'लू', severe: 'गंभीर लू', anomaly: 'तापमान असामान्यता', warmnight: 'गर्म रात की गर्मी', humid: 'नम गर्मी', wbgt: 'ताप तनाव (WBGT)', prolonged: 'लंबी गर्मी की अवधि', uv: 'सूर्य व UV भार', heataq: 'गर्मी + धुंध', dryspell: 'सूखा व जल संकट', health: 'गर्मी-स्वास्थ्य जोखिम', uhi: 'शहरी ताप द्वीप' },
    },

    gu: {
      nav: { home: 'હોમ', alerts: 'ચેતવણી', modelPerformance: 'મોડલ કામગીરી', history: 'ઇતિહાસ', settings: 'સેટિંગ્સ', about: 'વિશે' },
      search_ph: 'શહેર, રાજ્ય અથવા દેશ શોધો',
      live_label: 'લાઇવ ગરમી માહિતી',
      greeting: { morning: 'સુપ્રભાત', afternoon: 'નમસ્તે', evening: 'શુભ સાંજ' },
      tagline: 'ઠંડા રહો. સજાગ રહો.',
      national_average: 'રાષ્ટ્રીય સરેરાશ', india_heatwave_risk: 'ભારતમાં ગરમીના મોજાનું જોખમ',
      sos_small: 'કટોકટી સહાય', sos_label: 'SOS',
      findme_small: 'તમારું સ્થાન', findme_label: 'મને શોધો',
      situation_map: 'સ્થિતિ નકશો', live_conditions: 'લાઇવ સ્થિતિ', tracking: 'ટ્રેકિંગ',
      map_all: 'બધા', map_alerts: 'ચેતવણી', map_risk: 'જોખમ', map_normal: 'સામાન્ય', map_sat: 'ઉપગ્રહ', map_dark: 'ડાર્ક', map_heat: 'ગરમીનો નકશો', map_help: 'હોસ્પિટલ અને પાણી',
      loading_signals: 'લાઇવ માહિતી લોડ થઈ રહી છે…',
      monitor_by: 'ગરમીના પ્રકાર મુજબ જુઓ', heat_signals: 'ગરમીના મોજાના સંકેત', show_all: 'બધું જુઓ',
      live_risk: 'લાઇવ જોખમ · મોનિટર થયેલા શહેરો', heat_by_place: 'સ્થળ મુજબ ગરમીનું જોખમ', explore_signals: 'સંકેત જુઓ',
      risk_activity: 'જોખમ પ્રવૃત્તિ · ભારત', signals_over_time: 'સમય સાથે સંકેત', last_30: 'છેલ્લા 30 દિવસ',
      current_city_score: 'વર્તમાન શહેર સ્કોર', loading: 'લોડ થઈ રહ્યું છે…', kiran_ai: 'KIRAN AI',
      early_warning_personal: 'વ્યક્તિગત વહેલી ચેતવણી', get_alerts: 'ગરમીના મોજાની ચેતવણી મેળવો.', get_alerts_desc: 'તમારા માટે મહત્વના સ્થળો માટે શાંત, ઉપયોગી સંકેત મેળવો.',
      email: 'ઈમેલ', phone: 'ફોન', city_area: 'શહેર / વિસ્તાર', continue_verify: 'ચકાસણી માટે આગળ વધો',
      precautions_h: 'ગરમીના મોજાથી બચાવ', small_actions: 'નાના પગલાં. સાચી સુરક્ષા.', preparedness_guide: 'તૈયારી માર્ગદર્શિકા',
      prec: prec(
        { t: 'ગરમીના મોજા પહેલાં', d: 'તાપમાન વધે તે પહેલાં છાયા, પાણી અને ખબર-અંતરની યોજના બનાવો.' },
        { t: 'અતિશય ગરમી દરમિયાન', d: 'ઘરની અંદર ઠંડા રહો, બપોરના તડકાથી બચો અને ધીમે ચાલો.' },
        { t: 'હાઇડ્રેશન', d: 'વારંવાર પાણી પીવો. તરસ લાગે ત્યાં સુધી રાહ ન જુઓ.' },
        { t: 'ગરમીના તણાવના ચિહ્નો', d: 'ચક્કર, મૂંઝવણ, ખેંચ કે ઉબકા - તાત્કાલિક ધ્યાન આપો.' },
        { t: 'બાળકો અને વૃદ્ધો', d: 'ગરમી પ્રત્યે વધુ સંવેદનશીલ લોકોની દર થોડા કલાકે તપાસ કરો.' },
        { t: 'કટોકટીની ક્રિયા', d: 'છાયામાં જાવ, શરીરને ઠંડું કરો અને કટોકટી સેવાઓનો સંપર્ક કરો.' }
      ),
      humidity_h: 'ભેજ અને ગરમીનો તણાવ', humidity_title: 'ભેજવાળી ગરમી કેમ ભારે લાગે છે.',
      humidity_desc: 'ભેજ વધે ત્યારે પરસેવો બાષ્પીભવન થઈ શકતો નથી અને શરીર પોતાને ઠંડું કરી શકતું નથી. લગભગ 60% ભેજ પર, 35°C એ 45°C જેવું લાગી શકે છે.',
      learn_humidity: 'ભેજ વિશે જાણો',
      footer_tag: 'બદલાતી દુનિયા માટે સ્પષ્ટ સંકેત.', explore: 'શોધો', how_to_use: 'કેવી રીતે ઉપયોગ કરવો', connect: 'જોડાઓ', instagram: 'Instagram', contact_us: 'અમારો સંપર્ક કરો', privacy: 'ગોપનીયતા',
      copyright: '© 2026 KIRAN · સુરક્ષિત આવતીકાલ માટે બનાવેલ',
      lang_name: 'ગુજરાતી',
      pages: {
        contact: { kicker: 'સંપર્ક', title: 'KIRAN ટીમ સાથે વાત કરો.', lead: 'પ્રશ્નો કે વિચારોનું સ્વાગત છે.', tiles: [['ઈમેલ', 'hello@kiran.earth'], ['Instagram', 'ટૂંક સમયમાં']] },
        privacy: { kicker: 'ગોપનીયતા', title: 'તમારો ડેટા, સરળ રાખેલો.', lead: 'KIRAN શું વાપરે છે, અને શા માટે.', tiles: [['સ્થાન', 'ફક્ત સ્થાનિક હવામાન બતાવવા વપરાય છે.'], ['ચેતવણી', 'તમારો ઈમેલ અને ફોન ફક્ત તમે માંગેલી ચેતવણી માટે વપરાય છે.'], ['ડેટા સ્ત્રોત', 'Open-Meteo હવામાન, NASA EONET ગરમીની ઘટનાઓ, નકશો OpenStreetMap દ્વારા.']] },
        home: { kicker: 'ડેશબોર્ડ', title: 'તમારી આસપાસ શું થઈ રહ્યું છે.', lead: 'KIRAN લાઇવ હવામાન, ગરમીનું જોખમ અને વહેલી ચેતવણી એક જ જગ્યાએ બતાવે છે.', tiles: [['લાઇવ નકશો', 'નકશા પર બદલાતી સ્થિતિ જુઓ.'], ['શહેર સ્કોર', 'એક સરળ 0-100 ગરમી જોખમ સ્કોર.'], ['વહેલી ચેતવણી', 'ગરમી વધે તે પહેલાં ચેતવણી મેળવો.']] },
        alerts: { kicker: 'ચેતવણી', title: 'ગરમીના મોજાની ચેતવણી.', lead: 'દુનિયાભરમાંથી ગરમીના મોજાની ચેતવણી અને વહેલા સંકેત.', tiles: [] },
        'model-performance': { kicker: 'મોડલ કામગીરી', title: 'KIRAN કેટલું સારું કામ કરે છે.', lead: 'જુઓ KIRANની ગરમીની આગાહી કેટલી સચોટ અને ઝડપી છે.', tiles: [['ચોકસાઈ', 'મોનિટર થયેલા વિસ્તારોમાં સરેરાશ 92.4% સચોટતા.'], ['ઝડપ', '90 સેકન્ડથી ઓછા સમયમાં સંકેત તૈયાર.'], ['કવરેજ', '28 રાજ્યોમાં 1,248 સ્થળો જોડાયેલા છે.']] },
        history: { kicker: 'ઇતિહાસ', title: 'પહેલાં શું થયું.', lead: 'જૂની ચેતવણી અને સાચવેલા સ્થળો જુઓ.', tiles: [['સપ્ટેમ્બર 2026', '12 ચેતવણી તપાસી · 2 ગંભીર હતી'], ['ઓગસ્ટ 2026', '8 ચેતવણી તપાસી · 1 ગંભીર હતી'], ['સાચવેલા સ્થળો', 'વડોદરા · મુંબઈ · નવી દિલ્હી']] },
        settings: { kicker: 'સેટિંગ્સ', title: 'KIRANને તમારી રીતે બનાવો.', lead: 'થીમ, ભાષા, સાચવેલા સ્થળો અને ચેતવણી સેટિંગ્સ બદલો.', tiles: [['દેખાવ', 'લાઇટ મોડ'], ['ચેતવણી ત્રિજ્યા', 'તમારા સાચવેલા સ્થળોથી 25 કિમીની અંદર'], ['સૂચનાઓ', 'ચેતવણી ચાલુ · શાંત સમય 22:00–07:00']] },
        about: { kicker: 'KIRAN વિશે', title: 'બધા માટે સરળ ગરમી ચેતવણી.', lead: 'KIRAN હવામાન ડેટાને સ્પષ્ટ, સરળ ચેતવણીમાં ફેરવે છે જે કોઈપણ સમજી અને તેના પર કાર્ય કરી શકે.', tiles: [['અમારો ઉદ્દેશ', 'દરેક ઉંમર માટે ગરમી સલામતી સરળ બનાવવી.'], ['ડેટા વચન', 'અમે ખુલ્લા, વિશ્વસનીય હવામાન ડેટાનો ઉપયોગ કરીએ છીએ.'], ['સંપર્ક', 'hello@kiran.earth']] },
        precautions: { kicker: 'સાવચેતીઓ', title: 'નાના પગલાં. સાચી સુરક્ષા.', lead: 'ગરમીમાં સલામત રહેવાના સરળ પગલાં.', tiles: [['પહેલાં', 'ગરમી વધે તે પહેલાં છાયા, પાણીની યોજના બનાવો અને બીજાની ખબર-અંતર પૂછો.'], ['દરમિયાન', 'બપોરે ઘરની અંદર રહો. પાણી અથવા ORS પીવો. હલકા કપડાં પહેરો.'], ['બહાર કામ કરનારા', 'દર કલાકે છાયામાં આરામ કરો. બપોરે ભારે કામ ટાળો.']] },
        'how-to-use': { kicker: 'કેવી રીતે ઉપયોગ કરવો', title: 'ત્રણ સરળ પગલાં.', lead: 'નકશાથી શરૂ કરો, સંકેત તપાસો અને જે મહત્વનું છે તે સાચવો.', tiles: [['1. જુઓ', 'સંપૂર્ણ ગરમીની સ્થિતિ જોવા નકશાનો ઉપયોગ કરો.'], ['2. પસંદ કરો', 'ગરમીનો પ્રકાર પસંદ કરો અથવા તમારું શહેર શોધો.'], ['3. તૈયાર રહો', 'ચેતવણી ચાલુ કરો અને સલામતી પગલાં અનુસરો.']] },
      },
      login: { kicker: 'KIRAN એકાઉન્ટ', title: 'પાછા આવવા બદલ સ્વાગત છે.', lead: 'સ્થાનો સાચવવા, ચેતવણી મેળવવા અને તમારું ડેશબોર્ડ કસ્ટમાઇઝ કરવા લોગ ઇન કરો.', email_label: 'ઈમેલ', email_ph: 'you@example.com', password_label: 'પાસવર્ડ', password_ph: 'તમારો પાસવર્ડ', login_btn: 'લોગ ઇન કરો', demo: 'ડેમો એકાઉન્ટ વાપરો' },
      profile: { hello: 'નમસ્તે, ', lead: 'તમારા સાચવેલા સ્થળો અને ચેતવણી અહીં દેખાશે.', logout: 'લોગ આઉટ કરો' },
      menu: { kicker: 'KIRAN નેવિગેશન', title_html: 'જિજ્ઞાસુ રહો.<br><em>તૈયાર રહો.</em>', open_full: '{label} નું સંપૂર્ણ દૃશ્ય ખોલો', theme_title: '☼ દિવસ / લાઇટ મોડ', theme_desc: 'લાઇટ અને ડાર્ક થીમ વચ્ચે બદલો', lang_title: '🌐 ભાષા', lang_desc: 'તમારી પસંદગીની ભાષા પસંદ કરો' },
      emergency: { kicker: 'કટોકટી સહાય', title: 'મદદ નજીક છે.', lead: 'તમને જોઈતી સેવા પસંદ કરો. ચકાસાયેલ પ્રાદેશિક કટોકટી ડિરેક્ટરી જોડાય ત્યાં સુધી આ નંબર કામચલાઉ છે.',
        services: [['✦', 'NDRF', 'આપત્તિ પ્રતિભાવ', '1078'], ['⌁', 'પોલીસ', 'તાત્કાલિક સલામતી સહાય', '112'], ['♨', 'ફાયર અને રેસ્ક્યુ', 'આગ અને બચાવ સેવા', '101'], ['✚', 'એમ્બ્યુલન્સ', 'મેડિકલ ઇમરજન્સી સેવા', '108']], call: '{n} પર કૉલ કરો' },
      subscription: { step2_eyebrow: 'પગલું 2 માંથી 3 · સલામત ડેમો', step2_title: 'તમારી વિગતો ચકાસો', step2_lead: 'સાચી OTP સેવા હજી જોડાયેલ નથી. આગલા પગલા માટે કોઈપણ 6-અંકનો ડેમો કોડ દાખલ કરો.', otp_label: 'ચકાસણી કોડ', verify_btn: 'સબ્સ્ક્રિપ્શન ચકાસો', step3_eyebrow: 'પગલું 3 માંથી 3', step3_title: 'તમે તૈયાર છો.', step3_lead: 'આ ડેમોમાં તમારા સ્થળ માટે ગરમીના મોજાની ચેતવણી તૈયાર છે.' },
      toasts: { dark_on: 'ડાર્ક મોડ ચાલુ.', day_on: 'ડે મોડ ચાલુ.', logged_in: 'તમે લોગ ઇન થયા છો. તમારી KIRAN પ્રોફાઇલ તૈયાર છે.', logged_out: 'તમે લોગ આઉટ થયા છો.', lang_set: 'ભાષા {lang} માં બદલાઈ.', chatbot: 'AI સહાયક ડેમો તૈયાર છે — સાચું AI પછી ઉમેરી શકાય.' },
      blabel: { LOW: 'સલામત', MODERATE: 'મધ્યમ', HIGH: 'ઊંચું', EXTREME: 'અત્યંત' },
      tips: {
        Safe: ['સામાન્ય બહારની પ્રવૃત્તિ કરવી ઠીક છે.', 'આખો દિવસ પાણી સાથે રાખો અને શરીરમાં પાણીની ખોટ ન થવા દો.'],
        Moderate: ['તરસ ન લાગે તો પણ નિયમિત પાણી પીવો.', 'લાંબા સમય સુધી બહાર કામ કરતી વખતે છાયામાં આરામ કરો.', 'હલકા, ઢીલા અને આછા રંગના કપડાં પહેરો.'],
        High: ['બપોરે 12 થી સાંજે 4 વાગ્યા સુધી સીધા તડકામાં જવાનું ટાળો.', 'પાણી અથવા ORS વારંવાર પીવો; ચા, કોફી અને દારૂ ઓછો લો.', 'બાળકો, વૃદ્ધો અને બહાર કામ કરતા લોકોની દર થોડા કલાકે તપાસ કરો.', 'બાળકો કે પાળતુ પ્રાણીઓને ક્યારેય પાર્ક કરેલી ગાડીમાં એકલા ન છોડો.'],
        Extreme: ['બપોરે ઘરની અંદર રહો; ખૂબ જરૂરી હોય તો જ બહાર જાવ.', 'દર 20-30 મિનિટે પાણી અથવા ORS પીવો.', 'ચક્કર, ખેંચ કે મૂંઝવણ લાગે તો છાયામાં જાવ, શરીરને ઠંડું કરો અને 108/112 પર કૉલ કરો.', 'બારીઓ ઢાંકેલી રાખો, પંખો કે કૂલર ચલાવો અને ઠંડા પાણીથી નહાવ.'],
      },
      hazardNames: { heatwave: 'ગરમીનું મોજું', severe: 'ગંભીર ગરમીનું મોજું', anomaly: 'તાપમાન અસાધારણતા', warmnight: 'ગરમ રાત્રિની ગરમી', humid: 'ભેજવાળી ગરમી', wbgt: 'ગરમીનો તણાવ (WBGT)', prolonged: 'લાંબો ગરમીનો ગાળો', uv: 'સૂર્ય અને UV ભાર', heataq: 'ગરમી + ધુમ્મસ', dryspell: 'દુષ્કાળ અને પાણીની તંગી', health: 'ગરમી-આરોગ્ય જોખમ', uhi: 'શહેરી ગરમી ટાપુ' },
    },

    ta: {
      nav: { home: 'முகப்பு', alerts: 'எச்சரிக்கைகள்', modelPerformance: 'மாதிரி செயல்திறன்', history: 'வரலாறு', settings: 'அமைப்புகள்', about: 'பற்றி' },
      search_ph: 'நகரம், மாநிலம் அல்லது நாட்டைத் தேடுங்கள்',
      live_label: 'நேரடி வெப்ப தகவல்',
      greeting: { morning: 'காலை வணக்கம்', afternoon: 'வணக்கம்', evening: 'மாலை வணக்கம்' },
      tagline: 'குளிர்ச்சியாக இருங்கள். விழிப்புடன் இருங்கள்.',
      national_average: 'தேசிய சராசரி', india_heatwave_risk: 'இந்தியாவில் வெப்ப அலை ஆபத்து',
      sos_small: 'அவசர உதவி', sos_label: 'SOS',
      findme_small: 'உங்கள் இருப்பிடம்', findme_label: 'என்னைக் கண்டறி',
      situation_map: 'நிலைமை வரைபடம்', live_conditions: 'நேரடி நிலைமை', tracking: 'கண்காணிப்பு',
      map_all: 'அனைத்தும்', map_alerts: 'எச்சரிக்கைகள்', map_risk: 'ஆபத்து', map_normal: 'இயல்பு', map_sat: 'செயற்கைக்கோள்', map_dark: 'இருள்', map_heat: 'வெப்ப வரைபடம்', map_help: 'மருத்துவமனைகள் & தண்ணீர்',
      loading_signals: 'நேரடித் தகவல் ஏற்றப்படுகிறது…',
      monitor_by: 'வெப்ப வகை வாரியாகக் காணுங்கள்', heat_signals: 'வெப்ப அலை சமிக்ஞைகள்', show_all: 'அனைத்தையும் காட்டு',
      live_risk: 'நேரடி ஆபத்து · கண்காணிக்கப்படும் நகரங்கள்', heat_by_place: 'இடம் வாரியாக வெப்ப அலை ஆபத்து', explore_signals: 'சமிக்ஞைகளைப் பார்',
      risk_activity: 'ஆபத்து செயல்பாடு · இந்தியா', signals_over_time: 'காலப்போக்கில் சமிக்ஞைகள்', last_30: 'கடந்த 30 நாட்கள்',
      current_city_score: 'தற்போதைய நகர மதிப்பெண்', loading: 'ஏற்றப்படுகிறது…', kiran_ai: 'KIRAN AI',
      early_warning_personal: 'தனிப்பட்ட முன்கூட்டிய எச்சரிக்கை', get_alerts: 'வெப்ப அலை எச்சரிக்கைகளைப் பெறுங்கள்.', get_alerts_desc: 'உங்களுக்கு முக்கியமான இடங்களுக்கான அமைதியான, பயனுள்ள சமிக்ஞையைப் பெறுங்கள்.',
      email: 'மின்னஞ்சல்', phone: 'தொலைபேசி', city_area: 'நகரம் / பகுதி', continue_verify: 'சரிபார்ப்புக்குத் தொடரவும்',
      precautions_h: 'வெப்ப அலை முன்னெச்சரிக்கைகள்', small_actions: 'சிறிய நடவடிக்கைகள். உண்மையான பாதுகாப்பு.', preparedness_guide: 'தயார்நிலை வழிகாட்டி',
      prec: prec(
        { t: 'வெப்ப அலைக்கு முன்', d: 'வெப்பநிலை உயருவதற்கு முன் நிழல், தண்ணீர் மற்றும் நலம் விசாரிப்பைத் திட்டமிடுங்கள்.' },
        { t: 'கடும் வெப்பத்தின் போது', d: 'வீட்டிற்குள் குளிர்ச்சியாக இருங்கள், மதிய வெயிலைத் தவிர்க்கவும், வேகத்தைக் குறைக்கவும்.' },
        { t: 'நீர்ச்சத்து', d: 'அடிக்கடி தண்ணீர் குடிக்கவும். தாகம் வரும் வரை காத்திருக்க வேண்டாம்.' },
        { t: 'வெப்ப அழுத்த அறிகுறிகள்', d: 'தலைச்சுற்றல், குழப்பம், பிடிப்பு அல்லது குமட்டல் - உடனடி கவனம் தேவை.' },
        { t: 'குழந்தைகள் & முதியவர்கள்', d: 'வெப்பத்திற்கு அதிக பாதிப்படையக்கூடியவர்களை சில மணி நேரத்திற்கு ஒருமுறை பார்த்துக்கொள்ளுங்கள்.' },
        { t: 'அவசர நடவடிக்கை', d: 'நிழலுக்குச் செல்லுங்கள், உடலைக் குளிர்விக்கவும், அவசர சேவைகளைத் தொடர்பு கொள்ளுங்கள்.' }
      ),
      humidity_h: 'ஈரப்பதம் & வெப்ப அழுத்தம்', humidity_title: 'ஈரப்பதமான வெப்பம் ஏன் அதிக பாரமாக உணரப்படுகிறது.',
      humidity_desc: 'ஈரப்பதம் அதிகரிக்கும் போது, வியர்வை ஆவியாகாமல் உடல் தன்னைக் குளிர்விக்க முடியாமல் போகிறது. சுமார் 60% ஈரப்பதத்தில், 35°C என்பது 45°C போல உணரப்படலாம்.',
      learn_humidity: 'ஈரப்பதம் பற்றி அறியவும்',
      footer_tag: 'மாறும் உலகிற்கு தெளிவான சமிக்ஞைகள்.', explore: 'ஆராயுங்கள்', how_to_use: 'எப்படி பயன்படுத்துவது', connect: 'இணைக', instagram: 'Instagram', contact_us: 'எங்களைத் தொடர்பு கொள்ளுங்கள்', privacy: 'தனியுரிமை',
      copyright: '© 2026 KIRAN · பாதுகாப்பான நாளைக்காக உருவாக்கப்பட்டது',
      lang_name: 'தமிழ்',
      pages: {
        contact: { kicker: 'தொடர்பு', title: 'KIRAN குழுவுடன் பேசுங்கள்.', lead: 'கேள்விகள் அல்லது யோசனைகள் வரவேற்கப்படுகின்றன.', tiles: [['மின்னஞ்சல்', 'hello@kiran.earth'], ['Instagram', 'விரைவில்']] },
        privacy: { kicker: 'தனியுரிமை', title: 'உங்கள் தரவு, எளிமையாக வைக்கப்பட்டுள்ளது.', lead: 'KIRAN எதைப் பயன்படுத்துகிறது, ஏன்.', tiles: [['இருப்பிடம்', 'உள்ளூர் வானிலையைக் காட்ட மட்டுமே பயன்படுத்தப்படுகிறது.'], ['எச்சரிக்கைகள்', 'நீங்கள் கேட்கும் எச்சரிக்கைகளுக்கு மட்டும் உங்கள் மின்னஞ்சல் மற்றும் தொலைபேசி பயன்படுத்தப்படும்.'], ['தரவு ஆதாரங்கள்', 'Open-Meteo வானிலை, NASA EONET வெப்ப நிகழ்வுகள், வரைபடம் OpenStreetMap மூலம்.']] },
        home: { kicker: 'டாஷ்போர்டு', title: 'உங்களைச் சுற்றி என்ன நடக்கிறது.', lead: 'KIRAN நேரடி வானிலை, வெப்ப ஆபத்து மற்றும் முன்கூட்டிய எச்சரிக்கைகளை ஒரே இடத்தில் காட்டுகிறது.', tiles: [['நேரடி வரைபடம்', 'வரைபடத்தில் மாறும் நிலைமையைப் பாருங்கள்.'], ['நகர மதிப்பெண்', 'எளிய 0-100 வெப்ப ஆபத்து மதிப்பெண்.'], ['முன்கூட்டிய எச்சரிக்கை', 'வெப்பம் அதிகரிக்கும் முன் எச்சரிக்கை பெறுங்கள்.']] },
        alerts: { kicker: 'எச்சரிக்கைகள்', title: 'வெப்ப அலை எச்சரிக்கைகள்.', lead: 'உலகம் முழுவதிலுமிருந்து வெப்ப அலை எச்சரிக்கைகள் மற்றும் முன்கூட்டிய சமிக்ஞைகள்.', tiles: [] },
        'model-performance': { kicker: 'மாதிரி செயல்திறன்', title: 'KIRAN எவ்வளவு நன்றாக செயல்படுகிறது.', lead: 'KIRAN-இன் வெப்ப முன்னறிவிப்பு எவ்வளவு துல்லியமாகவும் வேகமாகவும் உள்ளது எனப் பாருங்கள்.', tiles: [['துல்லியம்', 'கண்காணிக்கப்படும் பகுதிகளில் சராசரி 92.4% துல்லியம்.'], ['வேகம்', '90 வினாடிகளுக்குள் சமிக்ஞைகள் தயார்.'], ['பரப்பளவு', '28 மாநிலங்களில் 1,248 இடங்கள் இணைக்கப்பட்டுள்ளன.']] },
        history: { kicker: 'வரலாறு', title: 'முன்பு என்ன நடந்தது.', lead: 'கடந்த எச்சரிக்கைகள் மற்றும் சேமிக்கப்பட்ட இடங்களைப் பாருங்கள்.', tiles: [['செப்டம்பர் 2026', '12 எச்சரிக்கைகள் பரிசீலிக்கப்பட்டன · 2 தீவிரமானவை'], ['ஆகஸ்ட் 2026', '8 எச்சரிக்கைகள் பரிசீலிக்கப்பட்டன · 1 தீவிரமானது'], ['சேமிக்கப்பட்ட இடங்கள்', 'வதோதரா · மும்பை · புது டெல்லி']] },
        settings: { kicker: 'அமைப்புகள்', title: 'KIRAN-ஐ உங்களுக்கேற்ப மாற்றுங்கள்.', lead: 'உங்கள் தீம், மொழி, சேமிக்கப்பட்ட இடங்கள் மற்றும் எச்சரிக்கை அமைப்புகளை மாற்றுங்கள்.', tiles: [['தோற்றம்', 'லைட் மோட்'], ['எச்சரிக்கை வரம்பு', 'உங்கள் சேமிக்கப்பட்ட இடங்களில் இருந்து 25 கிமீக்குள்'], ['அறிவிப்புகள்', 'எச்சரிக்கை இயக்கத்தில் · அமைதியான நேரம் 22:00–07:00']] },
        about: { kicker: 'KIRAN பற்றி', title: 'அனைவருக்கும் எளிய வெப்ப எச்சரிக்கைகள்.', lead: 'KIRAN வானிலை தரவை, யாரும் புரிந்துகொண்டு செயல்படக்கூடிய தெளிவான, எளிய எச்சரிக்கைகளாக மாற்றுகிறது.', tiles: [['எங்கள் நோக்கம்', 'ஒவ்வொரு வயதினருக்கும் வெப்ப பாதுகாப்பை எளிமையாக்குதல்.'], ['தரவு உறுதிமொழி', 'நாங்கள் திறந்த, நம்பகமான வானிலை தரவைப் பயன்படுத்துகிறோம்.'], ['தொடர்பு', 'hello@kiran.earth']] },
        precautions: { kicker: 'முன்னெச்சரிக்கைகள்', title: 'சிறிய நடவடிக்கைகள். உண்மையான பாதுகாப்பு.', lead: 'வெப்பத்தில் பாதுகாப்பாக இருக்க எளிய வழிகள்.', tiles: [['முன்பு', 'வெப்பம் அதிகரிக்கும் முன் நிழல், தண்ணீரைத் திட்டமிட்டு மற்றவர்களைப் பார்த்துக்கொள்ளுங்கள்.'], ['போது', 'மதியம் வீட்டிற்குள் இருங்கள். தண்ணீர் அல்லது ORS குடிக்கவும். இலகுவான ஆடைகளை அணியவும்.'], ['வெளியில் வேலை செய்பவர்கள்', 'ஒவ்வொரு மணி நேரமும் நிழலில் ஓய்வெடுங்கள். மதியம் கடும் வேலையைத் தவிர்க்கவும்.']] },
        'how-to-use': { kicker: 'எப்படி பயன்படுத்துவது', title: 'மூன்று எளிய படிகள்.', lead: 'வரைபடத்துடன் தொடங்கி, சமிக்ஞைகளைச் சரிபார்த்து, உங்களுக்கு முக்கியமானதைச் சேமியுங்கள்.', tiles: [['1. பாருங்கள்', 'மொத்த வெப்ப நிலையைப் பார்க்க வரைபடத்தைப் பயன்படுத்துங்கள்.'], ['2. தேர்வு செய்யுங்கள்', 'ஒரு வெப்ப வகையைத் தேர்ந்தெடுக்கவும் அல்லது உங்கள் நகரத்தைத் தேடவும்.'], ['3. தயாராகுங்கள்', 'எச்சரிக்கைகளை இயக்கி பாதுகாப்பு படிகளைப் பின்பற்றுங்கள்.']] },
      },
      login: { kicker: 'KIRAN கணக்கு', title: 'மீண்டும் வரவேற்கிறோம்.', lead: 'இடங்களைச் சேமிக்க, எச்சரிக்கைகளைப் பெற, உங்கள் டாஷ்போர்டைத் தனிப்பயனாக்க உள்நுழையவும்.', email_label: 'மின்னஞ்சல்', email_ph: 'you@example.com', password_label: 'கடவுச்சொல்', password_ph: 'உங்கள் கடவுச்சொல்', login_btn: 'உள்நுழைக', demo: 'டெமோ கணக்கைப் பயன்படுத்தவும்' },
      profile: { hello: 'வணக்கம், ', lead: 'உங்கள் சேமிக்கப்பட்ட இடங்களும் எச்சரிக்கைகளும் இங்கே தோன்றும்.', logout: 'வெளியேறு' },
      menu: { kicker: 'KIRAN வழிசெலுத்தல்', title_html: 'ஆர்வமாக இருங்கள்.<br><em>தயாராக இருங்கள்.</em>', open_full: '{label} முழு காட்சியைத் திற', theme_title: '☼ பகல் / லைட் பயன்முறை', theme_desc: 'லைட் மற்றும் டார்க் தீம் இடையே மாறவும்', lang_title: '🌐 மொழி', lang_desc: 'உங்களுக்கு விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்' },
      emergency: { kicker: 'அவசர உதவி', title: 'உதவி அருகில் உள்ளது.', lead: 'உங்களுக்குத் தேவையான சேவையைத் தேர்ந்தெடுக்கவும். சரிபார்க்கப்பட்ட பிராந்திய அவசர அடைவு இணைக்கப்படும் வரை இந்த எண்கள் தற்காலிகமானவை.',
        services: [['✦', 'NDRF', 'பேரிடர் மீட்பு', '1078'], ['⌁', 'காவல்துறை', 'உடனடி பாதுகாப்பு உதவி', '112'], ['♨', 'தீயணைப்பு & மீட்பு', 'தீ மற்றும் மீட்பு சேவை', '101'], ['✚', 'ஆம்புலன்ஸ்', 'மருத்துவ அவசர சேவை', '108']], call: '{n}-ஐ அழைக்கவும்' },
      subscription: { step2_eyebrow: 'படி 2/3 · பாதுகாப்பான டெமோ', step2_title: 'உங்கள் விவரங்களைச் சரிபார்க்கவும்', step2_lead: 'உண்மையான OTP சேவை இன்னும் இணைக்கப்படவில்லை. அடுத்த படிக்கு எந்த 6 இலக்க டெமோ குறியீட்டையும் உள்ளிடவும்.', otp_label: 'சரிபார்ப்புக் குறியீடு', verify_btn: 'சந்தாவைச் சரிபார்க்கவும்', step3_eyebrow: 'படி 3/3', step3_title: 'நீங்கள் தயார்.', step3_lead: 'இந்த டெமோவில் உங்கள் இடத்திற்கான வெப்ப அலை எச்சரிக்கைகள் தயார்.' },
      toasts: { dark_on: 'டார்க் மோட் இயக்கப்பட்டது.', day_on: 'டே மோட் இயக்கப்பட்டது.', logged_in: 'நீங்கள் உள்நுழைந்துள்ளீர்கள். உங்கள் KIRAN சுயவிவரம் தயார்.', logged_out: 'நீங்கள் வெளியேறிவிட்டீர்கள்.', lang_set: 'மொழி {lang} ஆக மாற்றப்பட்டது.', chatbot: 'AI உதவியாளர் டெமோ தயார் — நேரடி AI பின்னர் சேர்க்கப்படலாம்.' },
      blabel: { LOW: 'பாதுகாப்பானது', MODERATE: 'மிதமானது', HIGH: 'அதிகம்', EXTREME: 'தீவிரமானது' },
      tips: {
        Safe: ['வழக்கமான வெளிப்புற செயல்பாடு பரவாயில்லை.', 'நாள் முழுவதும் தண்ணீர் வைத்திருந்து உடலில் நீர்ச்சத்து குறையாமல் பாருங்கள்.'],
        Moderate: ['தாகம் இல்லாவிட்டாலும் அவ்வப்போது தண்ணீர் குடிக்கவும்.', 'நீண்ட நேரம் வெளியில் வேலை செய்யும்போது நிழலில் ஓய்வு எடுக்கவும்.', 'இலகுவான, தளர்வான, வெளிர் நிற ஆடைகளை அணியவும்.'],
        High: ['மதியம் 12 முதல் மாலை 4 மணி வரை நேரடி வெயிலைத் தவிர்க்கவும்.', 'தண்ணீர் அல்லது ORS அடிக்கடி குடிக்கவும்; தேநீர், காபி, மது குறைக்கவும்.', 'குழந்தைகள், முதியவர்கள், வெளியில் வேலை செய்பவர்களை சில மணி நேரத்திற்கு ஒருமுறை பார்த்துக் கொள்ளுங்கள்.', 'குழந்தைகளையோ செல்லப்பிராணிகளையோ நிறுத்தி வைத்த வாகனத்தில் ஒருபோதும் விடாதீர்கள்.'],
        Extreme: ['மதிய நேரத்தில் வீட்டிற்குள் இருங்கள்; மிகவும் அவசியம் என்றால் மட்டும் வெளியே செல்லுங்கள்.', 'ஒவ்வொரு 20-30 நிமிடத்திற்கும் தண்ணீர் அல்லது ORS குடிக்கவும்.', 'தலைச்சுற்றல், பிடிப்பு அல்லது குழப்பம் ஏற்பட்டால் நிழலுக்குச் சென்று உடலைக் குளிர்விக்கவும், 108/112-ஐ அழைக்கவும்.', 'ஜன்னல்களை மறைத்து மின்விசிறி அல்லது கூலரைப் பயன்படுத்தி குளிர்ந்த நீரில் குளியுங்கள்.'],
      },
      hazardNames: { heatwave: 'வெப்ப அலை', severe: 'கடுமையான வெப்ப அலை', anomaly: 'வெப்பநிலை முரண்பாடு', warmnight: 'சூடான இரவு வெப்பம்', humid: 'ஈரப்பத வெப்பம்', wbgt: 'வெப்ப அழுத்தம் (WBGT)', prolonged: 'நீடித்த வெப்ப காலம்', uv: 'சூரிய & UV சுமை', heataq: 'வெப்பம் + புகைமூட்டம்', dryspell: 'வறட்சி & நீர் நெருக்கடி', health: 'வெப்ப-ஆரோக்கிய ஆபத்து', uhi: 'நகர்ப்புற வெப்ப தீவு' },
    },
  };

  function get(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
  function fmt(str, vars) { return vars ? str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : '')) : str; }

  let lang = localStorage.getItem('kiran-lang') || 'en';
  if (!T[lang]) lang = 'en';
  const listeners = [];

  function t(path, vars) {
    const v = get(T[lang], path);
    if (v == null) return get(T.en, path) ?? path;
    return typeof v === 'string' ? fmt(v, vars) : v;
  }

  function applyStatic(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach((el) => { const v = t(el.getAttribute('data-i18n')); if (typeof v === 'string') el.innerHTML = v; });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    (root || document).querySelectorAll('[data-i18n-title]').forEach((el) => { const v = t(el.getAttribute('data-i18n-title')); el.title = v; el.setAttribute('aria-label', v); });
  }

  function setLang(code) {
    if (!T[code]) return;
    lang = code;
    localStorage.setItem('kiran-lang', code);
    document.documentElement.lang = code;
    applyStatic(document);
    listeners.forEach((fn) => { try { fn(code); } catch (e) { /* noop */ } });
  }

  window.I18N = {
    LANGS, T, t, get lang() { return lang; }, setLang, applyStatic,
    onChange(fn) { listeners.push(fn); },
  };

  document.documentElement.lang = lang;
  document.addEventListener('DOMContentLoaded', () => applyStatic(document));
  if (document.readyState !== 'loading') applyStatic(document);
})();
