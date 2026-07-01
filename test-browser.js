const { chromium } = require('playwright');
const http = require('http');

const BASE = 'http://localhost:5173';
const API = 'http://localhost:3000';

function waitForServer(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get(url, { headers: { 'Accept': 'text/html,application/xhtml+xml,*/*' } }, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else if (res.statusCode === 404 && url.includes('5173')) {
          // Vite dev server may return 404 for some paths but still be running
          resolve();
        } else if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for ${url}`));
        } else {
          setTimeout(check, 500);
        }
      }).on('error', () => {
        if (Date.now() - start > timeout) reject(new Error(`Timeout waiting for ${url}`));
        else setTimeout(check, 500);
      });
    };
    check();
  });
}

async function checkPage(browser, name, path, checks) {
  const page = await browser.newPage();
  const results = { name, errors: [], warnings: [] };

  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));
    await page.waitForTimeout(1000);

    results.errors.push(...consoleErrors);
    results.errors.push(...pageErrors);

    if (checks) {
      for (let i = 0; i < checks.length; i++) {
        try {
          const check = checks[i];
          const result = await check.fn(page);
          results[check.name] = result;
          if (!result) results.errors.push(check.error || `${check.name} failed`);
        } catch (e) {
          results.errors.push(`${checks[i].name || 'check'}: ${e.message}`);
        }
      }
    }

    const safeName = name.replace(/[^\x20-\x7e一-鿿]/g, '_');
    const fs = require('fs');
    try { fs.mkdirSync('test-screenshots', { recursive: true }); } catch {}
    await page.screenshot({ path: `test-screenshots/${safeName}.png`, fullPage: true });

  } catch (e) {
    results.errors.push(`Navigation failed: ${e.message}`);
    const safeName = name.replace(/[^\x20-\x7e一-鿿]/g, '_');
    const fs = require('fs');
    try { fs.mkdirSync('test-screenshots', { recursive: true }); } catch {}
    try { await page.screenshot({ path: `test-screenshots/${safeName}_error.png`, fullPage: true }); } catch {}
  }

  await page.close();
  return results;
}

async function main() {
  console.log('Starting browser tests...');

  const browser = await chromium.launch({ headless: true });
  const results = [];

  // Test 0: Auth API
  console.log('\n=== Test 0: Auth API ===');
  results.push(await checkPage(browser, 'AuthAPI', '/', [
    {
      name: 'loginEndpoint',
      fn: async (page) => {
        const resp = await page.evaluate(async () => {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
          });
          const data = await res.json();
          return { status: res.status, success: data.success, hasToken: !!data.data?.token };
        });
        return resp.status === 200 && resp.success && resp.hasToken;
      },
      error: `Login endpoint failed: status=${200}, success=${true}`
    },
    {
      name: 'authRequiredForWrite',
      fn: async (page) => {
        const resp = await page.evaluate(async () => {
          const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productName: 'test-hack', folderName: 'test-hack' })
          });
          const data = await res.json();
          return { status: res.status, message: data.message };
        });
        return resp.status === 401;
      },
      error: 'Write should be blocked without auth (401)'
    },
    {
      name: 'verifyWithToken',
      fn: async (page) => {
        const resp = await page.evaluate(async () => {
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
          });
          const loginData = await loginRes.json();
          const token = loginData.data?.token;
          if (!token) return { status: 0, ok: false };

          const verifyRes = await fetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const verifyData = await verifyRes.json();
          return { status: verifyRes.status, data: verifyData };
        });
        return resp.status === 200 && resp.data?.success === true;
      },
      error: 'Token verification should succeed'
    }
  ]));

  // Test 1: Home page
  console.log('\n=== Test 1: Home Page (/) ===');
  results.push(await checkPage(browser, 'Home', '/', [
    {
      name: 'pageTitle',
      fn: async (page) => {
        const title = await page.title();
        return title.length > 0;
      },
      error: 'Page has no title'
    },
    {
      name: 'hasContent',
      fn: async (page) => {
        const html = await page.content();
        return html.includes('product') || html.includes('Product') || html.includes('cobi18');
      },
      error: 'Page appears empty'
    },
    {
      name: 'loadsProducts',
      fn: async (page) => {
        const html = await page.content();
        return html.includes('cobi18') || html.includes('cobi18 - 副本') || html.includes('view2');
      },
      error: 'No products loaded on home page'
    }
  ]));

  // Test 2: Product detail
  console.log('\n=== Test 2: Product Detail ===');
  results.push(await checkPage(browser, 'ProductDetail', '/product/cobi18', [
    {
      name: 'showsProduct',
      fn: async (page) => {
        const html = await page.content();
        return html.includes('cobi18');
      },
      error: 'Product name not found on detail page'
    }
  ]));

  // Test 3: 3D Viewer
  console.log('\n=== Test 3: 3D Viewer ===');
  results.push(await checkPage(browser, 'Product3DViewer', '/product-3d/cobi18', [
    {
      name: 'noCrash',
      fn: async (page) => {
        const html = await page.content();
        return html.length > 100;
      },
      error: '3D Viewer page too short, may have crashed'
    }
  ]));

  // Test 4: Product Management (protected, no auth)
  console.log('\n=== Test 4: Product Management (no auth) ===');
  results.push(await checkPage(browser, 'ProductManagement', '/product-management', [
    {
      name: 'redirectsOrShowsLogin',
      fn: async (page) => {
        const url = page.url();
        const html = await page.content();
        const isRedirected = !url.includes('/product-management');
        const showsLogin = html.includes('login') || html.includes('登录') || html.includes('Admin');
        return isRedirected || showsLogin;
      },
      error: 'Should redirect or show login for protected route'
    }
  ]));

  // Test 5: Login flow
  console.log('\n=== Test 5: Login Flow ===');
  const loginPage = await browser.newPage();
  await loginPage.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 15000 });
  await loginPage.waitForTimeout(1000);

  try {
    const menuBtn = await loginPage.$('button[class*="Menu"]');
    if (menuBtn) {
      await menuBtn.click();
      await loginPage.waitForTimeout(500);
      const adminLink = await loginPage.$('text=Admin Login');
      if (adminLink) {
        await adminLink.click();
        await loginPage.waitForTimeout(500);
      }
    }

    const usernameInput = await loginPage.$('input[placeholder*="username" i], input[placeholder*="用户名"]');
    const passwordInput = await loginPage.$('input[type="password"]');
    const loginBtn = await loginPage.$('button:has-text("Login"), button:has-text("登录")');

    if (usernameInput && passwordInput && loginBtn) {
      await usernameInput.fill('admin');
      await passwordInput.fill('admin123');
      await loginBtn.click();
      await loginPage.waitForTimeout(2000);
      console.log('Login submitted successfully');
    }
  } catch (e) {
    console.log('Login flow note:', e.message);
  }
  await loginPage.close();

  // Test 6: Product Management after login
  console.log('\n=== Test 6: Product Management (after login) ===');
  results.push(await checkPage(browser, 'ProductManagement_Auth', '/product-management', [
    {
      name: 'showsContent',
      fn: async (page) => {
        const html = await page.content();
        const hasProducts = html.includes('cobi18') || html.includes('folder') || html.includes('page-header') || html.includes('containeruser');
        return hasProducts;
      },
      error: 'No product content found after login'
    }
  ]));

  // Test 7: i18n Manager
  console.log('\n=== Test 7: i18n Manager ===');
  results.push(await checkPage(browser, 'I18nManager', '/i18n-manager', [
    {
      name: 'noCrash',
      fn: async (page) => {
        const html = await page.content();
        return html.length > 100;
      },
      error: 'i18n Manager page too short'
    }
  ]));

  await browser.close();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  let passCount = 0;
  let failCount = 0;

  for (const r of results) {
    const checkKeys = Object.keys(r).filter(k => k !== 'name' && k !== 'errors' && k !== 'warnings');
    const checkTotal = checkKeys.length;
    const checkPasses = checkKeys.filter(k => r[k] === true).length;
    const hasErrors = r.errors && r.errors.length > 0;

    const status = (!hasErrors && checkPasses === checkTotal) ? 'PASS' : 'FAIL';
    if (status === 'PASS') passCount++;
    else failCount++;

    console.log(`\n[${status}] ${r.name} (${checkPasses}/${checkTotal} checks)`);
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
