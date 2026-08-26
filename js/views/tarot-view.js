/**
 * AETHRA ORACLE — Tarot Arcana View
 * ภาษาไทยเข้าใจง่าย พร้อมระบบเปิดไพ่ที่นุ่มนวล
 */

import { TarotEngine } from '../engines/tarot.js';
import { SoundManager } from '../core/sound.js';
import { I18n } from '../core/i18n.js';
import { Storage } from '../core/storage.js';
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
      interpPanel.innerHTML = `
        <div class="editorial-card theme-tarot" style="border: 2px solid var(--color-gold-bright);">
          <div class="editorial-card-header">
            <span class="tradition-tag" style="font-size: var(--font-size-xs); background: rgba(212, 175, 55, 0.2);">
              📜 คำทำนายและคำแนะนำจากไพ่ทั้ง 3 ใบ
            </span>
            <span style="font-size: var(--font-size-xs); color: var(--color-gold-bright);">เปิดครบ 3 ใบแล้ว</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--space-5);">
            ${cards.map((c, i) => `
              <div style="border-bottom: var(--border-subtle); padding-bottom: var(--space-4);">
                <div style="font-size: var(--font-size-sm); color: var(--color-gold-bright); font-weight: 700; margin-bottom: 2px;">
                  ${positions[i].labelTh}: <span style="color: #FFFFFF; font-size: var(--font-size-base);">${c.nameTh}</span> ${c.isReversed ? '<span style="color: #FC8181; font-size: 12px;">(ไพ่กลับหัว: ทบทวนอย่างระมัดระวัง)</span>' : ''}
                </div>
                <p style="font-size: var(--font-size-sm); color: var(--color-text-primary); margin-top: 4px; line-height: 1.6;">
                  👉 <strong>ความหมายและคำแนะนำ:</strong> ${c.keywordsTh}
                </p>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      Storage.addReadingToHistory({
        type: 'Tarot',
        spread: '3-Card Past-Present-Future',
        cards: cards.map(c => ({ name: c.nameTh, reversed: c.isReversed }))
      });
    };

    shuffleBtn?.addEventListener('click', executeDraw);
    executeDraw();
  }
}
