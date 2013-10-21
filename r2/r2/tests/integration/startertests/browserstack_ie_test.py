import os
from r2.tests import *

# Selenium installation:
# pip install -U selenium
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class BrowserStackInternetExplorerTest(RedditTestCase):
    bs_username = str(os.environ.get('BROWSERSTACKUSERNAME'))
    bs_key = str(os.environ.get('BROWSERSTACKKEY'))
    bs_api = "http://" + bs_username + ":" + bs_key + "@hub.browserstack.com/wd/hub"

    base_url = str(os.environ.get('BROWSERSTACKURL'))

    def setUp(self):
        caps = {}
        caps["browser"] = "IE"
        caps["browser_version"] = "7.0"
        caps["os"] = "Windows"
        caps["os_version"] = "XP"
        caps["browserstack.tunnel"] = "true"
        caps["browserstack.debug"] = "true"
        self.driver = webdriver.Remote( command_executor=self.bs_api, desired_capabilities=caps)

    def test_browser_stack(self):
        driver = self.driver
        driver.get(self.base_url)
        self.assert_equal('recently active comments : lightnet', driver.title)

    def test_register_user(self):
        driver = self.driver
        driver.get(self.base_url + "/")
        driver.find_element_by_link_text("register").click()
        driver.find_element_by_id("user_reg").send_keys("Test User")
        driver.find_element_by_id("email_reg").send_keys("tester@lightnetb.org")
        driver.find_element_by_id("passwd_reg").send_keys("password")
        driver.find_element_by_id("passwd2_reg").send_keys("password")
        driver.find_element_by_id("passwd2_reg").submit()
        try:
            WebDriverWait(driver, 30).until(EC.presence_of_element_located(By.CLASS_NAME, "userkarma"))
        finally:
            username = driver.find_element_by_css_selector("#header .user a").text
        self.assert_equal("Test_User_1", username)
                
    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
