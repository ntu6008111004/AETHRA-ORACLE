/**
 * AETHRA ORACLE — หน้าดวงสมพงศ์ / เช็คเนื้อคู่
 * ------------------------------------------------------------------
 * ตอบโจทย์ทั้งคนโสด (นักษัตรไหนถูกโฉลกกับฉัน) และคนมีคู่ (เราสองคนเข้ากันไหม)
 * คำนวณจากกฎสามฮะ ลิ่วฮะ ชง ไห่ และธาตุประจำตัวดวงจีน — ไม่มีการสุ่ม
 *
 * หน้านี้ดูได้ทันทีแม้ยังไม่กรอกวันเกิดของอีกฝ่าย:
 *   1) เนื้อคู่ในอุดมคติของคุณ — ควรเกิดปีไหน เดือนอะไร นิสัยแบบไหน เจอได้ที่ไหน
 *   2) นักษัตรที่ถูกโฉลกกับคุณครบทั้ง 12 ปี
 *   3) แท็บดูรายด้านแยกทีละเรื่อง การงาน การเงิน ความรัก สุขภาพ โชคลาภ
 *   4) ช่องเทียบดวงสองคน สำหรับคนที่มีคนอยากเช็คด้วยอยู่แล้ว
 */

import { Storage } from '../core/storage.js';
import { SoundManager } from '../core/sound.js';
import { CompatibilityEngine } from '../engines/compatibility.js';
import { ChineseZodiacEngine } from '../engines/chinese-zodiac.js';
import { LifeDomainsEngine } from '../engines/life-domains.js';
import { IDEAL_PARTNER_TH } from '../data/match-profiles.js';
import { OracleAIService } from '../services/oracle-ai.js';
import { ReadingView } from './reading-view.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** ลำดับและไอคอนของแท็บรายด้าน ใช้ชุดเดียวกับหน้าดูดวงหลัก */
const DOMAIN_ORDER = ['career', 'money', 'love', 'health', 'luck'];

const DOMAIN_ICONS = {
  career: '💼',
  money: '💰',
  love: '💗',
  health: '🌿',
  luck: '🍀'
};

