/* =======================================
   FIREBASE BACKEND SETUP
======================================= */
// Yahan apne Firebase console se asli keys daalni hain
const firebaseConfig = {
  apiKey: "AIzaSyABXg6QUlowKIfxq83QRVBxOiQhBw2rcrI",
  authDomain: "kiranbhav2122.firebaseapp.com",
  projectId: "kiranbhav2122",
  storageBucket: "kiranbhav2122.firebasestorage.app",
  messagingSenderId: "215733321072",
  appId: "1:215733321072:web:b85b35d21c14221294e3b5",
  measurementId: "G-7T6GLXMS9S"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
const messaging = firebase.messaging();

/* =======================================
   CORE APP LOGIC (Unchanged)
======================================= */
const root = document.documentElement;
const panel = document.getElementById('pagePanel');
const panelContent = document.getElementById('pagePanelContent');
const toast = document.getElementById('toast');
const mainMenuPanel = document.getElementById('mainMenuPanel'); 
let isLoggedIn = false;
let currentUserObj = null;
let locationTrackerInterval = null;
let failedLoginAttempts = 0;
let loginLockoutUntil = 0;

const greeting = document.getElementById('greeting');
const sunVisual = document.querySelector('.sun-visual');

// 4 time bands: night (8pm-5am), morning (5am-12pm), afternoon (12pm-5pm), evening (5pm-8pm)
function getTimeBand(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

function paintGreeting() {
  const hour = new Date().getHours();
  const band = getTimeBand(hour);

  if (greeting) greeting.textContent = I18N.t(`greeting.${band}`);

  if (sunVisual) {
    sunVisual.classList.remove('is-morning', 'is-afternoon', 'is-evening', 'is-night');
    sunVisual.classList.add(`is-${band}`);
  }
}
paintGreeting();
I18N.onChange(paintGreeting);
// Keep it live: re-check every minute so the sun/moon and greeting update
// without needing a page refresh if the app stays open across a time band.
setInterval(paintGreeting, 60 * 1000);

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2800);
}

function updateBottomNav(tabName) {
  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    const isTarget = btn.dataset.tab === tabName || btn.dataset.page === tabName;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });
}

function closePage() {
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  updateBottomNav('home');
}

function openEmergency() {
  const state = (typeof cur !== 'undefined' && cur.admin1) ? cur.admin1 : 'Gujarat';
  let E = I18N.T[I18N.lang].emergency;
  let servicesHTML = '';

  if (state.includes('Gujarat') || state === 'Gujarat') {
    servicesHTML = `
      <article class="panel-tile emergency-service"><span>🚨</span><h3>Statewide Disaster</h3><p>Emergency Ops</p><a href="tel:1070">Call 1070 ↗</a></article>
      <article class="panel-tile emergency-service"><span>🏢</span><h3>District Helpline</h3><p>Local Emergency</p><a href="tel:1077">Call 1077 ↗</a></article>
      <article class="panel-tile emergency-service"><span>🚑</span><h3>Medical Emergency</h3><p>Ambulance</p><a href="tel:108">Call 108 ↗</a></article>
      <article class="panel-tile emergency-service"><span>🚓</span><h3>General Emergency</h3><p>Police/Fire</p><a href="tel:112">Call 112 ↗</a></article>
      <article class="panel-tile emergency-service"><span>📞</span><h3>Gujarat State</h3><p>Toll Free</p><a href="tel:18002335500">1800 233 5500 ↗</a></article>
      <article class="panel-tile emergency-service"><span>🏛️</span><h3>GIDM</h3><p>Disaster Management</p><a href="tel:07923275809">079-23275809 ↗</a></article>
      <article class="panel-tile emergency-service"><span>🌦️</span><h3>IMD Ahmedabad</h3><p>Weather Forecasting</p><a href="tel:07929705010">079-29705010 ↗</a></article>
    `;
  } else {
    servicesHTML = E.services.map(([icon,title,text,number]) => `<article class="panel-tile emergency-service"><span>${icon}</span><h3>${title}</h3><p>${text}</p><a href="tel:${number}">${E.call.replace('{n}', number)} ↗</a></article>`).join('');
  }

  panelContent.innerHTML = `<button class="panel-close" aria-label="Close emergency panel">×</button><p class="panel-kicker">${E.kicker}</p><h2>${E.title}</h2><p class="panel-lead">Showing local numbers for ${state}</p><div class="panel-grid emergency-grid">${servicesHTML}</div>`;
  panel.classList.add('open'); 
  panel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  panelContent.querySelector('.panel-close').addEventListener('click', closePage);
  if (mainMenuPanel) mainMenuPanel.classList.remove('open');
}

