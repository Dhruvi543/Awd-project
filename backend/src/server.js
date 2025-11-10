import 'dotenv/config';
import http from 'http';
import chalk from 'chalk';
import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

async function start() {
  try {
    console.log(chalk.blue('🔄 Starting DOXI Backend Server...'));
    console.log(chalk.gray(`Environment: ${process.env.NODE_ENV || 'development'}`));
    
    await connectDB();
    
    const server = http.createServer(app);
    
    server.listen(ENV.PORT, () => {
      console.log(chalk.green('✅ Server started successfully!'));
      console.log(chalk.yellow(`🚀 Backend API: http://localhost:${ENV.PORT}`));
      console.log(chalk.yellow(`🌐 Frontend URL: ${ENV.CLIENT_URL}`));
      console.log(chalk.gray('📊 API logging enabled - all requests will be logged below'));
      console.log(chalk.gray('━'.repeat(60)));
    });
    
    server.on('error', (error) => {
      console.error(chalk.red('❌ Server error:'), error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to start server:'), error);
    process.exit(1);
  }
}

start();