const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8091;
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

async function runNavTests() {
  const server = createServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Server listening on http://localhost:${PORT}`);

  let browser;
  const testResults = [];
  const issues = [];

  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    const failedRequests = [];
    page.on('response', resp => {
      if (resp.status() >= 400 && !resp.url().includes('fonts.googleapis.com')) {
        failedRequests.push({ url: resp.url(), status: resp.status() });
      }
    });

    console.log('\n--- Navigating to Kiran App ---');
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle2' });
    await sleep(1500);

    const tabsToTest = ['home', 'alerts', 'precautions', 'emergency', 'about', 'home'];
    const modes = ['light', 'dark'];

    for (const mode of modes) {
      console.log(`\n==================================================`);
      console.log(`TESTING MODE: ${mode.toUpperCase()}`);
      console.log(`==================================================`);

      // Switch theme
      await page.evaluate((theme) => {
        document.documentElement.dataset.theme = theme;
      }, mode);
      await sleep(300);

      for (const tab of tabsToTest) {
        console.log(`\n[${mode.toUpperCase()}] Testing Tab: "${tab.toUpperCase()}"`);
        const startTime = Date.now();

        // Click the bottom nav tab
        await page.click(`.bottom-nav-item[data-tab="${tab}"]`);

        // Wait for screen to render completely
        if (tab === 'home') {
          await page.waitForFunction(() => {
            const panel = document.getElementById('pagePanel');
            const dash = document.getElementById('dashboard');
            return !panel.classList.contains('open') && dash && window.getComputedStyle(dash).display !== 'none';
          }, { timeout: 2000 });
        } else {
          await page.waitForFunction(() => {
            const panel = document.getElementById('pagePanel');
            const content = document.getElementById('pagePanelContent');
            return panel.classList.contains('open') && content && content.innerHTML.trim().length > 50;
          }, { timeout: 2000 });
        }

        const renderDuration = Date.now() - startTime;
        console.log(`Render Duration: ${renderDuration} ms (Limit: < 2000 ms) - ${renderDuration < 2000 ? 'PASS ✅' : 'FAIL ❌'}`);

        // Diagnostic inspection
        const pageDiagnostics = await page.evaluate((currentTab, currentMode) => {
          const res = {
            tab: currentTab,
            mode: currentMode,
            brokenImages: [],
            missingText: [],
            overlapping: [],
            bottomNavVisible: false,
            activeTabMatch: false
          };

          // 1. Check Bottom Nav visibility & active state
          const bNav = document.getElementById('bottomNav');
          if (bNav) {
            const bRect = bNav.getBoundingClientRect();
            res.bottomNavVisible = bRect.height > 0 && window.getComputedStyle(bNav).display === 'flex';
            const activeBtn = bNav.querySelector('.bottom-nav-item.active');
            if (activeBtn) {
              res.activeTabMatch = activeBtn.dataset.tab === currentTab;
            }

            // Check if floating action buttons overlap with bottom nav
            const floats = document.querySelectorAll('.floating-action');
            floats.forEach(fl => {
              if (window.getComputedStyle(fl).display !== 'none') {
                const fRect = fl.getBoundingClientRect();
                if (fRect.bottom > bRect.top && fRect.top < bRect.bottom) {
                  res.overlapping.push(`Floating button #${fl.id} overlaps bottom navigation! (Bottom: ${fRect.bottom}px, Nav top: ${bRect.top}px)`);
                }
              }
            });
          }

          // 2. Check for broken images
          const imgs = Array.from(document.querySelectorAll('img'));
          imgs.forEach(img => {
            if (window.getComputedStyle(img).display !== 'none') {
              if (!img.complete || img.naturalWidth === 0) {
                res.brokenImages.push(img.src || img.getAttribute('src'));
              }
            }
          });

          // 3. Check for missing text / unrendered placeholders
          const targetRoot = currentTab === 'home' ? document.getElementById('dashboard') : document.getElementById('pagePanelContent');
          if (targetRoot) {
            const textNodes = [];
            const walker = document.createTreeWalker(targetRoot, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
              const val = node.nodeValue.trim();
              if (val.length > 0) {
                if (val.includes('undefined') || val.includes('[object Object]') || val.includes('NaN')) {
                  res.missingText.push(`Suspicious text: "${val}" in <${node.parentElement.tagName.toLowerCase()}>`);
                }
              }
            }

            // Also check data-i18n elements for empty values
            const i18nElements = targetRoot.querySelectorAll('[data-i18n]');
            i18nElements.forEach(el => {
              if (!el.textContent.trim()) {
                res.missingText.push(`Empty i18n element: key="${el.getAttribute('data-i18n')}" in <${el.tagName.toLowerCase()}>`);
              }
            });
          }

          return res;
        }, tab, mode);

        // Save screenshot
        const screenshotName = `tab-${tab}-${mode}.png`;
        const screenshotPath = path.join(BASE_DIR, screenshotName);
        await page.screenshot({ path: screenshotPath });
        console.log(`Saved screenshot: ${screenshotName}`);

        const resultEntry = {
          mode,
          tab,
          renderDuration,
          within2Sec: renderDuration < 2000,
          activeTabMatch: pageDiagnostics.activeTabMatch,
          brokenImagesCount: pageDiagnostics.brokenImages.length,
          missingTextCount: pageDiagnostics.missingText.length,
          overlappingCount: pageDiagnostics.overlapping.length
        };
        testResults.push(resultEntry);

        if (pageDiagnostics.overlapping.length > 0) {
          issues.push(...pageDiagnostics.overlapping);
          console.warn('⚠️ Overlapping issues found:', pageDiagnostics.overlapping);
        }
        if (pageDiagnostics.brokenImages.length > 0) {
          issues.push(...pageDiagnostics.brokenImages.map(img => `Broken image: ${img}`));
          console.warn('⚠️ Broken images found:', pageDiagnostics.brokenImages);
        }
        if (pageDiagnostics.missingText.length > 0) {
          issues.push(...pageDiagnostics.missingText);
          console.warn('⚠️ Missing text found:', pageDiagnostics.missingText);
        }
      }
    }

  } catch (err) {
    console.error('Test execution failed:', err);
    issues.push(err.message);
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log('\n==================================================');
  console.log('BOTTOM NAVIGATION TEST RESULTS SUMMARY');
  console.log('==================================================');
  console.table(testResults);

  if (issues.length > 0) {
    console.log('\nISSUES DETECTED:');
    issues.forEach(iss => console.log(' - ' + iss));
  } else {
    console.log('\n✅ ALL TABS PASSED: All rendered < 2s, 0 UI overlaps, 0 broken images, 0 missing texts on both Light & Dark modes!');
  }

  process.exit(issues.length > 0 ? 1 : 0);
}

runNavTests();