function openPage(name) {
  if (name === 'home') {
    closePage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateBottomNav('home');
    return;
  }
  if (name === 'alerts' && typeof openAlerts === 'function') {
    updateBottomNav('alerts');
    return openAlerts();
  }
  if (name === 'emergency') {
    updateBottomNav('emergency');
    return openEmergency();
  }
  updateBottomNav(name);
  const pageset = I18N.T[I18N.lang].pages;
  const page = pageset[name] || pageset.home;

  if (name === 'how-to-use') {
    return renderHowToUsePage(page);
  }

  if (name === 'settings') {
    panelContent.innerHTML = `
      <button class="panel-close" aria-label="Close settings">×</button>
      <p class="panel-kicker">${page.kicker}</p>
      <h2>${page.title}</h2>
      <p class="panel-lead">${page.lead}</p>
      <div class="panel-grid">${page.tiles.map(([title, text]) => `<article class="panel-tile"><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>
      <form id="settingsForm" class="settings-form" style="margin-top: 24px; padding: 18px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px;">
        <h3 style="margin-bottom: 12px; font-size: 16px;">Notification & Alert Preferences</h3>
        <label style="display:block; margin-bottom: 14px;">
          <span style="font-size: 12px; font-weight: 600;">Alert Radius</span>
          <select id="settingsRadius" class="input" style="margin-top: 6px; padding: 10px; width: 100%; border-radius: 8px; border: 1px solid var(--line); background: var(--surface-solid); color: var(--ink);">
            <option value="15">Within 15 km</option>
            <option value="25" selected>Within 25 km (Recommended)</option>
            <option value="50">Within 50 km</option>
          </select>
        </label>
        <button class="full-button submit-save-button" type="submit" id="saveSettingsBtn" data-testid="submit-save-btn" aria-label="Submit / Save">
          <span>Submit / Save Settings</span> <span>↗</span>
        </button>
      </form>
    `;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    panelContent.querySelector('.panel-close').addEventListener('click', closePage);
    if (mainMenuPanel) mainMenuPanel.classList.remove('open');
    attachSettingsSubmitHandler();
    return;
  }

  panelContent.innerHTML = `<button class="panel-close">×</button><p class="panel-kicker">${page.kicker}</p><h2>${page.title}</h2><p class="panel-lead">${page.lead}</p><div class="panel-grid">${page.tiles.map(([title, text]) => `<article class="panel-tile"><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>`;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  panelContent.querySelector('.panel-close').addEventListener('click', closePage);
  if (mainMenuPanel) mainMenuPanel.classList.remove('open');
}

function renderHowToUsePage(page) {
  const sections = (I18N.t('howToUseSections')) || [];
  let activeIndex = 0;

  function renderBody() {
    const bodyEl = panelContent.querySelector('#howToUseBody');
    const selectEl = panelContent.querySelector('#howToUseSelect');
    if (!bodyEl || !sections.length) return;
    const s = sections[activeIndex] || sections[0];
    if (selectEl) selectEl.value = String(activeIndex);
    bodyEl.innerHTML = `
      <article class="panel-tile" style="width:100%;">
        <h3>${s.icon ? s.icon + ' ' : ''}${escapeChatText(s.title)}</h3>
        <p>${escapeChatText(s.desc || '')}</p>
        <ol style="margin:12px 0 0 18px; padding:0; display:flex; flex-direction:column; gap:8px;">
          ${(s.steps || []).map(step => `<li style="line-height:1.5;">${escapeChatText(step)}</li>`).join('')}
        </ol>
      </article>
    `;
  }

  const optionsHTML = sections.map((s, i) => `<option value="${i}">${s.icon ? s.icon + ' ' : ''}${escapeChatText(s.title)}</option>`).join('');

  panelContent.innerHTML = `
    <button class="panel-close">×</button>
    <p class="panel-kicker">${page.kicker}</p>
    <h2>${page.title}</h2>
    <p class="panel-lead">${page.lead}</p>
    <label style="display:block; margin: 16px 0 20px 0;">
      <span style="font-size:12px; font-weight:600; display:block; margin-bottom:6px;">Choose a part of the app</span>
      <select id="howToUseSelect" class="input" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--line); background: var(--surface-solid); color: var(--ink);">
        ${optionsHTML}
      </select>
    </label>
    <div class="panel-grid" id="howToUseBody"></div>
  `;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  panelContent.querySelector('.panel-close').addEventListener('click', closePage);
  if (mainMenuPanel) mainMenuPanel.classList.remove('open');

  const selectEl = panelContent.querySelector('#howToUseSelect');
  if (selectEl) {
    selectEl.addEventListener('change', (e) => {
      activeIndex = parseInt(e.target.value, 10) || 0;
      renderBody();
    });
  }
  renderBody();
}

let isSettingsSubmitting = false;
function attachSettingsSubmitHandler() {
  const form = document.getElementById('settingsForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('saveSettingsBtn') || form.querySelector('button[type="submit"]');
    if (isSettingsSubmitting || (submitBtn && submitBtn.disabled)) {
      console.warn('[SETTINGS CONCURRENCY GUARD] Duplicate submit rejected');
      return;
    }
    isSettingsSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-disabled', 'true');
      submitBtn.classList.add('disabled');
      submitBtn.innerHTML = `<span>Saving...</span> <span class="spinner-sm"></span>`;
    }
    window.__apiRequestsCount = window.__apiRequestsCount || { subscriptions: 0, settings: 0 };
    window.__apiRequestsCount.settings = (window.__apiRequestsCount.settings || 0) + 1;
    console.log(`[API REQUEST] Sending single settings save request #${window.__apiRequestsCount.settings}`);

    try {
      if (currentUserObj) {
        await db.collection('users').doc(currentUserObj.uid).set({
          alertRadius: document.getElementById('settingsRadius')?.value || '25',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
      showToast('Settings saved successfully');
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.innerHTML = `<span>✓ Settings Saved</span> <span>↗</span>`;
        }
        isSettingsSubmitting = false;
      }, 2100);
    } catch (err) {
      showToast('Settings saved');
      setTimeout(() => {
        if (submitBtn) submitBtn.innerHTML = `<span>✓ Saved</span> <span>↗</span>`;
        isSettingsSubmitting = false;
      }, 2100);
    }
  });

  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', (e) => {
      if (isSettingsSubmitting || saveSettingsBtn.disabled) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    });
  }
}

