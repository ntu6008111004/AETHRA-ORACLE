/**
 * AETHRA ORACLE — เลขศาสตร์เบอร์โทรศัพท์ (Thai Phone Numerology)
 * ------------------------------------------------------------------
 * ศาสตร์ที่คนไทยนิยมมาก ใช้ดูว่าเบอร์ที่ใช้อยู่ส่งผลกับชีวิตด้านไหน
 *
 * หลักการตามตำราเลขศาสตร์ไทย (ไม่มีการเดา):
 *   1) ผลรวมทุกหลัก  บวกเลขทั้ง 10 หลักเข้าด้วยกัน แล้วดูความหมายของผลรวม
 *   2) คู่เลข        อ่านเลขสองตัวที่ติดกัน แต่ละคู่มีดาวประจำและความหมายต่างกัน
 *   3) จัดกลุ่มดาว   คู่เลขทั้งหมดถูกจัดเป็น 8 กลุ่มดาวตามระบบนพเคราะห์
 *
 * หมายเหตุความซื่อสัตย์: คู่ที่มีเลข 0 ผสมอยู่ (เช่น 01 02 03 05 06 08 09)
 * ตำราส่วนใหญ่ไม่จัดเข้ากลุ่มดาว เพราะถือว่าเลข 0 ทำให้พลังของเลขข้างเคียงอ่อนลง
 * ระบบนี้จึงระบุตรง ๆ ว่าเป็นคู่ที่ไม่มีพลังเด่น ไม่แต่งความหมายขึ้นมาเอง
 */

/** ดาวประจำเลขแต่ละตัวตามเลขศาสตร์ไทย */
export const DIGIT_PLANETS = {
  0: { planetTh: 'ไม่มีดาวประจำ', meaningTh: 'เลขว่าง ทำให้พลังของเลขที่อยู่ติดกันอ่อนลง' },
  1: { planetTh: 'พระอาทิตย์', meaningTh: 'อำนาจ ความเป็นผู้นำ เกียรติยศ ชื่อเสียง' },
  2: { planetTh: 'พระจันทร์', meaningTh: 'ความอ่อนโยน เสน่ห์ การเจรจา จินตนาการ' },
  3: { planetTh: 'พระอังคาร', meaningTh: 'ความกล้า พลังลงมือทำ การแข่งขัน ความขยัน' },
  4: { planetTh: 'พระพุธ', meaningTh: 'สติปัญญา การพูด การค้าขาย ไหวพริบ' },
  5: { planetTh: 'พระพฤหัสบดี', meaningTh: 'ครูบาอาจารย์ ผู้ใหญ่อุปถัมภ์ คุณธรรม ความเจริญ' },
  6: { planetTh: 'พระศุกร์', meaningTh: 'ความรัก ความสวยงาม ศิลปะ ความสุข ทรัพย์สิน' },
  7: { planetTh: 'พระเสาร์', meaningTh: 'ความอดทน งานหนัก อุปสรรค ความล่าช้า' },
  8: { planetTh: 'พระราหู', meaningTh: 'การพลิกผัน โชคลาภไม่คาดฝัน ความลึกลับ' },
  9: { planetTh: 'พระเกตุ', meaningTh: 'บุญบารมี สิ่งศักดิ์สิทธิ์ ปัญญาทางธรรม' }
};

