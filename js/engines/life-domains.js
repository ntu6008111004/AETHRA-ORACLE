/**
 * AETHRA ORACLE — คำอ่านแยกตามด้านของชีวิต (Life Domains)
 * ------------------------------------------------------------------
 * นี่คือหัวใจของเว็บ: แปลงตัวเลขและศัพท์โหราศาสตร์ให้กลายเป็น
 * "คำตอบที่คนธรรมดาอ่านแล้วเอาไปใช้ได้จริง" แยกเป็น 5 ด้านที่คนไทยถามมากที่สุด
 *
 *   1) การงาน   2) การเงิน   3) ความรัก   4) สุขภาพ   5) โชคลาภและจังหวะชีวิต
 *
 * กติกาสำคัญ:
 *   - ทุกข้อความต้องบอกได้ว่า "มาจากไหน" (sources) เพื่อให้ผู้ใช้เห็นที่มา
 *   - ห้ามเดาสิ่งที่คำนวณไม่ได้ ถ้าไม่ทราบเวลาเกิดต้องบอกตรง ๆ ว่าส่วนไหนหายไป
 *   - เลขมงคลมาจากเลขประจำดาวในตำแหน่งทักษาที่ดี ไม่ใช่สุ่มขึ้นมา
 *   - ทิศมงคลมาจากธาตุที่ควรเสริมในดวงจีน ตามการจับคู่ธาตุ-ทิศมาตรฐาน
 */

import { TaksaEngine } from './thai-taksa.js';
import { BaZiEngine, FIVE_ELEMENTS } from './bazi.js';
import { ChineseZodiacEngine } from './chinese-zodiac.js';
import { ThaiAstrologyEngine } from './thai-astrology.js';
import { CompatibilityEngine } from './compatibility.js';
import { NumerologyEngine } from './numerology.js';

/** การจับคู่ธาตุกับทิศตามตำราจีน (ใช้หาทิศมงคล) */
export const ELEMENT_DIRECTIONS = {
  Wood: 'ทิศตะวันออก',
  Fire: 'ทิศใต้',
  Earth: 'ทิศตะวันออกเฉียงเหนือ และทิศตะวันตกเฉียงใต้',
  Metal: 'ทิศตะวันตก',
  Water: 'ทิศเหนือ'
};

/** เลขประจำดาวตามเลขศาสตร์ไทย ใช้หาเลขมงคลจากผังทักษา */
export const PLANET_NUMBERS = {
  sun: 1, moon: 2, mars: 3, mercury: 4, jupiter: 5, venus: 6, saturn: 7, rahu: 8
};

function pct(value, min = 35, max = 95) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** หาสิบเทพที่ปรากฏในดวง เพื่อใช้ตอบเรื่องงานและเงิน */
function collectGods(bazi) {
  const keys = bazi.tenGods.map(g => g.godKey).filter(Boolean);
  return {
    has: (...names) => names.some(n => keys.includes(n)),
    count: (name) => keys.filter(k => k === name).length,
    keys
  };
}

export class LifeDomainsEngine {
  /**
   * สร้างคำอ่านครบทุกด้านจากโปรไฟล์เดียว
   * @param {object} profile ต้องมี birthDate อย่างน้อย
   */
  static analyze(profile) {
    const { birthDate, birthTime, lat, lon, gender, name, nickname, relationshipStatus } = profile;

    if (!birthDate) {
      return {
        available: false,
        reasonTh: 'ยังไม่ทราบวันเกิดของคุณ ระบบจึงยังคำนวณดวงส่วนตัวไม่ได้ และจะไม่เดาวันเกิดแทนคุณ กรุณากรอกวันเดือนปีเกิดก่อน',
        domains: null
      };
    }

    const hasTime = /^\d{1,2}:\d{2}$/.test(String(birthTime || ''));
    const taksa = TaksaEngine.calculate(birthDate, birthTime);
    const bazi = BaZiEngine.calculatePillars(birthDate, hasTime ? birthTime : '12:00');
    const zodiac = ChineseZodiacEngine.getZodiac(birthDate, birthTime || '12:00');
    const thai = ThaiAstrologyEngine.analyze({ birthDate, birthTime, lat, lon });
    const numerology = NumerologyEngine.analyze(name || nickname || '', birthDate);
    const gods = collectGods(bazi);
    const houses = thai.houses.available ? thai.houses.byNumber : null;
    const luck = BaZiEngine.calculateLuckPillars(bazi, gender || 'unspecified', 8);

    const dmElement = FIVE_ELEMENTS[bazi.dayMaster.element];
    const favDirections = [...new Set(bazi.favourableElements.map(e => ELEMENT_DIRECTIONS[e]))];

    // เลขมงคลจากดาวในตำแหน่งทักษาที่ดี
    const goodNumbers = [...new Set(
      ['dech', 'si', 'mula', 'montri'].map(k => PLANET_NUMBERS[taksa.byId[k].planetId])
    )].sort((a, b) => a - b);
    const badNumber = PLANET_NUMBERS[taksa.byId.kalakini.planetId];

    const currentYear = new Date().getFullYear();
    const age = currentYear - Number(birthDate.slice(0, 4));
    const currentLuck = luck.find(l => age >= l.ageFrom && age <= l.ageTo) || luck[0];
    const chong = ChineseZodiacEngine.checkChong(birthDate, birthTime || '12:00', currentYear);

    return {
      available: true,
      meta: { taksa, bazi, zodiac, thai, numerology, luck, currentLuck, chong, age, hasTime },
      domains: {
        career: this.buildCareer({ taksa, bazi, zodiac, houses, numerology, gods, dmElement, currentLuck, hasTime }),
        money: this.buildMoney({ taksa, bazi, houses, gods, dmElement, favDirections, goodNumbers, badNumber, currentLuck }),
        love: this.buildLove({ taksa, bazi, zodiac, houses, gods, gender, relationshipStatus, birthDate, birthTime, hasTime }),
        health: this.buildHealth({ taksa, bazi, thai, dmElement }),
        luck: this.buildLuck({ taksa, bazi, zodiac, chong, goodNumbers, badNumber, favDirections, currentLuck, houses })
      }
    };
  }

