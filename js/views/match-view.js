/**
 * AETHRA ORACLE — หน้าดวงสมพงศ์ / เช็คเนื้อคู่
 * ------------------------------------------------------------------
 * ตอบโจทย์ทั้งคนโสด (นักษัตรไหนถูกโฉลกกับฉัน) และคนมีคู่ (เราสองคนเข้ากันไหม)
 * คำนวณจากกฎสามฮะ ลิ่วฮะ ชง ไห่ และธาตุประจำตัวดวงจีน — ไม่มีการสุ่ม
 */

import { Storage } from '../core/storage.js';
import { SoundManager } from '../core/sound.js';
import { CompatibilityEngine } from '../engines/compatibility.js';
import { OracleAIService } from '../services/oracle-ai.js';
import { ReadingView } from './reading-view.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export class MatchView {
  static render(container) {
    const profile = Storage.getProfile();

    container.innerHTML = `
      <div class="reading-wrapper">
        <section class="identity-card">
          <div class="identity-head">
            <div>
              <div class="identity-eyebrow">💕 ดวงสมพงศ์</div>
              <h1 class="identity-name">เช็คดวงคู่ / หาเนื้อคู่</h1>
              <p class="identity-sub">คำนวณจากกฎสามฮะ ลิ่วฮะ ชง ไห่ ของปีนักษัตร และธาตุประจำตัวจากดวงจีนของทั้งสองคน</p>
            </div>
          </div>

          <form id="match-form" class="match-form">
            <div class="match-form-grid">
              <div class="match-person">
                <h3>คนที่ 1 (คุณ)</h3>
                <label class="form-label" for="match-a-name">ชื่อเล่น</label>
                <input type="text" id="match-a-name" class="form-control" value="${escapeHtml(profile.nickname || '')}" placeholder="เช่น ฟลุ๊ค" />
                <label class="form-label" for="match-a-date">วันเกิด</label>
                <input type="date" id="match-a-date" class="form-control" value="${escapeHtml(profile.birthDate || '')}" required />
              </div>
              <div class="match-person">
                <h3>คนที่ 2 (คนที่อยากเช็คด้วย)</h3>
                <label class="form-label" for="match-b-name">ชื่อเล่น</label>
                <input type="text" id="match-b-name" class="form-control" placeholder="เช่น แฟน / คนที่แอบชอบ" />
                <label class="form-label" for="match-b-date">วันเกิด</label>
                <input type="date" id="match-b-date" class="form-control" required />
              </div>
            </div>
            <button type="submit" class="btn btn-primary match-submit"><span>💞 เช็คดวงสมพงศ์</span></button>
          </form>
        </section>

        <div id="match-result"></div>

        <section class="identity-card" id="single-section">
          <div class="identity-head">
            <div>
              <div class="identity-eyebrow">🔎 สำหรับคนโสด</div>
              <h1 class="identity-name" style="font-size: clamp(1.2rem, 3vw, 1.6rem);">นักษัตรไหนถูกโฉลกกับคุณที่สุด</h1>
            </div>
          </div>
          <div id="single-matches"></div>
        </section>
      </div>`;

    this.renderSingleMatches(container, profile);
    this.bindEvents(container);
  }

  static renderSingleMatches(container, profile) {
    const box = container.querySelector('#single-matches');
    if (!profile.birthDate) {
      box.innerHTML = `<p class="identity-sub">กรอกวันเกิดที่<a href="#profile" class="notice-link">หน้าโปรไฟล์</a>ก่อน แล้วส่วนนี้จะแสดงนักษัตรที่ถูกโฉลกกับคุณอัตโนมัติ</p>`;
      return;
    }
    const matches = CompatibilityEngine.findBestMatches(profile.birthDate, profile.birthTime || '12:00');
    box.innerHTML = `
      <p class="identity-sub" style="margin-bottom: var(--space-4);">${escapeHtml(matches.summaryTh)}</p>
      <div class="match-badge-grid">
        ${matches.all.map(m => `
          <div class="match-badge ${m.score >= 90 ? 'is-best' : m.score >= 60 ? 'is-good' : 'is-careful'}">
            <div class="match-badge-name">ปี${escapeHtml(m.nameTh)}</div>
            <div class="match-badge-animal">${escapeHtml(m.animalTh)}</div>
            <div class="match-badge-rel">${escapeHtml(m.relation.labelTh)}</div>
          </div>`).join('')}
      </div>`;
  }

  static bindEvents(container) {
    const form = container.querySelector('#match-form');
    const resultBox = container.querySelector('#match-result');

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const personA = {
        nickname: container.querySelector('#match-a-name').value.trim() || 'คนที่ 1',
        birthDate: container.querySelector('#match-a-date').value
      };
      const personB = {
        nickname: container.querySelector('#match-b-name').value.trim() || 'คนที่ 2',
        birthDate: container.querySelector('#match-b-date').value
      };
      if (!personA.birthDate || !personB.birthDate) return;

      SoundManager.play('reading-complete');
      const result = CompatibilityEngine.compare(personA, personB);

      resultBox.innerHTML = `
        <section class="identity-card match-result-card">
          <div class="match-score-ring ${result.score >= 70 ? 'is-great' : result.score >= 50 ? 'is-mid' : 'is-low'}">
            <div class="match-score-num">${result.score}</div>
            <div class="match-score-max">/ 100</div>
          </div>
          <h2 class="match-headline">${escapeHtml(result.headlineTh)}</h2>

          <div class="domain-sections">
            <article class="domain-section">
              <h3>ความสัมพันธ์ของปีนักษัตร: ${escapeHtml(result.branchRelation.labelTh)}</h3>
              <p>${escapeHtml(result.branchRelation.plainTh)}</p>
              <div class="source-badge">มาจาก: กฎสามฮะ ลิ่วฮะ ชง ไห่ ของกิ่งดิน 12 ตัวตามตำราจีน</div>
            </article>
            <article class="domain-section">
              <h3>ความเข้ากันของธาตุประจำตัว: ${escapeHtml(result.elementRelation.labelTh)}</h3>
              <p>${escapeHtml(result.personA.nickname)} เป็นธาตุ${escapeHtml(result.personA.elementTh)} ส่วน${escapeHtml(result.personB.nickname)} เป็นธาตุ${escapeHtml(result.personB.elementTh)} — ${escapeHtml(result.elementRelation.plainTh)}</p>
              <div class="source-badge">มาจาก: ธาตุประจำตัว (เสาวัน) ในดวงจีนของทั้งสองคน</div>
            </article>
          </div>

          <p class="domain-disclaimer">${escapeHtml(result.adviceTh)}</p>
          <p class="domain-disclaimer">${escapeHtml(result.disclaimerTh)}</p>

          <div class="ai-block">
            <div class="ai-block-head">
              <div>
                <strong>อยากรู้วิธีอยู่ด้วยกันให้รอด?</strong>
                <p>ให้ AI อ่านผลคู่นี้แล้วแนะนำวิธีปรับตัวเข้าหากันแบบเจาะจง</p>
              </div>
              <button type="button" class="btn btn-primary" id="match-ai-btn"><span>ให้ AI แนะนำ</span></button>
            </div>
            <div class="ai-answer" id="match-ai-answer" hidden></div>
          </div>
        </section>`;

      resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      Storage.addReadingToHistory({ type: 'Compatibility', pair: `${personA.nickname} + ${personB.nickname}`, score: result.score });

      resultBox.querySelector('#match-ai-btn').addEventListener('click', async btnEvent => {
        const btn = btnEvent.currentTarget;
        const answerBox = resultBox.querySelector('#match-ai-answer');
        btn.disabled = true;
        btn.querySelector('span').textContent = 'กำลังคิด…';
        answerBox.hidden = false;
        answerBox.innerHTML = '<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> กำลังวิเคราะห์ดวงคู่ของคุณ…</div>';

        const context = [
          `คนที่ 1: ${result.personA.nickname} ปี${result.personA.zodiac.nameTh} ธาตุ${result.personA.elementTh}`,
          `คนที่ 2: ${result.personB.nickname} ปี${result.personB.zodiac.nameTh} ธาตุ${result.personB.elementTh}`,
          `ความสัมพันธ์นักษัตร: ${result.branchRelation.labelTh} — ${result.branchRelation.plainTh}`,
          `ความสัมพันธ์ธาตุ: ${result.elementRelation.labelTh} — ${result.elementRelation.plainTh}`,
          `คะแนนรวม: ${result.score}/100 (${result.verdictTh})`
        ].join('\n');

        const response = await OracleAIService.sendChat(
          [{ role: 'user', content: 'ช่วยแนะนำวิธีอยู่ร่วมกันของคู่นี้แบบเจาะจง อิงจากผลคำนวณเท่านั้น แบ่งเป็น จุดแข็งของคู่นี้ / จุดที่จะทะเลาะกันบ่อย / วิธีปรับตัวเข้าหากัน 3 ข้อ' }],
          { purpose: 'match:analysis', context }
        );

        btn.disabled = false;
        btn.querySelector('span').textContent = 'ให้ AI แนะนำ';
        if (!response.success) {
          answerBox.innerHTML = `<div class="ai-error"><strong>ยังเรียก AI ไม่สำเร็จ</strong><p>${escapeHtml(response.message)}</p></div>`;
          return;
        }
        answerBox.innerHTML = `
          <div class="ai-answer-body">
            <div class="ai-answer-tag">✦ คำแนะนำจาก AI สำหรับคู่นี้โดยเฉพาะ</div>
            ${ReadingView.formatAnswer(response.answer)}
          </div>`;
        SoundManager.play('reading-complete');
      });
    });
  }
}
