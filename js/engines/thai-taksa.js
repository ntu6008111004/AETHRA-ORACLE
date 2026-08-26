/**
 * AETHRA ORACLE — ทักษาปกรณ์ (Taksa Pakorn) Engine
 * ------------------------------------------------------------------
 * ศาสตร์โหราศาสตร์ไทยที่ใช้ "วันเกิด" เป็นจุดตั้งต้น แล้ววนดาวพระเคราะห์ 8 ดวง
 * ไปตามลำดับทักษา เพื่อหาว่าดาวดวงใดเป็น บริวาร อายุ เดช ศรี มูละ อุตสาหะ มนตรี กาลกิณี
 *
 * ลำดับทักษา (เวียนขวา) คือ  อาทิตย์ -> จันทร์ -> อังคาร -> พุธ -> เสาร์ -> พฤหัสบดี -> ราหู -> ศุกร์
 * ตำแหน่งทั้ง 8 เรียงจากดาวประจำวันเกิดคือ บริวาร -> อายุ -> เดช -> ศรี -> มูละ -> อุตสาหะ -> มนตรี -> กาลกิณี
 *
 * ตรวจสอบแล้วว่าผลลัพธ์ตรงกับตำราไทยครบทั้ง 8 วัน:
 *   เกิดวันอาทิตย์  กาลกิณี = ศุกร์ (สีฟ้า/น้ำเงิน) -> ตรงกับ "วันอาทิตย์ห้ามน้ำเงิน"
 *   เกิดวันจันทร์   กาลกิณี = อาทิตย์ (สีแดง)       -> ตรงกับ "วันจันทร์ห้ามแดง"
 *   เกิดวันอังคาร   กาลกิณี = จันทร์ (สีขาว/นวล)    -> ตรงกับ "วันอังคารห้ามขาว"
 *   เกิดวันพุธ      กาลกิณี = อังคาร (สีชมพู)       -> ตรงกับ "วันพุธห้ามชมพู"
 *   เกิดวันพฤหัสบดี กาลกิณี = เสาร์ (สีดำ)          -> ตรงกับ "วันพฤหัสบดีห้ามดำ"
 *   เกิดวันศุกร์    กาลกิณี = ราหู (สีเทา)          -> ตรงกับ "วันศุกร์ห้ามเทา"
 *   เกิดวันเสาร์    กาลกิณี = พุธ (สีเขียว)         -> ตรงกับ "วันเสาร์ห้ามเขียว"
 */

// สระและวรรณยุกต์ไทยเขียนเป็นรหัส Unicode เพื่อกันปัญหาอักขระผสม (combining marks)
const SARA_A = 'ะ';        // ะ
const SARA_AA = 'า';       // า
const SARA_I = 'ิ';        // ิ
const SARA_II = 'ี';       // ี
const SARA_UE = 'ึ';       // ึ
const SARA_UEE = 'ื';      // ื
const SARA_U = 'ุ';        // ุ
const SARA_UU = 'ู';       // ู
const SARA_E = 'เ';        // เ
const SARA_AE = 'แ';       // แ
const SARA_O = 'โ';        // โ
const SARA_AI_MAIMUAN = 'ใ'; // ใ
const SARA_AI_MAIMALAI = 'ไ'; // ไ
const SARA_AM = 'ำ';       // ำ
const MAI_HAN_AKAT = 'ั';  // ั
const RU = 'ฤ';            // ฤ
const LU = 'ฦ';            // ฦ

