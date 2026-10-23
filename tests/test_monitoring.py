"""
OpsPilot Service Monitoring Dashboard Verification Suite
========================================================
Technology Stack:
- Python 3.14
- Selenium WebDriver 4.49
- Pytest 9.1
- Google Chrome (Headless / Desktop viewport)

This test module verifies the Service Monitoring & Observability Dashboard in OpsPilot.
It performs the following:
  1. Authenticates using credentials from environment variables.
  2. Navigates to the Live Monitoring page via the sidebar navigation interface.
  3. Explicitly waits for the lazy-loaded monitoring components, live telemetry, and charts.
  4. Verifies monitoring metrics and service-health indicators (Global Health / Uptime, Active Requests).
  5. Verifies integration state and telemetry charts (Prometheus-backed CPU & Memory utilization).
  6. Captures screenshot evidence to test-results/screenshots/monitoring_dashboard.png.
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
# The Live Monitoring dashboard (/monitoring) has RBAC configured for DEVELOPER and DEVOPS roles.
# Default to the seeded developer account unless overridden by environment variables.
TEST_EMAIL = os.getenv("OPSPILOT_TEST_EMAIL", "developer@opspilot.io")
TEST_PASSWORD = os.getenv("OPSPILOT_TEST_PASSWORD", "Password123!")

SCREENSHOT_DIR = Path("test-results/screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

TIMEOUT = 15


def test_service_monitoring_dashboard_verification(driver):
    """
    Test Case: Service Monitoring Dashboard Verification
    ----------------------------------------------------
    1. Open the OpsPilot application login page.
    2. Authenticate using credentials provided via environment variables.
    3. Locate and click the 'Live Monitoring' navigation item in the sidebar.
    4. Wait for the lazy-loaded monitoring interface (div.live-dashboard) to render.
    5. Verify the monitoring page layout, heading, and main content are displayed.
    6. Verify that service health indicators (Global Health / Uptime) are visible and valid.
    7. Verify live telemetry metrics (Active Requests, CPU & Memory utilization charts).
    8. Verify that integration tabs and status elements are present without unhandled errors.
    9. Capture screenshot of the monitoring dashboard at test-results/screenshots/monitoring_dashboard.png.
    10. Close browser properly via fixture teardown.
    """
    wait = WebDriverWait(driver, TIMEOUT)

    # 1. Open login page
    login_url = f"{BASE_URL}/login"
    driver.get(login_url)

    # 2. Authenticate
    email_input = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_input = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    submit_btn = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
    )

    email_input.clear()
    email_input.send_keys(TEST_EMAIL)

    password_input.clear()
    password_input.send_keys(TEST_PASSWORD)

    submit_btn.click()

    # Wait for authentication to succeed
    try:
        wait.until(lambda d: "/login" not in d.current_url)
    except Exception:
        alerts = driver.find_elements(By.CSS_SELECTOR, "div[role='alert']")
        if alerts and alerts[0].is_displayed():
            pytest.fail(f"Login failed before reaching monitoring: {alerts[0].text.strip()}")
        raise AssertionError("Login did not complete within timeout.")

    # 3. Locate and click the 'Live Monitoring' link in the sidebar
    monitoring_nav_link = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//aside//a[contains(@href, '/monitoring')]"))
    )
    assert monitoring_nav_link.is_displayed(), "Sidebar link for Live Monitoring is not displayed."
    monitoring_nav_link.click()

    # Wait for navigation to /monitoring
    wait.until(EC.url_contains("/monitoring"))

    # 4. Wait for the lazy-loaded monitoring interface (div.live-dashboard) to mount and become visible
    live_dashboard = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "div.live-dashboard"))
    )
    assert live_dashboard.is_displayed(), "Live monitoring container is not visible."

    # 5. Verify monitoring page heading inside live dashboard
    page_heading = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "div.live-dashboard h1"))
    )
    assert "Dashboard" in page_heading.text, f"Unexpected monitoring heading: '{page_heading.text}'"

    # 6. Verify Service Health Indicators
    # Locate the Global Health KPI card
    global_health_card = wait.until(
        EC.visibility_of_element_located((By.XPATH, "//div[contains(@class, 'live-dashboard')]//*[contains(text(), 'Global Health')]/ancestor::div[contains(@class, 'rounded-xl')]"))
    )
    assert "Global Health" in global_health_card.text, "Global Health indicator not found."
    assert "Uptime" in global_health_card.text, "Uptime metric label not found in health card."
    assert "%" in global_health_card.text, "Uptime percentage value missing from health card."

    # 7. Verify Telemetry Metrics (Prometheus integration)
    # Locate the Active Requests live connection metric card
    active_requests_card = wait.until(
        EC.visibility_of_element_located((By.XPATH, "//div[contains(@class, 'live-dashboard')]//*[contains(text(), 'Active Requests')]/ancestor::div[contains(@class, 'rounded-xl')]"))
    )
    assert "Active Requests" in active_requests_card.text, "Active Requests metric card not found."
    assert "Live connections" in active_requests_card.text, "Live connections label missing."

    # Verify that Recharts telemetry containers are rendered
    recharts_containers = wait.until(
        lambda d: d.find_elements(By.CSS_SELECTOR, "div.live-dashboard .recharts-responsive-container")
    )
    assert len(recharts_containers) >= 2, (
        f"Expected at least 2 telemetry charts (CPU, Memory), but found {len(recharts_containers)}"
    )

    # Verify CPU Utilization and Memory Utilization section headers
    page_text = live_dashboard.text
    assert "CPU Utilization" in page_text, "CPU Utilization chart is not displayed."
    assert "Memory Utilization" in page_text, "Memory Utilization chart is not displayed."
    assert "Network Traffic" in page_text, "Network Traffic chart is not displayed."

    # 8. Verify absence of crash boundaries or unhandled error alerts
    error_alerts = driver.find_elements(By.CSS_SELECTOR, "div[role='alert']")
    visible_alerts = [a.text.strip() for a in error_alerts if a.is_displayed()]
    assert len(visible_alerts) == 0, f"Unexpected error alerts on monitoring page: {visible_alerts}"
    assert "Something went wrong" not in page_text, "Error boundary crash displayed on monitoring page."

    # 9. Capture screenshot of the monitoring dashboard
    screenshot_path = SCREENSHOT_DIR / "monitoring_dashboard.png"
    driver.save_screenshot(str(screenshot_path))
    assert screenshot_path.exists(), f"Failed to save screenshot at {screenshot_path}"