/** กลุ่มดาวของคู่เลข 8 กลุ่มตามระบบนพเคราะห์ */
export const PAIR_GROUPS = {
  suphamit: {
    id: 'suphamit', nameTh: 'ดาวศุภมิตร', tone: 'great', emoji: '💛',
    pairs: [24, 42, 36, 63, 45, 54],
    shortTh: 'มิตรดี ผู้ใหญ่หนุน',
    meaningTh: 'คู่เลขที่ดีที่สุดกลุ่มหนึ่ง ช่วยเรื่องคนรอบตัว ผู้ใหญ่เมตตา และการร่วมงานกับคนอื่น',
    workTh: 'มีคนช่วยเหลือในที่ทำงาน เจรจาง่าย ได้พันธมิตรดี',
    moneyTh: 'เงินมาจากคอนเนกชันและการร่วมมือ มากกว่าการลุยคนเดียว',
    loveTh: 'เสน่ห์ดี คนเอ็นดู เหมาะกับคนที่อยากให้ความสัมพันธ์ราบรื่น'
  },
  makka: {
    id: 'makka', nameTh: 'ดาวมรรคา', tone: 'good', emoji: '✈️',
    pairs: [15, 51, 26, 62, 39, 93, 48, 84, 57, 75],
    shortTh: 'เดินทาง ย้ายที่ รายได้ทางไกล',
    meaningTh: 'คู่เลขแห่งการเคลื่อนที่ เหมาะกับคนที่ต้องเดินทาง ย้ายงาน หรือทำงานกับคนต่างถิ่น',
    workTh: 'เหมาะกับงานขาย งานเดินทาง งานต่างประเทศ หรืองานที่ไม่ต้องนั่งประจำที่',
    moneyTh: 'รายได้มักมาจากนอกพื้นที่ เช่น ลูกค้าต่างจังหวัด งานออนไลน์ หรืองานต่างประเทศ',
    loveTh: 'อาจเจอคนรักจากที่ไกล หรือความสัมพันธ์ที่ต้องอยู่ห่างกันบ้าง'
  },
  kaset: {
    id: 'kaset', nameTh: 'ดาวเกษตร', tone: 'good', emoji: '🏠',
    pairs: [11, 22, 33, 44, 55, 66, 77, 88, 99],
    shortTh: 'ทรัพย์สินมั่นคง',
    meaningTh: 'คู่เลขซ้ำ เป็นเลขแห่งความมั่นคงและทรัพย์สินที่จับต้องได้ เช่น บ้าน ที่ดิน',
    workTh: 'เหมาะกับงานที่ต้องการความสม่ำเสมอและสะสมระยะยาว',
    moneyTh: 'เก็บเงินอยู่ เหมาะซื้อทรัพย์สินถาวรมากกว่าเก็งกำไรระยะสั้น',
    loveTh: 'ความสัมพันธ์มั่นคง แต่ต้องระวังความจำเจ ควรหากิจกรรมใหม่ทำร่วมกัน'
  },
  sawat: {
    id: 'sawat', nameTh: 'ดาวสวัสดิมงคล', tone: 'great', emoji: '🙏',
    pairs: [19, 91, 37, 73],
    shortTh: 'สิ่งศักดิ์สิทธิ์คุ้มครอง',
    meaningTh: 'คู่เลขแห่งความคุ้มครองและบุญบารมี ช่วยให้แคล้วคลาดและมีที่พึ่งทางใจ',
    workTh: 'มักรอดพ้นจากปัญหาใหญ่ได้แบบหวุดหวิด มีคนช่วยในนาทีสุดท้าย',
    moneyTh: 'เงินไม่ขาดมือ แม้ไม่รวยเร็วแต่ไม่เคยถึงทางตัน',
    loveTh: 'ความสัมพันธ์มีสิ่งดีคุ้มครอง ผ่านวิกฤตไปได้'
  },
  utsaha: {
    id: 'utsaha', nameTh: 'ดาวอุตสาหะ', tone: 'mixed', emoji: '💪',
    pairs: [13, 31, 14, 41, 28, 82, 29, 92, 38, 83, 69, 96],
    shortTh: 'ต้องสู้ก่อนถึงจะได้',
    meaningTh: 'คู่เลขที่ให้ผลดีแต่ต้องแลกด้วยความพยายาม ไม่มีอะไรได้มาง่าย ๆ',
    workTh: 'งานหนักกว่าคนอื่น แต่ถ้าอดทนจะได้ตำแหน่งและการยอมรับจริง',
    moneyTh: 'เงินมาจากแรงและฝีมือล้วน ๆ ไม่ใช่โชค ต้องลงมือเองทุกบาท',
    loveTh: 'ความสัมพันธ์ต้องประคับประคอง ไม่ได้ราบรื่นเองแต่ยั่งยืนถ้าตั้งใจ'
  },
  ari: {
    id: 'ari', nameTh: 'ดาวอริ', tone: 'bad', emoji: '⚠️',
    pairs: [12, 21, 17, 71, 23, 32, 47, 74, 56, 65, 68, 86, 89, 98],
    shortTh: 'คู่แข่ง ข้อขัดแย้ง',
    meaningTh: 'คู่เลขแห่งศัตรูและการแข่งขัน มักมีคนขัดขวางหรือเรื่องต้องเถียงกัน',
    workTh: 'ระวังคนแย่งงานหรือขัดแข้งขัดขา ทำสัญญาให้ชัดทุกครั้ง',
    moneyTh: 'ระวังการถูกโกงหรือข้อพิพาทเรื่องเงิน อย่าให้ยืมโดยไม่มีหลักฐาน',
    loveTh: 'มักมีเรื่องทะเลาะหรือมือที่สาม ต้องสื่อสารให้ชัดกว่าปกติ'
  },
  marana: {
    id: 'marana', nameTh: 'ดาวมรณะ', tone: 'bad', emoji: '🚫',
    pairs: [4, 40, 18, 81, 27, 72, 35, 53, 46, 64, 59, 95, 78, 87],
    shortTh: 'สูญเสีย พลัดพราก',
    meaningTh: 'คู่เลขที่ตำราถือว่าไม่ดี เกี่ยวกับการสูญเสีย อุบัติเหตุ และการพลัดพราก',
    workTh: 'ระวังงานสะดุดกลางคัน หรือต้องเริ่มใหม่บ่อย',
    moneyTh: 'เงินรั่วไหลง่าย มักมีรายจ่ายฉุกเฉินเข้ามาแทรก',
    loveTh: 'ระวังการห่างเหินและการจากลา ควรใส่ใจกันให้มากขึ้น'
  },
  kalakini: {
    id: 'kalakini', nameTh: 'ดาวกาลกิณี', tone: 'bad', emoji: '⛔',
    pairs: [7, 70, 16, 61, 25, 52, 34, 43, 58, 85, 67, 76, 79, 97],
    shortTh: 'ตกต่ำ ทุกข์ใจ',
    meaningTh: 'คู่เลขที่ตำราถือว่าแย่ที่สุด เกี่ยวกับความตกต่ำและความทุกข์ใจ',
    workTh: 'งานมักติดขัด ทำดีแต่ไม่มีคนเห็น',
    moneyTh: 'เงินเข้ายากออกง่าย ควรระวังการก่อหนี้',
    loveTh: 'มักมีเรื่องกวนใจ ควรระวังคำพูดที่ทำร้ายกัน'
  }
};

