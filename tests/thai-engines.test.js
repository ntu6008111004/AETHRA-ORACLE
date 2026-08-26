/**
 * AETHRA ORACLE — ชุดทดสอบศาสตร์ไทย-จีน (เรียกจาก test-suite.js)
 * ทุกค่าคาดหวังมาจากตำราจริงหรือค่าอ้างอิงทางดาราศาสตร์ ไม่ใช่ค่าที่จดจากผลรันเอง
 */

import assert from 'assert';

import { TaksaEngine, TAKSA_PLANETS, TAKSA_CYCLE, TAKSA_POSITIONS, THAI_WEEKDAYS } from '../js/engines/thai-taksa.js';
import {
  solarLongitude, findSolarTerm, getLiChun, getBaZiYear, getBaZiMonthBranch, SOLAR_TERMS, toJulianDay, fromJulianDay
} from '../js/engines/solar-terms.js';
import {
  BaZiEngine, HEAVENLY_STEMS, EARTHLY_BRANCHES, HIDDEN_STEMS, FIVE_ELEMENTS, TEN_GODS,
  ELEMENT_GENERATES, ELEMENT_CONTROLS
} from '../js/engines/bazi.js';
import { ChineseZodiacEngine, ZODIAC_PROFILES, CHONG_REMEDIES } from '../js/engines/chinese-zodiac.js';
import { ThaiAstrologyEngine, THAI_BODY_ELEMENTS, THAI_HOUSES, THAI_SIGN_RULERS } from '../js/engines/thai-astrology.js';
import { CompatibilityEngine, SAM_HAP_GROUPS, LIU_HAP_PAIRS, HAI_PAIRS } from '../js/engines/compatibility.js';
import { LifeDomainsEngine, ELEMENT_DIRECTIONS, PLANET_NUMBERS } from '../js/engines/life-domains.js';
import { GLOSSARY, explain, allTerms, searchTerms } from '../js/core/glossary.js';
import { parseOracleThinking } from '../js/services/oracle-ai.js';