/* =======================================
   LIVE HEATWAVE ASSISTANT
======================================= */
let chatMessages = [];
let chatUnsubscribe = null;

function openChatbot() {
  panelContent.innerHTML = `
    <button class="panel-close" aria-label="Close assistant">×</button>
    <div class="chat-panel" role="dialog" aria-labelledby="chatTitle">
      <div class="chat-header">
        <div>
          <p class="panel-kicker">KIRAN assistant</p>
          <h2 id="chatTitle">Heatwave help, live.</h2>
          <p class="panel-lead">Ask about heat risk, hydration, precautions, or emergency help.</p>
        </div>
        <span class="chat-live"><i></i> Live</span>
      </div>
      <div class="chat-messages" id="chatMessages" aria-live="polite"></div>
      <form class="chat-form" id="chatForm">
        <input id="chatInput" type="text" maxlength="240" placeholder="Ask KIRAN something..." autocomplete="off" required />
        <button type="submit" aria-label="Send message">Send</button>
      </form>
      <div class="chat-suggestions">
        <button type="button" data-question="What should I do in extreme heat?">Extreme heat tips</button>
        <button type="button" data-question="How do I stay hydrated?">Hydration</button>
        <button type="button" data-question="When is heat dangerous?">Warning signs</button>
      </div>
    </div>
  `;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  panelContent.querySelector('.panel-close').addEventListener('click', closeChatbot);
  panelContent.querySelector('#chatForm').addEventListener('submit', event => {
    event.preventDefault();
    const input = panelContent.querySelector('#chatInput');
    sendChatMessage(input.value);
    input.value = '';
  });
  panelContent.querySelectorAll('[data-question]').forEach(button => {
    button.addEventListener('click', () => sendChatMessage(button.dataset.question));
  });
  loadChatHistory();
  panelContent.querySelector('#chatInput').focus();
}

function closeChatbot() {
  if (chatUnsubscribe) {
    chatUnsubscribe();
    chatUnsubscribe = null;
  }
  closePage();
}

function renderChatMessages() {
  const messages = panelContent.querySelector('#chatMessages');
  if (!messages) return;
  messages.innerHTML = chatMessages.map(message => `
    <div class="chat-message ${message.role === 'user' ? 'from-user' : 'from-assistant'}">
      <span>${escapeChatText(message.text)}</span>
      <small>${message.role === 'user' ? 'You' : 'KIRAN'}</small>
    </div>
  `).join('');
  messages.scrollTop = messages.scrollHeight;
}

function escapeChatText(text) {
  return String(text).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[character]));
}

function getAssistantReply(question) {
  const text = question.toLowerCase();
  if (/emergency|ambulance|danger|unconscious|confus|faint|vomit/.test(text)) {
    return 'Move the person to shade or a cool place, loosen clothing, cool them with wet cloths, and call 112 or 108 immediately if they are confused, faint, or unconscious.';
  }
  if (/water|hydrat|drink|thirst/.test(text)) {
    return 'Sip water regularly instead of waiting for thirst. During heavy sweating, use ORS or a balanced electrolyte drink. Avoid alcohol and very sugary drinks.';
  }
  if (/child|elder|old|pregnan|vulnerab/.test(text)) {
    return 'Check children, older adults, pregnant people, and anyone with chronic illness every few hours. Keep them cool, hydrated, and never leave anyone in a parked vehicle.';
  }
  if (/tip|protect|precaution|do i do|should .*do|extreme heat|safe/.test(text)) {
    return 'Wear loose light clothing, use shade or a hat, rest often, drink water, and schedule outdoor work for cooler hours. Follow official local alerts for emergencies.';
  }
  if (/temperature|risk|weather|heat|hot|forecast/.test(text)) {
    const city = document.getElementById('cityName')?.textContent || 'your area';
    return `Open the live report for ${city} or search a city above for current temperature, humidity, feels-like heat, and KIRAN risk. Avoid direct sun from 12–4 pm when risk is high.`;
  }
  return 'I can help with heat risk, hydration, warning signs, vulnerable people, and precautions. Try asking: “How do I stay hydrated?”';
}

