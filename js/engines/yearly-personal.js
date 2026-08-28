/**
 * AETHRA ORACLE — ดวงปีนี้เฉพาะบุคคล
 * ------------------------------------------------------------------
 * คนไทยที่ดูดวงมักถามคำถามเดียวกันคือ "ปีนี้ดวงเป็นยังไง"
 * ของเดิมเว็บตอบได้แค่ชงหรือไม่ชง ซึ่งเป็นแค่ปัจจัยเดียวและหยาบเกินไป
 * คนปีนักษัตรเดียวกันทั้งหมดจึงได้คำตอบเหมือนกันหมด
 *
 * ไฟล์นี้ดูดวงปีนี้จากหลายชั้นตามที่ตำราจีนดูจริง (ตำราเรียกว่าดวงปีจร)
 *   1. ก้านฟ้าของปีนี้ปะทะธาตุประจำตัวเป็นดาวอะไร บอกว่าธีมของปีคืออะไร
 *   2. สาขาดินของปีนี้ ชงหรือถูกโฉลกกับนักษัตรปีเกิด
 *   3. ธาตุของปีนี้หนุนหรือสวนดวงเจ้าชะตา
 *   4. ปีนี้อยู่ในรอบโชคชะตาสิบปีรอบไหน รอบนั้นหนุนหรือไม่
 *   5. เลขปีชีวิตตามเลขศาสตร์ บอกจังหวะของรอบเก้าปี
 *
 * ผลจึงต่างกันรายคนจริง ไม่ใช่แค่แยกตามปีนักษัตร
 */

import { BaZiEngine, resolveTenGod } from './bazi.js';
import { ChineseZodiacEngine } from './chinese-zodiac.js';
import { NumerologyEngine } from './numerology.js';
import { YEAR_THEMES, SELF_THEME, CHONG_REMEDY_TH, ELEMENT_REMEDY_TH, PERSONAL_YEAR_TH }
  from '../data/year-themes.js';