/** ดาวพระเคราะห์ทั้ง 8 ในระบบทักษา พร้อมสีกายเทวดาและหมวดอักษร (อักษรวรรค) */
export const TAKSA_PLANETS = {
  sun: {
    id: 'sun',
    number: 1,
    nameTh: 'พระอาทิตย์',
    shortTh: 'อาทิตย์',
    varkaTh: 'วรรคอาทิตย์ (กลุ่มสระ)',
    varkaAnimal: 'ครุฑ',
    colorName: 'สีแดง · สีส้มอมแดง · สีชมพูเข้ม',
    colorHex: '#E53E3E',
    letters: [
      'อ', SARA_A, SARA_AA, SARA_I, SARA_II, SARA_UE, SARA_UEE, SARA_U, SARA_UU,
      SARA_E, SARA_AE, SARA_O, SARA_AI_MAIMUAN, SARA_AI_MAIMALAI, SARA_AM, MAI_HAN_AKAT, RU, LU
    ],
    traitTh: 'พลังอำนาจ ความองอาจ เกียรติยศ ชื่อเสียง และความเป็นผู้นำ'
  },
  moon: {
    id: 'moon',
    number: 2,
    nameTh: 'พระจันทร์',
    shortTh: 'จันทร์',
    varkaTh: 'วรรคจันทร์',
    varkaAnimal: 'พยัคฆ์ (เสือ)',
    colorName: 'สีขาว · สีครีม · สีเหลืองนวล',
    colorHex: '#F7FAFC',
    letters: ['ก', 'ข', 'ค', 'ฅ', 'ฆ', 'ง'],
    traitTh: 'ความอ่อนโยน เมตตามหานิยม เสน่ห์ และจิตใจที่ละเอียดอ่อน'
  },
  mars: {
    id: 'mars',
    number: 3,
    nameTh: 'พระอังคาร',
    shortTh: 'อังคาร',
    varkaTh: 'วรรคอังคาร',
    varkaAnimal: 'ราชสีห์',
    colorName: 'สีชมพู · สีแดงอ่อน',
    colorHex: '#ED64A6',
    letters: ['จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ'],
    traitTh: 'ความกล้าหาญ พลังลงมือทำ ความขยัน และการต่อสู้ฟันฝ่า'
  },
  mercury: {
    id: 'mercury',
    number: 4,
    nameTh: 'พระพุธ',
    shortTh: 'พุธ',
    varkaTh: 'วรรคพุธ',
    varkaAnimal: 'โสณะ (สุนัข)',
    colorName: 'สีเขียว · สีเขียวใบไม้',
    colorHex: '#38A169',
    letters: ['ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ณ'],
    traitTh: 'สติปัญญา วาจา การเจรจาค้าขาย และไหวพริบเฉียบแหลม'
  },
  saturn: {
    id: 'saturn',
    number: 7,
    nameTh: 'พระเสาร์',
    shortTh: 'เสาร์',
    varkaTh: 'วรรคเสาร์',
    varkaAnimal: 'นาค (พญานาค)',
    colorName: 'สีดำ · สีม่วงเข้ม · สีน้ำเงินเข้ม',
    colorHex: '#2D3748',
    letters: ['ด', 'ต', 'ถ', 'ท', 'ธ', 'น'],
    traitTh: 'ความอดทน ความหนักแน่น รากฐานที่มั่นคง และผลจากความเพียร'
  },
  jupiter: {
    id: 'jupiter',
    number: 5,
    nameTh: 'พระพฤหัสบดี',
    shortTh: 'พฤหัสบดี',
    varkaTh: 'วรรคพฤหัสบดี',
    varkaAnimal: 'มูสิกะ (หนู)',
    colorName: 'สีส้ม · สีแสด · สีน้ำตาลทอง',
    colorHex: '#ED8936',
    letters: ['บ', 'ป', 'ผ', 'ฝ', 'พ', 'ฟ', 'ภ', 'ม'],
    traitTh: 'ครูบาอาจารย์ ผู้ใหญ่อุปถัมภ์ คุณธรรม และความเจริญรุ่งเรือง'
  },
  rahu: {
    id: 'rahu',
    number: 8,
    nameTh: 'พระราหู',
    shortTh: 'ราหู',
    varkaTh: 'วรรคราหู',
    varkaAnimal: 'คชะ (ช้าง)',
    colorName: 'สีเทา · สีดำหม่น · สีเขียวตองอ่อน',
    colorHex: '#718096',
    letters: ['ย', 'ร', 'ล', 'ว'],
    traitTh: 'การพลิกผัน โชคลาภแบบไม่คาดฝัน ความลึกลับ และอำนาจเงียบ'
  },
  venus: {
    id: 'venus',
    number: 6,
    nameTh: 'พระศุกร์',
    shortTh: 'ศุกร์',
    varkaTh: 'วรรคศุกร์',
    varkaAnimal: 'อัจฉระ (นางฟ้า)',
    colorName: 'สีฟ้า · สีน้ำเงินอ่อน',
    colorHex: '#4299E1',
    letters: ['ศ', 'ษ', 'ส', 'ห', 'ฬ', 'ฮ'],
    traitTh: 'ความรัก ความสุข ความงาม ศิลปะ และทรัพย์สินเงินทอง'
  }
};