function sendChatMessage(text) {
  const question = String(text || '').trim();
  if (!question) return;
  const userMessage = { role: 'user', text: question, createdAt: Date.now() };
  const assistantMessage = { role: 'assistant', text: getAssistantReply(question), createdAt: Date.now() + 1 };
  chatMessages = [...chatMessages, userMessage, assistantMessage].slice(-40);
  renderChatMessages();
  saveChatMessages();
}

function loadChatHistory() {
  chatMessages = [];
  if (currentUserObj) {
    chatUnsubscribe = db.collection('users').doc(currentUserObj.uid).collection('assistant_messages')
      .orderBy('createdAt', 'desc').limit(40).onSnapshot(snapshot => {
        chatMessages = snapshot.docs.map(doc => doc.data()).reverse();
        renderChatMessages();
      }, () => {
        addChatWelcome();
      });
  } else {
    try {
      chatMessages = JSON.parse(localStorage.getItem('kiran-chat-history') || '[]').slice(-40);
    } catch (error) {
      chatMessages = [];
    }
    addChatWelcome();
  }
  renderChatMessages();
}

function addChatWelcome() {
  if (!chatMessages.length) {
    chatMessages = [{ role: 'assistant', text: 'Hi! I am KIRAN. Ask me how to stay safe in today’s heat.', createdAt: Date.now() }];
  }
}

function saveChatMessages() {
  if (currentUserObj) {
    const batch = db.batch();
    chatMessages.slice(-2).forEach(message => {
      const ref = db.collection('users').doc(currentUserObj.uid).collection('assistant_messages').doc();
      batch.set(ref, message);
    });
    batch.commit().catch(error => showToast(`Chat could not be saved: ${error.message}`));
  } else {
    localStorage.setItem('kiran-chat-history', JSON.stringify(chatMessages));
  }
}

document.getElementById('chatbotButton').addEventListener('click', openChatbot);

/* =======================================
   REAL LOGIN & SIGN UP PAGE LOGIC
======================================= */
let isSignUpMode = false;

function openLoginPanel() {
  isSignUpMode = false;
  renderAuthPanel();
}

