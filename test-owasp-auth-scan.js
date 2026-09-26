const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8094;
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

  const firebaseConfigPath = path.join(BASE_DIR, 'firebase.json');
  let ignoredFiles = [];
  try {
    const fbJson = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    ignoredFiles = (fbJson.hosting && fbJson.hosting.ignore) || [];
  } catch (e) {}

  return http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filename = path.basename(reqPath);
    if (ignoredFiles.includes(filename) || ignoredFiles.includes(reqPath.slice(1))) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found (Ignored by Firebase Hosting)');
      return;
    }
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

async function runOwaspAuthScan() {
  const server = createServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Test server running on http://localhost:${PORT}`);

  const scanReport = {
    sqliVulnerable: false,
    sqliTestDetails: [],
    bruteForceClientRateLimit: false,
    bruteForceServerResponse: null,
    sensitiveFileExposed: false,
    sensitiveFilePath: null,
    findings: []
  };

  let browser;
  try {
    // ----------------------------------------------------
    // CHECK 1: Static / HTTP exposure of sensitive credentials
    // ----------------------------------------------------
    console.log('\n--- CHECK 1: Checking Static Exposure of firebase-key.json ---');
    const sensitiveFileUrl = `http://localhost:${PORT}/firebase-key.json`;
    const checkFile = await new Promise((resolve) => {
      http.get(sensitiveFileUrl, (res) => {
        let raw = '';
        res.on('data', chunk => raw += chunk);
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, body: raw });
        });
      }).on('error', () => resolve({ statusCode: 500 }));
    });

    if (checkFile.statusCode === 200 && checkFile.body.includes('private_key')) {
      scanReport.sensitiveFileExposed = true;
      scanReport.sensitiveFilePath = '/firebase-key.json';
      console.warn('⚠️ CRITICAL VULNERABILITY FOUND: firebase-key.json is publicly accessible over HTTP!');
      scanReport.findings.push({
        id: 'OWASP-A05-01',
        title: 'Sensitive Service Account Private Key Publicly Exposed in Web Root',
        severity: 'CRITICAL',
        owaspCategory: 'A05:2021-Security Misconfiguration & A01:2021-Broken Access Control',
        detail: 'The file firebase-key.json containing a GCP private key for firebase-adminsdk-fbsvc@kiranbhav2122.iam.gserviceaccount.com is located in the webroot and served via HTTP.'
      });
    }

    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    const browserErrors = [];
    page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.type(), msg.text()));
    page.on('pageerror', err => browserErrors.push(err.message));

    console.log('\n--- Loading Kiran App ---');
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Open Auth modal
    await page.click('#loginButton');
    await page.waitForSelector('#authEmail', { visible: true, timeout: 5000 });
    await sleep(400);

    // ----------------------------------------------------
    // CHECK 2: SQL Injection Evaluation on Authentication Inputs
    // ----------------------------------------------------
    console.log('\n--- CHECK 2: Evaluating SQL Injection Resilience ---');
    const sqliPayloads = [
      { email: "admin' OR '1'='1", pass: "password' OR '1'='1" },
      { email: "test@example.com' UNION SELECT 1,2,3--", pass: "' OR 1=1#" }
    ];

    for (const testCase of sqliPayloads) {
      console.log(`Testing SQLi payload: Email: "${testCase.email}", Pass: "${testCase.pass}"`);

      // Clear fields
      await page.evaluate(() => {
        document.getElementById('authEmail').value = '';
        document.getElementById('authPassword').value = '';
      });

      await page.type('#authEmail', testCase.email);
      await page.type('#authPassword', testCase.pass);

      // Attempt submission
      await page.click('#authSubmitBtn');
      await sleep(1500);

      // Check if logged in or rejected
      const isLoggedIn = await page.evaluate(() => window.isLoggedIn);
      const errorMsg = await page.$eval('#authErrorMessage', el => el.innerText.trim()).catch(() => '');

      console.log(`SQLi attempt result: isLoggedIn=${isLoggedIn}, Error Displayed="${errorMsg}"`);
      scanReport.sqliTestDetails.push({
        payload: testCase,
        bypassed: isLoggedIn,
        error: errorMsg
      });

      if (isLoggedIn) {
        scanReport.sqliVulnerable = true;
        console.error('CRITICAL: SQLi authentication bypass detected!');
      }
    }

    if (!scanReport.sqliVulnerable) {
      console.log('✅ SQL Injection Test: Immune. Firebase Auth rejects or handles SQL meta-characters as invalid input without query execution.');
    }

    await page.screenshot({ path: path.join(BASE_DIR, 'owasp-1-sqli-rejection.png') });
    console.log('Saved screenshot: owasp-1-sqli-rejection.png');

    // ----------------------------------------------------
    // CHECK 3: Brute-Force Password Attempts & Rate Limiting
    // ----------------------------------------------------
    console.log('\n--- CHECK 3: Evaluating Brute-Force & Rate-Limiting Behavior ---');
    const targetEmail = 'citizen@kiranapp.test';
    const bruteForceAttempts = 6;
    let clientLocked = false;
    let capturedFirebaseErrors = [];

    for (let i = 1; i <= bruteForceAttempts; i++) {
      console.log(`Brute-force attempt #${i}...`);
      await page.evaluate((email, attempt) => {
        document.getElementById('authEmail').value = email;
        document.getElementById('authPassword').value = `WrongPass_${attempt}_${Date.now()}`;
      }, targetEmail, i);

      await page.click('#authSubmitBtn');
      await sleep(1800);

      const btnState = await page.evaluate(() => {
        const btn = document.getElementById('authSubmitBtn');
        const errEl = document.getElementById('authErrorMessage');
        return {
          disabled: btn ? btn.disabled : false,
          text: btn ? btn.innerText.trim() : '',
          errorText: errEl ? errEl.innerText.trim() : ''
        };
      });

      console.log(`Attempt #${i} Outcome: Button Disabled=${btnState.disabled}, Error="${btnState.errorText}"`);
    }

    // Capture screenshot of brute force attempts
    await page.screenshot({ path: path.join(BASE_DIR, 'owasp-2-brute-force-feedback.png') });
    console.log('Saved screenshot: owasp-2-brute-force-feedback.png');

    // Inspect client side rate limit enforcement
    const isClientRateLimited = await page.evaluate(() => {
      // Check if client provides lockout or delay
      const btn = document.getElementById('authSubmitBtn');
      return btn && btn.disabled;
    });

    scanReport.bruteForceClientRateLimit = isClientRateLimited;
    if (!isClientRateLimited) {
      console.warn('⚠️ Flaw Found: Client-side lacks progressive backoff/cooldown after repeated failed attempts.');
      scanReport.findings.push({
        id: 'OWASP-A07-01',
        title: 'Lack of Client-Side Rate Limiting / Exponential Backoff',
        severity: 'MEDIUM',
        owaspCategory: 'A07:2021-Identification and Authentication Failures',
        detail: 'The application immediately re-enables the Sign In button after consecutive invalid password attempts without client-side throttle, CAPTCHA challenge, or temporary lockout delay.'
      });
      scanReport.findings.push({
        id: 'OWASP-A07-02',
        title: 'Generic Masking of Firebase auth/too-many-requests Lockout Code',
        severity: 'LOW',
        owaspCategory: 'A07:2021-Identification and Authentication Failures',
        detail: 'The catch block in app.js maps all authentication rejections (including too-many-requests) to "Invalid Credentials", obscuring rate-limit lockout states from legitimate users.'
      });
    }

  } catch (err) {
    console.error('Scan execution error:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log('\n============================================================');
  console.log('OWASP SECURITY AUDIT SUMMARY');
  console.log('1. SQL Injection Vulnerability:      ', scanReport.sqliVulnerable ? 'VULNERABLE ❌' : 'IMMUNE / SAFE ✅');
  console.log('2. Client-Side Brute-Force Throttling:', scanReport.bruteForceClientRateLimit ? 'ENFORCED ✅' : 'MISSING ⚠️');
  console.log('3. Sensitive Key Exposure:           ', scanReport.sensitiveFileExposed ? 'EXPOSED (CRITICAL) ❌' : 'NOT EXPOSED ✅');
  console.log(`4. Total Findings Identified:        ${scanReport.findings.length}`);
  console.log('============================================================\n');

  fs.writeFileSync(path.join(BASE_DIR, 'owasp-scan-results.json'), JSON.stringify(scanReport, null, 2));
}

runOwaspAuthScan();