  // ---------------------------------------------------------------- การงาน
  static buildCareer({ taksa, bazi, zodiac, houses, numerology, gods, dmElement, currentLuck, hasTime }) {
    const dech = taksa.byId.dech;
    const montri = taksa.byId.montri;
    const utsaha = taksa.byId.utsaha;

    const isOrganisation = gods.has('directOfficer', 'directResource');
    const isEntrepreneur = gods.has('indirectWealth', 'hurtingOfficer', 'sevenKillings');

    let styleTh;
    if (isOrganisation && !isEntrepreneur) {
      styleTh = 'ดวงคุณมีดาวสายตำแหน่งหน้าที่ (เจิ้งกวน) หรือดาวผู้อุปถัมภ์ (เจิ้งอิ้น) เด่น แปลว่าคุณ "รุ่งในระบบ" มากกว่าลุยเดี่ยว คือทำงานในองค์กร บริษัท หรือราชการแล้วจะไปได้ไกล เพราะมีคนเห็นคุณค่าและดันคุณขึ้น';
    } else if (isEntrepreneur && !isOrganisation) {
      styleTh = 'ดวงคุณมีดาวสายทรัพย์ลอย (เพียนไฉ) หรือดาวท้าทายอำนาจ (ซางกวน) เด่น แปลว่าคุณ "รุ่งเมื่อได้เป็นนายตัวเอง" ไม่ค่อยชอบถูกสั่ง และจะทำได้ดีกว่าเมื่อรายได้ผูกกับผลงาน เช่น ค้าขาย ฟรีแลนซ์ งานคอมมิชชัน';
    } else if (isEntrepreneur && isOrganisation) {
      styleTh = 'ดวงคุณมีทั้งดาวสายตำแหน่ง และดาวสายทำเอง แปลว่าคุณทำได้ทั้งสองแบบ เส้นทางที่เหมาะที่สุดคือ "เริ่มจากในระบบเพื่อเก็บประสบการณ์และคอนเนกชัน แล้วค่อยออกมาทำเอง" ไม่ใช่ออกมาตั้งแต่แรก';
    } else {
      styleTh = 'ดวงคุณเน้นการพึ่งพาความสามารถของตัวเองและกลุ่มเพื่อนร่วมทาง เหมาะกับงานที่ได้ทำเป็นทีมเล็ก ๆ หรืองานที่วัดผลกันที่ฝีมือจริง มากกว่างานที่ต้องแข่งเรื่องตำแหน่ง';
    }

    const houseNote = houses
      ? 'ภพการงานของคุณ (ภพที่ 10 กัมมะ) ตกราศี' + houses[10].signNameTh + ' เจ้าเรือนคือ' + houses[10].rulerTh
        + ' บ่งว่าสไตล์การทำงานของคุณจะออกแนว ' + houses[10].signTraitTh
      : 'ยังดูภพการงาน (ภพที่ 10) ไม่ได้ เพราะต้องใช้เวลาเกิดที่แน่นอนมาคำนวณลัคนาก่อน';

    return {
      id: 'career',
      icon: 'briefcase',
      titleTh: 'การงาน',
      subtitleTh: 'คุณเหมาะกับงานแบบไหน และจะรุ่งทางไหน',
      score: pct(currentLuck.isFavourable ? 82 : 64),
      headlineTh: 'ธาตุประจำตัวคุณคือธาตุ' + dmElement.nameTh + ' ' + dmElement.meaningTh,
      sections: [
        {
          headingTh: 'สายงานที่ถูกกับธาตุประจำตัวคุณ',
          bodyTh: 'ธาตุ' + dmElement.nameTh + ' เหมาะกับ ' + dmElement.careerTh
            + ' — ไม่ได้แปลว่าห้ามทำงานอื่น แต่แปลว่าถ้าทำสายนี้จะรู้สึกว่า "ใช่" และไปได้เร็วกว่า',
          sourceTh: 'มาจาก: ธาตุประจำตัว (เสาวัน) ในดวงจีนโป๊ยหยี่'
        },
        {
          headingTh: 'คุณเหมาะเป็นลูกจ้างหรือเจ้าของกิจการ',
          bodyTh: styleTh,
          sourceTh: 'มาจาก: สิบเทพ (十神) ที่ปรากฏในดวงจีนของคุณ'
        },
        {
          headingTh: 'สไตล์การทำงานตามภพการงาน',
          bodyTh: houseNote,
          sourceTh: 'มาจาก: ภพที่ 10 (กัมมะ) ในโหราศาสตร์ไทย นับจากลัคนา'
        },
        {
          headingTh: 'นิสัยการทำงานตามปีนักษัตร',
          bodyTh: 'คุณเกิดปี' + zodiac.nameTh + ' (' + zodiac.animalTh + ') จุดแข็งในที่ทำงานคือ '
            + zodiac.profile.strengthTh + ' ส่วนจุดที่ต้องระวังคือ ' + zodiac.profile.cautionTh
            + ' สายงานที่มักไปได้ดีคือ ' + zodiac.profile.careerTh,
          sourceTh: 'มาจาก: ปีนักษัตรจีน คำนวณโดยยึดวันลี่ชุนเป็นเส้นแบ่งปี'
        },
        {
          headingTh: 'จังหวะการงานช่วงนี้',
          bodyTh: 'ตอนนี้คุณอยู่ในรอบโชคชะตา 10 ปีชื่อ ' + currentLuck.nameTh + ' (อายุ ' + currentLuck.ageFrom + '-' + currentLuck.ageTo + ' ปี) '
            + currentLuck.verdictTh + ' ดาวเด่นของรอบนี้คือ ' + currentLuck.god.nameTh + ' ซึ่งเกี่ยวกับ ' + currentLuck.god.domainTh,
          sourceTh: 'มาจาก: ต้าอวิ้น (大運) รอบโชคชะตา 10 ปีในดวงจีน'
        }
      ],
      doThisTh: [
        'ใส่' + dech.colorName + ' (สีเดช) ในวันที่ต้องสัมภาษณ์งาน นำเสนองาน หรือขอตำแหน่ง — ' + dech.exampleTh,
        'ใส่' + montri.colorName + ' (สีมนตรี) ในวันที่ต้องพึ่งผู้ใหญ่ ขอขึ้นเงินเดือน หรือติดต่อราชการ',
        'ใส่' + utsaha.colorName + ' (สีอุตสาหะ) ในวันที่ต้องสู้งานหนักหรือส่งงานใหญ่',
        'เลขที่ควรใช้ในเรื่องงาน เช่น เลือกโต๊ะ เลือกวันนัด คือเลข ' + PLANET_NUMBERS[taksa.byId.dech.planetId]
      ],
      avoidThisTh: [
        'เลี่ยง' + taksa.byId.kalakini.colorName + ' (สีกาลกิณี) ในวันสำคัญเรื่องงาน',
        zodiac.profile.cautionTh + ' — ข้อนี้คือจุดที่มักทำให้เสียโอกาสในที่ทำงาน'
      ],
      needsMoreDataTh: hasTime ? null : 'ถ้าใส่เวลาเกิดที่แน่นอน ระบบจะคำนวณภพการงาน (ภพที่ 10) และเสายามให้ด้วย ทำให้อ่านเรื่องงานได้ละเอียดกว่านี้มาก'
    };
  }

