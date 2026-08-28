import { BaZiEngine } from './js/engines/bazi.js';
import { TaksaEngine } from './js/engines/thai-taksa.js';
import { LifeDomainsEngine } from './js/engines/life-domains.js';

console.log('=== เสายาม (hour pillar) เปลี่ยนตามเวลาเกิดจริงไหม ===');
for (const t of ['02:00', '06:00', '10:00', '14:00', '18:00', '22:00']) {
  const b = BaZiEngine.calculatePillars('1990-05-15', t);
  console.log(t, JSON.stringify(b.pillars.hour));
}

console.log('\n=== ทักษา: วันเกิดตามเวลา (พุธกลางคืน = ราหู?) ===');
for (const t of ['00:30', '06:00', '12:00', '18:30', '23:30']) {
  const k = TaksaEngine.calculate('1990-05-16', t); // 16 พ.ค. 1990 = วันพุธ
  console.log('1990-05-16', t, '->', k.weekdayNameTh, '| เดช=', k.byId.dech.planetNameTh, k.byId.dech.colorName, '| กาลกิณี=', k.byId.kalakini.colorName);
}

console.log('\n=== ข้อความในส่วนที่คำนวณจาก "ยาม" ปรากฏหรือไม่ ===');
const r1 = LifeDomainsEngine.analyze({ birthDate: '1990-05-15', birthTime: '02:00', gender: 'male', name: 'ก' });
const r2 = LifeDomainsEngine.analyze({ birthDate: '1990-05-15', birthTime: '22:00', gender: 'male', name: 'ก' });
console.log('02:00 ธาตุประจำตัว/แรง =', r1.meta.bazi.dayMaster.element, r1.meta.bazi.strength.labelTh, JSON.stringify(r1.meta.bazi.elementScores));
console.log('22:00 ธาตุประจำตัว/แรง =', r2.meta.bazi.dayMaster.element, r2.meta.bazi.strength.labelTh, JSON.stringify(r2.meta.bazi.elementScores));
console.log('02:00 จำนวนสิบเทพ =', r1.meta.bazi.tenGods.length, r1.meta.bazi.tenGods.map(g => g.godKey).join(','));
console.log('22:00 จำนวนสิบเทพ =', r2.meta.bazi.tenGods.length, r2.meta.bazi.tenGods.map(g => g.godKey).join(','));

console.log('\n=== ข้อความ needsMoreDataTh ของคนที่ใส่เวลาแล้ว ===');
const r3 = LifeDomainsEngine.analyze({ birthDate: '1990-05-15', birthTime: '10:00', gender: 'male', name: 'ก' });
for (const [k, d] of Object.entries(r3.domains)) console.log(k, '->', d.needsMoreDataTh);
