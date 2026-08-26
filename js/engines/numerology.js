/**
 * AETHRA ORACLE — Numerology Engine
 * Pythagorean & Thai Numerology calculations supporting both English & Thai scripts.
 */

const LATIN_LETTER_VALUES = {
  a: 1, j: 1, s: 1,
  b: 2, k: 2, t: 2,
  c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, r: 9
};

// Thai Alphabet Numerology Table (ศาสตร์พลังเลขศาสตร์ไทย 1-9)
const THAI_LETTER_VALUES = {
  'ก': 1, 'ด': 1, 'ถ': 1, 'ท': 1, 'ภ': 1, 'ฤ': 1, 'ฤๅ': 1, 'ุ': 1, 'ำ': 1, '่': 1,
  'ข': 2, 'ช': 2, 'ง': 2, 'บ': 2, 'ป': 2, 'ู': 2, 'แ': 2, '้': 2,
  'ฆ': 3, 'ฑ': 3, 'ฒ': 3, 'ต': 3, 'เ': 3, '๊': 3,
  'ค': 4, 'ธ': 4, 'ญ': 4, 'ร': 4, 'ษ': 4, 'ะ': 4, 'ิ': 4, 'ั': 4, '็': 4,
  'ฉ': 5, 'ฌ': 5, 'ณ': 5, 'น': 5, 'ม': 5, 'ห': 5, 'ฬ': 5, 'ฮ': 5, 'ึ': 5, 'ฎ': 5,
  'จ': 6, 'ล': 6, 'ว': 6, 'อ': 6, 'ี': 6, 'ไ': 6, 'โ': 6,
  'ซ': 7, 'ศ': 7, 'ส': 7, 'ื': 7, 'ใ': 7,
  'ผ': 8, 'ฝ': 8, 'พ': 8, 'ฟ': 8, 'ย': 8, '๋': 8,
  'ฏ': 9, 'ฐ': 9, '์': 9
};

const LATIN_VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const THAI_VOWELS = new Set(['ะ', 'า', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 'เ', 'แ', 'โ', 'ใ', 'ไ', 'ำ', 'ฤ', 'ฤๅ', 'ั']);

export const LIFE_PATH_MEANINGS_TH = {
  1: { title: "ผู้นำผู้ริเริ่ม", desc: "มีความเป็นผู้นำสูง กล้าคิดกล้าทำ พึ่งพาตนเองได้ดีเยี่ยม ชะตามักได้บุกเบิกสิ่งใหม่" },
  2: { title: "ผู้สร้างความปรองดอง", desc: "จิตใจอ่อนโยน เมตตา เก่งการประสานงาน ปรับตัวเข้ากับทุกคนได้ดี เป็นที่รักของคนรอบข้าง" },
  3: { title: "ผู้เปี่ยมพลังสร้างสรรค์", desc: "มีเสน่ห์ เจรจาเก่ง ร่าเริงเบิกบาน มีหัวคิดศิลปะ นำความสุขและเสียงหัวเราะมาสู่ผู้คน" },
  4: { title: "ผู้สร้างรากฐานมั่นคง", desc: "ละเอียดรอบคอบ ขยันขันแข็ง ซื่อสัตย์ ไว้วางใจได้ สร้างความสำเร็จด้วยความเพียรพยายาม" },
  5: { title: "นักผจญภัยรักอิสระ", desc: "ปรับตัวไว รักการเรียนรู้สิ่งใหม่ เดินทางบ่อย มีไหวพริบยอดเยี่ยม ไม่ชอบความจำเจ" },
  6: { title: "ผู้อารีและอบอุ่น", desc: "รักครอบครัว ชอบช่วยเหลือผู้อื่น มีความรับผิดชอบสูง สร้างความสุขและความอบอุ่นในบ้าน" },
  7: { title: "นักปราชญ์ผู้แสวงหาปัญญา", desc: "ช่างสังเกต สุขุม รักความสงบ มีลางสังหรณ์แม่นยำ ชอบค้นหาความจริงและสัจธรรม" },
  8: { title: "ผู้บริหารและนักจัดการ", desc: "มีวิสัยทัศน์กว้างไกล เก่งการเงินและการค้า มีบารมีดึงดูดความสำเร็จและความมั่งคั่ง" },
  9: { title: "ผู้มีเมตตาต่อโลก", desc: "จิตใจกว้างขวาง ชอบทำบุญช่วยเหลือสังคม มีอุดมการณ์ เสียสละเพื่อส่วนรวม" },
  11: { title: "ครูผู้ชี้ทางสว่าง (Master 11)", desc: "มีสัญชาตญาณหยั่งรู้สูง นำพาแสงสว่างและแรงบันดาลใจอันยิ่งใหญ่มาสู่ผู้อื่น" },
  22: { title: "มหาผู้สร้าง (Master 22)", desc: "สามารถแปรเปลี่ยนความฝันอันยิ่งใหญ่ให้กลายเป็นความจริงที่จับต้องได้อย่างมั่นคง" },
  33: { title: "ปรมาจารย์ผู้เยียวยา (Master 33)", desc: "เปี่ยมด้วยพลังความรักสากล ความเมตตาขั้นสูงสุด และการชี้นำจิตวิญญาณ" }
};

