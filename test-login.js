const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8089;
const BASE_DIR = path.resolve(__dirname);

// Simple HTTP static server
function createServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(BASE_DIR, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(data);
    });
  });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  const server = createServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Test server running at http://localhost:${PORT}`);

  const results = {
    validLogin: false,
    dashboardLoaded: false,
    incorrectPasswordHandled: false,
    unregisteredEmailHandled: false,
    noCrash: true,
    logs: []
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.type(), msg.text()));
    page.on('pageerror', err => {
      console.error('[BROWSER ERROR]', err);
      results.noCrash = false;
    });

    console.log('\n--- STEP 1: Loading Kiran app ---');
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle2' });
    await sleep(1500);

    const initialGuestText = await page.$eval('#displayName', el => el.textContent.trim());
    console.log(`Initial Display Name: ${initialGuestText}`);

    // ==========================================
    // TEST 1: Valid Login & Home Dashboard Load
    // ==========================================
    console.log('\n--- STEP 2: Testing Valid Login ---');
    await page.click('#loginButton');
    await sleep(600);

    // Verify modal is open
    const isPanelOpen = await page.$eval('#pagePanel', el => el.classList.contains('open'));
    console.log(`Is Login Panel Open: ${isPanelOpen}`);

    // Fill valid credentials
    await page.type('#authEmail', 'testuser@kiranapp.test');
    await page.type('#authPassword', 'TestPassword123!');
    await page.click('#authSubmitBtn');
    console.log('Submitted valid login form, waiting for auth response...');

    // Wait for auth to complete
    await page.waitForFunction(() => {
      const panel = document.getElementById('pagePanel');
      const name = document.getElementById('displayName')?.textContent;
      return (!panel.classList.contains('open') && name && name !== 'Guest');
    }, { timeout: 12000 });

    await sleep(1000);

    const loggedInName = await page.$eval('#displayName', el => el.textContent.trim());
    const isPanelClosed = await page.$eval('#pagePanel', el => !el.classList.contains('open'));
    const isDashboardVisible = await page.$eval('#dashboard', el => {
      const rect = el.getBoundingClientRect();
      return rect.height > 0 && window.getComputedStyle(el).display !== 'none';
    });
    const loginButtonText = await page.$eval('#loginButton .user-name', el => el.textContent.trim());

    console.log(`Post-login Display Name: "${loggedInName}"`);
    console.log(`Login Button Name: "${loginButtonText}"`);
    console.log(`Is Panel Closed: ${isPanelClosed}`);
    console.log(`Is Dashboard Visible: ${isDashboardVisible}`);

    if (isPanelClosed && isDashboardVisible && loggedInName === 'Test User') {
      results.validLogin = true;
      results.dashboardLoaded = true;
      console.log('✅ TEST 1 PASSED: Valid credentials successfully logged in and home dashboard loaded!');
    } else {
      console.error('❌ TEST 1 FAILED: Did not meet expected valid login state.');
    }

    await page.screenshot({ path: path.join(BASE_DIR, 'test-1-dashboard-loaded.png') });
    console.log('Saved screenshot: test-1-dashboard-loaded.png');

    // Sign out to prepare for negative tests
    console.log('\n--- Signing out ---');
    await page.click('#loginButton'); // opens profile panel
    await sleep(500);
    await page.click('#logoutBtn');
    await sleep(1000);

    const loggedOutName = await page.$eval('#displayName', el => el.textContent.trim());
    console.log(`Display Name after logout: "${loggedOutName}"`);

    // ==========================================
    // TEST 2: Incorrect Password Test
    // ==========================================
    console.log('\n--- STEP 3: Testing Incorrect Password ---');
    await page.click('#loginButton');
    await sleep(600);

    await page.type('#authEmail', 'testuser@kiranapp.test');
    await page.type('#authPassword', 'WrongPassword999!');
    await page.click('#authSubmitBtn');
    console.log('Submitted incorrect password, waiting for error response...');

    await page.waitForFunction(() => {
      const errEl = document.getElementById('authErrorMessage');
      const toast = document.getElementById('toast');
      return (errEl && errEl.textContent.trim().length > 0 && errEl.style.display !== 'none') ||
             (toast && toast.classList.contains('show') && toast.textContent.trim().length > 0);
    }, { timeout: 10000 });

    await sleep(600);

    const formErrorPass = await page.$eval('#authErrorMessage', el => ({
      text: el.textContent.trim(),
      display: window.getComputedStyle(el).display
    }));
    const toastTextPass = await page.$eval('#toast', el => el.textContent.trim());
    const isSubmitBtnEnabledPass = await page.$eval('#authSubmitBtn', el => !el.disabled);

    console.log(`Inline Error Message: "${formErrorPass.text}" (display: ${formErrorPass.display})`);
    console.log(`Toast Message: "${toastTextPass}"`);
    console.log(`Submit Button Re-enabled: ${isSubmitBtnEnabledPass}`);

    if (formErrorPass.text === 'Invalid Credentials' || toastTextPass === 'Invalid Credentials') {
      results.incorrectPasswordHandled = true;
      console.log('✅ TEST 2 PASSED: "Invalid Credentials" displayed clearly for incorrect password!');
    } else {
      console.error(`❌ TEST 2 FAILED: Expected "Invalid Credentials", got inline: "${formErrorPass.text}", toast: "${toastTextPass}"`);
    }

    await page.screenshot({ path: path.join(BASE_DIR, 'test-2-incorrect-password.png') });
    console.log('Saved screenshot: test-2-incorrect-password.png');

    // Close modal
    await page.click('.panel-close');
    await sleep(500);

    // ==========================================
    // TEST 3: Unregistered Email Test
    // ==========================================
    console.log('\n--- STEP 4: Testing Unregistered Email ---');
    await page.click('#loginButton');
    await sleep(600);

    await page.type('#authEmail', 'unregistered_kiran_test_83921@example.com');
    await page.type('#authPassword', 'SomeRandomPass123!');
    await page.click('#authSubmitBtn');
    console.log('Submitted unregistered email, waiting for error response...');

    await page.waitForFunction(() => {
      const errEl = document.getElementById('authErrorMessage');
      const toast = document.getElementById('toast');
      return (errEl && errEl.textContent.trim().length > 0 && errEl.style.display !== 'none') ||
             (toast && toast.classList.contains('show') && toast.textContent.trim().length > 0);
    }, { timeout: 10000 });

    await sleep(600);

    const formErrorEmail = await page.$eval('#authErrorMessage', el => ({
      text: el.textContent.trim(),
      display: window.getComputedStyle(el).display
    }));
    const toastTextEmail = await page.$eval('#toast', el => el.textContent.trim());
    const isSubmitBtnEnabledEmail = await page.$eval('#authSubmitBtn', el => !el.disabled);

    console.log(`Inline Error Message: "${formErrorEmail.text}" (display: ${formErrorEmail.display})`);
    console.log(`Toast Message: "${toastTextEmail}"`);
    console.log(`Submit Button Re-enabled: ${isSubmitBtnEnabledEmail}`);

    if (formErrorEmail.text === 'Invalid Credentials' || toastTextEmail === 'Invalid Credentials') {
      results.unregisteredEmailHandled = true;
      console.log('✅ TEST 3 PASSED: "Invalid Credentials" displayed clearly for unregistered email!');
    } else {
      console.error(`❌ TEST 3 FAILED: Expected "Invalid Credentials", got inline: "${formErrorEmail.text}", toast: "${toastTextEmail}"`);
    }

    await page.screenshot({ path: path.join(BASE_DIR, 'test-3-unregistered-email.png') });
    console.log('Saved screenshot: test-3-unregistered-email.png');

  } catch (err) {
    console.error('Test execution error:', err);
    results.noCrash = false;
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log('\n==========================================');
  console.log('TEST SUMMARY:');
  console.log('1. Valid Credentials Login:       ', results.validLogin ? 'PASS ✅' : 'FAIL ❌');
  console.log('2. Home Dashboard Loaded:          ', results.dashboardLoaded ? 'PASS ✅' : 'FAIL ❌');
  console.log('3. Incorrect Password Handled:     ', results.incorrectPasswordHandled ? 'PASS ✅' : 'FAIL ❌');
  console.log('4. Unregistered Email Handled:     ', results.unregisteredEmailHandled ? 'PASS ✅' : 'FAIL ❌');
  console.log('5. App Stability (No Crashes):     ', results.noCrash ? 'PASS ✅' : 'FAIL ❌');
  console.log('==========================================\n');

  if (results.validLogin && results.dashboardLoaded && results.incorrectPasswordHandled && results.unregisteredEmailHandled && results.noCrash) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
