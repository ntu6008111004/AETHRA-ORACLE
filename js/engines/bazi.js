/**
 * AETHRA ORACLE — ดวงจีน โป๊ยหยี่สี่เถียว (BaZi / Four Pillars of Destiny)
 * ------------------------------------------------------------------
 * คำนวณตามตำราจีนจริงทุกขั้นตอน ไม่มีการเดา:
 *   - เสาปี   เปลี่ยนที่ "ลี่ชุน" (立春) ไม่ใช่ 1 มกราคม
 *   - เสาเดือน เปลี่ยนที่สารทต้นเดือน (節) ไม่ใช่วันที่ 1 ของเดือน
 *              ก้านฟ้าใช้กฎ "อู่หู่ตุ้น" (五虎遁)
 *   - เสาวัน  นับต่อเนื่องจากปฏิทินหกสิบรอบ อ้างอิง Julian Day
 *              วันเปลี่ยนเวลา 23:00 น. ตามธรรมเนียมยามจื้อ
 *   - เสายาม  ก้านฟ้าใช้กฎ "อู่สู่ตุ้น" (五鼠遁)
 *   - นับธาตุจาก "สารซ่อนในกิ่งดิน" (藏干) ไม่ใช่นับแค่ธาตุผิว
 *   - วิเคราะห์ความแข็งอ่อนของธาตุประจำตัว แล้วหาธาตุที่ควรเสริม (ธาตุที่ควรเสริม)
 */

import {
  getBaZiYear,
  getBaZiMonthBranch,
  toJulianDay,
  findSolarTerm,
  SOLAR_TERMS,
  CHINA_STANDARD_OFFSET_HOURS
} from './solar-terms.js';

/** ก้านฟ้า 10 ตัว (天干) */
export const HEAVENLY_STEMS = [
  { index: 0, pinyin: 'Jia', hanzi: '甲', nameTh: 'เจี่ย', element: 'Wood', elementTh: 'ไม้', polarity: 'Yang', polarityTh: 'หยาง', color: '#2E7D32', imageTh: 'ต้นไม้ใหญ่ ยืนต้นตรง' },
  { index: 1, pinyin: 'Yi', hanzi: '乙', nameTh: 'อี่', element: 'Wood', elementTh: 'ไม้', polarity: 'Yin', polarityTh: 'หยิน', color: '#66BB6A', imageTh: 'เถาวัลย์ ดอกไม้ หญ้าอ่อน' },
  { index: 2, pinyin: 'Bing', hanzi: '丙', nameTh: 'ปิ่ง', element: 'Fire', elementTh: 'ไฟ', polarity: 'Yang', polarityTh: 'หยาง', color: '#C62828', imageTh: 'ดวงอาทิตย์ แสงสว่างกลางวัน' },
  { index: 3, pinyin: 'Ding', hanzi: '丁', nameTh: 'ติง', element: 'Fire', elementTh: 'ไฟ', polarity: 'Yin', polarityTh: 'หยิน', color: '#EF5350', imageTh: 'เปลวเทียน ไฟในเตา' },
  { index: 4, pinyin: 'Wu', hanzi: '戊', nameTh: 'อู้', element: 'Earth', elementTh: 'ดิน', polarity: 'Yang', polarityTh: 'หยาง', color: '#8D6E63', imageTh: 'ภูเขา กำแพงดิน' },
  { index: 5, pinyin: 'Ji', hanzi: '己', nameTh: 'จี่', element: 'Earth', elementTh: 'ดิน', polarity: 'Yin', polarityTh: 'หยิน', color: '#BCAAA4', imageTh: 'ดินเพาะปลูก ทุ่งนา' },
  { index: 6, pinyin: 'Geng', hanzi: '庚', nameTh: 'เกิง', element: 'Metal', elementTh: 'ทอง', polarity: 'Yang', polarityTh: 'หยาง', color: '#90A4AE', imageTh: 'เหล็กดิบ ขวานดาบ' },
  { index: 7, pinyin: 'Xin', hanzi: '辛', nameTh: 'ซิน', element: 'Metal', elementTh: 'ทอง', polarity: 'Yin', polarityTh: 'หยิน', color: '#CFD8DC', imageTh: 'ทองรูปพรรณ เครื่องประดับ' },
  { index: 8, pinyin: 'Ren', hanzi: '壬', nameTh: 'เหริน', element: 'Water', elementTh: 'น้ำ', polarity: 'Yang', polarityTh: 'หยาง', color: '#1565C0', imageTh: 'ทะเล แม่น้ำใหญ่' },
  { index: 9, pinyin: 'Gui', hanzi: '癸', nameTh: 'กุ่ย', element: 'Water', elementTh: 'น้ำ', polarity: 'Yin', polarityTh: 'หยิน', color: '#64B5F6', imageTh: 'น้ำค้าง สายฝน น้ำในบ่อ' }
];

