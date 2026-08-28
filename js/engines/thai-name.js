/**
 * AETHRA ORACLE — วิเคราะห์ชื่อจริงตามทักษาปกรณ์
 * ------------------------------------------------------------------
 * คนไทยนิยมดูชื่อมาก เวลาจะตั้งชื่อลูกหรือคิดจะเปลี่ยนชื่อ
 * สิ่งที่หมอดูไทยดูจริง ๆ คือสองอย่าง
 *
 *   1. ชื่อมีอักษรกาลกิณีของเจ้าของชื่อไหม
 *      ตำราทักษาแบ่งพยัญชนะและสระไทยออกเป็นแปดวรรค แต่ละวรรคเป็นของดาวดวงหนึ่ง
 *      คนเกิดวันไหน ดาวไหนตกตำแหน่งกาลกิณีของคนนั้น อักษรวรรคนั้นถือว่าไม่ถูกโฉลก
 *      ข้อนี้คำนวณได้ตรงตามตำรา ไม่ต้องเดาเลย
 *
 *   2. ชื่อหนุนด้านไหนบ้าง
 *      อักษรที่ตกวรรคเดช ศรี มนตรี มูละ อายุ บริวาร ถือว่าหนุนคนละเรื่องกัน
 *      นับว่าชื่อมีอักษรวรรคไหนมาก ก็รู้ว่าชื่อนี้หนุนเรื่องนั้น
 *
 * สิ่งที่เว็บนี้ไม่ทำ
 * - ไม่ให้คะแนนชื่อเป็นตัวเลข เพราะแต่ละสำนักให้คะแนนไม่ตรงกัน จะกลายเป็นเลขมั่ว
 * - ไม่บอกว่าต้องเปลี่ยนชื่อ เพราะการเปลี่ยนชื่อเป็นเรื่องใหญ่และเป็นสิทธิ์ของเจ้าตัว
 *   บอกได้แค่ว่าตามตำราแล้วชื่อนี้มีจุดไหนบ้าง
 */

import { TaksaEngine, TAKSA_PLANETS } from './thai-taksa.js';

/** ตำแหน่งทักษาที่ถือว่าหนุน พร้อมเรื่องที่หนุน */
const SUPPORT_POSITIONS = {
  boriwan: { labelTh: 'บริวาร', supportTh: 'คนรอบตัว ลูกน้อง ทีมงาน คนที่คอยช่วยเรา' },
  ayu: { labelTh: 'อายุ', supportTh: 'สุขภาพ ความเป็นอยู่ และอายุยืน' },
  dech: { labelTh: 'เดช', supportTh: 'อำนาจ บารมี ความน่าเชื่อถือ คนยอมรับ' },
  si: { labelTh: 'ศรี', supportTh: 'เสน่ห์ ทรัพย์สิน โชคลาภ ความรัก' },
  mula: { labelTh: 'มูละ', supportTh: 'หลักทรัพย์ รากฐาน มรดก ที่ดิน' },
  utsaha: { labelTh: 'อุตสาหะ', supportTh: 'ความขยัน ความพยายาม ผลจากการลงแรง' },
  montri: { labelTh: 'มนตรี', supportTh: 'ผู้ใหญ่อุปถัมภ์ เจ้านาย คนที่ดันเรา' }
};

/** ตัดอักขระที่ไม่ใช่ตัวอักษรไทยออก เหลือเฉพาะที่ตำรานับ */
function thaiLettersOf(text) {
  return [...String(text || '')].filter(ch => /[ก-์]/.test(ch));
}

/** หาว่าอักษรตัวนี้อยู่วรรคของดาวดวงไหน */
function planetOfLetter(letter) {
  for (const planet of Object.values(TAKSA_PLANETS)) {
    if ((planet.letters || []).includes(letter)) return planet;
  }
  return null;
}