/** ลำดับการวนทักษา (เวียนขวา) — ห้ามสลับลำดับ เพราะเป็นหัวใจของการคำนวณ */
export const TAKSA_CYCLE = ['sun', 'moon', 'mars', 'mercury', 'saturn', 'jupiter', 'rahu', 'venus'];

/**
 * ตำแหน่งภูมิทักษาทั้ง 8 — อธิบายเป็นภาษาชาวบ้านว่า "เกี่ยวกับเรื่องอะไร"
 * เพื่อให้คนทั่วไปที่ไม่เคยเรียนโหราศาสตร์อ่านแล้วเข้าใจทันที
 */
export const TAKSA_POSITIONS = [
  {
    id: 'boriwan',
    nameTh: 'บริวาร',
    domain: 'คนรอบตัว',
    plainTh: 'ดาวประจำตัวคุณเอง และคนที่อยู่รอบตัว เช่น ลูกน้อง ลูกหลาน เพื่อนร่วมงาน คนในบ้าน',
    goodForTh: 'ใช้สีนี้เวลาต้องการให้คนเชื่อฟัง ให้ทีมงานร่วมมือ หรือวันที่ต้องดูแลคนหมู่มาก',
    exampleTh: 'ตัวอย่างเช่น วันที่ต้องประชุมทีม พาลูกน้องออกงาน หรือจัดงานเลี้ยงที่บ้าน'
  },
  {
    id: 'ayu',
    nameTh: 'อายุ',
    domain: 'สุขภาพและกำลังใจ',
    plainTh: 'เรื่องสุขภาพร่างกาย กำลังใจ ความปลอดภัย และความสงบในจิตใจ',
    goodForTh: 'ใช้สีนี้วันที่รู้สึกเพลีย ไปตรวจสุขภาพ หรือวันที่ต้องเดินทางไกล',
    exampleTh: 'ตัวอย่างเช่น วันไปหาหมอ วันผ่าตัด วันเดินทางข้ามจังหวัด หรือวันที่นอนไม่พอ'
  },
  {
    id: 'dech',
    nameTh: 'เดช',
    domain: 'อำนาจและหน้าที่การงาน',
    plainTh: 'อำนาจบารมี ความน่าเกรงขาม ตำแหน่งหน้าที่ และการเป็นที่ยอมรับ',
    goodForTh: 'ใช้สีนี้วันที่ต้องการให้คนเกรงใจ นำเสนองาน สัมภาษณ์งาน หรือขึ้นเวที',
    exampleTh: 'ตัวอย่างเช่น วันสัมภาษณ์งาน วันเสนอโปรเจกต์ให้เจ้านาย วันขึ้นศาล วันรับตำแหน่ง'
  },
  {
    id: 'si',
    nameTh: 'ศรี',
    domain: 'เสน่ห์ ความรัก และโชคลาภ',
    plainTh: 'เสน่ห์ ความมีสิริมงคล คนรักคนหลง โชคลาภ และสิ่งดี ๆ ที่วิ่งเข้าหา',
    goodForTh: 'ใช้สีนี้วันที่ออกเดต เจอคนใหม่ ขอความช่วยเหลือ หรืออยากให้คนเอ็นดู',
    exampleTh: 'ตัวอย่างเช่น วันไปเดตครั้งแรก วันไปขอแต่งงาน วันไปขอลดหนี้ วันถ่ายรูปโปรไฟล์'
  },
  {
    id: 'mula',
    nameTh: 'มูละ',
    domain: 'ทรัพย์สินและเงินก้อน',
    plainTh: 'ฐานทรัพย์สิน เงินเก็บ ที่ดิน บ้าน รถ มรดก และความมั่งคั่งระยะยาว',
    goodForTh: 'ใช้สีนี้วันที่ทำเรื่องเงินก้อน เซ็นสัญญาซื้อขาย หรือเปิดบัญชีลงทุน',
    exampleTh: 'ตัวอย่างเช่น วันโอนบ้าน วันออกรถ วันเซ็นสัญญากู้ วันเปิดพอร์ตลงทุน'
  },
  {
    id: 'utsaha',
    nameTh: 'อุตสาหะ',
    domain: 'ความพยายามและงานที่ต้องสู้',
    plainTh: 'ความขยัน ความอดทน แรงผลักดัน และผลลัพธ์จากการลงแรงด้วยตัวเอง',
    goodForTh: 'ใช้สีนี้วันที่ต้องสู้งานหนัก ทำงานส่งเดดไลน์ หรือเริ่มต้นสิ่งที่ยาก',
    exampleTh: 'ตัวอย่างเช่น วันส่งงานใหญ่ วันสอบ วันเปิดร้านวันแรก วันเริ่มออกกำลังกาย'
  },
  {
    id: 'montri',
    nameTh: 'มนตรี',
    domain: 'ผู้ใหญ่และคนช่วยเหลือ',
    plainTh: 'ผู้ใหญ่อุปถัมภ์ เจ้านาย ครูบาอาจารย์ ผู้มีอำนาจที่จะยื่นมือมาช่วย',
    goodForTh: 'ใช้สีนี้วันที่ต้องพึ่งผู้ใหญ่ ขอทุน ขอโอกาส หรือติดต่อราชการ',
    exampleTh: 'ตัวอย่างเช่น วันขอขึ้นเงินเดือน วันไปติดต่อราชการ วันขอทุน วันฝากงานลูก'
  },
  {
    id: 'kalakini',
    nameTh: 'กาลกิณี',
    domain: 'สิ่งที่ควรเลี่ยง',
    plainTh: 'อุปสรรค เรื่องกวนใจ ความติดขัด เป็นดาวที่ตำราไทยบอกว่าให้เลี่ยง',
    goodForTh: 'เลี่ยงสีนี้ในวันสำคัญ และเลี่ยงใช้อักษรวรรคนี้เป็นตัวขึ้นต้นชื่อ',
    exampleTh: 'ตัวอย่างเช่น ไม่ใส่สีนี้วันสัมภาษณ์งาน วันเซ็นสัญญา หรือวันขอแต่งงาน',
    isNegative: true
  }
];

