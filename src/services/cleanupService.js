const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

class CleanupService {
  start() {
    if (!config.cleanup.enabled) {
      logger.info('Cleanup service disabled');
      return;
    }

    logger.info(`Cleanup service started. Schedule: ${config.cleanup.cronSchedule}, TTL: ${config.cleanup.ttlHours} hours`);

    cron.schedule(config.cleanup.cronSchedule, async () => {
      await this.performCleanup();
    });
  }

  async performCleanup() {
    logger.info('Starting scheduled cleanup...');
    try {
      const files = await fs.readdir(config.generatedDir);
      const now = Date.now();
      const ttlMs = config.cleanup.ttlHours * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(config.generatedDir, file);
        try {
          const stats = await fs.stat(filePath);
          if (stats.isDirectory()) {
            const age = now - stats.mtimeMs;
            if (age > ttlMs) {
              await fs.remove(filePath);
              deletedCount++;
              logger.info(`Deleted expired directory: ${file}`);
            }
          }
        } catch (err) {
          logger.error(`Error checking file ${file}`, err);
        }
      }
      logger.info(`Cleanup completed. Removed ${deletedCount} directories.`);
    } catch (error) {
      logger.error('Cleanup failed', error);
    }
  }
}

module.exports = new CleanupService();
