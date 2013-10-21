import os
from r2.tests import *

# Selenium installation:
# pip install -U selenium
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

class BrowserStackTest(RedditTestCase):
    def setUp(self):
        caps = {}
        caps["browser"] = "IE"
        caps["browser_version"] = "7.0"
        caps["os"] = "Windows"
        caps["os_version"] = "XP"
        caps["browserstack.tunnel"] = "true"
        caps["browserstack.debug"] = "true"
        bs_username = str(os.environ.get('BROWSERSTACKUSERNAME'))
        bs_key = str(os.environ.get('BROWSERSTACKKEY'))
        bs_url = "http://" + bs_username + ":" + bs_key + "@hub.browserstack.com/wd/hub"
        self.driver = webdriver.Remote( command_executor=bs_url, desired_capabilities=caps)

    def test_browser_stack(self):
        driver = self.driver
        driver.get("http://selenium-target.lightnetb.org")
        self.assert_equal('recently active comments : lightnet', driver.title)

    def tearDown(self):
        self.driver.quit()


if __name__ == "__main__":
    unittest.main()
