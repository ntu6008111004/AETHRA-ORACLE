/* ชั่วคราว: ยิงเคสขอบใส่ทุกเอนจิน */
import { AstrologyEngine } from './js/engines/astrology.js';
import { BaZiEngine } from './js/engines/bazi.js';
import { NumerologyEngine } from './js/engines/numerology.js';
import { TaksaEngine } from './js/engines/thai-taksa.js';
import { ThaiAstrologyEngine } from './js/engines/thai-astrology.js';
import { ChineseZodiacEngine } from './js/engines/chinese-zodiac.js';
import { CompatibilityEngine } from './js/engines/compatibility.js';
import { LifeDomainsEngine } from './js/engines/life-domains.js';
import { UnifiedReadingEngine } from './js/engines/unified.js';
import { PhoneNumerologyEngine, validatePhone, normalizePhone } from './js/engines/phone-numerology.js';
import { parseThaiBirthDate, parseThaiBirthTime } from './js/core/thai-date-input.js';
import { getLiChun, getBaZiYear } from './js/engines/solar-terms.js';

function scan(obj, path = '$', out = [], seen = new Set()) {
  if (obj === undefined) { out.push(`${path} = undefined`); return out; }
  if (typeof obj === 'number' && !Number.isFinite(obj)) { out.push(`${path} = ${obj}`); return out; }
  if (typeof obj === 'string') {
    if (/undefined|NaN|\[object Object\]|Infinity/.test(obj)) out.push(`${path} = "${obj.slice(0, 200)}"`);
    return out;
  }
  if (obj && typeof obj === 'object') {
    if (seen.has(obj)) return out;
    seen.add(obj);
    if (obj instanceof Date) { if (isNaN(obj.getTime())) out.push(`${path} = Invalid Date`); return out; }
    for (const k of Object.keys(obj)) scan(obj[k], `${path}.${k}`, out, seen);
  }
  return out;
}

const dates = [
  ['29 ก.พ. ปีอธิกสุรทิน', '2000-02-29'],
  ['29 ก.พ. 2539', '1996-02-29'],
  ['1 ม.ค.', '1998-01-01'],
  ['31 ธ.ค.', '1998-12-31'],
  ['3 ก.พ. (ก่อนลี่ชุน)', '1998-02-03'],
  ['4 ก.พ. (ลี่ชุน)', '1998-02-04'],
  ['5 ก.พ. (หลังลี่ชุน)', '1998-02-05'],
  ['ปีเก่ามาก 2480', '1937-06-15'],
  ['เก่าสุด 1906', '1906-01-01'],
  ['เด็กเพิ่งเกิดปีนี้', '2026-08-01'],
  ['วันนี้', '2026-08-28'],
];
const times = [null, '', '00:00', '00:30', '12:00', '17:59', '18:00', '23:00', '23:30', '9:30'];

let problems = 0;
function report(tag, arr) {
  if (arr.length) { problems++; console.log('!! ' + tag); arr.slice(0, 8).forEach(l => console.log('     ' + l)); }
}

console.log('===== A. LifeDomainsEngine.analyze / Unified / engines: วันเกิด x เวลาเกิด =====');
for (const [label, d] of dates) {
  for (const t of times) {
    const tag = `${label} ${d} เวลา=${JSON.stringify(t)}`;
    try {
      const r = LifeDomainsEngine.analyze({ birthDate: d, birthTime: t, name: 'สมชาย ใจดี', gender: 'male' });
      report('LifeDomains ' + tag, scan(r));
    } catch (e) { problems++; console.log('!! CRASH LifeDomains ' + tag + ' -> ' + e.constructor.name + ': ' + e.message); }
    try {
      const u = UnifiedReadingEngine.synthesize({ name: 'สมชาย', birthDate: d, birthTime: t });
      report('Unified ' + tag, scan(u));
    } catch (e) { problems++; console.log('!! CRASH Unified ' + tag + ' -> ' + e.message); }
  }
}

