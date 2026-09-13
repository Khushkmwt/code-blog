import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const localDefaults = {
  dbUrl: 'mongodb://localhost:27017',
  corsOrigin: 'http://localhost:8000',
  accessTokenSecret: 'local_dev_access_token_secret',
  refreshTokenSecret: 'local_dev_refresh_token_secret',
  cloudinary: null,
};

const resolveMode = () => {
  if (process.env.MODE) {
    return process.env.MODE === 'prod' ? 'prod' : 'local';
  }
  return process.env.NODE_ENV === 'production' ? 'prod' : 'local';
};

const mode = resolveMode();
const isProduction = mode === 'prod';

export const config = {
  mode,
  isProduction,
  port: parseInt(process.env.PORT, 10) || 8000,
  dbUrl: isProduction ? process.env.DB_URL : (process.env.DB_URL || localDefaults.dbUrl),
  corsOrigin: isProduction ? process.env.CORS_ORIGIN : (process.env.CORS_ORIGIN || localDefaults.corsOrigin),
  accessTokenSecret: isProduction ? process.env.ACCESS_TOKEN_SECRET : (process.env.ACCESS_TOKEN_SECRET || localDefaults.accessTokenSecret),
  refreshTokenSecret: isProduction ? process.env.REFRESH_TOKEN_SECRET : (process.env.REFRESH_TOKEN_SECRET || localDefaults.refreshTokenSecret),
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '1d',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '10d',
  cloudinary: isProduction
    ? {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
      }
    : localDefaults.cloudinary,
};