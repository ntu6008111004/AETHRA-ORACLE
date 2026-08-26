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
import { LifeDomainsEngine } from '../js/engines/life-domains.js';
import { detectIntent, detectShape, retrieveFacts, buildInstruction, INTENTS, QUESTION_SHAPES } from '../js/services/question-router.js';
import { ChineseZodiacEngine } from '../js/engines/chinese-zodiac.js';
import { scoreCareer, scoreMoney, scoreLove, scoreHealth, scoreLuck, elementBalance } from '../js/engines/scoring.js';
import { currentDateContext } from '../js/services/question-router.js';
import { relationBetween } from '../js/views/elements-view.js';
import { CHINESE_ELEMENTS, THAI_ELEMENTS_GUIDE, WESTERN_ELEMENTS_GUIDE, CLASH_DETAIL } from '../js/data/elements-guide.js';

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
}
