const RealDate = Date;
let FAKE = null;
class FakeDate extends RealDate {
  constructor(...a) { if (a.length === 0 && FAKE !== null) super(FAKE); else super(...a); }
  static now() { return FAKE !== null ? FAKE : RealDate.now(); }
}
globalThis.Date = FakeDate;
const setNow = (iso) => { FAKE = new RealDate(iso).getTime(); };

const { LifeDomainsEngine } = await import('./js/engines/life-domains.js');
const { BaZiEngine } = await import('./js/engines/bazi.js');

const realAge = (bd, nowIso) => {
  const [y, m, d] = bd.split('-').map(Number);
  const n = new RealDate(nowIso);
  let a = n.getFullYear() - y;
  if (n.getMonth() + 1 < m || (n.getMonth() + 1 === m && n.getDate() < d)) a--;
  return a;
};

const cases = [
  { bd: '1998-12-27', now: '2026-08-28T10:00:00+07:00' },
  { bd: '1998-06-27', now: '2026-08-28T10:00:00+07:00' },
  { bd: '1990-11-15', now: '2026-08-28T10:00:00+07:00' },
  { bd: '2000-10-05', now: '2026-08-28T10:00:00+07:00' },
];

console.log('=== อายุที่ระบบใช้ กับอายุจริง ===');
for (const c of cases) {
  setNow(c.now);
  const a = LifeDomainsEngine.analyze({ name: 'ทดสอบ', birthDate: c.bd, gender: 'male' });
  const luck = a.meta.currentLuck;
  console.log('เกิด', c.bd, '| อายุที่ระบบใช้', a.meta.age, '| อายุจริง', realAge(c.bd, c.now),
    '| ตรงกันไหม', a.meta.age === realAge(c.bd, c.now),
    '| รอบสิบปีที่ระบบเลือก', luck.nameTh, `(อายุ ${luck.ageFrom}-${luck.ageTo})`, luck.isFavourable ? 'หนุนดวง' : 'ไม่หนุน');
}

console.log('\n=== กรณีที่อายุคลาดไปแล้วทำให้เลือกรอบสิบปีคนละรอบ ===');
// หาเคสที่อายุผิดแล้วข้ามขอบรอบสิบปี
for (let y = 1960; y <= 2005; y++) {
  const bd = `${y}-12-20`;
  setNow('2026-08-28T10:00:00+07:00');
  const a = LifeDomainsEngine.analyze({ name: 'ทดสอบ', birthDate: bd, gender: 'male' });
  const ageWrong = a.meta.age;
  const ageRight = realAge(bd, '2026-08-28T10:00:00+07:00');
  if (ageWrong === ageRight) continue;
  const luckList = a.meta.luck;
  const pickWrong = luckList.find(l => ageWrong >= l.ageFrom && ageWrong <= l.ageTo) || luckList[0];
  const pickRight = luckList.find(l => ageRight >= l.ageFrom && ageRight <= l.ageTo) || luckList[0];
  if (pickWrong.order !== pickRight.order) {
    console.log('เกิด', bd, '| ระบบคิดอายุ', ageWrong, 'แต่จริง ๆ', ageRight,
      '| ระบบเลือกรอบ', pickWrong.nameTh, `(${pickWrong.ageFrom}-${pickWrong.ageTo})`, pickWrong.isFavourable ? 'หนุนดวง' : 'ไม่หนุน',
      '| ที่ถูกคือรอบ', pickRight.nameTh, `(${pickRight.ageFrom}-${pickRight.ageTo})`, pickRight.isFavourable ? 'หนุนดวง' : 'ไม่หนุน');
  }
}
