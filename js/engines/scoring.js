/**
 * AETHRA ORACLE — ระบบให้คะแนนแต่ละด้านของชีวิต
 * ------------------------------------------------------------------
 * เดิมคะแนนหยาบมาก เช่น การงานมีแค่ 2 ค่าคือ 82 หรือ 64 เท่านั้น
 * ทำให้เลขดูละเอียดกว่าความจริง ผู้ใช้จึงสงสัยว่ามั่วหรือเปล่า
 *
 * ตอนนี้เปลี่ยนเป็นคะแนนถ่วงน้ำหนักจากหลายปัจจัยที่คำนวณได้จริง
 * และทุกคะแนนต้องบอกที่มาได้ว่าบวกลบจากอะไรบ้าง (breakdown)
 *
 * ฐานเริ่มต้น 60 คะแนน หมายถึงกลาง ๆ ไม่ดีไม่ร้าย
 * แล้วบวกลบตามปัจจัยจริง จำกัดผลลัพธ์ไว้ที่ 30-95
 */

const BASE = 60;
const MIN = 30;
const MAX = 95;

function clamp(value) {
  return Math.max(MIN, Math.min(MAX, Math.round(value)));
}

/**
 * รวมคะแนนจากรายการปัจจัย
 * @param {{labelTh:string, points:number, reasonTh:string}[]} factors
 */
function total(factors) {
  const applied = factors.filter(f => f && f.points !== 0);
  const sum = applied.reduce((acc, f) => acc + f.points, 0);
  const score = clamp(BASE + sum);
  return {
    score,
    base: BASE,
    factors: applied,
    /** อธิบายที่มาของคะแนนเป็นข้อความอ่านง่าย */
    explainTh: 'เริ่มจากคะแนนกลาง ' + BASE + ' แล้ว'
      + applied.map(f => (f.points > 0 ? 'บวก ' : 'ลบ ') + Math.abs(f.points) + ' เพราะ' + f.reasonTh).join(' ')
      + ' รวมได้ ' + score + ' คะแนน'
  };
}

/** ความสมดุลของธาตุทั้งห้า ยิ่งกระจายสม่ำเสมอยิ่งดี คืนค่า 0-1 */
export function elementBalance(elementScores) {
  const values = Object.values(elementScores);
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum <= 0) return 0;
  const ideal = sum / values.length;
  const deviation = values.reduce((acc, v) => acc + Math.abs(v - ideal), 0) / (2 * sum);
  return Math.max(0, 1 - deviation);
}

/** คะแนนด้านการงาน */
export function scoreCareer({ bazi, gods, currentLuck, chong, houses, personalYear }) {
  return total([
    currentLuck.isFavourable
      ? { labelTh: 'รอบโชคชะตา 10 ปี', points: 12, reasonTh: 'รอบ ' + currentLuck.nameTh + ' เป็นธาตุที่หนุนดวงคุณ' }
      : { labelTh: 'รอบโชคชะตา 10 ปี', points: -8, reasonTh: 'รอบ ' + currentLuck.nameTh + ' เป็นธาตุที่ยังไม่หนุนดวง' },

    gods.has('directOfficer')
      ? { labelTh: 'ดาวตำแหน่งหน้าที่', points: 9, reasonTh: 'มีดาวเจิ้งกวน ซึ่งหนุนเรื่องตำแหน่งและการยอมรับ' }
      : null,

    gods.has('sevenKillings')
      ? { labelTh: 'ดาวอำนาจดิบ', points: 5, reasonTh: 'มีดาวชีซา ทำให้สู้งานหนักได้ แต่ต้องแลกกับความกดดัน' }
      : null,

    gods.has('directResource', 'indirectResource')
      ? { labelTh: 'ดาวผู้อุปถัมภ์', points: 7, reasonTh: 'มีดาวอิ้น จึงมักมีผู้ใหญ่หรือความรู้มาช่วยหนุน' }
      : null,

    gods.has('hurtingOfficer')
      ? { labelTh: 'ดาวท้าทายอำนาจ', points: -5, reasonTh: 'มีดาวซางกวน ทำให้เก่งแต่มักขัดใจผู้ใหญ่' }
      : null,

    bazi.strength.isStrong
      ? { labelTh: 'กำลังธาตุประจำตัว', points: 6, reasonTh: 'ธาตุประจำตัวแข็ง จึงรับงานหนักและยืนด้วยตัวเองได้' }
      : { labelTh: 'กำลังธาตุประจำตัว', points: -4, reasonTh: 'ธาตุประจำตัวอ่อน จึงต้องพึ่งทีมและผู้ใหญ่มากกว่าปกติ' },

    houses?.available
      ? { labelTh: 'ภพการงาน', points: 4, reasonTh: 'มีเวลาเกิด จึงอ่านภพการงานได้ครบ' }
      : { labelTh: 'ข้อมูลไม่ครบ', points: -3, reasonTh: 'ไม่ทราบเวลาเกิด จึงอ่านภพการงานไม่ได้' },

    chong.isChong
      ? { labelTh: 'ปีชง', points: -7, reasonTh: 'ปีนี้ชง มักมีเรื่องเปลี่ยนแปลงหรือติดขัดในงาน' }
      : null,

    personalYear >= 1 && personalYear <= 3
      ? { labelTh: 'จังหวะชีวิตปีนี้', points: 5, reasonTh: 'อยู่ต้นรอบเลข ' + personalYear + ' เหมาะเริ่มสิ่งใหม่' }
      : personalYear >= 8
        ? { labelTh: 'จังหวะชีวิตปีนี้', points: -3, reasonTh: 'อยู่ปลายรอบเลข ' + personalYear + ' เป็นช่วงสะสางมากกว่าบุกเบิก' }
        : null
  ]);
}

