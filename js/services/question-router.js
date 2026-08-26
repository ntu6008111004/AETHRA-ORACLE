/**
 * AETHRA ORACLE — ตัวอ่านคำถามและค้นข้อมูลมาตอบ (Question Router / Retrieval)
 * ------------------------------------------------------------------
 * แก้ปัญหาที่ผู้ใช้เจอ: ถามคนละเรื่องแต่ได้คำตอบเดิมทุกครั้ง
 *
 * สาเหตุเดิม:
 *   1) ส่งข้อมูลดวงทั้งกองให้โมเดลทุกครั้ง โมเดลเลยสรุปดวงซ้ำแทนที่จะตอบคำถาม
 *   2) บังคับให้ตอบตามแม่แบบเดิมทุกครั้ง (ความหมาย / เกี่ยวกับชีวิตคุณ / ...)
 *      ไม่ว่าคำถามจะเป็นอะไร คำตอบเลยหน้าตาเหมือนกันหมด
 *
 * วิธีแก้:
 *   - อ่านคำถามก่อน แล้วจัดหมวดว่าเป็นเรื่องอะไร
 *   - ดึงเฉพาะข้อมูลในดวงที่เกี่ยวกับเรื่องนั้นมาให้โมเดล (ไม่ส่งทั้งกอง)
 *   - สั่งรูปแบบคำตอบให้ตรงกับชนิดคำถาม (คำถามใช่ไม่ใช่ ตอบสั้นชัด / คำถามขอคำแนะนำ ตอบเป็นข้อ)
 *   - ห้ามโมเดลขึ้นต้นซ้ำกับคำตอบก่อนหน้า
 */

/** หมวดคำถามพร้อมคำที่ใช้จับ */
export const INTENTS = [
  {
    id: 'love',
    nameTh: 'ความรักและคู่ครอง',
    keywords: ['คู่', 'แฟน', 'รัก', 'เนื้อคู่', 'แต่งงาน', 'จีบ', 'โสด', 'เลิก', 'นอกใจ', 'คบ',
      'ชอบเขา', 'ชอบเค้า', 'ความสัมพันธ์', 'หย่า', 'สามี', 'ภรรยา', 'เมีย', 'ผัว', 'กิ๊ก', 'ครัช', 'ง้อ']
  },
  {
    id: 'career',
    nameTh: 'การงานและอาชีพ',
    keywords: ['งาน', 'เจ้านาย', 'ลาออก', 'ย้ายงาน', 'สมัคร', 'สัมภาษณ์', 'ตำแหน่ง', 'เลื่อนขั้น',
      'ธุรกิจ', 'ค้าขาย', 'ลูกน้อง', 'หัวหน้า', 'บริษัท', 'อาชีพ', 'ฟรีแลนซ์', 'เปิดร้าน', 'โปรเจกต์', 'ออฟฟิศ']
  },
  {
    id: 'money',
    nameTh: 'การเงินและทรัพย์สิน',
    keywords: ['เงิน', 'รายได้', 'หนี้', 'ลงทุน', 'ออม', 'ผ่อน', 'กู้', 'รวย', 'จน', 'ทอง',
      'หวย', 'เก็บเงิน', 'ค่าใช้จ่าย', 'เงินเดือน', 'โบนัส', 'ซื้อบ้าน', 'ซื้อรถ', 'ค้ำประกัน', 'ทุน']
  },
  {
    id: 'health',
    nameTh: 'สุขภาพและจิตใจ',
    keywords: ['สุขภาพ', 'ป่วย', 'โรค', 'หมอ', 'นอน', 'เครียด', 'อ้วน', 'ผอม', 'ปวด',
      'ผ่าตัด', 'โรงพยาบาล', 'เหนื่อย', 'ซึมเศร้า', 'วิตก', 'พักผ่อน', 'ออกกำลัง']
  },
  {
    id: 'luck',
    nameTh: 'โชคลาภและฤกษ์ยาม',
    keywords: ['โชค', 'ชง', 'ฤกษ์', 'สีมงคล', 'เลขมงคล', 'ทิศ', 'เสริมดวง', 'แก้ชง',
      'สะเดาะเคราะห์', 'ไหว้', 'ทำบุญ', 'วันดี', 'สีเสื้อ', 'เลขเด็ด', 'มงคล']
  },
  {
    id: 'family',
    nameTh: 'ครอบครัวและที่อยู่',
    keywords: ['ครอบครัว', 'พ่อ', 'แม่', 'ลูก', 'บ้าน', 'ญาติ', 'พี่น้อง', 'ที่ดิน', 'ย้ายบ้าน', 'มรดก']
  },
  {
    id: 'study',
    nameTh: 'การเรียนและการสอบ',
    keywords: ['เรียน', 'สอบ', 'มหาลัย', 'มหาวิทยาลัย', 'ทุนการศึกษา', 'เกรด', 'จบ', 'คณะ', 'อบรม', 'ภาษา']
  }
];

