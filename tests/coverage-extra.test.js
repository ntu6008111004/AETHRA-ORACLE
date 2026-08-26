/**
 * AETHRA ORACLE — เทสเสริมเพื่อปิด coverage ส่วนที่เหลือ
 * (เสียงสังเคราะห์, ที่เก็บข้อมูล, เลขศาสตร์เลขมาสเตอร์, ความเข้ากันของธาตุ, unified)
 */

import assert from 'assert';

import { SoundManager } from '../js/core/sound.js';
import { Storage, resolveBirthPlace, MAJOR_CITIES } from '../js/core/storage.js';
import { NumerologyEngine, LIFE_PATH_MEANINGS_TH } from '../js/engines/numerology.js';
import { CompatibilityEngine } from '../js/engines/compatibility.js';
import { UnifiedReadingEngine } from '../js/engines/unified.js';
import { I18n } from '../js/core/i18n.js';
import { AstrologyEngine } from '../js/engines/astrology.js';
import { IChingEngine } from '../js/engines/iching.js';

/** AudioContext จำลองสำหรับรันโค้ดสังเคราะห์เสียงใน Node */
function createFakeAudioContext() {
  const param = () => ({
    setValueAtTime() { return this; },
    exponentialRampToValueAtTime() { return this; },
    linearRampToValueAtTime() { return this; },
    value: 0
  });
  const node = () => ({
    type: 'sine',
    buffer: null,
    frequency: param(),
    gain: param(),
    Q: param(),
    detune: param(),
    playbackRate: param(),
    connect() { return this; },
    start() {},
    stop() {}
  });
  return {
    currentTime: 0,
    state: 'suspended',
    sampleRate: 44100,
    destination: {},
    resume() { this.state = 'running'; },
    createOscillator: node,
    createGain: node,
    createBufferSource: node,
    createBiquadFilter: node,
    createBuffer(channels, length) {
      return { getChannelData: () => new Float32Array(length) };
    }
  };
}