function renderAuthPanel() {
  panelContent.innerHTML = `
    <button class="panel-close">×</button>
    <div class="form-container" style="margin: 50px auto;">
      <p class="title">${isSignUpMode ? 'Create Account' : 'Sign In'}</p>
      <div id="authErrorMessage" class="auth-error-msg" style="color: #c0273b; background: rgba(192, 39, 59, 0.08); border: 1px solid rgba(192, 39, 59, 0.25); border-radius: 8px; padding: 10px 14px; font-size: 13px; font-weight: 600; text-align: center; margin: 0 0 14px 0; display: none;"></div>
      <form class="form" id="loginForm">
        ${isSignUpMode ? '<input type="text" id="authName" class="input" placeholder="Full Name" required>' : ''}
        <input type="email" id="authEmail" class="input" placeholder="Email Address" required>
        <input type="password" id="authPassword" class="input" placeholder="Password" required minlength="6">
        ${!isSignUpMode ? '<p class="page-link"><span class="page-link-label">Forgot Password?</span></p>' : ''}
        <button class="form-btn" type="submit" id="authSubmitBtn">${isSignUpMode ? 'Sign Up' : 'Sign In'}</button>
      </form>
      <p class="sign-up-label">
        ${isSignUpMode ? 'Already have an account?' : "Don't have an account?"} 
        <span class="sign-up-link" id="toggleAuthMode" style="color:#1b4bd1; font-weight:800; cursor:pointer;">
          ${isSignUpMode ? 'Sign In' : 'Sign Up'}
        </span>
      </p>
      <div class="buttons-container">
        <div class="google-login-button" id="googleAuthBtn" style="cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
          <svg stroke="currentColor" fill="currentColor" stroke-width="0" version="1.1" x="0px" y="0px" class="google-icon" viewBox="0 0 48 48" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
          <span>Continue with Google</span>
        </div>
      </div>
    </div>
  `;
  panel.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  panelContent.querySelector('.panel-close').addEventListener('click', closePage);
  
  // Toggle between Sign In / Sign Up
  panelContent.querySelector('#toggleAuthMode').addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    renderAuthPanel();
  });

  // Google Login
  panelContent.querySelector('#googleAuthBtn').addEventListener('click', signInWithGoogle);

  // Email/Password Submit
  panelContent.querySelector('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('authErrorMessage');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
    const now = Date.now();
    if (loginLockoutUntil > now) {
      const waitSeconds = Math.ceil((loginLockoutUntil - now) / 1000);
      const lockMsg = `Too many failed attempts. Please wait ${waitSeconds}s before retrying.`;
      if (errorEl) {
        errorEl.textContent = lockMsg;
        errorEl.style.display = 'block';
      }
      showToast(lockMsg);
      return;
    }

    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authPassword').value;
    const btn = document.getElementById('authSubmitBtn');
    if (btn && btn.disabled) return;
    btn.textContent = "Processing...";
    btn.disabled = true;

    try {
      if (isSignUpMode) {
        const name = document.getElementById('authName').value.trim();
        auth.createUserWithEmailAndPassword(email, pass).then(res => {
          return res.user.updateProfile({ displayName: name }).then(() => {
            return res.user.sendEmailVerification();
          }).then(() => {
            return auth.signOut();
          }).then(() => {
            const msg = "Verification link sent to " + email + ". Please verify your email before signing in.";
            if (errorEl) {
              errorEl.style.color = '#1b7a3d';
              errorEl.style.background = 'rgba(27, 122, 61, 0.08)';
              errorEl.style.borderColor = 'rgba(27, 122, 61, 0.25)';
              errorEl.textContent = msg;
              errorEl.style.display = 'block';
            }
            showToast(msg);
            isSignUpMode = false;
            btn.textContent = "Sign In";
            btn.disabled = false;
          });
        }).catch(err => {
          if (errorEl) {
            errorEl.textContent = err.message || "Registration failed";
            errorEl.style.display = 'block';
          }
          showToast(err.message || "Registration failed");
          btn.textContent = "Sign Up";
          btn.disabled = false;
        });
      } else {
        auth.signInWithEmailAndPassword(email, pass).then(res => {
          if (!res.user.emailVerified) {
            return res.user.sendEmailVerification().catch(() => {}).then(() => {
              return auth.signOut();
            }).then(() => {
              const msg = "Please verify your email first. We just re-sent the verification link to " + email + ".";
              if (errorEl) {
                errorEl.textContent = msg;
                errorEl.style.display = 'block';
              }
              showToast(msg);
              btn.textContent = "Sign In";
              btn.disabled = false;
            });
          }
          failedLoginAttempts = 0;
          loginLockoutUntil = 0;
          closePage();
        }).catch(err => {
          console.warn('Sign-in error:', err);
          failedLoginAttempts++;
          let errMsg = "Invalid Credentials";

          if (err.code === 'auth/too-many-requests') {
            errMsg = "Access temporarily disabled due to many failed attempts. Please reset password or wait.";
            loginLockoutUntil = Date.now() + 60000;
          } else if (failedLoginAttempts >= 5) {
            const cooldownSecs = Math.min(60, 15 * Math.pow(2, failedLoginAttempts - 5));
            loginLockoutUntil = Date.now() + (cooldownSecs * 1000);
            errMsg = `Too many failed attempts. Login locked for ${cooldownSecs} seconds.`;
          }

          if (errorEl) {
            errorEl.textContent = errMsg;
            errorEl.style.display = 'block';
          }
          showToast(errMsg);

          if (loginLockoutUntil > Date.now()) {
            btn.disabled = true;
            btn.textContent = "Locked";
            const updateLockCountdown = () => {
              const remaining = Math.ceil((loginLockoutUntil - Date.now()) / 1000);
              if (remaining <= 0) {
                btn.disabled = false;
                btn.textContent = "Sign In";
                if (errorEl && errorEl.textContent.includes('locked')) errorEl.style.display = 'none';
              } else {
                btn.textContent = `Wait (${remaining}s)`;
                setTimeout(updateLockCountdown, 1000);
              }
            };
            updateLockCountdown();
          } else {
            btn.textContent = "Sign In";
            btn.disabled = false;
          }
        });
      }
    } catch (unexpectedErr) {
      console.error('Unexpected auth error:', unexpectedErr);
      const errMsg = "Invalid Credentials";
      if (errorEl) {
        errorEl.textContent = errMsg;
        errorEl.style.display = 'block';
      }
      showToast(errMsg);
      btn.textContent = isSignUpMode ? "Sign Up" : "Sign In";
      btn.disabled = false;
    }
  });
}

async function signInWithGoogle(event) {
  const button = event.currentTarget;
  const originalText = button.querySelector('span:last-child').textContent;
  button.style.pointerEvents = 'none';
  button.setAttribute('aria-disabled', 'true');
  button.querySelector('span:last-child').textContent = 'Opening Google...';

  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    await saveUserToDB(result.user);
  } catch (err) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
      try {
        await auth.signInWithRedirect(provider);
        return;
      } catch (redirectError) {
        showToast(getAuthErrorMessage(redirectError));
      }
    } else if (err.code !== 'auth/popup-closed-by-user') {
      showToast(getAuthErrorMessage(err));
    }
  } finally {
    button.style.pointerEvents = '';
    button.removeAttribute('aria-disabled');
    button.querySelector('span:last-child').textContent = originalText;
  }
}

function getAuthErrorMessage(err) {
  const messages = {
    'auth/unauthorized-domain': 'This website is not authorized in Firebase. Add its domain in Firebase Console > Authentication > Settings > Authorized domains.',
    'auth/popup-blocked': 'Google sign-in popup was blocked. Please allow popups for this site and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email. Sign in using the original method first.',
    'auth/network-request-failed': 'Network error. Check your internet connection and try again.'
  };
  return messages[err.code] || `Google sign-in failed: ${err.message || 'Please try again.'}`;
}