/** ชนิดของคำถาม ใช้กำหนดรูปแบบคำตอบ */
export const QUESTION_SHAPES = {
  yesno: {
    id: 'yesno',
    markers: ['ไหม', 'มั้ย', 'หรือเปล่า', 'รึเปล่า', 'ดีไหม', 'ควรไหม', 'ได้ไหม', 'หรือไม่'],
    instructionTh: 'คำถามนี้เป็นคำถามแบบ ควร/ไม่ควร ให้ตอบแบบนี้:\n'
      + 'บรรทัดแรก ตอบตรง ๆ ก่อนเลยว่า ควร หรือ ยังไม่ควร หรือ ได้แต่มีเงื่อนไข\n'
      + 'จากนั้นอธิบายเหตุผล 2-3 ข้อ โดยอ้างข้อมูลดวงที่ให้มาเป็นข้อ ๆ\n'
      + 'ปิดท้ายด้วยเงื่อนไขที่ถ้าทำได้จะปลอดภัยขึ้น'
  },
  when: {
    id: 'when',
    markers: ['เมื่อไหร่', 'เมื่อไร', 'ตอนไหน', 'ช่วงไหน', 'กี่ปี', 'ปีไหน', 'เดือนไหน', 'นานไหม'],
    instructionTh: 'คำถามนี้ถามเรื่องจังหวะเวลา ให้ตอบแบบนี้:\n'
      + 'บอกช่วงเวลาที่ดวงบ่งชี้ก่อน โดยอ้างรอบโชคชะตาหรือเลขจังหวะชีวิตปีนี้ที่ให้มา\n'
      + 'บอกสัญญาณที่จะสังเกตได้ว่าจังหวะมาถึงแล้ว 2-3 ข้อ\n'
      + 'ย้ำว่าเป็นแนวโน้มตามตำรา ไม่ใช่การฟันธงวันเวลา'
  },
  how: {
    id: 'how',
    markers: ['ยังไง', 'อย่างไร', 'ทำไง', 'วิธี', 'ต้องทำ', 'แก้ยังไง', 'ควรทำ'],
    instructionTh: 'คำถามนี้ขอวิธีทำ ให้ตอบเป็นขั้นตอนที่ลงมือได้จริง:\n'
      + 'ให้ 3-5 ข้อ แต่ละข้อขึ้นต้นด้วยคำกริยา และบอกให้ชัดว่าทำอะไร เมื่อไหร่\n'
      + 'อ้างข้อมูลดวงประกอบว่าทำไมวิธีนี้ถึงเหมาะกับคนดวงแบบนี้'
  },
  what: {
    id: 'what',
    markers: ['แบบไหน', 'คนแบบไหน', 'อะไร', 'ลักษณะ', 'นิสัย', 'เป็นยังไง'],
    instructionTh: 'คำถามนี้ถามลักษณะหรือรายละเอียด ให้ตอบแบบนี้:\n'
      + 'อธิบายลักษณะที่ถามอย่างเป็นรูปธรรม ให้เห็นภาพจับต้องได้\n'
      + 'ยกตัวอย่างสถานการณ์จริง 2-3 ตัวอย่าง\n'
      + 'ปิดท้ายด้วยวิธีสังเกตหรือวิธีใช้ข้อมูลนี้'
  },
  general: {
    id: 'general',
    markers: [],
    instructionTh: 'ตอบคำถามที่ถามโดยตรง เริ่มจากใจความสำคัญก่อน แล้วขยายความ 2-3 ย่อหน้า\n'
      + 'ปิดท้ายด้วยสิ่งที่ควรทำ 2-3 ข้อ'
  }
};


