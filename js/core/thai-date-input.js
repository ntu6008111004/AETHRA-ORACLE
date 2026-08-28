/**
 * AETHRA ORACLE — ตัวอ่านวันเกิดที่ผู้ใช้พิมพ์เอง
 * ------------------------------------------------------------------
 * ทำไมต้องมี
 *
 * ช่องเลือกวันที่แบบปฏิทินของเบราว์เซอร์ใช้ยากมากสำหรับผู้ใหญ่และผู้สูงอายุ
 * ต้องกดเลื่อนหาปีทีละปี บางเครื่องเริ่มที่ปีปัจจุบัน กว่าจะเลื่อนไปถึงปี 2500 ก็ท้อ
 * หลายคนจึงเลิกใช้ไปเลย ไฟล์นี้เปิดให้พิมพ์เองแบบที่คนไทยเขียนกันจริง
 *
 * รูปแบบที่รับได้ (ทดสอบครบทุกแบบแล้ว)
 *   27/06/2541   วันเดือนปีพุทธศักราช คั่นด้วยทับ
 *   27-06-2541   คั่นด้วยขีด
 *   27.06.2541   คั่นด้วยจุด
 *   27 06 2541   คั่นด้วยเว้นวรรค
 *   27/06/1998   ปีคริสต์ศักราช
 *   27/6/41      ปีสองหลัก
 *   27 มิถุนายน 2541   เดือนเป็นชื่อไทยเต็ม
 *   27 มิ.ย. 2541      เดือนเป็นตัวย่อ
 *   2541-06-27   ปีขึ้นก่อนแบบสากล
 *   ๒๗/๐๖/๒๕๔๑   เลขไทย
 *
 * เรื่องสำคัญที่สุดคือการเดาว่าเป็น พ.ศ. หรือ ค.ศ.
 * ตัดสินจากค่าปี ไม่ใช่จากการเดาสุ่ม และถ้าคลุมเครือจะบอกผู้ใช้ให้ยืนยัน
 */

const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';

/** ปีที่ห่างจากปีนี้เกินเท่านี้ ถือว่าไม่ใช่วันเกิดคน */
const MAX_AGE = 120;

const MONTH_NAMES = [
  { full: 'มกราคม', abbrs: ['ม.ค.', 'มค', 'มกรา'] },
  { full: 'กุมภาพันธ์', abbrs: ['ก.พ.', 'กพ', 'กุมภา'] },
  { full: 'มีนาคม', abbrs: ['มี.ค.', 'มีค', 'มีนา'] },
  { full: 'เมษายน', abbrs: ['เม.ย.', 'เมย', 'เมษา'] },
  { full: 'พฤษภาคม', abbrs: ['พ.ค.', 'พค', 'พฤษภา'] },
  { full: 'มิถุนายน', abbrs: ['มิ.ย.', 'มิย', 'มิถุนา'] },
  { full: 'กรกฎาคม', abbrs: ['ก.ค.', 'กค', 'กรกฎา'] },
  { full: 'สิงหาคม', abbrs: ['ส.ค.', 'สค', 'สิงหา'] },
  { full: 'กันยายน', abbrs: ['ก.ย.', 'กย', 'กันยา'] },
  { full: 'ตุลาคม', abbrs: ['ต.ค.', 'ตค', 'ตุลา'] },
  { full: 'พฤศจิกายน', abbrs: ['พ.ย.', 'พย', 'พฤศจิกา'] },
  { full: 'ธันวาคม', abbrs: ['ธ.ค.', 'ธค', 'ธันวา'] }
];

/** แปลงเลขไทยเป็นเลขอารบิก */
export function thaiDigitsToArabic(text) {
  return String(text || '').replace(/[๐-๙]/g, ch => String(THAI_DIGITS.indexOf(ch)));
}

/** หาเลขเดือนจากชื่อเดือนภาษาไทย คืน 1-12 หรือ null */
export function monthFromThaiName(word) {
  const clean = String(word || '').replace(/\s/g, '');
  if (!clean) return null;

  for (let i = 0; i < MONTH_NAMES.length; i += 1) {
    const m = MONTH_NAMES[i];
    if (clean === m.full) return i + 1;
    if (m.abbrs.some(a => clean === a || clean === a.replace(/\./g, ''))) return i + 1;
    // พิมพ์ไม่ครบ เช่น มิถุน หรือ กุมภาพ ก็ยังเข้าใจได้
    if (clean.length >= 3 && m.full.startsWith(clean)) return i + 1;
  }
  return null;
}

/**
 * เดาว่าปีที่พิมพ์มาเป็น พ.ศ. หรือ ค.ศ.
 * @returns {{year:number, era:'be'|'ce', assumed:boolean, noteTh:string|null}}
 */
