const log_level = process.env.LOG_LEVEL || 'info';

const levels = ['none', 'error', 'warn', 'info', 'debug'];
const currentLevelIndex = levels.indexOf(log_level);

const buildLogMethod = (level) => (...args) => {
  const levelIndex = levels.indexOf(level);
  const shouldLog = levelIndex <= currentLevelIndex;

  if (shouldLog) {
    console[level](...args);
  }
};

module.exports = {
  randomArray: (arr) => {
    return arr[Math.floor(Math.random() * arr.length)]
  },
  toFixed: (num, digits = 2) => {
    return parseFloat(Number(num).toFixed(digits))
  },
  logger: {
    debug: buildLogMethod('debug'),
    info: buildLogMethod('info'),
    warn: buildLogMethod('warn'),
    error: buildLogMethod('error')
  }
}
