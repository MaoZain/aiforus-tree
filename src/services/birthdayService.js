const fs = require('fs-extra');
const path = require('path');
const { nanoid } = require('nanoid');
const config = require('../config');
const logger = require('../utils/logger');

class BirthdayService {
  constructor() {
    this.templatePath = path.join(process.cwd(), 'src', 'templates', 'birthday.html');
  }

  async loadTemplate() {
    // Always read file to ensure latest changes (disable cache for debugging/dev)
    return await fs.readFile(this.templatePath, 'utf-8');
  }

  async generate(data) {
    const id = nanoid(10); // Generate a unique ID
    const outputDir = path.join(config.generatedDir, id);
    const outputFile = path.join(outputDir, 'birthday.html');

    try {
      // 1. Prepare Data
      const defaultText = '生日快乐！\n愿你三冬暖，愿你春不寒；\n愿你天黑有灯，下雨有伞；\n愿你一路上，有良人相伴。';
      // Resolve letter content: data.letterContent > data.text > default
      const rawText = data.letterContent !== undefined ? data.letterContent : (data.text !== undefined ? data.text : defaultText);

      // Convert newline to <p> tags for HTML injection
      const htmlLetterContent = rawText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => `<p>${line}</p>`)
        .join('\n');

      // 2. Load Template
      const template = await this.loadTemplate();

      // 3. Inject Data
      let htmlContent = template;

      // Replace the placeholder
      htmlContent = htmlContent.replace(
        '{{LETTER_HTML_CONTENT}}',
        htmlLetterContent
      );

      // 4. Write File
      await fs.ensureDir(outputDir);
      await fs.writeFile(outputFile, htmlContent, 'utf-8');

      logger.info(`Generated Birthday HTML for ID: ${id}`);

      // 5. Return URL
      return {
        id,
        url: `${config.publicUrlPrefix}${id}/birthday.html`
      };

    } catch (error) {
      logger.error('Error generating Birthday HTML', error);
      // Clean up if failed
      await fs.remove(outputDir).catch(() => {});
      throw error;
    }
  }
}

module.exports = new BirthdayService();
