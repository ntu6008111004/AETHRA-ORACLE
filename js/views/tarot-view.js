/**
 * AETHRA ORACLE — Tarot Arcana View
 * ภาษาไทยเข้าใจง่าย พร้อมระบบเปิดไพ่ที่นุ่มนวล
 */

import { TarotEngine } from '../engines/tarot.js';
import { SoundManager } from '../core/sound.js';
import { I18n } from '../core/i18n.js';
import { Storage } from '../core/storage.js';
import { OracleAIService } from '../services/oracle-ai.js';
import { ReadingView } from './reading-view.js';
import { elementWithMeaningTh } from '../core/element-names.js';

export function isKeyboardActivationKey(key) {
  return key === 'Enter' || key === ' ';
}

export class TarotView {
  static render(container) {
    container.innerHTML = `
      <div class="tarot-view-wrapper">
        <div class="hero-badge" style="margin-bottom: var(--space-2);">
          <span>✦</span> <span>ไพ่ยิปซีพยากรณ์</span> <span>✦</span>
        </div>
        <h1 style="font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: var(--space-2);">เปิดไพ่ทาโรต์ 3 ใบ (อดีต · ปัจจุบัน · อนาคต)</h1>
        <p style="color: var(--color-text-secondary); font-size: var(--font-size-base); margin-bottom: var(--space-8);">
          ตั้งจิตให้นิ่ง นึกถึงเรื่องที่อยากถามหรือสิ่งที่อยู่ในใจ แล้วกดปุ่มสับไพ่และแตะเปิดไพ่แต่ละใบ
        </p>

        <div class="tarot-arena">
          <div style="margin-bottom: var(--space-6);">
            <button id="tarot-shuffle-trigger" class="btn btn-primary" style="font-size: var(--font-size-base);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 8v8M8 8v8M12 11v2"></path>
              </svg>
              <span>สับไพ่และเลือกชุดใหม่</span>
            </button>
          </div>

          <p style="font-size: var(--font-size-sm); color: var(--color-gold-light); font-weight: 500; margin-bottom: var(--space-4);">
            👉 แตะที่ไพ่แต่ละใบด้านล่าง เพื่อพลิกดูคำทำนาย
          </p>

          <div id="tarot-spread-container" class="tarot-spread-grid">
            <!-- Render 3 card slots -->
          </div>

          <div id="tarot-interpretation-panel" style="margin-top: var(--space-8); text-align: left; display: none;">
            <!-- Interpretation details -->
          </div>
        </div>
      </div>
    `;

    this.initSpread(container);
  }

