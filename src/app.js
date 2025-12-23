const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const config = require('./config');
const generateRoute = require('./routes/generate');
const cleanupService = require('./services/cleanupService');
const logger = require('./utils/logger');

const app = express();

// Ensure generated directory exists
fs.ensureDirSync(config.generatedDir);

// Middleware
app.use(helmet());
app.use(cors()); // Allow all CORS by default for this service
app.use(morgan('combined'));
app.use(express.json({ limit: config.limits.jsonBody }));
app.use(express.urlencoded({ extended: true, limit: config.limits.jsonBody }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/tree/generate', generateRoute);

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
