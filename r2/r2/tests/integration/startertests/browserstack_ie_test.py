import os
from r2.tests import *

# Selenium installation:
# pip install -U selenium
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

class BrowserStackInternetExplorerTest(RedditTestCase):
    bs_username = str(os.environ.get('BROWSERSTACKUSERNAME'))
    bs_key = str(os.environ.get('BROWSERSTACKKEY'))
    bs_api = "http://" + bs_username + ":" + bs_key + "@hub.browserstack.com/wd/hub"

    url = str(os.environ.get('BROWSERSTACKURL'))

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
        driver.get(self.url)
        self.assert_equal('recently active comments : lightnet', driver.title)

    def test_register_user(self):
        driver = self.driver
        driver.open(self.url)
        driver.click("link=register")
        driver.type("id=user_reg", "Test User")
        driver.type("id=email_reg", "tester@lightnetb.org")
        driver.type("id=passwd_reg", "password")
        driver.type("id=passwd2_reg", "password")
        driver.click("css=button.button")
        self.assert_equal('Test_User_1', driver.find_element_by_css_selector("#header .user a"))

    def tearDown(self):
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()
