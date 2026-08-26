import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const rootDir = process.cwd();

// Ensure output directories exist
const dirs = [
  path.join(rootDir, 'assets', 'brand'),
  path.join(rootDir, 'assets', 'icons'),
  path.join(rootDir, 'assets', 'social'),
  path.join(rootDir, 'assets', 'audio'),
  path.join(rootDir, 'assets', 'tarot'),
  path.join(rootDir, 'assets', 'images')
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Function to generate multi-resolution ICO file from PNG buffer
function createIco(pngBuffers) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Image type: 1 = ICO
  header.writeUInt16LE(pngBuffers.length, 4); // Number of images

  let offset = 6 + (16 * pngBuffers.length);
  const dirEntries = [];
  const imageDatas = [];

  for (const item of pngBuffers) {
    const { size, buffer } = item;
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data

    dirEntries.push(entry);
    imageDatas.push(buffer);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageDatas]);
}

async function generateAssets() {
  console.log('🌌 AETHRA ORACLE — Generating High-Precision Brand Assets...');

  const faviconSvgPath = path.join(rootDir, 'assets', 'icons', 'favicon.svg');
  const symbolSvgPath = path.join(rootDir, 'assets', 'brand', 'logo-symbol-dark.svg');
  const ogSvgPath = path.join(rootDir, 'assets', 'social', 'og-aethra-oracle.svg');

  const faviconSvg = fs.readFileSync(faviconSvgPath);
  const symbolSvg = fs.readFileSync(symbolSvgPath);
  const ogSvg = fs.readFileSync(ogSvgPath);

  // 1. Generate Favicon PNGs
  const p16 = await sharp(faviconSvg).resize(16, 16).png().toBuffer();
  fs.writeFileSync(path.join(rootDir, 'assets', 'icons', 'favicon-16x16.png'), p16);

  const p32 = await sharp(faviconSvg).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(rootDir, 'assets', 'icons', 'favicon-32x32.png'), p32);

  const p48 = await sharp(faviconSvg).resize(48, 48).png().toBuffer();

  const p180 = await sharp(faviconSvg).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(rootDir, 'assets', 'icons', 'apple-touch-icon.png'), p180);

  const p192 = await sharp(faviconSvg).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(rootDir, 'assets', 'icons', 'android-chrome-192x192.png'), p192);

  const p512 = await sharp(faviconSvg).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(rootDir, 'assets', 'icons', 'android-chrome-512x512.png'), p512);

  // 2. Generate multi-resolution favicon.ico
  const icoBuffer = createIco([
    { size: 16, buffer: p16 },
    { size: 32, buffer: p32 },
    { size: 48, buffer: p48 }
  ]);
  fs.writeFileSync(path.join(rootDir, 'assets', 'icons', 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(rootDir, 'favicon.ico'), icoBuffer);

  // 3. Generate Brand Raster Logos
  await sharp(symbolSvg).resize(512, 512).png().toFile(path.join(rootDir, 'assets', 'brand', 'logo-512.png'));
  await sharp(symbolSvg).resize(1024, 1024).png().toFile(path.join(rootDir, 'assets', 'brand', 'logo-1024.png'));

  // 4. Generate Open Graph 1200x630 Social Preview Card
  await sharp(ogSvg).resize(1200, 630).png().toFile(path.join(rootDir, 'assets', 'social', 'og-aethra-oracle.png'));

  // 5. Generate Audio WAV Assets (Complete Suite)
  generateAudioAssets();

  console.log('✨ All brand assets, favicons, social preview card, and audio generated successfully.');
}

