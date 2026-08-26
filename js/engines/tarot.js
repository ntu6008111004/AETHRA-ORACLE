/**
 * AETHRA ORACLE — Tarot Arcana Engine
 * Complete 78-Card Deck (22 Major Arcana + 56 Minor Arcana)
 */
import { elementFullTh } from '../core/element-names.js';

export const MAJOR_ARCANA = [
  { id: 0, nameEn: "The Fool", nameTh: "เดอะฟูล (The Fool)", element: "Air", keywordsEn: "New beginnings, spontaneity, pure potential", keywordsTh: "การเริ่มต้นใหม่ ความบริสุทธิ์ใจ ความกล้าที่จะก้าวสู่สิ่งไม่รู้" },
  { id: 1, nameEn: "The Magician", nameTh: "เดอะเมจิเชียน (The Magician)", element: "Air", keywordsEn: "Manifestation, resourcefulness, willpower", keywordsTh: "การเนรมิตเป้าหมาย ความเชี่ยวชาญ เจตจำนงที่ทรงพลัง" },
  { id: 2, nameEn: "The High Priestess", nameTh: "เดอะไฮพรีสเตส (The High Priestess)", element: "Water", keywordsEn: "Intuition, sacred knowledge, divine feminine", keywordsTh: "สัญชาตญาณ ปัญญาอันเร้นลับ ความหยั่งรู้ภายใน" },
  { id: 3, nameEn: "The Empress", nameTh: "ดิเอ็มเพรส (The Empress)", element: "Earth", keywordsEn: "Abundance, fertility, nurturing creation", keywordsTh: "ความอุดมสมบูรณ์ การโอบอุ้มดูแล การเติบโตงอกงาม" },
  { id: 4, nameEn: "The Emperor", nameTh: "ดิเอ็มเพอเรอร์ (The Emperor)", element: "Fire", keywordsEn: "Authority, structure, grounded leadership", keywordsTh: "ความเป็นผู้นำ โครงสร้างที่มั่นคง อำนาจและการควบคุม" },
  { id: 5, nameEn: "The Hierophant", nameTh: "เดอะไฮโรแฟนท์ (The Hierophant)", element: "Earth", keywordsEn: "Tradition, spiritual wisdom, mentorship", keywordsTh: "จารีตประเพณี ปัญญาคำสอนทางจิตวิญญาณ ครูบาอาจารย์" },
  { id: 6, nameEn: "The Lovers", nameTh: "เดอะเลิฟเวอร์ส (The Lovers)", element: "Air", keywordsEn: "Harmonious union, alignment of values, choice", keywordsTh: "ความผูกพันอันกลมเกลียว การเลือกตามเสียงหัวใจ ความสอดคล้อง" },
  { id: 7, nameEn: "The Chariot", nameTh: "เดอะแชริออท (The Chariot)", element: "Water", keywordsEn: "Determination, focused drive, victory over doubt", keywordsTh: "ความมุ่งมั่น ความเด็ดเดี่ยว ชัยชนะจากการควบคุมตนเอง" },
  { id: 8, nameEn: "Strength", nameTh: "สเตร็งธ์ (Strength)", element: "Fire", keywordsEn: "Gentle power, inner courage, compassion", keywordsTh: "พลังอันอ่อนโยน ความกล้าหาญจากจิตวิญญาณ ความเมตตา" },
  { id: 9, nameEn: "The Hermit", nameTh: "เดอะเฮอร์มิท (The Hermit)", element: "Earth", keywordsEn: "Inner reflection, solitude, lantern of truth", keywordsTh: "การค้นหาความจริงภายใน ความสันโดษ แสงประทีปแห่งปัญญา" },
  { id: 10, nameEn: "Wheel of Fortune", nameTh: "วงล้อแห่งโชคชะตา (Wheel of Fortune)", element: "Fire", keywordsEn: "Cycles of change, destiny, celestial turning", keywordsTh: "วัฏจักรแห่งการเปลี่ยนแปลง โชคชะตา จังหวะชีวิตที่หมุนเวียน" },
  { id: 11, nameEn: "Justice", nameTh: "จัสติส (Justice)", element: "Air", keywordsEn: "Fairness, truth, cause and karmic consequence", keywordsTh: "ความเที่ยงธรรม สัจจะ ผลแห่งกรรมและการกระทำ" },
  { id: 12, nameEn: "The Hanged Man", nameTh: "เดอะแฮงด์แมน (The Hanged Man)", element: "Water", keywordsEn: "Surrender, new perspective, pausing action", keywordsTh: "การปล่อยวาง มุมมองใหม่ การหยุดนิ่งเพื่อความกระจ่าง" },
  { id: 13, nameEn: "Death", nameTh: "เดธ (Death)", element: "Water", keywordsEn: "Transformation, inevitable ending, rebirth", keywordsTh: "การเปลี่ยนผ่าน การสิ้นสุดของสิ่งเดิม สู่การเกิดใหม่ที่สงบ" },
  { id: 14, nameEn: "Temperance", nameTh: "เทมเพอร์แรนซ์ (Temperance)", element: "Fire", keywordsEn: "Alchemy, middle path, harmonious balance", keywordsTh: "ความพอดี ทางสายกลาง การประสมประสานที่ลงตัว" },
  { id: 15, nameEn: "The Devil", nameTh: "เดอะเดวิล (The Devil)", element: "Earth", keywordsEn: "Attachment, shadow self, unmasking illusion", keywordsTh: "ภาพลวงตา ความยึดติด ตัวตนในเงามืด การปลดปล่อยพันธนาการ" },
  { id: 16, nameEn: "The Tower", nameTh: "เดอะทาวเวอร์ (The Tower)", element: "Fire", keywordsEn: "Sudden awakening, breakdown of false walls", keywordsTh: "การตื่นรู้กะทันหัน การพังทลายของสิ่งลวงตาเพื่อความจริง" },
  { id: 17, nameEn: "The Star", nameTh: "เดอะสตาร์ (The Star)", element: "Air", keywordsEn: "Hope, celestial inspiration, tranquil healing", keywordsTh: "ความหวัง แสงนำทางแห่งดวงดาว การเยียวยาจิตใจอันสงบ" },
  { id: 18, nameEn: "The Moon", nameTh: "เดอะมูน (The Moon)", element: "Water", keywordsEn: "Subconscious depths, dreams, mystery", keywordsTh: "ห้วงจิตไร้สำนึก ความฝัน ความคลุมเครือที่ซ่อนเร้น" },
  { id: 19, nameEn: "The Sun", nameTh: "เดอะซัน (The Sun)", element: "Fire", keywordsEn: "Radiance, clarity, vitality, pure joy", keywordsTh: "ความกระจ่างแจ้ง พลังชีวิต ความสว่างไสวและความยินดี" },
  { id: 20, nameEn: "Judgement", nameTh: "จัดจ์เมนต์ (Judgement)", element: "Fire", keywordsEn: "Higher calling, self-reckoning, rebirth", keywordsTh: "การตื่นขึ้นสู่พันธกิจที่แท้จริง เสียงเรียกจากภายใน" },
  { id: 21, nameEn: "The World", nameTh: "เดอะเวิลด์ (The World)", element: "Earth", keywordsEn: "Wholeness, completion, cosmic harmony", keywordsTh: "ความสมบูรณ์แบบ วงจรที่บรรลุผล ดุลยภาพแห่งจักรวาล" }
];