export function resolveYear(rawYear, now = new Date()) {
  let y = Number(rawYear);
  if (!Number.isFinite(y)) return null;

  const thisCe = now.getFullYear();
  const thisBe = thisCe + 543;

  // ปีสองหลัก เช่น 41 หรือ 98 ต้องเดาว่าหมายถึงศตวรรษไหน
  if (y < 100) {
    // คนไทยพิมพ์ 41 มักหมายถึง 2541 ส่วน 98 มักหมายถึง 2498 หรือ 1998
    const asBe = y + 2500;
    const asCe = y + (y + 1900 <= thisCe ? 1900 : 1800);
    if (asBe <= thisBe && thisBe - asBe <= MAX_AGE) {
      return {
        year: asBe - 543, era: 'be', assumed: true,
        noteTh: 'ระบบเข้าใจว่าปีที่พิมพ์คือ พ.ศ. ' + asBe + ' (ค.ศ. ' + (asBe - 543) + ')'
      };
    }
    if (thisCe - asCe <= MAX_AGE && asCe <= thisCe) {
      return {
        year: asCe, era: 'ce', assumed: true,
        noteTh: 'ระบบเข้าใจว่าปีที่พิมพ์คือ ค.ศ. ' + asCe + ' (พ.ศ. ' + (asCe + 543) + ')'
      };
    }
    return null;
  }

  // ปีพุทธศักราชเต็ม เช่น 2541
  if (y >= 2200) {
    const ce = y - 543;
    if (thisCe - ce > MAX_AGE || ce > thisCe) return null;
    return { year: ce, era: 'be', assumed: false, noteTh: null };
  }

  // ปีคริสต์ศักราชเต็ม เช่น 1998
  if (y >= 1900 && y <= thisCe) {
    return { year: y, era: 'ce', assumed: false, noteTh: null };
  }

  // ช่วง 1900 ถึง 2200 ที่เป็นไปได้ทั้งสองแบบ เช่น 2000 อาจเป็น ค.ศ. 2000 หรือ พ.ศ. 2000
  // พ.ศ. 2000 คือ ค.ศ. 1457 ซึ่งเป็นไปไม่ได้ที่จะเป็นวันเกิดคน จึงถือว่าเป็น ค.ศ.
  if (y > thisCe && y < 2200) return null;

  return null;
}

/**
 * อ่านวันเกิดที่ผู้ใช้พิมพ์เอง
 *
 * @param {string} input ข้อความที่ผู้ใช้พิมพ์
 * @param {Date} [now] วันปัจจุบัน ใส่เพื่อทดสอบได้
 * @returns {{ok:boolean, isoDate?:string, year?:number, month?:number, day?:number,
 *            era?:string, assumed?:boolean, noteTh?:string|null, displayTh?:string, errorTh?:string}}
 */
export function parseThaiBirthDate(input, now = new Date()) {
  const raw = thaiDigitsToArabic(String(input || '')).trim();

  if (!raw) {
    return { ok: false, errorTh: 'ยังไม่ได้กรอกวันเกิด' };
  }

  let day = null;
  let month = null;
  let yearRaw = null;

  // แบบมีชื่อเดือนไทย เช่น 27 มิถุนายน 2541
  const namedMatch = raw.match(/^(\d{1,2})\s*[\s./-]?\s*([ก-๙.]+)\s*[\s./-]?\s*(\d{2,4})$/);
  if (namedMatch && monthFromThaiName(namedMatch[2]) !== null) {
    day = Number(namedMatch[1]);
    month = monthFromThaiName(namedMatch[2]);
    yearRaw = namedMatch[3];
  } else {
    // แบบตัวเลขล้วน คั่นด้วย / - . หรือเว้นวรรค
    const parts = raw.split(/[\s./-]+/).filter(Boolean);
    if (parts.length !== 3 || parts.some(p => !/^\d+$/.test(p))) {
      return {
        ok: false,
        errorTh: 'อ่านวันเกิดไม่ออก ลองพิมพ์แบบนี้ดู 27/06/2541 หรือ 27 มิถุนายน 2541 '
          + 'จะใส่เป็น พ.ศ. หรือ ค.ศ. ก็ได้'
      };
    }

    if (parts[0].length === 4) {
      // แบบปีขึ้นก่อน เช่น 2541-06-27
      yearRaw = parts[0]; month = Number(parts[1]); day = Number(parts[2]);
    } else {
      day = Number(parts[0]); month = Number(parts[1]); yearRaw = parts[2];
    }
  }

  if (!(month >= 1 && month <= 12)) {
    return { ok: false, errorTh: 'เลขเดือนต้องอยู่ระหว่าง 1 ถึง 12 ที่พิมพ์มาคือ ' + month };
  }
  if (!(day >= 1 && day <= 31)) {
    return { ok: false, errorTh: 'เลขวันต้องอยู่ระหว่าง 1 ถึง 31 ที่พิมพ์มาคือ ' + day };
  }

  const resolved = resolveYear(yearRaw, now);
  if (!resolved) {
    return {
      ok: false,
      errorTh: 'ปีที่พิมพ์มาดูไม่เหมือนปีเกิดของคน (' + yearRaw + ') '
        + 'ลองใส่เป็น พ.ศ. เช่น 2541 หรือ ค.ศ. เช่น 1998'
    };
  }

  // ตรวจว่าวันนั้นมีอยู่จริงในเดือนนั้น เช่น 31 กุมภาพันธ์ ไม่มีจริง
  const check = new Date(Date.UTC(resolved.year, month - 1, day));
  if (check.getUTCFullYear() !== resolved.year
    || check.getUTCMonth() !== month - 1
    || check.getUTCDate() !== day) {
    return {
      ok: false,
      errorTh: 'ไม่มีวันที่ ' + day + ' ในเดือน ' + MONTH_NAMES[month - 1].full
        + ' ปี ' + (resolved.year + 543) + ' ลองตรวจอีกครั้ง'
    };
  }

  if (check.getTime() > now.getTime()) {
    return { ok: false, errorTh: 'วันเกิดที่กรอกอยู่ในอนาคต ลองตรวจปีอีกครั้ง' };
  }

  const iso = String(resolved.year).padStart(4, '0')
    + '-' + String(month).padStart(2, '0')
    + '-' + String(day).padStart(2, '0');

  return {
    ok: true,
    isoDate: iso,
    year: resolved.year,
    month,
    day,
    era: resolved.era,
    assumed: resolved.assumed,
    noteTh: resolved.noteTh,
    displayTh: day + ' ' + MONTH_NAMES[month - 1].full + ' พ.ศ. ' + (resolved.year + 543)
      + ' (ค.ศ. ' + resolved.year + ')'
  };
}