console.log('\n===== B. ทักษา: รอยต่อ 17:59 / 18:00 วันพุธ =====');
for (const d of ['1998-02-04', '2000-03-01', '2026-08-26']) {
  const wd = new Date(d + 'T00:00:00Z').getUTCDay();
  for (const t of ['17:59', '18:00', '23:30', '00:30', null]) {
    const k = TaksaEngine.calculate(d, t);
    console.log(`  ${d} (dow=${wd}) เวลา=${t} -> ${k.weekdayNameTh} ดาว=${k.birthPlanetId} กลางคืน=${k.isWednesdayNight}`);
  }
}

console.log('\n===== C. ยามจื่อข้ามคืน 23:00/23:30/00:00/00:30 =====');
for (const d of ['1998-06-27', '2000-02-29', '1998-12-31']) {
  for (const t of ['22:59', '23:00', '23:30', '00:00', '00:30', '01:00']) {
    const b = BaZiEngine.calculatePillars(d, t);
    console.log(`  ${d} ${t} -> ปี=${b.pillars.year.ganZhi} เดือน=${b.pillars.month.ganZhi} วัน=${b.pillars.day.ganZhi} ยาม=${b.pillars.hour ? b.pillars.hour.ganZhi : 'ไม่มี'}`);
  }
}

console.log('\n===== D. ลี่ชุน: ปีนักษัตร/ปีจีนรอบรอยต่อ =====');
for (const y of [1996, 1998, 2000, 2024, 2026]) {
  const lc = getLiChun(y);
  console.log(`  ลี่ชุน ${y} = ${lc.toISOString()}`);
}
for (const d of ['1998-02-03', '1998-02-04', '1998-02-05', '2000-02-03', '2000-02-04', '2000-02-05']) {
  for (const t of ['00:00', '12:00', '23:59']) {
    const b = BaZiEngine.calculatePillars(d, t);
    const z = ChineseZodiacEngine.getZodiac(d, t);
    console.log(`  ${d} ${t} -> baziYear=${b.baziYear} ปี=${b.pillars.year.ganZhi} นักษัตร=${z.animalTh ?? JSON.stringify(z).slice(0, 120)}`);
  }
}

console.log('\n===== E. ไม่กรอกเวลา / ไม่กรอกสถานที่ =====');
for (const args of [
  { birthDate: '1998-06-27', birthTime: null, lat: undefined, lon: undefined },
  { birthDate: '1998-06-27', birthTime: '09:30', lat: undefined, lon: undefined },
  { birthDate: '1998-06-27', birthTime: '09:30', lat: null, lon: null },
  { birthDate: '1998-06-27', birthTime: '09:30', lat: NaN, lon: NaN },
  { birthDate: '1998-06-27', birthTime: '09:30', lat: 13.75, lon: 100.5 },
]) {
  try {
    const r = ThaiAstrologyEngine.analyze(args);
    console.log(`  ${JSON.stringify(args)} -> ภพ12=${r.houses.available} ลัคนา=${r.houses.ascendantNameTh ?? '-'}`);
    report('ThaiAstro ' + JSON.stringify(args), scan(r));
  } catch (e) { problems++; console.log('!! CRASH ThaiAstro ' + JSON.stringify(args) + ' -> ' + e.message); }
}

console.log('\n===== F. วันเกิดรูปแบบผิด / อนาคต =====');
const badDates = ['', null, undefined, '2541-06-27', '1998-6-27', '27/06/1998', '1998-13-01', '1998-02-30', '9999-01-01', '2030-01-01', 'abcd-ef-gh', '1998-02-29'];
for (const d of badDates) {
  for (const [nm, fn] of [['Taksa', () => TaksaEngine.calculate(d, '09:00')], ['BaZi', () => BaZiEngine.calculatePillars(d, '09:00')], ['Astro', () => AstrologyEngine.calculateChart(d, '09:00')], ['LifeDomains', () => LifeDomainsEngine.analyze({ birthDate: d, birthTime: '09:00', name: 'ก' })]]) {
    try {
      const r = fn();
      const s = scan(r);
      const brief = nm === 'Taksa' ? `${r.weekdayNameTh}/${r.birthPlanetId}` : nm === 'BaZi' ? `${r.baziYear} ${r.pillars.year.ganZhi}${r.pillars.month.ganZhi}${r.pillars.day.ganZhi}` : nm === 'Astro' ? `${r.western.sun.nameTh}` : `available=${r.available}`;
      console.log(`  ${nm}(${JSON.stringify(d)}) -> OK: ${brief}${s.length ? '  [ผิดปกติ: ' + s.slice(0, 3).join(' | ') + ']' : ''}`);
      if (s.length) problems++;
    } catch (e) { console.log(`  ${nm}(${JSON.stringify(d)}) -> โยน ${e.constructor.name}: ${e.message.slice(0, 80)}`); }
  }
}

