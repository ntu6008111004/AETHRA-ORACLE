/**
 * AETHRA ORACLE — พิกัดจังหวัดไทยครบ 77 จังหวัด + เมืองต่างประเทศหลัก
 * ใช้คำนวณลัคนา (ต้องการละติจูด/ลองจิจูดของสถานที่เกิด)
 * พิกัดอ้างอิงจากอำเภอเมืองของแต่ละจังหวัด ความละเอียดระดับนี้เพียงพอ
 * เพราะลัคนาเปลี่ยนช้ากว่าระยะทางระดับตำบลมาก
 */

export const THAI_PROVINCES = [
  // ภาคกลาง
  { name: 'กรุงเทพมหานคร', lat: 13.7563, lon: 100.5018, tz: 7, aliases: ['กรุงเทพ', 'กทม', 'bangkok', 'บางกอก'] },
  { name: 'สมุทรปราการ', lat: 13.5991, lon: 100.5998, tz: 7, aliases: ['ปากน้ำ'] },
  { name: 'นนทบุรี', lat: 13.8622, lon: 100.5144, tz: 7 },
  { name: 'ปทุมธานี', lat: 14.0208, lon: 100.5253, tz: 7, aliases: ['รังสิต'] },
  { name: 'พระนครศรีอยุธยา', lat: 14.3532, lon: 100.5689, tz: 7, aliases: ['อยุธยา'] },
  { name: 'อ่างทอง', lat: 14.5896, lon: 100.4550, tz: 7 },
  { name: 'ลพบุรี', lat: 14.7995, lon: 100.6534, tz: 7 },
  { name: 'สิงห์บุรี', lat: 14.8879, lon: 100.4049, tz: 7 },
  { name: 'ชัยนาท', lat: 15.1852, lon: 100.1251, tz: 7 },
  { name: 'สระบุรี', lat: 14.5289, lon: 100.9101, tz: 7 },
  { name: 'นครปฐม', lat: 13.8199, lon: 100.0622, tz: 7 },
  { name: 'สมุทรสาคร', lat: 13.5475, lon: 100.2744, tz: 7, aliases: ['มหาชัย'] },
  { name: 'สมุทรสงคราม', lat: 13.4098, lon: 100.0022, tz: 7, aliases: ['แม่กลอง'] },
  { name: 'สุพรรณบุรี', lat: 14.4745, lon: 100.1177, tz: 7 },

  // ภาคตะวันออก
  { name: 'ชลบุรี', lat: 13.3611, lon: 100.9847, tz: 7, aliases: ['พัทยา', 'ศรีราชา', 'บางแสน'] },
  { name: 'ระยอง', lat: 12.6814, lon: 101.2789, tz: 7 },
  { name: 'จันทบุรี', lat: 12.6100, lon: 102.1035, tz: 7 },
  { name: 'ตราด', lat: 12.2428, lon: 102.5175, tz: 7 },
  { name: 'ฉะเชิงเทรา', lat: 13.6904, lon: 101.0779, tz: 7, aliases: ['แปดริ้ว'] },
  { name: 'ปราจีนบุรี', lat: 14.0509, lon: 101.3660, tz: 7 },
  { name: 'นครนายก', lat: 14.2069, lon: 101.2130, tz: 7 },
  { name: 'สระแก้ว', lat: 13.8240, lon: 102.0645, tz: 7 },

  // ภาคอีสาน
  { name: 'นครราชสีมา', lat: 14.9799, lon: 102.0978, tz: 7, aliases: ['โคราช'] },
  { name: 'บุรีรัมย์', lat: 14.9930, lon: 103.1029, tz: 7 },
  { name: 'สุรินทร์', lat: 14.8818, lon: 103.4936, tz: 7 },
  { name: 'ศรีสะเกษ', lat: 15.1186, lon: 104.3220, tz: 7 },
  { name: 'อุบลราชธานี', lat: 15.2287, lon: 104.8564, tz: 7, aliases: ['อุบล'] },
  { name: 'ยโสธร', lat: 15.7924, lon: 104.1453, tz: 7 },
  { name: 'ชัยภูมิ', lat: 15.8068, lon: 102.0316, tz: 7 },
  { name: 'อำนาจเจริญ', lat: 15.8656, lon: 104.6265, tz: 7 },
  { name: 'หนองบัวลำภู', lat: 17.2216, lon: 102.4260, tz: 7 },
  { name: 'ขอนแก่น', lat: 16.4419, lon: 102.8360, tz: 7 },
  { name: 'อุดรธานี', lat: 17.4138, lon: 102.7870, tz: 7, aliases: ['อุดร'] },
  { name: 'เลย', lat: 17.4860, lon: 101.7223, tz: 7 },
  { name: 'หนองคาย', lat: 17.8783, lon: 102.7413, tz: 7 },
  { name: 'มหาสารคาม', lat: 16.1851, lon: 103.3027, tz: 7, aliases: ['สารคาม'] },
  { name: 'ร้อยเอ็ด', lat: 16.0538, lon: 103.6520, tz: 7 },
  { name: 'กาฬสินธุ์', lat: 16.4315, lon: 103.5059, tz: 7 },
  { name: 'สกลนคร', lat: 17.1545, lon: 104.1348, tz: 7 },
  { name: 'นครพนม', lat: 17.3948, lon: 104.7692, tz: 7 },
  { name: 'มุกดาหาร', lat: 16.5453, lon: 104.7235, tz: 7 },
  { name: 'บึงกาฬ', lat: 18.3609, lon: 103.6466, tz: 7 },

  // ภาคเหนือ
  { name: 'เชียงใหม่', lat: 18.7883, lon: 98.9853, tz: 7, aliases: ['chiang mai', 'chiangmai'] },
  { name: 'ลำพูน', lat: 18.5744, lon: 99.0087, tz: 7 },
  { name: 'ลำปาง', lat: 18.2888, lon: 99.4909, tz: 7 },
  { name: 'อุตรดิตถ์', lat: 17.6200, lon: 100.0993, tz: 7 },
  { name: 'แพร่', lat: 18.1445, lon: 100.1405, tz: 7 },
  { name: 'น่าน', lat: 18.7756, lon: 100.7730, tz: 7 },
  { name: 'พะเยา', lat: 19.1664, lon: 99.9003, tz: 7 },
  { name: 'เชียงราย', lat: 19.9105, lon: 99.8406, tz: 7, aliases: ['chiang rai'] },
  { name: 'แม่ฮ่องสอน', lat: 19.3020, lon: 97.9654, tz: 7, aliases: ['ปาย'] },
  { name: 'นครสวรรค์', lat: 15.7047, lon: 100.1372, tz: 7, aliases: ['ปากน้ำโพ'] },
  { name: 'อุทัยธานี', lat: 15.3835, lon: 100.0246, tz: 7 },
  { name: 'กำแพงเพชร', lat: 16.4828, lon: 99.5227, tz: 7 },
  { name: 'ตาก', lat: 16.8840, lon: 99.1259, tz: 7, aliases: ['แม่สอด'] },
  { name: 'สุโขทัย', lat: 17.0078, lon: 99.8236, tz: 7 },
  { name: 'พิษณุโลก', lat: 16.8211, lon: 100.2659, tz: 7 },
  { name: 'พิจิตร', lat: 16.4429, lon: 100.3487, tz: 7 },
  { name: 'เพชรบูรณ์', lat: 16.4190, lon: 101.1591, tz: 7, aliases: ['เขาค้อ'] },

  // ภาคตะวันตก
  { name: 'ราชบุรี', lat: 13.5282, lon: 99.8134, tz: 7 },
  { name: 'กาญจนบุรี', lat: 14.0228, lon: 99.5328, tz: 7 },
  { name: 'เพชรบุรี', lat: 13.1119, lon: 99.9399, tz: 7, aliases: ['ชะอำ'] },
  { name: 'ประจวบคีรีขันธ์', lat: 11.8126, lon: 99.7957, tz: 7, aliases: ['หัวหิน', 'ประจวบ'] },

  // ภาคใต้
  { name: 'นครศรีธรรมราช', lat: 8.4304, lon: 99.9631, tz: 7, aliases: ['นครศรี', 'คอน'] },
  { name: 'กระบี่', lat: 8.0863, lon: 98.9063, tz: 7 },
  { name: 'พังงา', lat: 8.4510, lon: 98.5150, tz: 7 },
  { name: 'ภูเก็ต', lat: 7.8804, lon: 98.3923, tz: 7, aliases: ['phuket'] },
  { name: 'สุราษฎร์ธานี', lat: 9.1382, lon: 99.3215, tz: 7, aliases: ['สุราษ', 'เกาะสมุย', 'สมุย'] },
  { name: 'ระนอง', lat: 9.9529, lon: 98.6085, tz: 7 },
  { name: 'ชุมพร', lat: 10.4930, lon: 99.1800, tz: 7 },
  { name: 'สงขลา', lat: 7.1756, lon: 100.6142, tz: 7, aliases: ['หาดใหญ่'] },
  { name: 'สตูล', lat: 6.6238, lon: 100.0674, tz: 7 },
  { name: 'ตรัง', lat: 7.5563, lon: 99.6114, tz: 7 },
  { name: 'พัทลุง', lat: 7.6167, lon: 100.0740, tz: 7 },
  { name: 'ปัตตานี', lat: 6.8692, lon: 101.2550, tz: 7 },
  { name: 'ยะลา', lat: 6.5411, lon: 101.2803, tz: 7, aliases: ['เบตง'] },
  { name: 'นราธิวาส', lat: 6.4254, lon: 101.8253, tz: 7 }
];