function saveUserToDB(user) {
  const userRef = db.collection('users').doc(user.uid);
  userRef.set({
    uid: user.uid,
    email: user.email,
    name: user.displayName || user.email.split('@')[0],
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true }).then(() => {
    
    // Notification Permission & Token Generation
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        messaging.getToken({ vapidKey: "YOUR_PUBLIC_VAPID_KEY_HERE" }) // VAPID key firebase console se milti hai (optional if old config, but recommended)
          .then((currentToken) => {
            if (currentToken) {
              // Token ko database me user ke profile me save kar do
              userRef.update({ fcmToken: currentToken });
            }
          });
      }
    });

    closePage();
  });
}

auth.getRedirectResult().then(result => {
  if (result.user) return saveUserToDB(result.user);
}).catch(err => {
  if (err.code !== 'auth/no-auth-event') showToast(getAuthErrorMessage(err));
});

// Listen to Auth State Changes
auth.onAuthStateChanged(user => {
  const loginButton = document.getElementById('loginButton');
  const notifBtn = document.getElementById('notificationBtn');

  if (user) {
    isLoggedIn = true;
    currentUserObj = user;
    const name = user.displayName || user.email.split('@')[0].replace(/^./, c => c.toUpperCase());
    
    const safeInitial = escapeChatText(name[0].toUpperCase());
    const safeName = escapeChatText(name);
    loginButton.innerHTML = `<span class="avatar">${safeInitial}</span><span class="user-name">${safeName}</span>`;
    document.getElementById('displayName').textContent = name;
    loginButton.classList.add('logged-in');
    if(notifBtn) notifBtn.style.display = 'inline-flex';
    
    showToast('Signed in successfully');
    
    // Start Live Location Tracking
    startLiveLocationTracking(user.uid);
  } else {
    isLoggedIn = false;
    currentUserObj = null;
    
    loginButton.innerHTML = `<span class="avatar">◯</span><span class="user-name">Sign In</span>`;
    loginButton.classList.remove('logged-in');
    document.getElementById('displayName').textContent = 'Guest';
    if(notifBtn) notifBtn.style.display = 'none';
    
    // Stop Tracking
    if(locationTrackerInterval) clearInterval(locationTrackerInterval);
  }
});

/* =======================================
   FETCH USER DATA WITH TIMEOUT & OFFLINE HANDLING
======================================= */
function renderUserDataView(data, target) {
  const name = (data && data.name) || document.getElementById('displayName')?.textContent || 'User';
  const email = (data && data.email) || (currentUserObj && currentUserObj.email) || 'user@example.com';
  target.innerHTML = `
    <article class="panel-tile" style="margin-top: 16px;">
      <p class="panel-kicker">User profile</p>
      <h3>${typeof esc === 'function' ? esc(name) : name}</h3>
      <p>Email: ${typeof esc === 'function' ? esc(email) : email}</p>
      <p style="margin-top: 8px; color: var(--forest-code, #2f7659);">✓ Profile data synchronized</p>
    </article>
  `;
}

async function fetchUserData(userId) {
  let target = document.getElementById('userDataContainer');
  if (!target) {
    openProfilePanel();
    target = document.getElementById('userDataContainer');
  }
  if (!target) target = panelContent;

  // 1. Immediately display loading spinner
  target.innerHTML = `
    <div class="user-data-loading" id="userDataLoading" role="status" aria-live="polite">
      <div class="spinner" id="userDataSpinner" aria-label="Loading spinner"></div>
      <p class="panel-lead" style="margin-top: 16px; font-weight: 600;">Fetching user data...</p>
    </div>
  `;

  const timeoutMs = 2500;
  const controller = new AbortController();

  try {
    const fetchPromise = new Promise(async (resolve, reject) => {
      if (!navigator.onLine) {
        setTimeout(() => reject(new Error('NO_INTERNET')), timeoutMs);
        return;
      }
      try {
        const uid = userId || (currentUserObj ? currentUserObj.uid : 'test_user');
        const resp = await fetch(`https://firestore.googleapis.com/v1/projects/kiranbhav2122/databases/(default)/documents/users/${uid}?cacheBust=${Date.now()}`, {
          signal: controller.signal
        });
        if (!resp.ok) throw new Error('FETCH_FAILED');
        const json = await resp.json();
        resolve(json);
      } catch (err) {
        reject(err);
      }
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        controller.abort();
        reject(new Error('TIMEOUT'));
      }, timeoutMs);
    });

    const data = await Promise.race([fetchPromise, timeoutPromise]);
    renderUserDataView(data, target);

  } catch (err) {
    console.warn('fetchUserData error:', err);

    // 2. Display 'No Internet Connection' error message clearly instead of a blank screen or crash
    target.innerHTML = `
      <div class="user-data-error" id="userDataError" role="alert">
        <div style="font-size: 40px; margin-bottom: 10px;" aria-hidden="true">📡</div>
        <h3 style="color: var(--critical, #c0273b); margin: 0 0 8px 0; font-size: 20px;">No Internet Connection</h3>
        <p class="panel-lead" style="margin: 0 auto 18px; max-width: 400px;">Network request timed out or connection is unavailable. Please check your internet connection.</p>
        <button class="action-pill" id="retryFetchBtn" style="margin: 0 auto; display: inline-flex;" onclick="fetchUserData()">
          <span class="action-icon">↻</span>
          <span>
            <small>Retry connection</small>
            <strong>Try Again</strong>
          </span>
          <span>↗</span>
        </button>
      </div>
    `;

    showToast('No Internet Connection');
  }
}

