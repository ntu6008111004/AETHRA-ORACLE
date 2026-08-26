/**
 * AETHRA ORACLE — บทสรุปชะตาชีวิตแบบองค์รวม
 * แยกเป็นเรื่อง ๆ ทีละศาสตร์ อ่านง่าย ไม่ใช่ย่อหน้าเดียวจบ
 */

import { UnifiedReadingEngine } from '../engines/unified.js';
import { Storage } from '../core/storage.js';
import { SoundManager } from '../core/sound.js';
import { FIVE_ELEMENTS } from '../engines/bazi.js';
import { LIFE_PATH_MEANINGS_TH } from '../engines/numerology.js';
import { elementFullTh, elementWithMeaningTh } from '../core/element-names.js';

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function section(icon, tagTh, titleTh, bodyHtml, sourceTh) {
  return `
    <article class="domain-section">
      <h3>${icon} ${esc(titleTh)}</h3>
      ${bodyHtml}
      <div class="source-badge">มาจาก: ${esc(sourceTh)}</div>
    </article>`;
}

export class UnifiedView {
  static render(container) {
    const profile = Storage.getProfile();
    const result = UnifiedReadingEngine.synthesize(profile);
    const name = profile.nickname || profile.name || 'ผู้แสวงหาปัญญา';

    if (!result.astrology) {
      container.innerHTML = `
        <div class="reading-wrapper">
          <div class="empty-state-card">
            <div class="empty-state-icon">🔮</div>
            <h2>ยังสรุปดวงชะตาไม่ได้</h2>
            <p>${esc(result.synthesis.summaryTh)}</p>
            <a href="#profile" class="btn btn-primary"><span>ไปกรอกวันเกิด</span></a>
          </div>
        </div>`;
      return;
    }

    const astro = result.astrology;
    const bazi = result.bazi;
    const num = result.numerology;
    const card = result.tarot[0];
    const dayMasterInfo = FIVE_ELEMENTS[bazi.dayMaster.element];
    const lifePathInfo = LIFE_PATH_MEANINGS_TH[num.lifePath] || LIFE_PATH_MEANINGS_TH[1];

    const sections = [
      section('☀️', 'โหราศาสตร์สากล', 'ตัวตนของคุณตามราศี',
        `<p>ราศีเกิดของคุณคือ <strong>ราศี${esc(astro.western.sun.nameTh)}</strong> (${esc(elementWithMeaningTh(astro.western.sun.element))})
        ส่วนดวงจันทร์ซึ่งแทนจิตใจอยู่ใน <strong>ราศี${esc(astro.western.moon.nameTh)}</strong>
        แปลง่าย ๆ ว่า ภายนอกคุณแสดงออกแบบชาวราศี${esc(astro.western.sun.nameTh)}
        แต่ความรู้สึกลึก ๆ ข้างในทำงานแบบชาวราศี${esc(astro.western.moon.nameTh)}
        ${astro.western.ascendant
          ? `และลัคนาราศี${esc(astro.western.ascendant.nameTh)} คือภาพแรกที่คนอื่นมองเห็นคุณ`
          : 'ส่วนลัคนายังคำนวณไม่ได้เพราะไม่ทราบเวลาเกิดที่แน่นอน'}</p>`,
        'ตำแหน่งดวงอาทิตย์ ดวงจันทร์ และลัคนา ณ เวลาเกิดของคุณ'),

      section('🏮', 'ดวงจีน', 'ธาตุแท้ประจำตัวของคุณ',
        `<p>ธาตุประจำตัวคุณคือ <strong>${esc(elementFullTh(bazi.dayMaster.element))}</strong>
        (${esc(bazi.dayMaster.nameTh)} — ${esc(bazi.dayMaster.imageTh)})</p>
        <p style="margin-top: 8px;">${esc(dayMasterInfo.lifeTh)}</p>
        <p style="margin-top: 8px;">สายงานที่ถูกโฉลก: ${esc(dayMasterInfo.careerTh)}</p>
        <p style="margin-top: 8px;">${esc(bazi.strength.plainTh)}</p>
        <p style="margin-top: 8px;">ธาตุที่ควรเสริมคือ <strong>ธาตุ${esc(bazi.favourableElementsTh.join(' และธาตุ'))}</strong>
        ผ่านสีเสื้อผ้า ${esc(bazi.favourableColorsTh.join(' / '))}</p>`,
        'ผังโป๊ยหยี่สี่เถียว คำนวณจากวันเดือนปีเกิดตามปฏิทินสุริยคติจีน'),

      section('🔢', 'เลขศาสตร์', 'เลขเส้นทางชีวิตหมายเลข ' + num.lifePath,
        `<p><strong>"${esc(lifePathInfo.title)}"</strong></p>
        <p style="margin-top: 8px;">${esc(lifePathInfo.desc)}</p>
        <p style="margin-top: 8px;">ปีนี้คุณอยู่ในจังหวะชีวิตหมายเลข <strong>${num.personalYear}</strong>
        ${num.personalYear <= 3 ? 'ซึ่งเป็นช่วงต้นรอบ เหมาะกับการเริ่มต้นและหว่านเมล็ดสิ่งใหม่' :
          num.personalYear <= 6 ? 'ซึ่งเป็นช่วงกลางรอบ เหมาะกับการลงมือสร้างและดูแลสิ่งที่เริ่มไว้ให้โต' :
          'ซึ่งเป็นช่วงปลายรอบ เหมาะกับการเก็บเกี่ยว สรุปบทเรียน และปล่อยสิ่งที่หมดอายุ'}</p>`,
        'การลดทอนตัวเลขจากวันเดือนปีเกิดตามหลักเลขศาสตร์สากล'),

      section('🃏', 'ไพ่นำทาง', 'สัญลักษณ์ประจำช่วงนี้: ' + card.nameTh,
        `<p>${esc(card.meaningTh || card.keywordsTh)}</p>
        ${card.adviceTh ? `<p style="margin-top: 8px;"><strong style="color:#68D391;">คำแนะนำ:</strong> ${esc(card.adviceTh)}</p>` : ''}
        <p style="margin-top: 8px; font-size: 12px; color: var(--color-text-muted);">
        ไพ่ใบนี้สุ่มใหม่ทุกครั้งที่เปิดหน้านี้ ใช้เป็นมุมมองเสริม ไม่ใช่คำตัดสิน</p>`,
        'การสุ่มไพ่ 1 ใบจากสำรับ 78 ใบ'),

      section('🧭', 'สรุป', 'อ่านสามพลังรวมกัน',
        `<p>${esc(result.synthesis.summaryTh)}</p>
        <p style="margin-top: 10px;">ถ้าอยากอ่านแบบเจาะลึกรายด้าน ทั้งการงาน การเงิน ความรัก สุขภาพ และโชคลาภ
        พร้อมสีมงคลและเลขมงคลเฉพาะตัว ไปที่หน้า <a href="#reading" class="notice-link">ดูดวงของฉัน</a>
        หรือถามต่อกับหมอดูที่ <a href="#consultation" class="notice-link">ห้องปรึกษา</a></p>`,
        'การสังเคราะห์ธาตุ ราศี และเลขทั้งหมดข้างต้น')
    ];

    container.innerHTML = `
      <div class="unified-view-wrapper reading-wrapper">
        <div>
          <div class="hero-badge" style="margin-bottom: var(--space-2);">
            <span>✦</span> <span>คำอ่านดวงชะตาแบบองค์รวม</span> <span>✦</span>
          </div>
          <h1 style="font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: var(--space-2);">บทสรุปชะตาชีวิตของคุณ${esc(name)}</h1>
          <p style="color: var(--color-text-secondary); font-size: var(--font-size-base);">
            อ่านทีละเรื่อง จากสี่ศาสตร์ที่คำนวณจากวันเกิดของคุณจริง ๆ
          </p>
        </div>
        <div class="domain-sections">${sections.join('')}</div>
      </div>
    `;

    SoundManager.play('reading-complete');
  }
}