// Function to generate clean, subtle procedural WAV micro-sounds
function generateAudioAssets() {
  const sampleRate = 44100;

  function createWavBuffer(samples) {
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit
    const byteRate = sampleRate * numChannels * bytesPerSample;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = samples.length * bytesPerSample;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // FMT sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(16, 34);

    // DATA sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < samples.length; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      buffer.writeInt16LE(s < 0 ? s * 0x8000 : s * 0x7FFF, 44 + i * 2);
    }
    return buffer;
  }

  // 1. UI Select
  const selDur = 0.06;
  const selSamples = new Float32Array(Math.floor(sampleRate * selDur));
  for (let i = 0; i < selSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 60);
    selSamples[i] = (Math.sin(2 * Math.PI * 880 * t) * 0.5 + Math.sin(2 * Math.PI * 1320 * t) * 0.3) * env * 0.25;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'ui-select.wav'), createWavBuffer(selSamples));

  // 2. UI Hover
  const hovDur = 0.03;
  const hovSamples = new Float32Array(Math.floor(sampleRate * hovDur));
  for (let i = 0; i < hovSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 80);
    hovSamples[i] = Math.sin(2 * Math.PI * 1320 * t) * env * 0.15;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'ui-hover.wav'), createWavBuffer(hovSamples));

  // 3. Navigation Open
  const navDur = 0.4;
  const navSamples = new Float32Array(Math.floor(sampleRate * navDur));
  for (let i = 0; i < navSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 8);
    navSamples[i] = (Math.sin(2 * Math.PI * 523.25 * t) + Math.sin(2 * Math.PI * 659.25 * t) * 0.7 + Math.sin(2 * Math.PI * 783.99 * t) * 0.5) * 0.15 * env;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'navigation-open.wav'), createWavBuffer(navSamples));

  // 4. Oracle Open
  const oraDur = 0.8;
  const oraSamples = new Float32Array(Math.floor(sampleRate * oraDur));
  for (let i = 0; i < oraSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 4);
    oraSamples[i] = (Math.sin(2 * Math.PI * 329.63 * t) + Math.sin(2 * Math.PI * 493.88 * t) * 0.8 + Math.sin(2 * Math.PI * 659.25 * t) * 0.6) * 0.18 * env;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'oracle-open.wav'), createWavBuffer(oraSamples));

  // 5. Tarot Shuffle
  const shufDur = 0.45;
  const shufSamples = new Float32Array(Math.floor(sampleRate * shufDur));
  for (let i = 0; i < shufSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.sin(Math.PI * (t / shufDur)) * Math.exp(-t * 3);
    const noise = (Math.random() * 2 - 1) * 0.15;
    const tone = Math.sin(2 * Math.PI * (300 + 150 * Math.sin(t * 20)) * t) * 0.1;
    shufSamples[i] = (noise + tone) * env * 0.3;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'tarot-shuffle.wav'), createWavBuffer(shufSamples));

  // 6. Tarot Flip
  const flipDur = 0.12;
  const flipSamples = new Float32Array(Math.floor(sampleRate * flipDur));
  for (let i = 0; i < flipSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 45);
    const snap = (Math.random() * 2 - 1) * 0.2 + Math.sin(2 * Math.PI * 520 * t) * 0.3;
    flipSamples[i] = snap * env * 0.35;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'tarot-flip.wav'), createWavBuffer(flipSamples));

  // 7. Reading Complete
  const compDur = 1.4;
  const compSamples = new Float32Array(Math.floor(sampleRate * compDur));
  for (let i = 0; i < compSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 2.8);
    const c4 = Math.sin(2 * Math.PI * 261.63 * t);
    const g4 = Math.sin(2 * Math.PI * 392.00 * t) * 0.7;
    const e5 = Math.sin(2 * Math.PI * 659.25 * t) * 0.5;
    const b5 = Math.sin(2 * Math.PI * 987.77 * t) * 0.25;
    compSamples[i] = (c4 + g4 + e5 + b5) * 0.25 * env * 0.3;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'reading-complete.wav'), createWavBuffer(compSamples));

  // 8. I Ching Coin
  const coinDur = 0.35;
  const coinSamples = new Float32Array(Math.floor(sampleRate * coinDur));
  for (let i = 0; i < coinSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 12);
    const metal1 = Math.sin(2 * Math.PI * 2150 * t);
    const metal2 = Math.sin(2 * Math.PI * 3420 * t) * 0.6;
    const metal3 = Math.sin(2 * Math.PI * 4800 * t) * 0.3;
    coinSamples[i] = (metal1 + metal2 + metal3) * 0.33 * env * 0.25;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'iching-coin.wav'), createWavBuffer(coinSamples));

  // 9. Tab Switch
  const tabDur = 0.15;
  const tabSamples = new Float32Array(Math.floor(sampleRate * tabDur));
  for (let i = 0; i < tabSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 30);
    tabSamples[i] = (Math.sin(2 * Math.PI * 587.33 * t) + Math.sin(2 * Math.PI * 880 * t) * 0.6) * 0.15 * env;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'tab-switch.wav'), createWavBuffer(tabSamples));

  // 10. Input Focus
  const focDur = 0.1;
  const focSamples = new Float32Array(Math.floor(sampleRate * focDur));
  for (let i = 0; i < focSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 40);
    focSamples[i] = Math.sin(2 * Math.PI * 1046.50 * t) * 0.12 * env;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'input-focus.wav'), createWavBuffer(focSamples));

  // 11. Toggle Switch
  const togDur = 0.05;
  const togSamples = new Float32Array(Math.floor(sampleRate * togDur));
  for (let i = 0; i < togSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 70);
    togSamples[i] = Math.sin(2 * Math.PI * 987 * t) * 0.18 * env;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'toggle-switch.wav'), createWavBuffer(togSamples));

  // 12. Error Alert
  const errDur = 0.2;
  const errSamples = new Float32Array(Math.floor(sampleRate * errDur));
  for (let i = 0; i < errSamples.length; i++) {
    const t = i / sampleRate;
    const env = Math.exp(-t * 15);
    errSamples[i] = (Math.sin(2 * Math.PI * 220 * t) + Math.sin(2 * Math.PI * 146.83 * t) * 0.8) * 0.2 * env;
  }
  fs.writeFileSync(path.join(rootDir, 'assets', 'audio', 'error-alert.wav'), createWavBuffer(errSamples));

  console.log('✓ Generated full procedural audio assets (.wav)');
}

generateAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
