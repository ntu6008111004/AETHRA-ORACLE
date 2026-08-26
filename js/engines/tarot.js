/**
 * AETHRA ORACLE — Tarot Arcana Engine
 * สำรับเต็ม 78 ใบ (ไพ่ชุดใหญ่ 22 ใบ + ไพ่ชุดเล็ก 56 ใบ)
 * ความหมายทั้งหมดดึงจากฐานข้อมูลภาษาชาวบ้านใน js/data/
 */
import { elementFullTh } from '../core/element-names.js';
import { TAROT_MAJOR_TH } from '../data/tarot-major.js';
import { TAROT_WANDS_CUPS_TH } from '../data/tarot-wands-cups.js';
import { TAROT_SWORDS_PENTACLES_TH } from '../data/tarot-swords-pentacles.js';

const MINOR_TH = {
  ...TAROT_WANDS_CUPS_TH,
  ...TAROT_SWORDS_PENTACLES_TH
};

const REVERSED_MINOR_TH = 'ไพ่กลับหัว: เรื่องนี้ยังติดขัด มาช้ากว่าที่คิด หรือออกมาในทางตรงข้าม ให้กลับไปดูว่าอะไรกำลังขวางอยู่ แล้วแก้ทีละจุด';

export const MAJOR_ARCANA = [
  { id: 0, nameEn: "The Fool", nameTh: "เดอะฟูล (The Fool)", element: "Air", keywordsEn: "New beginnings, spontaneity, pure potential" },
  { id: 1, nameEn: "The Magician", nameTh: "เดอะเมจิเชียน (The Magician)", element: "Air", keywordsEn: "Manifestation, resourcefulness, willpower" },
  { id: 2, nameEn: "The High Priestess", nameTh: "เดอะไฮพรีสเตส (The High Priestess)", element: "Water", keywordsEn: "Intuition, sacred knowledge, divine feminine" },
  { id: 3, nameEn: "The Empress", nameTh: "ดิเอ็มเพรส (The Empress)", element: "Earth", keywordsEn: "Abundance, fertility, nurturing creation" },
  { id: 4, nameEn: "The Emperor", nameTh: "ดิเอ็มเพอเรอร์ (The Emperor)", element: "Fire", keywordsEn: "Authority, structure, grounded leadership" },
  { id: 5, nameEn: "The Hierophant", nameTh: "เดอะไฮโรแฟนท์ (The Hierophant)", element: "Earth", keywordsEn: "Tradition, spiritual wisdom, mentorship" },
  { id: 6, nameEn: "The Lovers", nameTh: "เดอะเลิฟเวอร์ส (The Lovers)", element: "Air", keywordsEn: "Harmonious union, alignment of values, choice" },
  { id: 7, nameEn: "The Chariot", nameTh: "เดอะแชริออท (The Chariot)", element: "Water", keywordsEn: "Determination, focused drive, victory over doubt" },
  { id: 8, nameEn: "Strength", nameTh: "สเตร็งธ์ (Strength)", element: "Fire", keywordsEn: "Gentle power, inner courage, compassion" },
  { id: 9, nameEn: "The Hermit", nameTh: "เดอะเฮอร์มิท (The Hermit)", element: "Earth", keywordsEn: "Inner reflection, solitude, lantern of truth" },
  { id: 10, nameEn: "Wheel of Fortune", nameTh: "วงล้อแห่งโชคชะตา (Wheel of Fortune)", element: "Fire", keywordsEn: "Cycles of change, destiny, celestial turning" },
  { id: 11, nameEn: "Justice", nameTh: "จัสติส (Justice)", element: "Air", keywordsEn: "Fairness, truth, cause and karmic consequence" },
  { id: 12, nameEn: "The Hanged Man", nameTh: "เดอะแฮงด์แมน (The Hanged Man)", element: "Water", keywordsEn: "Surrender, new perspective, pausing action" },
  { id: 13, nameEn: "Death", nameTh: "เดธ (Death)", element: "Water", keywordsEn: "Transformation, inevitable ending, rebirth" },
  { id: 14, nameEn: "Temperance", nameTh: "เทมเพอร์แรนซ์ (Temperance)", element: "Fire", keywordsEn: "Alchemy, middle path, harmonious balance" },
  { id: 15, nameEn: "The Devil", nameTh: "เดอะเดวิล (The Devil)", element: "Earth", keywordsEn: "Attachment, shadow self, unmasking illusion" },
  { id: 16, nameEn: "The Tower", nameTh: "เดอะทาวเวอร์ (The Tower)", element: "Fire", keywordsEn: "Sudden awakening, breakdown of false walls" },
  { id: 17, nameEn: "The Star", nameTh: "เดอะสตาร์ (The Star)", element: "Air", keywordsEn: "Hope, celestial inspiration, tranquil healing" },
  { id: 18, nameEn: "The Moon", nameTh: "เดอะมูน (The Moon)", element: "Water", keywordsEn: "Subconscious depths, dreams, mystery" },
  { id: 19, nameEn: "The Sun", nameTh: "เดอะซัน (The Sun)", element: "Fire", keywordsEn: "Radiance, clarity, vitality, pure joy" },
  { id: 20, nameEn: "Judgement", nameTh: "จัดจ์เมนต์ (Judgement)", element: "Fire", keywordsEn: "Higher calling, self-reckoning, rebirth" },
  { id: 21, nameEn: "The World", nameTh: "เดอะเวิลด์ (The World)", element: "Earth", keywordsEn: "Wholeness, completion, cosmic harmony" }
];

