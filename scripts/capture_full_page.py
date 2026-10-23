import time
import os
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def capture_landing_experience():
    out_dir = Path("test-results/screenshots")
    out_dir.mkdir(parents=True, exist_ok=True)

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,900")
    options.add_argument("--enable-webgl")
    options.add_argument("--ignore-gpu-blocklist")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(options=options)
    try:
        url = "http://localhost:5173/"
        print(f"Loading {url}...")
        driver.get(url)
        time.sleep(2.5)

        # 1. Hero top view
        driver.save_screenshot(str(out_dir / "opspilot_amber_01_hero.png"))
        print("Captured Hero.")

        # 2. Scroll to capabilities & platform
        driver.execute_script("window.scrollTo(0, 1050);")
        time.sleep(1.2)
        driver.save_screenshot(str(out_dir / "opspilot_amber_02_capabilities.png"))
        print("Captured Capabilities.")

        # 2b. Scroll to capabilities technical previews (top row)
        driver.execute_script("window.scrollTo(0, 1500);")
        time.sleep(1.2)
        driver.save_screenshot(str(out_dir / "opspilot_amber_02b_cards.png"))
        print("Captured Capability Cards (Top).")

        # 2c. Scroll to capabilities technical previews (bottom row: Loki & Audit)
        driver.execute_script("window.scrollTo(0, 1950);")
        time.sleep(1.2)
        driver.save_screenshot(str(out_dir / "opspilot_amber_02c_loki_audit.png"))
        print("Captured Capability Cards (Bottom).")

        # 3. Scroll to Connected Platform Story
        driver.execute_script("document.getElementById('product-preview').scrollIntoView();")
        time.sleep(1.2)
        driver.save_screenshot(str(out_dir / "opspilot_amber_03_story.png"))
        print("Captured Story.")

        # 4. Scroll to Workflow Timeline
        driver.execute_script("document.getElementById('workflow').scrollIntoView();")
        time.sleep(1.2)
        driver.save_screenshot(str(out_dir / "opspilot_amber_04_workflow.png"))
        print("Captured Workflow.")

        # 5. Scroll to Final CTA Banner
        driver.execute_script("document.querySelector('.landing-final-cta').scrollIntoView({ block: 'center' });")
        time.sleep(1.2)
        driver.save_screenshot(str(out_dir / "opspilot_amber_05_cta_banner.png"))
        print("Captured CTA Banner.")

        # 6. Scroll to Footer
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1.2)
        driver.save_screenshot(str(out_dir / "opspilot_amber_06_footer.png"))
        driver.save_screenshot(str(out_dir / "opspilot_amber_05_cta_footer.png"))
        print("Captured Footer.")

    finally:
        driver.quit()

if __name__ == "__main__":
    capture_landing_experience()