/** เมืองต่างประเทศที่คนไทยเกิดหรือไปคลอดบ่อย */
export const WORLD_CITIES = [
  { name: 'โตเกียว ประเทศญี่ปุ่น', lat: 35.6762, lon: 139.6503, tz: 9, aliases: ['tokyo', 'ญี่ปุ่น'] },
  { name: 'สิงคโปร์', lat: 1.3521, lon: 103.8198, tz: 8, aliases: ['singapore'] },
  { name: 'ฮ่องกง', lat: 22.3193, lon: 114.1694, tz: 8, aliases: ['hong kong', 'hongkong'] },
  { name: 'ไทเป ไต้หวัน', lat: 25.0330, lon: 121.5654, tz: 8, aliases: ['taipei', 'ไต้หวัน'] },
  { name: 'ปักกิ่ง ประเทศจีน', lat: 39.9042, lon: 116.4074, tz: 8, aliases: ['beijing'] },
  { name: 'โซล เกาหลีใต้', lat: 37.5665, lon: 126.9780, tz: 9, aliases: ['seoul', 'เกาหลี'] },
  { name: 'เวียงจันทน์ ประเทศลาว', lat: 17.9757, lon: 102.6331, tz: 7, aliases: ['vientiane', 'ลาว'] },
  { name: 'ย่างกุ้ง ประเทศเมียนมา', lat: 16.8409, lon: 96.1735, tz: 6.5, aliases: ['yangon', 'พม่า', 'เมียนมา'] },
  { name: 'พนมเปญ ประเทศกัมพูชา', lat: 11.5564, lon: 104.9282, tz: 7, aliases: ['phnom penh', 'กัมพูชา', 'เขมร'] },
  { name: 'กัวลาลัมเปอร์ มาเลเซีย', lat: 3.1390, lon: 101.6869, tz: 8, aliases: ['kuala lumpur', 'มาเลเซีย'] },
  { name: 'ลอนดอน อังกฤษ', lat: 51.5074, lon: -0.1278, tz: 0, aliases: ['london', 'อังกฤษ'] },
  { name: 'ปารีส ฝรั่งเศส', lat: 48.8566, lon: 2.3522, tz: 1, aliases: ['paris', 'ฝรั่งเศส'] },
  { name: 'เบอร์ลิน เยอรมนี', lat: 52.5200, lon: 13.4050, tz: 1, aliases: ['berlin', 'เยอรมัน'] },
  { name: 'นิวยอร์ก สหรัฐอเมริกา', lat: 40.7128, lon: -74.0060, tz: -5, aliases: ['new york', 'อเมริกา'] },
  { name: 'ลอสแอนเจลิส สหรัฐอเมริกา', lat: 34.0522, lon: -118.2437, tz: -8, aliases: ['los angeles', 'la', 'แอลเอ'] },
  { name: 'ซิดนีย์ ออสเตรเลีย', lat: -33.8688, lon: 151.2093, tz: 10, aliases: ['sydney', 'ออสเตรเลีย'] },
  { name: 'ดูไบ สหรัฐอาหรับเอมิเรตส์', lat: 25.2048, lon: 55.2708, tz: 4, aliases: ['dubai'] }
];

