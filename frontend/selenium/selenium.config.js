module.exports = {
  baseUrl: 'http://localhost:5173',
  apiUrl: 'http://localhost:3000',

  browser: {
    name: 'chrome',
    headless: true,
    windowSize: {
      width: 1920,
      height: 1080
    }
  },

  timeouts: {
    implicit: 10000,
    pageLoad: 30000,
    script: 30000
  }
};
