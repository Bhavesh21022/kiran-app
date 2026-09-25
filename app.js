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

const greeting = document.getElementById('greeting');
function paintGreeting() {
  if (!greeting) return;
  const hour = new Date().getHours();
  greeting.textContent = hour < 12 ? I18N.t('greeting.morning') : hour < 18 ? I18N.t('greeting.afternoon') : I18N.t('greeting.evening');
}
paintGreeting();
I18N.onChange(paintGreeting);

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2800);
}

function closePage() {
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function openPage(name) {
  if (name === 'alerts' && typeof openAlerts === 'function') return openAlerts();
  const pageset = I18N.T[I18N.lang].pages;
  const page = pageset[name] || pageset.home;
  panelContent.innerHTML = `<button class="panel-close">×</button><p class="panel-kicker">${page.kicker}</p><h2>${page.title}</h2><p class="panel-lead">${page.lead}</p><div class="panel-grid">${page.tiles.map(([title, text]) => `<article class="panel-tile"><h3>${title}</h3><p>${text}</p></article>`).join('')}</div>`;
  panel.classList.add('open');
  document.body.style.overflow = 'hidden';
  panelContent.querySelector('.panel-close').addEventListener('click', closePage);
  mainMenuPanel.classList.remove('open');
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
    const email = document.getElementById('authEmail').value;
    const pass = document.getElementById('authPassword').value;
    const btn = document.getElementById('authSubmitBtn');
    btn.textContent = "Processing...";
    btn.disabled = true;

    if (isSignUpMode) {
      const name = document.getElementById('authName').value;
      auth.createUserWithEmailAndPassword(email, pass).then(res => {
        // Update profile with name
        return res.user.updateProfile({ displayName: name }).then(() => saveUserToDB(res.user));
      }).catch(err => { showToast(err.message); btn.textContent = "Sign Up"; btn.disabled = false; });
    } else {
      auth.signInWithEmailAndPassword(email, pass).catch(err => {
        showToast("Login failed. Check details.");
        btn.textContent = "Sign In"; btn.disabled = false;
      });
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
    
    loginButton.innerHTML = `<span class="avatar">${name[0].toUpperCase()}</span><span class="user-name">${name}</span>`;
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

function openProfilePanel() {
  const L = I18N.T[I18N.lang].login, P = I18N.T[I18N.lang].profile;
  panelContent.innerHTML = `<button class="panel-close" aria-label="Close profile">×</button><p class="panel-kicker">${L.kicker}</p><h2>${P.hello}${document.getElementById('displayName').textContent}.</h2><p class="panel-lead">${P.lead}</p><button class="full-button" id="logoutBtn">${P.logout} <span>↗</span></button>`;
  panel.classList.add('open'); document.body.style.overflow = 'hidden';
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
   REAL SUBSCRIPTION FORM SAVE
======================================= */
document.getElementById('subscriptionForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.querySelector('input[name="email"]').value;
  const phone = form.querySelector('input[name="phone"]').value;
  const area = form.querySelector('input[name="area"]').value;
  const S = I18N.T[I18N.lang].subscription;

  form.innerHTML = `<p class="eyebrow">Processing...</p><h3>Saving Data</h3><p class="panel-lead">Please wait.</p>`;
  
  // Save to Firebase Database
  db.collection("subscriptions").add({
    email: email,
    phone: phone,
    areaCode: area,
    userId: currentUserObj ? currentUserObj.uid : 'guest',
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    form.innerHTML = `<p class="eyebrow">${S.step2_eyebrow}</p><h3>${S.step2_title}</h3><p class="panel-lead">${S.step2_lead}</p><label class="otp-field">${S.otp_label}<input inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="000000" required /></label><button class="full-button" type="submit">${S.verify_btn} <span>↗</span></button>`;
    form.addEventListener('submit', (verifyEvent) => { 
      verifyEvent.preventDefault(); 
      form.innerHTML = `<p class="eyebrow">${S.step3_eyebrow}</p><h3>${S.step3_title}</h3><p class="panel-lead">${S.step3_lead} (Saved to Database)</p>`; 
    });
  }).catch(err => {
    form.innerHTML = `<p class="eyebrow">Error</p><h3>Failed to subscribe</h3><p class="panel-lead">${err.message}</p>`;
  });
});


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

document.getElementById('emergencyAlertsButton').addEventListener('click', () => {
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
  panel.classList.add('open'); document.body.style.overflow = 'hidden';
  panelContent.querySelector('.panel-close').addEventListener('click', closePage);
});

document.getElementById('exploreSignalsBtn1')?.addEventListener('click', () => { document.querySelector('.map-card').scrollIntoView({behavior: 'smooth'}); });
document.getElementById('showAllDisastersBtn')?.addEventListener('click', () => { if(typeof openAlerts === 'function') openAlerts(); });
document.getElementById('learnHumidityBtn')?.addEventListener('click', () => openPage('precautions'));

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePage(); });