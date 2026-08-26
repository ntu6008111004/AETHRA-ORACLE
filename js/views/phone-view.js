/**
 * AETHRA ORACLE — ดูดวงเบอร์โทรศัพท์
 * วิเคราะห์ผลรวมเบอร์และคู่เลขตามตำราเลขศาสตร์ไทย
 * พร้อมเทียบกับวันเกิดเจ้าของว่าถูกโฉลกหรือไม่
 */

import { Storage } from '../core/storage.js';
import { SoundManager } from '../core/sound.js';
import { PhoneNumerologyEngine, DIGIT_PLANETS } from '../engines/phone-numerology.js';
import { PLANET_POWER, TOTAL_POWER, POWER_USAGE_TH, POWER_NOT_FOR_TH, luckyNumbersFromPower } from '../data/maha-thaksa.js';
import { TaksaEngine } from '../engines/thai-taksa.js';
import { PLANET_NUMBERS } from '../engines/life-domains.js';
import { METHOD_USED, AGREED_POINTS_TH, DISPUTED_POINTS, HONESTY_NOTE_TH, BIRTH_LINK_METHOD, SOURCES, CONFIDENCE_LEVELS } from '../data/phone-methodology.js';
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
              <div class="identity-eyebrow">📱 เบอร์มงคลส่งเสริม</div>
              <h1 class="identity-name">เช็คเบอร์มงคลส่งเสริม</h1>
              <p class="identity-sub">อ่านคู่เลขทุกคู่ตามตารางเบอร์มงคลสายตำรา อ.พลูหลวง
              ซึ่งเป็นสายเดียวกับที่วงการเบอร์มงคลใช้ บอกว่าเบอร์นี้ส่งเสริมด้านไหน
              และมีคู่ไหนที่ต้องรู้ไว้</p>
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

        <details class="method-box">
          <summary>📚 เว็บนี้ใช้ตำราไหน และทำไมเช็คกับเว็บอื่นแล้วได้ไม่ตรงกัน</summary>
          <div class="method-body">
            <h4>วิธีที่เว็บนี้ใช้</h4>
            <p class="method-lead">${esc(METHOD_USED.nameTh)}</p>
            <p>${esc(METHOD_USED.summaryTh)}</p>
            <ol class="method-steps">
              ${METHOD_USED.stepsTh.map(st => `<li>${esc(st)}</li>`).join('')}
            </ol>

            <h4>สิ่งที่แทบทุกสำนักเห็นตรงกัน</h4>
            <ul class="method-agree">
              ${AGREED_POINTS_TH.map(a => `<li>${esc(a)}</li>`).join('')}
            </ul>

            <h4>จุดที่แต่ละสำนักไม่ตรงกัน</h4>
            <div class="method-dispute-grid">
              ${DISPUTED_POINTS.map(d => `
                <div class="method-dispute">
                  <b>${esc(d.topicTh)}</b>
                  <p class="ds-a">สำนักหนึ่ง: ${esc(d.schoolA)}</p>
                  <p class="ds-b">อีกสำนัก: ${esc(d.schoolB)}</p>
                  <p class="ds-ours">เว็บนี้: ${esc(d.oursTh)}</p>
                </div>`).join('')}
            </div>

            <h4>${esc(BIRTH_LINK_METHOD.titleTh)}</h4>
            <p>${esc(BIRTH_LINK_METHOD.introTh)}</p>
            <ol class="method-steps">
              ${BIRTH_LINK_METHOD.stepsTh.map(st => `
                <li><b>${esc(st.stepTh)}</b><br><span>${esc(st.detailTh)}</span></li>`).join('')}
            </ol>
            <p class="method-warn">${esc(BIRTH_LINK_METHOD.noteTh)}</p>

            <h4>ข้อมูลนี้มาจากไหน</h4>
            <div class="source-list">
              ${SOURCES.map(src => `
                <div class="source-item">
                  <b>${esc(src.nameTh)}</b>
                  ${src.viaTh ? `<span class="src-via">${esc(src.viaTh)}</span>` : ''}
                  ${src.url ? `<a href="${esc(src.url)}" target="_blank" rel="noopener noreferrer">ดูแหล่งที่มา ↗</a>` : ''}
                  <p><b>ใช้ทำอะไร:</b> ${esc(src.usedForTh)}</p>
                  <p class="src-cred">${esc(src.credibilityTh)}</p>
                </div>`).join('')}
            </div>

            <h4>ส่วนไหนเชื่อได้แค่ไหน</h4>
            <div class="confidence-list">
              ${CONFIDENCE_LEVELS.map(c => `
                <div class="confidence-item tone-${c.toneTh}">
                  <b>${esc(c.levelTh)}</b>
                  <ul>${c.itemsTh.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
                </div>`).join('')}
            </div>

            <p class="method-honesty">${esc(HONESTY_NOTE_TH)}</p>
          </div>
        </details>

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
        const power = luckyNumbersFromPower(taksa.birthPlanetId);
        if (power) {
          ownerMatch.powerTh = power.explainTh;
          ownerMatch.birthPlanetTh = power.planetTh;
        }
      }

      box.innerHTML = this.renderResult(result, ownerMatch);
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      Storage.addReadingToHistory({ type: 'Phone', phone: result.formatted, grade: result.gradeTh });
      this.bindResultEvents(box, result, ownerMatch);
    });
  }

  static renderResult(r, ownerMatch) {
    return `
      <section class="identity-card match-result-card">
        <div class="grade-badge grade-${r.grade}">
          <div class="grade-label">สรุปตามตำรา</div>
          <div class="grade-value">${esc(r.gradeTh)}</div>
        </div>
        <h2 class="match-headline">${esc(r.formatted)}</h2>
        <p class="grade-reason">${esc(r.gradeReasonTh)}</p>

        ${ownerMatch ? `
        <div class="personal-verdict pv-${ownerMatch.decision}">
          <div class="pv-title">🎯 สรุปสำหรับคุณ: ${esc(ownerMatch.decisionTh)}</div>
          <p>${esc(ownerMatch.decisionDetailTh)}</p>
          <div class="source-badge">รวมผลจากตารางเบอร์มงคล และเลขกาลกิณีตามวันเกิดของคุณ</div>
        </div>` : `
        <div class="notice-card is-info" style="text-align:left;">
          <span class="notice-icon">💡</span>
          <div><p>กรอกวันเกิดที่<a href="#profile" class="notice-link">หน้าโปรไฟล์</a>
          แล้วระบบจะสรุปให้เลยว่าเบอร์นี้ดีอยู่แล้วสำหรับคุณ หรือควรพิจารณาเปลี่ยน</p></div>
        </div>`}

        <div class="score-breakdown" style="text-align:left;">
          <h4>เกณฑ์การตัดสิน (เปิดเผยทั้งหมด ไม่มีสูตรลับ)</h4>
          <p class="score-base">เว็บนี้ไม่ให้คะแนนเป็นตัวเลข 0-100 เพราะไม่มีในตำราเล่มใด
          แต่สรุปเป็นระดับตามเกณฑ์ที่อ่านจากตารางได้ตรง ๆ ดังนี้</p>
          <ul class="grade-rule-list">
            ${r.gradeRuleTh.map(rule => `<li>${esc(rule)}</li>`).join('')}
          </ul>
          <p class="score-base" style="margin-top:8px;">
            เบอร์นี้เข้าเกณฑ์ <b>${esc(r.gradeTh)}</b> เพราะ${esc(r.gradeReasonTh)}
          </p>
        </div>

        <details class="method-box" style="text-align:left;">
          <summary>🧮 ดูวิธีคำนวณเบอร์นี้ทีละขั้น</summary>
          <div class="method-body">
            <ol class="method-steps">
              ${r.calcStepsTh.map(st => `<li>${esc(st)}</li>`).join('')}
            </ol>
            <p class="method-honesty">${esc(HONESTY_NOTE_TH)}</p>
          </div>
        </details>

        <div class="domain-sections" style="text-align:left;">
          ${r.supports.length ? `
          <article class="domain-section tone-border-great">
            <h3>🌟 เบอร์นี้ส่งเสริมด้านไหนบ้าง</h3>
            <div class="support-grid">
              ${r.supports.map(t => `
                <div class="support-chip">
                  <span class="support-emoji">${t.emoji}</span>
                  <b>${esc(t.labelTh)}</b>
                  <small>จากคู่ดี ${t.count} คู่</small>
                </div>`).join('')}
            </div>
            <div class="source-badge">มาจาก: ${esc(r.primarySourceTh)}</div>
          </article>` : ''}

          ${r.disagreedPairs.length ? `
          <article class="domain-section tone-border-mixed">
            <h3>⚖️ คู่ที่ตำราสองสายอ่านไม่ตรงกัน (${r.disagreedPairs.length} คู่)</h3>
            <p>นี่คือเหตุผลที่เบอร์เดียวกันเช็คแต่ละเว็บแล้วได้ผลต่างกัน
            เว็บนี้ใช้สายเบอร์มงคลเป็นหลัก แต่แสดงอีกสายให้เห็นตรง ๆ</p>
            <div class="disagree-list">
              ${r.disagreedPairs.map(p => `
                <div class="disagree-item">
                  <span class="pair-num">${esc(p.text)}</span>
                  <div>
                    <p class="ds-main">สายเบอร์มงคล (ที่เว็บนี้ใช้): <b>${esc(p.mainstream.tone)}</b> — ${esc(p.mainstream.m)}</p>
                    <p class="ds-alt">สายกลุ่มดาวนพเคราะห์: <b>${esc(p.group.nameTh)}</b> — ${esc(p.group.shortTh)}</p>
                  </div>
                </div>`).join('')}
            </div>
            <div class="source-badge">ทั้งสองสายเป็นตำราจริงที่เผยแพร่อยู่ ไม่มีสายไหนผิด แค่คนละตำรา</div>
          </article>` : ''}

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
              ${r.pairs.map(p => {
                const toneClass = p.mainstream.tone === 'ดี' ? 'tone-great'
                  : p.mainstream.tone === 'เสีย' ? 'tone-bad' : 'tone-neutral';
                return `
                <div class="pair-chip ${toneClass}${p.isLast ? ' is-last' : ''}">
                  <span class="pair-num">${esc(p.text)}</span>
                  <span class="pair-info">
                    <b>${p.mainstream.tone === 'ดี' ? '✅' : p.mainstream.tone === 'เสีย' ? '⚠️' : '⚪'} ${esc(p.mainstream.tone)}</b>
                    <small>${esc(p.mainstream.m)}</small>
                  </span>
                  ${p.isLast ? '<span class="pair-last-tag">คู่ท้าย</span>' : ''}
                </div>`;
              }).join('')}
            </div>
          </article>

          ${this.renderGroupDetail(r)}

          ${ownerMatch ? `
          <article class="domain-section">
            <h3>🎯 เบอร์นี้ถูกโฉลกกับวันเกิดคุณไหม</h3>
            <p>${esc(ownerMatch.verdictTh)}</p>
            <p style="margin-top:8px;">${esc(ownerMatch.adviceTh)}</p>
            <details class="method-inline">
              <summary>ดูว่าคำนวณจากวันเกิดยังไง</summary>
              <ol class="method-steps">
                ${BIRTH_LINK_METHOD.stepsTh.map(st => `<li><b>${esc(st.stepTh)}</b><br><span>${esc(st.detailTh)}</span></li>`).join('')}
              </ol>
              <p class="method-warn">${esc(BIRTH_LINK_METHOD.noteTh)}</p>
            </details>
            <div class="source-badge">มาจาก: เลขประจำดาวในผังทักษาปกรณ์ คำนวณจากวันเกิดของคุณ</div>
          </article>

          <article class="domain-section">
            <h3>🔢 เลขนำโชคของคุณตามกำลังวัน</h3>
            <p>${esc(ownerMatch.powerTh)}</p>
            <div class="power-table">
              ${Object.values(PLANET_POWER).map(pl => `
                <div class="power-cell${pl.planetTh === ownerMatch.birthPlanetTh ? ' is-mine' : ''}">
                  <b>${esc(pl.dayTh)}</b>
                  <span>${pl.power}</span>
                </div>`).join('')}
              <div class="power-cell is-total"><b>รวมทั้งหมด</b><span>${TOTAL_POWER}</span></div>
            </div>
            <p class="power-note">กำลังของดาวทั้ง 8 ดวงรวมกันได้ ${TOTAL_POWER} พอดี
            ซึ่งเป็นเลขมงคลในคติไทย จุดนี้ใช้ยืนยันว่าตัวเลขในตารางถูกต้องตามคัมภีร์</p>
            <details class="method-inline">
              <summary>ตำราให้ใช้กำลังวันทำอะไรบ้าง</summary>
              <ul class="method-agree">
                ${POWER_USAGE_TH.map(u => `<li><b>${esc(u.titleTh)}</b> — ${esc(u.detailTh)}</li>`).join('')}
              </ul>
              <p class="method-warn">${esc(POWER_NOT_FOR_TH)}</p>
            </details>
            <div class="source-badge">มาจาก: คัมภีร์มหาทักษา ตำราโหราศาสตร์ไทยดั้งเดิม</div>
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

  /** สายรอง แสดงเป็นข้อมูลเทียบเท่านั้น */
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

    return `<details class="method-box" style="text-align:left;">
      <summary>🔭 มุมมองสายกลุ่มดาวนพเคราะห์ (สายรอง ไว้เทียบ)</summary>
      <div class="method-body">` + groups.map(({ group, pairs }) => `
      <article class="domain-section tone-border-${group.tone}" style="margin-bottom:var(--space-3);">
        <h3>${group.emoji} ${esc(group.nameTh)} — พบในคู่ ${esc(pairs.join(' '))}</h3>
        <p>${esc(group.meaningTh)}</p>
        <div class="pair-domain-grid">
          <div><b>💼 การงาน</b><p>${esc(group.workTh)}</p></div>
          <div><b>💰 การเงิน</b><p>${esc(group.moneyTh)}</p></div>
          <div><b>💗 ความรัก</b><p>${esc(group.loveTh)}</p></div>
        </div>
        <div class="source-badge">มาจาก: กลุ่มดาวของคู่เลขตามระบบนพเคราะห์ในเลขศาสตร์ไทย</div>
      </article>`).join('') + `</div></details>`;
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

      const lastP = r.pairs[r.pairs.length - 1];
      const context = [
        'ผลวิเคราะห์เบอร์ตามตารางเบอร์มงคล (สายตำรา อ.พลูหลวง) ที่ระบบสรุปแล้ว:',
        'เบอร์: ' + r.formatted,
        '',
        '[ข้อสรุปของระบบ ห้ามตอบสวนทางกับข้อนี้]',
        'ระดับ: ' + r.gradeTh,
        'เหตุผล: ' + r.gradeReasonTh,
        r.supports.length ? 'ส่งเสริมด้าน: ' + r.supports.map(t => t.labelTh + ' (' + t.count + ' คู่)').join(', ') : '',
        '',
        '[คู่เลขทั้งหมด อ่านตามสายเบอร์มงคล]',
        ...r.pairs.map(p => p.text + ' = ' + p.mainstream.tone + ' (' + p.mainstream.m + ')'
          + (p.isLast ? ' <- คู่ท้าย สำคัญที่สุด' : '')),
        '',
        'ผลรวมทุกหลัก: ' + r.sum + ' (' + r.sumInfo.titleTh + ')',
        'คู่ดี ' + r.goodPairs.length + ' คู่ / กลาง ' + r.mixedPairs.length + ' คู่ / เสีย ' + r.badPairs.length + ' คู่',
        r.disagreedPairs.length
          ? 'หมายเหตุ: คู่ ' + r.disagreedPairs.map(p => p.text).join(' ')
            + ' มีตำราอีกสาย (สายกลุ่มดาว) อ่านต่างออกไป แต่ให้ยึดสายเบอร์มงคลข้างบนเป็นหลัก'
          : '',
        ownerMatch ? 'เทียบกับวันเกิดเจ้าของ: ' + ownerMatch.verdictTh : 'ไม่ทราบวันเกิดเจ้าของ ห้ามเดา',
        ownerMatch ? 'ข้อสรุปเฉพาะตัวของระบบ (ยึดตามนี้): ' + ownerMatch.decisionTh + ' — ' + ownerMatch.decisionDetailTh : '',
        '',
        'กติกาการตอบ: ยึดระดับและเหตุผลของระบบข้างบนเท่านั้น'
          + ' ถ้าระบบสรุปว่าส่งเสริมดี ห้ามแนะนำให้เปลี่ยนเบอร์'
          + ' ถ้าระบบสรุปว่าควรระวังหรือให้เลี่ยง จึงค่อยแนะนำเรื่องการเปลี่ยนเบอร์ได้'
          + ' ห้ามใช้คำว่าดาวมรณะหรือกาลกิณีกับคู่ที่สายเบอร์มงคลอ่านว่าดี',
        '',
        'สิ่งที่ผู้ใช้ถาม: ' + q
      ].filter(Boolean).join(String.fromCharCode(10));

      const res = await OracleAIService.sendChat(
        [{ role: 'user', content: q + ' — ตอบโดยอ้างผลคู่เลขสายเบอร์มงคลที่ให้มาเท่านั้น และสอดคล้องกับข้อสรุปของระบบ' }],
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