  // ---------------------------------------------------------------- การเงิน
  static buildMoney({ taksa, bazi, houses, gods, dmElement, favDirections, goodNumbers, badNumber, currentLuck }) {
    const mula = taksa.byId.mula;
    const si = taksa.byId.si;

    const hasDirect = gods.has('directWealth');
    const hasIndirect = gods.has('indirectWealth');
    const hasRob = gods.has('rob');

    let incomeStyleTh;
    if (hasDirect && !hasIndirect) {
      incomeStyleTh = 'ดวงคุณเด่นดาว "เจิ้งไฉ" (ทรัพย์ประจำ) แปลว่าเงินของคุณมาแบบสม่ำเสมอ เช่น เงินเดือน ค่าเช่า เงินปันผล คุณเก็บเงินอยู่และมีวินัยดี แต่จะรวยเร็วยาก ทางที่เหมาะคือสะสมทีละน้อยแล้วให้ดอกเบี้ยทบต้นทำงานแทน';
    } else if (hasIndirect && !hasDirect) {
      incomeStyleTh = 'ดวงคุณเด่นดาว "เพียนไฉ" (ทรัพย์ลอย) แปลว่าเงินก้อนใหญ่ของคุณมาจากการค้าขาย กำไร โบนัส หรือคอมมิชชัน มากกว่าเงินเดือน ข้อดีคือมีโอกาสได้ก้อนโต ข้อเสียคือรายได้ไม่แน่นอน ต้องกันเงินสำรองไว้อย่างน้อย 6 เดือน';
    } else if (hasDirect && hasIndirect) {
      incomeStyleTh = 'ดวงคุณมีทั้งดาวทรัพย์ประจำและทรัพย์ลอย แปลว่าคุณเหมาะกับการมี "รายได้สองทาง" คือมีงานประจำเป็นฐาน แล้วมีงานเสริมหรือการลงทุนเป็นตัวเร่ง รูปแบบนี้จะทำให้การเงินคุณแข็งแรงที่สุด';
    } else {
      incomeStyleTh = 'ดวงคุณไม่ได้เด่นดาวทรัพย์โดยตรง แปลว่าเงินจะมาจาก "ฝีมือและความสามารถ" ของคุณเองมากกว่าโชค ทางที่เหมาะคือลงทุนกับทักษะตัวเอง ทำให้เก่งจนคนยอมจ่ายแพง แล้วเงินจะตามมาเอง';
    }

    const robWarning = hasRob
      ? 'ดวงคุณมีดาว "เจี๋ยไฉ" (แย่งทรัพย์) ปรากฏอยู่ นี่คือสัญญาณที่ตำราเตือนเรื่องการเสียเงินให้คนใกล้ตัว ควรระวังการค้ำประกัน การให้ยืมเงิน และการลงทุนร่วมกับเพื่อนแบบไม่มีสัญญา'
      : 'ดวงคุณไม่มีดาวแย่งทรัพย์เด่น ถือว่าความเสี่ยงเรื่องเงินรั่วไหลจากคนใกล้ตัวไม่สูงนัก แต่ก็ยังควรมีสัญญาเป็นลายลักษณ์อักษรเสมอ';

    const houseNote = houses
      ? 'ภพการเงินของคุณ (ภพที่ 2 กดุมภะ) ตกราศี' + houses[2].signNameTh + ' เจ้าเรือนคือ' + houses[2].rulerTh
        + ' และภพลาภลอย (ภพที่ 11 ลาภะ) ตกราศี' + houses[11].signNameTh
      : 'ยังดูภพการเงิน (ภพที่ 2) และภพลาภ (ภพที่ 11) ไม่ได้ เพราะต้องใช้เวลาเกิดที่แน่นอน';

    return {
      id: 'money',
      icon: 'coins',
      titleTh: 'การเงิน',
      subtitleTh: 'เงินจะเข้าทางไหน เก็บอยู่ไหม และรั่วตรงไหน',
      score: pct(currentLuck.isFavourable ? 78 : 58),
      headlineTh: incomeStyleTh.split(' แปลว่า')[0],
      sections: [
        { headingTh: 'เงินของคุณมาทางไหน', bodyTh: incomeStyleTh, sourceTh: 'มาจาก: ดาวทรัพย์ (เจิ้งไฉ / เพียนไฉ) ในสิบเทพของดวงจีน' },
        { headingTh: 'จุดที่เงินมักรั่วไหล', bodyTh: robWarning, sourceTh: 'มาจาก: ดาวเจี๋ยไฉ (แย่งทรัพย์) ในดวงจีน' },
        { headingTh: 'ภพการเงินตามโหราศาสตร์ไทย', bodyTh: houseNote, sourceTh: 'มาจาก: ภพที่ 2 (กดุมภะ) และภพที่ 11 (ลาภะ) นับจากลัคนา' },
        {
          headingTh: 'ธาตุที่ควรเสริมเพื่อให้การเงินไหลลื่น',
          bodyTh: 'ดวงคุณเป็น ' + bazi.strength.labelTh + ' ' + bazi.strength.plainTh
            + ' ธาตุที่ควรเสริมคือธาตุ' + bazi.favourableElementsTh.join(' และธาตุ')
            + ' ใช้ได้ผ่านสีเสื้อผ้า สีกระเป๋าตังค์ และการจัดโต๊ะทำงาน',
          sourceTh: 'มาจาก: การวิเคราะห์ความแข็งอ่อนของธาตุประจำตัว แล้วหาธาตุที่ควรเสริม (用神)'
        },
        {
          headingTh: 'ทิศที่ควรหันโต๊ะทำงานหรือหัวเตียง',
          bodyTh: favDirections.join(' และ ') + ' เป็นทิศที่ตรงกับธาตุที่ดวงคุณต้องการ ถ้าจัดโต๊ะทำงานหรือที่นั่งประจำให้หันไปทางนี้ ตำราถือว่าช่วยเรื่องจังหวะการเงิน',
          sourceTh: 'มาจาก: การจับคู่ธาตุที่ควรเสริมกับทิศตามตำราจีน'
        }
      ],
      doThisTh: [
        'ใช้' + mula.colorName + ' (สีมูละ) กับกระเป๋าสตางค์ หรือใส่ในวันที่ทำเรื่องเงินก้อน — ' + mula.exampleTh,
        'ใช้' + si.colorName + ' (สีศรี) ในวันที่ต้องเจรจาขอส่วนลด ขอเครดิต หรือปิดการขาย',
        'เลขมงคลด้านทรัพย์ของคุณคือ ' + goodNumbers.join(' ') + ' ใช้เลือกเลขบัญชี เลขบ้าน หรือเบอร์โทรได้',
        'กันเงินสำรองฉุกเฉินไว้อย่างน้อย 6 เดือนก่อนคิดลงทุนอะไรที่เสี่ยง'
      ],
      avoidThisTh: [
        'เลี่ยงเลข ' + badNumber + ' (เลขของดาวกาลกิณีคุณ) ในเรื่องที่เกี่ยวกับเงินโดยตรง',
        'เลี่ยง' + taksa.byId.kalakini.colorName + ' ในวันเซ็นสัญญาหรือทำธุรกรรมก้อนใหญ่',
        'อย่าค้ำประกันหรือให้ยืมเงินก้อนใหญ่โดยไม่มีเอกสาร แม้จะเป็นคนสนิทก็ตาม'
      ],
      needsMoreDataTh: houses ? null : 'ใส่เวลาเกิดที่แน่นอนแล้วระบบจะอ่านภพการเงินและภพลาภให้ครบ'
    };
  }