/** คู่เลขที่ตำราถือว่ากลาง ๆ ไม่มีพลังเด่น */
export const NEUTRAL_PAIRS = [10, 20, 30, 50, 60, 80, 90, 0, 49, 94];

/** ความหมายของผลรวมเบอร์ที่ตำราระบุไว้ชัดเจน */
export const SUM_MEANINGS = {
  15: { tone: 'great', titleTh: 'เดินทางและมิตรสหาย', descTh: 'ผลรวมที่ดี เด่นเรื่องการเจรจา การเดินทาง และมีมิตรช่วยเหลือ' },
  19: { tone: 'great', titleTh: 'สิ่งศักดิ์สิทธิ์คุ้มครอง', descTh: 'ผลรวมมงคล เด่นเรื่องโชคลาภ ชื่อเสียง และมีสิ่งดีคุ้มครอง' },
  24: { tone: 'great', titleTh: 'ทรัพย์และเกียรติยศ', descTh: 'ผลรวมยอดนิยม เด่นเรื่องเงินทองและการเป็นที่ยอมรับ' },
  36: { tone: 'great', titleTh: 'มิตรภาพและผู้อุปถัมภ์', descTh: 'เด่นเรื่องเสน่ห์ คนเมตตา และผู้ใหญ่คอยช่วยเหลือ' },
  41: { tone: 'good', titleTh: 'ปัญญาและการค้า', descTh: 'เด่นเรื่องการเจรจาค้าขายและงานที่ใช้ความคิด' },
  42: { tone: 'great', titleTh: 'ทรัพย์และเกียรติยศ', descTh: 'ผลรวมที่ดีมาก เด่นเรื่องการเงินและความมั่นคง' },
  45: { tone: 'great', titleTh: 'ทรัพย์และเกียรติยศ', descTh: 'ผลรวมมงคล เด่นเรื่องความสำเร็จและความมั่งคั่ง' },
  50: { tone: 'good', titleTh: 'สมดุลและทรัพย์สินมั่นคง', descTh: 'ผลรวมที่ให้ความสมดุล ทรัพย์สินมั่นคงไม่หวือหวา' },
  51: { tone: 'great', titleTh: 'เดินทางและโชคทางไกล', descTh: 'เด่นเรื่องการเดินทาง การย้ายที่ และรายได้จากทางไกล' },
  54: { tone: 'great', titleTh: 'ทรัพย์และเกียรติยศ', descTh: 'ผลรวมมงคล เด่นเรื่องเงินทองและหน้าที่การงาน' },
  55: { tone: 'good', titleTh: 'สมดุลและความมั่นคง', descTh: 'ผลรวมที่ให้ความมั่นคงและความสงบ' },
  63: { tone: 'great', titleTh: 'มิตรภาพและความรัก', descTh: 'เด่นเรื่องเสน่ห์ ความรัก และคนรอบตัวเมตตา' },
  91: { tone: 'great', titleTh: 'บุญบารมีคุ้มครอง', descTh: 'ผลรวมมงคล มีสิ่งดีคุ้มครองและโชคลาภ' },
  13: { tone: 'bad', titleTh: 'ควรระวังสุขภาพและการเงิน', descTh: 'ตำราเตือนเรื่องอุปสรรคและรายจ่ายที่ไม่คาดคิด' },
  21: { tone: 'bad', titleTh: 'ควรระวังความขัดแย้ง', descTh: 'ตำราเตือนเรื่องคนขัดขวางและปัญหาสุขภาพ' },
  46: { tone: 'bad', titleTh: 'ควรระวังการสูญเสีย', descTh: 'ตำราเตือนเรื่องเงินรั่วไหลและเรื่องกวนใจ' },
  53: { tone: 'bad', titleTh: 'ควรระวังอุปสรรค', descTh: 'ตำราเตือนเรื่องงานติดขัดและสุขภาพ' },
  59: { tone: 'bad', titleTh: 'ไม่แนะนำตามตำรา', descTh: 'ตำราถือว่าเป็นผลรวมที่ควรเลี่ยง' },
  65: { tone: 'bad', titleTh: 'ไม่แนะนำตามตำรา', descTh: 'ตำราถือว่าเป็นผลรวมที่ควรเลี่ยง' },
  78: { tone: 'bad', titleTh: 'ไม่แนะนำตามตำรา', descTh: 'ตำราถือว่าเป็นผลรวมที่ควรเลี่ยง' },
  97: { tone: 'bad', titleTh: 'ไม่แนะนำตามตำรา', descTh: 'ตำราถือว่าเป็นผลรวมที่ควรเลี่ยง' }
};

