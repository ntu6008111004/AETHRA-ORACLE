/**
 * AETHRA ORACLE — สุริยคติ 24 สารท (24 Solar Terms / 二十四節氣)
 * ------------------------------------------------------------------
 * ใช้เป็นฐานคำนวณที่ถูกต้องของ:
 *   1) ดวงจีน BaZi — เสาปีเปลี่ยนที่ "ลี่ชุน" (立春) ไม่ใช่ 1 มกราคม
 *                    และเสาเดือนเปลี่ยนที่สารทคี่ (節) ไม่ใช่วันที่ 1 ของเดือน
 *   2) ปีนักษัตรจีน — ปีชวด/ฉลู/ขาล ฯลฯ เปลี่ยนที่ลี่ชุนเช่นกัน
 *
 * วิธีคำนวณ: หาเวลาที่ลองจิจูดสุริยะ (apparent solar longitude) ตัดผ่านทุก ๆ 15 องศา
 * โดยใช้วิธีแบ่งครึ่งช่วง (bisection) บนสูตรตำแหน่งดวงอาทิตย์ความละเอียดมาตรฐาน
 *
 * หมายเหตุสำคัญ: ตำราจีนกำหนดขอบเขตสารทตามเวลามาตรฐานจีน (CST = UTC+8)
 * ระบบนี้จึงคำนวณและเทียบขอบเขตด้วย UTC+8 เป็นค่าตั้งต้น
 */

/** เวลามาตรฐานจีน UTC+8 — ขอบเขตมาตรฐานของสารทตามตำราจีน */
export const CHINA_STANDARD_OFFSET_HOURS = 8;

/**
 * 24 สารท เรียงตามลองจิจูดสุริยะ
 * major = สารทกลางเดือน (中氣) / major:false = สารทต้นเดือน (節) ซึ่งเป็นตัวเปลี่ยนเสาเดือน BaZi
 */
