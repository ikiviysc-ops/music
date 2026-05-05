from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    errors = []
    page.on('console', lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type in ['error', 'warning'] else None)
    page.on('pageerror', lambda err: errors.append(f"[pageerror] {err}"))
    
    page.goto('http://localhost:3003/', timeout=15000)
    page.wait_for_load_state('networkidle', timeout=15000)
    time.sleep(3)
    
    page.screenshot(path='/workspace/test_screenshot.png', full_page=True)
    
    if errors:
        print("=== BROWSER ERRORS ===")
        for e in errors:
            print(e)
    else:
        print("No console errors found")
    
    canvas = page.query_selector('#canvas-container canvas')
    if canvas:
        print("Canvas element found")
    else:
        print("Canvas element NOT found")
    
    browser.close()
