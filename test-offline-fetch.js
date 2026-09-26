const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8092;
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

async function runOfflineTests() {
  const server = createServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Server listening on http://localhost:${PORT}`);

  const results = {
    spinnerVisibleOffline: false,
    noInternetMessageOffline: false,
    noBlankScreenOffline: false,
    spinnerVisibleSlow3G: false,
    noInternetMessageSlow3G: false,
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

    console.log('\n--- Loading Kiran App ---');
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    // ============================================================
    // TEST 1: Disconnect Internet Entirely (Offline Mode)
    // ============================================================
    console.log('\n============================================================');
    console.log('TEST 1: Disconnecting Internet Entirely (Offline Simulation)');
    console.log('============================================================');

    const client = await page.target().createCDPSession();

    // Open profile panel
    await page.evaluate(() => {
      window.openProfilePanel();
    });
    await sleep(500);

    // Verify Fetch User Data button exists
    const hasFetchBtn = await page.$eval('#fetchUserDataBtn', el => !!el);
    console.log(`Fetch User Data button present: ${hasFetchBtn}`);

    // Disconnect internet entirely
    console.log('Simulating Network: DISCONNECTED (Offline = true)...');
    await client.send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });

    // Trigger Fetch User Data API call
    console.log("Triggering 'Fetch User Data' API call...");
    page.click('#fetchUserDataBtn');

    // Immediately verify loading spinner is visible
    try {
      await page.waitForSelector('#userDataSpinner', { visible: true, timeout: 2000 });
      results.spinnerVisibleOffline = true;
      console.log('✅ Loading spinner detected and visible while request is initiated!');
      await page.screenshot({ path: path.join(BASE_DIR, 'offline-1-loading-spinner.png') });
      console.log('Saved screenshot: offline-1-loading-spinner.png');
    } catch (e) {
      console.error('❌ Spinner was not visible:', e.message);
    }

    // Wait for timeout / error handling to show 'No Internet Connection'
    console.log("Waiting for 'No Internet Connection' error message to appear...");
    await page.waitForFunction(() => {
      const err = document.getElementById('userDataError');
      return err && err.textContent.includes('No Internet Connection');
    }, { timeout: 6000 });

    const errContentOffline = await page.$eval('#userDataError', el => el.innerText.trim());
    const isSpinnerGoneOffline = await page.$eval('#userDataSpinner', () => false).catch(() => true);
    const toastTextOffline = await page.$eval('#toast', el => el.textContent.trim());

    console.log(`Error Box Content: "${errContentOffline.replace(/\n/g, ' ')}"`);
    console.log(`Is Spinner Dismissed: ${isSpinnerGoneOffline}`);
    console.log(`Toast Notification: "${toastTextOffline}"`);

    // Verify screen is NOT blank
    const panelInnerHtmlOffline = await page.$eval('#pagePanelContent', el => el.innerHTML.trim());
    results.noBlankScreenOffline = panelInnerHtmlOffline.length > 100;

    if (errContentOffline.includes('No Internet Connection') && results.noBlankScreenOffline) {
      results.noInternetMessageOffline = true;
      console.log("✅ TEST 1 PASSED: 'No Internet Connection' clearly shown on offline disconnect without blank screen or crash!");
    } else {
      console.error('❌ TEST 1 FAILED: Did not display expected No Internet Connection message.');
    }

    await page.screenshot({ path: path.join(BASE_DIR, 'offline-2-no-internet-error.png') });
    console.log('Saved screenshot: offline-2-no-internet-error.png');

    // Close panel
    await page.click('.panel-close');
    await sleep(500);

    // ============================================================
    // TEST 2: Simulate Slow 3G Network Connection & Timeout
    // ============================================================
    console.log('\n============================================================');
    console.log('TEST 2: Simulate Slow 3G Network Connection (High Latency & Timeout)');
    console.log('============================================================');

    // Configure Slow 3G network emulation
    console.log('Emulating Slow 3G (Latency: 2500ms, Throughput: 50kbps)...');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 2500,
      downloadThroughput: (50 * 1024) / 8, // 50 kbps
      uploadThroughput: (50 * 1024) / 8
    });

    await page.evaluate(() => {
      window.openProfilePanel();
    });
    await sleep(500);

    console.log("Triggering 'Fetch User Data' API call under Slow 3G...");
    page.click('#fetchUserDataBtn');

    // Verify spinner is visible during Slow 3G connection
    await page.waitForSelector('#userDataSpinner', { visible: true, timeout: 1500 });
    results.spinnerVisibleSlow3G = true;
    console.log('✅ Loading spinner detected and stably visible during Slow 3G in-flight request!');
    await page.screenshot({ path: path.join(BASE_DIR, 'slow3g-1-loading-spinner.png') });
    console.log('Saved screenshot: slow3g-1-loading-spinner.png');

    // Wait for timeout (3500ms) to trigger 'No Internet Connection'
    console.log("Waiting for timeout to trigger 'No Internet Connection' error view...");
    await page.waitForFunction(() => {
      const err = document.getElementById('userDataError');
      return err && err.textContent.includes('No Internet Connection');
    }, { timeout: 8000 });

    const errContentSlow3G = await page.$eval('#userDataError', el => el.innerText.trim());
    console.log(`Slow 3G Error Box Content: "${errContentSlow3G.replace(/\n/g, ' ')}"`);

    if (errContentSlow3G.includes('No Internet Connection')) {
      results.noInternetMessageSlow3G = true;
      console.log("✅ TEST 2 PASSED: After timeout under Slow 3G, 'No Internet Connection' error is displayed gracefully!");
    } else {
      console.error('❌ TEST 2 FAILED: Did not display expected message under Slow 3G.');
    }

    await page.screenshot({ path: path.join(BASE_DIR, 'slow3g-2-timeout-error.png') });
    console.log('Saved screenshot: slow3g-2-timeout-error.png');

    // Re-enable normal network
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1
    });

  } catch (err) {
    console.error('Test execution error:', err);
    results.noCrash = false;
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log('\n============================================================');
  console.log('OFFLINE & SLOW 3G TEST SUMMARY:');
  console.log('1. Offline Loading Spinner Visible:     ', results.spinnerVisibleOffline ? 'PASS ✅' : 'FAIL ❌');
  console.log('2. Offline No Internet Error Displayed:  ', results.noInternetMessageOffline ? 'PASS ✅' : 'FAIL ❌');
  console.log('3. No Blank Screen on Disconnect:       ', results.noBlankScreenOffline ? 'PASS ✅' : 'FAIL ❌');
  console.log('4. Slow 3G Loading Spinner Visible:     ', results.spinnerVisibleSlow3G ? 'PASS ✅' : 'FAIL ❌');
  console.log('5. Slow 3G Timeout Error Displayed:     ', results.noInternetMessageSlow3G ? 'PASS ✅' : 'FAIL ❌');
  console.log('6. App Stability (No Fatal Crashes):    ', results.noCrash ? 'PASS ✅' : 'FAIL ❌');
  console.log('============================================================\n');

  if (results.spinnerVisibleOffline && results.noInternetMessageOffline && results.noBlankScreenOffline && results.spinnerVisibleSlow3G && results.noInternetMessageSlow3G && results.noCrash) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runOfflineTests();
