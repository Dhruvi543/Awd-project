import chalk from 'chalk';
import dayjs from 'dayjs';

const apiLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  // Store original send function
  const originalSend = res.send;
  
  // Override send to capture response data
  res.send = function(data) {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.connection.remoteAddress;
    
    // Determine status color
    let statusColor;
    if (statusCode >= 500) {
      statusColor = chalk.red; // Server errors
    } else if (statusCode >= 400) {
      statusColor = chalk.yellow; // Client errors
    } else if (statusCode >= 300) {
      statusColor = chalk.cyan; // Redirects
    } else {
      statusColor = chalk.green; // Success
    }
    
    // Format log message
    const logMessage = [
      chalk.gray(`[${timestamp}]`),
      chalk.blue(method.padEnd(6)),
      url.padEnd(40),
      statusColor(statusCode.toString().padEnd(3)),
      chalk.gray(`${duration}ms`),
      chalk.gray(ip)
    ].join(' ');
    
    console.log(logMessage);
    
    // Call original send
    return originalSend.call(this, data);
  };
  
  next();
};

export default apiLogger;