console.log('\n===== G. parseThaiBirthDate / parseThaiBirthTime =====');
const rawDates = ['29/02/2543', '29/02/2542', '1/1/2541', '31/12/2541', '4/2/2541', '15/6/2480', '1/1/2569', '29 กุมภาพันธ์ 2543', '32/01/2541', '00/01/2541', '1/13/2541', '2541-06-27', 'ก.พ.', '', '๒๙/๐๒/๒๕๔๓', '27/06/41', '1/1/2600', '1/1/1800'];
for (const s of rawDates) {
  const r = parseThaiBirthDate(s, new Date('2026-08-28T00:00:00Z'));
  console.log(`  ${JSON.stringify(s)} -> ${r.ok ? r.isoDate + ' | ' + r.displayTh : 'ไม่ผ่าน: ' + r.errorTh}`);
}
const rawTimes = ['23:00', '00:30', '17:59', '18:00', '9.30', 'สองทุ่ม', 'ตีสาม', 'เที่ยงคืน', 'บ่ายสาม', '25:00', '12:99', '', 'abc', 'สิบสองโมง', 'หกโมงเย็น'];
for (const s of rawTimes) {
  const r = parseThaiBirthTime(s);
  console.log(`  ${JSON.stringify(s)} -> ${r.ok ? r.time : 'ไม่ผ่าน: ' + r.errorTh}`);
}

console.log('\n===== H. เบอร์โทร =====');
const phones = ['0812345678', '081-234-5678', '', null, '08', '081234567', '08123456789', '0812345678901234', 'abcdefghij', '๐๘๑๒๓๔๕๖๗๘', '+66812345678', '0000000000', '081234567๘', '08-1234-5678 ', '##########'];
for (const p of phones) {
  try {
    const v = validatePhone(p);
    const r = PhoneNumerologyEngine.analyze(p);
    const s = scan(r);
    console.log(`  ${JSON.stringify(p)} -> norm=${JSON.stringify(normalizePhone(p))} valid=${v.ok ?? JSON.stringify(v)} analyze.ok=${r.ok} ${r.ok ? 'sum=' + r.sum + ' grade=' + (r.gradeTh ?? r.grade) : 'err=' + (r.errorTh ?? '')}`);
    if (s.length) { problems++; s.slice(0, 5).forEach(l => console.log('     !! ' + l)); }
  } catch (e) { problems++; console.log(`  !! CRASH phone ${JSON.stringify(p)} -> ${e.message}`); }
}

console.log('\n===== I. ชื่อว่าง / ยาวมาก / อีโมจิ =====');
const names = ['', null, undefined, '   ', 'ก', '😀🎉', 'สมชาย😀ใจดี', 'ก'.repeat(5000), 'John Smith', '﷽', '​'];
for (const n of names) {
  try {
    const num = NumerologyEngine.analyze(n, '1998-06-27');
    const k = TaksaEngine.calculate('1998-06-27', '09:00');
    const audit = TaksaEngine.auditName(n, k);
    const label = typeof n === 'string' && n.length > 30 ? `<ยาว ${n.length} ตัว>` : JSON.stringify(n);
    console.log(`  ${label} -> lifePath=${num.lifePath} expr=${num.expression} soul=${num.soulUrge} pers=${num.personality} | กาลกิณี=${audit.hasKalakini} verdictLen=${audit.verdictTh.length}`);
    const s = [...scan(num), ...scan(audit)];
    if (s.length) { problems++; s.slice(0, 5).forEach(l => console.log('     !! ' + l)); }
  } catch (e) { problems++; console.log(`  !! CRASH name -> ${e.message}`); }
}

console.log('\nสรุป: พบจุดผิดปกติ ' + problems + ' จุด');