/** กิ่งดิน 12 ตัว (地支) พร้อมปีนักษัตรไทย */
export const EARTHLY_BRANCHES = [
  { index: 0, pinyin: 'Zi', hanzi: '子', nameTh: 'ชวด', animalTh: 'หนู', animalEn: 'Rat', element: 'Water', elementTh: 'น้ำ', polarity: 'Yang', hours: '23:00-00:59', hourNameTh: 'ยามจื้อ' },
  { index: 1, pinyin: 'Chou', hanzi: '丑', nameTh: 'ฉลู', animalTh: 'วัว', animalEn: 'Ox', element: 'Earth', elementTh: 'ดิน', polarity: 'Yin', hours: '01:00-02:59', hourNameTh: 'ยามโฉ่ว' },
  { index: 2, pinyin: 'Yin', hanzi: '寅', nameTh: 'ขาล', animalTh: 'เสือ', animalEn: 'Tiger', element: 'Wood', elementTh: 'ไม้', polarity: 'Yang', hours: '03:00-04:59', hourNameTh: 'ยามอิ๋น' },
  { index: 3, pinyin: 'Mao', hanzi: '卯', nameTh: 'เถาะ', animalTh: 'กระต่าย', animalEn: 'Rabbit', element: 'Wood', elementTh: 'ไม้', polarity: 'Yin', hours: '05:00-06:59', hourNameTh: 'ยามเหมา' },
  { index: 4, pinyin: 'Chen', hanzi: '辰', nameTh: 'มะโรง', animalTh: 'งูใหญ่/มังกร', animalEn: 'Dragon', element: 'Earth', elementTh: 'ดิน', polarity: 'Yang', hours: '07:00-08:59', hourNameTh: 'ยามเฉิน' },
  { index: 5, pinyin: 'Si', hanzi: '巳', nameTh: 'มะเส็ง', animalTh: 'งูเล็ก', animalEn: 'Snake', element: 'Fire', elementTh: 'ไฟ', polarity: 'Yin', hours: '09:00-10:59', hourNameTh: 'ยามซื่อ' },
  { index: 6, pinyin: 'Wu', hanzi: '午', nameTh: 'มะเมีย', animalTh: 'ม้า', animalEn: 'Horse', element: 'Fire', elementTh: 'ไฟ', polarity: 'Yang', hours: '11:00-12:59', hourNameTh: 'ยามอู่' },
  { index: 7, pinyin: 'Wei', hanzi: '未', nameTh: 'มะแม', animalTh: 'แพะ', animalEn: 'Goat', element: 'Earth', elementTh: 'ดิน', polarity: 'Yin', hours: '13:00-14:59', hourNameTh: 'ยามเว่ย' },
  { index: 8, pinyin: 'Shen', hanzi: '申', nameTh: 'วอก', animalTh: 'ลิง', animalEn: 'Monkey', element: 'Metal', elementTh: 'ทอง', polarity: 'Yang', hours: '15:00-16:59', hourNameTh: 'ยามเซิน' },
  { index: 9, pinyin: 'You', hanzi: '酉', nameTh: 'ระกา', animalTh: 'ไก่', animalEn: 'Rooster', element: 'Metal', elementTh: 'ทอง', polarity: 'Yin', hours: '17:00-18:59', hourNameTh: 'ยามโหย่ว' },
  { index: 10, pinyin: 'Xu', hanzi: '戌', nameTh: 'จอ', animalTh: 'หมา', animalEn: 'Dog', element: 'Earth', elementTh: 'ดิน', polarity: 'Yang', hours: '19:00-20:59', hourNameTh: 'ยามซวี' },
  { index: 11, pinyin: 'Hai', hanzi: '亥', nameTh: 'กุน', animalTh: 'หมู', animalEn: 'Pig', element: 'Water', elementTh: 'น้ำ', polarity: 'Yin', hours: '21:00-22:59', hourNameTh: 'ยามไฮ่' }
];

/**
 * สารซ่อนในกิ่งดิน (藏干) — ตัวแรกคือสารหลัก (本氣) น้ำหนักมากสุด
 * ใช้ถ่วงน้ำหนัก 1.0 / 0.5 / 0.3 ตามลำดับ ซึ่งเป็นสัดส่วนที่ตำราส่วนใหญ่ใช้
 */
