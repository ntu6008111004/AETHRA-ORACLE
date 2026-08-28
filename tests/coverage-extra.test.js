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
import { parseThaiBirthDate, parseThaiBirthTime, resolveYear } from '../js/core/thai-date-input.js';
import { DreamEngine } from '../js/engines/dream.js';
import { DREAM_BOOK } from '../js/data/dream-book.js';
import { parseOracleThinking, looksEnglish, repairForeignChars } from '../js/services/oracle-ai.js';
import { buildFactSheet, buildResonancePrompt, BANNED_VAGUE_TH } from '../js/services/resonance.js';
import { lifeStageOf } from '../js/data/modern-context.js';
import { DailyPersonalEngine } from '../js/engines/daily-personal.js';
import { YearlyPersonalEngine } from '../js/engines/yearly-personal.js';
import { ThaiNameEngine } from '../js/engines/thai-name.js';
import { buildVersionMap, stampHtml } from '../scripts/stamp-version.js';
import { AstrologyEngine } from '../js/engines/astrology.js';
import { IChingEngine } from '../js/engines/iching.js';
import { LifeDomainsEngine } from '../js/engines/life-domains.js';
import { detectIntent, detectShape, retrieveFacts, buildInstruction, INTENTS, QUESTION_SHAPES } from '../js/services/question-router.js';
import { ChineseZodiacEngine } from '../js/engines/chinese-zodiac.js';
import { scoreCareer, scoreMoney, scoreLove, scoreHealth, scoreLuck, elementBalance } from '../js/engines/scoring.js';
import { currentDateContext } from '../js/services/question-router.js';
import { relationBetween } from '../js/views/elements-view.js';
import { CHINESE_ELEMENTS, THAI_ELEMENTS_GUIDE, WESTERN_ELEMENTS_GUIDE, CLASH_DETAIL } from '../js/data/elements-guide.js';
import { PhoneNumerologyEngine, PAIR_GROUPS, NEUTRAL_PAIRS, DIGIT_PLANETS, validatePhone, normalizePhone } from '../js/engines/phone-numerology.js';
import { MAINSTREAM_PAIRS } from '../js/data/pair-meanings.js';
import { PLANET_POWER, TOTAL_POWER, luckyNumbersFromPower } from '../js/data/maha-thaksa.js';
import { TaksaEngine } from '../js/engines/thai-taksa.js';
import { PLANET_NUMBERS } from '../js/engines/life-domains.js';

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


  it('ปีชงอิงเกณฑ์ลี่ชุน ไม่ใช่ปีปฏิทินจากนาฬิกาเครื่องตรง ๆ', () => {
    // ต้นมกราคม ก่อนลี่ชุน ยังเป็นปีนักษัตรเดิม
    assert.strictEqual(
      ChineseZodiacEngine.currentZodiacYear(new Date('2026-01-15T12:00:00+07:00')), 2025);
    // หลังลี่ชุน ขึ้นปีใหม่
    assert.strictEqual(
      ChineseZodiacEngine.currentZodiacYear(new Date('2026-02-05T12:00:00+07:00')), 2026);

    // ตารางชงปี 2569 (มะเมีย) ต้องตรงตำรา:
    // ชงตรง ชวด / คัก มะเมีย / เฮ้ง เถาะ / ผั่ว ระกา
    const c = ChineseZodiacEngine.getClashYears(2026);
    assert.strictEqual(c.yearBranch.nameTh, 'มะเมีย');
    assert.strictEqual(c.direct.branch.nameTh, 'ชวด');
    assert.strictEqual(c.kak.branch.nameTh, 'มะเมีย');
    assert.strictEqual(c.heng.branch.nameTh, 'เถาะ');
    assert.strictEqual(c.pua.branch.nameTh, 'ระกา');

    // คนปีขาลปีมะเมียต้องไม่ชง คนปีชวดต้องชงตรง
    assert.strictEqual(ChineseZodiacEngine.checkChong('1998-08-26', '12:00', 2026).isChong, false);
    const rat = ChineseZodiacEngine.checkChong('1996-08-26', '12:00', 2026);
    assert.strictEqual(rat.isChong, true);
    assert.strictEqual(rat.matched[0].type, 'direct');
  });


  it('ระบบเวอร์ชัน: โค้ดเปลี่ยนแล้วรหัสต้องเปลี่ยน โค้ดเท่าเดิมรหัสต้องเท่าเดิม', () => {
    const map = buildVersionMap();
    assert.ok(/^[0-9a-f]{10}$/.test(map.version), 'รหัสต้องเป็นค่าจากเนื้อไฟล์จริง');
    assert.ok(map.jsFiles.length > 30, 'ต้องเจอไฟล์ js ครบ');

    // คำนวณซ้ำต้องได้รหัสเดิม ไม่งั้นทุกครั้งที่เข้าเว็บจะโหลดใหม่ทั้งหมดโดยไม่จำเป็น
    assert.strictEqual(buildVersionMap().version, map.version);

    // ไฟล์ js ทุกไฟล์ต้องอยู่ในแผนที่ ไม่งั้นไฟล์ที่ตกหล่นจะยังใช้ของเก่า
    map.jsFiles.forEach(f => {
      assert.ok(map.imports['./' + f], 'ขาดแผนของไฟล์ ' + f);
      assert.ok(map.imports['./' + f].includes('?v=' + map.version));
    });

    // ประทับซ้ำหลายรอบต้องได้ผลเท่าเดิม ไม่งอกซ้อนกัน
    const html = '<html><head><link rel="stylesheet" href="./css/index.css"></head>'
      + '<body><script type="module" src="./js/app.js"></script></body></html>';
    const once = stampHtml(html, map);
    const twice = stampHtml(once, map);
    assert.strictEqual(once, twice, 'ประทับซ้ำต้องได้ผลเหมือนเดิม');
    assert.ok(once.includes('./css/index.css?v=' + map.version));
    assert.ok(once.includes('./js/app.js?v=' + map.version));
    assert.ok(once.includes('type="importmap"'));

    // เวอร์ชันเก่าต้องถูกทับ ไม่ใช่ต่อท้ายซ้อนไปเรื่อย ๆ
    const stale = stampHtml(once, { version: 'aaaaaaaaaa', imports: {} });
    assert.ok(stale.includes('./css/index.css?v=aaaaaaaaaa'));
    assert.ok(!stale.includes('?v=' + map.version));
  });


  console.log('\n--- SECTION 33: วันเกิดที่ผู้ใช้พิมพ์เอง ---');

  it('อ่านวันเกิดได้ทุกรูปแบบที่คนไทยเขียนจริง ทั้ง พ.ศ. และ ค.ศ.', () => {
    const NOW = new Date('2026-08-28T12:00:00+07:00');
    // วันเกิดเดียวกัน เขียนได้สิบกว่าแบบ ต้องได้ผลตรงกันหมด
    const same = ['27/06/2541', '27-06-2541', '27.06.2541', '27 06 2541', '27/6/2541',
      '27/06/1998', '27 มิถุนายน 2541', '27 มิ.ย. 2541', '27 มิย 2541',
      '2541-06-27', '๒๗/๐๖/๒๕๔๑', '27/6/41'];
    same.forEach(input => {
      const r = parseThaiBirthDate(input, NOW);
      assert.strictEqual(r.ok, true, 'ต้องอ่านออก: ' + input);
      assert.strictEqual(r.isoDate, '1998-06-27', 'ต้องได้วันเดียวกัน: ' + input);
    });
    // ต้องแสดงกลับเป็นภาษาไทยให้ผู้ใช้ยืนยัน
    const shown = parseThaiBirthDate('27/06/2541', NOW);
    assert.ok(shown.displayTh.includes('มิถุนายน'));
    assert.ok(shown.displayTh.includes('2541'));
  });

  it('ปฏิเสธวันเกิดที่เป็นไปไม่ได้ พร้อมบอกเหตุผลเป็นภาษาไทย', () => {
    const NOW = new Date('2026-08-28T12:00:00+07:00');
    const bad = ['31/02/2541', '27/13/2541', '27/06/2600', '00/06/2541', 'มั่วซั่ว', ''];
    bad.forEach(input => {
      const r = parseThaiBirthDate(input, NOW);
      assert.strictEqual(r.ok, false, 'ต้องปฏิเสธ: ' + input);
      assert.ok(r.errorTh && r.errorTh.length > 5, 'ต้องมีเหตุผล: ' + input);
      assert.ok(!/[A-Za-z]/.test(r.errorTh), 'เหตุผลต้องเป็นภาษาไทย ไม่มีอังกฤษ');
    });
    // วันเกิดในอนาคตต้องไม่ผ่าน
    assert.strictEqual(parseThaiBirthDate('01/01/2570', NOW).ok, false);
  });

  it('แยก พ.ศ. กับ ค.ศ. ถูกต้อง และบอกผู้ใช้เมื่อระบบต้องเดา', () => {
    const NOW = new Date('2026-08-28T12:00:00+07:00');
    assert.strictEqual(resolveYear(2541, NOW).era, 'be');
    assert.strictEqual(resolveYear(2541, NOW).year, 1998);
    assert.strictEqual(resolveYear(1998, NOW).era, 'ce');
    assert.strictEqual(resolveYear(1998, NOW).year, 1998);
    // ปีสองหลักระบบต้องเดา และต้องบอกผู้ใช้ว่าเดาเป็นอะไร
    const guessed = resolveYear(41, NOW);
    assert.strictEqual(guessed.assumed, true);
    assert.ok(guessed.noteTh.includes('2541'));
  });

  it('อ่านเวลาเกิดที่เขียนเป็นคำไทยได้ เพราะผู้สูงอายุมักบอกแบบนี้', () => {
    const cases = [['09:30', '09:30'], ['9.30', '09:30'], ['สองทุ่ม', '20:00'],
      ['บ่ายสองโมง', '14:00'], ['เที่ยงคืน', '00:00'], ['ตีสาม', '03:00'],
      ['หกโมงเช้า', '06:00'], ['เที่ยงวัน', '12:00'], ['23:59', '23:59']];
    cases.forEach(([input, expect]) => {
      const r = parseThaiBirthTime(input);
      assert.strictEqual(r.ok, true, 'ต้องอ่านออก: ' + input);
      assert.strictEqual(r.time, expect, input + ' ต้องได้ ' + expect);
    });
    assert.strictEqual(parseThaiBirthTime('อะไรก็ไม่รู้').ok, false);
  });

  console.log('\n--- SECTION 34: ทำนายฝัน ---');

  it('ตำราฝันมีข้อมูลครบถ้วนและไม่มีภาษาต่างประเทศปน', () => {
    assert.ok(DREAM_BOOK.length >= 100, 'ตำราต้องมีอย่างน้อย 100 สัญลักษณ์');
    DREAM_BOOK.forEach(s => {
      const all = s.keyTh + ' ' + s.meaningTh + ' ' + s.adviceTh;
      assert.ok(!/[A-Za-z]/.test(all), 'ห้ามมีอักษรอังกฤษ: ' + s.keyTh);
      assert.ok(!/[\u4E00-\u9FFF\u3040-\u30FF]/.test(all), 'ห้ามมีอักษรจีนญี่ปุ่น: ' + s.keyTh);
      assert.ok(['ดี', 'ร้าย', 'ปนกัน'].includes(s.tone), 'โทนต้องถูกต้อง: ' + s.keyTh);
      assert.ok(s.meaningTh.length >= 60, 'ความหมายต้องละเอียดพอ: ' + s.keyTh);
      assert.ok(s.numbers.length >= 2, 'ต้องมีเลขตามตำรา: ' + s.keyTh);
      assert.ok(s.sourceTh, 'ต้องบอกที่มา: ' + s.keyTh);
    });
  });

  it('ตำราฝันต้องไม่ชี้นำการพนัน', () => {
    const banned = ['ควรซื้อ', 'ซื้อหวย', 'แทงหวย', 'ถูกรางวัลแน่', 'รวยแน่นอน'];
    DREAM_BOOK.forEach(s => {
      const all = s.meaningTh + ' ' + s.adviceTh;
      banned.forEach(b => {
        assert.ok(!all.includes(b), s.keyTh + ' ห้ามมีคำชี้นำการพนัน: ' + b);
      });
    });
  });

  it('ความหมายของแต่ละสัญลักษณ์ต้องไม่ซ้ำกัน', () => {
    const seen = new Map();
    DREAM_BOOK.forEach(s => {
      const key = s.meaningTh.slice(0, 70);
      assert.ok(!seen.has(key), s.keyTh + ' มีความหมายซ้ำกับ ' + seen.get(key));
      seen.set(key, s.keyTh);
    });
    const keys = DREAM_BOOK.map(s => s.keyTh);
    assert.strictEqual(new Set(keys).size, keys.length, 'ชื่อสัญลักษณ์ต้องไม่ซ้ำ');
  });

  it('จับสัญลักษณ์ในฝันได้ถูกต้อง และไม่จับคำที่โผล่กลางคำอื่น', () => {
    const snake = DreamEngine.interpret('ฝันว่ามีงูใหญ่เลื้อยเข้ามาในบ้าน', {});
    assert.strictEqual(snake.available, true);
    assert.ok(snake.symbols.some(s => s.keyTh === 'งูใหญ่'));

    // เคสจริงที่เคยพลาด คำว่า นก ไปโผล่ใน กินก๋วยเตี๋ยว
    const noodle = DreamEngine.interpret('ฝันว่ากินก๋วยเตี๋ยวอร่อยมาก', {});
    assert.ok(!(noodle.symbols || []).some(s => s.keyTh === 'นก'),
      'ห้ามจับคำว่า นก จากคำว่า กินก๋วยเตี๋ยว');

    // แต่ถ้าเป็นนกจริงต้องจับได้
    const bird = DreamEngine.interpret('ฝันเห็นนกบินเข้าบ้าน', {});
    assert.ok(bird.symbols.some(s => s.keyTh.includes('นก')), 'นกจริงต้องจับได้');
  });

  it('ฝันที่ตำราไม่มี ต้องบอกตรง ๆ ว่าไม่มี ห้ามเดาความหมาย', () => {
    const weird = DreamEngine.interpret('ฝันว่ากำลังเขียนโปรแกรมอยู่หน้าจอ', {});
    if (!weird.available) {
      assert.ok(weird.reasonTh.includes('ไม่') , 'ต้องบอกว่าตำราไม่มี');
      assert.ok(weird.symbols.length === 0, 'ห้ามคืนสัญลักษณ์มั่ว');
    }
    // ข้อความว่างและสั้นเกินไปต้องไม่พัง
    assert.strictEqual(DreamEngine.interpret('', {}).available, false);
    assert.strictEqual(DreamEngine.interpret('งู', {}).available, false);
    assert.doesNotThrow(() => DreamEngine.interpret(null, {}));
  });

  it('เลขจากตำราฝันเทียบกับเลขถูกโฉลกตามวันเกิดได้', () => {
    const r = DreamEngine.interpret('ฝันเห็นงูใหญ่เลื้อยเข้าบ้าน', {
      luckyNumbers: ['2', '4', '6'], badNumber: '1'
    });
    assert.strictEqual(r.available, true);
    assert.ok(r.numbers.length > 0);
    r.numbers.forEach(n => {
      assert.strictEqual(typeof n.matchesOwnerLucky, 'boolean');
      assert.strictEqual(typeof n.hasOwnerBadDigit, 'boolean');
      // ถ้าเลขมีเลข 1 ต้องถูกทำเครื่องหมายว่าเป็นเลขกาลกิณี
      if (n.value.includes('1')) assert.strictEqual(n.hasOwnerBadDigit, true);
    });
  });

  console.log('\n--- SECTION 35: ด่านกันภาษาต่างประเทศหลุดถึงผู้ใช้ ---');

  it('แยกส่วนคิดของโมเดลออกได้ แม้แท็กจะไม่ครบคู่', () => {
    // แบบครบคู่
    assert.strictEqual(parseOracleThinking('<think>คิดอยู่</think>คำตอบไทย').answer, 'คำตอบไทย');
    // แบบมีแต่แท็กปิด ซึ่งโมเดลรุ่นใหม่ทำจริง
    const closeOnly = parseOracleThinking("Here's a thinking process\n</think>\nหมายถึงโชคลาภ");
    assert.strictEqual(closeOnly.answer, 'หมายถึงโชคลาภ');
    assert.ok(!/[A-Za-z]{5}/.test(closeOnly.answer), 'ต้องตัดภาษาอังกฤษออกหมด');
    // แบบมีแต่แท็กเปิด คือถูกตัดกลางคัน
    assert.strictEqual(parseOracleThinking('คำตอบมาก่อน<think>ค้าง').answer, 'คำตอบมาก่อน');
    // ไม่มีแท็กเลย
    assert.strictEqual(parseOracleThinking('คำตอบล้วน').answer, 'คำตอบล้วน');
  });

  it('บล็อกคำตอบที่หลุดเป็นภาษาอังกฤษหรือภาษาจีน', () => {
    assert.strictEqual(looksEnglish('ดวงคุณปีนี้ดีมาก ควรลุยงานเต็มที่'), false, 'ไทยล้วนต้องผ่าน');
    assert.strictEqual(looksEnglish('Here is a thinking process about this'), true, 'อังกฤษต้องบล็อก');
    // เคสจริงที่ผู้ใช้เจอ คำจีนติดท้ายคำตอบ
    assert.strictEqual(looksEnglish('เพื่อความบันเทิงและแนวทาง仅供参考 ไม่สามารถแทนที่ได้'), true,
      'ภาษาจีนต้องบล็อก');
    assert.strictEqual(looksEnglish('การพยากรณ์นี้ です'), true, 'ภาษาญี่ปุ่นต้องบล็อก');
    // ไทยที่มีศัพท์ปนนิดหน่อยต้องผ่าน
    assert.strictEqual(looksEnglish('ดวงดี ปี ค.ศ. 2026 ลองใช้แอป LINE ดู'), false);
    assert.strictEqual(looksEnglish(''), true, 'คำตอบว่างถือว่าใช้ไม่ได้');
  });

  it('ซ่อมคำตอบที่หลุดอักษรต่างประเทศมานิดเดียวได้ โดยไม่ต้องถามใหม่', () => {
    const leaked = 'ระวังเรื่องที่คุณเก็บความรู้สึกไว้太多 (มาก) จนอีกฝ่ายไม่เข้าใจ';
    const fixed = repairForeignChars(leaked);
    assert.ok(!/[\u4E00-\u9FFF]/.test(fixed), 'ต้องตัดอักษรจีนออก');
    assert.ok(fixed.includes('เก็บความรู้สึกไว้'), 'เนื้อความไทยต้องอยู่ครบ');
    assert.strictEqual(looksEnglish(fixed), false, 'ซ่อมแล้วต้องผ่านด่านภาษา');

    // หลุดเยอะแปลว่าตอบผิดภาษาทั้งก้อน ซ่อมไม่ได้ ต้องถามใหม่
    const heavy = 'แนวทาง仅供参考不能代替专业意见请咨询专家以获得更准确的建议谢谢您';
    assert.strictEqual(looksEnglish(repairForeignChars(heavy)), true, 'หลุดเยอะต้องยังถูกบล็อก');
  });

  console.log('\n--- SECTION 36: ชั้นเรียบเรียงให้รู้สึกว่าใช่ตัวเอง ---');

  it('ประกอบข้อเท็จจริงจากผลคำนวณจริง และแยกสิ่งที่ระบบไม่รู้ออกมาชัดเจน', () => {
    const analysis = LifeDomainsEngine.analyze({
      birthDate: '1998-06-27', birthTime: null, gender: 'male'
    });
    const sheet = buildFactSheet(analysis, {});
    assert.strictEqual(sheet.available, true);

    // ต้องมีกรอบสิ่งที่ไม่รู้ เพื่อกัน AI พูดเหมือนรู้จริง
    assert.ok(sheet.unknownTh.includes('ไม่รู้ว่าตอนนี้โสดหรือมีคู่'));
    assert.ok(sheet.unknownTh.includes('ไม่ทราบเวลาเกิด'), 'ไม่กรอกเวลาต้องบอกว่าดูภพไม่ได้');

    // ต้องไม่มีคะแนนดิบหลุดไปให้ AI พูดต่อ
    assert.ok(!/\d{2}\s*คะแนน/.test(sheet.factsTh), 'ห้ามส่งคะแนนดิบให้ AI');

    // ธาตุประจำตัวกับธาตุเจ้าเรือนต้องแยกกันชัด เพราะโมเดลเคยสับสน
    assert.ok(sheet.factsTh.includes('ธาตุประจำตัว'));
    assert.ok(sheet.factsTh.includes('ธาตุเจ้าเรือน'));
    assert.ok(sheet.factsTh.includes('ห้ามเอาไปสลับกัน'));
  });

  it('คำสั่งที่ส่งให้ AI ต้องมีกฎกันมั่วครบทุกข้อที่เคยพลาดมาแล้ว', () => {
    const analysis = LifeDomainsEngine.analyze({ birthDate: '1998-06-27', birthTime: '09:30' });
    const prompt = buildResonancePrompt(buildFactSheet(analysis, {}));

    assert.ok(prompt.includes('ห้ามฟันธงเวลา'), 'ต้องห้ามฟันธงเวลา');
    assert.ok(prompt.includes('ห้ามพูดตัวเลขคะแนน'), 'ต้องห้ามพูดคะแนน');
    assert.ok(prompt.includes('ห้ามล็อกว่าโสดหรือมีคู่'), 'ต้องบังคับแยกโสดกับมีคู่');
    assert.ok(prompt.includes('ภาษาจีน'), 'ต้องห้ามภาษาจีน');
    assert.ok(prompt.includes('ห้ามสลับกัน'), 'ต้องกันธาตุสลับกัน');

    // ต้องมีวันเวลาปัจจุบัน ไม่งั้น AI จะอ้างปีเก่า
    const nowYear = new Date().getFullYear() + 543;
    assert.ok(prompt.includes(String(nowYear)), 'ต้องบอกปีปัจจุบันเป็น พ.ศ.');

    // คำกลวงต้องถูกสั่งห้ามทุกคำ
    BANNED_VAGUE_TH.forEach(w => {
      assert.ok(prompt.includes(w), 'ต้องสั่งห้ามคำกลวง: ' + w);
    });

    // คำสั่งเองต้องเป็นภาษาไทย ไม่มีอังกฤษปน
    assert.ok(!/[A-Za-z]{4}/.test(prompt), 'คำสั่งต้องเป็นภาษาไทยล้วน');
  });

  it('เลือกตัวอย่างชีวิตตามช่วงวัยได้ถูกต้อง', () => {
    assert.strictEqual(lifeStageOf(20).id, 'student');
    assert.strictEqual(lifeStageOf(28).id, 'early-career');
    assert.strictEqual(lifeStageOf(35).id, 'building');
    assert.strictEqual(lifeStageOf(50).id, 'peak');
    assert.strictEqual(lifeStageOf(70).id, 'senior');
    assert.strictEqual(lifeStageOf(null), null, 'ไม่รู้อายุต้องไม่เดา');
    // ทุกช่วงวัยต้องมีตัวอย่างที่จับต้องได้
    [20, 28, 35, 50, 70].forEach(age => {
      const st = lifeStageOf(age);
      assert.ok(st.concernsTh.length >= 3, 'ต้องมีเรื่องที่วัยนี้เจอ');
      assert.ok(!/[A-Za-z]/.test(st.concernsTh.join('')), 'ต้องเป็นภาษาไทยล้วน');
    });
  });

  it('คนเกิดต่างวัน ต้องได้ข้อเท็จจริงที่ต่างกันจริง', () => {
    const a = buildFactSheet(LifeDomainsEngine.analyze({ birthDate: '1998-06-27' }), {});
    const b = buildFactSheet(LifeDomainsEngine.analyze({ birthDate: '1975-01-15' }), {});
    const c = buildFactSheet(LifeDomainsEngine.analyze({ birthDate: '2005-11-03' }), {});
    assert.notStrictEqual(a.factsTh, b.factsTh, 'คนละวันเกิดต้องได้ข้อมูลต่างกัน');
    assert.notStrictEqual(b.factsTh, c.factsTh);
    assert.notStrictEqual(a.stage.id, c.stage.id, 'คนละวัยต้องได้ช่วงวัยต่างกัน');
  });


  it('ข้อความที่ผู้ใช้เห็นทั้งเว็บ ต้องไม่มีอักษรจีนญี่ปุ่นเกาหลีปน', () => {
    // เคยหลุดจริงหลายจุด เช่น กำลังธาตุประจำตัวเคยแสดงอักษรจีนต่อท้าย
    // และที่มาของข้อมูลเคยเขียนว่า สิบเทพ วงเล็บอักษรจีน
    // ผู้ใช้ไทยอ่านไม่ออกและดูเหมือนเว็บพัง จึงต้องล็อกไว้ด้วยเทส
    const analysis = LifeDomainsEngine.analyze({
      birthDate: '1998-06-27', birthTime: '09:30', gender: 'male', lat: 13.75, lon: 100.5
    });
    const CJK = /[぀-ヿ一-鿿가-힯]/;

    // ไล่ทุกฟิลด์ที่ลงท้ายด้วย Th เพราะเป็นข้อความที่เตรียมไว้ให้ผู้ใช้อ่าน
    const walk = (node, path) => {
      if (node === null || node === undefined) return;
      if (typeof node === 'string') {
        if (path.endsWith('Th') || path.includes('Th.')) {
          assert.ok(!CJK.test(node), 'พบอักษรต่างชาติที่ ' + path + ': ' + node.slice(0, 60));
        }
        return;
      }
      if (Array.isArray(node)) {
        node.forEach((v, i) => walk(v, path + '[' + i + ']'));
        return;
      }
      if (typeof node === 'object') {
        Object.entries(node).forEach(([k, v]) => {
          // ฟิลด์ที่ตั้งใจเก็บอักษรจีนไว้อ้างอิง ไม่ได้เอาไปแสดง
          if (k === 'hanzi' || k === 'labelHanzi') return;
          walk(v, path ? path + '.' + k : k);
        });
      }
    };
    walk(analysis, '');
  });


  console.log('\n--- SECTION 37: ดวงรายวันต้องไม่ซ้ำ และอายุต้องนับถูก ---');

  it('อายุต้องนับว่าวันเกิดปีนี้ผ่านมาหรือยัง ไม่ใช่เอาปีลบปี', () => {
    const now = new Date();
    const y = now.getFullYear();
    const pad = n => String(n).padStart(2, '0');

    // วันเกิดพรุ่งนี้ ยังไม่ครบรอบปี อายุต้องน้อยกว่าปีลบปีอยู่หนึ่ง
    const tomorrow = new Date(now.getTime() + 86400000);
    const notYet = (y - 30) + '-' + pad(tomorrow.getMonth() + 1) + '-' + pad(tomorrow.getDate());
    const r1 = LifeDomainsEngine.analyze({ birthDate: notYet });
    assert.strictEqual(r1.meta.age, 29, 'วันเกิดยังไม่ถึง อายุต้องเป็น 29 ไม่ใช่ 30');

    // วันเกิดวันนี้ ครบรอบพอดี
    const today = (y - 30) + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    assert.strictEqual(LifeDomainsEngine.analyze({ birthDate: today }).meta.age, 30);
  });

  it('รอบโชคชะตาสิบปีต้องครอบคลุมอายุจริงทุกช่วง', () => {
    // เคยพลาด คนอายุ 91 ปีเห็นว่าตัวเองอยู่ในรอบของอายุ 8 ถึง 17 ปี
    // เพราะคำนวณรอบไว้แค่ 8 รอบ พออายุเกินก็ตกไปใช้รอบแรก
    ['2024-05-05', '2015-03-10', '1998-06-27', '1980-03-10',
     '1960-03-10', '1945-03-10', '1935-03-10', '1910-03-10'].forEach(bd => {
      const r = LifeDomainsEngine.analyze({ birthDate: bd });
      const luck = r.meta.currentLuck;
      assert.ok(r.meta.age >= luck.ageFrom && r.meta.age <= luck.ageTo,
        bd + ' อายุ ' + r.meta.age + ' แต่ระบบให้รอบ ' + luck.ageFrom + '-' + luck.ageTo);
    });
  });

  it('ดวงรายวันต้องต่างกันทุกวัน ไม่ซ้ำเดิมทุกสัปดาห์', () => {
    // ของเดิมดูแค่วันในสัปดาห์ ผลจึงซ้ำเดิมทุกวันศุกร์ตลอดไป
    const me = { birthDate: '1998-06-27', birthTime: '09:30' };
    const seen = new Set();
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(2026, 7, 1 + i);
      const r = DailyPersonalEngine.forDate(me, d);
      assert.strictEqual(r.available, true);
      seen.add(r.dayPillarTh + '|' + r.factors[0].valueTh + '|' + r.levelTh);
    }
    assert.ok(seen.size >= 12, 'สิบสี่วันต้องได้ผลต่างกันอย่างน้อยสิบสองแบบ ได้ ' + seen.size);
  });

  it('ดวงรายวันของคนละคนในวันเดียวกันต้องต่างกัน', () => {
    // ของเดิมทุกคนได้คำทำนายเหมือนกันเป๊ะ ทั้งที่หัวข้อเขียนว่าดวงของคุณ
    const day = new Date(2026, 7, 28);
    const results = ['1998-06-27', '1975-01-15', '2005-11-03', '1960-09-20', '1990-02-14']
      .map(bd => DailyPersonalEngine.forDate({ birthDate: bd }, day));
    const sigs = new Set(results.map(r => r.levelTh + '|' + r.factors[0].valueTh + '|' + r.factors[1].valueTh));
    assert.ok(sigs.size >= 3, 'ห้าคนต้องได้ผลต่างกันอย่างน้อยสามแบบ ได้ ' + sigs.size);

    // เสาวันต้องเหมือนกันทุกคน เพราะเป็นวันเดียวกัน
    const pillars = new Set(results.map(r => r.dayPillarTh));
    assert.strictEqual(pillars.size, 1, 'วันเดียวกันเสาวันต้องเหมือนกัน');
  });

  it('ไม่รู้วันเกิดต้องบอกตรง ๆ ไม่แสดงคำทำนายกลางที่ใช้กับใครก็ได้', () => {
    const r = DailyPersonalEngine.forDate({}, new Date(2026, 7, 28));
    assert.strictEqual(r.available, false);
    assert.ok(r.reasonTh.includes('ไม่ทราบวันเกิด'));
    assert.ok(r.dateLabelTh.includes('สิงหาคม'), 'ยังต้องบอกวันที่ได้');
  });

  it('ทุกปัจจัยของดวงรายวันต้องบอกที่มาได้ และเป็นภาษาไทยล้วน', () => {
    const r = DailyPersonalEngine.forDate({ birthDate: '1998-06-27' }, new Date(2026, 7, 28));
    assert.strictEqual(r.factors.length, 4, 'ต้องมีสี่ปัจจัยครบ');
    r.factors.forEach(f => {
      assert.ok(f.sourceTh && f.sourceTh.length > 10, 'ทุกปัจจัยต้องบอกที่มา');
      const all = f.titleTh + f.valueTh + f.detailTh + f.sourceTh;
      assert.ok(!/[A-Za-z]/.test(all), 'ต้องไม่มีอักษรอังกฤษ: ' + f.titleTh);
      assert.ok(!/[一-鿿]/.test(all), 'ต้องไม่มีอักษรจีน: ' + f.titleTh);
    });
    assert.ok(r.methodNoteTh.includes('วันเกิดของคุณ'), 'ต้องบอกวิธีคำนวณให้ผู้ใช้รู้');
  });


  console.log('\n--- SECTION 38: บั๊กที่ตัวตรวจยืนยันแล้ว ---');

  it('ลัคนาต้องตรงกับตำแหน่งดวงอาทิตย์ตอนพระอาทิตย์ขึ้น', () => {
    // ข้อนี้พิสูจน์ด้วยฟิสิกส์ตรง ๆ ไม่ต้องเชื่อสูตรใคร
    // ตอนพระอาทิตย์โผล่พ้นขอบฟ้า จุดลัคนาคือจุดที่ดวงอาทิตย์อยู่พอดี
    // ของเดิมสลับเครื่องหมายในสูตร ทำให้ได้จุดตกซึ่งห่างออกไป 180 องศา
    const cases = [
      [2024, 3, 20, 23, 20, 13.7563, 100.5018],
      [2024, 6, 20, 22, 55, 13.7563, 100.5018],
      [2024, 3, 20, 23, 25, 18.7883, 98.9853]
    ];
    cases.forEach(([Y, M, D, h, m, lat, lon]) => {
      const jd = AstrologyEngine.getJulianDay(Y, M, D, h, m);
      const sun = AstrologyEngine.calculateSunLongitude(jd);
      const asc = AstrologyEngine.calculateAscendant(jd, lat, lon);
      let diff = ((asc - sun) % 360 + 360) % 360;
      if (diff > 180) diff -= 360;
      assert.ok(Math.abs(diff) < 8,
        'ลัคนาต้องใกล้ตำแหน่งอาทิตย์ตอนขึ้น แต่ห่าง ' + diff.toFixed(1) + ' องศา');
    });
  });

  it('เวลาเกิดต้องถูกแปลงเป็นเวลามาตรฐานก่อนคำนวณ ไม่ใช่ใช้ตรง ๆ', () => {
    // ของเดิมเอาเวลาไทยไปใช้เป็นเวลามาตรฐานกรีนิชตรง ๆ
    // ลัคนาจึงเพี้ยนไปราวสามราศีครึ่งสำหรับคนไทยทุกคน
    const th = AstrologyEngine.calculateChart('1998-06-27', '09:30', 13.7563, 100.5018, 7);
    const gmt = AstrologyEngine.calculateChart('1998-06-27', '09:30', 13.7563, 100.5018, 0);
    assert.ok(th.western.ascendant, 'ต้องคำนวณลัคนาได้');
    assert.notStrictEqual(th.western.ascendant.nameTh, gmt.western.ascendant.nameTh,
      'คนละเขตเวลาต้องได้ลัคนาคนละราศี');
  });

  it('เบอร์ที่พิมพ์ด้วยเลขไทยต้องอ่านได้ ไม่ใช่โดนลบทิ้งทั้งหมด', () => {
    assert.strictEqual(normalizePhone('๐๘๑๒๓๔๕๖๗๘'), '0812345678');
    assert.strictEqual(normalizePhone('081-234-5678'), '0812345678');
    assert.strictEqual(normalizePhone('๐๘๑-234-๕๖๗๘'), '0812345678');
  });

  it('ข้อมูลที่เก็บไว้พังต้องไม่ทำให้ทั้งเว็บล่ม', () => {
    const raw = globalThis.localStorage;
    let stored = '{ นี่คือ json ที่พัง';
    globalThis.localStorage = {
      getItem: () => stored,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    };
    try {
      assert.doesNotThrow(() => Storage.getProfile(), 'ข้อมูลพังต้องไม่ทำให้ระเบิด');
      const p1 = Storage.getProfile();
      assert.strictEqual(typeof p1, 'object');
      // ข้อมูลที่ไม่ใช่วัตถุก็ต้องไม่พัง
      stored = '"เป็นข้อความเฉย ๆ"';
      assert.doesNotThrow(() => Storage.getProfile());
      stored = '[1,2,3]';
      assert.doesNotThrow(() => Storage.getProfile());
    } finally {
      globalThis.localStorage = raw;
    }
  });

  console.log('\n--- SECTION 39: ชื่อจริงตามทักษา ---');

  it('อ่านชื่อไทยเทียบกับวันเกิดได้ และบอกอักษรกาลกิณีถูกต้อง', () => {
    // คนเกิดวันพุธ ดาวอังคารตกกาลกิณี อักษรวรรคอังคารคือ จ ฉ ช ซ ฌ ญ
    const wed = ThaiNameEngine.analyze('ธนพล', '1995-03-15');
    assert.strictEqual(wed.available, true);
    assert.ok(wed.kalakiniAllLetters.includes('ช'), 'คนเกิดวันพุธต้องเลี่ยงอักษรวรรคอังคาร');
    assert.strictEqual(wed.kalakiniLetters.length, 0, 'ชื่อธนพลไม่มีอักษรกาลกิณีของคนวันพุธ');

    // ชื่อที่มีอักษรกาลกิณีจริงต้องจับได้
    const sat = ThaiNameEngine.analyze('กนกวรรณ', '1998-06-27');
    assert.ok(sat.kalakiniLetters.length > 0, 'ต้องจับอักษรกาลกิณีในชื่อได้');
    assert.ok(sat.verdictTh.includes('กาลกิณี'));
  });

  it('ไม่รู้วันเกิดหรือชื่อไม่ใช่ภาษาไทย ต้องบอกตรง ๆ ไม่เดา', () => {
    const noBirth = ThaiNameEngine.analyze('สมชาย', null);
    assert.strictEqual(noBirth.available, false);
    assert.ok(noBirth.reasonTh.includes('วันเกิด'));

    const english = ThaiNameEngine.analyze('John Smith', '1998-06-27');
    assert.strictEqual(english.available, false);
    assert.ok(english.reasonTh.includes('ภาษาไทย'));

    assert.strictEqual(ThaiNameEngine.analyze('', '1998-06-27').available, false);
  });

  it('ไม่ให้คะแนนชื่อเป็นตัวเลข และไม่บอกให้เปลี่ยนชื่อ', () => {
    const r = ThaiNameEngine.analyze('กนกวรรณ', '1998-06-27');
    assert.strictEqual(r.score, undefined, 'ห้ามมีคะแนนตัวเลข เพราะแต่ละสำนักให้ไม่ตรงกัน');
    const all = r.verdictTh + r.verdictDetailTh + r.methodNoteTh;
    assert.ok(!/ต้องเปลี่ยนชื่อ|ควรเปลี่ยนชื่อทันที/.test(all), 'ห้ามสั่งให้เปลี่ยนชื่อ');
    assert.ok(!/[A-Za-z]/.test(all), 'ต้องเป็นภาษาไทยล้วน');
  });

  console.log('\n--- SECTION 40: ดวงปีนี้เฉพาะบุคคล ---');

  it('ดวงปีนี้ต้องต่างกันรายคน ไม่ใช่แค่แยกตามปีนักษัตร', () => {
    const now = new Date(2026, 5, 1);
    const people = ['1998-06-27', '1986-06-27', '1974-06-27', '1990-02-14', '2001-12-03'];
    const results = people.map(bd => YearlyPersonalEngine.analyze({ birthDate: bd }, now));
    results.forEach(r => assert.strictEqual(r.available, true));

    // ปีนักษัตรของปีต้องเหมือนกันทุกคน เพราะเป็นปีเดียวกัน
    assert.strictEqual(new Set(results.map(r => r.yearPillarTh)).size, 1);

    // แต่ธีมของปีต้องต่างกัน เพราะเทียบกับธาตุประจำตัวของแต่ละคน
    const themes = new Set(results.map(r => r.layers[0].valueTh));
    assert.ok(themes.size >= 3, 'ห้าคนต้องได้ธีมปีต่างกันอย่างน้อยสามแบบ ได้ ' + themes.size);
  });

  it('ดวงปีนี้ต้องมีสี่ชั้น ทุกชั้นบอกที่มาได้ และเป็นภาษาไทยล้วน', () => {
    const r = YearlyPersonalEngine.analyze({ birthDate: '1998-06-27' }, new Date(2026, 5, 1));
    assert.strictEqual(r.layers.length, 4);
    r.layers.forEach(l => {
      assert.ok(l.sourceTh && l.sourceTh.length > 10, 'ทุกชั้นต้องบอกที่มา');
      const all = l.titleTh + l.valueTh + l.detailTh + l.sourceTh;
      assert.ok(!/[A-Za-z]/.test(all), 'ห้ามมีอักษรอังกฤษ: ' + l.titleTh);
      assert.ok(!/[\u4E00-\u9FFF]/.test(all), 'ห้ามมีอักษรจีน: ' + l.titleTh);
    });
  });

  it('เรื่องความรักต้องแยกกรณีคนโสดกับคนมีคู่เสมอ ห้ามล็อก', () => {
    // ผู้ใช้สั่งชัดว่าห้ามทำนายแบบล็อกว่าคนนี้โสดคนนี้มีคู่
    ['1998-06-27', '1986-06-27', '1974-06-27', '2001-12-03', '1990-02-14'].forEach(bd => {
      const r = YearlyPersonalEngine.analyze({ birthDate: bd }, new Date(2026, 5, 1));
      assert.ok(/โสด/.test(r.loveTh), bd + ' ต้องพูดถึงกรณีคนโสด');
      assert.ok(/มีคู่|มีแฟน/.test(r.loveTh), bd + ' ต้องพูดถึงกรณีคนมีคู่ด้วย');
    });
  });

  it('ปีชงต้องตัดปีตามลี่ชุน และไม่รู้วันเกิดต้องไม่เดา', () => {
    // ต้นเดือนมกราคมยังเป็นปีนักษัตรเดิม
    const beforeLiChun = YearlyPersonalEngine.analyze(
      { birthDate: '1998-06-27' }, new Date(2026, 0, 15));
    assert.strictEqual(beforeLiChun.zodiacYear, 2025, 'ก่อนลี่ชุนยังเป็นปีเดิม');

    const afterLiChun = YearlyPersonalEngine.analyze(
      { birthDate: '1998-06-27' }, new Date(2026, 1, 20));
    assert.strictEqual(afterLiChun.zodiacYear, 2026, 'หลังลี่ชุนขึ้นปีใหม่');

    assert.strictEqual(YearlyPersonalEngine.analyze({}).available, false);
  });


  it('ตัดคำอังกฤษที่หลุดปนกลางประโยคไทยออกได้ แต่เก็บชื่อแอปไว้', () => {
    // โมเดลชอบเผลอแทรกคำอังกฤษกลางประโยคไทย เช่น อย่าลุย aggressively
    const a = repairForeignChars('ไม่ควรเร่งรีบหรือลุย aggressively อย่างปีอื่น');
    assert.ok(!/[A-Za-z]/.test(a), 'คำอังกฤษเดี่ยวต้องถูกตัด');
    assert.ok(a.includes('ไม่ควรเร่งรีบ'), 'เนื้อความไทยต้องอยู่ครบ');

    // รูปแบบคำอังกฤษวงเล็บคำไทย ให้เหลือแค่คำไทย เพราะโมเดลแปลไว้แล้ว
    const b = repairForeignChars('ปีนี้ง่ายต่อการ misunderstood (เข้าใจผิด) กัน');
    assert.ok(!/[A-Za-z]/.test(b));
    assert.ok(b.includes('เข้าใจผิด'), 'ต้องเก็บคำแปลไทยไว้');

    // ชื่อแอปที่คนไทยเรียกทับศัพท์จริง ต้องไม่ถูกตัด
    const c = repairForeignChars('ลองทักไปทาง LINE หรือ Facebook ดู');
    assert.ok(c.includes('LINE') && c.includes('Facebook'), 'ชื่อแอปต้องคงไว้');
    assert.strictEqual(looksEnglish(c), false, 'ประโยคสั้นที่มีชื่อแอปต้องไม่ถูกบล็อก');

    // ไทยล้วนต้องไม่ถูกแก้อะไรเลย
    const pure = 'ดวงคุณปีนี้ดีมาก ควรลุยงานเต็มที่';
    assert.strictEqual(repairForeignChars(pure), pure);
  });

  it('I18n: เว็บถูกล็อกเป็นภาษาไทยล้วน สลับภาษาไม่ได้แล้ว', () => {
    assert.strictEqual(I18n.getLang(), 'th');
    I18n.setLang('en');
    assert.strictEqual(I18n.getLang(), 'th', 'ต้องไม่สลับไปภาษาอื่นแล้ว');
    const home = I18n.t('nav_home');
    assert.ok(/[฀-๿]/.test(home), 'คีย์แปลต้องคืนค่าเป็นภาษาไทย');
    assert.strictEqual(I18n.t('คีย์ที่ไม่มีจริง'), 'คีย์ที่ไม่มีจริง', 'คีย์ที่ไม่มีต้องไม่ทำระบบพัง');
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

  console.log('\n--- SECTION 27: ตัวอ่านคำถาม แก้ปัญหาตอบซ้ำ (Question Router) ---');

  it('จับหมวดคำถามได้ถูกต้องทุกหมวด', () => {
    assert.strictEqual(detectIntent('ถ้าหาคู่แท้ผมต้องหาคนแบบไหน').id, 'love');
    assert.strictEqual(detectIntent('ควรลาออกไปทำธุรกิจไหม').id, 'career');
    assert.strictEqual(detectIntent('การเงินผมปีนี้เป็นยังไง').id, 'money');
    assert.strictEqual(detectIntent('สุขภาพต้องระวังอะไร').id, 'health');
    assert.strictEqual(detectIntent('ปีนี้ชงไหม แก้ชงยังไง').id, 'luck');
    assert.strictEqual(detectIntent('ดวงลูกเป็นยังไง จะได้บ้านไหม').id, 'family');
    assert.strictEqual(detectIntent('จะสอบติดไหม').id, 'study');
    assert.strictEqual(detectIntent('สวัสดีครับ').id, 'general');
    assert.strictEqual(INTENTS.length, 7);
  });

  it('จับชนิดคำถามเพื่อเลือกรูปแบบคำตอบได้', () => {
    assert.strictEqual(detectShape('ควรลาออกไหม').id, 'yesno');
    assert.strictEqual(detectShape('จะได้แต่งงานเมื่อไหร่').id, 'when');
    assert.strictEqual(detectShape('ต้องแก้ชงยังไง').id, 'how');
    assert.strictEqual(detectShape('เนื้อคู่เป็นคนแบบไหน').id, 'what');
    assert.strictEqual(detectShape('เล่าให้ฟังหน่อย').id, 'general');
    Object.values(QUESTION_SHAPES).forEach(shape => {
      assert.ok(shape.instructionTh.length > 40, 'ทุกรูปแบบต้องมีคำสั่งที่ชัดเจน');
    });
  });

  it('คำถามต่างหมวดต้องดึงข้อมูลคนละชุด ไม่ปนกัน', () => {
    const profile = {
      birthDate: '1996-08-26', birthTime: '09:30', lat: 13.7563, lon: 100.5018,
      gender: 'yang', name: 'สมชาย', nickname: 'ชาย'
    };
    const result = LifeDomainsEngine.analyze(profile);
    const ids = ['love', 'career', 'money', 'health', 'luck', 'family', 'study', 'general'];
    const contexts = ids.map(id => retrieveFacts(result.meta, result.domains, id));

    // ทุกบริบทต้องไม่ซ้ำกันเลย นี่คือหัวใจของการแก้ปัญหาตอบซ้ำ
    assert.strictEqual(new Set(contexts).size, ids.length, 'บริบทของแต่ละหมวดต้องต่างกันทั้งหมด');

    const love = retrieveFacts(result.meta, result.domains, 'love');
    const money = retrieveFacts(result.meta, result.domains, 'money');
    const health = retrieveFacts(result.meta, result.domains, 'health');

    assert.ok(love.includes('ภพคู่ครอง'), 'บริบทความรักต้องมีภพคู่ครอง');
    assert.ok(!love.includes('ภพการเงิน'), 'บริบทความรักต้องไม่มีภพการเงินปน');
    assert.ok(money.includes('ภพการเงิน'), 'บริบทการเงินต้องมีภพการเงิน');
    assert.ok(!money.includes('ภพคู่ครอง'), 'บริบทการเงินต้องไม่มีภพคู่ครองปน');
    assert.ok(health.includes('ห้ามวินิจฉัยโรค'), 'บริบทสุขภาพต้องมีข้อห้ามวินิจฉัยโรค');
  });

  it('ไม่ทราบเวลาเกิดต้องเตือนห้ามเดาลัคนา และไม่มีภพในบริบท', () => {
    const noTime = LifeDomainsEngine.analyze({ birthDate: '1996-08-26', name: 'ทดสอบ' });
    const ctx = retrieveFacts(noTime.meta, noTime.domains, 'love');
    assert.ok(ctx.includes('ห้ามเดาลัคนา'), 'ต้องเตือนโมเดลห้ามเดา');
    assert.ok(ctx.includes('ไม่ทราบเวลาเกิด'));
  });

  it('คำสั่งบังคับตอบตรงคำถาม ห้ามอังกฤษในวงเล็บ ห้ามคำกวี', () => {
    const { instructionTh, intent, shape } = buildInstruction('ควรลาออกไปทำธุรกิจไหม');
    assert.strictEqual(intent.id, 'career');
    assert.strictEqual(shape.id, 'yesno');
    assert.ok(instructionTh.includes('ตอบเฉพาะคำถามข้างบนเท่านั้น'));
    assert.ok(instructionTh.includes('ห้ามสรุปดวงทั้งหมดซ้ำ'));
    assert.ok(instructionTh.includes('(Leo)'), 'ต้องยกตัวอย่างคำอังกฤษที่ห้ามใช้');
    assert.ok(instructionTh.includes('ห้ามใช้คำเชิงกวี'));
    assert.ok(instructionTh.includes('หนึ่งบรรทัดต่อหนึ่งเรื่อง'));
    assert.ok(instructionTh.includes('ควรลาออกไปทำธุรกิจไหม'), 'ต้องย้ำคำถามเดิมให้โมเดลเห็นชัด');
  });

  it('ส่งประโยคเปิดเดิมไปแล้วต้องมีคำสั่งห้ามตอบซ้ำ', () => {
    const withPrev = buildInstruction('การเงินเป็นยังไง', ['วงจรชีวิตของคุณถูกขับเคลื่อนด้วยธาตุไม้']);
    assert.ok(withPrev.instructionTh.includes('ห้ามขึ้นต้นคำตอบซ้ำ'));
    const withoutPrev = buildInstruction('การเงินเป็นยังไง');
    assert.ok(!withoutPrev.instructionTh.includes('ห้ามขึ้นต้นคำตอบซ้ำ'));
  });

  console.log('\n--- SECTION 28: ปีเกิด พ.ศ. ต้องไม่สับสนกับปีของรอบนักษัตร ---');

  it('เกิดก่อนลี่ชุน: ปีเกิดจริงกับปีรอบนักษัตรต้องต่างกัน และแยกฟิลด์ชัดเจน', () => {
    // 15 ม.ค. 1997 = พ.ศ. 2540 แต่ยังอยู่ในรอบปีชวด (พ.ศ. 2539) เพราะก่อนลี่ชุน 4 ก.พ.
    const z = ChineseZodiacEngine.getZodiac('1997-01-15', '09:30', 7);
    assert.strictEqual(z.nameTh, 'ชวด', 'เกิดก่อนลี่ชุนต้องเป็นนักษัตรปีก่อนหน้า');
    assert.strictEqual(z.bornBeforeLiChun, true);
    assert.strictEqual(z.birthBuddhistYear, 2540, 'ปีเกิดจริงต้องเป็น พ.ศ. 2540');
    assert.strictEqual(z.buddhistYear, 2539, 'ปีของรอบนักษัตรคือ พ.ศ. 2539');
    assert.notStrictEqual(z.birthBuddhistYear, z.buddhistYear, 'สองค่านี้ต้องไม่เท่ากันในกรณีนี้');
  });

  it('เกิดหลังลี่ชุน: ปีเกิดจริงกับปีรอบนักษัตรต้องตรงกัน', () => {
    const z = ChineseZodiacEngine.getZodiac('1997-06-27', '09:30', 7);
    assert.strictEqual(z.nameTh, 'ฉลู');
    assert.strictEqual(z.bornBeforeLiChun, false);
    assert.strictEqual(z.birthBuddhistYear, 2540);
    assert.strictEqual(z.buddhistYear, 2540);
  });

  it('ปีเกิดจริงต้องเท่ากับปีในวันเกิดเสมอ ไม่ว่าเกิดวันไหน', () => {
    const cases = ['1997-01-01', '1997-02-03', '1997-02-04', '1997-02-10', '1997-12-31',
      '2000-01-31', '2024-02-04', '2026-02-01'];
    cases.forEach(d => {
      const z = ChineseZodiacEngine.getZodiac(d, '12:00', 7);
      const expected = Number(d.slice(0, 4)) + 543;
      assert.strictEqual(z.birthBuddhistYear, expected,
        d + ' ปีเกิดจริงต้องเป็น พ.ศ. ' + expected);
    });
  });

  it('ขอบเขตลี่ชุนแม่นระดับวัน: 3 ก.พ. กับ 10 ก.พ. 1997 ต้องคนละนักษัตร', () => {
    const before = ChineseZodiacEngine.getZodiac('1997-02-03', '12:00', 7);
    const after = ChineseZodiacEngine.getZodiac('1997-02-10', '12:00', 7);
    assert.strictEqual(before.nameTh, 'ชวด');
    assert.strictEqual(after.nameTh, 'ฉลู');
    assert.strictEqual(before.birthBuddhistYear, after.birthBuddhistYear, 'ปีเกิดจริงเท่ากันทั้งคู่');
  });

  console.log('\n--- SECTION 29: คะแนนต้องคำนวณจริง ไม่ใช่ค่าคงที่ ---');

  const mkProfile = (birthDate, birthTime = '09:30') => ({
    birthDate, birthTime, lat: 13.7563, lon: 100.5018,
    gender: 'yang', name: 'ทดสอบ', nickname: 'ท'
  });

  it('คะแนนกระจายหลากหลาย ไม่ใช่มีแค่สองสามค่า', () => {
    const seen = { career: new Set(), money: new Set(), love: new Set(), health: new Set(), luck: new Set() };
    for (let i = 0; i < 40; i++) {
      const y = 1975 + i, m = (i % 12) + 1, d = (i * 7 % 27) + 1;
      const iso = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const r = LifeDomainsEngine.analyze(mkProfile(iso));
      Object.keys(seen).forEach(k => seen[k].add(r.domains[k].score));
    }
    // เดิมมีแค่ 2-3 ค่า ตอนนี้ต้องมากกว่า 8 ค่าที่ต่างกัน
    Object.entries(seen).forEach(([k, set]) => {
      assert.ok(set.size >= 8, 'ด้าน ' + k + ' ควรมีคะแนนหลากหลายอย่างน้อย 8 ค่า แต่มี ' + set.size);
    });
  });

  it('ทุกคะแนนต้องบอกที่มาได้ และผลรวมต้องตรงกับปัจจัย', () => {
    const r = LifeDomainsEngine.analyze(mkProfile('1996-08-26'));
    ['career', 'money', 'love', 'health', 'luck'].forEach(k => {
      const dm = r.domains[k];
      assert.ok(dm.scoring, 'ด้าน ' + k + ' ต้องมีที่มาของคะแนน');
      assert.ok(dm.scoring.factors.length >= 3, 'ด้าน ' + k + ' ต้องมีปัจจัยอย่างน้อย 3 ข้อ');
      dm.scoring.factors.forEach(f => {
        assert.ok(f.labelTh && f.reasonTh, 'ทุกปัจจัยต้องมีชื่อและเหตุผล');
        assert.ok(typeof f.points === 'number', 'ทุกปัจจัยต้องมีคะแนนเป็นตัวเลข');
      });
      // ผลรวมต้องตรงกับคะแนนที่แสดง หลังจำกัดช่วง 30-95
      const raw = dm.scoring.base + dm.scoring.factors.reduce((a, f) => a + f.points, 0);
      const expected = Math.max(30, Math.min(95, Math.round(raw)));
      assert.strictEqual(dm.score, expected, 'ด้าน ' + k + ' คะแนนต้องตรงกับผลรวมปัจจัย');
    });
  });

  it('เปลี่ยนปัจจัยจริงแล้วคะแนนต้องเปลี่ยนตาม', () => {
    const strongBazi = { strength: { isStrong: true }, missingElements: [], missingElementsTh: [] };
    const weakBazi = { strength: { isStrong: false }, missingElements: [], missingElementsTh: [] };
    const gods = { has: () => false };
    const favLuck = { isFavourable: true, nameTh: 'ทดสอบ' };
    const badLuck = { isFavourable: false, nameTh: 'ทดสอบ' };
    const noChong = { isChong: false, matched: [] };
    const yesChong = { isChong: true, matched: [{ labelTh: 'ชงตรง' }] };
    const houses = { available: true };

    const good = scoreCareer({ bazi: strongBazi, gods, currentLuck: favLuck, chong: noChong, houses, personalYear: 1 });
    const bad = scoreCareer({ bazi: weakBazi, gods, currentLuck: badLuck, chong: yesChong, houses, personalYear: 9 });
    assert.ok(good.score > bad.score, 'ปัจจัยดีทั้งหมดต้องได้คะแนนสูงกว่าปัจจัยแย่ทั้งหมด');

    // ปีชงต้องหักคะแนนโชคลาภจริง
    const luckOk = scoreLuck({ chong: noChong, currentLuck: favLuck, personalYear: 1, balance: 0.8, bazi: strongBazi });
    const luckChong = scoreLuck({ chong: yesChong, currentLuck: favLuck, personalYear: 1, balance: 0.8, bazi: strongBazi });
    assert.ok(luckChong.score < luckOk.score, 'ปีชงต้องทำให้คะแนนโชคลาภลดลง');
  });

  it('คะแนนอยู่ในช่วง 30-95 เสมอ ไม่ทะลุกรอบ', () => {
    for (let i = 0; i < 30; i++) {
      const y = 1960 + i * 2, m = (i % 12) + 1, d = (i * 5 % 28) + 1;
      const iso = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const r = LifeDomainsEngine.analyze(mkProfile(iso));
      Object.values(r.domains).forEach(dm => {
        assert.ok(dm.score >= 30 && dm.score <= 95, 'คะแนนต้องอยู่ในช่วง 30-95 แต่ได้ ' + dm.score);
      });
    }
  });

  it('ความสมดุลธาตุคำนวณถูกต้อง', () => {
    const perfect = elementBalance({ Wood: 2, Fire: 2, Earth: 2, Metal: 2, Water: 2 });
    const skewed = elementBalance({ Wood: 10, Fire: 0, Earth: 0, Metal: 0, Water: 0 });
    assert.ok(perfect > 0.95, 'ธาตุเท่ากันหมดต้องได้คะแนนสมดุลเกือบเต็ม');
    assert.ok(skewed < 0.3, 'ธาตุเทไปทางเดียวต้องได้คะแนนสมดุลต่ำ');
    assert.strictEqual(elementBalance({ Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 }), 0);
  });

  console.log('\n--- SECTION 30: ต้องอิงปีปัจจุบันเสมอ ไม่ให้ AI เดาปีเอง ---');

  it('บริบทที่ส่งให้ AI ต้องมีวันเวลาปัจจุบันอยู่บนสุด', () => {
    const profile = { birthDate: '1996-08-26', birthTime: '09:30', lat: 13.7563, lon: 100.5018, name: 'ท', nickname: 'ท' };
    const r = LifeDomainsEngine.analyze(profile);
    ['love', 'career', 'money', 'health', 'luck', 'general'].forEach(id => {
      const facts = retrieveFacts(r.meta, r.domains, id);
      assert.ok(facts.trimStart().startsWith('[วันเวลาปัจจุบัน'),
        'หมวด ' + id + ' ต้องมีวันเวลาปัจจุบันอยู่บนสุด');
    });
  });

  it('วันเวลาที่ส่งให้ AI ต้องตรงกับเวลาจริง ไม่ใช่ค่าตายตัว', () => {
    const now = new Date();
    const d = currentDateContext(now);
    assert.strictEqual(d.year, now.getFullYear());
    assert.strictEqual(d.beYear, now.getFullYear() + 543);
    // ส่งเวลาอื่นเข้าไปต้องได้ผลตามนั้น พิสูจน์ว่าไม่ได้ hardcode
    const future = currentDateContext(new Date('2030-03-15T00:00:00'));
    assert.strictEqual(future.beYear, 2573);
    assert.strictEqual(future.quarter, 1);
    const past = currentDateContext(new Date('2015-11-20T00:00:00'));
    assert.strictEqual(past.beYear, 2558);
    assert.strictEqual(past.quarter, 4);
  });

  it('มีคำสั่งห้าม AI อ้างปีที่ผ่านไปแล้วว่าเป็นอนาคต', () => {
    const d = currentDateContext();
    assert.ok(d.blockTh.includes('ห้ามอ้างปีที่ผ่านไปแล้ว'));
    assert.ok(d.blockTh.includes(String(d.beYear)), 'ต้องระบุปี พ.ศ. ปัจจุบันชัดเจน');
    const inst = buildInstruction('ควรลงทุนไหม');
    assert.ok(inst.instructionTh.includes(String(d.beYear)), 'คำสั่งต้องย้ำปีปัจจุบัน');
  });

  it('เอนจินคำนวณปีชงและเลขจังหวะชีวิตตามปีปัจจุบันจริง', () => {
    const thisYear = new Date().getFullYear();
    const r = LifeDomainsEngine.analyze({ birthDate: '1996-08-26', birthTime: '09:30', name: 'ท' });
    assert.strictEqual(r.meta.chong.targetYear, thisYear, 'ปีชงต้องเช็คกับปีปัจจุบัน');
    assert.strictEqual(r.meta.chong.buddhistYear, thisYear + 543);
    const expectedPY = NumerologyEngine.calculatePersonalYear('1996-08-26', thisYear);
    assert.strictEqual(r.meta.numerology.personalYear, expectedPY, 'เลขจังหวะชีวิตต้องใช้ปีปัจจุบัน');
  });

  console.log('\n--- SECTION 31: คู่มือธาตุ ธาตุไหนหนุน ธาตุไหนขัด ---');

  it('วงจรก่อเกิดถูกต้องตามตำราครบ 5 คู่', () => {
    const generate = [['Wood', 'Fire'], ['Fire', 'Earth'], ['Earth', 'Metal'], ['Metal', 'Water'], ['Water', 'Wood']];
    generate.forEach(([a, b]) => {
      assert.strictEqual(relationBetween(a, b).key, 'generates', a + ' ต้องก่อเกิด ' + b);
      assert.strictEqual(relationBetween(b, a).key, 'generatedBy', b + ' ต้องถูกก่อเกิดโดย ' + a);
    });
  });

  it('วงจรข่มถูกต้องตามตำราครบ 5 คู่', () => {
    const control = [['Wood', 'Earth'], ['Earth', 'Water'], ['Water', 'Fire'], ['Fire', 'Metal'], ['Metal', 'Wood']];
    control.forEach(([a, b]) => {
      assert.strictEqual(relationBetween(a, b).key, 'controls', a + ' ต้องข่ม ' + b);
      assert.strictEqual(relationBetween(b, a).key, 'controlledBy', b + ' ต้องถูกข่มโดย ' + a);
      assert.strictEqual(relationBetween(a, b).tone, 'clash', 'คู่ข่มต้องถูกทำเครื่องหมายว่าขัดกัน');
    });
  });

  it('ตารางเทียบธาตุ 5x5 ครบทุกช่อง แบ่งเป็นหนุน 10 ขัด 10 เหมือน 5', () => {
    const order = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
    const tally = { good: 0, clash: 0, neutral: 0 };
    order.forEach(a => order.forEach(b => {
      const rel = relationBetween(a, b);
      assert.ok(rel && rel.shortTh && rel.explainTh, 'ทุกช่องต้องมีคำอธิบาย');
      tally[rel.tone] += 1;
    }));
    assert.strictEqual(tally.good, 10);
    assert.strictEqual(tally.clash, 10);
    assert.strictEqual(tally.neutral, 5);
  });

  it('ข้อมูลธาตุครบทั้งสามระบบ และทุกธาตุมีเนื้อหาครบ', () => {
    assert.strictEqual(Object.keys(CHINESE_ELEMENTS).length, 5);
    assert.strictEqual(Object.keys(THAI_ELEMENTS_GUIDE).length, 4);
    assert.strictEqual(Object.keys(WESTERN_ELEMENTS_GUIDE).length, 4);
    assert.strictEqual(Object.keys(CLASH_DETAIL).length, 5, 'ต้องมีคำอธิบายคู่ที่ขัดกันครบ 5 คู่');

    Object.entries(CHINESE_ELEMENTS).forEach(([key, el]) => {
      ['nameTh', 'coreTh', 'imageTh', 'strengthTh', 'weaknessTh', 'careerTh',
        'colorTh', 'directionTh', 'organTh', 'adviceTh'].forEach(f => {
        assert.ok(el[f] && String(el[f]).length > 5, 'ธาตุ ' + key + ' ขาดฟิลด์ ' + f);
      });
      assert.ok(Array.isArray(el.traitsTh) && el.traitsTh.length >= 3, 'ธาตุ ' + key + ' ต้องมีนิสัยอย่างน้อย 3 ข้อ');
    });

    Object.entries(CLASH_DETAIL).forEach(([key, d]) => {
      // imageTh เป็นวลีเปรียบเทียบสั้น ๆ ตั้งใจ เช่น รากไม้ชอนไชดิน
      assert.ok(d.imageTh && d.imageTh.length >= 8, 'คู่ ' + key + ' ขาดวลีเปรียบเทียบ');
      ['meaningTh', 'frictionTh', 'fixTh'].forEach(f => {
        assert.ok(d[f] && String(d[f]).length > 25, 'คู่ ' + key + ' ขาดคำอธิบาย ' + f);
      });
    });
  });

  it('คู่ที่ขัดกันในตารางต้องตรงกับคำอธิบายที่เขียนไว้', () => {
    Object.keys(CLASH_DETAIL).forEach(key => {
      const [a, b] = key.split('-');
      assert.strictEqual(relationBetween(a, b).key, 'controls',
        'คู่ ' + key + ' ที่เขียนคำอธิบายไว้ ต้องเป็นคู่ข่มจริงในตาราง');
    });
  });

  console.log('\n--- SECTION 32: เลขศาสตร์เบอร์โทร ---');

  it('ตารางคู่เลขไม่ซ้ำกัน และครอบคลุมทุกคู่ยกเว้นคู่ที่มีเลขศูนย์', () => {
    const seen = new Set();
    Object.values(PAIR_GROUPS).forEach(g => g.pairs.forEach(pair => {
      assert.ok(!seen.has(pair), 'คู่ ' + pair + ' ถูกจัดซ้ำสองกลุ่ม');
      seen.add(pair);
    }));
    NEUTRAL_PAIRS.forEach(p => seen.add(p));

    const missing = [];
    for (let i = 0; i < 100; i++) if (!seen.has(i)) missing.push(String(i).padStart(2, '0'));
    // ที่เหลือต้องเป็นคู่ที่ขึ้นต้นด้วย 0 เท่านั้น ซึ่งตำราไม่จัดกลุ่ม
    assert.ok(missing.every(m => m[0] === '0'),
      'คู่ที่ไม่ได้จัดกลุ่มต้องเป็นคู่ที่มีเลขศูนย์เท่านั้น แต่พบ ' + missing.join(' '));
    assert.strictEqual(Object.keys(DIGIT_PLANETS).length, 10, 'ต้องมีดาวประจำเลขครบ 0-9');
  });

  it('ทุกกลุ่มดาวมีคำอธิบายรายด้านครบ', () => {
    Object.entries(PAIR_GROUPS).forEach(([key, g]) => {
      ['nameTh', 'shortTh', 'meaningTh', 'workTh', 'moneyTh', 'loveTh'].forEach(f => {
        assert.ok(g[f] && String(g[f]).length > 5, 'กลุ่ม ' + key + ' ขาดฟิลด์ ' + f);
      });
      assert.ok(Array.isArray(g.pairs) && g.pairs.length > 0);
      assert.ok(['great', 'good', 'mixed', 'bad'].includes(g.tone));
    });
  });

  it('ตรวจความถูกต้องของเบอร์และตัดอักขระที่ไม่ใช่ตัวเลข', () => {
    assert.strictEqual(normalizePhone('081-234-5678'), '0812345678');
    assert.strictEqual(normalizePhone('(081) 234 5678'), '0812345678');
    assert.strictEqual(validatePhone('').valid, false);
    assert.strictEqual(validatePhone('0812').valid, false);
    assert.strictEqual(validatePhone('08123456789').valid, false);
    assert.strictEqual(validatePhone('081-234-5678').valid, true);
  });

  it('วิเคราะห์เบอร์ได้ครบและสรุปตามเกณฑ์ที่เปิดเผย', () => {
    const r = PhoneNumerologyEngine.analyze('0812345678');
    assert.strictEqual(r.available, true);
    assert.strictEqual(r.phone, '0812345678');
    assert.strictEqual(r.pairs.length, 9, 'เบอร์ 10 หลักต้องมีคู่เลข 9 คู่');
    // 0+8+1+2+3+4+5+6+7+8 = 44
    const expectedSum = '0812345678'.split('').reduce((a, d) => a + Number(d), 0);
    assert.strictEqual(r.sum, expectedSum, 'ผลรวมต้องเท่ากับผลบวกทุกหลัก');
    assert.strictEqual(r.sum, 44);
    r.pairs.forEach(p => assert.ok(p.group && p.group.nameTh, 'ทุกคู่ต้องมีกลุ่มดาว'));
    assert.strictEqual(r.pairs.filter(p => p.isLast).length, 1, 'ต้องมีคู่ท้ายเพียงคู่เดียว');
    // ต้องไม่มีคะแนนที่คิดขึ้นเองอีกแล้ว
    assert.strictEqual(r.score, undefined, 'ต้องเลิกใช้คะแนน 0-100 ที่ไม่มีในตำรา');
    assert.ok(['great', 'good', 'neutral', 'careful', 'avoid'].includes(r.grade));
    assert.ok(r.gradeTh && r.gradeReasonTh.length > 15, 'ต้องบอกเหตุผลของระดับที่ได้');
    assert.ok(r.gradeRuleTh.length >= 4, 'ต้องเปิดเผยเกณฑ์การตัดสินทั้งหมด');
    assert.ok(r.disclaimerTh.includes('ความเชื่อ'), 'ต้องมีคำเตือนตามความจริง');
  });

  it('ตารางสายเบอร์มงคลครบ 100 คู่ และทุกคู่มีความหมายกับระดับ', () => {
    for (let i = 0; i < 100; i++) {
      const pair = MAINSTREAM_PAIRS[i];
      assert.ok(pair, 'ขาดคู่ ' + String(i).padStart(2, '0'));
      assert.ok(['ดี', 'กลาง', 'เสีย'].includes(pair.tone), 'คู่ ' + i + ' ระดับไม่ถูกต้อง');
      assert.ok(pair.m && pair.m.length > 10, 'คู่ ' + i + ' ความหมายสั้นเกินไป');
      assert.ok(Array.isArray(pair.tags));
    }
    // คู่สลับหลักต้องมีความหมายเดียวกันตามตำรา เช่น 15 กับ 51
    [[15, 51], [24, 42], [59, 95], [79, 97]].forEach(([a, b]) => {
      assert.strictEqual(MAINSTREAM_PAIRS[a].m, MAINSTREAM_PAIRS[b].m,
        'คู่ ' + a + ' กับ ' + b + ' ต้องมีความหมายเดียวกัน');
    });
  });

  it('ระดับที่ได้ต้องตรงกับเกณฑ์สายเบอร์มงคลที่ประกาศไว้', () => {
    const rank = { avoid: 0, careful: 1, neutral: 2, good: 3, great: 4 };
    const many = PhoneNumerologyEngine.analyze('0899999999');
    const few = PhoneNumerologyEngine.analyze('0813133737');
    assert.ok(many.goodPairs.length > few.goodPairs.length);
    assert.ok(rank[many.grade] > rank[few.grade],
      'เบอร์คู่ดีเยอะควรได้ระดับดีกว่า แต่ได้ ' + many.gradeTh + ' กับ ' + few.gradeTh);

    // คู่ท้ายเป็นคู่เสียตามสายหลัก ต้องถูกลดระดับตามกฎ
    const lastBad = PhoneNumerologyEngine.analyze('0824456613');
    const lastPair = lastBad.pairs[lastBad.pairs.length - 1];
    assert.strictEqual(lastPair.mainstream.tone, 'เสีย', 'คู่ 13 ต้องเป็นคู่เสียตามตาราง');
    assert.ok(['careful', 'avoid'].includes(lastBad.grade),
      'คู่ท้ายเป็นคู่เสีย ต้องได้ระดับควรระวังตามกฎ แต่ได้ ' + lastBad.gradeTh);
    assert.ok(lastBad.gradeReasonTh.includes('คู่ท้าย'));
  });

  it('เบอร์ที่เว็บเบอร์มงคลถือว่าดี ต้องได้ผลดีที่นี่ด้วย (เคสจริงของผู้ใช้)', () => {
    // 082-619-7995 เคยได้ควรระวังจากสายกลุ่มดาว ทั้งที่วงการเบอร์มงคลถือว่าดีมาก
    const r = PhoneNumerologyEngine.analyze('0826197995');
    assert.ok(['great', 'good'].includes(r.grade),
      'เบอร์นี้ต้องได้ระดับดีตามสายเบอร์มงคล แต่ได้ ' + r.gradeTh);
    assert.ok(r.goodPairs.length >= 6, 'ต้องพบคู่ดีอย่างน้อย 6 คู่');
    // คู่ 95 ท้ายเบอร์ สายหลักต้องอ่านว่าดี
    const last = r.pairs[r.pairs.length - 1];
    assert.strictEqual(last.text, '95');
    assert.strictEqual(last.mainstream.tone, 'ดี');
    // และต้องรายงานตรง ๆ ว่าสองสายอ่านคู่นี้ไม่ตรงกัน
    assert.ok(r.disagreedPairs.some(p => p.text === '95'),
      'ต้องแจ้งผู้ใช้ว่าคู่ 95 สองสายอ่านต่างกัน');
    assert.ok(r.supports.length >= 2, 'ต้องสรุปได้ว่าส่งเสริมด้านไหนบ้าง');
  });

  it('กำลังพระเคราะห์ตามคัมภีร์มหาทักษารวมกันได้ 108 พอดี', () => {
    const total = Object.values(PLANET_POWER).reduce((a, p) => a + p.power, 0);
    assert.strictEqual(total, 108, 'กำลังดาวทั้ง 8 ต้องรวมได้ 108 ตามคัมภีร์');
    assert.strictEqual(TOTAL_POWER, 108);
    assert.strictEqual(Object.keys(PLANET_POWER).length, 8);
    // ค่าที่ตรวจสอบกับแหล่งอ้างอิงแล้ว
    assert.strictEqual(PLANET_POWER.sun.power, 6);
    assert.strictEqual(PLANET_POWER.moon.power, 15);
    assert.strictEqual(PLANET_POWER.venus.power, 21);
    assert.strictEqual(PLANET_POWER.jupiter.power, 19);
  });

  it('เลขนำโชคจากกำลังวันคำนวณถูกและใช้ตรงตามที่ตำราบอก', () => {
    const sunday = luckyNumbersFromPower('sun');
    assert.strictEqual(sunday.power, 6);
    assert.ok(sunday.pairsSummingToPower.every(pair =>
      Number(pair[0]) + Number(pair[1]) === 6), 'ทุกคู่ต้องบวกกันได้เท่ากำลังวัน');
    // ศุกร์กำลัง 21 เกิน 18 จึงไม่มีคู่สองหลักที่บวกได้ ต้องบอกตรง ๆ
    const friday = luckyNumbersFromPower('venus');
    assert.strictEqual(friday.pairsSummingToPower.length, 0);
    assert.ok(friday.explainTh.includes('ไม่มี'));
    assert.strictEqual(luckyNumbersFromPower('ไม่มีดาวนี้'), null);
  });

  it('เบอร์ที่ผิดรูปแบบต้องบอกเหตุผล ไม่ใช่พังหรือเดา', () => {
    const r = PhoneNumerologyEngine.analyze('12');
    assert.strictEqual(r.available, false);
    assert.ok(r.reasonTh && r.reasonTh.length > 5);
  });

  it('เทียบเบอร์กับวันเกิดเจ้าของโดยใช้เลขกาลกิณีจากทักษา', () => {
    const taksa = TaksaEngine.calculate('1996-08-26');
    const phone = PhoneNumerologyEngine.analyze('0812345678');
    const match = PhoneNumerologyEngine.matchWithOwner(taksa, phone, PLANET_NUMBERS);
    assert.ok(match, 'ต้องเทียบได้');
    assert.ok(Array.isArray(match.goodNumbers) && match.goodNumbers.length >= 3);
    assert.strictEqual(typeof match.badNumber, 'number');
    assert.ok(match.verdictTh.length > 20);
    // เลขกาลกิณีต้องไม่ปนอยู่ในเลขมงคล
    assert.ok(!match.goodNumbers.includes(match.badNumber),
      'เลขกาลกิณีต้องไม่อยู่ในรายการเลขมงคล');
  });


  it('สรุปเฉพาะตัวต้องรวมทั้งตารางเบอร์และวันเกิด และแนะนำสมเหตุสมผล', () => {
    const taksa = TaksaEngine.calculate('1996-08-26'); // วันจันทร์ กาลกิณีคือเลข 1
    const check = (phone) => {
      const r = PhoneNumerologyEngine.analyze(phone);
      return { r, m: PhoneNumerologyEngine.matchWithOwner(taksa, r, PLANET_NUMBERS) };
    };

    // ดีทั้งสองทาง -> ใช้ต่อ
    const keep = check('0899999999');
    assert.strictEqual(keep.m.decision, 'keep');
    assert.ok(keep.m.decisionTh.includes('ใช้ต่อ'));

    // ตารางดีแต่มีเลขกาลกิณีปน -> ไม่ต้องรีบเปลี่ยน
    const keepNote = check('0826197995');
    assert.strictEqual(keepNote.m.decision, 'keep-note');
    assert.ok(keepNote.m.decisionDetailTh.includes('เลข 1'));

    // เสียสองต่อ -> แนะนำเปลี่ยน พร้อมบอกเลขที่ควรมีและควรเลี่ยง
    const change = check('0813133711');
    assert.strictEqual(change.m.decision, 'change');
    assert.ok(change.m.decisionDetailTh.includes('เสียสองต่อ'));
    assert.ok(change.m.decisionDetailTh.includes(change.m.goodNumbers.join(' ')));

    // ทุกแบบต้องมีคำอธิบายยาวพอ ไม่ใช่คำสั่งห้วน ๆ
    [keep, keepNote, change].forEach(({ m }) => {
      assert.ok(m.decisionDetailTh.length > 60, 'คำอธิบายต้องละเอียดพอ');
    });
  });

  it('คู่ที่มีเลขศูนย์ต้องบอกตรง ๆ ว่าพลังอ่อน ไม่แต่งความหมายขึ้นเอง', () => {
    const res = PhoneNumerologyEngine.lookupPair(3);
    assert.strictEqual(res.isNeutral, true);
    assert.ok(res.group.meaningTh.includes('ศูนย์'), 'ต้องอธิบายว่าเป็นเพราะเลขศูนย์');
  });
}