export function runCoverageExtraTests(it) {
  console.log('\n--- SECTION 21: เสียงสังเคราะห์ครบทุกแบบ (Web Audio จำลอง) ---');

  it('สังเคราะห์เสียงครบทุกชนิดผ่าน AudioContext จำลองโดยไม่พัง', () => {
    const hadWindow = typeof globalThis.window !== 'undefined';
    const previousWindow = globalThis.window;
    globalThis.window = {
      AudioContext: function FakeAudioContext() { return createFakeAudioContext(); },
      dispatchEvent() {},
      matchMedia: () => ({ matches: false })
    };
    try {
      SoundManager.setMuted(false);
      const types = [
        'ui-select', 'ui-hover', 'navigation-open', 'oracle-open',
        'tarot-shuffle', 'tarot-flip', 'iching-coin', 'reading-complete',
        'tab-switch', 'input-focus', 'toggle-switch', 'error-alert',
        'ไม่มีเสียงนี้'
      ];
      types.forEach(type => {
        assert.strictEqual(SoundManager.play(type), true, `เสียง ${type} ต้องเล่นได้`);
      });
      // เล่นซ้ำเพื่อผ่านเส้นทาง resume ของ context ที่ถูกพักไว้
      assert.strictEqual(SoundManager.play('ui-select'), true);
    } finally {
      if (hadWindow) globalThis.window = previousWindow;
      else delete globalThis.window;
    }
  });

  console.log('\n--- SECTION 22: ที่เก็บข้อมูล (Storage) ส่วนที่เหลือ ---');

  it('resolveBirthPlace: เมืองที่รู้จักได้พิกัด เมืองแปลกได้ null ไม่มั่วพิกัด', () => {
    const bangkok = resolveBirthPlace(MAJOR_CITIES[0].name);
    assert.strictEqual(bangkok.lat, MAJOR_CITIES[0].lat);
    assert.strictEqual(bangkok.timezone, MAJOR_CITIES[0].tz);
    const unknown = resolveBirthPlace('หมู่บ้านลึกลับ');
    assert.strictEqual(unknown.lat, null);
    assert.strictEqual(unknown.timezone, null);
    // ถ้าพิมพ์ชื่อเดิมของโปรไฟล์เดิม ให้คงพิกัดเดิมไว้
    const kept = resolveBirthPlace('บ้านเดิม', { birthPlace: 'บ้านเดิม', lat: 15.5, lon: 101.1, timezone: 7 });
    assert.strictEqual(kept.lat, 15.5);
  });

  it('เก็บและอ่านบทสนทนาห้องปรึกษาแยกตามหัวข้อ', () => {
    const before = Storage.getConsultationMessages('_covtest');
    Storage.saveConsultationMessage('_covtest', { role: 'user', text: 'ทดสอบ' });
    Storage.saveConsultationMessage('_covtest', { role: 'oracle', text: 'ตอบกลับ' });
    const after = Storage.getConsultationMessages('_covtest');
    assert.strictEqual(after.length, before.length + 2);
    assert.strictEqual(after[after.length - 1].text, 'ตอบกลับ');
    assert.deepStrictEqual(Storage.getConsultationMessages('_หัวข้อว่าง'), []);
  });

  it('ประวัติการดูดวงเก็บได้ไม่เกิน 50 รายการ และ import ข้อมูลเสียไม่พัง', () => {
    for (let i = 0; i < 55; i++) Storage.addReadingToHistory({ type: 'CovTest', index: i });
    assert.ok(Storage.getReadingsHistory().length <= 50);
    assert.strictEqual(Storage.importData('ไม่ใช่ JSON'), false);
    assert.strictEqual(Storage.importData('{"history": "ไม่ใช่อาเรย์"}'), true);
  });

  it('calculateDataQuality ให้คะแนนต่ำเมื่อข้อมูลไม่ครบ', () => {
    const empty = Storage.calculateDataQuality({});
    assert.ok(empty <= 65);
    const noTime = Storage.calculateDataQuality({ name: 'ก ข', birthDate: '1990-01-01', isTimeUnknown: true });
    assert.ok(noTime < 100);
  });

  console.log('\n--- SECTION 23: เลขศาสตร์ เลขมาสเตอร์และกรณีขอบ ---');

  it('เลขมาสเตอร์ 11 22 33 ต้องไม่ถูกลดทอน', () => {
    assert.strictEqual(NumerologyEngine.reduceNumber(11), 11);
    assert.strictEqual(NumerologyEngine.reduceNumber(22), 22);
    assert.strictEqual(NumerologyEngine.reduceNumber(33), 33);
    assert.strictEqual(NumerologyEngine.reduceNumber(11, false), 2, 'ปิด preserveMaster ต้องลดเป็น 2');
    assert.strictEqual(NumerologyEngine.reduceNumber(0), 1);
    assert.strictEqual(NumerologyEngine.reduceNumber(NaN), 1);
  });

  it('ข้อมูลเกิดผิดรูปแบบให้ค่าปริยาย 1 ไม่ใช่พัง', () => {
    assert.strictEqual(NumerologyEngine.calculateLifePath(null), 1);
    assert.strictEqual(NumerologyEngine.calculateLifePath('ไม่ใช่วันที่'), 1);
    assert.strictEqual(NumerologyEngine.calculateExpression(null), 1);
    assert.strictEqual(NumerologyEngine.calculateSoulUrge(''), 1);
    assert.strictEqual(NumerologyEngine.calculatePersonality(undefined), 1);
    assert.strictEqual(NumerologyEngine.calculatePersonalYear('xx'), 1);
  });

  it('ความหมาย Life Path มีครบ 12 แบบ (1-9 และ 11 22 33)', () => {
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33].forEach(n => {
      assert.ok(LIFE_PATH_MEANINGS_TH[n]?.title, `ต้องมีความหมายเลข ${n}`);
      assert.ok(LIFE_PATH_MEANINGS_TH[n]?.desc.length > 20);
    });
  });

  console.log('\n--- SECTION 24: ความเข้ากันของธาตุประจำตัว (ทุกความสัมพันธ์) ---');

  it('compare ครอบคลุมธาตุก่อเกิด/ถูกก่อเกิด/ข่ม/ถูกข่ม/เสมอ', () => {
    // เลือกวันที่ที่มีธาตุประจำตัวต่างกันจริง แล้วตรวจว่า elementRelation ให้ครบทุกแบบ
    const dates = [
      '1996-08-26', '1997-03-10', '1998-11-21', '2000-01-01', '2001-07-04',
      '1984-02-10', '1990-05-05', '1993-09-09', '2002-12-25', '1988-06-15'
    ];
    const seen = new Set();
    for (const a of dates) {
      for (const b of dates) {
        const result = CompatibilityEngine.compare({ birthDate: a }, { birthDate: b });
        seen.add(result.elementRelation.key);
        assert.ok(result.verdictTh.length > 10);
      }
    }
    ['same', 'generates', 'generatedBy', 'controls', 'controlledBy'].forEach(key => {
      assert.ok(seen.has(key), `ต้องเจอความสัมพันธ์ธาตุแบบ ${key} ในชุดทดสอบ`);
    });
  });

  it('ระดับคำตัดสินครอบคลุมทั้งช่วงคะแนน', () => {
    const verdicts = new Set();
    const dates = ['1996-08-26', '1997-03-10', '1998-11-21', '2000-01-01', '2001-07-04', '1984-02-10', '1990-05-05', '2004-04-16', '2008-08-08'];
    for (const a of dates) for (const b of dates) {
      verdicts.add(CompatibilityEngine.compare({ birthDate: a }, { birthDate: b }).verdictTh);
    }
    assert.ok(verdicts.size >= 3, 'ต้องมีคำตัดสินหลายระดับ ไม่ใช่ตอบเหมือนกันหมด');
  });

  console.log('\n--- SECTION 25: Unified + I18n + เคสขอบทางดาราศาสตร์ ---');

  it('Unified: ไม่มีวันเกิดต้องบอกตรง ๆ และไม่เดา แต่ไพ่ยังใช้ได้', () => {
    const result = UnifiedReadingEngine.synthesize({ name: 'นิรนาม', birthDate: null });
    assert.strictEqual(result.astrology, null);
    assert.strictEqual(result.limitedReason, 'missing_birth_date');
    assert.ok(result.synthesis.summaryTh.includes('ไม่ได้เดา'));
    assert.strictEqual(result.tarot.length, 3);
  });

  it('I18n: สลับภาษาไปกลับและคีย์แปลหลักมีครบสองภาษา', () => {
    I18n.setLang('th');
    const thai = I18n.t('nav_home');
    I18n.setLang('en');
    const english = I18n.t('nav_home');
    assert.notStrictEqual(thai, english);
    I18n.setLang('ภาษาที่ไม่มี');
    assert.ok(['th', 'en'].includes(I18n.getLang()), 'ภาษาแปลกต้องไม่ทำระบบพัง');
    I18n.setLang('th');
  });

  it('โหราศาสตร์: วันข้ามราศีและปีอธิกสุรทินคำนวณได้', () => {
    const leap = AstrologyEngine.calculateChart('2000-02-29', '00:00', 13.75, 100.5);
    assert.ok(leap.western.sun.nameTh);
    const newYear = AstrologyEngine.calculateChart('1999-12-31', '23:59', 13.75, 100.5);
    assert.ok(newYear.western.moon.nameTh);
    assert.throws(() => AstrologyEngine.calculateChart('ผิดรูปแบบ'));
    // ไม่มีพิกัด -> ไม่มีลัคนา ไม่เดา
    const noCoords = AstrologyEngine.calculateChart('1996-08-26', '09:30', null, null);
    assert.strictEqual(noCoords.western.ascendant, null);
  });

  it('อี้จิง: โยนด้วยเส้นที่กำหนดได้ผลก๊กตรงตามเส้น', () => {
    const allYang = IChingEngine.castHexagram([
      { isYang: true }, { isYang: true }, { isYang: true },
      { isYang: true }, { isYang: true }, { isYang: true }
    ]);
    assert.strictEqual(allYang.hexagram.number, 1, 'หกเส้นหยางคือก๊กที่ 1 เฉียน');
    const allYin = IChingEngine.castHexagram([
      { isYang: false }, { isYang: false }, { isYang: false },
      { isYang: false }, { isYang: false }, { isYang: false }
    ]);
    assert.strictEqual(allYin.hexagram.number, 2, 'หกเส้นหยินคือก๊กที่ 2 คุน');
  });

  console.log('\n--- SECTION 26: ความลึกของคำทำนาย (ไพ่รายใบ + อี้จิง 64 ก๊ก) ---');

  it('ไพ่ทั้ง 78 ใบมีความหมายเฉพาะตัวไม่ซ้ำกัน และมีคำแนะนำครบ', async () => {
    const { TarotEngine } = await import('../js/engines/tarot.js');
    const deck = TarotEngine.getFullDeck();
    assert.strictEqual(deck.length, 78);
    const meanings = new Set(deck.map(c => c.keywordsTh));
    assert.strictEqual(meanings.size, 78, 'ความหมายไพ่ต้องไม่ซ้ำกันเลย');
    deck.forEach(c => {
      assert.ok(c.adviceTh && c.adviceTh.length > 15, c.nameTh + ' ต้องมีคำแนะนำ');
      assert.ok((c.meaningTh || c.keywordsTh).length > 25, c.nameTh + ' ความหมายต้องยาวพออ่านรู้เรื่อง');
    });
  });

  it('อี้จิงมีคำทำนายจริงครบ 64 ก๊ก ทั้งคำตัดสิน คำแนะนำ และรายด้าน', async () => {
    const { HEXAGRAMS } = await import('../js/engines/iching.js');
    assert.strictEqual(HEXAGRAMS.length, 64);
    HEXAGRAMS.forEach(h => {
      assert.ok(h.judgementTh.length > 30, 'ก๊ก ' + h.number + ' คำตัดสินต้องละเอียด');
      assert.ok(h.adviceTh.length > 20, 'ก๊ก ' + h.number + ' ต้องมีคำแนะนำ');
      assert.ok(h.loveTh && h.workTh && h.moneyTh, 'ก๊ก ' + h.number + ' ต้องมีคำใบ้ครบ งาน รัก เงิน');
      assert.ok(h.imageTh && !h.imageTh.includes('over'), 'ภาพธรรมชาติต้องเป็นภาษาไทย');
      assert.ok(h.upperRole && h.lowerRole, 'ต้องอ่านโครงสร้างตรีลักษณ์ได้');
    });
    const judgements = new Set(HEXAGRAMS.map(h => h.judgementTh));
    assert.strictEqual(judgements.size, 64, 'คำตัดสินต้องไม่ซ้ำกัน');
  });

  it('ก๊กแปรผลคำนวณถูกต้องตามกฎพลิกเส้นแปร', async () => {
    const { IChingEngine } = await import('../js/engines/iching.js');
    // หกเส้นหยางเก่า: เฉียน (1) แปรเป็น คุน (2)
    const allOldYang = Array.from({ length: 6 }, () => ({ isYang: true, isChanging: true }));
    const r1 = IChingEngine.castHexagram(allOldYang);
    assert.strictEqual(r1.hexagram.number, 1);
    assert.strictEqual(r1.transformed.number, 2);
    assert.strictEqual(r1.changingPositions.length, 6);
    // ไม่มีเส้นแปร: ไม่มีก๊กแปรผล
    const still = Array.from({ length: 6 }, () => ({ isYang: false, isChanging: false }));
    const r2 = IChingEngine.castHexagram(still);
    assert.strictEqual(r2.transformed, null);
    assert.ok(r2.changingNoteTh.includes('นิ่ง'));
  });

  it('ล้างแชทห้องปรึกษาได้เฉพาะห้องที่เลือก ห้องอื่นไม่หาย', () => {
    Storage.saveConsultationMessage('_clearA', { role: 'user', text: 'หนึ่ง' });
    Storage.saveConsultationMessage('_clearB', { role: 'user', text: 'สอง' });
    Storage.clearConsultationMessages('_clearA');
    assert.strictEqual(Storage.getConsultationMessages('_clearA').length, 0);
    assert.strictEqual(Storage.getConsultationMessages('_clearB').length, 1);
    Storage.clearConsultationMessages('_clearB');
  });
}