export const HIDDEN_STEMS = {
  0: [9],
  1: [5, 9, 7],
  2: [0, 2, 4],
  3: [1],
  4: [4, 1, 9],
  5: [2, 6, 4],
  6: [3, 5],
  7: [5, 3, 1],
  8: [6, 8, 4],
  9: [7],
  10: [4, 7, 3],
  11: [8, 0]
};

const HIDDEN_WEIGHTS = [1.0, 0.5, 0.3];

/** ธาตุทั้งห้าพร้อมคำอธิบายภาษาไทยแบบเข้าใจง่าย */
export const FIVE_ELEMENTS = {
  Wood: {
    id: 'Wood', nameTh: 'ไม้', hanzi: '木', color: '#43A047',
    meaningTh: 'การเติบโต การเริ่มต้น ความคิดสร้างสรรค์ และความเมตตา',
    lifeTh: 'คนธาตุไม้มักชอบเรียนรู้ วางแผนอนาคต และอยากให้ทุกอย่างงอกงามขึ้นเรื่อย ๆ',
    careerTh: 'งานสาย การศึกษา สิ่งแวดล้อม สุขภาพ ออกแบบ สื่อสาร งานที่ได้สร้างของใหม่',
    colorTh: 'สีเขียว สีเขียวอ่อน'
  },
  Fire: {
    id: 'Fire', nameTh: 'ไฟ', hanzi: '火', color: '#E53935',
    meaningTh: 'ชื่อเสียง ความสว่าง พลังใจ การแสดงออก และการเป็นที่รู้จัก',
    lifeTh: 'คนธาตุไฟมักมีเสน่ห์ พูดเก่ง กระตือรือร้น แต่ก็ร้อนเร็วเย็นเร็ว',
    careerTh: 'งานสาย การตลาด บันเทิง ขายของ พูดหน้าเวที ครู งานบริการ ความงาม',
    colorTh: 'สีแดง สีส้ม สีชมพู'
  },
  Earth: {
    id: 'Earth', nameTh: 'ดิน', hanzi: '土', color: '#8D6E63',
    meaningTh: 'ความมั่นคง ความน่าเชื่อถือ การโอบอุ้ม และรากฐานที่แน่น',
    lifeTh: 'คนธาตุดินมักหนักแน่น พึ่งพาได้ ซื่อสัตย์ แต่บางทีก็เปลี่ยนแปลงช้า',
    careerTh: 'งานสาย อสังหาฯ ก่อสร้าง เกษตร ธุรการ บริหารคน งานราชการ คลังสินค้า',
    colorTh: 'สีเหลือง สีน้ำตาล สีครีม'
  },
  Metal: {
    id: 'Metal', nameTh: 'ทอง', hanzi: '金', color: '#90A4AE',
    meaningTh: 'ระเบียบวินัย ความเด็ดขาด ความยุติธรรม และคุณค่าที่จับต้องได้',
    lifeTh: 'คนธาตุทองมักตรงไปตรงมา มีหลักการ ตัดสินใจเฉียบ แต่บางทีก็แข็งเกินไป',
    careerTh: 'งานสาย การเงิน กฎหมาย วิศวกรรม การแพทย์ ทหารตำรวจ เครื่องจักร ทอง',
    colorTh: 'สีขาว สีเงิน สีทอง'
  },
  Water: {
    id: 'Water', nameTh: 'น้ำ', hanzi: '水', color: '#1E88E5',
    meaningTh: 'สติปัญญา ความยืดหยุ่น การสื่อสาร การค้า และการปรับตัว',
    lifeTh: 'คนธาตุน้ำมักคิดไว ปรับตัวเก่ง เจรจาดี แต่ใจอาจไม่นิ่งและเปลี่ยนใจง่าย',
    careerTh: 'งานสาย ค้าขาย ท่องเที่ยว ขนส่ง ที่ปรึกษา วิจัย ไอที การทูต',
    colorTh: 'สีดำ สีน้ำเงิน สีเทาเข้ม'
  }
};

/** วงจรธาตุ: ก่อเกิด (生) และ ข่ม (剋) */
export const ELEMENT_GENERATES = { Wood: 'Fire', Fire: 'Earth', Earth: 'Metal', Metal: 'Water', Water: 'Wood' };
export const ELEMENT_CONTROLS = { Wood: 'Earth', Earth: 'Water', Water: 'Fire', Fire: 'Metal', Metal: 'Wood' };
export const ELEMENT_GENERATED_BY = { Fire: 'Wood', Earth: 'Fire', Metal: 'Earth', Water: 'Metal', Wood: 'Water' };
export const ELEMENT_CONTROLLED_BY = { Earth: 'Wood', Water: 'Earth', Fire: 'Water', Metal: 'Fire', Wood: 'Metal' };

