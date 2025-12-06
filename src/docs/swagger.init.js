const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.config');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Swagger/OpenAPI Initialization for AuthRPD
 * 
 * This module initializes Swagger UI and serves OpenAPI documentation.
 * 
 * Security Considerations:
 * - Swagger UI is disabled in production by default
 * - Can be enabled via SWAGGER_ENABLED environment variable
 * - Documentation endpoints should be protected in production
 * - Consider IP whitelisting for documentation access
 * 
 * Endpoints:
 * - GET /docs - Swagger UI interface
 * - GET /docs.json - Raw OpenAPI JSON specification
 * 
 * @param {Express} app - Express application instance
 */
function initializeSwagger(app) {
  // Check if Swagger is explicitly enabled or disabled
  const swaggerEnabledEnv = process.env.SWAGGER_ENABLED;
  const isExplicitlyEnabled = swaggerEnabledEnv === 'true';
  const isExplicitlyDisabled = swaggerEnabledEnv === 'false';

  // In production, disable by default unless explicitly enabled
  if (config.env === 'production') {
    if (!isExplicitlyEnabled) {
      logger.info('Swagger documentation disabled in production. Set SWAGGER_ENABLED=true to enable.');
      return;
    }
  } else {
    // In development, enable by default unless explicitly disabled
    if (isExplicitlyDisabled) {
      logger.info('Swagger documentation disabled via SWAGGER_ENABLED=false');
      return;
    }
    // If not explicitly set, default to enabled in development
  }

  // Swagger UI options
  const swaggerUiOptions = {
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
    `,
    customSiteTitle: 'AuthRPD API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true, // Persist authorization token in browser
      displayRequestDuration: true, // Show request duration
      filter: true, // Enable filter/search
      tryItOutEnabled: true, // Enable "Try it out" by default
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      docExpansion: 'list', // 'list', 'full', 'none'
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
  };

  // Validate swagger spec before serving
  try {
    if (!swaggerSpec || !swaggerSpec.info) {
      logger.error('Swagger specification is invalid or empty');
      return;
    }

    // Serve Swagger UI at /docs
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    // Serve raw OpenAPI JSON at /docs.json
    app.get('/docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });

    logger.info('Swagger documentation enabled', {
      ui_url: '/docs',
      json_url: '/docs.json',
      environment: config.env,
      paths_count: Object.keys(swaggerSpec.paths || {}).length,
    });
  } catch (error) {
    logger.error('Failed to initialize Swagger documentation', {
      error: error.message,
      stack: error.stack,
    });
  }
}

module.exports = initializeSwagger;