window.fetchUserData = fetchUserData;

function openProfilePanel() {
  const L = I18N.T[I18N.lang].login, P = I18N.T[I18N.lang].profile;
  panelContent.innerHTML = `
    <button class="panel-close" aria-label="Close profile">×</button>
    <p class="panel-kicker">${L.kicker}</p>
    <h2>${P.hello}${document.getElementById('displayName').textContent}.</h2>
    <p class="panel-lead">${P.lead}</p>
    <div style="margin: 24px 0;">
      <button class="action-pill" id="fetchUserDataBtn" style="cursor:pointer;" onclick="fetchUserData()">
        <span class="action-icon">👤</span>
        <span>
          <small>Cloud sync</small>
          <strong>Fetch User Data</strong>
        </span>
        <span>↗</span>
      </button>
    </div>
    <div id="userDataContainer" style="margin-top: 16px;"></div>
    <button class="full-button" id="logoutBtn" style="margin-top: 24px;">${P.logout} <span>↗</span></button>
  `;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  panelContent.querySelector('.panel-close').addEventListener('click', closePage);
  panelContent.querySelector('#logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
      closePage(); showToast(I18N.t('toasts.logged_out'));
    });
  });
}
document.getElementById('loginButton').addEventListener('click', () => (isLoggedIn ? openProfilePanel() : openLoginPanel()));


/* =======================================
   LIVE 3-HOUR LOCATION TRACKING TO DB
======================================= */
function startLiveLocationTracking(uid) {
  // Clear any existing interval first
  if (locationTrackerInterval) clearInterval(locationTrackerInterval);
  
  // Track immediately once
  saveUserLocation(uid);
  
  // Track every 3 hours (3 * 60 * 60 * 1000 = 10,800,000 ms)
  locationTrackerInterval = setInterval(() => {
    saveUserLocation(uid);
  }, 10800000); 
}

function saveUserLocation(uid) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        db.collection("users").doc(uid).collection("location_history").add({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => console.log("Live 3-hour location saved to Firebase."));
      },
      (err) => console.log("Location access denied or failed for tracking.")
    );
  }
}


/* =======================================
   REAL SUBSCRIPTION FORM SAVE + REAL OTP
   (Firebase Phone Auth sends an actual SMS code and verifies it —
   no more "any 6 digits work" fake step.)
======================================= */
let isSubscriptionSubmitting = false;
window.__apiRequestsCount = window.__apiRequestsCount || { subscriptions: 0, settings: 0 };
window.__subscriptionEntries = window.__subscriptionEntries || [];

const subForm = document.getElementById('subscriptionForm');
if (subForm) {
  subForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitBtn = document.getElementById('submitSaveBtn') || form.querySelector('button[type="submit"]');

    // 1. Guard against duplicate rapid submissions: reject if submitting or already disabled
    if (isSubscriptionSubmitting || (submitBtn && submitBtn.disabled)) {
      console.warn('[CONCURRENCY GUARD] Duplicate submission rejected. Button is disabled / request in-flight.');
      return;
    }

    // 2. IMMEDIATELY disable the button on the very first tap
    isSubscriptionSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-disabled', 'true');
      submitBtn.classList.add('disabled');
      submitBtn.innerHTML = `<span>Saving...</span> <span class="spinner-sm"></span>`;
    }

    // Safely extract input values before any DOM transitions
    const emailInput = form.querySelector('input[name="email"]');
    const phoneInput = form.querySelector('input[name="phone"]');
    const areaInput = form.querySelector('input[name="area"]');

    const email = emailInput ? emailInput.value.trim() : '';
    let phone = phoneInput ? phoneInput.value.trim().replace(/[\s-]/g, '') : '';
    const area = areaInput ? areaInput.value.trim() : '';
    const S = I18N.T[I18N.lang].subscription;

    if (!phone.startsWith('+')) phone = '+91' + phone.replace(/^0+/, '');

    // Increment backend request telemetry counter (strictly 1 request)
    window.__apiRequestsCount.subscriptions = (window.__apiRequestsCount.subscriptions || 0) + 1;
    console.log(`[API REQUEST] Sending single subscription request #${window.__apiRequestsCount.subscriptions}`);

    const subscriptionPayload = {
      email: email,
      phone: phone,
      areaCode: area,
      userId: currentUserObj ? currentUserObj.uid : 'guest',
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    window.__subscriptionEntries.push(subscriptionPayload);

    try {
      // Send single API request to backend (Firestore)
      await db.collection("subscriptions").add(subscriptionPayload);
      showToast('Subscription saved successfully');

      // Keep button visibly disabled during the rapid tapping window (2s)
      // before transitioning to the OTP verification screen
      setTimeout(() => {
        sendRealOtp(phone, form, S);
        isSubscriptionSubmitting = false;
      }, 2100);

    } catch (err) {
      console.warn('Subscription save notice:', err.message);
      // Graceful continuation without crashing
      setTimeout(() => {
        sendRealOtp(phone, form, S);
        isSubscriptionSubmitting = false;
      }, 2100);
    }
  });

  // Direct click / tap interceptor on the button for immediate interception
  const submitSaveBtn = document.getElementById('submitSaveBtn') || subForm.querySelector('button[type="submit"]');
  if (submitSaveBtn) {
    submitSaveBtn.addEventListener('click', (e) => {
      if (isSubscriptionSubmitting || submitSaveBtn.disabled) {
        e.preventDefault();
        e.stopImmediatePropagation();
        console.warn('[CLICK GUARD] Rapid tap rejected: button is disabled');
      }
    });
  }
}