const THAI_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const THAI_WEEKDAY_FULL = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ',
  'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

/**
 * ข้อมูลวันเวลาปัจจุบัน ต้องส่งให้โมเดลทุกครั้ง
 * ไม่งั้นโมเดลจะเดาปีจากข้อมูลที่ถูกฝึกมา แล้วตอบผิด เช่น
 * แนะนำให้ "รอให้ผ่านปี 2024 ไปก่อน" ทั้งที่ตอนนี้เลยปีนั้นมาแล้ว
 */
export function currentDateContext(now = new Date()) {
  const year = now.getFullYear();
  const beYear = year + 543;
  const month = now.getMonth();
  const day = now.getDate();
  const quarter = Math.floor(month / 3) + 1;
  const monthsLeft = 12 - (month + 1);

  return {
    year,
    beYear,
    isoDate: now.toISOString().slice(0, 10),
    thaiDateTh: THAI_WEEKDAY_FULL[now.getDay()] + 'ที่ ' + day + ' ' + THAI_MONTHS_FULL[month] + ' พ.ศ. ' + beYear,
    quarter,
    monthsLeft,
    blockTh: [
      '[วันเวลาปัจจุบัน ใช้อ้างอิงเสมอ]',
      'วันนี้คือ ' + THAI_WEEKDAY_FULL[now.getDay()] + 'ที่ ' + day + ' ' + THAI_MONTHS_FULL[month] + ' พ.ศ. ' + beYear + ' (ค.ศ. ' + year + ')',
      'ตอนนี้อยู่ไตรมาสที่ ' + quarter + ' ของปี เหลืออีก ' + monthsLeft + ' เดือนจะสิ้นปี',
      'ข้อบังคับ: เวลาพูดถึงปีนี้ ปีหน้า หรือช่วงเวลาใด ๆ ให้ยึดปี พ.ศ. ' + beYear + ' (ค.ศ. ' + year + ') เป็นปีปัจจุบันเสมอ',
      'ห้ามอ้างปีที่ผ่านไปแล้วว่าเป็นอนาคต เช่น ห้ามบอกให้รอให้ผ่านปีที่เลยมาแล้ว',
      'ถ้าจะแนะนำช่วงเวลา ให้พูดเป็น ภายในปีนี้ ต้นปีหน้า หรือ อีก 3 เดือนข้างหน้า แทนการระบุปีตรง ๆ'
    ].join(String.fromCharCode(10))
  };
}