  static initSpread(container) {
    const shuffleBtn = container.querySelector('#tarot-shuffle-trigger');
    const spreadContainer = container.querySelector('#tarot-spread-container');
    const interpPanel = container.querySelector('#tarot-interpretation-panel');

    const positions = [
      { id: 'past', labelEn: 'I. Past Influences', labelTh: 'ใบที่ ๑: รากฐานและอดีตที่ผ่านมา' },
      { id: 'present', labelEn: 'II. Present Energy', labelTh: 'ใบที่ ๒: สถานการณ์ในปัจจุบัน' },
      { id: 'future', labelEn: 'III. Emerging Path', labelTh: 'ใบที่ ๓: แนวโน้มและทิศทางในอนาคต' }
    ];

    const executeDraw = () => {
      SoundManager.play('tarot-shuffle');
      interpPanel.style.display = 'none';
      spreadContainer.innerHTML = '';

      const cards = TarotEngine.drawCards(3);

      positions.forEach((pos, idx) => {
        const card = cards[idx];
        const slot = document.createElement('div');
        slot.className = 'tarot-card-slot';
        slot.setAttribute('tabindex', '0');
        slot.setAttribute('role', 'button');
        slot.setAttribute('aria-label', `เปิดไพ่ใบที่ ${idx + 1}`);

        slot.innerHTML = `
          <div class="tarot-card-inner">
            <!-- Card Back -->
            <div class="tarot-card-back">
              <div style="font-size: 11px; color: var(--color-gold-bright); font-weight: 600;">${pos.labelTh}</div>
              <div style="width: 50px; height: 50px; opacity: 0.7; margin: var(--space-2) 0;">
                <svg viewBox="0 0 200 200" fill="none">
                  <circle cx="100" cy="100" r="80" stroke="#D4AF37" stroke-width="2"/>
                  <polygon points="100,60 105,95 140,100 105,105 100,140 95,105 60,100 95,95" fill="#D4AF37"/>
                </svg>
              </div>
              <div style="font-size: 10px; color: var(--color-text-muted);">แตะเพื่อเปิด</div>
            </div>

            <!-- Card Front -->
            <div class="tarot-card-front">
              <div style="font-size: 10px; color: var(--color-text-muted);">${pos.labelTh}</div>
              <div style="margin: auto 0; text-align: center;">
                <div style="font-size: 32px; color: var(--color-gold-bright); margin-bottom: var(--space-1);">✦</div>
                <div class="tarot-card-title" style="font-size: var(--font-size-sm); font-weight: 700; color: var(--color-gold-light);">
                  ${card.nameTh}
                </div>
                ${card.isReversed ? `<span style="font-size: 11px; color: #FC8181; font-weight: 600;">(ไพ่กลับหัว)</span>` : ''}
              </div>
              <div style="font-size: 10px; color: var(--color-gold-bright);">${elementWithMeaningTh(card.element)}</div>
            </div>
          </div>
        `;

        const flipAction = () => {
          if (!slot.classList.contains('is-flipped')) {
            slot.classList.add('is-flipped');
            SoundManager.play('tarot-flip');
            checkAllFlipped(cards);
          }
        };

        slot.addEventListener('click', flipAction);
        slot.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            flipAction();
          }
        });

        spreadContainer.appendChild(slot);
      });
    };

    const checkAllFlipped = (cards) => {
      const allSlots = spreadContainer.querySelectorAll('.tarot-card-slot');
      const flipped = spreadContainer.querySelectorAll('.tarot-card-slot.is-flipped');
      if (allSlots.length === flipped.length) {
        SoundManager.play('reading-complete');
        renderInterpretation(cards);
      }
    };

    const renderInterpretation = (cards) => {
      interpPanel.style.display = 'block';
      const positionIntro = [
        'รากฐานของเรื่องนี้ สิ่งที่ผ่านมาและยังส่งผลอยู่',
        'หัวใจของสถานการณ์ตอนนี้ พลังงานที่กำลังทำงานอยู่จริง',
        'ทิศทางที่เรื่องนี้กำลังมุ่งไป ถ้าคุณเดินต่อแบบเดิม'
      ];

      interpPanel.innerHTML = `
        <div class="editorial-card theme-tarot" style="border: 2px solid var(--color-gold-bright);">
          <div class="editorial-card-header">
            <span class="tradition-tag" style="font-size: var(--font-size-xs); background: rgba(212, 175, 55, 0.2);">
              📜 คำทำนายจากไพ่ทั้ง 3 ใบ (อ่านจากบนลงล่างเหมือนหมอดูเล่าให้ฟัง)
            </span>
            <span style="font-size: var(--font-size-xs); color: var(--color-gold-bright);">เปิดครบ 3 ใบแล้ว</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: var(--space-5);">
            ${cards.map((c, i) => `
              <div style="border-bottom: var(--border-subtle); padding-bottom: var(--space-5);">
                <div style="font-size: var(--font-size-sm); color: var(--color-gold-bright); font-weight: 700; margin-bottom: 4px;">
                  ${positions[i].labelTh}
                </div>
                <div style="font-size: var(--font-size-lg); font-weight: 700; color: #FFFFFF; margin-bottom: 2px;">
                  ${c.nameTh} ${c.isReversed ? '<span style="color: #FC8181; font-size: 12px; font-weight: 600;">(กลับหัว)</span>' : ''}
                </div>
                <div style="font-size: 11px; color: var(--color-text-muted); margin-bottom: var(--space-2);">
                  ${positionIntro[i]}
                </div>
                <p style="font-size: var(--font-size-sm); color: var(--color-text-primary); line-height: 1.85; margin-bottom: var(--space-2);">
                  <strong style="color: var(--color-gold-light);">${c.isReversed ? 'ความหมายเมื่อไพ่หัวตั้ง (ใบนี้ออกกลับหัว ให้อ่านกล่องสีแดงข้างล่างประกอบ)' : 'ความหมาย'}:</strong> ${c.meaningTh || c.keywordsTh}
                </p>
                ${c.adviceTh ? `<p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); line-height: 1.8; margin-bottom: var(--space-3);">
                  <strong style="color: #68D391;">คำแนะนำ:</strong> ${c.adviceTh}
                </p>` : ''}

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-3);">
                  ${c.loveTh ? `<div style="background: rgba(213, 63, 140, 0.07); border: 1px solid rgba(213, 63, 140, 0.3); border-radius: 10px; padding: var(--space-3) var(--space-4);">
                    <div style="font-size: 11px; color: #F687B3; font-weight: 700; margin-bottom: 2px;">💗 ด้านความรัก</div>
                    <p style="font-size: 12px; color: var(--color-text-primary); line-height: 1.7;">${c.loveTh}</p>
                  </div>` : ''}
                  ${c.workTh ? `<div style="background: rgba(197, 160, 89, 0.07); border: 1px solid rgba(197, 160, 89, 0.3); border-radius: 10px; padding: var(--space-3) var(--space-4);">
                    <div style="font-size: 11px; color: var(--color-gold-bright); font-weight: 700; margin-bottom: 2px;">💼 ด้านการงาน</div>
                    <p style="font-size: 12px; color: var(--color-text-primary); line-height: 1.7;">${c.workTh}</p>
                  </div>` : ''}
                  ${c.healthTh ? `<div style="background: rgba(72, 187, 120, 0.07); border: 1px solid rgba(72, 187, 120, 0.3); border-radius: 10px; padding: var(--space-3) var(--space-4);">
                    <div style="font-size: 11px; color: #68D391; font-weight: 700; margin-bottom: 2px;">🩺 ด้านสุขภาพ</div>
                    <p style="font-size: 12px; color: var(--color-text-primary); line-height: 1.7;">${c.healthTh}</p>
                  </div>` : ''}
                </div>

                ${c.isReversed && c.reversedTh ? `<div style="background: rgba(252, 129, 129, 0.07); border: 1px solid rgba(252, 129, 129, 0.3); border-radius: 10px; padding: var(--space-3) var(--space-4);">
                  <div style="font-size: 11px; color: #FC8181; font-weight: 700; margin-bottom: 2px;">🔄 ไพ่ใบนี้ออกกลับหัว</div>
                  <p style="font-size: 12px; color: #FEB2B2; line-height: 1.75;">${c.reversedTh}</p>
                </div>` : ''}
              </div>
            `).join('')}
          </div>

          <div style="background: rgba(12, 13, 16, 0.6); border-left: 4px solid var(--color-gold-bright); padding: var(--space-4) var(--space-5); border-radius: var(--radius-sm); margin-top: var(--space-5);">
            <div style="font-size: 11px; color: var(--color-gold-bright); font-weight: 700; margin-bottom: 4px;">🔮 อ่านภาพรวมทั้งสามใบ:</div>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-primary); line-height: 1.85;">
              เรื่องราวของคุณเริ่มจากพลังของ "${cards[0].nameTh}" ในอดีต ส่งต่อมาที่ "${cards[1].nameTh}" ซึ่งคือสิ่งที่กำลังเกิดขึ้นจริงตอนนี้
              และถ้าเดินต่อตามเส้นทางเดิม ไพ่ "${cards[2].nameTh}" บอกทิศทางข้างหน้าไว้แล้ว
              จุดที่ควรใส่ใจที่สุดคือใบกลาง เพราะเป็นสิ่งเดียวที่คุณเปลี่ยนได้จริงในตอนนี้
            </p>
          </div>

          <div class="ai-block" style="margin-top: var(--space-5);">
            <div class="ai-block-head">
              <div>
                <strong>อยากให้ตีความเจาะจงกับเรื่องของคุณ?</strong>
                <p>พิมพ์เรื่องที่ถามใจไว้ตอนสับไพ่ แล้วให้หมอดู AI ตีความไพ่ทั้ง 3 ใบกับเรื่องนั้นโดยตรง</p>
              </div>
            </div>
            <div class="ai-followup" style="display: flex;">
              <input type="text" id="tarot-ai-question" class="ai-followup-input" placeholder="เช่น ถามเรื่องย้ายงาน / เรื่องคนที่คุยอยู่" />
              <button type="button" class="btn btn-primary" id="tarot-ai-btn"><span>ตีความ</span></button>
            </div>
            <div class="ai-answer" id="tarot-ai-answer" hidden></div>
          </div>
        </div>
      `;

      Storage.addReadingToHistory({
        type: 'Tarot',
        spread: '3-Card Past-Present-Future',
        cards: cards.map(c => ({ name: c.nameTh, reversed: c.isReversed }))
      });

      interpPanel.querySelector('#tarot-ai-btn')?.addEventListener('click', async () => {
        const btn = interpPanel.querySelector('#tarot-ai-btn');
        const answerBox = interpPanel.querySelector('#tarot-ai-answer');
        const question = interpPanel.querySelector('#tarot-ai-question').value.trim() || 'ภาพรวมชีวิตช่วงนี้';

        btn.disabled = true;
        btn.querySelector('span').textContent = 'กำลังตีความ…';
        answerBox.hidden = false;
        answerBox.innerHTML = '<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> หมอดูกำลังเพ่งไพ่ทั้งสามใบกับคำถามของคุณ…</div>';

        const context = [
          'ผลการเปิดไพ่ทาโรต์ 3 ใบ (อดีต-ปัจจุบัน-อนาคต) ที่สุ่มได้จริง:',
          ...cards.map((c, i) => `${positions[i].labelTh}: ${c.nameTh}${c.isReversed ? ' (กลับหัว)' : ''} — `
          + (c.isReversed
            ? 'ความหมายเมื่อกลับหัว: ' + (c.reversedTh || 'ตำราไม่ได้ระบุความหมายกลับหัวของใบนี้ ห้ามเดา')
              + ' (ความหมายเมื่อหัวตั้งคือ ' + (c.meaningTh || c.keywordsTh) + ' แต่ใบนี้ออกกลับหัว ห้ามใช้ความหมายหัวตั้ง)'
            : (c.meaningTh || c.keywordsTh))),
          'เรื่องที่ผู้ถามตั้งจิตไว้: ' + question
        ].join(String.fromCharCode(10));

        const response = await OracleAIService.sendChat(
          [{ role: 'user', content: 'ช่วยตีความไพ่ทั้ง 3 ใบนี้กับเรื่องที่ฉันถามโดยเฉพาะ เล่าเชื่อมโยงทั้งสามใบเป็นเรื่องเดียวกัน และปิดท้ายด้วยคำแนะนำ 3 ข้อที่ทำได้จริง' }],
          { purpose: 'tarot:interpretation', context }
        );

        btn.disabled = false;
        btn.querySelector('span').textContent = 'ตีความ';
        if (!response.success) {
          answerBox.innerHTML = `<div class="ai-error"><strong>ยังตีความไม่สำเร็จ</strong><p>${response.message}</p></div>`;
          return;
        }
        answerBox.innerHTML = `
          <div class="ai-answer-body">
            <div class="ai-answer-tag">✦ คำตีความเฉพาะเรื่องของคุณ</div>
            ${ReadingView.formatAnswer(response.answer)}
          </div>`;
        SoundManager.play('reading-complete');
      });
    };

    shuffleBtn?.addEventListener('click', executeDraw);
    executeDraw();
  }
}
