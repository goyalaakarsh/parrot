#!/usr/bin/env node
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

console.log('');
console.log('  🦜 Parrot Desktop Auto-Installer');
console.log('  ==================================');
console.log('');

if (os.platform() !== 'win32') {
  console.log('[-] Parrot Desktop is currently available for Windows.');
  process.exit(0);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Parrot-Installer' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const download = (targetUrl) => {
      https.get(targetUrl, { headers: { 'User-Agent': 'Parrot-Installer' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return download(res.headers.location);
        }
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    };
    download(url);
  });
}

async function main() {
  try {
    console.log('[*] Checking latest release on GitHub...');
    const release = await fetchJson('https://api.github.com/repos/goyalaakarsh/parrot/releases/latest');
    const version = release.tag_name || 'latest';
    console.log(`[+] Found version: ${version}`);

    const msiAsset = (release.assets || []).find(a => a.name && a.name.endsWith('.msi'));
    if (!msiAsset) {
      console.log(`[*] Latest release (${version}) binary is building or available on GitHub.`);
      console.log(`[*] Visit: https://github.com/goyalaakarsh/parrot/releases/tag/${version}`);
      return;
    }

    const tempInstaller = path.join(os.tmpdir(), msiAsset.name);
    console.log(`[*] Downloading ${msiAsset.name}...`);
    await downloadFile(msiAsset.browser_download_url, tempInstaller);

    console.log('[*] Installing Parrot quietly...');
    const res = spawnSync('msiexec.exe', ['/i', tempInstaller, '/qn', '/norestart'], { stdio: 'inherit' });

    if (res.status === 0) {
      console.log('');
      console.log(`[+] Parrot ${version} installed successfully!`);
      console.log('[+] Launch "Parrot" from Start Menu or press Ctrl+Shift+Space!');
      console.log('');
    } else {
      console.log(`[*] Installation process finished with code ${res.status}`);
    }

    try { fs.unlinkSync(tempInstaller); } catch (_) {}
  } catch (err) {
    console.error('[-] Error during installation:', err.message);
  }
}

main();