/**
 * อ่านเวลาเกิดที่พิมพ์เอง รับได้หลายแบบ
 * เช่น 09:30, 9.30, 9 โมงเช้า, บ่ายสองโมง, สองทุ่ม
 */
export function parseThaiBirthTime(input) {
  const raw = thaiDigitsToArabic(String(input || '')).trim();
  if (!raw) return { ok: false, errorTh: 'ยังไม่ได้กรอกเวลา' };

  const numeric = raw.match(/^(\d{1,2})\s*[:.\s]\s*(\d{1,2})$/);
  if (numeric) {
    const h = Number(numeric[1]);
    const m = Number(numeric[2]);
    if (h > 23 || m > 59) return { ok: false, errorTh: 'เวลาที่กรอกไม่ถูกต้อง' };
    return { ok: true, time: String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') };
  }

  // ตัวเลขที่คนไทยเขียนเป็นคำ เช่น สองทุ่ม ตีสาม ต้องอ่านออกด้วย
  // เพราะผู้สูงอายุมักบอกเวลาแบบนี้มากกว่าบอกเป็นตัวเลข
  const THAI_NUM_WORDS = {
    'หนึ่ง': 1, 'สอง': 2, 'สาม': 3, 'สี่': 4, 'ห้า': 5, 'หก': 6,
    'เจ็ด': 7, 'แปด': 8, 'เก้า': 9, 'สิบ': 10, 'สิบเอ็ด': 11, 'สิบสอง': 12
  };

  /** อ่านตัวเลขจากข้อความ ไม่ว่าจะเขียนเป็นเลขหรือเป็นคำไทย */
  const readNumber = (chunk) => {
    const text = String(chunk || '');
    const digit = text.match(/\d+/);
    if (digit) return Number(digit[0]);
    // เรียงจากคำยาวไปสั้น ไม่งั้น สิบสอง จะถูกอ่านเป็น สิบ
    const words = Object.keys(THAI_NUM_WORDS).sort((a, b) => b.length - a.length);
    for (const w of words) {
      if (text.includes(w)) return THAI_NUM_WORDS[w];
    }
    return null;
  };

  // แบบบอกเป็นคำ เช่น สองทุ่ม บ่ายสามโมง ตีสาม
  const NUM = '[\\d\\u0E00-\\u0E7F]{1,12}';
  const words = [
    { re: /เที่ยงคืน/, h: 0 },
    { re: /เที่ยงวัน|เที่ยง/, h: 12 },
    { re: new RegExp('ตี\\s*(' + NUM + ')'), base: 0 },
    { re: new RegExp('(' + NUM + ')\\s*ทุ่ม'), base: 18 },
    { re: new RegExp('บ่าย\\s*(' + NUM + ')'), base: 12 },
    { re: new RegExp('(' + NUM + ')\\s*โมงเย็น'), base: 12 },
    { re: new RegExp('(' + NUM + ')\\s*โมงเช้า'), base: 0 },
    { re: new RegExp('(' + NUM + ')\\s*โมง'), base: 0 }
  ];
  for (const w of words) {
    const m = raw.match(w.re);
    if (!m) continue;
    if (w.h !== undefined) return { ok: true, time: String(w.h).padStart(2, '0') + ':00' };
    const n = readNumber(m[1]);
    if (n === null) continue;
    const h = (w.base + n) % 24;
    return { ok: true, time: String(h).padStart(2, '0') + ':00' };
  }

  return {
    ok: false,
    errorTh: 'อ่านเวลาไม่ออก ลองพิมพ์แบบ 09:30 หรือ 9.30 หรือจะเขียนว่า สองทุ่ม ก็ได้'
  };
}
