/**
 * AETHRA ORACLE — Automated Behavioral Verification Suite
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';

import { AstrologyEngine, ZODIAC_SIGNS, NAKSHATRAS } from '../js/engines/astrology.js';
import { BaZiEngine, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '../js/engines/bazi.js';
import { NumerologyEngine } from '../js/engines/numerology.js';
import { TarotEngine, MAJOR_ARCANA, SUITS } from '../js/engines/tarot.js';
import { IChingEngine, HEXAGRAMS, TRIGRAMS } from '../js/engines/iching.js';
import { UnifiedReadingEngine } from '../js/engines/unified.js';
import { DailyGuidanceEngine } from '../js/engines/daily-guidance.js';
import { CelestialSeal } from '../js/components/seal.js';
import { Storage, MAJOR_CITIES } from '../js/core/storage.js';
import { SoundManager } from '../js/core/sound.js';
import { I18n, translations } from '../js/core/i18n.js';
import { isKeyboardActivationKey } from '../js/views/tarot-view.js';
import { runThaiEngineTests } from './thai-engines.test.js';
import { runCoverageExtraTests } from './coverage-extra.test.js';

const rootDir = process.cwd();
let passedCount = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✕ ${name}`);
    console.error(err);
  }
}

async function runTests() {
  console.log('🔮 Running AETHRA ORACLE Comprehensive Test Suite...\n');

  console.log('--- SECTION 1: Brand Assets & File Integrity ---');
  
  const requiredFiles = [
    'index.html',
    '404.html',
    'manifest.webmanifest',
    'robots.txt',
    'css/tokens.css',
    'css/index.css',
    'js/app.js',
    'js/core/sound.js',
    'js/core/i18n.js',
    'js/core/storage.js',
    'js/engines/astrology.js',
    'js/engines/bazi.js',
    'js/engines/numerology.js',
    'js/engines/tarot.js',
    'js/engines/iching.js',
    'js/engines/unified.js',
    'js/engines/daily-guidance.js',
    'js/components/astrolabe.js',
    'js/components/seal.js',
    'js/components/navigation.js',
    'js/components/toast.js',
    'js/components/onboarding.js',
    'js/views/dashboard.js',
    'js/views/traditions.js',
    'js/views/tarot-view.js',
    'js/views/iching-view.js',
    'js/views/unified-view.js',
    'js/views/consultation.js',
    'js/views/profile.js',
    'assets/brand/logo-full-dark.svg',
    'assets/brand/logo-full-light.svg',
    'assets/brand/logo-symbol-dark.svg',
    'assets/brand/logo-symbol-light.svg',
    'assets/brand/logo-horizontal-dark.svg',
    'assets/brand/logo-horizontal-light.svg',
    'assets/brand/logo-monochrome.svg',
    'assets/icons/favicon.svg',
    'assets/icons/favicon-16x16.png',
    'assets/icons/favicon-32x32.png',
    'assets/icons/apple-touch-icon.png',
    'assets/icons/android-chrome-192x192.png',
    'assets/icons/android-chrome-512x512.png',
    'assets/social/og-aethra-oracle.png',
    'assets/audio/ui-select.wav',
    'assets/audio/ui-hover.wav',
    'assets/audio/navigation-open.wav',
    'assets/audio/oracle-open.wav',
    'assets/audio/tarot-shuffle.wav',
    'assets/audio/tarot-flip.wav',
    'assets/audio/reading-complete.wav',
    'assets/audio/iching-coin.wav',
    'assets/audio/tab-switch.wav',
    'assets/audio/input-focus.wav',
    'assets/audio/toggle-switch.wav',
    'assets/audio/error-alert.wav'
  ];

  requiredFiles.forEach(file => {
    it(`File exists and is non-empty: ${file}`, () => {
      const p = path.join(rootDir, file);
      assert.ok(fs.existsSync(p), `File does not exist: ${file}`);
      const stats = fs.statSync(p);
      assert.ok(stats.size > 0, `File is empty: ${file}`);
    });
  });

  it('Manifest JSON is valid and contains required PWA fields', () => {
    const raw = fs.readFileSync(path.join(rootDir, 'manifest.webmanifest'), 'utf8');
    const manifest = JSON.parse(raw);
    assert.ok(manifest.name.includes('AETHRA ORACLE'));
    assert.strictEqual(manifest.short_name, 'AETHRA');
    assert.strictEqual(manifest.display, 'standalone');
    assert.strictEqual(manifest.background_color, '#0C0D10');
    assert.ok(manifest.icons.length >= 2, 'Manifest must have at least 2 icon sizes');
  });

  console.log('\n--- SECTION 2: Daily Guidance & Thai Lucky Matrix ---');

  it('DailyGuidanceEngine generates complete lucky colors, numbers, and directions for all 7 days', () => {
    for (let day = 0; day < 7; day++) {
      const testDate = new Date(2026, 7, 23 + day); // Aug 23-29, 2026
      const guidance = DailyGuidanceEngine.getTodayGuidance(testDate);
      assert.ok(guidance.dayNameTh);
      assert.ok(guidance.luckyColors.wealth.name);
      assert.ok(guidance.luckyColors.career.name);
      assert.ok(guidance.luckyColors.love.name);
      assert.ok(guidance.luckyColors.avoid.name);
      assert.ok(guidance.luckyNumbers.length >= 3);
      assert.ok(guidance.luckyDirection);
      assert.ok(guidance.auspiciousHours);
      assert.ok(guidance.dailyAdvice.length > 20);
    }
  });

  console.log('\n--- SECTION 3: Sound Engine & Audio Effects ---');

  it('SoundManager controls mute state and triggers events', () => {
    SoundManager.setMuted(true);
    assert.strictEqual(SoundManager.isMuted, true);
    assert.strictEqual(SoundManager.play('ui-select'), false, 'Should return false when muted');

    SoundManager.toggleMute();
    assert.strictEqual(SoundManager.isMuted, false);
  });

  it('SoundManager sets and clamps volume within [0, 1]', () => {
    SoundManager.setVolume(0.85);
    assert.strictEqual(SoundManager.volume, 0.85);
    SoundManager.setVolume(1.5);
    assert.strictEqual(SoundManager.volume, 1.0);
    SoundManager.setVolume(-0.2);
    assert.strictEqual(SoundManager.volume, 0.0);
    SoundManager.setVolume(0.7);
  });

  it('SoundManager plays all 12 procedural celestial sound effects without throwing', () => {
    const soundTypes = [
      'ui-select',
      'ui-hover',
      'navigation-open',
      'oracle-open',
      'tarot-shuffle',
      'tarot-flip',
      'iching-coin',
      'reading-complete',
      'tab-switch',
      'input-focus',
      'toggle-switch',
      'error-alert'
    ];

    soundTypes.forEach(type => {
      const result = SoundManager.play(type);
      assert.strictEqual(result, true, `Sound type ${type} must execute successfully`);
    });
  });

  it('SoundManager fallback player and global listener attachment execute safely', () => {
    SoundManager.playFallbackAudio('ui-select');
    SoundManager.attachGlobalListeners();
    assert.ok(SoundManager.play('ui-select'));
  });

  console.log('\n--- SECTION 4: Localization (I18n) Engine ---');

  it('Site is locked to Thai and translates keys in Thai', () => {
    assert.strictEqual(I18n.getLang(), 'th');
    assert.strictEqual(I18n.t('brand_name'), 'AETHRA ORACLE');
    assert.strictEqual(I18n.t('brand_short'), 'เอธรา');

    // กดสลับภาษาไม่ได้แล้ว เว็บเป็นไทยล้วน
    I18n.setLang('en');
    assert.strictEqual(I18n.getLang(), 'th');
    assert.strictEqual(I18n.t('brand_short'), 'เอธรา');
  });

  it('Falls back to original key if translation is missing', () => {
    assert.strictEqual(I18n.t('non_existent_key_xyz'), 'non_existent_key_xyz');
  });

  console.log('\n--- SECTION 5: Storage & Data Quality ---');

  it('Saves and retrieves profile correctly', () => {
    const saved = Storage.saveProfile({
      name: 'Tester',
      birthDate: '1998-11-21',
      birthTime: '08:15',
      isTimeUnknown: false,
      birthPlace: 'Chiang Mai, Thailand',
      lat: 18.7883,
      lon: 98.9853,
      timezone: 7,
      focus: 'spiritual'
    });

    assert.strictEqual(saved.name, 'Tester');
    assert.strictEqual(saved.dataQuality, 100);
    assert.strictEqual(Storage.isOnboarded(), true);
  });

  it('Calculates data quality precision accurately', () => {
    const q1 = Storage.calculateDataQuality({ name: 'A', birthDate: '1996-08-26', birthTime: '09:30', isTimeUnknown: false, birthPlace: 'Bangkok', lat: 13.75, lon: 100.5 });
    assert.ok(q1 >= 80 && q1 <= 100);
    const qFull = Storage.calculateDataQuality({ name: 'Arthur Seeker', birthDate: '1996-08-26', birthTime: '09:30', isTimeUnknown: false, birthPlace: 'Bangkok', lat: 13.75, lon: 100.5 });
    assert.strictEqual(qFull, 100);
  });

  it('Major cities list contains coordinates and timezones', () => {
    assert.ok(MAJOR_CITIES.length >= 5);
    assert.ok(MAJOR_CITIES[0].lat && MAJOR_CITIES[0].lon);
  });

  it('Exports and imports user data cleanly', () => {
    const json = Storage.exportData();
    assert.ok(json.includes('Tester'));
    const success = Storage.importData(json);
    assert.strictEqual(success, true);
  });

  console.log('\n--- SECTION 6: Astrology Engine ---');

  it('Calculates Western Natal Chart with valid signs and degrees', () => {
    const chart = AstrologyEngine.calculateChart('1996-08-26', '09:30', 13.7563, 100.5018);
    assert.ok(chart.western.sun, 'Western Sun must exist');
    assert.strictEqual(chart.western.sun.nameEn, 'Virgo');
    assert.strictEqual(chart.western.sun.element, 'earth');
    assert.ok(chart.western.moon, 'Western Moon must exist');
    assert.ok(chart.western.ascendant, 'Ascendant must exist');
    assert.ok(chart.vedic.nakshatra, 'Vedic Nakshatra must exist');
    assert.ok(chart.thai.suriyayartSun, 'Thai Suriyayart Sun must exist');
  });

  it('Zodiac Signs constant has 12 distinct elements', () => {
    assert.strictEqual(ZODIAC_SIGNS.length, 12);
  });

  console.log('\n--- SECTION 7: BaZi (Four Pillars) Engine ---');

  it('Calculates Heavenly Stems, Earthly Branches and Five Elements balance', () => {
    const bazi = BaZiEngine.calculatePillars('1996-08-26', '09:30');
    assert.ok(bazi.pillars.year.stem, 'Year Stem must exist');
    assert.ok(bazi.pillars.year.branch, 'Year Branch must exist');
    assert.ok(bazi.pillars.month.stem, 'Month Stem must exist');
    assert.ok(bazi.pillars.day.stem, 'Day Stem (Day Master) must exist');
    assert.ok(bazi.pillars.hour.stem, 'Hour Stem must exist');
    assert.ok(bazi.fiveElements.Wood >= 0);
    assert.ok(bazi.dominantElement);
  });

  console.log('\n--- SECTION 8: Numerology Engine (Thai & Latin Support) ---');

  it('Calculates Life Path Number correctly for 1996-08-26', () => {
    const lp = NumerologyEngine.calculateLifePath('1996-08-26');
    assert.strictEqual(lp, 5);
  });

  it('Calculates Expression and Soul Urge for Latin and Thai names', () => {
    const resLatin = NumerologyEngine.analyze('Seeker', '1996-08-26');
    assert.ok(resLatin.lifePath >= 1 && resLatin.lifePath <= 33);
    assert.ok(resLatin.expression >= 1 && resLatin.expression <= 33);
    assert.ok(resLatin.meaningTh.title);

    const resThai = NumerologyEngine.analyze('สมชาย', '1996-08-26');
    assert.ok(resThai.expression >= 1 && resThai.expression <= 33);
    assert.ok(resThai.soulUrge >= 1 && resThai.soulUrge <= 33);
    assert.ok(resThai.personality >= 1 && resThai.personality <= 33);
    assert.strictEqual(resThai.nameCalculationSupported, true);
  });

  console.log('\n--- SECTION 9: Tarot Arcana Engine ---');

  it('Generates complete 78-card Tarot Deck', () => {
    const deck = TarotEngine.getFullDeck();
    assert.strictEqual(deck.length, 78, 'Tarot deck must contain exactly 78 cards');
  });

  it('Draws random cards without duplication', () => {
    const drawn = TarotEngine.drawCards(3);
    assert.strictEqual(drawn.length, 3);
    const ids = new Set(drawn.map(c => c.id));
    assert.strictEqual(ids.size, 3, 'Drawn cards must be unique');
  });

  it('Recognizes Enter and Space as keyboard activation keys', () => {
    assert.strictEqual(isKeyboardActivationKey('Enter'), true);
    assert.strictEqual(isKeyboardActivationKey(' '), true);
    assert.strictEqual(isKeyboardActivationKey('Escape'), false);
  });

  console.log('\n--- SECTION 10: I Ching Engine ---');

  it('Simulates 3-bronze-coin toss with valid sum and polarity', () => {
    for (let i = 0; i < 20; i++) {
      const toss = IChingEngine.tossCoins();
      assert.ok(toss.sum >= 6 && toss.sum <= 9);
      assert.strictEqual(toss.coins.length, 3);
    }
  });

  it('Casts 6-line Hexagram matching binary signature', () => {
    const hex = IChingEngine.castHexagram();
    assert.strictEqual(hex.lines.length, 6);
    assert.ok(hex.hexagram.number >= 1 && hex.hexagram.number <= 64);
    assert.ok(hex.hexagram.nameEn);
  });

  it('Provides a complete deterministic 64-hexagram King Wen lookup', () => {
    assert.strictEqual(HEXAGRAMS.length, 64);
    assert.strictEqual(new Set(HEXAGRAMS.map(hex => hex.number)).size, 64);
    assert.strictEqual(new Set(HEXAGRAMS.map(hex => hex.binary)).size, 64);
  });

  console.log('\n--- SECTION 11: Unified Reading & Celestial Seal ---');

  it('Synthesizes multi-tradition profile into coherent report', () => {
    const sampleProfile = {
      name: "สมชาย",
      birthDate: "1996-08-26",
      birthTime: "09:30",
      lat: 13.7563,
      lon: 100.5018
    };
    const synth = UnifiedReadingEngine.synthesize(sampleProfile);
    assert.ok(synth.synthesis.summaryTh);
    assert.ok(synth.synthesis.keyArchetype);
  });

  it('Generates deterministic seal hash code', () => {
    const hash1 = CelestialSeal.hashCode('Arthur_1996-08-26_09:30');
    const hash2 = CelestialSeal.hashCode('Arthur_1996-08-26_09:30');
    assert.strictEqual(hash1, hash2, 'Hash code must be deterministic');
  });

  runThaiEngineTests(it);
  runCoverageExtraTests(it);

  console.log(`\n========================================`);
  console.log(`Test Execution Finished: ${passedCount} / ${totalTests} Passed.`);
  console.log(`========================================`);

  if (passedCount !== totalTests) {
    process.exit(1);
  }
}

runTests();
