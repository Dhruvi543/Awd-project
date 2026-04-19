const ENV = {
  PORT: Number(process.env.PORT || 5000),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/doxi',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@doxi.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@123',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Admin',
};

export { ENV };