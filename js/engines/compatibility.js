/**
 * AETHRA ORACLE — ดวงสมพงศ์ / เนื้อคู่ (Compatibility Engine)
 * ------------------------------------------------------------------
 * เรื่องที่คนไทยค้นหาเยอะมาก ทั้งคนโสดและคนมีคู่
 *
 * ใช้กฎความสัมพันธ์ของกิ่งดิน 12 ตัวตามตำราจีน ซึ่งนิยามไว้ชัดเจน ไม่มีการเดา:
 *   สามฮะ (三合) — ถูกโฉลกมาก จับกลุ่มละ 3 นักษัตร ห่างกัน 4 ตำแหน่ง
 *   ลิ่วฮะ (六合) — คู่เกื้อหนุน จับคู่ 6 คู่
 *   ชง   (六冲) — ปะทะกัน ห่างกัน 6 ตำแหน่ง
 *   ไห่  (六害) — บั่นทอนกัน จับคู่ 6 คู่
 * และเสริมด้วยความเข้ากันของธาตุประจำตัวจากดวงจีน (ก่อเกิด / ข่ม / เสมอ)
 */

import { EARTHLY_BRANCHES, ELEMENT_GENERATES, ELEMENT_CONTROLS, FIVE_ELEMENTS } from './bazi.js';
import { ChineseZodiacEngine } from './chinese-zodiac.js';
import { BaZiEngine } from './bazi.js';

/** สามฮะ (三合) — สามนักษัตรที่หนุนกันแรงที่สุด */
export const SAM_HAP_GROUPS = [
  { members: [0, 4, 8], nameTh: 'กลุ่มน้ำ (ชวด มะโรง วอก)', traitTh: 'จับมือกันแล้วเก่งเรื่องคิดแผน ต่อรอง และหาช่องทางทำเงิน' },
  { members: [1, 5, 9], nameTh: 'กลุ่มทอง (ฉลู มะเส็ง ระกา)', traitTh: 'จับมือกันแล้วเก่งเรื่องวินัย ความละเอียด และสร้างระบบที่มั่นคง' },
  { members: [2, 6, 10], nameTh: 'กลุ่มไฟ (ขาล มะเมีย จอ)', traitTh: 'จับมือกันแล้วเก่งเรื่องบุกเบิก กล้าลงมือ และสร้างชื่อเสียง' },
  { members: [3, 7, 11], nameTh: 'กลุ่มไม้ (เถาะ มะแม กุน)', traitTh: 'จับมือกันแล้วเก่งเรื่องดูแลกัน ประนีประนอม และสร้างความอบอุ่น' }
];

/** ลิ่วฮะ (六合) — คู่เกื้อหนุนกัน */
export const LIU_HAP_PAIRS = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];

/** ไห่ (六害) — คู่ที่บั่นทอนกัน */
export const HAI_PAIRS = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];

