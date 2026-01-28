const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../selenium.config');

class TestHelpers {
  constructor() {
    this.driver = null;
    this.token = null;
  }

  async initBrowser() {
    const options = new chrome.Options();

    if (config.browser.headless) {
      options.addArguments('--headless');
    }

    options.addArguments(`--window-size=${config.browser.windowSize.width},${config.browser.windowSize.height}`);
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    this.driver = await new Builder()
      .forBrowser(config.browser.name)
      .setChromeOptions(options)
      .build();

    await this.driver.manage().setTimeouts({
      implicit: config.timeouts.implicit,
      pageLoad: config.timeouts.pageLoad,
      script: config.timeouts.script
    });

    return this.driver;
  }

  async closeBrowser() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = null;
    }
  }

  async navigateTo(path) {
    const url = path.startsWith('http') ? path : `${config.baseUrl}${path}`;
    await this.driver.get(url);
  }

  async findElement(selector) {
    return await this.driver.findElement(By.css(selector));
  }

  async findElementByXPath(xpath) {
    return await this.driver.findElement(By.xpath(xpath));
  }

  async waitForElement(selector, timeout = config.timeouts.implicit) {
    return await this.driver.wait(
      until.elementLocated(By.css(selector)),
      timeout
    );
  }

  async click(selector) {
    const element = await this.waitForElement(selector);
    await element.click();
  }

  async type(selector, text) {
    const element = await this.waitForElement(selector);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(selector) {
    const element = await this.waitForElement(selector);
    return await element.getText();
  }

  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  async waitForUrlContains(text, timeout = config.timeouts.implicit) {
    await this.driver.wait(
      until.urlContains(text),
      timeout
    );
  }

  async apiRequest(method, endpoint, body = null, headers = {}) {
    const fetch = (await import('node-fetch')).default;
    const url = `${config.apiUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (this.token) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    return {
      status: response.status,
      data
    };
  }

  async loginApi(usuario, senha) {
    const response = await this.apiRequest('POST', '/auth/login', { usuario, senha });

    if (response.status === 200 && response.data.token) {
      this.token = response.data.token;
    }

    return response;
  }
}

module.exports = TestHelpers;