/** จับหมวดคำถามจากข้อความ */
export function detectIntent(question) {
  const text = String(question || '').toLowerCase();
  const scored = INTENTS.map(intent => {
    const hits = intent.keywords.filter(k => text.includes(k.toLowerCase()));
    return { intent, score: hits.length, hits };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score === 0) {
    return { id: 'general', nameTh: 'ภาพรวมชีวิต', matched: [], confident: false };
  }
  return { id: best.intent.id, nameTh: best.intent.nameTh, matched: best.hits, confident: true };
}

/** จับชนิดคำถามเพื่อกำหนดรูปแบบคำตอบ */
export function detectShape(question) {
  const text = String(question || '');
  for (const key of ['yesno', 'when', 'how', 'what']) {
    const shape = QUESTION_SHAPES[key];
    if (shape.markers.some(m => text.includes(m))) return shape;
  }
  return QUESTION_SHAPES.general;
}

/**
 * ค้นเฉพาะข้อมูลในดวงที่เกี่ยวกับคำถาม แล้วเรียงเป็นบริบทให้โมเดล
 * @param {object} meta ผลคำนวณจาก LifeDomainsEngine.analyze().meta
 * @param {object} domains ผลคำอ่านรายด้านจาก LifeDomainsEngine
 * @param {string} intentId หมวดคำถาม
 */
export function retrieveFacts(meta, domains, intentId, now = new Date()) {
  const lines = [];

  // วันเวลาปัจจุบันต้องมาก่อนเสมอ เพื่อไม่ให้โมเดลเดาปีเอง
  lines.push(currentDateContext(now).blockTh);
  lines.push('');
  const houses = meta.thai?.houses;
  const taksa = meta.taksa;

  // ข้อมูลพื้นฐานที่ต้องมีทุกคำถาม (สั้นที่สุดเท่าที่จำเป็น)
  lines.push('[ข้อมูลตัวผู้ถาม]');
  lines.push('เกิด' + taksa.weekdayNameTh + ' ' + meta.taksa.birthDate + ' อายุประมาณ ' + meta.age + ' ปี');
  lines.push('ปีนักษัตร ปี' + meta.zodiac.nameTh + ' / ราศีเกิดแบบไทย ราศี' + meta.thai.thaiSunSignNameTh);
  lines.push('ธาตุประจำตัวดวงจีน ธาตุ' + meta.bazi.dayMasterElement.nameTh + ' (' + meta.bazi.strength.labelTh + ')');

  const add = (label, value) => { if (value) lines.push(label + ': ' + value); };

  switch (intentId) {
    case 'love':
      lines.push('');
      lines.push('[ข้อมูลที่เกี่ยวกับความรักโดยเฉพาะ]');
      add('นิสัยด้านความรักตามปีนักษัตร', meta.zodiac.profile.loveTh);
      add('จุดที่มักทำให้ความสัมพันธ์สะดุด', meta.zodiac.profile.cautionTh);
      add('สีเสริมเสน่ห์ (ตำแหน่งศรีในทักษา)', taksa.byId.si.colorName + ' ใช้ใน' + taksa.byId.si.exampleTh);
      add('ดาวประจำตำแหน่งเสน่ห์', taksa.byId.si.planetNameTh + ' ให้พลังด้าน ' + taksa.byId.si.planetTraitTh);
      if (houses?.available) {
        add('ภพคู่ครอง (ภพ 7 ปัตนิ)', 'ราศี' + houses.byNumber[7].signNameTh + ' เจ้าเรือน ' + houses.byNumber[7].rulerTh
          + ' บ่งว่าคู่มีลักษณะ ' + houses.byNumber[7].signTraitTh);
        add('ภพความรักและความสนุก (ภพ 5 ปุตตะ)', 'ราศี' + houses.byNumber[5].signNameTh);
      } else {
        lines.push('ภพคู่ครอง: คำนวณไม่ได้เพราะไม่ทราบเวลาเกิด ห้ามเดาลัคนาหรือภพ');
      }
      if (domains?.love) {
        lines.push('สรุปด้านความรักที่ระบบคำนวณไว้: ' + domains.love.headlineTh);
        domains.love.sections.slice(0, 3).forEach(s => lines.push('- ' + s.headingTh + ': ' + s.bodyTh));
      }
      break;

    case 'career':
      lines.push('');
      lines.push('[ข้อมูลที่เกี่ยวกับการงานโดยเฉพาะ]');
      add('สายงานที่ถูกกับธาตุประจำตัว', meta.bazi.dayMasterElement.careerTh);
      add('จุดแข็งในที่ทำงานตามปีนักษัตร', meta.zodiac.profile.strengthTh);
      add('จุดที่ต้องระวังในที่ทำงาน', meta.zodiac.profile.cautionTh);
      add('สายงานที่มักไปได้ดี', meta.zodiac.profile.careerTh);
      add('สีเสริมอำนาจการงาน (ตำแหน่งเดช)', taksa.byId.dech.colorName);
      add('สีขอผู้ใหญ่ช่วย (ตำแหน่งมนตรี)', taksa.byId.montri.colorName);
      add('รอบโชคชะตา 10 ปีตอนนี้', meta.currentLuck.nameTh + ' อายุ ' + meta.currentLuck.ageFrom + '-'
        + meta.currentLuck.ageTo + ' — ' + meta.currentLuck.verdictTh + ' (ดาวเด่น ' + meta.currentLuck.god.nameTh + ')');
      if (houses?.available) {
        add('ภพการงาน (ภพ 10 กัมมะ)', 'ราศี' + houses.byNumber[10].signNameTh + ' สไตล์ทำงาน ' + houses.byNumber[10].signTraitTh);
      }
      if (domains?.career) {
        domains.career.sections.slice(0, 3).forEach(s => lines.push('- ' + s.headingTh + ': ' + s.bodyTh));
      }
      break;

    case 'money':
      lines.push('');
      lines.push('[ข้อมูลที่เกี่ยวกับการเงินโดยเฉพาะ]');
      add('ความแข็งอ่อนของดวงและผลต่อการเงิน', meta.bazi.strength.plainTh);
      add('ธาตุที่ควรเสริม', 'ธาตุ' + meta.bazi.favourableElementsTh.join(' และธาตุ'));
      add('สีเสริมทรัพย์ (ตำแหน่งมูละ)', taksa.byId.mula.colorName + ' ใช้ใน' + taksa.byId.mula.exampleTh);
      add('รอบโชคชะตา 10 ปีตอนนี้', meta.currentLuck.nameTh + ' — ' + meta.currentLuck.verdictTh);
      add('เลขจังหวะชีวิตปีนี้', String(meta.numerology.personalYear));
      add('สถานะปีชง', meta.chong.isChong ? meta.chong.matched[0].labelTh + ' — ' + meta.chong.adviceTh : 'ไม่ชง');
      if (houses?.available) {
        add('ภพการเงิน (ภพ 2 กดุมภะ)', 'ราศี' + houses.byNumber[2].signNameTh);
        add('ภพลาภลอย (ภพ 11 ลาภะ)', 'ราศี' + houses.byNumber[11].signNameTh);
      }
      if (domains?.money) {
        domains.money.sections.slice(0, 3).forEach(s => lines.push('- ' + s.headingTh + ': ' + s.bodyTh));
      }
      break;

    case 'health':
      lines.push('');
      lines.push('[ข้อมูลที่เกี่ยวกับสุขภาพโดยเฉพาะ]');
      add('ธาตุเจ้าเรือนแพทย์แผนไทย', meta.thai.bodyElement.nameTh + ' — ' + meta.thai.bodyElement.natureTh);
      add('ลักษณะร่างกาย', meta.thai.bodyElement.bodyTh);
      add('อาการที่ควรระวัง', meta.thai.bodyElement.healthTh);
      add('อาหารที่เหมาะ', meta.thai.bodyElement.foodTh);
      add('วิธีปรับสมดุล', meta.thai.bodyElement.balanceTh);
      add('สีเสริมสุขภาพ (ตำแหน่งอายุ)', taksa.byId.ayu.colorName);
      add('ธาตุที่ขาดในดวงจีน', meta.bazi.missingElementsTh.length ? meta.bazi.missingElementsTh.join(', ') : 'ไม่ขาดธาตุใด');
      lines.push('ข้อบังคับ: ห้ามวินิจฉัยโรค ต้องบอกให้ไปพบแพทย์ถ้ามีอาการจริง');
      break;

    case 'luck':
      lines.push('');
      lines.push('[ข้อมูลที่เกี่ยวกับโชคลาภและฤกษ์ยามโดยเฉพาะ]');
      add('สถานะปีชง', meta.chong.headlineTh + ' — ' + meta.chong.adviceTh);
      lines.push('สีมงคลครบชุดจากผังทักษา (คำนวณจาก' + taksa.weekdayNameTh + 'ที่เกิด):');
      ['dech', 'si', 'mula', 'montri', 'ayu', 'utsaha', 'boriwan'].forEach(k => {
        const pos = taksa.byId[k];
        lines.push('  - ' + pos.nameTh + ' (' + pos.domain + '): ' + pos.colorName + ' | ใช้เมื่อ ' + pos.goodForTh);
      });
      add('สีกาลกิณีที่ต้องเลี่ยง', taksa.byId.kalakini.colorName);
      add('รอบโชคชะตา 10 ปี', meta.currentLuck.nameTh + ' — ' + meta.currentLuck.verdictTh);
      if (domains?.luck) {
        domains.luck.sections.slice(0, 3).forEach(s => lines.push('- ' + s.headingTh + ': ' + s.bodyTh));
      }
      break;

    case 'family':
      lines.push('');
      lines.push('[ข้อมูลที่เกี่ยวกับครอบครัวและที่อยู่]');
      add('สีเสริมคนรอบตัว (ตำแหน่งบริวาร)', taksa.byId.boriwan.colorName);
      add('สีขอผู้ใหญ่ช่วย (ตำแหน่งมนตรี)', taksa.byId.montri.colorName);
      if (houses?.available) {
        add('ภพบ้านและครอบครัว (ภพ 4 พันธุ)', 'ราศี' + houses.byNumber[4].signNameTh + ' — ' + houses.byNumber[4].plainTh);
        add('ภพลูก (ภพ 5 ปุตตะ)', 'ราศี' + houses.byNumber[5].signNameTh);
      } else {
        lines.push('ภพบ้านและภพลูก: คำนวณไม่ได้เพราะไม่ทราบเวลาเกิด ห้ามเดา');
      }
      add('นิสัยตามปีนักษัตรที่ส่งผลกับคนในบ้าน', meta.zodiac.profile.strengthTh + ' / ระวัง ' + meta.zodiac.profile.cautionTh);
      break;

    case 'study':
      lines.push('');
      lines.push('[ข้อมูลที่เกี่ยวกับการเรียนและการสอบ]');
      add('เลขเส้นทางชีวิต', meta.numerology.lifePath + ' (' + meta.numerology.meaningTh.title + ') — ' + meta.numerology.meaningTh.desc);
      add('ธาตุประจำตัวและวิธีเรียนที่เหมาะ', 'ธาตุ' + meta.bazi.dayMasterElement.nameTh + ' — ' + meta.bazi.dayMasterElement.lifeTh);
      add('สีเสริมความพยายาม (ตำแหน่งอุตสาหะ)', taksa.byId.utsaha.colorName + ' ใช้ใน' + taksa.byId.utsaha.exampleTh);
      add('สีเสริมอำนาจ ใช้วันสอบหรือนำเสนอ (ตำแหน่งเดช)', taksa.byId.dech.colorName);
      if (houses?.available) add('ภพการศึกษาสูง (ภพ 9 ศุภะ)', 'ราศี' + houses.byNumber[9].signNameTh);
      break;

    default:
      lines.push('');
      lines.push('[ภาพรวมชีวิต]');
      add('เลขเส้นทางชีวิต', meta.numerology.lifePath + ' (' + meta.numerology.meaningTh.title + ')');
      add('เลขจังหวะชีวิตปีนี้', String(meta.numerology.personalYear));
      add('ธาตุเจ้าเรือนแพทย์แผนไทย', meta.thai.bodyElement.nameTh);
      add('รอบโชคชะตา 10 ปีตอนนี้', meta.currentLuck.nameTh + ' อายุ ' + meta.currentLuck.ageFrom + '-'
        + meta.currentLuck.ageTo + ' — ' + meta.currentLuck.verdictTh);
      add('สถานะปีชง', meta.chong.isChong ? meta.chong.matched[0].labelTh : 'ไม่ชง');
      add('จุดแข็งตามปีนักษัตร', meta.zodiac.profile.strengthTh);
      add('จุดที่ต้องระวัง', meta.zodiac.profile.cautionTh);
      break;
  }

  if (!meta.hasTime) {
    lines.push('');
    lines.push('[ข้อจำกัด] ผู้ถามไม่ทราบเวลาเกิด จึงไม่มีลัคนาและภพทั้ง 12 ห้ามเดาลัคนาหรือภพเด็ดขาด');
  }

  return lines.join(String.fromCharCode(10));
}

/**
 * สร้างคำสั่งเฉพาะคำถาม เพื่อไม่ให้โมเดลตอบเป็นแม่แบบเดิมทุกครั้ง
 * @param {string} question คำถามของผู้ใช้
 * @param {string[]} previousOpenings ประโยคเปิดของคำตอบก่อนหน้า ใช้กันตอบซ้ำ
 */
export function buildInstruction(question, previousOpenings = [], now = new Date()) {
  const intent = detectIntent(question);
  const shape = detectShape(question);

  const dateInfo = currentDateContext(now);
  const parts = [
    'คำถามของผู้ใช้ครั้งนี้คือ: "' + String(question || '').trim() + '"',
    'หมวดคำถาม: ' + intent.nameTh,
    'วันนี้คือ ' + dateInfo.thaiDateTh + ' — ทุกคำตอบต้องอ้างอิงปีนี้เท่านั้น',
    '',
    'กติกาการตอบครั้งนี้:',
    '1. ตอบเฉพาะคำถามข้างบนเท่านั้น ห้ามสรุปดวงทั้งหมดซ้ำ ห้ามเล่าเรื่องราศีหรือธาตุที่ไม่เกี่ยวกับคำถาม',
    '2. ' + shape.instructionTh.split(String.fromCharCode(10)).join(String.fromCharCode(10) + '   '),
    '3. ใช้เฉพาะข้อมูลในบริบทที่ให้มา ถ้าข้อมูลไม่พอให้บอกตรง ๆ ว่าดูไม่ได้เพราะอะไร ห้ามเดา',
    '4. ภาษาไทยล้วน ห้ามใส่คำภาษาอังกฤษในวงเล็บเด็ดขาด เช่น ห้ามเขียน ราศีสิงห์ (Leo) หรือ ดวงอาทิตย์ (Sun)',
    '5. ใช้ภาษาชาวบ้าน ห้ามใช้คำเชิงกวีอย่าง วงจรชีวิต พลังงานไหลเวียน ความอุดมสมบูรณ์',
    '6. ขึ้นบรรทัดใหม่ทุกครั้งที่เปลี่ยนประเด็น หนึ่งบรรทัดต่อหนึ่งเรื่อง อย่าเขียนติดกันเป็นก้อนยาว',
    '7. ความยาวรวมไม่เกิน 400 คำ',
    '8. เวลาพูดถึงช่วงเวลา ให้ยึด พ.ศ. ' + dateInfo.beYear + ' เป็นปีปัจจุบัน '
      + 'ห้ามบอกให้รอปีที่ผ่านไปแล้ว และควรพูดว่า ภายในปีนี้ หรือ อีกไม่กี่เดือนข้างหน้า แทนการระบุตัวเลขปี'
  ];

  if (previousOpenings.length) {
    parts.push('9. ห้ามขึ้นต้นคำตอบซ้ำกับคำตอบก่อนหน้าเหล่านี้: '
      + previousOpenings.map(o => '"' + o.slice(0, 40) + '"').join(' / '));
  }

  return { intent, shape, instructionTh: parts.join(String.fromCharCode(10)) };
}
