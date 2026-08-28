// ชั่วคราว: ตรวจว่าผลลัพธ์เปลี่ยนตามวันจริงไหม
const RealDate = Date;
let FAKE = null;
class FakeDate extends RealDate {
  constructor(...args) {
    if (args.length === 0 && FAKE !== null) { super(FAKE); } else { super(...args); }
  }
  static now() { return FAKE !== null ? FAKE : RealDate.now(); }
}
globalThis.Date = FakeDate;
function setNow(iso) { FAKE = new RealDate(iso).getTime(); }

const { LifeDomainsEngine } = await import('./js/engines/life-domains.js');
const { DailyGuidanceEngine } = await import('./js/engines/daily-guidance.js');
const { ChineseZodiacEngine } = await import('./js/engines/chinese-zodiac.js');
const { NumerologyEngine } = await import('./js/engines/numerology.js');
const { AstrologyEngine } = await import('./js/engines/astrology.js');
const { currentDateContext } = await import('./js/services/question-router.js');
const { buildFactSheet, buildResonancePrompt } = await import('./js/services/resonance.js');

const profile = {
  name: 'สมชาย ใจดี', nickname: 'ชาย', birthDate: '1998-06-27', birthTime: '08:30',
  gender: 'male', lat: 13.7563, lon: 100.5018
};

const days = [
  ['วันนี้', '2026-08-28T10:00:00+07:00'],
  ['พรุ่งนี้', '2026-08-29T10:00:00+07:00'],
  ['อีก 7 วัน', '2026-09-04T10:00:00+07:00'],
  ['อีก 30 วัน', '2026-09-27T10:00:00+07:00'],
  ['อีก 180 วัน', '2027-02-24T10:00:00+07:00'],
];

const hash = (s) => {
  let h = 0; const str = typeof s === 'string' ? s : JSON.stringify(s);
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
  return (h >>> 0).toString(16);
};

console.log('===== 1) LifeDomainsEngine.analyze (คนเดิม เปลี่ยนแค่วันของระบบ) =====');
const rows = [];
for (const [label, iso] of days) {
  setNow(iso);
  const a = LifeDomainsEngine.analyze(profile);
  rows.push({
    label, iso: iso.slice(0, 10),
    domainsHash: hash(a.domains),
    scores: JSON.stringify({
      career: a.meta.scores.career.score, money: a.meta.scores.money.score,
      love: a.meta.scores.love.score, health: a.meta.scores.health.score, luck: a.meta.scores.luck.score
    }),
    age: a.meta.age,
    personalYear: a.meta.numerology.personalYear,
    chong: a.meta.chong.headlineTh
  });
}
console.table(rows.map(r => ({ วัน: r.label, วันที่: r.iso, hashคำทำนาย: r.domainsHash, คะแนน: r.scores, อายุ: r.age, เลขปี: r.personalYear })));
rows.forEach(r => console.log(r.label, '->', r.chong));

console.log('\n===== 2) DailyGuidanceEngine.getTodayGuidance =====');
for (const [label, iso] of days) {
  setNow(iso);
  const g = DailyGuidanceEngine.getTodayGuidance();
  console.log(label.padEnd(12), g.dayNameTh, '| เลข', g.luckyNumbers.join(','), '| hash', hash(g.dailyAdvice + g.luckyDirection + g.auspiciousHours));
}
// สัปดาห์เดียวกัน คนละสัปดาห์ ต่างกันไหม
setNow('2026-08-28T10:00:00+07:00');
const g1 = DailyGuidanceEngine.getTodayGuidance();
setNow('2026-09-04T10:00:00+07:00');
const g2 = DailyGuidanceEngine.getTodayGuidance();
setNow('2027-08-27T10:00:00+07:00');
const g3 = DailyGuidanceEngine.getTodayGuidance();
console.log('28 ส.ค. 2026 กับ 4 ก.ย. 2026 (ศุกร์เหมือนกัน) เนื้อหาเหมือนกันไหม:',
  JSON.stringify({ ...g1, formattedDateTh: 0 }) === JSON.stringify({ ...g2, formattedDateTh: 0 }));
console.log('28 ส.ค. 2026 กับ 27 ส.ค. 2027 (ศุกร์เหมือนกัน คนละปี) เหมือนกันไหม:',
  JSON.stringify({ ...g1, formattedDateTh: 0 }) === JSON.stringify({ ...g3, formattedDateTh: 0 }));

console.log('\n===== 3) เรียกสองครั้งติดกันในวินาทีเดียวกัน ต้องได้ผลเท่ากัน =====');
FAKE = null; // ใช้เวลาจริงของเครื่อง
const A = LifeDomainsEngine.analyze(profile);
const B = LifeDomainsEngine.analyze(profile);
console.log('analyze สองครั้งติดกันเท่ากันไหม:', hash(A.domains) === hash(B.domains), hash(A.domains), hash(B.domains));

console.log('\n===== 4) เขตเวลา: toISOString ตัดวันแบบสากล ไม่ใช่เวลาไทย =====');
for (const iso of ['2026-08-28T00:30:00+07:00', '2026-08-28T06:59:00+07:00', '2026-08-28T07:01:00+07:00', '2026-08-28T23:30:00+07:00']) {
  setNow(iso);
  const now = new Date();
  const dateStrUTC = now.toISOString().split('T')[0];          // แบบที่ dashboard.js ใช้
  const localTh = now.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dailyDay = DailyGuidanceEngine.getTodayGuidance(new RealDate(new RealDate(iso).toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))).dayNameTh;
  const ctx = currentDateContext(new RealDate(iso));
  console.log('เวลาไทย', iso, '=> dateStr ที่โชว์บนการ์ดดาว:', dateStrUTC, '| วันไทยจริง:', localTh, '| currentDateContext.isoDate:', ctx.isoDate);
}

console.log('\n===== 5) ผังดาววันนี้ จากวันที่คนละแบบ =====');
setNow('2026-08-28T00:30:00+07:00');
const nowA = new Date();
const chartUTC = AstrologyEngine.calculateChart(nowA.toISOString().split('T')[0]);
const chartLocal = AstrologyEngine.calculateChart('2026-08-28');
console.log('ผังจากวันที่ UTC (' + nowA.toISOString().split('T')[0] + '): ดวงจันทร์ ราศี' + chartUTC.western.moon.nameTh, chartUTC.western.moon.degreeInSign);
console.log('ผังจากวันที่ไทย (2026-08-28): ดวงจันทร์ ราศี' + chartLocal.western.moon.nameTh, chartLocal.western.moon.degreeInSign);

console.log('\n===== 6) currentDateContext / prompt เปลี่ยนตามวันไหม =====');
for (const [label, iso] of days) {
  const c = currentDateContext(new RealDate(iso));
  console.log(label.padEnd(12), c.thaiDateTh, '| ไตรมาส', c.quarter, '| เหลือ', c.monthsLeft, 'เดือน');
}

console.log('\n===== 7) buildResonancePrompt เปลี่ยนตามวันไหม =====');
setNow('2026-08-28T10:00:00+07:00');
const an = LifeDomainsEngine.analyze(profile);
const fs = buildFactSheet(an, profile);
const p1 = buildResonancePrompt(fs, { now: new RealDate('2026-08-28T10:00:00+07:00') });
const p2 = buildResonancePrompt(fs, { now: new RealDate('2026-09-27T10:00:00+07:00') });
console.log('prompt ต่างกันไหมเมื่อเปลี่ยนวัน:', p1 !== p2);
