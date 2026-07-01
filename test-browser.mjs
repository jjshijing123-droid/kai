import asyncio
import os
import sys
from playwright.async_api import async_playwright

BASE = 'http://localhost:5173'
API = 'http://localhost:3000'
SCREENSHOT_DIR = 'test-screenshots'

async def wait_for_server(url, timeout=15000):
    import aiohttp
    start = asyncio.get_event_loop().time()
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=2) as resp:
                    if resp.status == 200:
                        return
        except:
            pass
        if asyncio.get_event_loop().time() - start > timeout / 1000:
            raise Exception(f"Server {url} not ready after {timeout}ms")
        await asyncio.sleep(0.5)

async def check_page(page, name, path):
    results = {"name": name, "errors": [], "warnings": []}

    try:
        await page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(2000)

        # Capture console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type in ("error", "warning") else None)

        await page.wait_for_timeout(1000)

        # Filter for Vue/relevant errors
        for err in console_errors:
            if "Vue warn" in err or "Unhandled error" in err or "ReferenceError" in err or "TypeError" in err:
                if "CommonJS" not in err:  # Ignore CJS warnings
                    results["errors"].append(f"CONSOLE: {err[:200]}")

        # Check for visible content
        content = await page.content()

        # Take screenshot
        os.makedirs(SCREENSHOT_DIR, exist_ok=True)
        safe_name = "".join(c if c.isalnum() or c in "_-一-龯" else "_" for c in name)
        await page.screenshot(path=f"{SCREENSHOT_DIR}/{safe_name}.png", full_page=True)

        # Basic checks
        if len(content) < 500 and "application" not in content.lower():
            results["errors"].append(f"Page content very small ({len(content)} bytes)")

    except Exception as e:
        results["errors"].append(f"Navigation failed: {e.message}")
        os.makedirs(SCREENSHOT_DIR, exist_ok=True)
        safe_name = "".join(c if c.isalnum() else "_" for c in name)
        try:
            await page.screenshot(path=f"{SCREENSHOT_DIR}/{safe_name}_error.png", full_page=True)
        except:
            pass

    return results

async def main():
    print("Waiting for servers...")
    try:
        import aiohttp
    except ImportError:
        # Fallback: just wait
        await asyncio.sleep(3)

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        results = []

        # Test 1: Home page
        print("\n=== Test 1: Home Page (/) ===")
        r = await check_page(await browser.new_page(), "Home", "/")
        results.append(r)
        print(f"  Errors: {len(r['errors'])}")
        for e in r["errors"][:3]:
            print(f"    - {e[:100]}")

        # Test 2: Product management (should redirect or show login)
        print("\n=== Test 2: Product Management (/product-management) ===")
        r = await check_page(await browser.new_page(), "ProductManagement", "/product-management")
        results.append(r)
        print(f"  Errors: {len(r['errors'])}")
        for e in r["errors"][:3]:
            print(f"    - {e[:100]}")

        # Test 3: i18n manager (should redirect or show login)
        print("\n=== Test 3: i18n Manager (/i18n-manager) ===")
        r = await check_page(await browser.new_page(), "I18nManager", "/i18n-manager")
        results.append(r)
        print(f"  Errors: {len(r['errors'])}")
        for e in r["errors"][:3]:
            print(f"    - {e[:100]}")

        # Test 4: Login flow
        print("\n=== Test 4: Login Flow ===")
        page = await browser.new_page()
        console_logs = []
        page.on("console", lambda msg: console_logs.append(msg.text) if msg.type == "error" else None)
        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(err.message))

        await page.goto(f"{BASE}/", wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(1500)

        # Try to open drawer and login
        try:
            # Click hamburger menu
            menu_btn = await page.query_selector('button[class*="Menu-button"]')
            if menu_btn:
                await menu_btn.click()
                await page.wait_for_timeout(500)

            # Try to find and click admin login
            admin_login = await page.query_selector('text=Admin Login')
            if admin_login:
                await admin_login.click()
                await page.wait_for_timeout(500)
        except Exception as e:
            print(f"  Menu interaction: {e}")

        # Try login form
        try:
            # Fill in credentials using more specific selectors
            inputs = await page.query_selector_all('input')
            for inp in inputs:
                placeholder = await inp.get_attribute("placeholder") or ""
                if "user" in placeholder.lower() or "用户" in placeholder:
                    await inp.fill("admin")
                elif "pass" in placeholder.lower() or "密码" in placeholder:
                    await inp.fill("admin123")

            # Click login button
            buttons = await page.query_selector_all('button')
            for btn in buttons:
                text = await btn.text_content() or ""
                if "login" in text.lower() or "登录" in text or "unlock" in text.lower():
                    await btn.click()
                    break

            await page.wait_for_timeout(1000)
            print("  Login attempted")
        except Exception as e:
            print(f"  Login attempt: {e}")

        # Check for errors during login
        print(f"  Console errors: {len(console_logs)}")
        for e in console_logs[:5]:
            print(f"    - {e[:100]}")
        print(f"  Page errors: {len(page_errors)}")
        for e in page_errors[:3]:
            print(f"    - {e[:100]}")

        await page.screenshot(path=f"{SCREENSHOT_DIR}/login_flow.png", full_page=True)
        await page.close()

        # Test 5: Product management after login attempt
        print("\n=== Test 5: Product Management (post-login) ===")
        r = await check_page(await browser.new_page(), "ProductManagement_PostLogin", "/product-management")
        results.append(r)
        print(f"  Errors: {len(r['errors'])}")
        for e in r["errors"][:3]:
            print(f"    - {e[:100]}")

        # Test 6: Product detail page
        print("\n=== Test 6: Product Detail (/product/cobi18) ===")
        r = await check_page(await browser.new_page(), "ProductDetail", "/product/cobi18")
        results.append(r)
        print(f"  Errors: {len(r['errors'])}")
        for e in r["errors"][:3]:
            print(f"    - {e[:100]}")

        # Test 7: Product list page (return home)
        print("\n=== Test 7: Home Page Revisit ===")
        r = await check_page(await browser.new_page(), "Home_Revisit", "/")
        results.append(r)
        print(f"  Errors: {len(r['errors'])}")
        for e in r["errors"][:3]:
            print(f"    - {e[:100]}")

        await browser.close()

        # Summary
        print("\n" + "=" * 60)
        print("TEST RESULTS SUMMARY")
        print("=" * 60)

        pass_count = 0
        fail_count = 0

        for r in results:
            has_errors = len(r["errors"]) > 0
            status = "FAIL" if has_errors else "PASS"
            if not has_errors:
                pass_count += 1
            else:
                fail_count += 1

            print(f"\n[{status}] {r['name']}")
            for e in r["errors"][:5]:
                print(f"  ERROR: {e[:150]}")

        print("\n" + "=" * 60)
        print(f"Total: {len(results)} | Passed: {pass_count} | Failed: {fail_count}")
        print(f"Screenshots saved to: {os.path.abspath(SCREENSHOT_DIR)}/")
        print("=" * 60)

        sys.exit(0 if fail_count == 0 else 1)

if __name__ == "__main__":
    asyncio.run(main())
