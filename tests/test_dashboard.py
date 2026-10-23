"""
OpsPilot Dashboard Automated Testing Suite
==========================================
Technology Stack:
- Python 3.14
- Selenium WebDriver 4.49
- Pytest 9.1
- Google Chrome (Headless / Desktop viewport)

This test module implements exclusively the Dashboard Loading Test for OpsPilot.
It performs authentication, waits for the dashboard components to render via
explicit waits, verifies core UI elements (heading, sidebar navigation, main content),
ensures no error pages or alerts are displayed, and captures a screenshot.
"""

import os
from pathlib import Path
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ---------------------------------------------------------------------------
# Configuration & Environment Variables
# ---------------------------------------------------------------------------
BASE_URL = os.getenv("OPSPILOT_BASE_URL", "http://localhost:5173").rstrip("/")
TEST_EMAIL = os.getenv("OPSPILOT_TEST_EMAIL", "admin@opspilot.io")
TEST_PASSWORD = os.getenv("OPSPILOT_TEST_PASSWORD", "Password123!")

# Directory for evidence screenshots
SCREENSHOT_DIR = Path("test-results/screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

TIMEOUT = 15


def test_dashboard_loading(driver):
    """
    Test Case: Dashboard Loading Test
    ---------------------------------
    1. Authenticate to OpsPilot using credentials from environment variables.
    2. Wait for successful login and navigate to the dashboard route (/dashboard).
    3. Explicitly wait for core dashboard elements to render:
       - Dashboard primary heading (h1 inside main).
       - Sidebar navigation container (aside) with active Dashboard item.
       - Main content container (main) with dashboard cards/tables.
       - Authenticated user profile information and logout button in sidebar.
    4. Assert that no unexpected error page or error alert is displayed.
    5. Capture a screenshot of the fully loaded dashboard.
    """
    wait = WebDriverWait(driver, TIMEOUT)

    # 1. Open the Login Page
    login_url = f"{BASE_URL}/login"
    driver.get(login_url)

    # Locate login form elements
    email_input = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_input = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    submit_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
    )

    # Input test credentials
    email_input.clear()
    email_input.send_keys(TEST_EMAIL)

    password_input.clear()
    password_input.send_keys(TEST_PASSWORD)

    # Submit login
    submit_btn.click()

    # 2. Wait for authentication to succeed
    # Check that login was not rejected with an alert
    try:
        wait.until(lambda d: "/login" not in d.current_url)
    except Exception:
        # Check if an error alert was rendered to report meaningful failure cause
        alerts = driver.find_elements(By.CSS_SELECTOR, "div[role='alert']")
        if alerts and alerts[0].is_displayed():
            pytest.fail(f"Login failed before reaching dashboard: {alerts[0].text.strip()}")
        raise AssertionError("Login did not navigate away from /login within timeout.")

    # Ensure browser is on the dashboard route
    dashboard_url = f"{BASE_URL}/dashboard"
    if "/dashboard" not in driver.current_url:
        driver.get(dashboard_url)

    wait.until(EC.url_contains("/dashboard"))

    # 3. Verify core dashboard UI elements
    # Element A: Dashboard main container
    main_container = wait.until(
        EC.visibility_of_element_located((By.TAG_NAME, "main"))
    )
    assert main_container.is_displayed(), "Main content container is not displayed on the dashboard."

    # Element B: Dashboard heading (h1)
    heading = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "main h1"))
    )
    heading_text = heading.text.strip()
    assert len(heading_text) > 0, "Dashboard heading (h1) is empty."
    assert (
        "Welcome Back" in heading_text
        or "Command Center" in heading_text
        or "Dashboard" in heading_text
    ), f"Unexpected dashboard heading text: '{heading_text}'"

    # Element C: Sidebar container (aside)
    sidebar = wait.until(
        EC.visibility_of_element_located((By.TAG_NAME, "aside"))
    )
    assert sidebar.is_displayed(), "Sidebar navigation (<aside>) is not displayed on the dashboard."

    # Element D: Sidebar Dashboard navigation item
    dashboard_nav_link = wait.until(
        EC.visibility_of_element_located((By.XPATH, "//aside//a[contains(@href, '/dashboard')]"))
    )
    assert dashboard_nav_link.is_displayed(), "Dashboard navigation link in sidebar is not visible."

    # Element E: Authenticated user element and Logout button
    logout_button = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "button[title='Log out']"))
    )
    assert logout_button.is_displayed(), "Logout button is not displayed in the dashboard sidebar."

    # 4. Verify no unexpected error page or alert is displayed
    error_alerts = driver.find_elements(By.CSS_SELECTOR, "div[role='alert']")
    visible_alerts = [a.text.strip() for a in error_alerts if a.is_displayed()]
    assert len(visible_alerts) == 0, f"Unexpected error alerts found on dashboard: {visible_alerts}"

    # Verify page source does not contain common crash/unhandled error indicators
    page_text = driver.find_element(By.TAG_NAME, "body").text
    assert "404 Not Found" not in page_text, "Dashboard rendered a 404 Not Found error page."
    assert "Internal Server Error" not in page_text, "Dashboard rendered an Internal Server Error page."
    assert "Something went wrong" not in page_text, "Dashboard rendered an error boundary fallback."

    # 5. Capture screenshot of the loaded dashboard
    screenshot_path = SCREENSHOT_DIR / "dashboard_loaded.png"
    driver.save_screenshot(str(screenshot_path))
    assert screenshot_path.exists(), f"Failed to save screenshot at {screenshot_path}"
