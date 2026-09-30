import pytest
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestOpsPilot:
    def setup_method(self, method):
        options = webdriver.ChromeOptions()
        options.add_argument("--ignore-certificate-errors")
        # Run headless so it doesn't interrupt the user
        options.add_argument("--headless=new")
        options.add_argument("--window-size=1920,1080")
        
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 10)
        
        # Make sure screenshots directory exists
        if not os.path.exists("screenshots"):
            os.makedirs("screenshots")

    def teardown_method(self, method):
        self.driver.quit()

    def test_login_ui(self):
        print("\n[1/3] Navigating to Login Page...")
        self.driver.get("http://localhost:5173/login")
        time.sleep(2)
        self.driver.save_screenshot("screenshots/1_login_page.png")
        
        print("[2/3] Clicking Admin Demo Account...")
        # Find the button containing 'Admin' text
        admin_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Admin']]")))
        admin_btn.click()
        
        # Verify email is populated
        email_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='email']")
        assert email_input.get_attribute("value") == "admin@opspilot.io"
        self.driver.save_screenshot("screenshots/2_demo_account_clicked.png")
        
        print("[3/3] Clicking Submit...")
        submit_btn = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']")))
        submit_btn.click()
        
        time.sleep(2)
        self.driver.save_screenshot("screenshots/3_submit_clicked.png")
        
        print("✅ Full Selenium Test Completed Successfully!")

if __name__ == "__main__":
    pytest.main(["-v", "test_ui.py"])