/**
 * สิบเทพ — ความสัมพันธ์ระหว่างธาตุประจำตัวกับก้านฟ้าอื่น
 * อธิบายเป็นภาษาไทยว่า "แปลว่าอะไรในชีวิตจริง"
 */
export const TEN_GODS = {
  friend: { nameTh: 'ปี้เจียน (เพื่อนร่วมทาง)', hanzi: '比肩', domainTh: 'ตัวตน เพื่อน หุ้นส่วน', meaningTh: 'พลังของตัวเองและคนที่เท่าเทียมกับเรา หมายถึงเพื่อน พี่น้อง หุ้นส่วน คนที่ยืนข้างเดียวกัน', lifeTh: 'เด่นเรื่องการพึ่งตัวเอง แต่ถ้ามากไปจะเสียเงินให้เพื่อนหรือแบ่งผลประโยชน์บ่อย' },
  rob: { nameTh: 'เจี๋ยไฉ (แย่งทรัพย์)', hanzi: '劫財', domainTh: 'การแข่งขัน คู่แข่ง รายจ่าย', meaningTh: 'คนที่มาแข่งกับเราหรือมาแบ่งทรัพย์เรา ทั้งคู่แข่งทางธุรกิจและคนใกล้ตัวที่ขอยืมเงิน', lifeTh: 'ต้องระวังการค้ำประกัน ให้ยืมเงิน และการลงทุนร่วมกับคนอื่น' },
  eatingGod: { nameTh: 'สือเสิน (เทพผู้เสพสุข)', hanzi: '食神', domainTh: 'ความสุข ความคิดสร้างสรรค์ ลูก', meaningTh: 'พลังที่เราผลิตออกไปอย่างสบายใจ คือความสามารถ งานอดิเรก ศิลปะ อาหาร และลูกหลาน', lifeTh: 'เด่นเรื่องกินดีอยู่ดี มีพรสวรรค์ ทำงานสร้างสรรค์แล้วมีความสุข' },
  hurtingOfficer: { nameTh: 'ซางกวน (ท้าทายอำนาจ)', hanzi: '傷官', domainTh: 'ความสามารถโดดเด่น การแหกกฎ', meaningTh: 'ความเก่งที่อยากแสดงออก ไม่ชอบถูกสั่ง ชอบทำอะไรแหวกแนว', lifeTh: 'เก่งจริงและโดดเด่น แต่ต้องระวังปากและการขัดใจเจ้านายหรือผู้ใหญ่' },
  indirectWealth: { nameTh: 'เพียนไฉ (ทรัพย์ลอย)', hanzi: '偏財', domainTh: 'เงินก้อน โชคลาภ ธุรกิจ', meaningTh: 'เงินที่มาเป็นก้อน ไม่ประจำ เช่น กำไรค้าขาย โบนัส คอมมิชชัน โชคลาภ', lifeTh: 'เหมาะทำธุรกิจหรืองานที่รายได้ผันแปรตามผลงาน มากกว่าเงินเดือนประจำ' },
  directWealth: { nameTh: 'เจิ้งไฉ (ทรัพย์ประจำ)', hanzi: '正財', domainTh: 'เงินเดือน ทรัพย์สิน คู่ครอง (ของชาย)', meaningTh: 'เงินที่มาสม่ำเสมอ เช่น เงินเดือน ค่าเช่า และในดวงผู้ชายหมายถึงภรรยา', lifeTh: 'เด่นเรื่องเก็บเงินอยู่ มีวินัยการเงิน เหมาะงานประจำที่มั่นคง' },
  sevenKillings: { nameTh: 'ชีซา (อำนาจดิบ)', hanzi: '七殺', domainTh: 'แรงกดดัน คู่แข่ง ความท้าทาย', meaningTh: 'แรงกดดันจากภายนอก งานหนัก การแข่งขันดุเดือด และอำนาจแบบเด็ดขาด', lifeTh: 'ถ้าคุมได้จะกลายเป็นผู้นำที่แกร่ง ถ้าคุมไม่ได้จะเครียดและเจอเรื่องกดดันบ่อย' },
  directOfficer: { nameTh: 'เจิ้งกวน (ตำแหน่งหน้าที่)', hanzi: '正官', domainTh: 'หน้าที่การงาน ชื่อเสียง สามี (ของหญิง)', meaningTh: 'ตำแหน่ง กฎระเบียบ ความรับผิดชอบ และในดวงผู้หญิงหมายถึงสามี', lifeTh: 'เด่นเรื่องการงานมั่นคง มีตำแหน่ง เป็นที่ยอมรับ เหมาะงานองค์กรหรือราชการ' },
  indirectResource: { nameTh: 'เพียนอิ้น (ปัญญาเฉพาะทาง)', hanzi: '偏印', domainTh: 'ความรู้เฉพาะทาง สัญชาตญาณ', meaningTh: 'ความรู้แปลก ๆ ทักษะเฉพาะทาง ลางสังหรณ์ และการเรียนรู้ด้วยตัวเอง', lifeTh: 'เหมาะงานที่ต้องใช้ความเชี่ยวชาญลึก งานวิจัย งานศาสตร์เร้นลับ หรืองานเทคนิค' },
  directResource: { nameTh: 'เจิ้งอิ้น (ผู้อุปถัมภ์)', hanzi: '正印', domainTh: 'แม่ ครู ผู้ใหญ่ วุฒิการศึกษา', meaningTh: 'สิ่งที่หล่อเลี้ยงเรา คือแม่ ครูบาอาจารย์ ผู้ใหญ่ที่ช่วยเหลือ และการศึกษา', lifeTh: 'เด่นเรื่องมีคนคอยช่วย เรียนเก่ง ได้วุฒิ ได้ใบรับรอง มีที่พึ่งเสมอ' }
};