  // ---------------------------------------------------------------- ความรัก
  static buildLove({ taksa, bazi, zodiac, houses, gods, gender, relationshipStatus, birthDate, birthTime, hasTime }) {
    const si = taksa.byId.si;
    const isSingle = relationshipStatus !== 'partnered' && relationshipStatus !== 'married';
    const matches = CompatibilityEngine.findBestMatches(birthDate, birthTime || '12:00');

    // ในดวงจีน: ดวงชาย ดาวทรัพย์ = ภรรยา / ดวงหญิง ดาวตำแหน่ง = สามี
    const isMale = gender === 'yang' || gender === 'male';
    const partnerStarTh = isMale
      ? (gods.has('directWealth', 'indirectWealth')
        ? 'ดวงคุณมีดาวทรัพย์ปรากฏชัด ในดวงผู้ชายดาวนี้แทน "คู่ครอง" ด้วย แปลว่าเรื่องคู่ของคุณมีเกณฑ์ชัดเจน ไม่ใช่คนที่จะอยู่คนเดียวตลอด'
        : 'ดวงคุณไม่มีดาวทรัพย์เด่น ซึ่งในดวงผู้ชายดาวนี้แทนคู่ครอง แปลว่าเรื่องคู่อาจมาช้ากว่าเพื่อน หรือคุณเป็นคนเลือกมาก ไม่ใช่ว่าจะไม่มี')
      : (gods.has('directOfficer', 'sevenKillings')
        ? 'ดวงคุณมีดาวตำแหน่งหน้าที่ปรากฏชัด ในดวงผู้หญิงดาวนี้แทน "คู่ครอง" ด้วย แปลว่าเรื่องคู่ของคุณมีเกณฑ์ชัดเจน และมักได้คู่ที่มีหน้าที่การงานดี'
        : 'ดวงคุณไม่มีดาวตำแหน่งเด่น ซึ่งในดวงผู้หญิงดาวนี้แทนคู่ครอง แปลว่าเรื่องคู่อาจมาช้า หรือคุณให้ความสำคัญกับเรื่องอื่นมากกว่าในช่วงนี้');

    const houseNote = houses
      ? 'ภพคู่ครองของคุณ (ภพที่ 7 ปัตนิ) ตกราศี' + houses[7].signNameTh + ' เจ้าเรือนคือ' + houses[7].rulerTh
        + ' บ่งว่าคนที่เข้ากับคุณได้ดีมักมีลักษณะ ' + houses[7].signTraitTh
        + ' ส่วนภพความรักและความสนุก (ภพที่ 5 ปุตตะ) ตกราศี' + houses[5].signNameTh
      : 'ยังดูภพคู่ครอง (ภพที่ 7) ไม่ได้ เพราะต้องใช้เวลาเกิดที่แน่นอนมาคำนวณลัคนา';

    const statusSection = isSingle
      ? {
        headingTh: 'สำหรับคนโสด: เนื้อคู่คุณอยู่ทางไหน',
        bodyTh: matches.summaryTh + ' — วิธีใช้คือ ไม่ได้แปลว่าต้องคบเฉพาะปีเหล่านี้ แต่แปลว่าถ้าเจอคนปีที่ถูกโฉลก ความสัมพันธ์มักจะราบรื่นกว่าโดยไม่ต้องพยายามมาก ส่วนปีที่ชงกันก็อยู่ด้วยกันได้ เพียงแต่ต้องคุยกันเยอะขึ้น',
        sourceTh: 'มาจาก: กฎสามฮะ ลิ่วฮะ ชง และไห่ ของกิ่งดิน 12 ตัวตามตำราจีน'
      }
      : {
        headingTh: 'สำหรับคนมีคู่: สิ่งที่ควรดูแลตอนนี้',
        bodyTh: 'เมื่อมีคู่แล้ว สิ่งที่ตำราเน้นไม่ใช่ "ถูกโฉลกไหม" แต่คือ "คุณกำลังอยู่ในจังหวะไหน" นิสัยในความรักของคุณตามปีนักษัตรคือ '
          + zodiac.profile.loveTh + ' จุดที่มักทำให้ทะเลาะกันคือ ' + zodiac.profile.cautionTh
          + ' ถ้ารู้ตัวข้อนี้แล้วระวังไว้ ความสัมพันธ์จะยืดได้อีกยาว',
        sourceTh: 'มาจาก: ลักษณะนิสัยด้านความรักตามปีนักษัตร และดาวคู่ครองในดวงจีน'
      };

    return {
      id: 'love',
      icon: 'heart',
      titleTh: 'ความรัก',
      subtitleTh: isSingle ? 'เนื้อคู่เป็นคนแบบไหน และจะเจอเมื่อไหร่' : 'ความสัมพันธ์ตอนนี้ควรดูแลเรื่องอะไร',
      score: pct(matches.best.length * 12 + 55),
      headlineTh: 'นิสัยในความรักของคุณ: ' + zodiac.profile.loveTh,
      sections: [
        statusSection,
        { headingTh: 'ดาวคู่ครองในดวงจีนของคุณ', bodyTh: partnerStarTh, sourceTh: 'มาจาก: ดาวคู่ครองตามเพศในระบบสิบเทพของดวงจีน' },
        { headingTh: 'ภพคู่ครองตามโหราศาสตร์ไทย', bodyTh: houseNote, sourceTh: 'มาจาก: ภพที่ 7 (ปัตนิ) และภพที่ 5 (ปุตตะ) นับจากลัคนา' },
        {
          headingTh: 'เสน่ห์ของคุณมาจากไหน',
          bodyTh: 'ตำแหน่งศรีในผังทักษาของคุณคือ' + si.planetNameTh + ' ซึ่งให้พลังด้าน ' + si.planetTraitTh
            + ' นี่คือ "เสน่ห์ตามธรรมชาติ" ของคุณ ถ้าใช้จุดนี้เป็นจะดึงดูดคนได้โดยไม่ต้องฝืนเป็นคนอื่น',
          sourceTh: 'มาจาก: ตำแหน่งศรีในผังทักษาปกรณ์ คำนวณจากวันเกิดของคุณ'
        }
      ],
      doThisTh: [
        'ใส่' + si.colorName + ' (สีศรี) ในวันเดต วันเจอครอบครัวแฟน หรือวันถ่ายรูปโปรไฟล์ — ' + si.exampleTh,
        isSingle
          ? 'ถ้าอยากเปิดโอกาส ลองไปที่ที่ตรงกับสายงานของคนปี' + (matches.best[0]?.nameTh || zodiac.nameTh) + ' ซึ่งเป็นนักษัตรที่ถูกโฉลกกับคุณ'
          : 'จัดเวลาคุยกับคู่แบบไม่มีมือถืออย่างน้อยสัปดาห์ละครั้ง จุดอ่อนของปี' + zodiac.nameTh + ' คือมักละเลยเรื่องนี้',
        'พูดสิ่งที่ต้องการออกมาตรง ๆ แทนที่จะให้อีกฝ่ายเดา'
      ],
      avoidThisTh: [
        'เลี่ยง' + taksa.byId.kalakini.colorName + ' ในวันที่ต้องคุยเรื่องสำคัญกับคนรัก',
        zodiac.profile.cautionTh + ' — ข้อนี้คือสาเหตุที่ความสัมพันธ์ของคนปี' + zodiac.nameTh + ' มักสะดุด'
      ],
      needsMoreDataTh: hasTime ? null : 'ใส่เวลาเกิดแล้วระบบจะอ่านภพคู่ครอง (ภพที่ 7) ให้ด้วย ซึ่งเป็นภพที่บอกลักษณะเนื้อคู่ได้ตรงที่สุด'
    };
  }