export const SOLAR_TERMS = [
  { longitude: 315, nameZh: 'ลี่ชุน', nameTh: 'ลี่ชุน (เข้าสู่ฤดูใบไม้ผลิ)', major: false, branchIndex: 2 },
  { longitude: 330, nameZh: 'อวี่สุ่ย', nameTh: 'อวี่สุ่ย (ฝนหล่นต้นปี)', major: true },
  { longitude: 345, nameZh: 'จิงเจ๋อ', nameTh: 'จิงเจ๋อ (แมลงตื่นจากจำศีล)', major: false, branchIndex: 3 },
  { longitude: 0, nameZh: 'ชุนเฟิน', nameTh: 'ชุนเฟิน (วสันตวิษุวัต)', major: true },
  { longitude: 15, nameZh: 'ชิงหมิง', nameTh: 'ชิงหมิง (เช็งเม้ง)', major: false, branchIndex: 4 },
  { longitude: 30, nameZh: 'กู่อวี่', nameTh: 'กู่อวี่ (ฝนบำรุงข้าว)', major: true },
  { longitude: 45, nameZh: 'ลี่เซี่ย', nameTh: 'ลี่เซี่ย (เข้าสู่ฤดูร้อน)', major: false, branchIndex: 5 },
  { longitude: 60, nameZh: 'เสี่ยวหม่าน', nameTh: 'เสี่ยวหม่าน (เมล็ดข้าวเริ่มเต่ง)', major: true },
  { longitude: 75, nameZh: 'หมางจ้ง', nameTh: 'หมางจ้ง (ฤดูเก็บเกี่ยวธัญพืช)', major: false, branchIndex: 6 },
  { longitude: 90, nameZh: 'เซี่ยจื้อ', nameTh: 'เซี่ยจื้อ (ครีษมายัน วันยาวสุด)', major: true },
  { longitude: 105, nameZh: 'เสี่ยวสู่', nameTh: 'เสี่ยวสู่ (ร้อนน้อย)', major: false, branchIndex: 7 },
  { longitude: 120, nameZh: 'ต้าสู่', nameTh: 'ต้าสู่ (ร้อนใหญ่)', major: true },
  { longitude: 135, nameZh: 'ลี่ชิว', nameTh: 'ลี่ชิว (เข้าสู่ฤดูใบไม้ร่วง)', major: false, branchIndex: 8 },
  { longitude: 150, nameZh: 'ชู่สู่', nameTh: 'ชู่สู่ (สิ้นสุดความร้อน)', major: true },
  { longitude: 165, nameZh: 'ไป๋ลู่', nameTh: 'ไป๋ลู่ (น้ำค้างขาว)', major: false, branchIndex: 9 },
  { longitude: 180, nameZh: 'ชิวเฟิน', nameTh: 'ชิวเฟิน (ศารทวิษุวัต)', major: true },
  { longitude: 195, nameZh: 'หานลู่', nameTh: 'หานลู่ (น้ำค้างเย็น)', major: false, branchIndex: 10 },
  { longitude: 210, nameZh: 'ซวงเจี้ยง', nameTh: 'ซวงเจี้ยง (น้ำค้างแข็งลง)', major: true },
  { longitude: 225, nameZh: 'ลี่ตง', nameTh: 'ลี่ตง (เข้าสู่ฤดูหนาว)', major: false, branchIndex: 11 },
  { longitude: 240, nameZh: 'เสี่ยวเสวี่ย', nameTh: 'เสี่ยวเสวี่ย (หิมะน้อย)', major: true },
  { longitude: 255, nameZh: 'ต้าเสวี่ย', nameTh: 'ต้าเสวี่ย (หิมะใหญ่)', major: false, branchIndex: 0 },
  { longitude: 270, nameZh: 'ตงจื้อ', nameTh: 'ตงจื้อ (เหมายัน วันสั้นสุด)', major: true },
  { longitude: 285, nameZh: 'เสี่ยวหาน', nameTh: 'เสี่ยวหาน (หนาวน้อย)', major: false, branchIndex: 1 },
  { longitude: 300, nameZh: 'ต้าหาน', nameTh: 'ต้าหาน (หนาวใหญ่)', major: true }
];

/** แปลง Date เป็น Julian Day (UT) */
export function toJulianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/** แปลง Julian Day กลับเป็น Date */
export function fromJulianDay(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}

/**
 * ลองจิจูดสุริยะปรากฏ (apparent solar longitude) หน่วยองศา 0-360
 * ใช้สูตรความละเอียดมาตรฐาน (ความคลาดเคลื่อนราว 0.01 องศา ≈ 15 นาที)
 * ซึ่งเพียงพออย่างยิ่งสำหรับการกำหนด "วัน" ของสารท
 */
export function solarLongitude(jd) {
  const n = jd - 2451545.0;
  const T = n / 36525;
  // Mean longitude
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  // Mean anomaly
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mrad = M * Math.PI / 180;
  // Equation of centre
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
    + 0.000289 * Math.sin(3 * Mrad);
  // True longitude
  const trueLong = L0 + C;
  // Apparent longitude (nutation + aberration)
  const omega = 125.04 - 1934.136 * T;
  const apparent = trueLong - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
  return ((apparent % 360) + 360) % 360;
}

/**
 * หาเวลา (Date, UTC) ที่ลองจิจูดสุริยะตัดผ่านค่า targetLongitude
 * ในรอบปีที่กำหนด โดยใช้การแบ่งครึ่งช่วง
 */
