/**
 * AETHRA ORACLE — เอนจินทำนายฝัน
 * ------------------------------------------------------------------
 * อ่านความฝันที่ผู้ใช้พิมพ์เข้ามา แล้วจับว่าในฝันมีสัญลักษณ์อะไรบ้าง
 * จากนั้นเปิดตำราทำนายฝันไทยมาอธิบายทีละสัญลักษณ์
 *
 * หลักการที่ยึด (เหมือนทุกศาสตร์ในเว็บนี้)
 * - ห้ามเดา ถ้าจับสัญลักษณ์ในตำราไม่ได้เลย ต้องบอกตรง ๆ ว่าตำราไม่มี
 *   ห้ามแต่งความหมายขึ้นเองให้ผู้ใช้เข้าใจผิดว่าเป็นตำรา
 * - ทุกความหมายต้องอ้างที่มาได้ว่ามาจากตำราเล่มไหน
 * - เลขที่แสดงเป็นเลขที่ตำราฝันไทยผูกไว้ ไม่ใช่เลขที่เว็บสุ่มขึ้นเอง
 *   และห้ามเชียร์ให้เอาไปเสี่ยงโชค
 *
 * เรื่องเทคนิคการจับคำ
 * ภาษาไทยเขียนติดกันไม่มีช่องว่างระหว่างคำ การค้นหาจึงใช้วิธีหาคำย่อย
 * แต่ต้องระวังคำสั้นไปโผล่ในคำยาว เช่น "งู" อยู่ใน "งูใหญ่" ด้วย
 * จึงเรียงจับคำยาวก่อน แล้วกันไม่ให้ตำแหน่งที่จับไปแล้วถูกจับซ้ำ
 */

import { DREAM_BOOK, DREAM_SOURCE_TH, DREAM_SOURCE_NOTE_TH } from '../data/dream-book.js';

