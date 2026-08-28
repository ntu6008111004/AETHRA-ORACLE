import { AstrologyEngine } from './js/engines/astrology.js';
import { ThaiAstrologyEngine } from './js/engines/thai-astrology.js';

// ลัคนา: คนเกิดตอนพระอาทิตย์ขึ้น ลัคนาต้องอยู่ราศีเดียวกับอาทิตย์
const cases = [
  ['1990-06-15','06:00'],
  ['1990-06-15','12:00'],
  ['1990-06-15','18:00'],
  ['1990-06-15','00:00'],
  ['2000-03-21','06:10'],
  ['2000-03-21','12:00'],
];
for (const [d,t] of cases) {
  const c = AstrologyEngine.calculateChart(d,t,13.7563,100.5018);
  console.log(d,t,'| อาทิตย์(สายนะ)=',c.western.sun.nameTh, c.western.sun.exactDegree.toFixed(1),
    '| ลัคนา=', c.western.ascendant.nameTh, c.western.ascendant.exactDegree.toFixed(1));
}
