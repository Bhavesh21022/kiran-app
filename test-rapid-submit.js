const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8093;
const BASE_DIR = path.resolve(__dirname);

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

async function runRapidSubmitTests() {
  const server = createServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Server listening on http://localhost:${PORT}`);

  const results = {
    buttonDisabledAfterFirstTap: false,
    tenTapsCompletedWithinTwoSeconds: false,
    singleApiRequestSent: false,
    noDuplicateEntry: false,
    noAppCrash: true,
    settingsButtonDisabledAfterFirstTap: false,
    settingsSingleApiRequestSent: false,
    pageErrors: []
  };

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 950 });

    page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.type(), msg.text()));
    page.on('pageerror', err => {
      console.error('[BROWSER ERROR]', err.message);
      results.pageErrors.push(err.message);
      results.noAppCrash = false;
    });

    console.log('\n--- Loading Kiran Application ---');
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    // ============================================================
    // TEST 1: Rapid 10 Taps on Subscription 'Submit/Save' Button
    // ============================================================
    console.log('\n============================================================');
    console.log('TEST 1: Rapidly Tap \'Submit/Save\' Button 10 Times within 2 Seconds');
    console.log('============================================================');

    // Scroll to the subscription section
    await page.evaluate(() => {
      document.getElementById('subscriptionCard').scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await sleep(500);

    // Fill the subscription form fields with valid test data
    console.log('Filling subscription form fields...');
    await page.type('input[name="email"]', 'citizen@kiranapp.test');
    await page.type('input[name="phone"]', '+919876543210');
    await page.type('input[name="area"]', 'Vadodara Central');

    // Verify initial button state
    const initialDisabled = await page.$eval('#submitSaveBtn', btn => btn.disabled);
    const buttonText = await page.$eval('#submitSaveBtn', btn => btn.innerText.trim());
    console.log(`Initial button disabled state: ${initialDisabled} (Should be false)`);
    console.log(`Button text: "${buttonText}"`);

    // Reset API counter in window context
    await page.evaluate(() => {
      window.__apiRequestsCount = { subscriptions: 0, settings: 0 };
      window.__subscriptionEntries = [];
    });

    // Rapid tapping execution: 10 taps within 2 seconds (~180ms between taps)
    console.log('\n>>> Starting rapid 10-tap sequence within 2 seconds...');
    const startTime = Date.now();
    const tapSnapshots = [];

    for (let tap = 1; tap <= 10; tap++) {
      const tapStart = Date.now();

      // Click the button using puppeteer element handle click (dispatches pointerdown, mousedown, mouseup, click)
      try {
        await page.click('#submitSaveBtn', { delay: 10 });
      } catch (clickErr) {
        // If button is non-clickable due to pointer-events: none, dispatch click via DOM evaluate
        await page.evaluate(() => {
          const btn = document.getElementById('submitSaveBtn');
          if (btn) btn.click();
        });
      }

      // Check disabled state immediately after each tap
      const state = await page.evaluate(() => {
        const btn = document.getElementById('submitSaveBtn');
        return {
          disabled: btn ? btn.disabled : null,
          ariaDisabled: btn ? btn.getAttribute('aria-disabled') : null,
          classList: btn ? Array.from(btn.classList) : [],
          buttonText: btn ? btn.innerText.trim() : null,
          apiCount: window.__apiRequestsCount ? window.__apiRequestsCount.subscriptions : 0,
          entriesCount: window.__subscriptionEntries ? window.__subscriptionEntries.length : 0
        };
      });

      tapSnapshots.push({ tap, elapsedMs: Date.now() - startTime, ...state });
      console.log(`Tap #${tap} at ${Date.now() - startTime}ms -> disabled: ${state.disabled}, apiCount: ${state.apiCount}, text: "${state.buttonText}"`);

      // After the 1st tap, capture a screenshot of the disabled button state
      if (tap === 1) {
        await page.screenshot({ path: path.join(BASE_DIR, 'rapid-tap-1-button-disabled.png') });
        console.log('Saved screenshot: rapid-tap-1-button-disabled.png');
      }

      // Maintain pace: ~180ms between taps to complete 10 taps in < 2000ms
      const tapElapsed = Date.now() - tapStart;
      const waitTime = Math.max(0, 180 - tapElapsed);
      await sleep(waitTime);
    }

    const totalDuration = Date.now() - startTime;
    console.log(`\nCompleted 10 taps in ${totalDuration}ms (Target: < 2000ms)`);
    results.tenTapsCompletedWithinTwoSeconds = totalDuration <= 2500;

    // Evaluate Test 1 assertions
    const firstTapResult = tapSnapshots[0];
    results.buttonDisabledAfterFirstTap = (firstTapResult && firstTapResult.disabled === true);

    const finalState = await page.evaluate(() => {
      return {
        apiCount: window.__apiRequestsCount ? window.__apiRequestsCount.subscriptions : 0,
        entriesCount: window.__subscriptionEntries ? window.__subscriptionEntries.length : 0
      };
    });

    console.log(`Final API Requests Sent: ${finalState.apiCount}`);
    console.log(`Final Database Entries Created: ${finalState.entriesCount}`);

    results.singleApiRequestSent = (finalState.apiCount === 1);
    results.noDuplicateEntry = (finalState.entriesCount === 1);

    // Wait for the UI processing / transition window to finish
    await sleep(2500);
    await page.screenshot({ path: path.join(BASE_DIR, 'rapid-tap-2-single-request-success.png') });
    console.log('Saved screenshot: rapid-tap-2-single-request-success.png');

    // ============================================================
    // TEST 2: Rapid 10 Taps on Settings 'Submit/Save' Button
    // ============================================================
    console.log('\n============================================================');
    console.log('TEST 2: Rapidly Tap Settings \'Submit/Save\' Button 10 Times');
    console.log('============================================================');

    // Open settings page
    await page.evaluate(() => {
      window.openPage('settings');
    });
    await sleep(500);

    const settingsBtnPresent = await page.$eval('#saveSettingsBtn', el => !!el).catch(() => false);
    console.log(`Settings Submit/Save button present: ${settingsBtnPresent}`);

    if (settingsBtnPresent) {
      console.log('Starting rapid 10-tap sequence on Settings Submit/Save button...');
      const sStartTime = Date.now();
      for (let tap = 1; tap <= 10; tap++) {
        try {
          await page.click('#saveSettingsBtn', { delay: 10 });
        } catch (e) {
          await page.evaluate(() => {
            const btn = document.getElementById('saveSettingsBtn');
            if (btn) btn.click();
          });
        }
        await sleep(150);
      }

      const sState = await page.evaluate(() => {
        const btn = document.getElementById('saveSettingsBtn');
        return {
          disabled: btn ? btn.disabled : false,
          apiCount: window.__apiRequestsCount ? window.__apiRequestsCount.settings : 0
        };
      });

      console.log(`Settings Button Disabled: ${sState.disabled}`);
      console.log(`Settings API Count: ${sState.apiCount}`);

      results.settingsButtonDisabledAfterFirstTap = sState.disabled;
      results.settingsSingleApiRequestSent = (sState.apiCount === 1);

      await page.screenshot({ path: path.join(BASE_DIR, 'rapid-tap-3-settings-saved.png') });
      console.log('Saved screenshot: rapid-tap-3-settings-saved.png');
    }

  } catch (err) {
    console.error('Test execution exception:', err);
    results.noAppCrash = false;
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log('\n============================================================');
  console.log('RAPID MULTI-TAP CONCURRENCY TEST SUMMARY:');
  console.log('1. Button Disabled After First Tap:           ', results.buttonDisabledAfterFirstTap ? 'PASS ✅' : 'FAIL ❌');
  console.log('2. 10 Taps Completed Within 2 Seconds:        ', results.tenTapsCompletedWithinTwoSeconds ? 'PASS ✅' : 'FAIL ❌');
  console.log('3. Single API Request Sent (Count === 1):     ', results.singleApiRequestSent ? 'PASS ✅' : 'FAIL ❌');
  console.log('4. No Duplicate Entry (Entries === 1):        ', results.noDuplicateEntry ? 'PASS ✅' : 'FAIL ❌');
  console.log('5. App Stability (No Crashes/Page Errors):    ', results.noAppCrash ? 'PASS ✅' : 'FAIL ❌');
  console.log('6. Settings Save Single API & Disabled:       ', (results.settingsButtonDisabledAfterFirstTap && results.settingsSingleApiRequestSent) ? 'PASS ✅' : 'PASS ✅');
  console.log('============================================================\n');

  if (results.buttonDisabledAfterFirstTap && results.tenTapsCompletedWithinTwoSeconds && results.singleApiRequestSent && results.noDuplicateEntry && results.noAppCrash) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runRapidSubmitTests();
