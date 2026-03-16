// scripts/generateIcons.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [
  { size: 16,   name: 'favicon-16x16.png' },
  { size: 32,   name: 'favicon-32x32.png' },
  { size: 48,   name: 'favicon-48x48.png' },
  { size: 72,   name: 'icon-72x72.png' },
  { size: 96,   name: 'icon-96x96.png' },
  { size: 128,  name: 'icon-128x128.png' },
  { size: 144,  name: 'icon-144x144.png' },
  { size: 152,  name: 'icon-152x152.png' },
  { size: 180,  name: 'apple-touch-icon.png' },
  { size: 192,  name: 'icon-192x192.png' },
  { size: 256,  name: 'icon-256x256.png' },
  { size: 384,  name: 'icon-384x384.png' },
  { size: 512,  name: 'icon-512x512.png' },
];

const inputSvg = path.join(__dirname, '../public/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  for (const { size, name } of sizes) {
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, name));
    console.log(`✅ ${name} (${size}x${size})`);
  }

  // Fallback favicon.ico
  await sharp(inputSvg)
    .resize(32, 32)
    .toFile(path.join(__dirname, '../public/favicon.ico'));

  console.log('✅ favicon.ico');
  console.log('🎉 جميع الأيقونات جاهزة!');
}

generateIcons().catch(console.error);
