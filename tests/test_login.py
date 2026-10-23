

import os
from pathlib import Path
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# ---------------------------------------------------------------------------
# Configuration & Environment Variables
# ---------------------------------------------------------------------------
# The test credentials and base URL are retrieved from environment variables.
# Fallback values correspond to the verified local development environment.
BASE_URL = os.getenv("OPSPILOT_BASE_URL", "http://localhost:5173").rstrip("/")
TEST_EMAIL = os.getenv("OPSPILOT_TEST_EMAIL", "admin@opspilot.io")
TEST_PASSWORD = os.getenv("OPSPILOT_TEST_PASSWORD", "Password123!")

# Directory for evidence screenshots
SCREENSHOT_DIR = Path("test-results/screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

# Common explicit wait timeout (in seconds)
TIMEOUT = 10


def test_open_application(driver):
    """
    Test Case 1: Open the Application
    ---------------------------------
    1. Navigate to the OpsPilot base URL.
    2. Verify that the landing page loads successfully.
    3. Navigate to the login page using the actual user interface ("Sign in" button).
    4. Verify that the login form and its elements are visible.
    5. Capture a screenshot of the login page.
    """
    wait = WebDriverWait(driver, TIMEOUT)

    # 1. Open the OpsPilot application landing page
    driver.get(BASE_URL)

    # 2. Verify application availability by checking title and landing content
    assert "OpsPilot" in driver.title, f"Unexpected page title: '{driver.title}'"

    # Wait for the landing page header navigation to be visible
    header_logo = wait.until(
        EC.visibility_of_element_located((By.XPATH, "//header//span[contains(text(), 'OpsPilot')]"))
    )
    assert header_logo.is_displayed(), "OpsPilot logo is not visible on landing page."

    # 3. Locate and click the 'Sign in' button in the navigation header
    sign_in_nav_btn = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//header//button[normalize-space()='Sign in']"))
    )
    sign_in_nav_btn.click()

    # Wait for navigation to /login
    wait.until(EC.url_contains("/login"))

    # 4. Verify login page elements
    email_input = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_input = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    submit_button = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "button[type='submit']"))
    )

    assert email_input.is_displayed(), "Email input field is not visible on login page."
    assert password_input.is_displayed(), "Password input field is not visible on login page."
    assert submit_button.is_displayed(), "Submit (Sign In) button is not visible on login page."

    # 5. Capture screenshot of the login page
    screenshot_path = SCREENSHOT_DIR / "login_page.png"
    driver.save_screenshot(str(screenshot_path))
    assert screenshot_path.exists(), f"Failed to save screenshot at {screenshot_path}"


def test_successful_login(driver):
    """
    Test Case 2: Successful Login
    -----------------------------
    1. Navigate to the login page.
    2. Locate the email and password input fields.
    3. Populate credentials from environment variables (never printed in logs).
    4. Click the 'Sign In' button.
    5. Wait for verified post-login condition:
       - URL transition to protected route (/dashboard or /monitoring).
       - Presence of the authenticated session indicator (e.g. 'Log out' button).
       - Presence of the authenticated user element in the sidebar.
    6. Capture a screenshot of the successful login state.
    """
    wait = WebDriverWait(driver, TIMEOUT)
    login_url = f"{BASE_URL}/login"
    driver.get(login_url)

    # Locate email and password fields
    email_field = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_field = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    submit_button = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
    )

    # Input test credentials
    email_field.clear()
    email_field.send_keys(TEST_EMAIL)

    password_field.clear()
    password_field.send_keys(TEST_PASSWORD)

    # Click the login submit button
    submit_button.click()

    # Wait for authentication to succeed using reliable post-login indicators:
    # Indicator 1: The user is redirected away from /login to a protected route (/dashboard or /monitoring)
    wait.until(lambda d: "/login" not in d.current_url)

    # Indicator 2: The sidebar 'Log out' button becomes visible
    logout_button = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "button[title='Log out']"))
    )
    assert logout_button.is_displayed(), "Logout button is not visible after login."

    # Indicator 3: Verify user identity element in the sidebar
    user_indicator = wait.until(
        EC.visibility_of_element_located((By.XPATH, f"//aside//*[contains(text(), '{TEST_EMAIL}')]"))
    )
    assert user_indicator.is_displayed(), f"Authenticated user indicator for {TEST_EMAIL} not found."

    # Capture screenshot of the successful login state
    screenshot_path = SCREENSHOT_DIR / "login_success.png"
    driver.save_screenshot(str(screenshot_path))
    assert screenshot_path.exists(), f"Failed to save screenshot at {screenshot_path}"


