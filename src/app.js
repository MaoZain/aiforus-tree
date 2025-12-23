const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config');
const generateRoute = require('./routes/generate');
const wechatRoute = require('./routes/wechat');
const cleanupService = require('./services/cleanupService');
const logger = require('./utils/logger');

const app = express();

// Ensure generated directory exists
fs.ensureDirSync(config.generatedDir);

// Middleware
// 修改这里：禁用 contentSecurityPolicy 以允许模板中的内联脚本和样式
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors()); // Allow all CORS by default for this service
app.use(morgan('combined'));
app.use(express.json({ limit: config.limits.jsonBody }));
app.use(express.urlencoded({ extended: true, limit: config.limits.jsonBody }));
app.use(express.static(path.join(process.cwd(), 'public')));

// Routes
app.use('/tree/generate', generateRoute);
app.use('/wechat', wechatRoute);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start Cleanup Service
cleanupService.start();

// Start Server
app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Public URL Prefix: ${config.publicUrlPrefix}`);
  logger.info(`Generated files stored in: ${config.generatedDir}`);
});