export class ThaiNameEngine {
  /**
   * วิเคราะห์ชื่อเทียบกับวันเกิด
   *
   * @param {string} name ชื่อจริงภาษาไทย
   * @param {string} birthDate วันเกิดรูปแบบมาตรฐาน
   * @param {string} [birthTime] เวลาเกิด ใช้ตัดกรณีเกิดวันพุธกลางคืน
   */
  static analyze(name, birthDate, birthTime = null) {
    const raw = String(name || '').trim();

    if (!raw) {
      return {
        available: false,
        reasonTh: 'ยังไม่ได้กรอกชื่อ ระบบจึงวิเคราะห์ชื่อให้ไม่ได้'
      };
    }

    const letters = thaiLettersOf(raw);
    if (letters.length === 0) {
      return {
        available: false,
        reasonTh: 'ตำราทักษาใช้ได้กับชื่อภาษาไทยเท่านั้น เพราะแบ่งวรรคจากพยัญชนะและสระไทย '
          + 'ถ้ากรอกเป็นภาษาอื่น ระบบจะไม่แปลงให้ เพราะการแปลงจะทำให้ผลเพี้ยน'
      };
    }

    if (!birthDate) {
      return {
        available: false,
        reasonTh: 'การดูชื่อตามทักษาต้องรู้วันเกิดก่อน เพราะอักษรกาลกิณีของแต่ละคนไม่เหมือนกัน '
          + 'ขึ้นกับว่าเกิดวันอะไร ระบบจึงยังบอกไม่ได้ว่าชื่อนี้ถูกโฉลกกับคุณหรือไม่'
      };
    }

    const taksa = TaksaEngine.calculate(birthDate, birthTime);
    const kalakiniPlanetId = taksa.byId.kalakini.planetId;
    const kalakiniPlanet = TAKSA_PLANETS[kalakiniPlanetId];

    // แผนที่ว่าดาวดวงไหนตกตำแหน่งทักษาอะไรของคนนี้
    const planetToPosition = {};
    Object.entries(taksa.byId).forEach(([positionId, info]) => {
      planetToPosition[info.planetId] = positionId;
    });

    // ไล่ทีละตัวอักษร ว่าตกวรรคไหนและหนุนเรื่องอะไร
    const breakdown = [];
    const kalakiniLetters = [];
    const supportCount = {};

    letters.forEach(ch => {
      const planet = planetOfLetter(ch);
      if (!planet) return;

      const positionId = planetToPosition[planet.id];
      const isKalakini = planet.id === kalakiniPlanetId;

      if (isKalakini && !kalakiniLetters.includes(ch)) kalakiniLetters.push(ch);

      if (!isKalakini && SUPPORT_POSITIONS[positionId]) {
        supportCount[positionId] = (supportCount[positionId] || 0) + 1;
      }

      breakdown.push({
        letter: ch,
        planetTh: planet.shortTh,
        varkaTh: planet.varkaTh,
        positionTh: positionId
          ? (SUPPORT_POSITIONS[positionId]?.labelTh || (isKalakini ? 'กาลกิณี' : positionId))
          : null,
        isKalakini
      });
    });

    const supports = Object.entries(supportCount)
      .sort((a, b) => b[1] - a[1])
      .map(([positionId, count]) => ({
        positionId,
        labelTh: SUPPORT_POSITIONS[positionId].labelTh,
        supportTh: SUPPORT_POSITIONS[positionId].supportTh,
        count
      }));

    // สรุปตามตำรา ไม่ให้คะแนนตัวเลข เพราะแต่ละสำนักให้ไม่ตรงกัน
    const hasKalakini = kalakiniLetters.length > 0;
    let verdictTh;
    let verdictDetailTh;
    let level;

    if (!hasKalakini && supports.length >= 3) {
      level = 'great';
      verdictTh = 'ชื่อนี้ถูกโฉลกกับวันเกิดคุณดีมาก';
      verdictDetailTh = 'ไม่มีอักษรกาลกิณีเลย และมีอักษรที่หนุนหลายด้าน '
        + 'ตามตำราถือว่าเป็นชื่อที่ส่งเสริมเจ้าของชื่อ';
    } else if (!hasKalakini) {
      level = 'good';
      verdictTh = 'ชื่อนี้ไม่ขัดกับวันเกิดคุณ';
      verdictDetailTh = 'ไม่มีอักษรกาลกิณีปนอยู่เลย ตามตำราถือว่าใช้ได้ ไม่มีอะไรต้องแก้';
    } else if (kalakiniLetters.length === 1) {
      level = 'watch';
      verdictTh = 'ชื่อนี้มีอักษรกาลกิณีปนอยู่ 1 ตัว';
      verdictDetailTh = 'ตำราถือว่าเป็นจุดที่ทำให้ติดขัดได้บ้าง แต่ไม่ได้แปลว่าชื่อเสีย '
        + 'เพราะยังมีอักษรที่หนุนอยู่ด้วย หลายคนใช้ชื่อแบบนี้แล้วชีวิตดีก็มี';
    } else {
      level = 'careful';
      verdictTh = 'ชื่อนี้มีอักษรกาลกิณีปนอยู่ ' + kalakiniLetters.length + ' ตัว';
      verdictDetailTh = 'ตำราถือว่าเป็นจุดที่ควรรู้ไว้ ถ้าคิดจะตั้งชื่อลูกหรือชื่อร้าน '
        + 'ให้เลี่ยงอักษรกลุ่มนี้ ส่วนชื่อตัวเองจะเปลี่ยนหรือไม่เป็นสิทธิ์ของคุณ '
        + 'เว็บนี้ไม่แนะนำให้เปลี่ยน เพราะเป็นเรื่องใหญ่และมีค่าใช้จ่ายตามมา';
    }

    // คำแนะนำที่ทำได้จริง แยกตามว่าชื่อมีอักษรกาลกิณีหรือไม่
    const adviceStepsTh = hasKalakini
      ? [
        'ชื่อที่ใช้อยู่ไม่จำเป็นต้องเปลี่ยน คนจำนวนมากมีอักษรกาลกิณีในชื่อแล้วชีวิตดีก็มี '
          + 'เพราะชื่อเป็นแค่ปัจจัยเดียวจากหลายปัจจัยในดวง',
        'ถ้าจะตั้งชื่อลูก ชื่อร้าน ชื่อเพจ หรือชื่อบริษัท ให้เลี่ยงอักษรกลุ่มนี้ตั้งแต่แรก '
          + 'จะง่ายกว่าการมาแก้ทีหลัง',
        'ถ้าอยากเสริมโดยไม่เปลี่ยนชื่อจริง ตำราแนะนำให้ใช้ชื่อเล่นหรือชื่อที่ใช้ในงาน '
          + 'ที่ประกอบด้วยอักษรวรรคที่หนุน แล้วให้คนเรียกชื่อนั้นบ่อย ๆ',
        'อีกวิธีที่ตำราไทยใช้คือเสริมด้วยสีมงคลประจำวันเกิดแทน '
          + 'ใส่สีที่ถูกโฉลกในวันสำคัญ และเลี่ยงสีกาลกิณีของตัวเอง'
      ]
      : [
        'ชื่อนี้ไม่มีอักษรที่ขัดกับวันเกิดคุณ ตามตำราถือว่าใช้ได้ ไม่ต้องแก้อะไร',
        'ถ้าจะตั้งชื่อลูกหรือชื่อกิจการ ให้ใช้หลักเดียวกันนี้ คือเลี่ยงอักษรวรรคกาลกิณี '
          + 'ของวันเกิดคนคนนั้น ซึ่งแต่ละคนไม่เหมือนกัน',
        'อยากเสริมเพิ่มให้ใส่สีมงคลประจำวันเกิดในวันสำคัญ เช่น วันสัมภาษณ์งานหรือวันเซ็นสัญญา'
      ];

    // อธิบายว่าอักษรที่หนุนแต่ละกลุ่มแปลว่าอะไรในชีวิตจริง
    const supportSummaryTh = supports.length
      ? 'ชื่อนี้มีอักษรที่หนุนด้าน' + supports.map(sp => sp.labelTh).join(' ')
        + ' โดยกลุ่มที่เด่นที่สุดคือ' + supports[0].labelTh
        + ' ซึ่งตำราว่าเกี่ยวกับ' + supports[0].supportTh
        + ' หมายความว่าชื่อนี้จะช่วยหนุนเรื่องนี้ให้เด่นกว่าด้านอื่นในชีวิตคุณ'
      : 'ชื่อนี้ไม่มีอักษรที่ตกวรรคหนุนเด่นชัด ตำราถือว่าเป็นชื่อกลาง ๆ '
        + 'ไม่ได้หนุนด้านใดเป็นพิเศษและไม่ได้ขัดด้านใด';

    return {
      available: true,
      nameTh: raw,
      adviceStepsTh,
      supportSummaryTh,
      letterCount: letters.length,
      breakdown,
      kalakiniLetters,
      kalakiniPlanetTh: kalakiniPlanet ? kalakiniPlanet.shortTh : null,
      kalakiniVarkaTh: kalakiniPlanet ? kalakiniPlanet.varkaTh : null,
      kalakiniAllLetters: kalakiniPlanet ? kalakiniPlanet.letters : [],
      supports,
      level,
      verdictTh,
      verdictDetailTh,
      birthDayTh: taksa.weekdayNameTh,
      isWednesdayNight: taksa.isWednesdayNight,
      sourceTh: 'ทักษาปกรณ์ ตำราโหราศาสตร์ไทย แบ่งอักษรไทยเป็นแปดวรรคตามดาวพระเคราะห์',
      methodNoteTh: 'ระบบดูสองอย่างคือ ชื่อมีอักษรวรรคกาลกิณีของคุณไหม '
        + 'และมีอักษรที่ตกวรรคหนุนด้านไหนบ้าง เว็บนี้ไม่ให้คะแนนชื่อเป็นตัวเลข '
        + 'เพราะแต่ละสำนักให้คะแนนไม่ตรงกัน ถ้าให้ไปก็จะกลายเป็นเลขที่เว็บคิดขึ้นเอง'
    };
  }
}
