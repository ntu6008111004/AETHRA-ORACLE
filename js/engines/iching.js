/**
 * AETHRA ORACLE — I Ching (Book of Changes) Engine
 * 64 Hexagrams, Trigrams, and 3-Bronze-Coin divination method.
 */

export const TRIGRAMS = {
  '111': { nameEn: 'Heaven', nameTh: 'ฟ้า (เฉียน)', symbol: '☰', nature: 'Creative, Strong' },
  '000': { nameEn: 'Earth', nameTh: 'ดิน (คุน)', symbol: '☷', nature: 'Receptive, Yielding' },
  '010': { nameEn: 'Water', nameTh: 'น้ำ (ข่าน)', symbol: '☵', nature: 'Abysmal, Flowing' },
  '101': { nameEn: 'Fire', nameTh: 'ไฟ (หลี่)', symbol: '☲', nature: 'Clarity, Radiance' },
  '100': { nameEn: 'Thunder', nameTh: 'ฟ้าร้อง (เจิ้น)', symbol: '☳', nature: 'Arousing, Initiative' },
  '001': { nameEn: 'Mountain', nameTh: 'ภูเขา (เกิน)', symbol: '☶', nature: 'Stillness, Resting' },
  '011': { nameEn: 'Wind', nameTh: 'ลม (ซวิ่น)', symbol: '☴', nature: 'Gentle, Penetrating' },
  '110': { nameEn: 'Lake', nameTh: 'บึง (ตุ้ย)', symbol: '☱', nature: 'Joyful, Serene' }
};