export function runThaiEngineTests(it) {
  console.log('\n--- SECTION 12: ทักษาปกรณ์ (Taksa) ---');

  it('ลำดับทักษาถูกต้องครบ 8 ดวง และตำแหน่งครบ 8 ภูมิ', () => {
    assert.deepStrictEqual(TAKSA_CYCLE, ['sun', 'moon', 'mars', 'mercury', 'saturn', 'jupiter', 'rahu', 'venus']);
    assert.strictEqual(TAKSA_POSITIONS.length, 8);
    assert.strictEqual(TAKSA_POSITIONS[0].id, 'boriwan');
    assert.strictEqual(TAKSA_POSITIONS[7].id, 'kalakini');
    assert.strictEqual(Object.keys(TAKSA_PLANETS).length, 8);
  });

  it('กาลกิณีตรงตำราไทยครบทั้ง 7 วันเกิด', () => {
    // ตำรา: อาทิตย์ห้ามน้ำเงิน(ศุกร์) จันทร์ห้ามแดง(อาทิตย์) อังคารห้ามขาว(จันทร์)
    //        พุธห้ามชมพู(อังคาร) พฤหัสห้ามดำ(เสาร์) ศุกร์ห้ามเทา(ราหู) เสาร์ห้ามเขียว(พุธ)
    const expected = {
      0: 'venus', 1: 'sun', 2: 'moon', 3: 'mars', 4: 'saturn', 5: 'rahu', 6: 'mercury'
    };
    // 25-31 ส.ค. 1996 = อาทิตย์ถึงเสาร์พอดี
    for (let d = 25; d <= 31; d++) {
      const chart = TaksaEngine.calculate(`1996-08-${d}`);
      assert.strictEqual(chart.avoidColor.planetId, expected[chart.dayOfWeek],
        `${chart.weekdayNameTh} ต้องมีกาลกิณีเป็น ${expected[chart.dayOfWeek]}`);
    }
  });

  it('กติกาพุธกลางคืน: เกิดพุธหลัง 18:00 เป็นคนพระราหู', () => {
    assert.strictEqual(TaksaEngine.calculate('1996-08-28', '09:30').birthPlanetId, 'mercury');
    assert.strictEqual(TaksaEngine.calculate('1996-08-28', '18:00').birthPlanetId, 'rahu');
    assert.strictEqual(TaksaEngine.calculate('1996-08-28', '23:59').birthPlanetId, 'rahu');
    // ราหูเป็นดาวเริ่ม -> กาลกิณีคือพฤหัสบดี
    assert.strictEqual(TaksaEngine.calculate('1996-08-28', '19:00').avoidColor.planetId, 'jupiter');
  });

  it('ทุกตำแหน่งทักษามีสี คำอธิบาย และตัวอย่างครบ', () => {
    const chart = TaksaEngine.calculate('2000-01-01');
    chart.positions.forEach(pos => {
      assert.ok(pos.colorName.length > 3, 'ต้องมีชื่อสี');
      assert.ok(/^#[0-9A-F]{6}$/i.test(pos.colorHex), 'ต้องมีรหัสสี');
      assert.ok(pos.plainTh.length > 20, 'ต้องมีคำอธิบายภาษาชาวบ้าน');
      assert.ok(pos.exampleTh.includes('ตัวอย่าง'), 'ต้องมีตัวอย่างการใช้');
      assert.ok(pos.letters.length > 0, 'ต้องมีอักษรวรรค');
    });
  });

  it('ตรวจอักษรกาลกิณีในชื่อได้ถูกต้อง (คนเกิดวันศุกร์ ห้ามวรรคราหู ย ร ล ว)', () => {
    const friday = TaksaEngine.calculate('1996-08-30');
    const bad = TaksaEngine.auditName('วรรณา', friday);
    assert.strictEqual(bad.hasKalakini, true);
    assert.ok(bad.foundLetters.includes('ว') && bad.foundLetters.includes('ร'));
    const good = TaksaEngine.auditName('สมใจ', friday);
    assert.strictEqual(good.hasKalakini, false);
  });

  it('วันเกิดไม่ถูกต้องต้องโยน error ไม่ใช่เดา', () => {
    assert.throws(() => TaksaEngine.calculate('ไม่ใช่วันที่'));
    assert.throws(() => TaksaEngine.calculate(null));
    assert.throws(() => TaksaEngine.calculate('26/08/1996'));
  });

  console.log('\n--- SECTION 13: สุริยคติ 24 สารท (Solar Terms) ---');

  it('ลี่ชุนตรงค่าอ้างอิงดาราศาสตร์ (2000, 2024, 2025, 2026)', () => {
    const expected = { 2000: '2000-02-04', 2024: '2024-02-04', 2025: '2025-02-03', 2026: '2026-02-04' };
    for (const [year, date] of Object.entries(expected)) {
      const liChun = getLiChun(Number(year));
      const cst = new Date(liChun.getTime() + 8 * 3600000).toISOString().slice(0, 10);
      assert.strictEqual(cst, date, `ลี่ชุน ${year} ต้องตรงวันที่ ${date}`);
    }
  });

  it('วิษุวัตและอายัน 2026 ตกในวันที่ถูกต้อง', () => {
    const cstDate = (d) => new Date(d.getTime() + 8 * 3600000).toISOString().slice(5, 10);
    assert.strictEqual(cstDate(findSolarTerm(2026, 0)), '03-20');   // วสันตวิษุวัต
    assert.strictEqual(cstDate(findSolarTerm(2026, 90)), '06-21');  // ครีษมายัน
    assert.strictEqual(cstDate(findSolarTerm(2026, 180)), '09-23'); // ศารทวิษุวัต
    assert.strictEqual(cstDate(findSolarTerm(2026, 270)), '12-22'); // เหมายัน
  });

  it('มีสารทครบ 24 และสารทต้นเดือน (เจี๋ย) ครบ 12', () => {
    assert.strictEqual(SOLAR_TERMS.length, 24);
    assert.strictEqual(SOLAR_TERMS.filter(t => !t.major).length, 12);
    const branchIndices = SOLAR_TERMS.filter(t => !t.major).map(t => t.branchIndex).sort((a, b) => a - b);
    assert.deepStrictEqual(branchIndices, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('Julian Day แปลงไปกลับได้ค่าเดิม', () => {
    const date = new Date(Date.UTC(1996, 7, 26, 2, 30));
    const roundTrip = fromJulianDay(toJulianDay(date));
    assert.ok(Math.abs(roundTrip - date) < 1000, 'แปลงไปกลับต้องคลาดไม่เกิน 1 วินาที');
  });

  it('ขอบเขตปี BaZi เปลี่ยนที่ลี่ชุน ไม่ใช่ 1 มกราคม', () => {
    assert.strictEqual(getBaZiYear(new Date('1996-01-15T12:00:00Z')), 1995);
    assert.strictEqual(getBaZiYear(new Date('1996-08-26T12:00:00Z')), 1996);
    assert.strictEqual(getBaZiYear(new Date('2026-02-01T12:00:00Z')), 2025);
    assert.strictEqual(getBaZiYear(new Date('2026-02-10T12:00:00Z')), 2026);
  });

  console.log('\n--- SECTION 14: ดวงจีน BaZi (คำนวณตามตำราจริง) ---');

  it('เสาวันตรงจุดยึดปฏิทินหกสิบรอบ: 1 ม.ค. 2000 = อู้มะเมีย (戊午)', () => {
    const chart = BaZiEngine.calculatePillars('2000-01-01', '12:00', 8);
    assert.strictEqual(chart.pillars.day.ganZhi, '戊午');
  });

  it('กฎอู่หู่ตุ้น: ปีก้านเจี่ย เดือนขาล ได้ก้านปิ่ง (丙寅)', () => {
    const chart = BaZiEngine.calculatePillars('1984-02-10', '12:00', 8);
    assert.strictEqual(chart.pillars.year.stem.hanzi, '甲');
    assert.strictEqual(chart.pillars.month.ganZhi, '丙寅');
  });

  it('เสาปีเปลี่ยนที่ลี่ชุน: 1 ก.พ. 2026 ยังเป็นมะเส็ง, 10 ก.พ. เป็นมะเมีย', () => {
    assert.strictEqual(BaZiEngine.calculatePillars('2026-02-01', '12:00', 8).pillars.year.ganZhi, '乙巳');
    assert.strictEqual(BaZiEngine.calculatePillars('2026-02-10', '12:00', 8).pillars.year.ganZhi, '丙午');
  });

  it('ยามจื้อหลัง 23:00 นับเป็นวันถัดไป', () => {
    const before = BaZiEngine.calculatePillars('2000-01-01', '22:30', 8);
    const after = BaZiEngine.calculatePillars('2000-01-01', '23:30', 8);
    assert.notStrictEqual(before.pillars.day.ganZhi, after.pillars.day.ganZhi);
  });

  it('สารซ่อนในกิ่งดินครบ 12 และตัวแรกเป็นสารหลัก', () => {
    assert.strictEqual(Object.keys(HIDDEN_STEMS).length, 12);
    // ชวด (จื่อ) สารหลักคือกุ่ย (น้ำหยิน index 9)
    assert.strictEqual(HIDDEN_STEMS[0][0], 9);
    // ขาล (อิ๋น) สารหลักคือเจี่ย (ไม้หยาง index 0)
    assert.strictEqual(HIDDEN_STEMS[2][0], 0);
  });

  it('วงจรธาตุก่อเกิด-ข่มถูกต้องตามตำรา', () => {
    assert.strictEqual(ELEMENT_GENERATES.Wood, 'Fire');
    assert.strictEqual(ELEMENT_GENERATES.Water, 'Wood');
    assert.strictEqual(ELEMENT_CONTROLS.Wood, 'Earth');
    assert.strictEqual(ELEMENT_CONTROLS.Metal, 'Wood');
  });

  it('ผังเต็มมีวิเคราะห์แข็ง-อ่อน ธาตุที่ควรเสริม และสิบเทพ', () => {
    const chart = BaZiEngine.calculatePillars('1996-08-26', '09:30', 7);
    assert.ok(typeof chart.strength.isStrong === 'boolean');
    assert.ok(chart.strength.plainTh.length > 40, 'คำอธิบายแข็งอ่อนต้องเป็นภาษาชาวบ้าน');
    assert.ok(chart.favourableElements.length >= 2);
    assert.ok(chart.favourableColorsTh.length >= 1);
    assert.strictEqual(chart.tenGods.length, 4);
    const dayGod = chart.tenGods.find(g => g.pillarTh === 'เสาวัน');
    assert.strictEqual(dayGod.godKey, null, 'เสาวันคือตัวเอง ไม่มีสิบเทพ');
  });

  it('ไม่ทราบเวลาเกิด: ไม่มีเสายาม และบอกเหตุผลตรง ๆ', () => {
    const chart = BaZiEngine.calculatePillars('1996-08-26', null, 7);
    assert.strictEqual(chart.pillars.hour, null);
    assert.strictEqual(chart.confidence.hasExactTime, false);
    assert.ok(chart.confidence.noteTh.includes('ไม่ทราบเวลาเกิด'));
  });

  it('ต้าอวิ้น: ทิศทางตามเพศ+ขั้วปี และอายุเริ่มจากสารทจริง', () => {
    const chart = BaZiEngine.calculatePillars('1996-08-26', '09:30', 7);
    const male = BaZiEngine.calculateLuckPillars(chart, 'yang', 4);
    const female = BaZiEngine.calculateLuckPillars(chart, 'yin', 4);
    // ปี 丙 เป็นหยาง: ชายเดินหน้า หญิงถอยหลัง — เสาแรกต้องต่างกัน
    assert.notStrictEqual(male[0].ganZhi, female[0].ganZhi);
    assert.ok(male.startAge.years >= 0 && male.startAge.years <= 10);
    assert.ok(male.startNoteTh.includes('หารด้วย 3'));
    male.forEach(l => {
      assert.ok(l.god.nameTh, 'ทุกรอบต้องมีสิบเทพ');
      assert.ok(l.verdictTh.length > 10);
    });
  });

  it('สิบเทพครบ 10 ตัว พร้อมคำอธิบายชีวิตจริง', () => {
    assert.strictEqual(Object.keys(TEN_GODS).length, 10);
    Object.values(TEN_GODS).forEach(god => {
      assert.ok(god.nameTh && god.domainTh && god.meaningTh && god.lifeTh);
    });
  });

  it('ธาตุทั้งห้ามีอาชีพและสีแนะนำครบ', () => {
    assert.strictEqual(Object.keys(FIVE_ELEMENTS).length, 5);
    Object.values(FIVE_ELEMENTS).forEach(el => {
      assert.ok(el.nameTh && el.careerTh && el.colorTh && el.lifeTh);
    });
  });

  console.log('\n--- SECTION 15: ปีนักษัตรและปีชง ---');

  it('ปีชง 2569 ตรงประกาศทุกสำนัก: ชงตรง=ชวด คัก=มะเมีย เฮ้ง=เถาะ ผั่ว=ระกา', () => {
    const clash = ChineseZodiacEngine.getClashYears(2026);
    assert.strictEqual(clash.yearBranch.nameTh, 'มะเมีย');
    assert.strictEqual(clash.direct.branch.nameTh, 'ชวด');
    assert.strictEqual(clash.kak.branch.nameTh, 'มะเมีย');
    assert.strictEqual(clash.heng.branch.nameTh, 'เถาะ');
    assert.strictEqual(clash.pua.branch.nameTh, 'ระกา');
  });

  it('ปีนักษัตรยึดลี่ชุน: เกิด 15 ม.ค. 1996 เป็นปีกุน ไม่ใช่ชวด', () => {
    const zodiac = ChineseZodiacEngine.getZodiac('1996-01-15', '09:30', 7);
    assert.strictEqual(zodiac.nameTh, 'กุน');
    assert.strictEqual(zodiac.bornBeforeLiChun, true);
    assert.ok(zodiac.noteTh.includes('ลี่ชุน'));
    const normal = ChineseZodiacEngine.getZodiac('1996-08-26', '09:30', 7);
    assert.strictEqual(normal.nameTh, 'ชวด');
    assert.strictEqual(normal.buddhistYear, 2539);
  });

  it('checkChong ตรวจคนปีชวดในปี 2026 ว่าชงตรง', () => {
    const result = ChineseZodiacEngine.checkChong('1996-08-26', '09:30', 2026, 7);
    assert.strictEqual(result.isChong, true);
    assert.strictEqual(result.matched[0].type, 'direct');
    assert.ok(result.adviceTh.includes('ค้ำประกัน'), 'คำแนะนำต้องใช้ได้จริง');
    // คนปีมะโรงไม่ชงปี 2026
    const free = ChineseZodiacEngine.checkChong('1988-06-15', '09:30', 2026, 7);
    assert.strictEqual(free.isChong, false);
  });

  it('โปรไฟล์นักษัตรครบ 12 ปี พร้อมจุดแข็ง อาชีพ ความรัก', () => {
    assert.strictEqual(Object.keys(ZODIAC_PROFILES).length, 12);
    Object.values(ZODIAC_PROFILES).forEach(profile => {
      assert.ok(profile.strengthTh && profile.cautionTh && profile.careerTh && profile.loveTh);
    });
    assert.ok(CHONG_REMEDIES.length >= 5);
  });

  console.log('\n--- SECTION 16: โหราศาสตร์ไทย (ธาตุเจ้าเรือน + ภพ 12) ---');

  it('ธาตุเจ้าเรือนตามเดือนเกิดตรงตำราแพทย์แผนไทย', () => {
    assert.strictEqual(ThaiAstrologyEngine.getBodyElement('1990-01-15').id, 'fire');
    assert.strictEqual(ThaiAstrologyEngine.getBodyElement('1990-04-15').id, 'wind');
    assert.strictEqual(ThaiAstrologyEngine.getBodyElement('1990-07-15').id, 'water');
    assert.strictEqual(ThaiAstrologyEngine.getBodyElement('1990-10-15').id, 'earth');
    assert.strictEqual(ThaiAstrologyEngine.getBodyElement('1990-12-31').id, 'earth');
    Object.values(THAI_BODY_ELEMENTS).forEach(el => {
      assert.ok(el.personalityTh && el.healthTh && el.foodTh && el.balanceTh);
    });
  });

  it('ภพ 12 ครบและเริ่มจากลัคนา', () => {
    assert.strictEqual(THAI_HOUSES.length, 12);
    const houses = ThaiAstrologyEngine.calculateHouses('1996-08-26', '09:30', 13.7563, 100.5018);
    assert.strictEqual(houses.available, true);
    assert.strictEqual(houses.houses[0].sign.id, houses.ascendant.id, 'ภพ 1 ต้องเป็นราศีลัคนา');
    assert.strictEqual(houses.byNumber[7].nameTh, 'ปัตนิ');
    assert.strictEqual(houses.byNumber[10].nameTh, 'กัมมะ');
    // ภพต้องเรียงต่อกันตามราศี
    const first = houses.houses[0].sign.startDeg;
    const second = houses.houses[1].sign.startDeg;
    assert.strictEqual((second - first + 360) % 360, 30);
  });

  it('ไม่ทราบเวลาเกิด: ภพ 12 ต้องไม่เดา และบอกเหตุผล', () => {
    const houses = ThaiAstrologyEngine.calculateHouses('1996-08-26', null, 13.7563, 100.5018);
    assert.strictEqual(houses.available, false);
    assert.ok(houses.reasonTh.includes('ไม่เดา') || houses.reasonTh.includes('ไม่ทราบเวลา'));
  });

  it('ดาวเจ้าเรือนครบ 12 ราศี และ analyze อธิบายความต่างราศีไทย-สากล', () => {
    assert.strictEqual(Object.keys(THAI_SIGN_RULERS).length, 12);
    const result = ThaiAstrologyEngine.analyze({ birthDate: '1996-08-26', birthTime: '09:30', lat: 13.7563, lon: 100.5018 });
    assert.ok(result.bodyElement);
    assert.ok(result.thaiSunSignNameTh);
    assert.ok(result.signDiffersNoteTh.length > 20);
  });

  console.log('\n--- SECTION 17: ดวงสมพงศ์ / เนื้อคู่ ---');

  it('กฎสามฮะครบ 4 กลุ่ม กลุ่มละ 3 และไม่ซ้ำกัน', () => {
    assert.strictEqual(SAM_HAP_GROUPS.length, 4);
    const all = SAM_HAP_GROUPS.flatMap(g => g.members);
    assert.strictEqual(new Set(all).size, 12);
    // สมาชิกในกลุ่มห่างกัน 4 ตำแหน่งเสมอ
    SAM_HAP_GROUPS.forEach(g => {
      const [a, b, c] = g.members;
      assert.strictEqual((b - a) % 12, 4);
      assert.strictEqual((c - b) % 12, 4);
    });
  });

  it('ลิ่วฮะและไห่มีอย่างละ 6 คู่ครบทุกนักษัตร', () => {
    assert.strictEqual(LIU_HAP_PAIRS.length, 6);
    assert.strictEqual(HAI_PAIRS.length, 6);
    assert.strictEqual(new Set(LIU_HAP_PAIRS.flat()).size, 12);
    assert.strictEqual(new Set(HAI_PAIRS.flat()).size, 12);
  });

  it('ความสัมพันธ์นักษัตรตรงตำรา: ชง/สามฮะ/ลิ่วฮะ/ไห่', () => {
    assert.strictEqual(CompatibilityEngine.branchRelation(0, 6).key, 'chong');    // ชวด-มะเมีย
    assert.strictEqual(CompatibilityEngine.branchRelation(0, 4).key, 'samhap');  // ชวด-มะโรง
    assert.strictEqual(CompatibilityEngine.branchRelation(0, 1).key, 'liuhap');  // ชวด-ฉลู
    assert.strictEqual(CompatibilityEngine.branchRelation(0, 7).key, 'hai');     // ชวด-มะแม
    assert.strictEqual(CompatibilityEngine.branchRelation(3, 3).key, 'same');    // เถาะ-เถาะ
    assert.strictEqual(CompatibilityEngine.branchRelation(0, 2).key, 'neutral'); // ชวด-ขาล
  });

  it('เทียบคู่ได้คะแนน 0-100 พร้อมคำตัดสินและคำเตือนที่เป็นธรรม', () => {
    const result = CompatibilityEngine.compare(
      { birthDate: '1996-08-26', nickname: 'เอ' },
      { birthDate: '2000-05-14', nickname: 'บี' }
    );
    assert.ok(result.score >= 0 && result.score <= 100);
    assert.ok(result.headlineTh.includes('เอ') && result.headlineTh.includes('บี'));
    assert.ok(result.adviceTh.includes('สื่อสาร'), 'ต้องเตือนว่าดวงไม่ใช่ทุกอย่าง');
    assert.ok(result.disclaimerTh.length > 20);
  });

  it('findBestMatches ครอบคลุมครบ 12 นักษัตร และสามฮะได้คะแนนสูงสุด', () => {
    const matches = CompatibilityEngine.findBestMatches('1996-08-26', '09:30');
    assert.strictEqual(matches.all.length, 12);
    assert.ok(matches.best.length >= 2, 'ต้องมีคู่สามฮะ/ลิ่วฮะอย่างน้อย 2');
    matches.best.forEach(m => assert.ok(m.score >= 90));
    assert.ok(matches.summaryTh.includes('ปีมะโรง') || matches.summaryTh.includes('ปีวอก'));
  });

  console.log('\n--- SECTION 18: คำอ่าน 5 ด้านของชีวิต (Life Domains) ---');

  it('วิเคราะห์ครบ 5 ด้าน: งาน เงิน รัก สุขภาพ โชค', () => {
    const result = LifeDomainsEngine.analyze({
      birthDate: '1996-08-26', birthTime: '09:30', lat: 13.7563, lon: 100.5018,
      gender: 'yang', name: 'สมชาย', nickname: 'ชาย'
    });
    assert.strictEqual(result.available, true);
    ['career', 'money', 'love', 'health', 'luck'].forEach(key => {
      const domain = result.domains[key];
      assert.ok(domain, `ต้องมีด้าน ${key}`);
      assert.ok(domain.titleTh && domain.subtitleTh && domain.headlineTh);
      assert.ok(domain.score >= 0 && domain.score <= 100);
      assert.ok(domain.sections.length >= 3, `${key} ต้องมีอย่างน้อย 3 หัวข้อ`);
      domain.sections.forEach(section => {
        assert.ok(section.headingTh && section.bodyTh.length > 30, 'เนื้อหาต้องยาวพออ่านรู้เรื่อง');
        assert.ok(section.sourceTh.startsWith('มาจาก:'), 'ทุกหัวข้อต้องบอกที่มา');
      });
      assert.ok(domain.doThisTh.length >= 2, 'ต้องมีสิ่งที่ควรทำ');
      assert.ok(domain.avoidThisTh.length >= 1, 'ต้องมีสิ่งที่ควรเลี่ยง');
    });
  });

  it('ไม่มีวันเกิด: ปฏิเสธพร้อมเหตุผล ไม่เดา', () => {
    const result = LifeDomainsEngine.analyze({ birthDate: null });
    assert.strictEqual(result.available, false);
    assert.ok(result.reasonTh.includes('ไม่ได้') || result.reasonTh.includes('ไม่เดา') || result.reasonTh.includes('จะไม่เดา'));
  });

  it('ไม่ทราบเวลาเกิด: ยังอ่านได้แต่แจ้งข้อจำกัดในด้านที่ต้องใช้ลัคนา', () => {
    const result = LifeDomainsEngine.analyze({ birthDate: '1996-08-26', birthTime: null, name: 'ทดสอบ' });
    assert.strictEqual(result.available, true);
    assert.ok(result.domains.career.needsMoreDataTh, 'ด้านการงานต้องแจ้งว่าใส่เวลาเกิดจะละเอียดขึ้น');
    assert.ok(result.domains.love.needsMoreDataTh, 'ด้านความรักต้องแจ้งเช่นกัน');
  });

  it('เลขมงคลมาจากดาวตำแหน่งดี ทิศมาจากธาตุที่ควรเสริม', () => {
    assert.strictEqual(Object.keys(PLANET_NUMBERS).length, 8);
    assert.strictEqual(Object.keys(ELEMENT_DIRECTIONS).length, 5);
    const result = LifeDomainsEngine.analyze({ birthDate: '1996-08-26', birthTime: '09:30', name: 'ก' });
    const luckSection = result.domains.luck.sections.find(s => s.headingTh.includes('เลขมงคล'));
    assert.ok(luckSection, 'ต้องมีหัวข้อเลขมงคล');
    const badNumber = PLANET_NUMBERS[result.meta.taksa.byId.kalakini.planetId];
    assert.ok(luckSection.bodyTh.includes(String(badNumber)), 'ต้องบอกเลขที่ควรเลี่ยงด้วย');
  });

  it('ข้อความคำอ่านต้องไม่มีศัพท์อังกฤษหลุด (Water/Earth/Wood ดิบ)', () => {
    const result = LifeDomainsEngine.analyze({ birthDate: '1996-08-26', birthTime: '09:30', name: 'ทดสอบ' });
    const allText = Object.values(result.domains)
      .flatMap(d => [d.headlineTh, ...d.sections.map(s => s.bodyTh), ...d.doThisTh, ...d.avoidThisTh])
      .join(' ');
    ['ธาตุWater', 'ธาตุEarth', 'ธาตุWood', 'ธาตุFire', 'ธาตุMetal'].forEach(bad => {
      assert.ok(!allText.includes(bad), `ห้ามมีคำว่า "${bad}" หลุดไปหน้าเว็บ`);
    });
  });

  console.log('\n--- SECTION 19: พจนานุกรมศัพท์ (Glossary) ---');

  it('ทุกคำศัพท์มีครบ 4 ส่วน: คืออะไร/บอกเรื่องอะไร/คำนวณจากไหน/ตัวอย่าง', () => {
    const terms = Object.values(GLOSSARY);
    assert.ok(terms.length >= 20, 'ต้องมีศัพท์อย่างน้อย 20 คำ');
    terms.forEach(term => {
      assert.ok(term.termTh, 'ต้องมีชื่อศัพท์');
      assert.ok(term.whatTh.length > 15, `${term.termTh}: ต้องอธิบายว่าคืออะไร`);
      assert.ok(term.domainTh.length > 10, `${term.termTh}: ต้องบอกว่าเกี่ยวกับเรื่องอะไร`);
      assert.ok(term.howTh.length > 15, `${term.termTh}: ต้องบอกว่าคำนวณจากอะไร`);
      assert.ok(term.exampleTh.length > 15, `${term.termTh}: ต้องมีตัวอย่าง`);
    });
  });

  it('ค้นหาศัพท์ได้ทั้งชื่อไทยและชื่ออังกฤษ', () => {
    assert.ok(explain('lakkhana'));
    assert.strictEqual(explain('ไม่มีคำนี้'), null);
    assert.ok(allTerms().length === Object.keys(GLOSSARY).length);
    assert.ok(searchTerms('ลัคนา').some(t => t.key === 'lakkhana'));
    assert.ok(searchTerms('Life Path').some(t => t.key === 'lifePath'));
    assert.ok(searchTerms('').length === allTerms().length);
  });

  console.log('\n--- SECTION 20: บริการ AI (Oracle Service) ---');

  it('ตัด <think> ออกจากคำตอบโมเดลได้ถูกต้อง', () => {
    const parsed = parseOracleThinking('<think>คิดในใจ</think>คำตอบจริง');
    assert.strictEqual(parsed.answer, 'คำตอบจริง');
    assert.strictEqual(parsed.thinking, 'คิดในใจ');
    const noThink = parseOracleThinking('ตอบตรง ๆ');
    assert.strictEqual(noThink.answer, 'ตอบตรง ๆ');
    assert.strictEqual(noThink.thinking, null);
    const empty = parseOracleThinking(null);
    assert.strictEqual(empty.answer, '');
  });
}