/** คะแนนด้านการเงิน */
export function scoreMoney({ bazi, gods, currentLuck, chong, houses, personalYear }) {
  return total([
    gods.has('directWealth')
      ? { labelTh: 'ดาวทรัพย์ประจำ', points: 10, reasonTh: 'มีดาวเจิ้งไฉ รายได้จึงเข้าสม่ำเสมอ' }
      : null,

    gods.has('indirectWealth')
      ? { labelTh: 'ดาวทรัพย์ลอย', points: 8, reasonTh: 'มีดาวเพียนไฉ มีโอกาสได้เงินก้อนจากการค้าหรือผลงาน' }
      : null,

    !gods.has('directWealth', 'indirectWealth')
      ? { labelTh: 'ไม่มีดาวทรัพย์เด่น', points: -6, reasonTh: 'ไม่มีดาวทรัพย์ในดวง เงินจึงมาจากฝีมือล้วน ๆ ไม่ใช่โชค' }
      : null,

    gods.has('rob')
      ? { labelTh: 'ดาวแย่งทรัพย์', points: -9, reasonTh: 'มีดาวเจี๋ยไฉ เสี่ยงเสียเงินให้คนใกล้ตัวหรือการค้ำประกัน' }
      : null,

    bazi.strength.isStrong
      ? { labelTh: 'กำลังธาตุประจำตัว', points: 7, reasonTh: 'ธาตุประจำตัวแข็ง จึงคุมเงินก้อนใหญ่ไหว' }
      : { labelTh: 'กำลังธาตุประจำตัว', points: -5, reasonTh: 'ธาตุประจำตัวอ่อน การรับเงินก้อนใหญ่อาจมาพร้อมภาระ' },

    currentLuck.isFavourable
      ? { labelTh: 'รอบโชคชะตา 10 ปี', points: 10, reasonTh: 'อยู่ในรอบที่หนุนดวง เหมาะขยายและลงทุน' }
      : { labelTh: 'รอบโชคชะตา 10 ปี', points: -8, reasonTh: 'อยู่ในรอบที่ยังไม่หนุน ควรเน้นรักษาของเดิม' },

    chong.isChong
      ? { labelTh: 'ปีชง', points: -8, reasonTh: 'ปีชง ตำราเตือนเรื่องเงินก้อนและการค้ำประกัน' }
      : null,

    houses?.available
      ? { labelTh: 'ภพการเงิน', points: 4, reasonTh: 'มีเวลาเกิด จึงอ่านภพการเงินและภพลาภได้' }
      : { labelTh: 'ข้อมูลไม่ครบ', points: -3, reasonTh: 'ไม่ทราบเวลาเกิด จึงอ่านภพการเงินไม่ได้' },

    personalYear === 8
      ? { labelTh: 'จังหวะชีวิตปีนี้', points: 6, reasonTh: 'เลข 8 เป็นปีเก็บเกี่ยวผลตามเลขศาสตร์' }
      : null
  ]);
}