export function findSolarTerm(year, targetLongitude) {
  // ประมาณวันเริ่มต้นคร่าว ๆ จากลองจิจูด (0 องศา = วสันตวิษุวัตราว 20 มี.ค.)
  const approxDayOfYear = ((targetLongitude + 45) % 360) * 365.2422 / 360;
  let searchYear = year;
  // ลี่ชุน (315) ถึง ต้าหาน (300) อยู่ต้นปีปฏิทิน จึงต้องอ้างอิงปีให้ถูก
  let jdStart = toJulianDay(new Date(Date.UTC(searchYear, 0, 1))) + approxDayOfYear - 5;
  let jdEnd = jdStart + 10;

  const diff = (jd) => {
    let d = solarLongitude(jd) - targetLongitude;
    // ปรับให้อยู่ในช่วง -180..180 เพื่อให้ฟังก์ชันต่อเนื่องตรงจุดตัด
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  };

  // ขยับช่วงจนกว่าจะครอบจุดตัด
  let guard = 0;
  while (diff(jdStart) > 0 && guard < 40) { jdStart -= 1; guard++; }
  guard = 0;
  while (diff(jdEnd) < 0 && guard < 40) { jdEnd += 1; guard++; }

  // แบ่งครึ่งช่วงจนได้ความละเอียดระดับวินาที
  for (let i = 0; i < 60; i++) {
    const mid = (jdStart + jdEnd) / 2;
    if (diff(mid) < 0) jdStart = mid;
    else jdEnd = mid;
  }
  return fromJulianDay((jdStart + jdEnd) / 2);
}

/** คืนสารททั้ง 24 ของปีนั้น พร้อมเวลา (UTC) */
export function getSolarTermsForYear(year) {
  return SOLAR_TERMS.map(term => ({
    ...term,
    date: findSolarTerm(year, term.longitude)
  })).sort((a, b) => a.date - b.date);
}

/**
 * หาวัน "ลี่ชุน" (立春) ของปีนั้น — จุดเปลี่ยนปีนักษัตรและเสาปี BaZi
 * คืนค่าเป็น Date (UTC)
 */
export function getLiChun(year) {
  return findSolarTerm(year, 315);
}

/**
 * ปีนักษัตร/เสาปีของวันที่กำหนด โดยยึดลี่ชุนเป็นเส้นแบ่ง
 * @returns {number} ปีตามปฏิทินสุริยคติจีน (อาจน้อยกว่าปี ค.ศ. หนึ่งปีถ้าเกิดก่อนลี่ชุน)
 */
export function getBaZiYear(date, tzOffsetHours = CHINA_STANDARD_OFFSET_HOURS) {
  const local = new Date(date.getTime() + tzOffsetHours * 3600000);
  const calendarYear = local.getUTCFullYear();
  const liChun = getLiChun(calendarYear);
  const liChunLocal = new Date(liChun.getTime() + tzOffsetHours * 3600000);
  return local < liChunLocal ? calendarYear - 1 : calendarYear;
}

/**
 * หา "กิ่งดิน" ของเสาเดือน BaZi จากสารทต้นเดือน (節) ที่ผ่านมาล่าสุด
 * @returns {{branchIndex:number, termNameTh:string, termDate:Date}}
 */
export function getBaZiMonthBranch(date, tzOffsetHours = CHINA_STANDARD_OFFSET_HOURS) {
  const local = new Date(date.getTime() + tzOffsetHours * 3600000);
  const year = local.getUTCFullYear();

  // รวมสารทต้นเดือนของปีก่อน ปีนี้ และปีหน้า เพื่อกันกรณีคาบเกี่ยวปลายปี/ต้นปี
  const candidates = [];
  for (const y of [year - 1, year, year + 1]) {
    for (const term of SOLAR_TERMS) {
      if (term.major) continue;
      const utc = findSolarTerm(y, term.longitude);
      candidates.push({
        branchIndex: term.branchIndex,
        termNameTh: term.nameTh,
        termDate: utc,
        localDate: new Date(utc.getTime() + tzOffsetHours * 3600000)
      });
    }
  }
  candidates.sort((a, b) => a.localDate - b.localDate);

  let current = candidates[0];
  for (const candidate of candidates) {
    if (candidate.localDate <= local) current = candidate;
    else break;
  }
  return current;
}
