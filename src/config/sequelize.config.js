const path = require('path');
const fs = require('fs');

// Определяем окружение (сначала из переменных окружения, потом по умолчанию)
const nodeEnv = process.env.NODE_ENV || process.env.CURRENT_ENV || 'development';

// Загружаем .env файл в зависимости от NODE_ENV
// Приоритет: .env.{NODE_ENV} -> .env
const envFile = `.env.${nodeEnv}`;
const defaultEnvFile = '.env';

// Проверяем существование файла .env.{NODE_ENV}
if (fs.existsSync(path.resolve(process.cwd(), envFile))) {
  require('dotenv').config({ path: envFile });
} else if (fs.existsSync(path.resolve(process.cwd(), defaultEnvFile))) {
  // Если файла .env.{NODE_ENV} нет, загружаем .env
  require('dotenv').config({ path: defaultEnvFile });
} else {
  // Если нет ни одного файла, загружаем без пути (dotenv попытается найти .env)
  require('dotenv').config();
}

module.exports = {
  development: {
    username: process.env.DB_USER || 'authrpd_user',
    password: process.env.DB_PASSWORD || 'secret',
    database: process.env.DB_NAME || 'authrpd',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    schema: 'public', // Explicitly set schema to public
    define: {
      // underscored: true, // Automatically convert camelCase to snake_case for DB columns
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    schema: 'public', // Explicitly set schema to public
    define: {
      // underscored: true, // Automatically convert camelCase to snake_case for DB columns
      freezeTableName: true,
      timestamps: true,
      paranoid: true,
    },
  },
};

