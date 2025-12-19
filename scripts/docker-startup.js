const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const sequelize = require('../src/config/db');
const logger = require('../src/config/logger');

const SEED_FLAG_FILE = '/app/data/.seeds-run';
const MAX_RETRIES = 30;
const RETRY_DELAY = 1000; // 1 second

/**
 * Wait for database connection with retry logic
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in milliseconds
 */
async function waitForDatabase(maxRetries = MAX_RETRIES, delay = RETRY_DELAY) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await sequelize.authenticate();
      logger.info('Database connection established');
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        logger.error(`Failed to connect to database after ${maxRetries} attempts`, {
          error: error.message,
        });
        throw error;
      }
      logger.info(`Waiting for database... (attempt ${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Run database migrations
 */
function runMigrations() {
  try {
    logger.info('Running database migrations...');
    execSync('npm run migrate', {
      stdio: 'inherit',
      env: process.env,
    });
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Failed to run database migrations', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Check if seeds have been run before
 * @returns {boolean} - True if seeds have been run, false otherwise
 */
function haveSeedsBeenRun() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(SEED_FLAG_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return fs.existsSync(SEED_FLAG_FILE);
  } catch (error) {
    logger.warn('Error checking seed flag file', { error: error.message });
    return false;
  }
}

/**
 * Mark seeds as run by creating a flag file
 */
function markSeedsAsRun() {
  try {
    const dataDir = path.dirname(SEED_FLAG_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(SEED_FLAG_FILE, new Date().toISOString());
    logger.info('Seeds marked as run', { flagFile: SEED_FLAG_FILE });
  } catch (error) {
    logger.warn('Failed to create seed flag file', { error: error.message });
    // Don't throw - this is not critical
  }
}

/**
 * Run database seeds
 */
function runSeeds() {
  try {
    logger.info('Running database seeds...');
    execSync('npm run seed', {
      stdio: 'inherit',
      env: process.env,
    });
    logger.info('Database seeds completed successfully');
    markSeedsAsRun();
  } catch (error) {
    logger.error('Failed to run database seeds', {
      error: error.message,
    });
    throw error;
  }
}

/**
 * Start the application server
 * @param {string} startCommand - Command to start the server (npm start, npm run dev, etc.)
 */
function startServer(startCommand = 'npm start') {
  logger.info(`Starting application server with command: ${startCommand}`);
  
  const [cmd, ...args] = startCommand.split(' ');
  const serverProcess = spawn(cmd, args, {
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  // Handle process termination
  serverProcess.on('exit', (code) => {
    logger.info(`Server process exited with code ${code}`);
    process.exit(code);
  });

  serverProcess.on('error', (error) => {
    logger.error('Failed to start server process', {
      error: error.message,
    });
    process.exit(1);
  });

  // Forward signals to the server process
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, forwarding to server process');
    serverProcess.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, forwarding to server process');
    serverProcess.kill('SIGINT');
  });
}

/**
 * Main startup function
 */
async function main() {
  try {
    // Determine the start command based on NODE_ENV
    const nodeEnv = process.env.NODE_ENV || 'production';
    const startCommand = nodeEnv === 'development' ? 'npm run dev' : 'npm start';

    // Step 1: Wait for database to be ready
    await waitForDatabase();

    // Step 2: Run migrations
    runMigrations();

    // Step 3: Check if seeds need to be run
    if (!haveSeedsBeenRun()) {
      logger.info('Seeds have not been run yet, running seeds...');
      runSeeds();
    } else {
      logger.info('Seeds have already been run, skipping seed execution');
    }

    // Step 4: Start the application server
    startServer(startCommand);
  } catch (error) {
    logger.error('Startup failed', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Run main function
main();

