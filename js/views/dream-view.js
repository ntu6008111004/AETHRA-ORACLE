/**
 * AETHRA ORACLE — หน้าทำนายฝัน
 * ผู้ใช้เล่าความฝันเป็นภาษาพูด ระบบจับสัญลักษณ์แล้วเปิดตำราไทยอธิบายทีละอัน
 */
import { Storage } from '../core/storage.js';
import { SoundManager } from '../core/sound.js';
import { DreamEngine } from '../engines/dream.js';
import { TaksaEngine } from '../engines/thai-taksa.js';
import { PLANET_NUMBERS } from '../engines/life-domains.js';
import { OracleAIService } from '../services/oracle-ai.js';
import { ReadingView } from './reading-view.js';

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const TONE_CLASS = { 'ดี': 'great', 'ร้าย': 'bad', 'ปนกัน': 'neutral' };
const TONE_ICON = { 'ดี': '✅', 'ร้าย': '⚠️', 'ปนกัน': '⚪' };

/** ตัวอย่างให้กดเล่นเร็ว ๆ ใช้ฝันที่คนไทยค้นหาบ่อยที่สุด */
const QUICK_DREAMS = [
  'ฝันเห็นงูใหญ่เลื้อยเข้าบ้าน',
  'ฝันว่าฟันหัก',
  'ฝันว่าน้ำท่วมบ้าน',
  'ฝันเห็นคนตายที่รู้จัก',
  'ฝันว่าได้แต่งงาน',
  'ฝันว่าตกจากที่สูง'
];

export class DreamView {
  static render(container) {
    const profile = Storage.getProfile();

    container.innerHTML = `
      <div class="reading-wrapper">
        <section class="identity-card">
          <div class="identity-head">
            <div>
              <div class="identity-eyebrow">🌙 ทำนายฝัน</div>
              <h1 class="identity-name">เมื่อคืนฝันเห็นอะไร</h1>
              <p class="identity-sub">เล่าความฝันเป็นภาษาพูดได้เลย ระบบจะจับสัญลักษณ์ในฝัน
              แล้วเปิดตำราทำนายฝันไทยมาอธิบายให้ทีละอย่างว่าคนโบราณตีความว่าอย่างไร
              ตอนนี้ตำราในระบบมี ${DreamEngine.symbolCount} สัญลักษณ์</p>
            </div>
          </div>

          <form id="dream-form" class="match-form">
            <label class="form-label" for="dream-input">เล่าความฝันของคุณ</label>
            <textarea id="dream-input" class="form-control" rows="3"
              placeholder="เช่น ฝันว่ามีงูใหญ่เลื้อยเข้ามาในบ้าน แล้วน้ำก็ท่วมขึ้นมา"
              maxlength="500"></textarea>
            <p class="form-hint">เล่าละเอียดยิ่งดี ยิ่งจับสัญลักษณ์ได้มาก
            ระบบจะไม่เดาความหมายที่ตำราไม่มี</p>

            <div class="quick-dream-row">
              ${QUICK_DREAMS.map(d => `
                <button type="button" class="quick-dream-chip" data-dream="${esc(d)}">${esc(d)}</button>
              `).join('')}
            </div>

            <button type="submit" class="btn btn-primary match-submit" style="margin-top: var(--space-3);">
              <span>🔮 ทำนายฝันนี้</span>
            </button>
          </form>

          ${profile.birthDate ? `
          <div class="source-badge" style="margin-top: var(--space-3);">
            ระบบจะเทียบเลขในตำราฝันกับเลขถูกโฉลกตามวันเกิดของคุณให้ด้วย
          </div>` : `
          <div class="notice-card is-info" style="text-align:left; margin-top: var(--space-3);">
            <span class="notice-icon">💡</span>
            <div><p>กรอกวันเกิดที่<a href="#profile" class="notice-link">หน้าโปรไฟล์</a>
            ระบบจะบอกเพิ่มได้ว่าเลขที่ตำราผูกกับฝันนี้ ตัวไหนถูกโฉลกกับวันเกิดคุณ</p></div>
          </div>`}
        </section>

        <div id="dream-result"></div>
      </div>
    `;

    this.bindEvents(container, profile);
  }

