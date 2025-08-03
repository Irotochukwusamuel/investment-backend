#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Set the working directory to the script's location
process.chdir(__dirname);

// Set environment variables for cPanel
const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: process.env.PORT || 3000,
  CPANEL_DISABLE_CRON: 'true', // Disable cron jobs in cPanel environment
};

console.log('Starting NestJS application in cPanel mode...');
console.log('Cron jobs are disabled to avoid crypto module issues.');

// Start the NestJS application
const child = spawn('node', ['dist/src/main.js'], {
  stdio: 'inherit',
  env: env
});

child.on('error', (error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Application exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  child.kill('SIGINT');
}); 