/** จับคู่ธาตุ+ขั้ว เพื่อหาว่าเป็นสิบเทพตัวไหนเทียบกับธาตุประจำตัว */
export function resolveTenGod(dayStem, otherStem) {
  const dm = HEAVENLY_STEMS[dayStem];
  const other = HEAVENLY_STEMS[otherStem];
  const samePolarity = dm.polarity === other.polarity;

  if (other.element === dm.element) return samePolarity ? 'friend' : 'rob';
  if (ELEMENT_GENERATES[dm.element] === other.element) return samePolarity ? 'eatingGod' : 'hurtingOfficer';
  if (ELEMENT_CONTROLS[dm.element] === other.element) return samePolarity ? 'indirectWealth' : 'directWealth';
  if (ELEMENT_CONTROLLED_BY[dm.element] === other.element) return samePolarity ? 'sevenKillings' : 'directOfficer';
  return samePolarity ? 'indirectResource' : 'directResource';
}

export class BaZiEngine {
  /** ก้านฟ้าและกิ่งดินของเสาปี จากปีสุริยคติจีน (นับหลังลี่ชุนแล้ว) */
  static getYearPillarIndices(baziYear) {
    return {
      stem: ((baziYear - 4) % 10 + 10) % 10,
      branch: ((baziYear - 4) % 12 + 12) % 12
    };
  }

  /** เสาวันจาก Julian Day — ตรวจแล้วว่า 1 ม.ค. 2000 = อู้อู่ (戊午) */
  static getDayPillarIndices(jdn) {
    return {
      stem: ((jdn + 9) % 10 + 10) % 10,
      branch: ((jdn + 1) % 12 + 12) % 12
    };
  }