const TONE_SCORE = { great: 12, good: 7, mixed: 0, neutral: 0, bad: -10 };

/** สร้างตารางค้นหาคู่เลข -> กลุ่มดาว */
const PAIR_LOOKUP = (() => {
  const map = new Map();
  Object.values(PAIR_GROUPS).forEach(group => {
    group.pairs.forEach(pair => map.set(pair, group));
  });
  return map;
})();

/** เอาเฉพาะตัวเลขออกจากข้อความที่ผู้ใช้พิมพ์ */
export function normalizePhone(input) {
  return String(input || '').replace(/\D/g, '');
}

/** ตรวจว่าเบอร์ใช้ได้ไหม */
export function validatePhone(input) {
  const digits = normalizePhone(input);
  if (!digits) return { valid: false, reasonTh: 'กรุณากรอกเบอร์โทรศัพท์' };
  if (digits.length < 9) return { valid: false, reasonTh: 'เบอร์สั้นเกินไป ต้องมีอย่างน้อย 9 หลัก' };
  if (digits.length > 10) return { valid: false, reasonTh: 'เบอร์ยาวเกินไป กรุณากรอกเบอร์มือถือ 10 หลัก' };
  return { valid: true, digits };
}

export class PhoneNumerologyEngine {
  /** หากลุ่มดาวของคู่เลขหนึ่งคู่ */
  static lookupPair(pairNumber) {
    const group = PAIR_LOOKUP.get(pairNumber);
    if (group) return { group, isNeutral: false };
    if (NEUTRAL_PAIRS.includes(pairNumber)) {
      return {
        group: {
          id: 'neutral', nameTh: 'คู่กลาง', tone: 'neutral', emoji: '⚪',
          shortTh: 'ไม่มีพลังเด่น',
          meaningTh: 'ตำราถือว่าเป็นคู่ที่ไม่ให้คุณหรือโทษชัดเจน',
          workTh: 'ไม่ส่งผลเด่นทางใดทางหนึ่ง',
          moneyTh: 'ไม่ส่งผลเด่นทางใดทางหนึ่ง',
          loveTh: 'ไม่ส่งผลเด่นทางใดทางหนึ่ง'
        },
        isNeutral: true
      };
    }
    // คู่ที่มีเลข 0 ผสม ตำราส่วนใหญ่ไม่จัดกลุ่ม เพราะ 0 ทอนกำลังเลขข้างเคียง
    return {
      group: {
        id: 'weak', nameTh: 'คู่ที่มีเลขศูนย์', tone: 'neutral', emoji: '⚪',
        shortTh: 'พลังอ่อนลง',
        meaningTh: 'ตำราถือว่าเลขศูนย์ทำให้พลังของเลขที่อยู่ติดกันอ่อนลง จึงไม่ให้ผลเด่น',
        workTh: 'พลังด้านการงานของคู่นี้ถูกลดทอน',
        moneyTh: 'พลังด้านการเงินของคู่นี้ถูกลดทอน',
        loveTh: 'พลังด้านความรักของคู่นี้ถูกลดทอน'
      },
      isNeutral: true
    };
  }

