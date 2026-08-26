/**
 * AETHRA ORACLE — I Ching (Book of Changes) View
 * ภาษาไทยเข้าใจง่าย พร้อมภาพจำลองเหรียญบรอนซ์ 3 เหรียญ
 */

import { IChingEngine } from '../engines/iching.js';
import { SoundManager } from '../core/sound.js';
import { I18n } from '../core/i18n.js';
import { Storage } from '../core/storage.js';
import { OracleAIService } from '../services/oracle-ai.js';
import { ReadingView } from './reading-view.js';

export class IChingView {
  static render(container) {
    container.innerHTML = `
      <div class="iching-view-wrapper">
        <div class="hero-badge" style="margin-bottom: var(--space-2);">
          <span>✦</span> <span>คัมภีร์อี้จิง (เสี่ยงทายเหรียญโบราณ)</span> <span>✦</span>
        </div>
        <h1 style="font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: var(--space-2);">ศาสตร์แห่งการแปรเปลี่ยน (I Ching)</h1>
        <p style="color: var(--color-text-secondary); font-size: var(--font-size-base); margin-bottom: var(--space-8);">
          อธิษฐานจิตตั้งคำถามที่ต้องการคำชี้แนะ แล้วกดปุ่มเพื่อโยนเหรียญบรอนซ์โบราณให้ครบ 6 ครั้ง (สร้างเส้นพลังงานจากล่างขึ้นบน)
        </p>

        <div class="editorial-card theme-iching" style="text-align: center; max-width: 680px; margin: 0 auto;">
          <div class="editorial-card-header">
            <span class="tradition-tag">🪙 การเสี่ยงทายเหรียญทองเหลืองโบราณ</span>
            <span id="iching-step-indicator" style="font-size: var(--font-size-xs); color: var(--color-gold-bright); font-weight: 600;">โยนเส้นที่ 0 / 6</span>
          </div>

          <!-- Bronze Coins -->
          <div class="iching-coins-wrapper">
            <div class="iching-coin"><div class="iching-coin-square"></div></div>
            <div class="iching-coin"><div class="iching-coin-square"></div></div>
            <div class="iching-coin"><div class="iching-coin-square"></div></div>
          </div>

          <button id="iching-toss-trigger" class="btn btn-primary" style="margin-bottom: var(--space-6); font-size: var(--font-size-base);">
            <span>🎲 กดเพื่อโยนเหรียญเสี่ยงทาย</span>
          </button>

          <!-- Hexagram Lines Stack (Bottom to Top) -->
          <div id="hexagram-lines-stack" class="hexagram-lines-stack">
            <!-- 6 lines will be added here -->
          </div>

          <!-- Hexagram Judgement Result -->
          <div id="iching-result-panel" style="display: none; text-align: left; margin-top: var(--space-8); border-top: var(--border-subtle); padding-top: var(--space-6);">
          </div>
        </div>
      </div>
    `;

    this.initIChing(container);
  }