const HEXAGRAM_NAMES = [
  ['Qian (The Creative)', 'เฉียน (พลังสร้างสรรค์)'],
  ['Kun (The Receptive)', 'คุน (พลังรองรับ)'],
  ['Zhun (Difficulty at the Beginning)', 'จุน (ความยากแรกเริ่ม)'],
  ['Meng (Youthful Folly)', 'เหมิง (ความเยาว์วัย)'],
  ['Xu (Waiting)', 'ซวี่ (การรอคอย)'],
  ['Song (Conflict)', 'ซ่ง (ความขัดแย้ง)'],
  ['Shi (The Army)', 'ซือ (กองทัพ)'],
  ['Bi (Holding Together)', 'ปี่ (การรวมกัน)'],
  ['Xiao Chu (Small Taming)', 'เสี่ยวชู่ (เหนี่ยวรั้งเล็กน้อย)'],
  ['Lu (Treading)', 'หลี่ (การย่างก้าว)'],
  ['Tai (Peace)', 'ไท่ (สันติสุข)'],
  ['Pi (Standstill)', 'ผี่ (การชะงักงัน)'],
  ['Tong Ren (Fellowship)', 'ถงเหริน (มิตรภาพ)'],
  ['Da You (Great Possession)', 'ต้าโหย่ว (ครอบครองยิ่งใหญ่)'],
  ['Qian (Modesty)', 'เชียน (ความถ่อมตน)'],
  ['Yu (Enthusiasm)', 'อวี้ (ความกระตือรือร้น)'],
  ['Sui (Following)', 'สุย (การติดตาม)'],
  ['Gu (Work on the Decayed)', 'กู่ (แก้ไขสิ่งเสื่อม)'],
  ['Lin (Approach)', 'หลิน (การเข้าใกล้)'],
  ['Guan (Contemplation)', 'กวน (การพิจารณา)'],
  ['Shi He (Biting Through)', 'ซือเค่อ (กัดทะลุ)'],
  ['Bi (Grace)', 'ปี้ (ความสง่างาม)'],
  ['Bo (Splitting Apart)', 'ป๋อ (การแตกแยก)'],
  ['Fu (Return)', 'ฟู่ (การกลับคืน)'],
  ['Wu Wang (Innocence)', 'อู๋ว่าง (ความบริสุทธิ์ใจ)'],
  ['Da Chu (Great Taming)', 'ต้าชู่ (เหนี่ยวรั้งยิ่งใหญ่)'],
  ['Yi (Nourishment)', 'อี๋ (การหล่อเลี้ยง)'],
  ['Da Guo (Great Preponderance)', 'ต้ากั้ว (ภาระเกินใหญ่)'],
  ['Kan (The Abysmal Water)', 'ข่าน (ห้วงน้ำลึก)'],
  ['Li (The Clinging Fire)', 'หลี่ (ไฟสว่าง)'],
  ['Xian (Influence)', 'เสียน (อิทธิพล)'],
  ['Heng (Duration)', 'เหิง (ความยั่งยืน)'],
  ['Dun (Retreat)', 'ตุ้น (การถอย)'],
  ['Da Zhuang (Great Power)', 'ต้าจ้วง (พลังยิ่งใหญ่)'],
  ['Jin (Progress)', 'จิ้น (ความก้าวหน้า)'],
  ['Ming Yi (Darkening of the Light)', 'หมิงอี๋ (แสงที่มืดลง)'],
  ['Jia Ren (The Family)', 'เจียเหริน (ครอบครัว)'],
  ['Kui (Opposition)', 'ขุย (ความตรงข้าม)'],
  ['Jian (Obstruction)', 'เจี๋ยน (อุปสรรค)'],
  ['Jie (Deliverance)', 'เจี่ย (การปลดปล่อย)'],
  ['Sun (Decrease)', 'ซุน (การลดลง)'],
  ['Yi (Increase)', 'อี้ (การเพิ่มขึ้น)'],
  ['Guai (Breakthrough)', 'กว้าย (การทะลุผ่าน)'],
  ['Gou (Coming to Meet)', 'โก้ว (การมาพบ)'],
  ['Cui (Gathering Together)', 'ชุ่ย (การชุมนุม)'],
  ['Sheng (Pushing Upward)', 'เซิง (การผลักดันขึ้น)'],
  ['Kun (Oppression)', 'คุ่น (ความกดดัน)'],
  ['Jing (The Well)', 'จิ่ง (บ่อน้ำ)'],
  ['Ge (Revolution)', 'เก๋อ (การปฏิวัติ)'],
  ['Ding (The Cauldron)', 'ติ่ง (กระถาง)'],
  ['Zhen (Arousing Thunder)', 'เจิ้น (ฟ้าร้อง)'],
  ['Gen (Keeping Still)', 'เกิ้น (ความสงบนิ่ง)'],
  ['Jian (Development)', 'เจี้ยน (พัฒนาการ)'],
  ['Gui Mei (Marrying Maiden)', 'กุยเม่ย (หญิงสาวแต่งงาน)'],
  ['Feng (Abundance)', 'เฟิง (ความอุดมสมบูรณ์)'],
  ['Lu (The Wanderer)', 'หลวี่ (ผู้พเนจร)'],
  ['Xun (The Gentle Wind)', 'ซวิ่น (ลมอ่อน)'],
  ['Dui (The Joyous Lake)', 'ตุ้ย (ความรื่นรมย์)'],
  ['Huan (Dispersion)', 'ฮ่วน (การกระจาย)'],
  ['Jie (Limitation)', 'เจี๋ย (ข้อจำกัด)'],
  ['Zhong Fu (Inner Truth)', 'จงฝู่ (ความจริงภายใน)'],
  ['Xiao Guo (Small Preponderance)', 'เสี่ยวกั้ว (เกินเล็กน้อย)'],
  ['Ji Ji (After Completion)', 'จี้จี้ (หลังความสำเร็จ)'],
  ['Wei Ji (Before Completion)', 'เว่ยจี้ (ก่อนความสำเร็จ)']
];

const TRIGRAM_ORDER = ['111', '110', '101', '100', '011', '010', '001', '000'];
const KING_WEN_NUMBERS = [
  [1, 10, 13, 25, 44, 6, 33, 12],
  [43, 58, 49, 17, 28, 47, 31, 45],
  [14, 38, 30, 21, 50, 64, 56, 35],
  [34, 54, 55, 51, 32, 40, 62, 16],
  [9, 61, 37, 42, 57, 59, 53, 20],
  [5, 60, 63, 3, 48, 29, 39, 8],
  [26, 41, 22, 27, 18, 4, 52, 23],
  [11, 19, 36, 24, 46, 7, 15, 2]
];