export const SUITS = [
  { id: 'wands', nameEn: 'Wands', nameTh: 'ไม้เท้า', element: 'Fire' },
  { id: 'cups', nameEn: 'Cups', nameTh: 'ถ้วย', element: 'Water' },
  { id: 'swords', nameEn: 'Swords', nameTh: 'ดาบ', element: 'Air' },
  { id: 'pentacles', nameEn: 'Pentacles', nameTh: 'เหรียญ', element: 'Earth' }
];

export const MINOR_RANKS = [
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

export class TarotEngine {
  static getFullDeck() {
    const deck = MAJOR_ARCANA.map(c => {
      const detail = TAROT_MAJOR_TH[c.id] || {};
      const meaningTh = detail.m || '';
      return {
        ...c,
        type: 'major',
        suit: 'major',
        meaningTh,
        keywordsTh: meaningTh,
        adviceTh: detail.a || '',
        loveTh: detail.love || '',
        workTh: detail.work || '',
        healthTh: detail.health || '',
        reversedTh: detail.r || ''
      };
    });

    // สร้างไพ่ชุดเล็ก 56 ใบ
    SUITS.forEach(suit => {
      MINOR_RANKS.forEach(r => {
        const detail = MINOR_TH[suit.id]?.[r.rank] || {};
        const meaningTh = detail.m || `พลัง${elementFullTh(suit.element)} ในมิติของ${r.nameTh}`;
        deck.push({
          id: `${suit.id}_${r.rank.toLowerCase()}`,
          nameEn: `${r.rank} of ${suit.nameEn}`,
          nameTh: `${r.nameTh}${suit.nameTh}`,
          type: 'minor',
          suit: suit.id,
          element: suit.element,
          keywordsEn: `Energy of ${suit.element} expressed through ${r.rank}`,
          meaningTh,
          keywordsTh: meaningTh,
          adviceTh: detail.a || '',
          loveTh: detail.love || '',
          workTh: detail.work || '',
          healthTh: detail.health || '',
          reversedTh: detail.r || REVERSED_MINOR_TH
        });
      });
    });

    return deck;
  }

  // สุ่มไพ่ N ใบ ไม่ซ้ำใบเดิม
  static drawCards(count = 3) {
    const deck = this.getFullDeck();
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck.slice(0, count).map(card => ({
      ...card,
      isReversed: Math.random() < 0.25 // โอกาสไพ่กลับหัว 25%
    }));
  }
}
