from __future__ import annotations

import os
import time
import uuid
from dataclasses import dataclass

from selenium import webdriver
from selenium.common.exceptions import ElementClickInterceptedException, TimeoutException
from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.select import Select
from selenium.webdriver.support.ui import WebDriverWait


DEFAULT_FRONTEND_URL = os.getenv("LIFESYNC_FRONTEND_URL", "http://localhost:5173")
DEFAULT_TIMEOUT_SECONDS = int(os.getenv("SELENIUM_TIMEOUT_SECONDS", "20"))
ARTIFACTS_DIR = os.getenv("SELENIUM_ARTIFACTS_DIR", "").strip()


@dataclass
class TestUser:
    email: str
    password: str
    first_name: str
    last_name: str
    age: str
    height: str
    weight: str
    gender: str


def create_driver() -> Chrome:
    options = Options()
    if os.getenv("SELENIUM_HEADLESS", "true").lower() != "false":
        options.add_argument("--headless=new")
    options.add_argument("--window-size=1440,900")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--no-sandbox")
    options.add_argument("--remote-debugging-port=0")
    return webdriver.Chrome(options=options)


def build_test_user() -> TestUser:
    nonce = uuid.uuid4().hex[:8]
    return TestUser(
        email=f"selenium_{nonce}@example.com",
        password="Test1234!",
        first_name="Selenium",
        last_name=f"User{nonce[:4]}",
        age="27",
        height="178",
        weight="74",
        gender="male",
    )


class LifeSyncSmokeTest:
    def __init__(self, driver: Chrome) -> None:
        self.driver = driver
        self.wait = WebDriverWait(driver, DEFAULT_TIMEOUT_SECONDS)

    def run(self) -> None:
        user = build_test_user()
        self.open_login_page()
        self.register_user(user)
        self.verify_dashboard(user)
        self.edit_profile_weight("76")
        self.logout()
        self.login_again(user)
        self.verify_dashboard(user, expected_weight="76")

    def open_login_page(self) -> None:
        self.driver.get(f"{DEFAULT_FRONTEND_URL}/login")
        self.wait_for_testid("auth-page")
        self.capture("01-login-page")

    def register_user(self, user: TestUser) -> None:
        self.click_testid("auth-toggle")
        self.wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, '[data-testid="auth-subtitle"]'), "Create your account"))
        self.capture("02-signup-page")

        self.fill_testid("first-name-input", user.first_name)
        self.fill_testid("last-name-input", user.last_name)
        self.fill_testid("email-input", user.email)
        self.fill_testid("password-input", user.password)
        self.fill_testid("password-confirm-input", user.password)
        self.select_testid("gender-select", user.gender)
        self.fill_testid("age-input", user.age)
        self.fill_testid("height-input", user.height)
        self.fill_testid("weight-input", user.weight)
        self.click_testid("auth-submit")

        self.wait.until(EC.url_contains("/dashboard"))
        self.wait_for_testid("dashboard-page")
        self.capture("03-dashboard-after-register")

    def verify_dashboard(self, user: TestUser, expected_weight: str = "74") -> None:
        greeting = self.text_of("dashboard-greeting")
        if user.first_name not in greeting:
            raise AssertionError(f"Unexpected greeting text: {greeting}")

        email = self.text_of("profile-email")
        if email != user.email:
            raise AssertionError(f"Unexpected profile email: {email}")

        weight = self.text_of("profile-weight")
        if expected_weight not in weight:
            raise AssertionError(f"Unexpected profile weight: {weight}")

    def edit_profile_weight(self, new_weight: str) -> None:
        self.click_testid("edit-profile-button")
        self.wait.until(EC.url_contains("/profile/edit"))
        self.wait_for_testid("edit-profile-form")
        self.capture("04-edit-profile")

        weight_input = self.wait_for_testid("edit-weight-input")
        weight_input.send_keys(Keys.CONTROL, "a")
        weight_input.send_keys(Keys.DELETE)
        weight_input.send_keys(new_weight)
        self.click_testid("save-profile-button")

        self.wait_for_testid("edit-profile-success")
        self.capture("05-profile-update-success")
        self.wait.until(EC.url_contains("/dashboard"))
        self.wait_for_testid("dashboard-page")
        self.capture("06-dashboard-after-update")

    def logout(self) -> None:
        self.click_testid("logout-button")
        self.wait.until(EC.url_contains("/login"))
        self.wait_for_testid("auth-page")

    def login_again(self, user: TestUser) -> None:
        self.fill_testid("email-input", user.email)
        self.fill_testid("password-input", user.password)
        self.click_testid("auth-submit")
        self.wait.until(EC.url_contains("/dashboard"))
        self.wait_for_testid("dashboard-page")
        self.capture("07-dashboard-after-login")

    def wait_for_testid(self, testid: str):
        return self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, f'[data-testid="{testid}"]'))
        )

    def click_testid(self, testid: str) -> None:
        element = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, f'[data-testid="{testid}"]'))
        )
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        try:
            element.click()
        except ElementClickInterceptedException:
            self.driver.execute_script("arguments[0].click();", element)

    def fill_testid(self, testid: str, value: str) -> None:
        element = self.wait_for_testid(testid)
        element.send_keys(Keys.CONTROL, "a")
        element.send_keys(Keys.DELETE)
        element.send_keys(value)

    def select_testid(self, testid: str, value: str) -> None:
        select = Select(self.wait_for_testid(testid))
        select.select_by_value(value)

    def text_of(self, testid: str) -> str:
        return self.wait_for_testid(testid).text.strip()

    def capture(self, name: str) -> None:
        if not ARTIFACTS_DIR:
            return
        os.makedirs(ARTIFACTS_DIR, exist_ok=True)
        path = os.path.join(ARTIFACTS_DIR, f"{name}.png")
        self.driver.save_screenshot(path)


def main() -> None:
    driver = create_driver()

    try:
        LifeSyncSmokeTest(driver).run()
        print("Selenium smoke test passed.")
    except TimeoutException as exc:
        timestamp = int(time.time())
        screenshot_path = os.path.abspath(f"selenium_failure_{timestamp}.png")
        driver.save_screenshot(screenshot_path)
        raise RuntimeError(f"Timed out during Selenium flow. Screenshot: {screenshot_path}") from exc
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
