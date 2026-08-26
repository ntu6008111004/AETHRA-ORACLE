/**
 * AETHRA ORACLE — ตัวแปลงชื่อธาตุทุกระบบให้เป็นภาษาไทย
 * ------------------------------------------------------------------
 * กติกาเด็ดขาดของเว็บนี้: ห้ามมีคำว่า water / Earth / Wood ฯลฯ หลุดไปหน้าจอ
 * ทุกจุดที่ต้องแสดงธาตุให้เรียกผ่านไฟล์นี้เท่านั้น
 */

const ELEMENT_TH_MAP = {
  // โหราศาสตร์สากล (4 ธาตุ ตัวพิมพ์เล็ก)
  fire: 'ไฟ',
  earth: 'ดิน',
  air: 'ลม',
  water: 'น้ำ',
  // ดวงจีน / ไพ่ทาโรต์ (ขึ้นต้นตัวใหญ่)
  Fire: 'ไฟ',
  Earth: 'ดิน',
  Air: 'ลม',
  Water: 'น้ำ',
  Wood: 'ไม้',
  Metal: 'ทอง'
};

/** ความหมายสั้น ๆ ของธาตุแต่ละแบบ ต่อท้ายชื่อได้เลย */
const ELEMENT_MEANING_TH = {
  fire: 'กระตือรือร้น มีพลัง มุ่งมั่น',
  earth: 'มั่นคง หนักแน่น รอบคอบ',
  air: 'เฉลียวฉลาด สื่อสารเก่ง ช่างสังเกต',
  water: 'อ่อนโยน ลึกซึ้ง ปรับตัวเก่ง',
  Wood: 'การเติบโต ความเมตตา ความคิดสร้างสรรค์',
  Metal: 'ระเบียบวินัย ความเด็ดขาด ความยุติธรรม',
  Fire: 'ความสว่าง ชื่อเสียง พลังใจ',
  Earth: 'ความมั่นคง ความน่าเชื่อถือ รากฐาน',
  Water: 'สติปัญญา การสื่อสาร ความยืดหยุ่น',
  Air: 'ความคิด การเจรจา ความคล่องแคล่ว'
};

/** แปลงชื่อธาตุอังกฤษเป็นไทย — ถ้าเป็นไทยอยู่แล้วให้คืนค่าเดิม */
export function elementTh(element) {
  const key = String(element || '').trim();
  return ELEMENT_TH_MAP[key] || key;
}

/** "ธาตุน้ำ" แบบมีคำว่า ธาตุ นำหน้าเสมอ */
export function elementFullTh(element) {
  const name = elementTh(element);
  return name.startsWith('ธาตุ') ? name : 'ธาตุ' + name;
}

/** "ธาตุน้ำ (อ่อนโยน ลึกซึ้ง ปรับตัวเก่ง)" */
export function elementWithMeaningTh(element) {
  const key = String(element || '').trim();
  const meaning = ELEMENT_MEANING_TH[key];
  return meaning ? elementFullTh(element) + ' (' + meaning + ')' : elementFullTh(element);
}