/** ตัดอักขระที่ไม่เกี่ยวออก เหลือแต่เนื้อความสำหรับจับคำ */
function normalize(text) {
  return String(text || '')
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * สระและวรรณยุกต์ที่เกาะอยู่กับพยัญชนะตัวหน้า
 *
 * ใช้ตรวจว่าคำที่จับได้เป็นคำจริง หรือไปโผล่กลางคำอื่นโดยบังเอิญ
 * เพราะภาษาไทยเขียนติดกันไม่มีช่องว่าง คำสั้นจึงชนกันได้ง่ายมาก
 * ตัวอย่างจริงที่เคยพลาด คำว่า "นก" ไปโผล่ในคำว่า "กินก๋วยเตี๋ยว"
 * (กิ-นก-๋วย) ทำให้ระบบทำนายว่าฝันเห็นนก ทั้งที่ผู้ใช้พูดถึงก๋วยเตี๋ยว
 *
 * วิธีตรวจ ถ้าตัวอักษรถัดจากคำที่จับได้เป็นสระหรือวรรณยุกต์พวกนี้
 * แปลว่าพยัญชนะตัวท้ายของคำที่จับได้ ที่จริงเป็นตัวต้นของพยางค์ถัดไป
 * การจับครั้งนั้นจึงผิด ต้องทิ้ง
 */
const TRAILING_MARKS = 'ะัาำิีึืุู็่้๊๋์ๆๅํ';

function isSpuriousMatch(text, at, length) {
  const after = text[at + length];
  return after !== undefined && TRAILING_MARKS.includes(after);
}

/**
 * รายการคำค้นทั้งหมด (ชื่อหลัก + ชื่อเรียกอื่น) เรียงจากยาวไปสั้น
 * ทำครั้งเดียวตอนโหลดไฟล์ เพราะตำราไม่เปลี่ยนระหว่างใช้งาน
 */
const SEARCH_TERMS = (() => {
  const terms = [];
  DREAM_BOOK.forEach(symbol => {
    const words = [symbol.keyTh, ...(symbol.aliasesTh || [])];
    words.forEach(word => {
      const clean = normalize(word);
      if (clean.length >= 2) terms.push({ word: clean, symbol });
    });
  });
  return terms.sort((a, b) => b.word.length - a.word.length);
})();

export class DreamEngine {
  /** จำนวนสัญลักษณ์ทั้งหมดในตำรา ใช้บอกผู้ใช้ว่าฐานข้อมูลใหญ่แค่ไหน */
  static get symbolCount() {
    return DREAM_BOOK.length;
  }

  static get sourceTh() {
    return DREAM_SOURCE_TH;
  }

  static get sourceNoteTh() {
    return DREAM_SOURCE_NOTE_TH;
  }

  /** คืนรายชื่อสัญลักษณ์ทั้งหมด ใช้ทำหน้าสารบัญหรือปุ่มลัด */
  static allSymbols() {
    return DREAM_BOOK.map(s => ({ keyTh: s.keyTh, tone: s.tone, categoryTh: s.categoryTh }));
  }

  /**
   * จับสัญลักษณ์จากข้อความฝัน
   * @param {string} dreamText ความฝันที่ผู้ใช้พิมพ์
   * @returns {{keyTh:string, tone:string, meaningTh:string}[]} เรียงตามลำดับที่ปรากฏในฝัน
   */
  static findSymbols(dreamText) {
    const text = normalize(dreamText);
    if (!text) return [];

    // ทำเครื่องหมายตำแหน่งที่จับไปแล้ว กันคำสั้นซ้อนในคำยาว
    const taken = new Array(text.length).fill(false);
    const found = [];
    const seenKeys = new Set();

    for (const { word, symbol } of SEARCH_TERMS) {
      let from = 0;
      while (from <= text.length - word.length) {
        const at = text.indexOf(word, from);
        if (at === -1) break;

        let overlapped = false;
        for (let i = at; i < at + word.length; i += 1) {
          if (taken[i]) { overlapped = true; break; }
        }

        // คำที่ไปโผล่กลางคำอื่นโดยบังเอิญ ต้องไม่นับ ไม่งั้นจะทำนายมั่ว
        if (isSpuriousMatch(text, at, word.length)) {
          from = at + 1;
          continue;
        }

        if (!overlapped && !seenKeys.has(symbol.keyTh)) {
          for (let i = at; i < at + word.length; i += 1) taken[i] = true;
          seenKeys.add(symbol.keyTh);
          found.push({ ...symbol, matchedWordTh: word, position: at });
        }
        from = at + 1;
      }
    }

    return found.sort((a, b) => a.position - b.position);
  }

  /**
   * ทำนายฝันฉบับเต็ม
   * @param {string} dreamText ความฝัน
   * @param {object} [options]
   * @param {string[]} [options.luckyNumbers] เลขมงคลประจำตัวจากดวง ใช้ไฮไลต์เลขที่ตรงกัน
   * @param {string} [options.badNumber] เลขกาลกิณีประจำตัว ใช้เตือนว่าเลขไหนไม่ถูกโฉลก
   */
  static interpret(dreamText, options = {}) {
    const text = normalize(dreamText);

    if (!text) {
      return {
        available: false,
        reasonTh: 'ยังไม่ได้เล่าความฝัน กรุณาพิมพ์ว่าฝันเห็นอะไรก่อน',
        symbols: []
      };
    }

    if (text.length < 4) {
      return {
        available: false,
        reasonTh: 'ความฝันที่เล่ามาสั้นเกินไป ลองเล่าให้ละเอียดขึ้นว่าเห็นอะไร ทำอะไร อยู่ที่ไหน',
        symbols: []
      };
    }

    const symbols = this.findSymbols(text);

    if (symbols.length === 0) {
      return {
        available: false,
        reasonTh: 'ตำราทำนายฝันที่เว็บนี้ใช้ ยังไม่มีสัญลักษณ์ที่ตรงกับฝันของคุณ '
          + 'ระบบจะไม่เดาความหมายให้ เพราะจะกลายเป็นแต่งเรื่องขึ้นเอง '
          + 'ลองเล่าใหม่โดยใส่สิ่งที่เห็นชัด ๆ ในฝัน เช่น เห็นสัตว์อะไร อยู่ที่ไหน เกิดอะไรขึ้น',
        symbols: [],
        totalInBook: DREAM_BOOK.length
      };
    }

    // นับโทนรวมของฝัน ตำราถือว่าสัญลักษณ์เด่นที่สุดคืออันแรกที่ปรากฏ
    const goodCount = symbols.filter(s => s.tone === 'ดี').length;
    const badCount = symbols.filter(s => s.tone === 'ร้าย').length;
    const mixedCount = symbols.filter(s => s.tone === 'ปนกัน').length;

    let overallTone;
    let overallTh;
    if (goodCount > 0 && badCount === 0) {
      overallTone = 'ดี';
      overallTh = 'ฝันนี้ตำราอ่านว่าเป็นฝันดี';
    } else if (badCount > 0 && goodCount === 0) {
      overallTone = 'ร้าย';
      overallTh = 'ฝันนี้ตำราอ่านว่าเป็นฝันที่ต้องระวัง';
    } else if (goodCount > 0 && badCount > 0) {
      overallTone = 'ปนกัน';
      overallTh = 'ฝันนี้มีทั้งส่วนดีและส่วนที่ต้องระวังปนกัน';
    } else {
      overallTone = 'ปนกัน';
      overallTh = 'ฝันนี้ตำราอ่านว่ากลาง ๆ ขึ้นกับสถานการณ์ของคนฝัน';
    }

    // รวมเลขจากทุกสัญลักษณ์ที่จับได้ ไม่ซ้ำ และเรียงให้ดูง่าย
    const numberSet = [];
    symbols.forEach(s => {
      (s.numbers || []).forEach(n => {
        if (!numberSet.includes(n)) numberSet.push(n);
      });
    });

    const luckySet = new Set((options.luckyNumbers || []).map(String));
    const badDigit = options.badNumber != null ? String(options.badNumber) : null;

    const numbers = numberSet.map(n => ({
      value: n,
      // เลขนี้มีตัวเลขที่ถูกโฉลกกับวันเกิดเจ้าตัวอยู่ไหม
      matchesOwnerLucky: [...n].some(d => luckySet.has(d)),
      hasOwnerBadDigit: badDigit != null && n.includes(badDigit)
    }));

    return {
      available: true,
      dreamTextTh: text,
      symbols,
      symbolCount: symbols.length,
      overallTone,
      overallToneTh: overallTh,
      goodCount,
      badCount,
      mixedCount,
      numbers,
      sourceTh: DREAM_SOURCE_TH,
      sourceNoteTh: DREAM_SOURCE_NOTE_TH,
      totalInBook: DREAM_BOOK.length
    };
  }
}
