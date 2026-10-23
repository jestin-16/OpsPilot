"""
Pytest configuration and shared fixtures for OpsPilot Selenium automated tests.
"""

import os
from pathlib import Path
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Attempt to load local .env file if python-dotenv is present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

SCREENSHOT_DIR = Path("test-results/screenshots")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Hook to capture test execution status on each phase (setup, call, teardown).
    Used to trigger automatic screenshot capture when a test fails.
    """
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)


@pytest.fixture(scope="function")
def driver(request):
    """
    Initializes a clean Google Chrome WebDriver session before each test,
    and guarantees browser termination upon test completion or failure.
    Automatically captures a screenshot if a test fails.
    """
    # Ensure screenshot directory exists
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    # Configure Chrome options
    options = Options()
    headless_mode = os.getenv("HEADLESS", "true").lower() in ("true", "1", "yes")
    if headless_mode:
        options.add_argument("--headless=new")

    # Ensure stable desktop viewport size for consistent UI element layout
    options.add_argument("--window-size=1280,800")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver_instance = webdriver.Chrome(options=options)

    try:
        yield driver_instance
    finally:
        # Check if the test failed during the 'call' phase
        rep_call = getattr(request.node, "rep_call", None)
        if rep_call and rep_call.failed:
            failure_path = SCREENSHOT_DIR / f"failure_{request.node.name}.png"
            try:
                driver_instance.save_screenshot(str(failure_path))
                print(f"\n[Artifact] Test failed! Captured screenshot at: {failure_path}")
            except Exception as e:
                print(f"\n[Warning] Could not capture failure screenshot: {e}")

        # Always close browser
        driver_instance.quit()