  /**
   * คำนวณผังดวงจีนเต็มรูปแบบ
   * @param {string} birthDateStr YYYY-MM-DD
   * @param {string|null} birthTimeStr HH:MM (ถ้าไม่ทราบจะไม่คำนวณเสายาม)
   * @param {number} tzOffsetHours เขตเวลาของสถานที่เกิด (ไทย = 7)
   */
  static calculatePillars(birthDateStr, birthTimeStr = '12:00', tzOffsetHours = 7) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(birthDateStr || ''))) {
      throw new TypeError('ดวงจีนต้องใช้วันเกิดในรูปแบบ YYYY-MM-DD');
    }

    const [year, month, day] = birthDateStr.split('-').map(Number);
    const hasExactTime = /^\d{1,2}:\d{2}$/.test(String(birthTimeStr || ''));
    const [hour, minute] = (hasExactTime ? birthTimeStr : '12:00').split(':').map(Number);

    // เวลาเกิดจริงในระบบ UTC
    const birthUtc = new Date(Date.UTC(year, month - 1, day, hour - tzOffsetHours, minute));

    // 1) เสาปี — ยึดลี่ชุนตามเวลามาตรฐานจีน
    const baziYear = getBaZiYear(birthUtc, CHINA_STANDARD_OFFSET_HOURS);
    const yearIdx = this.getYearPillarIndices(baziYear);

    // 2) เสาเดือน — กิ่งดินจากสารทต้นเดือน, ก้านฟ้าจากกฎอู่หู่ตุ้น (五虎遁)
    const monthTerm = getBaZiMonthBranch(birthUtc, CHINA_STANDARD_OFFSET_HOURS);
    const monthBranchIdx = monthTerm.branchIndex;
    const firstMonthStem = ((yearIdx.stem % 5) * 2 + 2) % 10;
    const monthOffset = ((monthBranchIdx - 2) % 12 + 12) % 12;
    const monthStemIdx = (firstMonthStem + monthOffset) % 10;

    // 3) เสาวัน — ยามจื้อหลัง 23:00 นับเป็นวันถัดไปตามธรรมเนียม
    const dayShift = hasExactTime && hour >= 23 ? 1 : 0;
    const localNoon = new Date(Date.UTC(year, month - 1, day + dayShift, 12));
    const jdn = Math.floor(toJulianDay(localNoon));
    const dayIdx = this.getDayPillarIndices(jdn);

    // 4) เสายาม — ก้านฟ้าจากกฎอู่สู่ตุ้น (五鼠遁)
    const hourBranchIdx = Math.floor((((hour + 1) % 24) + 24) % 24 / 2);
    const ziHourStem = ((dayIdx.stem % 5) * 2) % 10;
    const hourStemIdx = (ziHourStem + hourBranchIdx) % 10;

    const makePillar = (stemIdx, branchIdx, labelTh, meansTh) => ({
      labelTh,
      meansTh,
      stem: HEAVENLY_STEMS[stemIdx],
      branch: EARTHLY_BRANCHES[branchIdx],
      ganZhi: `${HEAVENLY_STEMS[stemIdx].hanzi}${EARTHLY_BRANCHES[branchIdx].hanzi}`,
      nameTh: `${HEAVENLY_STEMS[stemIdx].nameTh}${EARTHLY_BRANCHES[branchIdx].nameTh}`
    });

    const yearPillar = makePillar(yearIdx.stem, yearIdx.branch, 'เสาปี', 'บรรพบุรุษ ต้นทุนชีวิต และวัยเด็ก (0-16 ปี)');
    const monthPillar = makePillar(monthStemIdx, monthBranchIdx, 'เสาเดือน', 'พ่อแม่พี่น้อง หน้าที่การงาน และวัยสร้างตัว (17-32 ปี)');
    const dayPillar = makePillar(dayIdx.stem, dayIdx.branch, 'เสาวัน', 'ตัวคุณเองและคู่ครอง เป็นเสาสำคัญที่สุด (33-48 ปี)');
    const hourPillar = hasExactTime
      ? makePillar(hourStemIdx, hourBranchIdx, 'เสายาม', 'ลูกหลาน บั้นปลายชีวิต และผลงานที่ทิ้งไว้ (49 ปีขึ้นไป)')
      : null;

    const pillars = { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar };
    const activePillars = [yearPillar, monthPillar, dayPillar, hourPillar].filter(Boolean);

    // 5) นับกำลังธาตุจากก้านฟ้า + สารซ่อนในกิ่งดิน
    const elementScores = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
    activePillars.forEach(pillar => {
      elementScores[pillar.stem.element] += 1;
      HIDDEN_STEMS[pillar.branch.index].forEach((stemIndex, position) => {
        elementScores[HEAVENLY_STEMS[stemIndex].element] += HIDDEN_WEIGHTS[position] ?? 0.2;
      });
    });
    Object.keys(elementScores).forEach(key => {
      elementScores[key] = Math.round(elementScores[key] * 100) / 100;
    });

    const dayMaster = dayPillar.stem;
    const totalScore = Object.values(elementScores).reduce((a, b) => a + b, 0);

    // 6) วิเคราะห์ความแข็งอ่อนของธาตุประจำตัว
    // ฝ่ายหนุน = ธาตุเดียวกับเรา + ธาตุที่ก่อเกิดเรา
    // ฝ่ายทอน = ธาตุที่เราก่อ + ธาตุที่เราข่ม + ธาตุที่ข่มเรา
    const supportElements = [dayMaster.element, ELEMENT_GENERATED_BY[dayMaster.element]];
    const supportScore = supportElements.reduce((sum, el) => sum + elementScores[el], 0);
    const supportRatio = totalScore > 0 ? supportScore / totalScore : 0;
    const isStrong = supportRatio >= 0.5;

    // ธาตุที่ควรเสริม (ธาตุที่ควรเสริม) — ถ้าแข็งไปให้ระบาย ถ้าอ่อนไปให้เติม
    const favourableElements = isStrong
      ? [ELEMENT_GENERATES[dayMaster.element], ELEMENT_CONTROLS[dayMaster.element], ELEMENT_CONTROLLED_BY[dayMaster.element]]
      : [dayMaster.element, ELEMENT_GENERATED_BY[dayMaster.element]];
    const unfavourableElements = isStrong
      ? [dayMaster.element, ELEMENT_GENERATED_BY[dayMaster.element]]
      : [ELEMENT_CONTROLS[dayMaster.element], ELEMENT_CONTROLLED_BY[dayMaster.element]];

    const sortedElements = Object.entries(elementScores).sort((a, b) => b[1] - a[1]);
    const dominantElement = sortedElements[0][0];
    const weakestElement = sortedElements[sortedElements.length - 1][0];
    const missingElements = Object.entries(elementScores).filter(([, v]) => v === 0).map(([k]) => k);

    // 7) สิบเทพของแต่ละเสา
    const tenGods = activePillars.map(pillar => {
      const key = pillar.stem.index === dayMaster.index && pillar.labelTh === 'เสาวัน'
        ? null
        : resolveTenGod(dayMaster.index, pillar.stem.index);
      return {
        pillarTh: pillar.labelTh,
        stemTh: pillar.stem.nameTh,
        godKey: key,
        god: key ? TEN_GODS[key] : { nameTh: 'ตัวคุณเอง (ธาตุประจำตัว)', domainTh: 'ธาตุประจำตัว', meaningTh: 'เสานี้คือตัวคุณเอง เป็นจุดอ้างอิงของทั้งดวง', lifeTh: 'ทุกอย่างในดวงจีนอ่านโดยเทียบกับธาตุนี้' }
      };
    });

    return {
      birthDate: birthDateStr,
      birthUtc,
      baziYear,
      monthTermTh: monthTerm.termNameTh,
      pillars,
      dayMaster,
      dayMasterElement: FIVE_ELEMENTS[dayMaster.element],
      elementScores,
      fiveElements: elementScores,
      dominantElement,
      dominantElementTh: FIVE_ELEMENTS[dominantElement].nameTh,
      weakestElement,
      weakestElementTh: FIVE_ELEMENTS[weakestElement].nameTh,
      missingElements,
      missingElementsTh: missingElements.map(el => FIVE_ELEMENTS[el].nameTh),
      strength: {
        isStrong,
        supportRatio: Math.round(supportRatio * 1000) / 10,
        // ข้อความที่ผู้ใช้เห็นต้องเป็นภาษาไทยล้วน อักษรจีนเก็บแยกไว้ในฟิลด์อ้างอิง
        // สำหรับคนที่อยากเทียบกับตำราจีนต้นฉบับ แต่หน้าเว็บไม่เอามาแสดงปนกัน
        labelTh: isStrong ? 'ธาตุประจำตัวแข็ง' : 'ธาตุประจำตัวอ่อน',
        labelHanzi: isStrong ? '身強' : '身弱',
        plainTh: isStrong
          ? 'ดวงคุณมีพลังหนุนตัวเองเยอะ แปลว่าคุณพึ่งตัวเองได้ดี ยืนด้วยลำแข้งตัวเองไหว แต่ต้องหาทาง "ระบาย" พลังออกเป็นผลงานหรือรายได้ ไม่งั้นจะอึดอัดและหงุดหงิดง่าย'
          : 'ดวงคุณมีพลังหนุนตัวเองน้อย แปลว่าคุณต้องการทีม ผู้ใหญ่ และแหล่งพลังมาช่วย จะไปคนเดียวลุยเดี่ยวตลอดจะเหนื่อยมาก ควรหาพันธมิตรและผู้สนับสนุน'
      },
      favourableElements,
      favourableElementsTh: favourableElements.map(el => FIVE_ELEMENTS[el].nameTh),
      favourableColorsTh: [...new Set(favourableElements.map(el => FIVE_ELEMENTS[el].colorTh))],
      unfavourableElements,
      unfavourableElementsTh: unfavourableElements.map(el => FIVE_ELEMENTS[el].nameTh),
      tenGods,
      confidence: {
        hasExactTime,
        hourPillarAvailable: hourPillar !== null,
        noteTh: hasExactTime
          ? 'ข้อมูลเวลาเกิดครบ คำนวณได้ครบทั้ง 4 เสา'
          : 'ไม่ทราบเวลาเกิด จึงคำนวณได้ 3 เสา ผลเรื่องลูกหลานและบั้นปลายชีวิตจะยังไม่แม่น'
      }
    };
  }

  /**
   * หาอายุเริ่มต้นต้าอวิ้น (起運) ตามกฎจริง
   * นับจำนวนวันจากวันเกิดถึงสารทต้นเดือน (節) ที่ใกล้ที่สุดตามทิศทางการนับ
   * แล้วแปลงด้วยอัตรา 3 วัน = 1 ปี (1 วัน = 4 เดือน)
   */
  static calculateStartAge(birthUtc, forward) {
    const localYear = new Date(birthUtc.getTime() + CHINA_STANDARD_OFFSET_HOURS * 3600000).getUTCFullYear();
    const nodes = [];
    for (const y of [localYear - 1, localYear, localYear + 1]) {
      for (const term of SOLAR_TERMS) {
        if (term.major) continue;
        nodes.push(findSolarTerm(y, term.longitude));
      }
    }
    nodes.sort((a, b) => a - b);

    let target;
    if (forward) {
      target = nodes.find(d => d > birthUtc);
    } else {
      const past = nodes.filter(d => d <= birthUtc);
      target = past[past.length - 1];
    }
    if (!target) return { years: 0, months: 0, decimalYears: 0, daysToTerm: 0 };

    const days = Math.abs(target - birthUtc) / 86400000;
    const decimalYears = days / 3;
    const years = Math.floor(decimalYears);
    const months = Math.round((decimalYears - years) * 12);
    return {
      years: months === 12 ? years + 1 : years,
      months: months === 12 ? 0 : months,
      decimalYears: Math.round(decimalYears * 100) / 100,
      daysToTerm: Math.round(days * 100) / 100
    };
  }

  /**
   * ต้าอวิ้น — รอบโชคชะตา 10 ปี
   * ทิศทางการนับ: ชายปีหยาง/หญิงปีหยิน นับไปข้างหน้า, นอกนั้นนับถอยหลัง
   * อายุเริ่มต้นคำนวณจากระยะถึงสารทจริง ไม่ใช่ค่าประมาณ
   */
  static calculateLuckPillars(chart, gender = 'unspecified', count = 8) {
    const yearStemPolarity = chart.pillars.year.stem.polarity;
    const isMale = gender === 'yang' || gender === 'male';
    const forward = (isMale && yearStemPolarity === 'Yang') || (!isMale && yearStemPolarity === 'Yin');

    const startAge = chart.birthUtc
      ? this.calculateStartAge(chart.birthUtc, forward)
      : { years: 5, months: 0, decimalYears: 5, daysToTerm: 0 };

    const startStem = chart.pillars.month.stem.index;
    const startBranch = chart.pillars.month.branch.index;
    const step = forward ? 1 : -1;
    const birthYear = Number(chart.birthDate.slice(0, 4));

    const list = Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      const stemIdx = ((startStem + step * n) % 10 + 10) % 10;
      const branchIdx = ((startBranch + step * n) % 12 + 12) % 12;
      const stem = HEAVENLY_STEMS[stemIdx];
      const branch = EARTHLY_BRANCHES[branchIdx];
      const godKey = resolveTenGod(chart.dayMaster.index, stemIdx);
      const isFavourable = chart.favourableElements.includes(stem.element)
        || chart.favourableElements.includes(branch.element);
      const ageFrom = startAge.years + (n - 1) * 10;
      const ageTo = ageFrom + 9;
      return {
        order: n,
        ageFrom,
        ageTo,
        yearFrom: birthYear + ageFrom,
        yearTo: birthYear + ageTo,
        stem,
        branch,
        nameTh: `${stem.nameTh}${branch.nameTh}`,
        ganZhi: `${stem.hanzi}${branch.hanzi}`,
        elementTh: stem.elementTh,
        branchElementTh: branch.elementTh,
        god: TEN_GODS[godKey],
        isFavourable,
        verdictTh: isFavourable
          ? 'ช่วงหนุนดวง เป็นจังหวะที่ควรลงมือ ขยายงาน และกล้าตัดสินใจ'
          : 'ช่วงต้องระวัง เน้นรักษาของเดิม เก็บออม และเลี่ยงการเสี่ยงก้อนใหญ่'
      };
    });

    return Object.assign(list, {
      startAge,
      direction: forward ? 'forward' : 'reverse',
      directionTh: forward ? 'นับไปข้างหน้า' : 'นับถอยหลัง',
      startNoteTh: `เริ่มเข้าต้าอวิ้นเมื่ออายุประมาณ ${startAge.years} ปี ${startAge.months} เดือน (คำนวณจากระยะ ${startAge.daysToTerm} วันถึงสารท หารด้วย 3)`
    });
  }
}