export const ALL_BIRTH_PLACES = [...THAI_PROVINCES, ...WORLD_CITIES];

/** ตัดช่องว่าง/สัญลักษณ์ แล้วแปลงเป็นตัวพิมพ์เล็ก เพื่อเทียบชื่อแบบยืดหยุ่น */
function normalizePlace(value) {
  return String(value || '')
    .toLocaleLowerCase()
    .replace(/จังหวัด|อำเภอ|ตำบล|เมือง|ประเทศไทย|thailand|province|city/g, '')
    .replace(/[\s.,()/\\-]+/g, '')
    .trim();
}

/**
 * ค้นหาสถานที่เกิดจากข้อความที่ผู้ใช้พิมพ์เอง
 * ลำดับการจับคู่: ตรงตัว -> ชื่อเมืองอยู่ในข้อความ -> ข้อความอยู่ในชื่อเมือง -> ชื่อเรียกอื่น (alias)
 * ถ้าไม่เจอจริง ๆ คืน null — ไม่มั่วพิกัดให้
 */
export function findBirthPlace(typedText) {
  const query = normalizePlace(typedText);
  if (query.length < 2) return null;

  let best = null;
  let bestScore = 0;
  for (const place of ALL_BIRTH_PLACES) {
    const key = normalizePlace(place.name);
    let score = 0;
    if (key === query) score = 100;
    else if (query.includes(key)) score = 80 + key.length / 10;
    else if (key.includes(query) && query.length >= 3) score = 60 + query.length / 10;
    else if (place.aliases) {
      for (const alias of place.aliases) {
        const aliasKey = normalizePlace(alias);
        if (aliasKey === query) { score = Math.max(score, 95); break; }
        if (aliasKey.length >= 2 && query.includes(aliasKey)) score = Math.max(score, 70 + aliasKey.length / 10);
        else if (aliasKey.includes(query) && query.length >= 3) score = Math.max(score, 55);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = place;
    }
  }
  return bestScore >= 55 ? best : null;
}
