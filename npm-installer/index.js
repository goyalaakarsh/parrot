#!/usr/bin/env node
const { execSync } = require('child_process');
const os = require('os');

console.log('');
console.log('  🦜 Parrot Desktop Auto-Installer');
console.log('  ==================================');
console.log('');

if (os.platform() === 'win32') {
  try {
    const cmd = 'powershell -ExecutionPolicy Bypass -Command "iwr -useb https://raw.githubusercontent.com/goyalaakarsh/parrot/main/install.ps1 | iex"';
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error('[-] Installation failed:', err.message);
    process.exit(1);
  }
} else {
  console.log('[-] Parrot Desktop is currently available for Windows.');
  console.log('[*] Visit https://github.com/goyalaakarsh/parrot for updates!');
}
