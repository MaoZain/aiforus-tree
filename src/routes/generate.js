const express = require('express');
const router = express.Router();
const Joi = require('joi');
const generatorService = require('../services/generatorService');
const logger = require('../utils/logger');

// Validation Schema
const generateSchema = Joi.object({
  text: Joi.string().max(500).allow(''),
});

router.post('/', async (req, res) => {
  try {
    // Merge body and query parameters to support ?text=... in POST requests
    const inputData = { ...req.body, ...req.query };

    // 1. Validate Input
    const { error, value } = generateSchema.validate(inputData);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    console.log('Validated input:', value);

    // 2. Generate
    const result = await generatorService.generate(value);

    // 3. Return Result
    res.status(201).json(result);

  } catch (err) {
    logger.error('API Error', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