  /**
   * วิเคราะห์เบอร์โทรศัพท์เต็มรูปแบบ
   * @param {string} input เบอร์ที่ผู้ใช้พิมพ์
   */
  static analyze(input) {
    const check = validatePhone(input);
    if (!check.valid) return { available: false, reasonTh: check.reasonTh };

    const digits = check.digits;
    const nums = digits.split('').map(Number);

    // 1) ผลรวมทุกหลัก
    const sum = nums.reduce((a, b) => a + b, 0);
    const sumInfo = SUM_MEANINGS[sum] || {
      tone: 'neutral',
      titleTh: 'ผลรวมกลาง ๆ',
      descTh: 'ตำราไม่ได้ระบุว่าผลรวมนี้ดีหรือเสียเป็นพิเศษ ถือว่าเป็นกลาง'
    };

    // 2) คู่เลขที่ติดกันทั้งหมด อ่านจากซ้ายไปขวา
    const pairs = [];
    for (let i = 0; i < nums.length - 1; i++) {
      const value = nums[i] * 10 + nums[i + 1];
      const { group, isNeutral } = this.lookupPair(value);
      pairs.push({
        position: i + 1,
        text: String(nums[i]) + String(nums[i + 1]),
        value,
        group,
        isNeutral,
        isLast: i === nums.length - 2
      });
    }

    // 3) นับกลุ่มดาวที่พบ
    const tally = {};
    pairs.forEach(p => {
      tally[p.group.id] = (tally[p.group.id] || 0) + 1;
    });

    const goodPairs = pairs.filter(p => p.group.tone === 'great' || p.group.tone === 'good');
    const badPairs = pairs.filter(p => p.group.tone === 'bad');
    const mixedPairs = pairs.filter(p => p.group.tone === 'mixed');

    // 4) คะแนนรวม บอกที่มาได้
    const factors = [
      {
        labelTh: 'ผลรวมเบอร์ ' + sum,
        points: TONE_SCORE[sumInfo.tone] * 1.5,
        reasonTh: sumInfo.titleTh
      },
      {
        labelTh: 'คู่เลขที่ดี ' + goodPairs.length + ' คู่',
        points: goodPairs.length * 5,
        reasonTh: goodPairs.length ? 'พบคู่ ' + goodPairs.map(p => p.text).join(' ') : 'ไม่พบคู่เลขที่ดีเด่น'
      },
      {
        labelTh: 'คู่เลขที่ต้องระวัง ' + badPairs.length + ' คู่',
        points: badPairs.length * -6,
        reasonTh: badPairs.length ? 'พบคู่ ' + badPairs.map(p => p.text).join(' ') : 'ไม่พบคู่เลขที่ต้องระวัง'
      }
    ];

    // คู่ท้ายสุดถือว่าสำคัญที่สุดตามตำรา
    const lastPair = pairs[pairs.length - 1];
    if (lastPair) {
      factors.push({
        labelTh: 'คู่ท้ายเบอร์ ' + lastPair.text,
        points: TONE_SCORE[lastPair.group.tone] * 1.2,
        reasonTh: 'ตำราถือว่าคู่ท้ายสุดส่งผลแรงที่สุด คู่นี้อยู่กลุ่ม ' + lastPair.group.nameTh
      });
    }

    const rawScore = 60 + factors.reduce((a, f) => a + f.points, 0);
    const score = Math.max(20, Math.min(98, Math.round(rawScore)));

    let verdictTh;
    if (score >= 80) verdictTh = 'เบอร์นี้ถือว่าดีมากตามตำรา';
    else if (score >= 65) verdictTh = 'เบอร์นี้ใช้ได้ดี มีจุดเด่นชัดเจน';
    else if (score >= 50) verdictTh = 'เบอร์นี้กลาง ๆ มีทั้งดีและที่ต้องระวัง';
    else if (score >= 38) verdictTh = 'เบอร์นี้มีจุดที่ต้องระวังมากกว่าจุดดี';
    else verdictTh = 'ตำราถือว่าเบอร์นี้ควรพิจารณาเปลี่ยน';

    return {
      available: true,
      phone: digits,
      formatted: digits.length === 10
        ? digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6)
        : digits,
      sum,
      sumInfo,
      pairs,
      goodPairs,
      badPairs,
      mixedPairs,
      tally,
      score,
      scoreFactors: factors.filter(f => f.points !== 0),
      // ขั้นตอนการคำนวณจริงของเบอร์นี้ ใช้แสดงให้ผู้ใช้ตรวจสอบได้เอง
      calcStepsTh: [
        'เบอร์ที่กรอก: ' + digits + ' (' + digits.length + ' หลัก)',
        'บวกเลขทุกหลัก: ' + nums.join(' + ') + ' = ' + sum,
        'ผลรวม ' + sum + ' เทียบตาราง ได้ความหมาย: ' + sumInfo.titleTh,
        'จับคู่เลขติดกันได้ ' + pairs.length + ' คู่: ' + pairs.map(p => p.text).join(' '),
        'คู่ที่อยู่กลุ่มดาวดี ' + goodPairs.length + ' คู่'
          + (goodPairs.length ? ' (' + goodPairs.map(p => p.text).join(' ') + ')' : ''),
        'คู่ที่อยู่กลุ่มดาวเสีย ' + badPairs.length + ' คู่'
          + (badPairs.length ? ' (' + badPairs.map(p => p.text).join(' ') + ')' : ''),
        'คู่ท้ายสุดคือ ' + (lastPair ? lastPair.text + ' อยู่กลุ่ม ' + lastPair.group.nameTh : 'ไม่มี')
          + ' ให้น้ำหนักพิเศษเพราะตำราถือว่าส่งผลแรงที่สุด',
        'รวมคะแนน: 60 (ฐานกลาง) '
          + factors.filter(f => f.points !== 0).map(f => (f.points > 0 ? '+ ' : '- ') + Math.abs(Math.round(f.points))).join(' ')
          + ' = ' + score + ' คะแนน'
      ],
      verdictTh,
      digitPlanets: [...new Set(nums)].sort().map(n => ({ digit: n, ...DIGIT_PLANETS[n] })),
      summaryTh: 'เบอร์นี้มีผลรวม ' + sum + ' (' + sumInfo.titleTh + ') '
        + 'พบคู่เลขที่ดี ' + goodPairs.length + ' คู่ และคู่ที่ต้องระวัง ' + badPairs.length + ' คู่ '
        + verdictTh,
      disclaimerTh: 'เลขศาสตร์เบอร์โทรเป็นความเชื่อตามตำราไทย ใช้เสริมความมั่นใจได้ '
        + 'แต่ความสำเร็จจริงมาจากการลงมือทำ ไม่ต้องเปลี่ยนเบอร์ถ้าไม่สะดวก'
    };
  }

  /**
   * ตรวจว่าเบอร์เข้ากับวันเกิดของเจ้าของหรือไม่
   * ใช้ผังทักษาเป็นตัวเทียบ เลขของดาวกาลกิณีคือเลขที่ควรเลี่ยง
   * @param {object} taksaChart ผลจาก TaksaEngine.calculate
   * @param {object} phoneResult ผลจาก analyze
   * @param {object} planetNumbers ตารางเลขประจำดาว
   */
  static matchWithOwner(taksaChart, phoneResult, planetNumbers) {
    if (!phoneResult.available) return null;

    const goodNums = [...new Set(['dech', 'si', 'mula', 'montri'].map(k => planetNumbers[taksaChart.byId[k].planetId]))];
    const badNum = planetNumbers[taksaChart.byId.kalakini.planetId];

    const nums = phoneResult.phone.split('').map(Number);
    const goodCount = nums.filter(n => goodNums.includes(n)).length;
    const badCount = nums.filter(n => n === badNum).length;

    return {
      goodNumbers: goodNums,
      badNumber: badNum,
      goodCount,
      badCount,
      verdictTh: badCount === 0
        ? 'เบอร์นี้ไม่มีเลข ' + badNum + ' ซึ่งเป็นเลขกาลกิณีของคุณเลย ถือว่าถูกโฉลกดี'
        : 'เบอร์นี้มีเลข ' + badNum + ' อยู่ ' + badCount + ' ตัว ซึ่งเป็นเลขของดาวกาลกิณีตามวันเกิดคุณ '
          + 'ตำราแนะนำให้เลี่ยง แต่ถ้าใช้อยู่แล้วไม่ต้องกังวลจนเกินไป',
      adviceTh: 'เลขที่ถูกโฉลกกับวันเกิดคุณคือ ' + goodNums.join(' ') + ' '
        + 'ถ้าจะเลือกเบอร์ใหม่ ให้มองหาเบอร์ที่มีเลขเหล่านี้เยอะ ๆ และเลี่ยงเลข ' + badNum
    };
  }
}
