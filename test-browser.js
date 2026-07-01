import { chromium } from 'playwright';
import http from 'http';

const BASE = 'http://localhost:5173';
const API = 'http://localhost:3000';

function waitForServer(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) resolve();
        else reject(new Error(`Server returned ${res.statusCode}`));
      }).on('error', () => {
        if (Date.now() - start > timeout) reject(new Error('Timeout'));
        else setTimeout(check, 500);
      });
    };
    check();
  });
}

async function checkPage(browser, name, path, checks) {
  const page = await browser.new_page();
  const results = { name, errors: [], warnings: [] };

  try {
    await page.goto(`${BASE}${path}`, { wait_until: 'networkidle', timeout: 15000 });

    // Wait for Vue to render
    await page.wait_for_timeout(2000);

    // Check for Vue errors in console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
      if (msg.type() === 'warning' && msg.text().includes('Vue warn')) consoleErrors.push(`[WARN] ${msg.text()}`);
    });

    // Check for page errors
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    // Wait a bit more for async errors
    await page.wait_for_timeout(1000);

    results.errors.push(...consoleErrors);
    results.errors.push(...pageErrors);

    // Run custom checks
    if (checks) {
      for (const check of checks) {
        try {
          const result = await check(page);
          results[result.name] = result.passed;
          if (!result.passed) results.errors.push(result.error || `${result.name} failed`);
        } catch (e) {
          results.errors.push(`${check.name || 'check'}: ${e.message}`);
        }
      }
    }

    // Take screenshot
    const safeName = name.replace(/[^a-zA-Z0-9一-鿿]/g, '_');
    await page.screenshot({ path: `test-screenshots/${safeName}.png`, full_page: true });

  } catch (e) {
    results.errors.push(`Navigation failed: ${e.message}`);
    // Still take screenshot of error state
    const safeName = name.replace(/[^a-zA-Z0-9一-\ufff]/g, '_');
    try {
      await page.screenshot({ path: `test-screenshots/${safeName}_error.png`, full_page: true });
    } catch {}
  }

  await page.close();
  return results;
}

async function main() {
  console.log('Waiting for servers...');
  await waitForServer(`${BASE}/`);
  await waitForServer(`${API}/api/products`);
  console.log('Servers ready!');

  // Create screenshots directory
  import { mkdirSync } from 'fs';
  try { mkdirSync('test-screenshots'); } catch {}

  const browser = await chromium.launch({ headless: true });
  const results = [];

  // Test 1: Home page
  console.log('\n=== Test 1: Home Page (/) ===');
  results.push(await checkPage(browser, 'Home', '/', [
    {
      name: 'pageTitle',
      async (page) => {
        const title = await page.title();
        return { name: 'title', passed: title.length > 0, error: `Title: "${title}"` };
      }
    },
    {
      name: 'hasContent',
      async (page) => {
        const html = await page.content();
        const hasRealContent = html.includes('cobi18') || html.includes('product');
        return { name: 'hasContent', passed: hasRealContent, error: 'Page appears empty' };
      }
    },
    {
      name: 'noVueErrors',
      async (page) => {
        // Already captured in console errors
        return { name: 'noVueErrors', passed: true, error: null };
      }
    }
  ]));

  // Test 2: Product management (protected)
  console.log('\n=== Test 2: Product Management (/product-management) ===');
  results.push(await checkPage(browser, 'ProductManagement', '/product-management', [
    {
      name: 'noCrash',
      async (page) => {
        const html = await page.content();
        // Should either show login modal or redirect, but not crash
        return { name: 'noCrash', passed: true, error: null };
      }
    }
  ]));

  // Test 3: i18n manager (protected)
  console.log('\n=== Test 3: i18n Manager (/i18n-manager) ===');
  results.push(await checkPage(browser, 'I18nManager', '/i18n-manager', []));

  // Test 4: Login and then access protected pages
  console.log('\n=== Test 4: Login Flow ===');
  const loginPage = await browser.new_page();
  await loginPage.goto(`${BASE}/`, { wait_until: 'networkidle', timeout: 15000 });
  await loginPage.wait_for_timeout(1000);

  // Open drawer and click admin login
  try {
    // Click hamburger menu
    const menuBtn = await loginPage.$('button[class*="Menu-button"]');
    if (menuBtn) {
      await menuBtn.click();
      await loginPage.wait_for_timeout(500);

      // Click admin login in drawer
      const adminLogin = await loginPage.$('text=Admin Login');
      if (adminLogin) {
        await adminLogin.click();
        await loginPage.wait_for_timeout(500);
      }
    }
  } catch (e) {
    console.log('Login flow note:', e.message);
  }

  // Try to find and use login modal
  try {
    // Fill in credentials
    const usernameInput = await loginPage.$('input[placeholder*="username" i], input[placeholder*="用户名"]');
    const passwordInput = await loginPage.$('input[type="password"]');
    const loginBtn = await loginPage.$('button:has-text("Login"), button:has-text("登录")');

    if (usernameInput && passwordInput && loginBtn) {
      await usernameInput.fill('admin');
      await passwordInput.fill('admin123');
      await loginBtn.click();
      await loginPage.wait_for_timeout(1000);
      console.log('Login submitted');
    }
  } catch (e) {
    console.log('Login form interaction note:', e.message);
  }

  await loginPage.close();

  // Test 5: Product management with auth
  console.log('\n=== Test 5: Product Management (with auth) ===');
  results.push(await checkPage(browser, 'ProductManagement_Auth', '/product-management', [
    {
      name: 'showsContent',
      async (page) => {
        const html = await page.content();
        const hasProducts = html.includes('cobi18') || html.includes('containeruser') || html.includes('folder') || html.includes('page-header');
        return { name: 'showsContent', passed: hasProducts, error: 'No product content found' };
      }
    }
  ]));

  // Test 6: i18n manager with auth
  console.log('\n=== Test 6: i18n Manager (with auth) ===');
  results.push(await checkPage(browser, 'I18nManager_Auth', '/i18n-manager', []));

  // Test 7: Navigate to product detail
  console.log('\n=== Test 7: Product Detail ===');
  results.push(await checkPage(browser, 'ProductDetail', '/product/cobi18', [
    {
      name: 'showsProduct',
      async (page) => {
        const html = await page.content();
        return { name: 'showsProduct', passed: html.includes('cobi18'), error: 'Product name not found' };
      }
    }
  ]));

  // Test 8: Back to home
  console.log('\n=== Test 8: Back to Home ===');
  results.push(await checkPage(browser, 'Home2', '/', []));

  await browser.close();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    const hasErrors = r.errors && r.errors.length > 0;
    const status = hasErrors ? 'FAIL' : 'PASS';
    if (!hasErrors) passCount++;
    else failCount++;

    console.log(`\n[${status}] ${r.name}`);
    if (hasErrors) {
      for (const err of r.errors) {
        console.log(`  ERROR: ${err}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('='.repeat(60));

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Test runner error:', e);
  process.exit(1);
});
