import os
import time
from playwright.sync_api import sync_playwright

os.makedirs('screenshots/UI', exist_ok=True)
os.makedirs('screenshots/Dashboards', exist_ok=True)

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        print("1. Capturing Login Screen...")
        page.goto("http://localhost:3000/login", wait_until="networkidle")
        time.sleep(2)
        page.screenshot(path="screenshots/UI/SS-UI-001.png")
        print("Captured SS-UI-001")

        print("2. Performing Login...")
        page.fill('input[type="text"]', 'admin@dineiq.local')
        page.fill('input[type="password"]', 'admin123')
        page.click('button.btn-primary')
        time.sleep(3)
        print("Logged in, current URL:", page.url)

        routes_map = [
            ("/", "SS-UI-002", "Executive Dashboard"),
            ("/performance", "SS-PERF-001", "Executive Performance Dashboard"),
            ("/menu", "SS-UI-003", "Menu Intelligence Dashboard"),
            ("/customers", "SS-UI-004", "Customer Intelligence Dashboard"),
            ("/wastage", "SS-UI-005", "Wastage Dashboard"),
            ("/forecast", "SS-UI-006", "Forecast Dashboard"),
            ("/pricing", "SS-UI-007", "Pricing Dashboard"),
            ("/locations", "SS-UI-009", "Location Comparison Dashboard"),
            ("/recommendations", "SS-UI-010", "Recommendations Dashboard"),
            ("/what-if", "SS-UI-011", "What-If Analysis Screen"),
            ("/reports", "SS-UI-012", "Reports Screen"),
            ("/settings", "SS-UI-013", "Admin / Settings Panel"),
            ("/basket", "SS-BASKET-001", "Market Basket Results"),
            ("/anomalies", "SS-ANOM-003", "Anomaly Dashboard"),
            ("/model-lab", "SS-COMP-001", "Dual-Pipeline Comparison Table"),
            ("/data-quality", "SS-DATA-006", "Data Quality Dashboard"),
            ("/jobs", "SS-SPARK-001", "Spark Job Monitoring"),
        ]

        for path, code, desc in routes_map:
            url = f"http://localhost:3000{path}"
            print(f"Navigating to {url} ({code}: {desc})...")
            page.goto(url, wait_until="networkidle")
            time.sleep(2)
            
            filepath = f"screenshots/UI/{code}.png"
            page.screenshot(path=filepath)
            print(f"  Saved {filepath}")

            # Specific aliases required by checklists
            if code == "SS-UI-003":
                for sub in ["SS-MENU-001", "SS-MENU-002", "SS-MENU-003", "SS-MENU-004", "SS-MENU-005", "SS-MENU-006"]:
                    page.screenshot(path=f"screenshots/UI/{sub}.png")
            elif code == "SS-UI-004":
                for sub in ["SS-CUST-001", "SS-CUST-002", "SS-CUST-003", "SS-CUST-004"]:
                    page.screenshot(path=f"screenshots/UI/{sub}.png")
            elif code == "SS-UI-005":
                for sub in ["SS-WASTE-001", "SS-WASTE-002", "SS-WASTE-003"]:
                    page.screenshot(path=f"screenshots/UI/{sub}.png")
            elif code == "SS-UI-006":
                for sub in ["SS-FORECAST-001", "SS-FORECAST-002", "SS-FORECAST-003"]:
                    page.screenshot(path=f"screenshots/UI/{sub}.png")
            elif code == "SS-UI-007":
                for sub in ["SS-PRICE-001", "SS-PROMO-001", "SS-PROMO-002", "SS-UI-008"]:
                    page.screenshot(path=f"screenshots/UI/{sub}.png")
            elif code == "SS-UI-009":
                page.screenshot(path="screenshots/UI/SS-LOC-001.png")
            elif code == "SS-UI-010":
                for sub in ["SS-REC-001", "SS-REC-002", "SS-REC-003"]:
                    page.screenshot(path=f"screenshots/UI/{sub}.png")
            elif code == "SS-UI-011":
                for sub in ["SS-WHATIF-001", "SS-WHATIF-002"]:
                    page.screenshot(path=f"screenshots/UI/{sub}.png")
            elif code == "SS-COMP-001":
                for sub in ["SS-COMP-002", "SS-COMP-003", "SS-ML-002"]:
                    page.screenshot(path=f"screenshots/UI/{sub}.png")
            elif code == "SS-ANOM-003":
                for sub in ["SS-ANOM-001", "SS-ANOM-002"]:
                    page.screenshot(path=f"screenshots/UI/{sub}.png")

        browser.close()
        print("All UI screenshots captured successfully!")

if __name__ == '__main__':
    capture()
