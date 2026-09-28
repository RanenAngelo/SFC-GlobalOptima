from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})
    page.goto('http://localhost:3000/login')
    page.wait_for_selector('input[type="text"]')
    page.fill('input[type="text"]', 'admin@dineiq.local')
    page.fill('input[type="password"]', 'admin123')
    page.click('button.btn-primary')
    time.sleep(2)
    print("Current URL after login click:", page.url)
    page.screenshot(path="screenshots/UI/test_after_login.png")
    
    # Try navigating to /menu
    page.goto('http://localhost:3000/menu')
    time.sleep(2)
    print("URL after /menu:", page.url)
    page.screenshot(path="screenshots/UI/test_menu.png")
    browser.close()
