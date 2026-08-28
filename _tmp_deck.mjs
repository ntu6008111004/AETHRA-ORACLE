import './_tmp_dom.mjs';
import { TarotEngine } from './js/engines/tarot.js';
import { IChingEngine, HEXAGRAMS } from './js/engines/iching.js';
import { elementWithMeaningTh } from './js/core/element-names.js';

const deck = TarotEngine.getFullDeck();
const badTh = deck.filter(c => /[A-Za-z]/.test(c.nameTh));
console.log('ไพ่ทั้งหมด', deck.length, '| nameTh มีอังกฤษปน:', badTh.length);
console.log(badTh.slice(0,12).map(c=>'  ' + c.nameTh).join('\n'));
console.log('...');
// ธาตุที่แสดงบนหน้าไพ่
const els = [...new Set(deck.map(c=>c.element))];
console.log('ค่า element ที่มีในสำรับ:', JSON.stringify(els));
els.forEach(e=>console.log('  elementWithMeaningTh(' + e + ') =', elementWithMeaningTh(e)));
// meaningTh มีอังกฤษไหม
const badMeaning = deck.filter(c => /[A-Za-z]/.test(c.meaningTh||''));
console.log('meaningTh มีอังกฤษ:', badMeaning.length, badMeaning.slice(0,5).map(c=>c.nameTh+' => '+c.meaningTh.slice(0,90)));

// I Ching
const hexBad = HEXAGRAMS.filter(h=>/[A-Za-z]/.test(h.nameTh||''));
console.log('\nอี้จิง: ก๊กที่ nameTh มีอังกฤษ:', hexBad.length);
console.log('ตัวอย่าง hexagram[0]:', JSON.stringify({n:HEXAGRAMS[0].number, th:HEXAGRAMS[0].nameTh, en:HEXAGRAMS[0].nameEn, img:HEXAGRAMS[0].imageTh}));
const noEn = HEXAGRAMS.filter(h=>!h.nameEn).length;
console.log('ก๊กที่ไม่มี nameEn:', noEn);
