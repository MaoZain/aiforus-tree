require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 3033,
  publicUrlPrefix: process.env.PUBLIC_URL_PREFIX || 'http://localhost:3033/generated/',
  generatedDir: path.join(process.cwd(), 'public', 'generated'),
  cleanup: {
    enabled: process.env.CLEANUP_ENABLED !== 'false',
    cronSchedule: process.env.CLEANUP_CRON || '0 * * * *', // Every hour
    ttlHours: parseInt(process.env.CLEANUP_TTL_HOURS || '24', 10)
  },
  limits: {
    jsonBody: '10mb', // Allow large base64 images
    maxImages: 5
  }
};