  static initIChing(container) {
    const tossBtn = container.querySelector('#iching-toss-trigger');
    const stepIndicator = container.querySelector('#iching-step-indicator');
    const stack = container.querySelector('#hexagram-lines-stack');
    const resultPanel = container.querySelector('#iching-result-panel');
    const coins = container.querySelectorAll('.iching-coin');

    let lines = [];

    const handleToss = () => {
      if (lines.length >= 6) {
        lines = [];
        stack.innerHTML = '';
        resultPanel.style.display = 'none';
        tossBtn.querySelector('span').textContent = '🎲 กดเพื่อโยนเหรียญเสี่ยงทาย';
      }

      SoundManager.play('iching-coin');
      coins.forEach(c => {
        c.classList.remove('flipping');
        void c.offsetWidth;
        c.classList.add('flipping');
      });

      const lineData = IChingEngine.tossCoins();
      lines.push(lineData);

      stepIndicator.textContent = `โยนเส้นที่ ${lines.length} / 6 (${lineData.isYang ? 'เส้นหยาง / ขีดเต็ม' : 'เส้นหยิน / ขีดขาด'})`;

      // Render line element
      const lineEl = document.createElement('div');
      lineEl.className = `hex-line ${lineData.isYang ? 'yang' : 'yin'}`;
      if (lineData.isYang) {
        lineEl.innerHTML = '<div class="hex-segment"></div>';
      } else {
        lineEl.innerHTML = '<div class="hex-segment"></div><div class="hex-segment"></div>';
      }
      stack.appendChild(lineEl);

      if (lines.length === 6) {
        SoundManager.play('reading-complete');
        tossBtn.querySelector('span').textContent = '🔄 กดเพื่อเริ่มเสี่ยงทายรอบใหม่';
        displayResult(lines);
      }
    };

    const displayResult = (completedLines) => {
      const result = IChingEngine.castHexagram(completedLines);
      const hex = result.hexagram;
      resultPanel.style.display = 'block';

      resultPanel.innerHTML = `
        <div style="background: rgba(12, 13, 16, 0.6); border-left: 4px solid var(--color-gold-bright); padding: var(--space-5); border-radius: var(--radius-sm);">
          <div style="font-size: var(--font-size-xs); color: var(--color-gold-bright); font-weight: 600; margin-bottom: 2px;">
            📜 ก๊กที่ ${hex.number} จาก 64 ก๊ก:
          </div>
          <h3 style="font-size: var(--font-size-2xl); color: var(--color-gold-light); margin-bottom: var(--space-1);">
            ${hex.nameTh}
          </h3>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4);">
            ชื่อสากล: ${hex.nameEn} · ภาพ: ${hex.imageTh}
          </div>

          <div style="margin-bottom: var(--space-4);">
            <strong style="color: var(--color-gold-bright); font-size: var(--font-size-sm);">⚖️ คำตัดสิน (ความหมายหลัก):</strong>
            <p style="font-size: var(--font-size-base); color: var(--color-text-primary); margin-top: 4px; line-height: 1.85;">
              ${hex.judgementTh}
            </p>
          </div>

          ${hex.adviceTh ? `<div style="margin-bottom: var(--space-4);">
            <strong style="color: #68D391; font-size: var(--font-size-sm);">✅ สิ่งที่ควรทำ:</strong>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-primary); margin-top: 4px; line-height: 1.8;">
              ${hex.adviceTh}
            </p>
          </div>` : ''}

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-4);">
            ${hex.loveTh ? `<div style="background: rgba(213, 63, 140, 0.07); border: 1px solid rgba(213, 63, 140, 0.3); border-radius: 10px; padding: var(--space-3) var(--space-4);">
              <div style="font-size: 11px; color: #F687B3; font-weight: 700; margin-bottom: 2px;">💗 ด้านความรัก</div>
              <p style="font-size: 12px; color: var(--color-text-primary); line-height: 1.7;">${hex.loveTh}</p>
            </div>` : ''}
            ${hex.workTh ? `<div style="background: rgba(197, 160, 89, 0.07); border: 1px solid rgba(197, 160, 89, 0.3); border-radius: 10px; padding: var(--space-3) var(--space-4);">
              <div style="font-size: 11px; color: var(--color-gold-bright); font-weight: 700; margin-bottom: 2px;">💼 ด้านการงาน</div>
              <p style="font-size: 12px; color: var(--color-text-primary); line-height: 1.7;">${hex.workTh}</p>
            </div>` : ''}
            ${hex.moneyTh ? `<div style="background: rgba(72, 187, 120, 0.07); border: 1px solid rgba(72, 187, 120, 0.3); border-radius: 10px; padding: var(--space-3) var(--space-4);">
              <div style="font-size: 11px; color: #68D391; font-weight: 700; margin-bottom: 2px;">💰 ด้านการเงิน</div>
              <p style="font-size: 12px; color: var(--color-text-primary); line-height: 1.7;">${hex.moneyTh}</p>
            </div>` : ''}
            ${hex.healthTh ? `<div style="background: rgba(56, 178, 172, 0.07); border: 1px solid rgba(56, 178, 172, 0.3); border-radius: 10px; padding: var(--space-3) var(--space-4);">
              <div style="font-size: 11px; color: #4FD1C5; font-weight: 700; margin-bottom: 2px;">🩺 ด้านสุขภาพ</div>
              <p style="font-size: 12px; color: var(--color-text-primary); line-height: 1.7;">${hex.healthTh}</p>
            </div>` : ''}
          </div>

          ${hex.warnTh ? `<div style="background: rgba(229, 62, 62, 0.08); border: 1px solid rgba(229, 62, 62, 0.32); border-left: 4px solid #FC8181; border-radius: 10px; padding: var(--space-3) var(--space-4); margin-bottom: var(--space-4);">
            <div style="font-size: 11px; color: #FC8181; font-weight: 700; margin-bottom: 2px;">⚠️ สิ่งที่ต้องระวัง</div>
            <p style="font-size: 12px; color: var(--color-text-primary); line-height: 1.75;">${hex.warnTh}</p>
          </div>` : ''}

          <div style="background: rgba(12, 13, 16, 0.45); border: var(--border-subtle); border-radius: 10px; padding: var(--space-4); margin-bottom: var(--space-4);">
            <div style="font-size: 11px; color: var(--color-gold-bright); font-weight: 700; margin-bottom: var(--space-2);">🧭 อ่านจากโครงสร้างก๊ก:</div>
            <p style="font-size: 12px; color: var(--color-text-secondary); line-height: 1.75;">
              ตรีลักษณ์บน ${hex.upperTrigram.symbol} ${hex.upperTrigram.nameTh}: ${hex.upperRole?.outerTh || ''}<br>
              ตรีลักษณ์ล่าง ${hex.lowerTrigram.symbol} ${hex.lowerTrigram.nameTh}: ${hex.lowerRole?.innerTh || ''}
            </p>
          </div>

          <div style="background: ${result.hasChangingLines ? 'rgba(236, 201, 75, 0.08)' : 'rgba(12, 13, 16, 0.45)'}; border: 1px solid ${result.hasChangingLines ? 'rgba(236, 201, 75, 0.35)' : 'rgba(197, 160, 89, 0.16)'}; border-radius: 10px; padding: var(--space-4); margin-bottom: var(--space-4);">
            <div style="font-size: 11px; color: ${result.hasChangingLines ? '#ECC94B' : 'var(--color-text-muted)'}; font-weight: 700; margin-bottom: 2px;">
              ${result.hasChangingLines ? '⚡ มีเส้นแปร — สถานการณ์กำลังเคลื่อน' : '☯ ไม่มีเส้นแปร — สถานการณ์นิ่ง'}
            </div>
            <p style="font-size: 12px; color: var(--color-text-secondary); line-height: 1.75;">${result.changingNoteTh}</p>
            ${result.transformed ? `
              <div style="margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px dashed rgba(236, 201, 75, 0.3);">
                <div style="font-size: 11px; color: var(--color-gold-bright); font-weight: 700;">➜ ก๊กแปรผล (ทิศทางที่กำลังมุ่งไป): ก๊กที่ ${result.transformed.number} ${result.transformed.nameTh}</div>
                <p style="font-size: 12px; color: var(--color-text-primary); line-height: 1.75; margin-top: 4px;">${result.transformed.judgementTh}</p>
              </div>` : ''}
          </div>

          <div class="ai-block">
            <div class="ai-block-head">
              <div>
                <strong>อยากรู้ว่าก๊กนี้ตอบคำถามคุณว่าอะไร?</strong>
                <p>พิมพ์คำถามที่อธิษฐานไว้ตอนโยนเหรียญ แล้วให้ตีความเจาะจงกับเรื่องนั้น</p>
              </div>
            </div>
            <div class="ai-followup" style="display: flex;">
              <input type="text" id="iching-ai-question" class="ai-followup-input" placeholder="เช่น ควรรับข้อเสนองานใหม่ไหม" />
              <button type="button" class="btn btn-primary" id="iching-ai-btn"><span>ตีความ</span></button>
            </div>
            <div class="ai-answer" id="iching-ai-answer" hidden></div>
          </div>
        </div>
      `;

      Storage.addReadingToHistory({
        type: 'I Ching',
        hexagram: hex.nameTh,
        number: hex.number,
        transformed: result.transformed?.number || null
      });

      resultPanel.querySelector('#iching-ai-btn')?.addEventListener('click', async () => {
        const btn = resultPanel.querySelector('#iching-ai-btn');
        const answerBox = resultPanel.querySelector('#iching-ai-answer');
        const question = resultPanel.querySelector('#iching-ai-question').value.trim() || 'ภาพรวมการตัดสินใจช่วงนี้';

        btn.disabled = true;
        btn.querySelector('span').textContent = 'กำลังตีความ…';
        answerBox.hidden = false;
        answerBox.innerHTML = '<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> กำลังเปิดคัมภีร์ตีความก๊กนี้กับคำถามของคุณ…</div>';

        const context = [
          'ผลเสี่ยงทายอี้จิงที่โยนเหรียญได้จริง:',
          'ก๊กที่ ' + hex.number + ' ' + hex.nameTh + ' (' + hex.nameEn + ')',
          'คำตัดสิน: ' + hex.judgementTh,
          'คำแนะนำ: ' + hex.adviceTh,
          'ด้านสุขภาพ: ' + hex.healthTh,
          'สิ่งที่ต้องระวัง: ' + hex.warnTh,
          'โครงสร้าง: บน=' + hex.upperTrigram.nameTh + ' ล่าง=' + hex.lowerTrigram.nameTh,
          result.hasChangingLines
            ? 'เส้นแปร: เส้นที่ ' + result.changingPositions.join(', ') + ' แปรไปสู่ก๊กที่ ' + result.transformed.number + ' ' + result.transformed.nameTh + ' (' + result.transformed.judgementTh + ')'
            : 'ไม่มีเส้นแปร',
          'คำถามที่ผู้เสี่ยงทายอธิษฐานไว้: ' + question
        ].join(String.fromCharCode(10));

        const response = await OracleAIService.sendChat(
          [{ role: 'user', content: 'ช่วยตีความผลอี้จิงนี้กับคำถามของฉันโดยตรง ตอบให้ชัดว่าคัมภีร์แนะนำให้ทำหรือไม่ทำ เพราะอะไร และถ้ามีก๊กแปรผลให้อธิบายว่ากำลังเคลื่อนไปทางไหน' }],
          { purpose: 'iching:interpretation', context }
        );

        btn.disabled = false;
        btn.querySelector('span').textContent = 'ตีความ';
        if (!response.success) {
          answerBox.innerHTML = `<div class="ai-error"><strong>ยังตีความไม่สำเร็จ</strong><p>${response.message}</p></div>`;
          return;
        }
        answerBox.innerHTML = `
          <div class="ai-answer-body">
            <div class="ai-answer-tag">✦ คำตีความเฉพาะคำถามของคุณ</div>
            ${ReadingView.formatAnswer(response.answer)}
          </div>`;
        SoundManager.play('reading-complete');
      });
    };

    tossBtn?.addEventListener('click', handleToss);
  }
}
