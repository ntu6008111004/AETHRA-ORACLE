/**
 * AETHRA ORACLE — ดูดวงเบอร์โทรศัพท์
 * วิเคราะห์ผลรวมเบอร์และคู่เลขตามตำราเลขศาสตร์ไทย
 * พร้อมเทียบกับวันเกิดเจ้าของว่าถูกโฉลกหรือไม่
 */

import { Storage } from '../core/storage.js';
import { SoundManager } from '../core/sound.js';
import { PhoneNumerologyEngine, DIGIT_PLANETS } from '../engines/phone-numerology.js';
import { TaksaEngine } from '../engines/thai-taksa.js';
import { PLANET_NUMBERS } from '../engines/life-domains.js';
import { OracleAIService } from '../services/oracle-ai.js';
import { ReadingView } from './reading-view.js';

function esc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export class PhoneView {
  static render(container) {
    const profile = Storage.getProfile();

    container.innerHTML = `
      <div class="reading-wrapper">
        <section class="identity-card">
          <div class="identity-head">
            <div>
              <div class="identity-eyebrow">📱 เลขศาสตร์เบอร์โทร</div>
              <h1 class="identity-name">ดูดวงเบอร์มือถือ</h1>
              <p class="identity-sub">วิเคราะห์ผลรวมเบอร์และคู่เลขทุกคู่ตามตำราเลขศาสตร์ไทย
              บอกว่าเบอร์นี้ส่งเสริมเรื่องอะไร และต้องระวังเรื่องไหน</p>
            </div>
          </div>

          <form id="phone-form" class="match-form">
            <label class="form-label" for="phone-input">เบอร์โทรศัพท์ที่อยากตรวจ</label>
            <input type="tel" id="phone-input" class="form-control" inputmode="numeric"
              placeholder="เช่น 081-234-5678" maxlength="20" autocomplete="off" />
            <p class="form-hint">พิมพ์ได้ทั้งมีขีดหรือไม่มีขีด ระบบจะตัดให้เอง</p>
            <button type="submit" class="btn btn-primary match-submit" style="margin-top: var(--space-3);">
              <span>🔍 ตรวจเบอร์นี้</span>
            </button>
          </form>
          ${profile.birthDate ? `
            <p class="identity-note">ระบบจะเทียบกับวันเกิดของคุณ (${esc(profile.birthDate)}) ให้ด้วยว่าเบอร์นี้ถูกโฉลกไหม</p>`
            : `<p class="identity-note">ถ้ากรอกวันเกิดที่<a href="#profile" class="notice-link">หน้าโปรไฟล์</a> ระบบจะบอกได้ด้วยว่าเบอร์นี้ถูกโฉลกกับคุณหรือไม่</p>`}
        </section>

        <div id="phone-result"></div>
      </div>`;

    this.bindEvents(container, profile);
  }

  static bindEvents(container, profile) {
    const form = container.querySelector('#phone-form');
    const input = container.querySelector('#phone-input');
    const box = container.querySelector('#phone-result');

    form.addEventListener('submit', event => {
      event.preventDefault();
      const result = PhoneNumerologyEngine.analyze(input.value);

      if (!result.available) {
        box.innerHTML = `<div class="notice-card is-warn"><span class="notice-icon">⚠️</span>
          <div><strong>ตรวจไม่ได้</strong><p>${esc(result.reasonTh)}</p></div></div>`;
        SoundManager.play('error-alert');
        return;
      }

      SoundManager.play('reading-complete');
      let ownerMatch = null;
      if (profile.birthDate) {
        const taksa = TaksaEngine.calculate(profile.birthDate, profile.birthTime);
        ownerMatch = PhoneNumerologyEngine.matchWithOwner(taksa, result, PLANET_NUMBERS);
      }

      box.innerHTML = this.renderResult(result, ownerMatch);
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      Storage.addReadingToHistory({ type: 'Phone', phone: result.formatted, score: result.score });
      this.bindResultEvents(box, result, ownerMatch);
    });
  }

  static renderResult(r, ownerMatch) {
    const badge = r.score >= 80 ? 'is-great' : r.score >= 65 ? 'is-good' : r.score >= 50 ? 'is-mid' : 'is-low';

    return `
      <section class="identity-card match-result-card">
        <div class="match-score-ring ${badge}">
          <div class="match-score-num">${r.score}</div>
          <div class="match-score-max">/ 100</div>
        </div>
        <h2 class="match-headline">${esc(r.formatted)} — ${esc(r.verdictTh)}</h2>

        <div class="score-breakdown" style="text-align:left;">
          <h4>คะแนนนี้คำนวณมาจากอะไร</h4>
          <p class="score-base">เริ่มจากคะแนนกลาง 60 แล้วบวกลบตามผลรวมและคู่เลขที่พบจริงในเบอร์</p>
          <ul>
            ${r.scoreFactors.map(f => `
              <li class="${f.points >= 0 ? 'is-plus' : 'is-minus'}">
                <span class="score-delta">${f.points > 0 ? '+' : ''}${Math.round(f.points)}</span>
                <span><b>${esc(f.labelTh)}</b> — ${esc(f.reasonTh)}</span>
              </li>`).join('')}
          </ul>
        </div>

        <div class="domain-sections" style="text-align:left;">
          <article class="domain-section">
            <h3>🧮 ผลรวมเบอร์ = ${r.sum}</h3>
            <p><b>${esc(r.sumInfo.titleTh)}</b> — ${esc(r.sumInfo.descTh)}</p>
            <div class="source-badge">มาจาก: บวกเลขทั้ง ${r.phone.length} หลักเข้าด้วยกันตามตำราเลขศาสตร์</div>
          </article>

          <article class="domain-section">
            <h3>🔢 คู่เลขทั้งหมดในเบอร์ (${r.pairs.length} คู่)</h3>
            <p style="margin-bottom: var(--space-3);">ตำราอ่านเลขสองตัวที่ติดกัน แต่ละคู่มีดาวประจำต่างกัน
            คู่ท้ายสุดถือว่าส่งผลแรงที่สุด</p>
            <div class="pair-grid">
              ${r.pairs.map(p => `
                <div class="pair-chip tone-${p.group.tone}${p.isLast ? ' is-last' : ''}">
                  <span class="pair-num">${esc(p.text)}</span>
                  <span class="pair-info">
                    <b>${p.group.emoji} ${esc(p.group.nameTh)}</b>
                    <small>${esc(p.group.shortTh)}</small>
                  </span>
                  ${p.isLast ? '<span class="pair-last-tag">คู่ท้าย</span>' : ''}
                </div>`).join('')}
            </div>
          </article>

          ${this.renderGroupDetail(r)}

          ${ownerMatch ? `
          <article class="domain-section">
            <h3>🎯 เบอร์นี้ถูกโฉลกกับวันเกิดคุณไหม</h3>
            <p>${esc(ownerMatch.verdictTh)}</p>
            <p style="margin-top:8px;">${esc(ownerMatch.adviceTh)}</p>
            <div class="source-badge">มาจาก: เลขประจำดาวในผังทักษาปกรณ์ คำนวณจากวันเกิดของคุณ</div>
          </article>` : ''}

          <article class="domain-section">
            <h3>🪐 ดาวประจำเลขที่มีในเบอร์นี้</h3>
            <dl class="element-meta">
              ${r.digitPlanets.map(d => `
                <dt>เลข ${d.digit} — ${esc(d.planetTh)}</dt>
                <dd>${esc(d.meaningTh)}</dd>`).join('')}
            </dl>
            <div class="source-badge">มาจาก: การจับคู่เลข 0-9 กับดาวนพเคราะห์ตามเลขศาสตร์ไทย</div>
          </article>
        </div>

        <p class="domain-disclaimer">${esc(r.disclaimerTh)}</p>

        <div class="ai-block">
          <div class="ai-block-head">
            <div>
              <strong>อยากรู้ว่าเบอร์นี้เหมาะกับงานที่ทำอยู่ไหม?</strong>
              <p>บอกอาชีพหรือสิ่งที่กำลังทำ แล้วให้หมอดูวิเคราะห์ว่าเบอร์นี้หนุนหรือขัด</p>
            </div>
          </div>
          <div class="ai-followup" style="display:flex;">
            <input type="text" id="phone-ai-q" class="ai-followup-input" placeholder="เช่น ทำธุรกิจขายของออนไลน์ เบอร์นี้เหมาะไหม" />
            <button type="button" class="btn btn-primary" id="phone-ai-btn"><span>ถาม</span></button>
          </div>
          <div class="ai-answer" id="phone-ai-answer" hidden></div>
        </div>
      </section>`;
  }

  static renderGroupDetail(r) {
    // แสดงรายละเอียดเฉพาะกลุ่มที่พบในเบอร์นี้ เรียงจากดีไปแย่
    const seen = new Map();
    r.pairs.forEach(p => {
      if (p.group.id === 'neutral' || p.group.id === 'weak') return;
      if (!seen.has(p.group.id)) seen.set(p.group.id, { group: p.group, pairs: [] });
      seen.get(p.group.id).pairs.push(p.text);
    });
    if (!seen.size) return '';

    const order = { great: 0, good: 1, mixed: 2, bad: 3 };
    const groups = [...seen.values()].sort((a, b) => order[a.group.tone] - order[b.group.tone]);

    return groups.map(({ group, pairs }) => `
      <article class="domain-section tone-border-${group.tone}">
        <h3>${group.emoji} ${esc(group.nameTh)} — พบในคู่ ${esc(pairs.join(' '))}</h3>
        <p>${esc(group.meaningTh)}</p>
        <div class="pair-domain-grid">
          <div><b>💼 การงาน</b><p>${esc(group.workTh)}</p></div>
          <div><b>💰 การเงิน</b><p>${esc(group.moneyTh)}</p></div>
          <div><b>💗 ความรัก</b><p>${esc(group.loveTh)}</p></div>
        </div>
        <div class="source-badge">มาจาก: กลุ่มดาวของคู่เลขตามระบบนพเคราะห์ในเลขศาสตร์ไทย</div>
      </article>`).join('');
  }

  static bindResultEvents(box, r, ownerMatch) {
    box.querySelector('#phone-ai-btn')?.addEventListener('click', async () => {
      const btn = box.querySelector('#phone-ai-btn');
      const answer = box.querySelector('#phone-ai-answer');
      const q = box.querySelector('#phone-ai-q').value.trim() || 'ภาพรวมว่าเบอร์นี้เหมาะกับฉันไหม';

      btn.disabled = true;
      btn.querySelector('span').textContent = 'กำลังดู…';
      answer.hidden = false;
      answer.innerHTML = '<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> กำลังอ่านเลขในเบอร์ของคุณ…</div>';

      const context = [
        'ผลวิเคราะห์เบอร์โทรตามเลขศาสตร์ไทยที่ระบบคำนวณแล้ว:',
        'เบอร์: ' + r.formatted,
        'ผลรวมทุกหลัก: ' + r.sum + ' (' + r.sumInfo.titleTh + ' — ' + r.sumInfo.descTh + ')',
        'คะแนนรวม: ' + r.score + '/100 (' + r.verdictTh + ')',
        'คู่เลขทั้งหมด: ' + r.pairs.map(p => p.text + '=' + p.group.nameTh).join(', '),
        'คู่ท้ายสุด (สำคัญที่สุด): ' + r.pairs[r.pairs.length - 1].text + ' อยู่กลุ่ม ' + r.pairs[r.pairs.length - 1].group.nameTh,
        ownerMatch ? 'เทียบกับวันเกิดเจ้าของ: ' + ownerMatch.verdictTh : 'ไม่ทราบวันเกิดเจ้าของ ห้ามเดา',
        '',
        'สิ่งที่ผู้ใช้ถาม: ' + q
      ].join(String.fromCharCode(10));

      const res = await OracleAIService.sendChat(
        [{ role: 'user', content: q + ' — ตอบโดยอ้างผลคู่เลขที่ให้มาเท่านั้น และบอกด้วยว่าควรเปลี่ยนเบอร์หรือไม่ เพราะอะไร' }],
        {
          purpose: 'phone:analysis',
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
        <div class="ai-answer-tag">✦ คำวิเคราะห์เบอร์ของคุณ</div>
        ${ReadingView.formatAnswer(res.answer)}
      </div>`;
      SoundManager.play('reading-complete');
    });
  }
}
