#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting CI build process...');

try {
  // Set environment variables for CI build
  process.env.NODE_ENV = 'production';
  process.env.CI = 'true';
  
  console.log('📦 Installing dependencies...');
  execSync('npm ci', { stdio: 'inherit', cwd: __dirname });
  
  console.log('🔨 Building with Vite...');
  execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // Fallback: try alternative build approach
  console.log('🔄 Trying alternative build approach...');
  try {
    execSync('npx vite build --mode production', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Alternative build completed successfully!');
  } catch (fallbackError) {
    console.error('❌ Alternative build also failed:', fallbackError.message);
    process.exit(1);
  }
}