/** คะแนนด้านความรัก */
export function scoreLove({ matches, gods, isMale, houses, zodiac, chong, personalYear }) {
  const bestCount = matches.best.length;
  const partnerStar = isMale
    ? gods.has('directWealth', 'indirectWealth')
    : gods.has('directOfficer', 'sevenKillings');

  return total([
    { labelTh: 'นักษัตรที่ถูกโฉลก', points: bestCount * 4, reasonTh: 'มีนักษัตรที่เข้ากับคุณได้ดี ' + bestCount + ' ปี' },

    partnerStar
      ? { labelTh: 'ดาวคู่ครอง', points: 10, reasonTh: 'มีดาวคู่ครองปรากฏชัดในดวง เรื่องคู่จึงมีเกณฑ์ชัดเจน' }
      : { labelTh: 'ดาวคู่ครอง', points: -7, reasonTh: 'ไม่มีดาวคู่ครองเด่น เรื่องคู่อาจมาช้ากว่าคนอื่น' },

    houses?.available
      ? { labelTh: 'ภพคู่ครอง', points: 5, reasonTh: 'มีเวลาเกิด จึงอ่านภพคู่ครองได้ตรง' }
      : { labelTh: 'ข้อมูลไม่ครบ', points: -4, reasonTh: 'ไม่ทราบเวลาเกิด จึงอ่านภพคู่ครองไม่ได้' },

    gods.has('eatingGod')
      ? { labelTh: 'ดาวเสน่ห์', points: 6, reasonTh: 'มีดาวสือเสิน ทำให้มีเสน่ห์และเข้ากับคนง่าย' }
      : null,

    gods.has('rob')
      ? { labelTh: 'ดาวแย่งทรัพย์', points: -5, reasonTh: 'มีดาวเจี๋ยไฉ อาจมีคู่แข่งในความรักหรือมือที่สาม' }
      : null,

    chong.isChong
      ? { labelTh: 'ปีชง', points: -5, reasonTh: 'ปีชง ความสัมพันธ์มักมีเรื่องเปลี่ยนแปลง' }
      : null,

    personalYear === 2 || personalYear === 6
      ? { labelTh: 'จังหวะชีวิตปีนี้', points: 6, reasonTh: 'เลข ' + personalYear + ' เป็นปีที่เด่นเรื่องความสัมพันธ์' }
      : null
  ]);
}

/** คะแนนด้านสุขภาพ */
export function scoreHealth({ bazi, thai, chong, balance }) {
  const missingCount = bazi.missingElements.length;

  return total([
    missingCount === 0
      ? { labelTh: 'ความครบของธาตุ', points: 10, reasonTh: 'ดวงมีครบทั้งห้าธาตุ ถือว่าสมดุลดี' }
      : { labelTh: 'ความครบของธาตุ', points: -6 * missingCount, reasonTh: 'ขาดธาตุ ' + bazi.missingElementsTh.join(' และ ') + ' จึงมีจุดที่ต้องดูแลเป็นพิเศษ' },

    { labelTh: 'ความสมดุลของธาตุ', points: Math.round((balance - 0.5) * 30),
      reasonTh: 'กำลังธาตุกระจายตัวที่ระดับ ' + Math.round(balance * 100) + ' เปอร์เซ็นต์' },

    bazi.strength.isStrong
      ? { labelTh: 'กำลังธาตุประจำตัว', points: 5, reasonTh: 'ธาตุประจำตัวแข็ง พื้นฐานร่างกายจึงทนได้ดี' }
      : { labelTh: 'กำลังธาตุประจำตัว', points: -5, reasonTh: 'ธาตุประจำตัวอ่อน จึงเหนื่อยง่ายกว่าคนอื่นถ้าหักโหม' },

    chong.isChong
      ? { labelTh: 'ปีชง', points: -6, reasonTh: 'ปีชง ตำราเตือนเรื่องสุขภาพและการเดินทาง' }
      : null,

    { labelTh: 'ธาตุเจ้าเรือน', points: 0,
      reasonTh: 'ธาตุเจ้าเรือนของคุณคือ' + thai.bodyElement.nameTh + ' ใช้เลือกอาหารและวิธีดูแลตัวเอง' }
  ]);
}

/** คะแนนด้านโชคลาภและจังหวะชีวิต */
export function scoreLuck({ chong, currentLuck, personalYear, balance, bazi }) {
  return total([
    chong.isChong
      ? { labelTh: 'ปีชง', points: -14, reasonTh: 'ปีนี้เข้าข่าย ' + chong.matched[0].labelTh }
      : { labelTh: 'ปีชง', points: 8, reasonTh: 'ปีนี้ไม่ชง เดินได้ตามปกติ' },

    currentLuck.isFavourable
      ? { labelTh: 'รอบโชคชะตา 10 ปี', points: 14, reasonTh: 'รอบ ' + currentLuck.nameTh + ' เป็นธาตุที่หนุนดวงคุณ' }
      : { labelTh: 'รอบโชคชะตา 10 ปี', points: -10, reasonTh: 'รอบ ' + currentLuck.nameTh + ' ยังไม่ใช่ธาตุที่หนุน' },

    { labelTh: 'ความสมดุลของธาตุ', points: Math.round((balance - 0.5) * 20),
      reasonTh: 'ธาตุในดวงกระจายตัวที่ระดับ ' + Math.round(balance * 100) + ' เปอร์เซ็นต์' },

    personalYear === 1
      ? { labelTh: 'จังหวะชีวิตปีนี้', points: 6, reasonTh: 'เลข 1 เป็นปีเริ่มรอบใหม่' }
      : personalYear === 9
        ? { labelTh: 'จังหวะชีวิตปีนี้', points: -5, reasonTh: 'เลข 9 เป็นปีปิดรอบ เหมาะสะสางมากกว่าเริ่ม' }
        : null,

    bazi.strength.isStrong
      ? { labelTh: 'กำลังธาตุประจำตัว', points: 4, reasonTh: 'ธาตุประจำตัวแข็ง จึงคว้าโอกาสได้เร็ว' }
      : null
  ]);
}