def test_invalid_login(driver):
    """
    Test Case 3: Invalid Login
    --------------------------
    1. Navigate to the login page.
    2. Enter deliberately invalid test credentials.
    3. Submit the login form.
    4. Verify that authentication is rejected:
       - URL remains on /login.
       - The application displays an error alert with the expected message.
    5. Capture a screenshot of the error state.
    """
    wait = WebDriverWait(driver, TIMEOUT)
    login_url = f"{BASE_URL}/login"
    driver.get(login_url)

    # Locate form elements
    email_field = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_field = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    submit_button = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
    )

    # Enter invalid credentials (valid email format to pass client regex, but non-existent in DB)
    email_field.clear()
    email_field.send_keys("nonexistent.tester@opspilot.io")

    password_field.clear()
    password_field.send_keys("IncorrectPassword999!")

    # Submit the form
    submit_button.click()

    # Wait for the error banner to appear
    alert_banner = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "div[role='alert']"))
    )
    alert_text = alert_banner.text.strip()

    # Verify rejection and expected error message
    assert alert_banner.is_displayed(), "Error alert banner was not displayed upon invalid login."
    assert "Invalid email or password" in alert_text or "Invalid credentials" in alert_text, (
        f"Unexpected error message: '{alert_text}'"
    )

    # Verify that the URL remains on the login page
    assert "/login" in driver.current_url, (
        f"Expected browser to remain on /login, but URL is: {driver.current_url}"
    )

    # Capture screenshot of the invalid credentials state
    screenshot_path = SCREENSHOT_DIR / "login_invalid_credentials.png"
    driver.save_screenshot(str(screenshot_path))
    assert screenshot_path.exists(), f"Failed to save screenshot at {screenshot_path}"


def test_empty_fields_validation(driver):
    """
    Test Case 4: Empty Fields Validation
    ------------------------------------
    1. Navigate to the login page.
    2. Submit the login form without entering any credentials.
    3. Verify required-field validation:
       - HTML5 validation: Check that the input fields have the 'required' attribute.
       - Browser validity state: Verify that the email input is flagged as invalid (valueMissing=True).
       - Browser validation message: Verify native validationMessage (e.g. 'Please fill out this field.').
       - Application state: Confirm the browser prevents form submission and stays on /login.
    4. Capture a screenshot of the validation state.
    """
    wait = WebDriverWait(driver, TIMEOUT)
    login_url = f"{BASE_URL}/login"
    driver.get(login_url)

    email_field = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
    )
    password_field = wait.until(
        EC.visibility_of_element_located((By.CSS_SELECTOR, "input[type='password']"))
    )
    submit_button = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
    )

    # Verify both input fields have the HTML5 required attribute
    assert email_field.get_attribute("required") is not None, (
        "Email input is missing the HTML5 'required' attribute."
    )
    assert password_field.get_attribute("required") is not None, (
        "Password input is missing the HTML5 'required' attribute."
    )

    # Verify validity before submit via JavaScript HTML5 Validity API
    is_valid_before = driver.execute_script("return arguments[0].validity.valid;", email_field)
    is_value_missing = driver.execute_script("return arguments[0].validity.valueMissing;", email_field)
    validation_message = driver.execute_script("return arguments[0].validationMessage;", email_field)

    assert not is_valid_before, "Empty email field should have validity.valid = False."
    assert is_value_missing, "Empty email field should have validity.valueMissing = True."
    assert len(validation_message) > 0, "Empty email field should produce a browser validation message."

    # Attempt to submit empty form
    submit_button.click()

    # Verify that form submission was prevented by client-side validation
    assert "/login" in driver.current_url, (
        f"Form should not submit with empty fields, but URL changed to {driver.current_url}"
    )

    # Capture screenshot of the empty fields state
    screenshot_path = SCREENSHOT_DIR / "login_empty_fields.png"
    driver.save_screenshot(str(screenshot_path))
    assert screenshot_path.exists(), f"Failed to save screenshot at {screenshot_path}"
