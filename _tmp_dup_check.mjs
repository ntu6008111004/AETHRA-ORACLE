import { LifeDomainsEngine } from './js/engines/life-domains.js';

const profiles = [
  { id: 'P01', birthDate: '1970-01-15', birthTime: '03:20', gender: 'male', name: 'สมชาย' },
  { id: 'P02', birthDate: '1972-05-02', birthTime: '09:45', gender: 'female', name: 'สมหญิง' },
  { id: 'P03', birthDate: '1975-11-30', birthTime: '', gender: 'female', name: 'มาลี' },
  { id: 'P04', birthDate: '1978-03-08', birthTime: '23:10', gender: 'male', name: 'วิชัย' },
  { id: 'P05', birthDate: '1980-07-21', birthTime: '12:00', gender: 'female', name: 'ปราณี' },
  { id: 'P06', birthDate: '1983-02-14', birthTime: '', gender: 'male', name: 'ธนา' },
  { id: 'P07', birthDate: '1985-09-09', birthTime: '06:30', gender: 'female', name: 'ศิริพร' },
  { id: 'P08', birthDate: '1987-12-25', birthTime: '18:05', gender: 'male', name: 'อนุชา' },
  { id: 'P09', birthDate: '1988-06-01', birthTime: '01:15', gender: 'female', name: 'กมล' },
  { id: 'P10', birthDate: '1990-04-17', birthTime: '', gender: 'male', name: 'ณัฐพงษ์' },
  { id: 'P11', birthDate: '1991-08-23', birthTime: '15:40', gender: 'female', name: 'ชุติมา' },
  { id: 'P12', birthDate: '1992-01-03', birthTime: '20:55', gender: 'male', name: 'ภาคิน' },
  { id: 'P13', birthDate: '1993-10-11', birthTime: '', gender: 'female', name: 'อรอนงค์' },
  { id: 'P14', birthDate: '1994-05-19', birthTime: '07:00', gender: 'male', name: 'กิตติ' },
  { id: 'P15', birthDate: '1995-02-28', birthTime: '11:25', gender: 'female', name: 'พรทิพย์' },
  { id: 'P16', birthDate: '1996-07-04', birthTime: '', gender: 'male', name: 'สุรชัย' },
  { id: 'P17', birthDate: '1997-12-31', birthTime: '22:45', gender: 'female', name: 'เบญจมาศ' },
  { id: 'P18', birthDate: '1999-03-22', birthTime: '05:10', gender: 'male', name: 'พิชิต' },
  { id: 'P19', birthDate: '2000-09-30', birthTime: '13:35', gender: 'female', name: 'ณิชา' },
  { id: 'P20', birthDate: '2001-06-06', birthTime: '', gender: 'male', name: 'ต่อศักดิ์' },
  { id: 'P21', birthDate: '2002-11-14', birthTime: '16:20', gender: 'female', name: 'ฟ้าใส' },
  { id: 'P22', birthDate: '2003-08-27', birthTime: '02:05', gender: 'male', name: 'ปรีชา' },
  { id: 'P23', birthDate: '2004-01-29', birthTime: '', gender: 'female', name: 'ดวงใจ' },
  { id: 'P24', birthDate: '2005-04-05', birthTime: '10:50', gender: 'male', name: 'ภูมิ' },
  { id: 'P25', birthDate: '2006-10-18', birthTime: '19:30', gender: 'female', name: 'ปิยะดา' },
  { id: 'P26', birthDate: '2008-02-04', birthTime: '00:30', gender: 'male', name: 'ก้องภพ' },
  { id: 'P27', birthDate: '2010-05-25', birthTime: '', gender: 'female', name: 'แพรวา' },
  { id: 'P28', birthDate: '1968-08-08', birthTime: '08:08', gender: 'female', name: 'สุนีย์' },
  { id: 'P29', birthDate: '1965-03-13', birthTime: '21:00', gender: 'male', name: 'บุญมี' },
  { id: 'P30', birthDate: '2012-12-12', birthTime: '14:14', gender: 'male', name: 'อชิระ' }
];

const results = profiles.map(p => {
  const r = LifeDomainsEngine.analyze(p);
  return { p, r };
});

// สรุปตัวแปรหลักของแต่ละคน
console.log('=== โปรไฟล์และค่าที่คำนวณได้ ===');
for (const { p, r } of results) {
  const m = r.meta;
  console.log([
    p.id, p.birthDate, p.birthTime || '(ไม่ทราบเวลา)', p.gender,
    'ธาตุประจำตัว=' + m.bazi.dayMaster.element + (m.bazi.strength.isStrong ? '-แข็ง' : '-อ่อน'),
    'เลขเส้นทาง=' + m.numerology.lifePath,
    'ปีส่วนตัว=' + m.numerology.personalYear,
    'ธาตุเจ้าเรือน=' + (m.thai.bodyElement && m.thai.bodyElement.id),
    'นักษัตร=' + m.zodiac.nameTh,
    'วันเกิด=' + m.taksa.weekdayNameTh
  ].join(' | '));
}

// เก็บ slot -> {profileId: text}
const slots = new Map();
function put(slot, id, text) {
  if (!text) return;
  if (!slots.has(slot)) slots.set(slot, new Map());
  slots.get(slot).set(id, text);
}

for (const { p, r } of results) {
  for (const [dkey, d] of Object.entries(r.domains)) {
    put(dkey + ' :: headlineTh', p.id, d.headlineTh);
    for (const s of d.sections) put(dkey + ' :: หัวข้อ: ' + s.headingTh, p.id, s.bodyTh);
    (d.doThisTh || []).forEach((t, i) => put(dkey + ' :: ควรทำ[' + i + ']', p.id, t));
    (d.avoidThisTh || []).forEach((t, i) => put(dkey + ' :: ควรเลี่ยง[' + i + ']', p.id, t));
  }
}

console.log('\n=== ความหลากหลายของแต่ละช่องข้อความ (30 คน) ===');
const rows = [];
for (const [slot, m] of slots) {
  const vals = [...m.values()];
  const uniq = new Set(vals);
  rows.push({ slot, n: vals.length, uniq: uniq.size, sample: [...uniq][0] });
}
rows.sort((a, b) => a.uniq - b.uniq || a.slot.localeCompare(b.slot));
for (const r of rows) {
  console.log(`ค่าไม่ซ้ำ ${String(r.uniq).padStart(2)} / ${String(r.n).padStart(2)} คน  ::  ${r.slot}`);
}

// คู่ที่ได้ข้อความทั้งดวงเหมือนกันเป๊ะ
console.log('\n=== เปรียบเทียบรายคู่: ข้อความทั้งชุดเหมือนกันเป๊ะกี่คู่ ===');
function fullText(r) {
  return Object.values(r.domains).map(d =>
    d.headlineTh + '\n' + d.sections.map(s => s.headingTh + '|' + s.bodyTh).join('\n')
    + '\n' + (d.doThisTh || []).join('\n') + '\n' + (d.avoidThisTh || []).join('\n')
  ).join('\n====\n');
}
let identicalPairs = 0;
for (let i = 0; i < results.length; i++) {
  for (let j = i + 1; j < results.length; j++) {
    if (fullText(results[i].r) === fullText(results[j].r)) {
      identicalPairs++;
      console.log('เหมือนกันทั้งชุด: ' + results[i].p.id + ' กับ ' + results[j].p.id);
    }
  }
}
console.log('จำนวนคู่ที่เหมือนกันทั้งชุด = ' + identicalPairs + ' จาก ' + (results.length * (results.length - 1) / 2) + ' คู่');