  // ---------------------------------------------------------------- สุขภาพ
  static buildHealth({ taksa, bazi, thai, dmElement }) {
    const ayu = taksa.byId.ayu;
    const body = thai.bodyElement;
    const missing = bazi.missingElementsTh;
    const weakest = bazi.weakestElementTh;

    const balanceTh = missing.length
      ? 'ดวงจีนของคุณขาดธาตุ' + missing.join(' และธาตุ') + ' ซึ่งตำราถือว่าเป็นจุดที่ร่างกายและชีวิตอาจไม่สมดุล ควรเสริมด้วยสี อาหาร และกิจกรรมที่ตรงกับธาตุนั้น'
      : 'ดวงจีนของคุณมีครบทั้ง 5 ธาตุ ถือว่าสมดุลดี แต่ธาตุที่อ่อนที่สุดคือธาตุ' + weakest + ' จึงควรดูแลด้านนี้เป็นพิเศษ';

    return {
      id: 'health',
      icon: 'heartbeat',
      titleTh: 'สุขภาพ',
      subtitleTh: 'ร่างกายคุณเป็นแบบไหน ควรกินอะไร ระวังอะไร',
      score: pct(missing.length ? 62 : 80),
      headlineTh: 'คุณเป็นคน' + body.nameTh + ' — ' + body.natureTh,
      sections: [
        {
          headingTh: 'ธาตุเจ้าเรือนของคุณ (ตำราแพทย์แผนไทย)',
          bodyTh: 'คุณ' + body.monthsTh + ' จึงเป็นคน' + body.nameTh + ' ลักษณะร่างกายมักเป็น ' + body.bodyTh
            + ' ส่วนนิสัยคือ ' + body.personalityTh,
          sourceTh: 'มาจาก: ตำราแพทย์แผนไทย ซึ่งแบ่งธาตุเจ้าเรือนตามเดือนเกิด'
        },
        {
          headingTh: 'โรคและอาการที่ควรระวัง',
          bodyTh: body.healthTh + ' — ข้อนี้ไม่ใช่การวินิจฉัยโรค เป็นเพียงแนวโน้มตามตำรา ถ้ามีอาการจริงต้องไปพบแพทย์',
          sourceTh: 'มาจาก: ลักษณะธาตุเจ้าเรือนตามแพทย์แผนไทย'
        },
        { headingTh: 'อาหารที่เหมาะกับธาตุคุณ', bodyTh: body.foodTh, sourceTh: 'มาจาก: หลักการปรับสมดุลธาตุด้วยรสอาหารในแพทย์แผนไทย' },
        { headingTh: 'วิธีปรับสมดุล', bodyTh: body.balanceTh, sourceTh: 'มาจาก: หลักการปรับสมดุลธาตุเจ้าเรือน' },
        { headingTh: 'ความสมดุลธาตุในดวงจีน', bodyTh: balanceTh, sourceTh: 'มาจาก: การนับกำลังธาตุจากก้านฟ้าและสารซ่อนในกิ่งดินทั้ง 4 เสา' }
      ],
      doThisTh: [
        'ใส่' + ayu.colorName + ' (สีอายุ) ในวันไปตรวจสุขภาพหรือวันเดินทางไกล — ' + ayu.exampleTh,
        'ปรับอาหารตามธาตุ: ' + body.foodTh,
        body.balanceTh
      ],
      avoidThisTh: [
        'เลี่ยงพฤติกรรมที่ทำให้ธาตุ' + body.nameTh.replace('ธาตุ', '') + 'กำเริบ ตามที่ระบุในหัวข้ออาการที่ควรระวัง',
        'อย่าใช้คำทำนายนี้แทนการไปพบแพทย์ ถ้ามีอาการผิดปกติให้ไปตรวจจริง'
      ],
      disclaimerTh: 'ส่วนนี้เป็นความเชื่อตามตำราแพทย์แผนไทยและโหราศาสตร์ ไม่ใช่คำวินิจฉัยทางการแพทย์',
      needsMoreDataTh: null
    };
  }

