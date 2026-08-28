const RealDate = Date;
let FAKE = new RealDate('2026-08-28T10:00:00+07:00').getTime();
class FakeDate extends RealDate {
  constructor(...a) { if (a.length === 0) super(FAKE); else super(...a); }
  static now() { return FAKE; }
}
globalThis.Date = FakeDate;

const { LifeDomainsEngine } = await import('./js/engines/life-domains.js');

const NOW = new RealDate('2026-08-28T10:00:00+07:00');
const realAge = (bd) => {
  const [y, m, d] = bd.split('-').map(Number);
  let a = NOW.getFullYear() - y;
  if (NOW.getMonth() + 1 < m || (NOW.getMonth() + 1 === m && NOW.getDate() < d)) a--;
  return a;
};

let flipped = 0, favFlipped = 0, checked = 0;
const examples = [];
for (let y = 1955; y <= 2008; y++) {
  for (const md of ['09-01', '09-15', '10-10', '11-11', '12-31', '08-29']) {
    const bd = `${y}-${md}`;
    checked++;
    const a = LifeDomainsEngine.analyze({ name: 'ทดสอบ', birthDate: bd, gender: 'male' });
    const wrong = a.meta.age, right = realAge(bd);
    if (wrong === right) continue;
    const L = a.meta.luck;
    const pw = L.find(l => wrong >= l.ageFrom && wrong <= l.ageTo) || L[0];
    const pr = L.find(l => right >= l.ageFrom && right <= l.ageTo) || L[0];
    if (pw.order !== pr.order) {
      flipped++;
      if (pw.isFavourable !== pr.isFavourable) {
        favFlipped++;
        if (examples.length < 6) examples.push({ bd, wrong, right, pw, pr });
      }
    }
  }
}
console.log('ตรวจทั้งหมด', checked, 'เคส | อายุคลาดแล้วเลือกรอบสิบปีผิดรอบ', flipped, 'เคส | ในนั้นคำตัดสินหนุน/ไม่หนุนกลับด้าน', favFlipped, 'เคส');
for (const e of examples) {
  console.log('  เกิด', e.bd, '| ระบบคิดอายุ', e.wrong, 'ทั้งที่จริง', e.right,
    '=> ระบบใช้รอบ', e.pw.nameTh, `(อายุ ${e.pw.ageFrom}-${e.pw.ageTo})`, e.pw.isFavourable ? 'หนุนดวง' : 'ไม่หนุน',
    '| ที่ถูกคือ', e.pr.nameTh, `(อายุ ${e.pr.ageFrom}-${e.pr.ageTo})`, e.pr.isFavourable ? 'หนุนดวง' : 'ไม่หนุน');
}

// ดูข้อความจริงที่ผู้ใช้เห็นในเคสหนึ่ง
if (examples.length) {
  const e = examples[0];
  const a = LifeDomainsEngine.analyze({ name: 'ทดสอบ', birthDate: e.bd, gender: 'male' });
  console.log('\nข้อความที่ผู้ใช้เห็นจริงในเคสเกิด', e.bd, ':');
  console.log('  meta.age =', a.meta.age, '(หน้าเว็บเขียนว่า "อายุประมาณ ' + a.meta.age + ' ปี")');
  console.log('  รอบโชคที่ระบบเลือก =', a.meta.currentLuck.nameTh, '->', a.meta.currentLuck.verdictTh);
}
