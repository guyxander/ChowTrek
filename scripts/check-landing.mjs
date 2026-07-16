import { existsSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'public/index.html',
  'public/privacy/index.html',
  'public/terms/index.html',
  'public/assets/styles.css',
  'public/assets/site.js',
  'api/download.js',
  'api/download-count.js',
  'vercel.json',
];

for (const file of requiredFiles) {
  const fullPath = join(root, file);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing landing page file: ${file}`);
  }
}

const apkPath = join(root, 'public/downloads/chowtrek-latest.apk');
if (!existsSync(apkPath)) {
  throw new Error('Missing latest APK at public/downloads/chowtrek-latest.apk');
}

const apkSize = statSync(apkPath).size;
if (apkSize < 10_000_000) {
  throw new Error(`APK looks too small: ${apkSize} bytes`);
}

const home = readFileSync(join(root, 'public/index.html'), 'utf8');
const requiredHomeContent = [
  'Download APK',
  'data-download-count',
  '/privacy/',
  '/terms/',
  '/api/download',
];

for (const marker of requiredHomeContent) {
  if (!home.includes(marker)) {
    throw new Error(`Landing page missing required marker: ${marker}`);
  }
}

console.log(`Landing page check passed. APK size: ${apkSize} bytes.`);
