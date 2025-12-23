const logger = {
  info: (msg, meta = {}) => {
    console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  error: (msg, error) => {
    console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), message: msg, error: error?.message || error }));
  }
};

module.exports = logger;