  static bindEvents(container, profile) {
    const input = container.querySelector('#dream-input');

    container.querySelectorAll('.quick-dream-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        input.value = chip.dataset.dream;
        SoundManager.play('ui-select');
        container.querySelector('#dream-form').requestSubmit();
      });
    });

    container.querySelector('#dream-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const box = container.querySelector('#dream-result');
      const text = input.value.trim();

      // เลขถูกโฉลกและเลขกาลกิณีตามวันเกิด ใช้ไฮไลต์เลขในตำราฝัน
      let luckyNumbers = [];
      let badNumber = null;
      if (profile.birthDate) {
        try {
          const taksa = TaksaEngine.calculate(profile.birthDate, profile.birthTime);
          luckyNumbers = [...new Set(
            ['dech', 'si', 'mula', 'montri'].map(k => PLANET_NUMBERS[taksa.byId[k].planetId])
          )].map(String);
          badNumber = String(PLANET_NUMBERS[taksa.byId.kalakini.planetId]);
        } catch (err) {
          // วันเกิดในโปรไฟล์ผิดรูปแบบ ให้ทำนายฝันต่อได้โดยไม่เทียบวันเกิด
          luckyNumbers = [];
          badNumber = null;
        }
      }

      const result = DreamEngine.interpret(text, { luckyNumbers, badNumber });
      SoundManager.play('reading-complete');

      if (!result.available) {
        box.innerHTML = `
          <section class="identity-card match-result-card">
            <div class="notice-card is-warning" style="text-align:left;">
              <span class="notice-icon">🌙</span>
              <div><p>${esc(result.reasonTh)}</p></div>
            </div>
          </section>`;
        box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      box.innerHTML = this.renderResult(result, Boolean(profile.birthDate));
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      Storage.addReadingToHistory({ type: 'Dream', dream: text.slice(0, 60), tone: result.overallToneTh });
      this.bindResultEvents(box, result);
    });
  }

  static renderResult(r, hasBirthDate) {
    const toneClass = TONE_CLASS[r.overallTone] || 'neutral';

    return `
      <section class="identity-card match-result-card">
        <div class="grade-badge grade-${toneClass === 'great' ? 'good' : toneClass === 'bad' ? 'careful' : 'neutral'}">
          <div class="grade-label">ตำราอ่านว่า</div>
          <div class="grade-value">${esc(r.overallTone)}</div>
        </div>
        <h2 class="match-headline">จับสัญลักษณ์ในฝันได้ ${r.symbolCount} อย่าง</h2>
        <p class="grade-reason">${esc(r.overallToneTh)}
        ${r.goodCount ? ` มีสัญลักษณ์ฝ่ายดี ${r.goodCount} อย่าง` : ''}
        ${r.badCount ? ` มีสัญลักษณ์ที่ต้องระวัง ${r.badCount} อย่าง` : ''}</p>

        <div class="domain-sections" style="text-align:left;">
          ${r.symbols.map(s => `
            <article class="domain-section tone-border-${TONE_CLASS[s.tone] || 'neutral'}">
              <h3>${TONE_ICON[s.tone] || '⚪'} ฝันเห็น${esc(s.keyTh)}</h3>
              <p>${esc(s.meaningTh)}</p>
              <p style="margin-top:8px;"><b>ควรทำอย่างไร:</b> ${esc(s.adviceTh)}</p>
              ${(s.numbers || []).length ? `
                <div class="dream-num-row">
                  <span class="dream-num-label">เลขที่ตำราผูกกับฝันนี้:</span>
                  ${s.numbers.map(n => `<span class="dream-num">${esc(n)}</span>`).join('')}
                </div>` : ''}
              <div class="source-badge">มาจาก: ${esc(s.sourceTh)}</div>
            </article>
          `).join('')}

          ${r.numbers.length ? `
          <article class="domain-section">
            <h3>🔢 เลขทั้งหมดที่ตำราผูกกับฝันนี้</h3>
            <p>คนไทยแต่โบราณผูกเลขไว้กับสัญลักษณ์ในฝัน เว็บนี้แสดงตามที่ตำราบันทึกไว้เท่านั้น
            ไม่ได้สุ่มขึ้นเอง และไม่ได้แนะนำให้เอาไปเสี่ยงโชค เพราะการพนันมีความเสี่ยงเสมอ</p>
            <div class="dream-num-grid">
              ${r.numbers.map(n => `
                <div class="dream-num-cell${n.matchesOwnerLucky ? ' is-lucky' : ''}${n.hasOwnerBadDigit ? ' is-bad' : ''}">
                  <span class="dream-num-big">${esc(n.value)}</span>
                  ${n.matchesOwnerLucky ? '<small>ถูกโฉลกกับวันเกิดคุณ</small>' : ''}
                  ${n.hasOwnerBadDigit ? '<small>มีเลขกาลกิณีของคุณ</small>' : ''}
                </div>`).join('')}
            </div>
            ${hasBirthDate ? `
            <div class="source-badge">เลขที่ทำเครื่องหมายไว้ เทียบจากทักษาตามวันเกิดของคุณ</div>`
            : `<div class="source-badge">กรอกวันเกิดในโปรไฟล์ ระบบจะบอกได้ว่าเลขไหนถูกโฉลกกับคุณ</div>`}
          </article>` : ''}

          <article class="domain-section">
            <h3>📖 ตำราที่เว็บนี้ใช้</h3>
            <p>${esc(r.sourceNoteTh)}</p>
            <div class="source-badge">ฐานข้อมูลของเว็บนี้มี ${r.totalInBook} สัญลักษณ์ | ${esc(r.sourceTh)}</div>
          </article>
        </div>

        <div class="ai-ask-block">
          <label class="form-label" for="dream-ai-q">อยากถามหมอดูเพิ่มเรื่องฝันนี้</label>
          <div class="ai-ask-row">
            <input type="text" id="dream-ai-q" class="form-control"
              placeholder="เช่น ฝันแบบนี้เกี่ยวกับเรื่องงานที่กำลังเครียดไหม" />
            <button class="btn btn-primary" id="dream-ai-btn"><span>ถาม</span></button>
          </div>
          <div id="dream-ai-answer" class="ai-answer" hidden></div>
        </div>
      </section>
    `;
  }

  static bindResultEvents(box, r) {
    box.querySelector('#dream-ai-btn')?.addEventListener('click', async () => {
      const btn = box.querySelector('#dream-ai-btn');
      const answer = box.querySelector('#dream-ai-answer');
      const q = box.querySelector('#dream-ai-q').value.trim()
        || 'ฝันนี้ตำราตีความว่าอย่างไร และควรทำตัวอย่างไรต่อ';

      btn.disabled = true;
      btn.querySelector('span').textContent = 'กำลังดู…';
      answer.hidden = false;
      answer.innerHTML = '<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> กำลังเปิดตำราทำนายฝัน…</div>';

      const context = [
        'ผลทำนายฝันที่ระบบเปิดตำราให้แล้ว:',
        'ความฝันที่ผู้ใช้เล่า: ' + r.dreamTextTh,
        '',
        '[ข้อสรุปของระบบ ห้ามตอบสวนทางกับข้อนี้]',
        'ตำราอ่านโดยรวมว่า: ' + r.overallToneTh,
        '',
        '[สัญลักษณ์ที่จับได้ และความหมายตามตำรา]',
        ...r.symbols.map(s => 'ฝันเห็น' + s.keyTh + ' (' + s.tone + ') = ' + s.meaningTh
          + ' คำแนะนำตามตำรา: ' + s.adviceTh),
        '',
        r.numbers.length ? 'เลขที่ตำราผูกไว้: ' + r.numbers.map(n => n.value).join(' ') : '',
        '',
        'กติกาการตอบ:',
        'ยึดความหมายตามตำราที่ให้มาข้างบนเท่านั้น ห้ามแต่งความหมายใหม่',
        'ห้ามเชียร์ให้ไปซื้อหวยหรือเสี่ยงโชค ถ้าผู้ใช้ถามเรื่องเลข ให้บอกได้แค่ว่าตำราผูกเลขอะไรไว้',
        'ห้ามฟันธงว่าเหตุการณ์จะเกิดขึ้นแน่นอน ให้ใช้คำว่าตำราว่า หรือคนโบราณตีความว่า',
        'ห้ามวินิจฉัยโรค ถ้าฝันเกี่ยวกับสุขภาพ ให้แนะนำไปพบแพทย์',
        'ตอบเป็นภาษาไทยล้วน ห้ามมีคำภาษาอังกฤษแม้แต่คำเดียว',
        '',
        'สิ่งที่ผู้ใช้ถาม: ' + q
      ].filter(Boolean).join(String.fromCharCode(10));

      const res = await OracleAIService.sendChat(
        [{ role: 'user', content: q + ' — ตอบโดยอ้างความหมายตามตำราที่ให้มาเท่านั้น' }],
        {
          purpose: 'dream:interpretation',
          context,
          onRetry: (n) => {
            answer.innerHTML = `<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> สายยังไม่นิ่ง กำลังลองอีกครั้ง (ครั้งที่ ${n + 1})…</div>`;
          }
        }
      );

      btn.disabled = false;
      btn.querySelector('span').textContent = 'ถาม';
      if (!res.success) {
        answer.innerHTML = `<div class="ai-error"><strong>ยังตอบไม่สำเร็จ</strong><p>${esc(res.message)}</p></div>`;
        return;
      }
      answer.innerHTML = `<div class="ai-answer-body">
        <div class="ai-answer-tag">✦ คำอธิบายฝันของคุณ</div>
        ${ReadingView.formatAnswer(res.answer)}
      </div>`;
      SoundManager.play('reading-complete');
    });
  }
}
