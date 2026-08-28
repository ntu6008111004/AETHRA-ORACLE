import { LifeDomainsEngine } from './js/engines/life-domains.js';
import { BY_DAY_MASTER, BY_LIFE_PATH, BY_PERSONAL_YEAR, BY_BODY_ELEMENT } from './js/data/domain-facets.js';
import { TAKSA_DETAIL_TH } from './js/data/taksa-detail.js';

// ---------- 1) หาแถวซ้ำในฐานข้อมูลคำทำนาย ----------
function dupRows(name, table) {
  const seen = new Map();
  for (const [k, row] of Object.entries(table)) {
    for (const [field, text] of Object.entries(row)) {
      if (typeof text !== 'string') continue;
      const key = field + '||' + text.trim();
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push(k);
    }
  }
  for (const [key, keys] of seen) {
    if (keys.length > 1) {
      console.log(`[ซ้ำ] ${name} ช่อง "${key.split('||')[0]}" ใช้ข้อความเดียวกันที่คีย์: ${keys.join(', ')}`);
      console.log('      ข้อความ: ' + key.split('||')[1].slice(0, 90));
    }
  }
}
console.log('=== 1) ตรวจข้อความซ้ำภายในฐานข้อมูล ===');
dupRows('BY_DAY_MASTER', BY_DAY_MASTER);
dupRows('BY_LIFE_PATH', BY_LIFE_PATH);
dupRows('BY_PERSONAL_YEAR', BY_PERSONAL_YEAR);
dupRows('BY_BODY_ELEMENT', BY_BODY_ELEMENT);
dupRows('TAKSA_DETAIL_TH', TAKSA_DETAIL_TH);
console.log('คีย์ BY_DAY_MASTER =', Object.keys(BY_DAY_MASTER).join(','));
console.log('คีย์ BY_LIFE_PATH =', Object.keys(BY_LIFE_PATH).join(','));
console.log('คีย์ BY_PERSONAL_YEAR =', Object.keys(BY_PERSONAL_YEAR).join(','));
console.log('คีย์ BY_BODY_ELEMENT =', Object.keys(BY_BODY_ELEMENT).join(','));
console.log('จำนวนคีย์ TAKSA_DETAIL_TH =', Object.keys(TAKSA_DETAIL_TH).length);

// ---------- 2) เปลี่ยนทีละตัวแปร ----------
function snap(p) {
  const r = LifeDomainsEngine.analyze(p);
  const out = {};
  for (const [dk, d] of Object.entries(r.domains)) {
    out[dk + '/headline'] = d.headlineTh;
    d.sections.forEach(s => { out[dk + '/' + s.headingTh] = s.bodyTh; });
    (d.doThisTh || []).forEach((t, i) => { out[dk + '/ควรทำ' + i] = t; });
    (d.avoidThisTh || []).forEach((t, i) => { out[dk + '/ควรเลี่ยง' + i] = t; });
  }
  return { out, meta: r.meta };
}
function diff(a, b) {
  const keys = new Set([...Object.keys(a.out), ...Object.keys(b.out)]);
  const changed = [];
  for (const k of keys) if (a.out[k] !== b.out[k]) changed.push(k);
  return changed;
}

console.log('\n=== 2ก) เปลี่ยนเฉพาะเวลาเกิด วันเดียวกัน (1990-05-15) ===');
const base = { birthDate: '1990-05-15', birthTime: '02:00', gender: 'female', name: 'ทดสอบ' };
for (const t of ['06:00', '10:00', '14:00', '18:00', '22:00']) {
  const s1 = snap(base), s2 = snap({ ...base, birthTime: t });
  console.log(`02:00 vs ${t} -> เปลี่ยน ${diff(s1, s2).length} ช่อง | ลัคนา=${s2.meta.thai.houses.available ? s2.meta.thai.houses.byNumber[1].signNameTh : '-'} | เสายาม=${s2.meta.bazi.pillars.hour ? s2.meta.bazi.pillars.hour.stemTh + s2.meta.bazi.pillars.hour.branchTh : '-'}`);
}