function pairIn(list, a, b) {
  return list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function elementRelation(a, b) {
  if (a === b) {
    return { key: 'same', score: 15, labelTh: 'ธาตุเดียวกัน', plainTh: 'เข้าใจกันง่ายเพราะมองโลกคล้ายกัน แต่ต้องระวังการแข่งกันเองและความคิดที่เหมือนกันจนไม่มีใครเตือนใคร' };
  }
  if (ELEMENT_GENERATES[a] === b) {
    return { key: 'generates', score: 25, labelTh: 'คุณส่งเสริมเขา', plainTh: 'คุณเป็นฝ่ายให้และผลักดันเขา ความสัมพันธ์ราบรื่น แต่ระวังคุณจะเหนื่อยฝ่ายเดียวถ้าเขาไม่ตอบกลับ' };
  }
  if (ELEMENT_GENERATES[b] === a) {
    return { key: 'generatedBy', score: 25, labelTh: 'เขาส่งเสริมคุณ', plainTh: 'เขาเป็นฝ่ายเกื้อหนุนคุณ ทำให้คุณเติบโตและสบายใจ เป็นคู่ที่ดีมากสำหรับคนที่ต้องการกำลังใจ' };
  }
  if (ELEMENT_CONTROLS[a] === b) {
    return { key: 'controls', score: 5, labelTh: 'คุณข่มเขา', plainTh: 'คุณมักเป็นฝ่ายนำและตัดสินใจ ถ้าเขายอมก็ไปได้ดี แต่ถ้าเขาไม่ยอมจะกลายเป็นทะเลาะเรื่องเดิมซ้ำ ๆ' };
  }
  return { key: 'controlledBy', score: 5, labelTh: 'เขาข่มคุณ', plainTh: 'เขามักเป็นฝ่ายกำหนดทิศทาง คุณอาจรู้สึกอึดอัดถ้าไม่ได้พูดความต้องการของตัวเองออกไป ต้องคุยกันตรง ๆ' };
}

export class CompatibilityEngine {
  /** ความสัมพันธ์ระหว่างสองปีนักษัตร */
  static branchRelation(a, b) {
    const distance = ((b - a) % 12 + 12) % 12;

    if (distance === 6) {
      return { key: 'chong', score: 20, labelTh: 'ชงกัน (ปะทะ)', plainTh: 'เป็นคู่ที่แรงดึงดูดสูงแต่ก็ชนกันบ่อย มักเห็นไม่ตรงกันเรื่องใหญ่ ๆ อยู่ด้วยกันได้ถ้าทั้งคู่ยอมลดอัตตาและตกลงกติกากันชัดเจน' };
    }
    if (pairIn(HAI_PAIRS, a, b)) {
      return { key: 'hai', score: 35, labelTh: 'ไห่ (บั่นทอนกัน)', plainTh: 'มักมีเรื่องกระทบกระทั่งเล็ก ๆ สะสม ไม่ถึงกับแตกหักแต่ทำให้เหนื่อยใจ ต้องสื่อสารให้ชัดและอย่าเก็บไว้' };
    }
    if (SAM_HAP_GROUPS.some(g => g.members.includes(a) && g.members.includes(b) && a !== b)) {
      const group = SAM_HAP_GROUPS.find(g => g.members.includes(a));
      return { key: 'samhap', score: 95, labelTh: 'สามฮะ (ถูกโฉลกมาก)', plainTh: 'เป็นคู่ที่หนุนกันแรงที่สุดตามตำราจีน ' + group.traitTh + ' มักคุยกันรู้เรื่องและไปในทิศทางเดียวกัน' };
    }
    if (pairIn(LIU_HAP_PAIRS, a, b)) {
      return { key: 'liuhap', score: 90, labelTh: 'ลิ่วฮะ (คู่เกื้อหนุน)', plainTh: 'เป็นคู่ที่เติมเต็มกันได้ดี ต่างคนต่างมีสิ่งที่อีกฝ่ายขาด อยู่ด้วยกันแล้วชีวิตลงตัวขึ้น' };
    }
    if (distance === 0) {
      return { key: 'same', score: 65, labelTh: 'นักษัตรเดียวกัน', plainTh: 'เข้าใจกันง่ายเพราะนิสัยคล้ายกัน แต่ก็มีจุดอ่อนเหมือนกันด้วย ถ้าไม่มีใครเตือนใครอาจพลาดเรื่องเดียวกันทั้งคู่' };
    }
    return { key: 'neutral', score: 60, labelTh: 'เฉย ๆ ไม่ขัดกัน', plainTh: 'ไม่มีแรงหนุนหรือแรงปะทะเป็นพิเศษ ความสัมพันธ์จะดีหรือไม่ขึ้นกับการดูแลกันมากกว่าดวง' };
  }

  /**
   * เทียบดวงสองคน
   * @param {{birthDate:string, birthTime?:string, nickname?:string}} personA
   * @param {{birthDate:string, birthTime?:string, nickname?:string}} personB
   */
  static compare(personA, personB) {
    const zodiacA = ChineseZodiacEngine.getZodiac(personA.birthDate, personA.birthTime || '12:00');
    const zodiacB = ChineseZodiacEngine.getZodiac(personB.birthDate, personB.birthTime || '12:00');
    const baziA = BaZiEngine.calculatePillars(personA.birthDate, personA.birthTime || '12:00');
    const baziB = BaZiEngine.calculatePillars(personB.birthDate, personB.birthTime || '12:00');

    const branch = this.branchRelation(zodiacA.branchIndex, zodiacB.branchIndex);
    const element = elementRelation(baziA.dayMaster.element, baziB.dayMaster.element);

    // คะแนนรวม: น้ำหนักนักษัตร 70% ธาตุประจำตัว 30% (ปรับจากฐาน 25 คะแนน)
    const elementScore = (element.score / 25) * 100;
    const total = Math.round(branch.score * 0.7 + elementScore * 0.3);

    const nameA = personA.nickname || 'คุณ';
    const nameB = personB.nickname || 'อีกฝ่าย';

    let verdictTh;
    if (total >= 85) verdictTh = 'เข้ากันได้ดีมาก เป็นคู่ที่ตำราถือว่าถูกโฉลก';
    else if (total >= 70) verdictTh = 'เข้ากันได้ดี มีจุดที่ต้องปรับบ้างแต่ไปกันรอด';
    else if (total >= 50) verdictTh = 'เข้ากันได้ปานกลาง ขึ้นอยู่กับการปรับตัวของทั้งสองฝ่าย';
    else if (total >= 35) verdictTh = 'มีจุดที่ต้องระวัง ต้องใช้ความเข้าใจมากกว่าคู่ทั่วไป';
    else verdictTh = 'ตำราถือว่าเป็นคู่ที่ท้าทาย แต่ไม่ได้แปลว่าอยู่ด้วยกันไม่ได้';

    return {
      personA: { ...personA, zodiac: zodiacA, dayMaster: baziA.dayMaster, elementTh: baziA.dayMasterElement.nameTh },
      personB: { ...personB, zodiac: zodiacB, dayMaster: baziB.dayMaster, elementTh: baziB.dayMasterElement.nameTh },
      branchRelation: branch,
      elementRelation: element,
      score: total,
      verdictTh,
      headlineTh: nameA + ' (ปี' + zodiacA.nameTh + ') กับ ' + nameB + ' (ปี' + zodiacB.nameTh + ') ได้ ' + total + ' คะแนน — ' + verdictTh,
      adviceTh: 'ความสัมพันธ์ที่ดีขึ้นกับการสื่อสารและการให้เกียรติกันมากกว่าตัวเลขจากตำรา ใช้ผลนี้เป็นแค่มุมมองเพิ่มเติม อย่าใช้ตัดสินว่าจะอยู่หรือจะไป',
      disclaimerTh: 'ผลนี้คำนวณจากปีนักษัตรและธาตุประจำตัวเท่านั้น การดูดวงสมพงศ์แบบละเอียดของหมอดูจริงจะดูครบทั้ง 4 เสาและดาวจร'
    };
  }

  /** คนโสด: หานักษัตรที่ถูกโฉลกที่สุดกับเรา */
  static findBestMatches(birthDateStr, birthTimeStr = '12:00') {
    const me = ChineseZodiacEngine.getZodiac(birthDateStr, birthTimeStr);
    const results = EARTHLY_BRANCHES.map(branch => {
      const relation = this.branchRelation(me.branchIndex, branch.index);
      return {
        branch,
        nameTh: branch.nameTh,
        animalTh: branch.animalTh,
        relation,
        score: relation.score
      };
    }).sort((a, b) => b.score - a.score);

    return {
      me,
      best: results.filter(r => r.score >= 90),
      good: results.filter(r => r.score >= 60 && r.score < 90),
      careful: results.filter(r => r.score < 60),
      all: results,
      summaryTh: 'คุณเกิดปี' + me.nameTh + ' นักษัตรที่ถูกโฉลกกับคุณที่สุดคือ '
        + results.filter(r => r.score >= 90).map(r => 'ปี' + r.nameTh).join(' ')
        + ' ส่วนที่ต้องใช้ความเข้าใจมากหน่อยคือ '
        + results.filter(r => r.score < 40).map(r => 'ปี' + r.nameTh).join(' ')
    };
  }
}