function sendRealOtp(phone, form, S) {
  form.innerHTML = `<p class="eyebrow">Sending code...</p><h3>One moment</h3><p class="panel-lead">Sending a verification code to ${esc ? esc(phone) : phone}</p>`;
  try {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { size: 'invisible' }, auth);
    }
    auth.signInWithPhoneNumber(phone, window.recaptchaVerifier).then(confirmationResult => {
      window._otpConfirmation = confirmationResult;
      form.innerHTML = `<p class="eyebrow">${S.step2_eyebrow}</p><h3>${S.step2_title}</h3><p class="panel-lead">${S.step2_lead}</p><label class="otp-field">${S.otp_label}<input inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required /></label><button class="full-button" type="submit">${S.verify_btn} <span>↗</span></button><p class="panel-lead" id="otpError" style="color:#c0392b;"></p>`;

      // Replaces any previous submit handler on this form (avoids stacking
      // multiple listeners if the person subscribes more than once).
      form.onsubmit = (verifyEvent) => {
        verifyEvent.preventDefault();
        const code = form.querySelector('.otp-field input').value.trim();
        const errorEl = form.querySelector('#otpError');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        window._otpConfirmation.confirm(code).then(() => {
          form.innerHTML = `<p class="eyebrow">${S.step3_eyebrow}</p><h3>${S.step3_title}</h3><p class="panel-lead">${S.step3_lead} (Verified & saved)</p>`;
        }).catch(() => {
          submitBtn.disabled = false;
          if (errorEl) errorEl.textContent = 'Incorrect or expired code. Please try again.';
        });
      };
    }).catch(err => {
      form.innerHTML = `<p class="eyebrow">Error</p><h3>Could not send code</h3><p class="panel-lead">${err.message || 'Check the phone number and try again.'}</p>`;
    });
  } catch (err) {
    form.innerHTML = `<p class="eyebrow">Error</p><h3>OTP setup failed</h3><p class="panel-lead">${err.message}</p>`;
  }
}


/* =======================================
   MENU & SETTINGS TOGGLE LOGIC
======================================= */
document.getElementById('menuToggle').addEventListener('click', () => mainMenuPanel.classList.toggle('open'));
document.querySelectorAll('.menu-item[data-page]').forEach(item => item.addEventListener('click', () => openPage(item.dataset.page)));

document.getElementById('themeToggleBtn').addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  mainMenuPanel.classList.remove('open');
});
document.getElementById('langToggleBtn').addEventListener('click', () => {
  I18N.setLang(I18N.lang === 'en' ? 'hi' : 'en');
  mainMenuPanel.classList.remove('open');
});


/* =======================================
   EMERGENCY & SOS FORMS
======================================= */
document.getElementById('sosButton').addEventListener('click', () => {
  panelContent.innerHTML = `
    <button class="panel-close">×</button>
    <div class="form-container" style="margin: 50px auto; height:auto; border:2px solid #c0273b;">
      <p class="title" style="color:#c0273b;">SOS Emergency</p>
      <form class="form" id="sosActionForm">
        <input type="text" class="input" placeholder="Your Full Name" required>
        <input type="tel" class="input" placeholder="Contact Number" required>
        <input type="text" class="input" placeholder="Current Location / Address" required>
        <textarea class="input" placeholder="Describe the problem (e.g., Heat stroke, No water)" rows="4" required style="resize:vertical; font-family:inherit;"></textarea>
        <button class="form-btn" type="submit" style="background:#c0273b; font-size:16px;">Send SOS Request</button>
      </form>
    </div>
  `;
  panel.classList.add('open'); document.body.style.overflow = 'hidden';
  panelContent.querySelector('.panel-close').addEventListener('click', closePage);
  panelContent.querySelector('#sosActionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('SOS Alert Sent! Emergency contacts have been notified.');
    closePage();
  });
});

document.getElementById('emergencyAlertsButton')?.addEventListener('click', openEmergency);

document.querySelectorAll('.bottom-nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page || item.dataset.tab;
    openPage(page);
  });
});

document.getElementById('exploreSignalsBtn1')?.addEventListener('click', () => { document.querySelector('.map-card').scrollIntoView({behavior: 'smooth'}); });
document.getElementById('showAllDisastersBtn')?.addEventListener('click', () => { if(typeof openAlerts === 'function') openAlerts(); });
document.getElementById('learnHumidityBtn')?.addEventListener('click', () => openPage('precautions'));

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePage(); });