function scoreLabel(score) {
  if (score >= 80) return { text: 'ดีมาก', cls: 'is-great' };
  if (score >= 65) return { text: 'ดี', cls: 'is-good' };
  if (score >= 50) return { text: 'ปานกลาง', cls: 'is-mid' };
  return { text: 'ต้องระวัง', cls: 'is-low' };
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
              <p class="identity-sub">ยังไม่ต้องมีคู่ก็ดูได้ ระบบจะบอกก่อนว่าคู่ที่เหมาะกับคุณควรเกิดปีไหน เดือนอะไร นิสัยแบบไหน และมักเจอกันที่ไหน ถ้ามีคนที่อยากเช็คด้วยอยู่แล้ว ค่อยกรอกวันเกิดของอีกฝ่ายในช่องด้านล่าง</p>
            </div>
            <a href="#profile" class="identity-edit">แก้ไขข้อมูลเกิด</a>
          </div>
        </section>

        <section class="identity-card" id="ideal-partner-section">
          <div class="identity-head">
            <div>
              <div class="identity-eyebrow">💍 ไม่ต้องกรอกข้อมูลคู่ก็ดูได้</div>
              <h1 class="identity-name" style="font-size: clamp(1.2rem, 3vw, 1.6rem);">เนื้อคู่ในอุดมคติของคุณ</h1>
            </div>
          </div>
          <div id="ideal-partner-body"></div>
        </section>

        <section class="identity-card" id="single-section">
          <div class="identity-head">
            <div>
              <div class="identity-eyebrow">🔎 สำหรับคนโสด</div>
              <h1 class="identity-name" style="font-size: clamp(1.2rem, 3vw, 1.6rem);">นักษัตรไหนถูกโฉลกกับคุณที่สุด</h1>
            </div>
          </div>
          <div id="single-matches"></div>
        </section>

        <section class="identity-card" id="match-domain-section">
          <div class="identity-head">
            <div>
              <div class="identity-eyebrow">📚 ดูแยกทีละเรื่อง</div>
              <h1 class="identity-name" style="font-size: clamp(1.2rem, 3vw, 1.6rem);">การงาน การเงิน ความรัก สุขภาพ โชคลาภ</h1>
              <p class="identity-sub">กดเลือกเรื่องที่อยากอ่าน แล้วระบบจะแสดงเฉพาะเรื่องนั้นแบบละเอียด พร้อมบอกว่าคำนวณมาจากอะไร</p>
            </div>
          </div>
          <div id="match-domain-body"></div>
        </section>

        <section class="identity-card">
          <div class="identity-head">
            <div>
              <div class="identity-eyebrow">👫 มีคนที่อยากเช็คด้วยแล้ว</div>
              <h1 class="identity-name" style="font-size: clamp(1.2rem, 3vw, 1.6rem);">เทียบดวงสองคน</h1>
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
      </div>`;

    this.renderIdealPartner(container, profile);
    this.renderSingleMatches(container, profile);
    this.renderDomains(container, profile);
    this.bindEvents(container);
  }

  /** ข้อความชวนไปกรอกวันเกิด ใช้ซ้ำได้ทุกส่วนที่ต้องใช้วันเกิด */
  static missingBirthDateHtml(extraTh) {
    return `
      <div class="notice-card is-warn">
        <span class="notice-icon">📅</span>
        <div>
          <strong>ยังไม่ได้กรอกวันเกิดของคุณ</strong>
          <p>${escapeHtml(extraTh)} ระบบจะไม่เดาวันเกิดแทนคุณ กรุณาไปกรอกวันเดือนปีเกิดที่หน้าโปรไฟล์ก่อน แล้วกลับมาหน้านี้อีกครั้ง</p>
          <a href="#profile" class="notice-link">ไปกรอกวันเกิด</a>
        </div>
      </div>`;
  }

  // ------------------------------------------------ เนื้อคู่ในอุดมคติของคุณ
  static renderIdealPartner(container, profile) {
    const box = container.querySelector('#ideal-partner-body');
    if (!box) return;

    if (!profile.birthDate) {
      box.innerHTML = this.missingBirthDateHtml('ส่วนนี้ต้องใช้ปีนักษัตรของคุณ เพื่อบอกว่าคู่ที่เหมาะควรเกิดปีไหน เดือนอะไร และเป็นคนแบบไหน');
      return;
    }

    const zodiac = ChineseZodiacEngine.getZodiac(profile.birthDate, profile.birthTime || '12:00');
    const ideal = IDEAL_PARTNER_TH[zodiac.branchIndex];
    if (!ideal) {
      box.innerHTML = this.missingBirthDateHtml('ยังจับคู่ข้อมูลปีนักษัตรของคุณไม่ได้');
      return;
    }

    const facts = [
      { label: 'คุณเกิดปี', value: 'ปี' + zodiac.nameTh + ' (' + zodiac.animalTh + ')', hint: 'นับโดยยึดวันลี่ชุนเป็นเส้นแบ่งปี' },
      { label: 'ปีเกิดของคู่ที่ถูกโฉลก', value: ideal.bestYears, hint: 'เจอคนปีเหล่านี้แล้วมักคุยกันรู้เรื่องเร็ว' },
      { label: 'ปีเกิดที่ต้องระวัง', value: ideal.avoidYears, hint: 'ไม่ได้แปลว่าคบไม่ได้ แต่ต้องคุยกันมากกว่าปกติ' }
    ];

    const sections = [
      {
        headingTh: 'คู่ของคุณควรเกิดเดือนไหน',
        bodyTh: ideal.bestMonthsTh,
        sourceTh: 'มาจาก: กฎสามฮะและลิ่วฮะของกิ่งดิน 12 ตัว แปลงเป็นเดือนเกิดตามการนับเดือนแบบจีน'
      },
      {
        headingTh: 'วันที่เหมาะจะทักไปคุยหรือชวนออกไปเจอกัน',
        bodyTh: ideal.bestDaysTh,
        sourceTh: 'มาจาก: ธาตุที่หนุนปีนักษัตรของคุณ จับคู่กับวันประจำธาตุตามตำรา'
      },
      {
        headingTh: 'คู่ควรเป็นคนแบบไหน',
        bodyTh: ideal.personalityTh,
        sourceTh: 'มาจาก: ลักษณะนิสัยประจำปี' + ideal.zodiacTh + ' และนิสัยของปีที่ถูกโฉลกกับปีนี้'
      },
      {
        headingTh: 'มักเจอกันได้ที่ไหน',
        bodyTh: ideal.whereToMeetTh,
        sourceTh: 'มาจาก: แนวทางการเข้าสังคมที่ตรงกับนิสัยประจำปี' + ideal.zodiacTh
      },
      {
        headingTh: 'คนแบบที่ควรเลี่ยง',
        bodyTh: ideal.redFlagTh,
        sourceTh: 'มาจาก: จุดที่ปี' + ideal.zodiacTh + ' มักเสียเปรียบ ตามกฎปีที่ปะทะกันและปีที่เบียดเบียนกัน'
      },
      {
        headingTh: 'เจอแล้วรักษาความสัมพันธ์ไว้ยังไง',
        bodyTh: ideal.howToKeepTh,
        sourceTh: 'มาจาก: จุดอ่อนในความสัมพันธ์ของคนปี' + ideal.zodiacTh + ' ตามตำรานักษัตร'
      },
      {
        headingTh: 'คำแนะนำสำหรับคนโสด',
        bodyTh: ideal.singleAdviceTh,
        sourceTh: 'มาจาก: ข้อควรปรับของคนปี' + ideal.zodiacTh + ' เมื่อต้องการเริ่มความสัมพันธ์ใหม่'
      }
    ];

    box.innerHTML = `
      <p class="identity-sub" style="margin-bottom: var(--space-4);">คุณเกิดปี${escapeHtml(zodiac.nameTh)} ระบบจึงบอกได้เลยว่าคู่ที่เหมาะกับคุณควรเป็นคนแบบไหน โดยไม่ต้องรู้วันเกิดของอีกฝ่าย ถ้ารู้วันเกิดของเขาแล้ว ให้เลื่อนลงไปกรอกในช่องเทียบดวงสองคน จะได้คะแนนความเข้ากันเป็นตัวเลข</p>
      <div class="identity-grid">
        ${facts.map(f => `
          <div class="identity-fact">
            <div class="identity-fact-label">${escapeHtml(f.label)}</div>
            <div class="identity-fact-value">${escapeHtml(f.value)}</div>
            <div class="identity-fact-hint">${escapeHtml(f.hint)}</div>
          </div>`).join('')}
      </div>
      <div class="domain-sections">
        ${sections.map(s => `
          <article class="domain-section">
            <h3>${escapeHtml(s.headingTh)}</h3>
            <p>${escapeHtml(s.bodyTh)}</p>
            <div class="source-badge">${escapeHtml(s.sourceTh)}</div>
          </article>`).join('')}
      </div>
      <p class="domain-disclaimer">ข้อมูลนี้เป็นแนวทางตามตำรานักษัตร ใช้ช่วยตัดสินใจได้ แต่คนจริงเปลี่ยนแปลงได้เสมอ ให้ดูสิ่งที่เขาทำจริงประกอบด้วยทุกครั้ง</p>`;
  }

  static renderSingleMatches(container, profile) {
    const box = container.querySelector('#single-matches');
    if (!profile.birthDate) {
      box.innerHTML = this.missingBirthDateHtml('ส่วนนี้จะเรียงให้ครบทั้ง 12 ปีนักษัตรว่าปีไหนถูกโฉลกกับคุณ ปีไหนต้องใช้ความเข้าใจมากกว่าปกติ');
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

  // ------------------------------------------------ แท็บดูรายด้านแยกทีละเรื่อง
  static renderDomains(container, profile) {
    const box = container.querySelector('#match-domain-body');
    if (!box) return;

    if (!profile.birthDate) {
      box.innerHTML = this.missingBirthDateHtml('ส่วนนี้จะแยกคำอ่านออกเป็น 5 เรื่อง คือ การงาน การเงิน ความรัก สุขภาพ และโชคลาภ');
      return;
    }

    const result = LifeDomainsEngine.analyze(profile);
    if (!result.available) {
      box.innerHTML = this.missingBirthDateHtml(result.reasonTh);
      return;
    }

    const domains = result.domains;

    box.innerHTML = `
      <div class="domain-nav" role="tablist" aria-label="เลือกเรื่องที่อยากอ่าน">
        ${DOMAIN_ORDER.map((id, i) => `
          <button type="button" class="domain-nav-btn${i === 0 ? ' is-active' : ''}"
                  role="tab" data-match-domain="${id}" aria-selected="${i === 0}">
            <span class="domain-nav-icon">${DOMAIN_ICONS[id]}</span>
            <span class="domain-nav-label">${escapeHtml(domains[id].titleTh)}</span>
            <span class="domain-nav-score">${domains[id].score}</span>
          </button>`).join('')}
      </div>
      <div id="match-domain-panels">
        ${DOMAIN_ORDER.map((id, i) => this.renderDomainPanel(domains[id], i === 0)).join('')}
      </div>`;
  }

  static renderDomainPanel(domain, isActive) {
    const badge = scoreLabel(domain.score);
    return `
      <section class="domain-panel${isActive ? ' is-active' : ''}" data-match-panel="${domain.id}" role="tabpanel">
        <header class="domain-header">
          <div>
            <div class="domain-eyebrow">${DOMAIN_ICONS[domain.id]} เรื่อง${escapeHtml(domain.titleTh)}</div>
            <h2 class="domain-title">${escapeHtml(domain.subtitleTh)}</h2>
            <p class="domain-headline">${escapeHtml(domain.headlineTh)}</p>
          </div>
          <div class="domain-score ${badge.cls}">
            <div class="domain-score-num">${domain.score}</div>
            <div class="domain-score-text">${badge.text}</div>
          </div>
        </header>

        ${domain.needsMoreDataTh ? `
          <div class="notice-card is-info">
            <span class="notice-icon">💡</span>
            <div><p>${escapeHtml(domain.needsMoreDataTh)}</p></div>
          </div>` : ''}

        <div class="domain-sections">
          ${domain.sections.map(s => `
            <article class="domain-section">
              <h3>${escapeHtml(s.headingTh)}</h3>
              <p>${escapeHtml(s.bodyTh)}</p>
              <div class="source-badge">${escapeHtml(s.sourceTh)}</div>
            </article>`).join('')}
        </div>

        <div class="action-grid">
          <div class="action-box is-do">
            <h4>✅ สิ่งที่ควรทำ</h4>
            <ul>${domain.doThisTh.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          </div>
          <div class="action-box is-avoid">
            <h4>⛔ สิ่งที่ควรเลี่ยง</h4>
            <ul>${domain.avoidThisTh.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          </div>
        </div>

        ${domain.disclaimerTh ? `<p class="domain-disclaimer">${escapeHtml(domain.disclaimerTh)}</p>` : ''}
      </section>`;
  }

  static bindDomainTabs(container) {
    const buttons = container.querySelectorAll('.domain-nav-btn[data-match-domain]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.matchDomain;
        buttons.forEach(b => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        container.querySelectorAll('[data-match-panel]').forEach(p => {
          p.classList.toggle('is-active', p.dataset.matchPanel === id);
        });
        SoundManager.play('tab-switch');
      });
    });
  }

  static bindEvents(container) {
    this.bindDomainTabs(container);

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
