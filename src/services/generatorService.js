const fs = require('fs-extra');
const path = require('path');
const { nanoid } = require('nanoid');
const config = require('../config');
const logger = require('../utils/logger');

class GeneratorService {
  constructor() {
    this.templatePath = path.join(process.cwd(), 'src', 'templates', 'tree.html');
    this.templateCache = null;
  }

  async loadTemplate() {
    // Always read file to ensure latest changes (disable cache for debugging/dev)
    return await fs.readFile(this.templatePath, 'utf-8');
  }

  async generate(data) {
    const id = nanoid(10); // Generate a unique ID
    const outputDir = path.join(config.generatedDir, id);
    const outputFile = path.join(outputDir, 'tree.html');

    try {
      // 1. Prepare Data
      const injectionData = {
        id,
        text: data.text,
        images: data.images || [], // Array of Base64 strings
        theme: data.theme || 'default',
        config: data.config || {},
        createdAt: new Date().toISOString()
      };

      // 2. Load Template
      const template = await this.loadTemplate();

      // 3. Inject Data
      let htmlContent = template;

      
      // Prepare letter content
      const defaultText = '在这个特别的时刻，愿这棵璀璨的圣诞树带给你无尽的欢乐与温暖。祝你节日快乐，新年幸福！';
      const textToUse = data.text !== undefined ? data.text : defaultText;
      const safeText = JSON.stringify(textToUse).replace(/\//g, '\\/');

      // Replace the placeholder with the JSON string (which includes quotes)
      htmlContent = htmlContent.replace(
        '{{LETTER_CONTENT_JSON}}',
        safeText
      );

      // Also keep the original injection just in case
      htmlContent = htmlContent.replace(
        '{{INITIAL_DATA_JSON}}', 
        JSON.stringify(injectionData)
      );

      // 4. Write File
      await fs.ensureDir(outputDir);
      await fs.writeFile(outputFile, htmlContent, 'utf-8');

      logger.info(`Generated HTML for ID: ${id}`);

      // 5. Return URL
      return {
        id,
        url: `${config.publicUrlPrefix}${id}/tree.html`
      };

    } catch (error) {
      logger.error('Error generating HTML', error);
      // Clean up if failed
      await fs.remove(outputDir).catch(() => {});
      throw error;
    }
  }
}

module.exports = new GeneratorService();