/** ชื่อวันในสัปดาห์ภาษาไทย (index ตรงกับ Date.getDay()) */
export const THAI_WEEKDAYS = [
  { index: 0, nameTh: 'วันอาทิตย์', planet: 'sun' },
  { index: 1, nameTh: 'วันจันทร์', planet: 'moon' },
  { index: 2, nameTh: 'วันอังคาร', planet: 'mars' },
  { index: 3, nameTh: 'วันพุธ', planet: 'mercury' },
  { index: 4, nameTh: 'วันพฤหัสบดี', planet: 'jupiter' },
  { index: 5, nameTh: 'วันศุกร์', planet: 'venus' },
  { index: 6, nameTh: 'วันเสาร์', planet: 'saturn' }
];

export class TaksaEngine {
  /**
   * หาดาวประจำวันเกิด
   * กติกาตำราไทย: ผู้ที่เกิด "วันพุธกลางคืน" (ตั้งแต่ 18:00 ของวันพุธเป็นต้นไป)
   * ให้ถือว่าเป็นคนของ "พระราหู" ไม่ใช่พระพุธ
   */
  static getBirthPlanet(dayOfWeek, birthTimeStr = null) {
    const weekday = THAI_WEEKDAYS[((dayOfWeek % 7) + 7) % 7];
    if (weekday.planet !== 'mercury') return weekday.planet;

    if (!/^\d{1,2}:\d{2}$/.test(String(birthTimeStr || ''))) return 'mercury';
    const hour = Number(String(birthTimeStr).split(':')[0]);
    return hour >= 18 ? 'rahu' : 'mercury';
  }