const SPECIAL_READINGS = {
  1: {
    judgementEn: 'Sublime success through perseverance. Pure creative power unfolds through right timing.',
    judgementTh: 'ความสำเร็จเกิดจากความแน่วแน่ พลังสร้างสรรค์ควรเคลื่อนไปตามจังหวะที่เหมาะสม'
  },
  2: {
    judgementEn: 'Receptive devotion brings progress through quiet support and patience.',
    judgementTh: 'ความอ่อนน้อมและการโอบอุ้มนำมาซึ่งความราบรื่น ควรใช้ความอดทนและรองรับสิ่งต่าง อย่างมั่นคง'
  },
  11: {
    judgementEn: 'Heaven and Earth are in communion. Obstruction eases and constructive exchange becomes possible.',
    judgementTh: 'ฟ้าและดินประสานสัมพันธ์ สิ่งติดขัดคลี่คลาย เปิดทางให้ความร่วมมือที่สร้างสรรค์'
  },
  64: {
    judgementEn: 'Completion is near, but the final transition requires care and clear attention.',
    judgementTh: 'ความสำเร็จอยู่ใกล้ การข้ามผ่านขั้นสุดท้ายต้องใช้ความรอบคอบและสติที่ชัดเจน'
  }
};

export const HEXAGRAMS = KING_WEN_NUMBERS.flatMap((row, upperIndex) =>
  row.map((number, lowerIndex) => {
    const upperKey = TRIGRAM_ORDER[upperIndex];
    const lowerKey = TRIGRAM_ORDER[lowerIndex];
    const [nameEn, nameTh] = HEXAGRAM_NAMES[number - 1];
    const special = SPECIAL_READINGS[number];
    return {
      number,
      binary: `${upperKey}${lowerKey}`,
      nameEn,
      nameTh,
      judgementEn: special?.judgementEn || `${nameEn} calls for measured attention to timing, relationships, and the consequences of the next step.`,
      judgementTh: special?.judgementTh || `${nameTh} ชวนให้พิจารณาจังหวะ ความสัมพันธ์ และผลของก้าวต่อไปอย่างมีสติ`,
      imageEn: `${TRIGRAMS[upperKey].nameEn} over ${TRIGRAMS[lowerKey].nameEn}.`,
      imageTh: `${TRIGRAMS[upperKey].nameTh}อยู่เหนือ${TRIGRAMS[lowerKey].nameTh}`
    };
  })
).sort((a, b) => a.number - b.number);

export class IChingEngine {
  // Simulate toss of 3 bronze coins (Heads = 3, Tails = 2)
  // Sum: 6 (Old Yin, Changing), 7 (Young Yang), 8 (Young Yin), 9 (Old Yang, Changing)
  static tossCoins() {
    const c1 = Math.random() < 0.5 ? 2 : 3;
    const c2 = Math.random() < 0.5 ? 2 : 3;
    const c3 = Math.random() < 0.5 ? 2 : 3;
    const sum = c1 + c2 + c3;
    const coins = [c1 === 3 ? 'H' : 'T', c2 === 3 ? 'H' : 'T', c3 === 3 ? 'H' : 'T'];

    let isYang = sum % 2 !== 0; // 7, 9 are Yang; 6, 8 are Yin
    let isChanging = sum === 6 || sum === 9;

    return {
      sum,
      coins,
      isYang,
      isChanging,
      value: isYang ? 1 : 0
    };
  }

  // Cast full 6-line hexagram (lines drawn from bottom to top)
  static castHexagram(providedLines = null) {
    const lines = providedLines || Array.from({ length: 6 }, () => this.tossCoins());
    if (lines.length !== 6 || lines.some(line => typeof line?.isYang !== 'boolean')) {
      throw new TypeError('A hexagram requires exactly six valid lines.');
    }

    // Lines are cast bottom-to-top; canonical signatures are stored top-to-bottom.
    const binary = [...lines].reverse().map(l => (l.isYang ? '1' : '0')).join('');
    const matched = HEXAGRAMS.find(h => h.binary === binary);

    if (!matched) throw new Error(`Missing deterministic hexagram mapping for ${binary}.`);

    return {
      lines,
      hexagram: matched,
      hasChangingLines: lines.some(l => l.isChanging)
    };
  }
}
