import time
import os
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

def capture_canonical():
    out_dir = Path("test-results/screenshots")
    out_dir.mkdir(parents=True, exist_ok=True)

    viewports = [
        (1440, 900, "opspilot_amber_platinum_1440.png"),
        (1280, 800, "opspilot_amber_platinum_1280.png"),
    ]

    for width, height, filename in viewports:
        options = Options()
        options.add_argument("--headless=new")
        options.add_argument(f"--window-size={width},{height}")
        options.add_argument("--enable-webgl")
        options.add_argument("--ignore-gpu-blocklist")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Chrome(options=options)
        try:
            url = "http://localhost:5173/"
            print(f"Navigating to {url} at {width}x{height}...")
            driver.get(url)
            time.sleep(2.5)

            filepath = out_dir / filename
            driver.save_screenshot(str(filepath))
            print(f"Saved {filepath} (size: {os.path.getsize(filepath)} bytes)")
        finally:
            driver.quit()

if __name__ == "__main__":
    capture_canonical()