  /**
   * คำนวณผังทักษาเต็ม 8 ตำแหน่งจากวันเกิด
   * @param {string} birthDateStr - รูปแบบ YYYY-MM-DD
   * @param {string|null} birthTimeStr - รูปแบบ HH:MM (ใช้เฉพาะแยกพุธกลางวัน/กลางคืน)
   */
  static calculate(birthDateStr, birthTimeStr = null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(birthDateStr || ''))) {
      throw new TypeError('ทักษาปกรณ์ต้องใช้วันเกิดในรูปแบบ YYYY-MM-DD');
    }

    const [year, month, day] = birthDateStr.split('-').map(Number);
    // ใช้ UTC เพื่อไม่ให้ timezone ของเครื่องทำให้วันเกิดเพี้ยนไปหนึ่งวัน
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    const birthPlanetId = this.getBirthPlanet(dayOfWeek, birthTimeStr);
    const startIndex = TAKSA_CYCLE.indexOf(birthPlanetId);

    const positions = TAKSA_POSITIONS.map((position, offset) => {
      const planetId = TAKSA_CYCLE[(startIndex + offset) % 8];
      const planet = TAKSA_PLANETS[planetId];
      return {
        ...position,
        planetId,
        planetNameTh: planet.nameTh,
        colorName: planet.colorName,
        colorHex: planet.colorHex,
        letters: planet.letters,
        varkaTh: planet.varkaTh,
        planetTraitTh: planet.traitTh
      };
    });

    const byId = Object.fromEntries(positions.map(p => [p.id, p]));
    const isWednesdayNight = birthPlanetId === 'rahu' && dayOfWeek === 3;

    return {
      birthDate: birthDateStr,
      dayOfWeek,
      weekdayNameTh: THAI_WEEKDAYS[dayOfWeek].nameTh,
      isWednesdayNight,
      birthPlanetId,
      birthPlanet: TAKSA_PLANETS[birthPlanetId],
      positions,
      byId,
      /** สีที่ควรใช้ เรียงตามเรื่องที่คนไทยนิยมถามมากที่สุด */
      luckyColors: {
        power: byId.dech,
        charm: byId.si,
        wealth: byId.mula,
        effort: byId.utsaha,
        support: byId.montri,
        health: byId.ayu,
        people: byId.boriwan
      },
      avoidColor: byId.kalakini
    };
  }

  /**
   * ตรวจชื่อว่ามี "อักษรกาลกิณี" ปนอยู่หรือไม่ ตามตำราตั้งชื่อของไทย
   */
  static auditName(name, taksaChart) {
    const text = String(name || '');
    const kalakini = taksaChart.byId.kalakini;
    const forbidden = new Set(kalakini.letters);
    const found = [...new Set([...text].filter(char => forbidden.has(char)))];
    const siLetters = taksaChart.byId.si.letters.slice(0, 6).join(' ');
    const dechLetters = taksaChart.byId.dech.letters.slice(0, 6).join(' ');

    return {
      name: text,
      hasKalakini: found.length > 0,
      foundLetters: found,
      kalakiniVarka: kalakini.varkaTh,
      kalakiniLetters: kalakini.letters,
      verdictTh: found.length > 0
        ? `ชื่อ "${text}" มีอักษรกาลกิณีอยู่ ${found.length} ตัว คือ ${found.join(' ')} — ตามตำราไทยถือว่าเป็นตัวอักษรที่ทอนกำลังดวง หลายคนจึงเลี่ยงหรือเปลี่ยนชื่อ แต่นี่เป็นความเชื่อตามตำรา ไม่ใช่คำตัดสินชีวิตของคุณ`
        : `ชื่อ "${text}" ไม่มีอักษรกาลกิณีปนอยู่เลย ถือว่าถูกโฉลกกับวันเกิดของคุณตามตำราทักษา`,
      adviceTh: found.length > 0
        ? `ถ้าสนใจเรื่องนี้จริงจัง ลองเลี่ยงอักษร ${kalakini.letters.join(' ')} เวลาตั้งชื่อเล่น ชื่อร้าน หรือชื่อแบรนด์ แล้วหันไปใช้อักษรวรรคศรี (${siLetters}) จะช่วยเรื่องเสน่ห์และโชคลาภ`
        : `ถ้าจะตั้งชื่อร้านหรือชื่อแบรนด์เพิ่ม แนะนำใช้อักษรวรรคศรี (${siLetters}) หรือวรรคเดช (${dechLetters}) จะเสริมเสน่ห์และอำนาจ`
    };
  }
}