export const SUITS = [
  { id: 'wands', nameEn: 'Wands', nameTh: 'ไม้เท้า', element: 'Fire' },
  { id: 'cups', nameEn: 'Cups', nameTh: 'ถ้วย', element: 'Water' },
  { id: 'swords', nameEn: 'Swords', nameTh: 'ดาบ', element: 'Air' },
  { id: 'pentacles', nameEn: 'Pentacles', nameTh: 'เหรียญ', element: 'Earth' }
];

export class TarotEngine {
  static getFullDeck() {
    const deck = [...MAJOR_ARCANA.map(c => ({ ...c, type: 'major', suit: 'major' }))];
    
    // Generate Minor Arcana
    SUITS.forEach(suit => {
      const ranks = [
        { rank: 'Ace', nameTh: 'เอซ' },
        { rank: 'Two', nameTh: 'สอง' },
        { rank: 'Three', nameTh: 'สาม' },
        { rank: 'Four', nameTh: 'สี่' },
        { rank: 'Five', nameTh: 'ห้า' },
        { rank: 'Six', nameTh: 'หก' },
        { rank: 'Seven', nameTh: 'เจ็ด' },
        { rank: 'Eight', nameTh: 'แปด' },
        { rank: 'Nine', nameTh: 'เก้า' },
        { rank: 'Ten', nameTh: 'สิบ' },
        { rank: 'Page', nameTh: 'มหาดเล็ก' },
        { rank: 'Knight', nameTh: 'อัศวิน' },
        { rank: 'Queen', nameTh: 'ราชินี' },
        { rank: 'King', nameTh: 'ราชา' }
      ];

      ranks.forEach(r => {
        deck.push({
          id: `${suit.id}_${r.rank.toLowerCase()}`,
          nameEn: `${r.rank} of ${suit.nameEn}`,
          nameTh: `${r.nameTh}${suit.nameTh}`,
          type: 'minor',
          suit: suit.id,
          element: suit.element,
          keywordsEn: `Energy of ${suit.element} expressed through ${r.rank}`,
          keywordsTh: `พลัง${elementFullTh(suit.element)} ในมิติของ${r.nameTh} สื่อถึงจังหวะของเรื่องนั้นตั้งแต่เริ่มต้นจนสมบูรณ์`
        });
      });
    });

    return deck;
  }

  // Draw N cards randomly without replacement
  static drawCards(count = 3) {
    const deck = this.getFullDeck();
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck.slice(0, count).map(card => ({
      ...card,
      isReversed: Math.random() < 0.25 // 25% chance of reversed
    }));
  }
}