export class YearlyPersonalEngine {
  /**
   * ดูดวงปีนี้เฉพาะบุคคล
   * @param {object} profile ต้องมี birthDate
   * @param {Date} [now] วันปัจจุบัน
   */
  static analyze(profile, now = new Date()) {
    const birthDate = profile?.birthDate;

    if (!birthDate) {
      return {
        available: false,
        reasonTh: 'ยังไม่ทราบวันเกิดของคุณ ระบบจึงดูดวงปีนี้เฉพาะตัวให้ไม่ได้'
      };
    }

    // ปีนักษัตรที่มีผลจริง ตัดด้วยลี่ชุน ไม่ใช่ปีปฏิทิน
    const zodiacYear = ChineseZodiacEngine.currentZodiacYear(now);
    const beYear = zodiacYear + 543;

    // เสาปีของปีนี้ ใช้กลางปีเพื่อให้พ้นขอบลี่ชุนแน่นอน
    const yearChart = BaZiEngine.calculatePillars(zodiacYear + '-06-15', '12:00');
    const yearPillar = yearChart.pillars.year;

    const natal = BaZiEngine.calculatePillars(birthDate, profile.birthTime || '12:00');

    // 1. ธีมของปี จากดาวที่ก้านฟ้าปีนี้ทำกับธาตุประจำตัว
    const godKey = resolveTenGod(natal.dayMaster.index, yearPillar.stem.index);
    const theme = YEAR_THEMES[godKey] || SELF_THEME;

    // 2. ปีนี้ชงกับเราไหม
    const chong = ChineseZodiacEngine.checkChong(birthDate, profile.birthTime || '12:00', zodiacYear);

    // 3. ธาตุประจำปีหนุนหรือสวน
    const yearElement = yearPillar.stem.element;
    const elementFavourable = (natal.favourableElements || []).includes(yearElement);
    const elementUnfavourable = (natal.unfavourableElements || []).includes(yearElement);

    // 5. เลขปีชีวิตตามเลขศาสตร์
    const personalYear = NumerologyEngine.calculatePersonalYear(birthDate, zodiacYear);

    // รวมเป็นระดับของปี จากปัจจัยที่คำนวณได้จริง
    let score = 0;
    if (chong.isChong) score -= chong.matched[0].type === 'direct' ? 3 : 2;
    if (elementFavourable) score += 3;
    if (elementUnfavourable) score -= 2;
    if (['directWealth', 'indirectWealth', 'directOfficer', 'directResource', 'eatingGod'].includes(godKey)) score += 2;
    if (['rob', 'sevenKillings', 'hurtingOfficer'].includes(godKey)) score -= 1;

    let level;
    let levelTh;
    if (score >= 4) { level = 'great'; levelTh = 'ปีนี้ดวงหนุนชัดเจน เป็นปีที่ควรลงมือ'; }
    else if (score >= 1) { level = 'good'; levelTh = 'ปีนี้ดวงค่อนข้างดี เดินหน้าได้'; }
    else if (score <= -4) { level = 'careful'; levelTh = 'ปีนี้ต้องระวังหลายด้าน เน้นรักษาของเดิม'; }
    else if (score <= -1) { level = 'watch'; levelTh = 'ปีนี้มีจุดที่ต้องระวัง แต่ไม่ถึงกับแย่'; }
    else { level = 'neutral'; levelTh = 'ปีนี้กลาง ๆ ผลขึ้นกับตัวเราเองเป็นหลัก'; }

    const chongKey = chong.isChong
      ? (chong.matched[0].type === 'direct' ? 'direct' : 'other')
      : 'none';
    const elementKey = elementFavourable ? 'favourable'
      : elementUnfavourable ? 'unfavourable' : 'neutral';
    const py = PERSONAL_YEAR_TH[personalYear] || PERSONAL_YEAR_TH[1];

    const layers = [
      {
        titleTh: 'ธีมของปีนี้สำหรับคุณ',
        valueTh: theme.themeTh,
        detailTh: theme.detailTh,
        whyTh: theme.whyTh,
        remedyTitleTh: 'รับมือยังไง',
        remedyTh: theme.remedyTh,
        remedyStepsTh: theme.remedyStepsTh || [],
        sourceTh: 'เทียบก้านฟ้าของปีนี้กับธาตุประจำตัวคุณ ตามหลักสิบเทพในดวงจีน'
      },
      {
        titleTh: 'ปีนี้ชงกับคุณไหม',
        valueTh: chong.isChong ? chong.matched[0].labelTh : 'ปีนี้ไม่ชง',
        detailTh: chong.isChong ? chong.matched[0].plainTh
          : 'ปีนักษัตรของปีนี้ไม่ปะทะกับปีเกิดคุณ ตำราถือว่าเป็นปีที่เดินได้ตามปกติ '
            + 'ไม่ต้องแก้ชงและไม่ต้องกังวลเรื่องนี้',
        whyTh: chong.isChong
          ? 'ตำราจีนถือว่านักษัตรที่อยู่ตรงข้ามกันในวงสิบสองนักษัตร จะปะทะกัน '
            + 'ปีที่นักษัตรประจำปีปะทะกับปีเกิดเรา จึงเรียกว่าปีชง'
          : 'นักษัตรปีนี้กับนักษัตรปีเกิดคุณไม่ได้อยู่ตำแหน่งที่ตำราถือว่าปะทะกัน',
        remedyTitleTh: CHONG_REMEDY_TH[chongKey].titleTh,
        remedyTh: chong.isChong
          ? 'ปีชงไม่ได้แปลว่าจะเจอเรื่องร้าย แต่แปลว่ามีเรื่องเปลี่ยนแปลงมากกว่าปกติ '
            + 'ให้เผื่อแผนไว้และอย่าเพิ่งตัดสินใจเรื่องใหญ่แบบรีบร้อน'
          : 'ปีที่ไม่ชงคือปีที่เหมาะกับการเริ่มเรื่องใหญ่ ใช้จังหวะนี้ให้คุ้ม',
        remedyStepsTh: CHONG_REMEDY_TH[chongKey].stepsTh,
        sourceTh: 'เทียบนักษัตรปีนี้กับนักษัตรปีเกิดคุณ ตัดปีตามเกณฑ์ลี่ชุน'
      },
      {
        titleTh: 'ธาตุประจำปีนี้',
        valueTh: elementFavourable ? 'ธาตุประจำปีหนุนดวงคุณ'
          : elementUnfavourable ? 'ธาตุประจำปีสวนทางกับดวงคุณ'
            : 'ธาตุประจำปีเป็นกลางกับดวงคุณ',
        detailTh: elementFavourable
          ? 'ธาตุของปีนี้เป็นธาตุที่ดวงคุณต้องการพอดี ปีแบบนี้ทำอะไรมักได้ผลเร็วกว่าปีอื่น '
            + 'เหมือนพายเรือตามน้ำ ออกแรงเท่าเดิมแต่ไปได้ไกลกว่า'
          : elementUnfavourable
            ? 'ธาตุของปีนี้เป็นธาตุที่ดวงคุณมีมากอยู่แล้ว ปีแบบนี้มักรู้สึกเหนื่อยกว่าปกติ '
              + 'เหมือนพายเรือทวนน้ำ ออกแรงเท่าเดิมแต่ไปได้ช้ากว่า'
            : 'ธาตุของปีนี้ไม่ได้หนุนและไม่ได้ขวางดวงคุณ ผลจึงขึ้นกับตัวเราเองเป็นหลัก',
        whyTh: 'ดวงของแต่ละคนมีธาตุที่ขาดและธาตุที่เกิน ธาตุที่ควรเสริมของคุณคือ '
          + (natal.favourableElementsTh || []).map(e => 'ธาตุ' + e).join(' และ ')
          + ' ปีไหนที่ธาตุประจำปีตรงกับธาตุที่ควรเสริม ตำราถือว่าเป็นปีที่หนุน',
        remedyTitleTh: 'รับมือยังไง',
        remedyTh: elementFavourable
          ? 'ใช้จังหวะที่ธาตุหนุนลงมือเรื่องที่ดองไว้'
          : elementUnfavourable
            ? 'ลดเป้าลงและเน้นรักษาของเดิม อย่าฝืนเร่ง'
            : 'ตั้งเป้าที่ทำได้จริงแล้วทำให้สม่ำเสมอ',
        remedyStepsTh: ELEMENT_REMEDY_TH[elementKey],
        sourceTh: 'เทียบธาตุของปีนี้กับธาตุที่ดวงคุณควรเสริม'
      },
      {
        titleTh: 'จังหวะชีวิตปีนี้',
        valueTh: 'ปีเลข ' + personalYear + ' ในรอบเก้าปี',
        detailTh: py.detailTh,
        whyTh: 'เลขศาสตร์แบ่งชีวิตเป็นรอบละเก้าปี คำนวณจากวันเดือนเกิดบวกกับปีปัจจุบัน '
          + 'แต่ละเลขมีลักษณะของจังหวะต่างกัน ปีนี้คุณอยู่เลข ' + personalYear,
        remedyTitleTh: 'ใช้จังหวะนี้ยังไง',
        remedyTh: py.remedyTh,
        remedyStepsTh: [],
        sourceTh: 'เลขศาสตร์ คำนวณจากวันเดือนเกิดบวกกับปีปัจจุบัน'
      }
    ];

    return {
      available: true,
      zodiacYear,
      beYear,
      yearAnimalTh: chong.yearBranchTh,
      yearPillarTh: yearPillar.stem.nameTh + yearPillar.branch.nameTh,
      yearElementTh: yearPillar.stem.elementTh,
      level,
      levelTh,
      layers,
      domains: [
        {
          key: 'work', emoji: '💼', titleTh: 'การงานปีนี้',
          detailTh: theme.work.detailTh, remedyTh: theme.work.remedyTh
        },
        {
          key: 'money', emoji: '💰', titleTh: 'การเงินปีนี้',
          detailTh: theme.money.detailTh, remedyTh: theme.money.remedyTh
        }
      ],
      love: {
        emoji: '💗', titleTh: 'ความรักปีนี้',
        singleTh: theme.love.singleTh,
        coupledTh: theme.love.coupledTh
      },
      // เก็บรูปแบบเดิมไว้ให้ที่อื่นที่ยังเรียกใช้อยู่
      workTh: theme.work.detailTh + ' ' + theme.work.remedyTh,
      moneyTh: theme.money.detailTh + ' ' + theme.money.remedyTh,
      loveTh: 'ถ้ายังโสด ' + theme.love.singleTh + ' ส่วนถ้ามีคู่แล้ว ' + theme.love.coupledTh,
      isChong: chong.isChong,
      chongLabelTh: chong.isChong ? chong.matched[0].labelTh : null,
      personalYear,
      methodNoteTh: 'ดวงปีนี้คำนวณจากสี่ชั้น คือธีมของปีจากดาวที่ปะทะธาตุประจำตัว '
        + 'การชงกับนักษัตรปีเกิด ธาตุประจำปีเทียบกับธาตุที่ดวงคุณต้องการ '
        + 'และจังหวะรอบเก้าปีตามเลขศาสตร์ จึงต่างกันรายคน ไม่ใช่แค่แยกตามปีนักษัตร'
    };
  }
}
