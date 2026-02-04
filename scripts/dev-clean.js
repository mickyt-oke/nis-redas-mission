#!/usr/bin/env node

const { spawn } = require('child_process');

// Spawn the Next.js dev server
const child = spawn('pnpm', ['next', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: process.cwd()
});

// Filter stdout
child.stdout.on('data', (data) => {
  const output = data.toString();
  // Filter out baseline-browser-mapping warnings
  if (!output.includes('baseline-browser-mapping')) {
    process.stdout.write(output);
  }
});

// Filter stderr
child.stderr.on('data', (data) => {
  const output = data.toString();
  // Filter out baseline-browser-mapping warnings
  if (!output.includes('baseline-browser-mapping')) {
    process.stderr.write(output);
  }
});

child.on('close', (code) => {
  process.exit(code);
});

// Handle termination signals
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
