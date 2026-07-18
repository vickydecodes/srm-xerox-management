import dotenv from 'dotenv';

dotenv.config();

type ENVTYPE = {
  NODE_ENV: string;
  DEBUG: string;
  PORT: number | string;
  MONGO_URI: string | undefined;
  CLIENT_URL: string;
  MAINTENANCE_MODE: string | undefined;
  MAINTENANCE_BYPASS_KEY: string | undefined;
};

export const ENV: ENVTYPE = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEBUG: process.env.DEBUG || 'true',
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MAINTENANCE_MODE: process.env.MAINTENANCE_MODE || 'false',
  MAINTENANCE_BYPASS_KEY: process.env.MAINTENANCE_BYPASS_KEY || '',
};

export const ENVCONFIG = {
  prod: ENV.NODE_ENV === 'production',
  debug: ENV.DEBUG,
};