console.log('\n=== 2ข) เปลี่ยนเฉพาะเพศ ===');
for (const d of ['1990-05-15', '1985-09-09', '1975-11-30']) {
  const m = snap({ birthDate: d, birthTime: '10:00', gender: 'male', name: 'ก' });
  const f = snap({ birthDate: d, birthTime: '10:00', gender: 'female', name: 'ก' });
  console.log(`${d} ชาย vs หญิง -> เปลี่ยน ${diff(m, f).length} ช่อง : ${diff(m, f).join(' , ')}`);
}

console.log('\n=== 2ค) มีเวลาเกิด vs ไม่มีเวลาเกิด (วันเดียวกัน) ===');
for (const d of ['1990-05-15', '1985-09-09']) {
  const withT = snap({ birthDate: d, birthTime: '10:00', gender: 'male', name: 'ก' });
  const noT = snap({ birthDate: d, birthTime: '', gender: 'male', name: 'ก' });
  console.log(`${d} -> เปลี่ยน ${diff(withT, noT).length} ช่อง`);
  console.log('   ' + diff(withT, noT).join('\n   '));
}

// ---------- 3) ความแข็งอ่อนของธาตุประจำตัว กระจายแค่ไหน ----------
console.log('\n=== 3) การกระจายของ ธาตุประจำตัว-แข็ง/อ่อน ในวันเกิดสุ่ม 2000 วัน ===');
const tally = {};
let strong = 0, total = 0;
const start = Date.UTC(1960, 0, 1);
for (let i = 0; i < 2000; i++) {
  const dt = new Date(start + i * 12 * 86400000);
  const ds = dt.toISOString().slice(0, 10);
  const r = LifeDomainsEngine.analyze({ birthDate: ds, birthTime: '10:00', gender: 'male', name: 'ก' });
  const k = r.meta.bazi.dayMaster.element + (r.meta.bazi.strength.isStrong ? '-แข็ง' : '-อ่อน');
  tally[k] = (tally[k] || 0) + 1;
  if (r.meta.bazi.strength.isStrong) strong++;
  total++;
}
console.log(JSON.stringify(tally, null, 1));
console.log(`แข็ง ${strong} / ${total} = ${(strong / total * 100).toFixed(1)}%`);

// ---------- 4) หน้าอื่นที่ไม่ครบ: ตรวจว่าคีย์ที่ใช้จริงมีในตารางไหม ----------
console.log('\n=== 4) คีย์ที่คำนวณได้แต่ไม่มีในตาราง (จะทำให้หัวข้อหายไปเงียบ ๆ) ===');
const missLP = new Set(), missPY = new Set(), missDM = new Set(), missBE = new Set(), missTk = new Set();
for (let i = 0; i < 2000; i++) {
  const dt = new Date(start + i * 12 * 86400000);
  const ds = dt.toISOString().slice(0, 10);
  const r = LifeDomainsEngine.analyze({ birthDate: ds, birthTime: '10:00', gender: 'male', name: 'ก' });
  const m = r.meta;
  const lp = String(m.numerology.lifePath), py = String(m.numerology.personalYear);
  const dm = m.bazi.dayMaster.element + '-' + (m.bazi.strength.isStrong ? 'strong' : 'weak');
  const be = m.thai.bodyElement && m.thai.bodyElement.id;
  if (!BY_LIFE_PATH[lp]) missLP.add(lp);
  if (!BY_PERSONAL_YEAR[py]) missPY.add(py);
  if (!BY_DAY_MASTER[dm]) missDM.add(dm);
  if (!BY_BODY_ELEMENT[be]) missBE.add(be);
  for (const pos of ['dech', 'si', 'mula', 'montri', 'ayu']) {
    const slot = m.taksa.byId[pos];
    const key = slot.planetId + '-' + pos;
    if (!TAKSA_DETAIL_TH[key]) missTk.add(key);
  }
}
console.log('lifePath ที่ไม่มีในตาราง:', [...missLP].join(',') || 'ไม่มี');
console.log('personalYear ที่ไม่มีในตาราง:', [...missPY].join(',') || 'ไม่มี');
console.log('dayMaster ที่ไม่มีในตาราง:', [...missDM].join(',') || 'ไม่มี');
console.log('bodyElement ที่ไม่มีในตาราง:', [...missBE].join(',') || 'ไม่มี');
console.log('ทักษาที่ไม่มีในตาราง:', [...missTk].sort().join(',') || 'ไม่มี');