export class NumerologyEngine {
  static reduceNumber(num, preserveMaster = true) {
    if (!Number.isFinite(num) || num <= 0) return 1;
    let current = num;
    while (current > 9) {
      if (preserveMaster && (current === 11 || current === 22 || current === 33)) {
        return current;
      }
      current = String(current)
        .split('')
        .reduce((sum, d) => sum + (parseInt(d, 10) || 0), 0);
    }
    return current || 1;
  }

  static calculateLifePath(birthDateStr) {
    if (!birthDateStr || typeof birthDateStr !== 'string') return 1;
    const parts = birthDateStr.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return 1;
    const [year, month, day] = parts;
    const rYear = this.reduceNumber(year);
    const rMonth = this.reduceNumber(month);
    const rDay = this.reduceNumber(day);
    return this.reduceNumber(rYear + rMonth + rDay);
  }

  static getCharValue(char) {
    const lower = char.toLowerCase();
    if (LATIN_LETTER_VALUES[lower]) return LATIN_LETTER_VALUES[lower];
    if (THAI_LETTER_VALUES[char]) return THAI_LETTER_VALUES[char];
    return 0;
  }

  static isVowel(char) {
    const lower = char.toLowerCase();
    return LATIN_VOWELS.has(lower) || THAI_VOWELS.has(char);
  }

  static calculateExpression(fullName) {
    if (!fullName || typeof fullName !== 'string') return 1;
    const chars = fullName.trim().split('');
    const total = chars.reduce((sum, c) => sum + this.getCharValue(c), 0);
    return this.reduceNumber(total || 1);
  }

  static calculateSoulUrge(fullName) {
    if (!fullName || typeof fullName !== 'string') return 1;
    const chars = fullName.trim().split('');
    const total = chars
      .filter(c => this.isVowel(c))
      .reduce((sum, c) => sum + this.getCharValue(c), 0);
    return this.reduceNumber(total || 1);
  }

  static calculatePersonality(fullName) {
    if (!fullName || typeof fullName !== 'string') return 1;
    const chars = fullName.trim().split('');
    const total = chars
      .filter(c => !this.isVowel(c) && this.getCharValue(c) > 0)
      .reduce((sum, c) => sum + this.getCharValue(c), 0);
    return this.reduceNumber(total || 1);
  }

  static calculatePersonalYear(birthDateStr, targetYear = new Date().getFullYear()) {
    if (!birthDateStr || typeof birthDateStr !== 'string') return 1;
    const parts = birthDateStr.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return 1;
    const [, month, day] = parts;
    const rMonth = this.reduceNumber(month);
    const rDay = this.reduceNumber(day);
    const rYear = this.reduceNumber(targetYear);
    return this.reduceNumber(rMonth + rDay + rYear, false);
  }

  static analyze(name, birthDateStr) {
    const lifePath = this.calculateLifePath(birthDateStr);
    const expression = this.calculateExpression(name);
    const soulUrge = this.calculateSoulUrge(name);
    const personality = this.calculatePersonality(name);
    const personalYear = this.calculatePersonalYear(birthDateStr);
    const meaningTh = LIFE_PATH_MEANINGS_TH[lifePath] || LIFE_PATH_MEANINGS_TH[1];

    return {
      lifePath,
      expression,
      soulUrge,
      personality,
      personalYear,
      meaningTh,
      nameCalculationSupported: true
    };
  }
}
