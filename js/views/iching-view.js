/**
 * AETHRA ORACLE — I Ching (Book of Changes) View
 * ภาษาไทยเข้าใจง่าย พร้อมภาพจำลองเหรียญบรอนซ์ 3 เหรียญ
 */

import { IChingEngine } from '../engines/iching.js';
import { SoundManager } from '../core/sound.js';
import { I18n } from '../core/i18n.js';
import { Storage } from '../core/storage.js';

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
      resultPanel.style.display = 'block';
      resultPanel.innerHTML = `
        <div style="background: rgba(12, 13, 16, 0.6); border-left: 4px solid var(--color-gold-bright); padding: var(--space-5); border-radius: var(--radius-sm);">
          <div style="font-size: var(--font-size-xs); color: var(--color-gold-bright); font-weight: 600; margin-bottom: 2px;">
            📜 ผลลัพธ์ผังอี้จิงก๊กที่ ${result.hexagram.number}:
          </div>
          <h3 style="font-size: var(--font-size-2xl); color: var(--color-gold-light); margin-bottom: var(--space-2);">
            ${result.hexagram.nameTh}
          </h3>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-bottom: var(--space-4);">
            ชื่อสากล: ${result.hexagram.nameEn} · รหัสเส้น [${result.hexagram.binary}]
          </div>

          <div style="margin-bottom: var(--space-4);">
            <strong style="color: var(--color-gold-bright); font-size: var(--font-size-sm);">⚖️ คำตัดสินและคำแนะนำ (The Judgement):</strong>
            <p style="font-size: var(--font-size-base); color: var(--color-text-primary); margin-top: 4px; line-height: 1.6;">
              ${result.hexagram.judgementTh}
            </p>
          </div>

          <div>
            <strong style="color: var(--color-gold-bright); font-size: var(--font-size-sm);">🏞️ มโนภาพธรรมชาติ (The Image):</strong>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: 4px; line-height: 1.6;">
              ${result.hexagram.imageEn}
            </p>
          </div>
        </div>
      `;

      Storage.addReadingToHistory({
        type: 'I Ching',
        hexagram: result.hexagram.nameTh,
        number: result.hexagram.number
      });
    };

    tossBtn?.addEventListener('click', handleToss);
  }
}