  // ------------------------------------------------- โชคลาภและจังหวะชีวิต
  static buildLuck({ taksa, bazi, zodiac, chong, goodNumbers, badNumber, favDirections, currentLuck, houses }) {
    const si = taksa.byId.si;
    const mula = taksa.byId.mula;

    return {
      id: 'luck',
      icon: 'sparkle',
      titleTh: 'โชคลาภและจังหวะชีวิต',
      subtitleTh: 'ปีนี้ดวงเป็นยังไง ชงไหม เลขอะไรดี',
      score: pct(chong.isChong ? 52 : (currentLuck.isFavourable ? 85 : 68)),
      headlineTh: chong.headlineTh,
      sections: [
        { headingTh: 'ปีนี้คุณชงหรือไม่', bodyTh: chong.adviceTh, sourceTh: 'มาจาก: กฎการปะทะของกิ่งดิน 12 ตัว เทียบปีนักษัตรของคุณกับปีปัจจุบัน' },
        {
          headingTh: 'รอบโชคชะตา 10 ปีของคุณตอนนี้',
          bodyTh: 'คุณอยู่ในรอบ ' + currentLuck.nameTh + ' ช่วงอายุ ' + currentLuck.ageFrom + '-' + currentLuck.ageTo
            + ' ปี (ประมาณปี ค.ศ. ' + currentLuck.yearFrom + '-' + currentLuck.yearTo + ') ' + currentLuck.verdictTh
            + ' ดาวประจำรอบคือ ' + currentLuck.god.nameTh + ' เกี่ยวกับ ' + currentLuck.god.domainTh + ' — ' + currentLuck.god.lifeTh,
          sourceTh: 'มาจาก: ต้าอวิ้น (大運) คำนวณจากเสาเดือนและระยะถึงสารทจริง'
        },
        {
          headingTh: 'เลขมงคลของคุณ',
          bodyTh: 'เลข ' + goodNumbers.join(' ') + ' เป็นเลขประจำดาวที่อยู่ในตำแหน่งดีของผังทักษาคุณ (เดช ศรี มูละ มนตรี) '
            + 'ส่วนเลข ' + badNumber + ' เป็นเลขของดาวกาลกิณี ควรเลี่ยงในเรื่องสำคัญ '
            + 'ใช้เลือกเบอร์โทร เลขบ้าน เลขทะเบียนรถ หรือเลขบัญชีได้',
          sourceTh: 'มาจาก: เลขประจำดาวตามเลขศาสตร์ไทย จับคู่กับตำแหน่งทักษาที่คำนวณจากวันเกิดคุณ'
        },
        {
          headingTh: 'ทิศมงคลของคุณ',
          bodyTh: favDirections.join(' และ ') + ' — ใช้จัดโต๊ะทำงาน หัวเตียง หรือเลือกที่นั่งประจำ',
          sourceTh: 'มาจาก: ธาตุที่ควรเสริมในดวงจีน จับคู่กับทิศตามตำราจีน'
        },
        {
          headingTh: 'สีมงคลครบทุกด้านของคุณ',
          bodyTh: 'สีเดช (การงาน อำนาจ) = ' + taksa.byId.dech.colorName
            + ' / สีศรี (เสน่ห์ โชคลาภ) = ' + si.colorName
            + ' / สีมูละ (ทรัพย์สิน) = ' + mula.colorName
            + ' / สีมนตรี (ผู้ใหญ่ช่วย) = ' + taksa.byId.montri.colorName
            + ' / สีอายุ (สุขภาพ) = ' + taksa.byId.ayu.colorName
            + ' และสีที่ต้องเลี่ยงคือ ' + taksa.byId.kalakini.colorName,
          sourceTh: 'มาจาก: ผังทักษาปกรณ์ทั้ง 8 ตำแหน่ง คำนวณจาก' + taksa.weekdayNameTh + 'ที่คุณเกิด'
        }
      ],
      doThisTh: [
        'ใช้เลข ' + goodNumbers.join(' ') + ' กับสิ่งที่ต้องเลือกเลข เช่น เบอร์โทร ทะเบียนรถ เลขที่นั่ง',
        'หันโต๊ะทำงานหรือหัวเตียงไปทาง' + favDirections[0],
        chong.isChong ? 'ปีนี้ชง แนะนำทำบุญสะเดาะเคราะห์เพื่อความสบายใจ และเพิ่มความระมัดระวังในการตัดสินใจเรื่องใหญ่' : 'ปีนี้ไม่ชง เป็นจังหวะที่เหมาะกับการวางแผนระยะยาว'
      ],
      avoidThisTh: [
        'เลี่ยงเลข ' + badNumber + ' และ' + taksa.byId.kalakini.colorName + ' ในเรื่องสำคัญ',
        chong.isChong ? 'ปีชง เลี่ยงการค้ำประกัน การลงทุนก้อนใหญ่แบบไม่ศึกษา และความประมาทในการเดินทาง' : 'อย่าประมาทแม้ปีนี้จะไม่ชง'
      ],
      needsMoreDataTh: null
    };
  }
}
