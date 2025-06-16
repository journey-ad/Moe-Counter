require('dotenv').config();

module.exports = {
  app: {
    port: process.env.APP_PORT || 3000,
    site: process.env.APP_SITE,
    gaId: process.env.GA_ID,
  },
  db: {
    interval: process.env.DB_INTERVAL > 0 ? process.env.DB_INTERVAL : 0,
  },
  cache: {
    maxAge: {
      theme: 31536000, // 1 year
      demo: 31536000,
      default: 0,
    },
  },
  limits: {
    nameMaxLength: 32,
    numMax: 1e15,
    prefixMax: 999999,
    offsetRange: {
      min: -500,
      max: 500,
    },
    scaleRange: {
      min: 0.1,
      max: 2,
    },
  },
};
