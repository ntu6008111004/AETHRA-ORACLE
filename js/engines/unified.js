/**
 * AETHRA ORACLE — Unified Reading Synthesis Engine
 * Aggregates Western Natal, BaZi Five Elements, Numerology, and Tarot Archetypes.
 */

import { AstrologyEngine } from './astrology.js';
import { BaZiEngine } from './bazi.js';
import { NumerologyEngine } from './numerology.js';
import { TarotEngine } from './tarot.js';
import { elementFullTh } from '../core/element-names.js';

export class UnifiedReadingEngine {
  static synthesize(profile) {
    const { name, birthDate, birthTime, lat, lon } = profile;

    const tarot = TarotEngine.drawCards(3);
    if (!birthDate) {
      return {
        profile,
        astrology: null,
        bazi: null,
        numerology: null,
        tarot,
        limitedReason: 'missing_birth_date',
        synthesis: {
          summaryEn: 'Birth-based synthesis is unavailable because the birth date is unknown. No date was guessed; Tarot and I Ching remain available.',
          summaryTh: 'ยังไม่สามารถสังเคราะห์ดวงกำเนิดได้เนื่องจากไม่ทราบวันเกิด ระบบไม่ได้เดาวันเกิดแทนคุณ แต่ยังใช้ไพ่ทาโรต์และอี้จิงได้',
          keyArchetype: tarot[0].nameEn,
          keyArchetypeTh: tarot[0].nameTh
        }
      };
    }

    const astro = AstrologyEngine.calculateChart(birthDate, birthTime, lat, lon);
    const bazi = BaZiEngine.calculatePillars(birthDate, birthTime);
    const num = NumerologyEngine.analyze(name, birthDate);

    // Synthesis of core energies
    const coreElement = astro.western.sun.element;
    const dominantBazi = bazi.dominantElement;
    const lifePath = num.lifePath;

    const summaryEn = `Your celestial blueprint aligns the ${coreElement.toUpperCase()} energy of ${astro.western.sun.nameEn} with a strong ${dominantBazi} BaZi foundation. Life Path ${lifePath} calls you toward purposeful leadership tempered with philosophical depth.`;
    const summaryTh = `ผังดวงชะตาของคุณผสานพลัง${elementFullTh(coreElement)}แห่งราศี${astro.western.sun.nameTh} เข้ากับฐานพลัง${elementFullTh(dominantBazi)}ในดวงจีน และเลขเส้นทางชีวิตหมายเลข ${lifePath} — สามพลังนี้สะท้อนว่าคุณเติบโตได้ดีที่สุดเมื่อใช้จุดแข็งของแต่ละธาตุร่วมกัน ทั้งความรู้สึกที่ลึกซึ้ง รากฐานที่มั่นคง และจังหวะชีวิตเฉพาะตัว`;

    return {
      profile,
      astrology: astro,
      bazi,
      numerology: num,
      tarot,
      limitedReason: astro.confidence.ascendantAvailable && bazi.confidence.hourPillarAvailable ? null : 'partial_birth_details',
      synthesis: {
        summaryEn,
        summaryTh,
        keyArchetype: tarot[0].nameEn,
        keyArchetypeTh: tarot[0].nameTh
      }
    };
  }
}
