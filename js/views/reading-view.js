/**
 * AETHRA ORACLE — หน้าดูดวงหลัก "ครบจบในหน้าเดียว"
 * ------------------------------------------------------------------
 * แก้ปัญหาเดิมที่ผู้ใช้บ่นว่า:
 *   - อ่านแล้วไม่รู้ว่าเกี่ยวกับเรื่องอะไร  -> ทุกหัวข้อบอกชัดว่าเป็นเรื่อง งาน/เงิน/รัก/สุขภาพ/โชค
 *   - สั้นเกินไป                          -> แต่ละด้านมีหลายหัวข้อย่อย พร้อมสิ่งที่ควรทำและควรเลี่ยง
 *   - มีศัพท์ที่ไม่เข้าใจ                  -> ทุกศัพท์กดดูคำแปลได้ พร้อมตัวอย่าง
 *   - ไม่รู้ว่าคำนวณมาจากไหน               -> ทุกหัวข้อมีป้าย "มาจาก:" กำกับ
 *   - มีภาษาอังกฤษโผล่มา                  -> แปลงเป็นไทยทั้งหมดในชั้น engine แล้ว
 */

import { Storage } from '../core/storage.js';
import { SoundManager } from '../core/sound.js';
import { LifeDomainsEngine } from '../engines/life-domains.js';
import { OracleAIService } from '../services/oracle-ai.js';
import { GLOSSARY } from '../core/glossary.js';
import { ToastManager } from '../components/toast.js';

const DOMAIN_ORDER = ['career', 'money', 'love', 'health', 'luck'];

const DOMAIN_ICONS = {
  career: '💼',
  money: '💰',
  love: '💗',
  health: '🌿',
  luck: '🍀'
};

/** ใส่ปุ่มคำแปลให้ศัพท์ที่ปรากฏในข้อความ */
function withGlossary(text) {
  let out = escapeHtml(text);
  Object.entries(GLOSSARY).forEach(([key, entry]) => {
    const term = entry.termTh;
    if (!out.includes(term)) return;
    // แทนที่เฉพาะครั้งแรกเพื่อไม่ให้รก
    out = out.replace(
      term,
      `<button type="button" class="glossary-chip" data-term="${key}" title="กดดูคำแปล">${term}<span class="glossary-chip-mark">?</span></button>`
    );
  });
  return out;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}


const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** แปลง 1997-01-15 เป็น 15 ม.ค. 2540 พร้อมคืนปี พ.ศ. จริงของวันเกิด */
function toThaiDate(isoDate) {
  const [y, m, d] = String(isoDate || '').split('-').map(Number);
  if (!y || !m || !d) return { text: String(isoDate || ''), buddhistYear: null };
  return {
    text: d + ' ' + THAI_MONTHS_SHORT[m - 1] + ' ' + (y + 543),
    buddhistYear: y + 543
  };
}

function scoreLabel(score) {
  if (score >= 80) return { text: 'ดีมาก', cls: 'is-great' };
  if (score >= 65) return { text: 'ดี', cls: 'is-good' };
  if (score >= 50) return { text: 'ปานกลาง', cls: 'is-mid' };
  return { text: 'ต้องระวัง', cls: 'is-low' };
}

export class ReadingView {
  static render(container) {
    const profile = Storage.getProfile();
    const result = LifeDomainsEngine.analyze(profile);

    if (!result.available) {
      container.innerHTML = `
        <div class="reading-wrapper">
          <div class="empty-state-card">
            <div class="empty-state-icon">🔮</div>
            <h2>ยังดูดวงให้ไม่ได้</h2>
            <p>${escapeHtml(result.reasonTh)}</p>
            <a href="#profile" class="btn btn-primary"><span>ไปกรอกวันเกิด</span></a>
          </div>
        </div>`;
      return;
    }

    const { meta, domains } = result;
    const name = profile.nickname || profile.name || 'คุณ';

    container.innerHTML = `
      <div class="reading-wrapper">
        ${this.renderIdentityCard(name, meta, profile)}
        ${meta.hasTime ? '' : this.renderTimeWarning()}
        ${this.renderColorStrip(meta.taksa)}

        <div class="domain-nav" role="tablist" aria-label="เลือกด้านของชีวิต">
          ${DOMAIN_ORDER.map((id, i) => `
            <button type="button" class="domain-nav-btn${i === 0 ? ' is-active' : ''}"
                    role="tab" data-domain="${id}" aria-selected="${i === 0}">
              <span class="domain-nav-icon">${DOMAIN_ICONS[id]}</span>
              <span class="domain-nav-label">${escapeHtml(domains[id].titleTh)}</span>
              <span class="domain-nav-score">${domains[id].score}</span>
            </button>`).join('')}
        </div>

        <div id="domain-panels">
          ${DOMAIN_ORDER.map((id, i) => this.renderDomain(domains[id], i === 0)).join('')}
        </div>
      </div>

      <div id="glossary-popover" class="glossary-popover" hidden></div>
    `;

    this.bindEvents(container, result, profile);
  }

  static renderIdentityCard(name, meta, profile) {
    const { taksa, bazi, zodiac, thai, numerology, chong, age } = meta;
    const born = toThaiDate(profile.birthDate);

    // ปีนักษัตรจีนเปลี่ยนที่วันลี่ชุน (ราว 4 ก.พ.) ไม่ใช่ 1 มกราคม
    // คนที่เกิดต้นปีก่อนลี่ชุนจึงได้นักษัตรของปีก่อนหน้า ซึ่งทำให้สับสนได้
    // จึงต้องแยกให้ชัดว่าอันไหนคือปีเกิดจริง อันไหนคือปีของรอบนักษัตร
    const zodiacHint = zodiac.bornBeforeLiChun
      ? 'นับตามปฏิทินจีน = รอบปี พ.ศ. ' + zodiac.buddhistYear + ' (ไม่ใช่ปีเกิด)'
      : 'ตรงกับปีเกิด พ.ศ. ' + zodiac.buddhistYear;

    const facts = [
      { label: 'วันเกิดของคุณ', value: taksa.weekdayNameTh + ' ที่ ' + born.text, hint: 'อายุประมาณ ' + age + ' ปี · ' + profile.birthDate },
      { label: 'ราศีเกิด (สากล)', value: 'ราศี' + thai.westernSunSign.nameTh, hint: 'ราศีที่คนทั่วไปถามกัน' },
      { label: 'ราศีเกิด (แบบไทย)', value: 'ราศี' + thai.thaiSunSignNameTh, hint: 'โหราศาสตร์ไทยใช้ระบบนิรายนะ' },
      { label: 'ปีนักษัตร', value: 'ปี' + zodiac.nameTh + ' (' + zodiac.animalTh + ')', hint: zodiacHint, warn: zodiac.bornBeforeLiChun },
      { label: 'ธาตุประจำตัว (ดวงจีน)', value: 'ธาตุ' + bazi.dayMasterElement.nameTh, hint: bazi.strength.labelTh },
      { label: 'ธาตุเจ้าเรือน (แพทย์แผนไทย)', value: thai.bodyElement.nameTh, hint: thai.bodyElement.natureTh },
      { label: 'เลขเส้นทางชีวิต', value: 'เลข ' + numerology.lifePath, hint: numerology.meaningTh.title },
      { label: 'สถานะปีชง พ.ศ. ' + chong.buddhistYear, value: chong.isChong ? 'ปีนี้ชง' : 'ปีนี้ไม่ชง', hint: chong.isChong ? chong.matched[0].labelTh : 'เดินได้ตามปกติ', warn: chong.isChong }
    ];

    return `
      <section class="identity-card">
        <div class="identity-head">
          <div>
            <div class="identity-eyebrow">ดวงชะตาส่วนตัวของ</div>
            <h1 class="identity-name">${escapeHtml(name)}</h1>
            <p class="identity-sub">ทุกอย่างด้านล่างคำนวณจากวันเดือนปีเกิดของคุณโดยตรง ไม่ใช่คำทำนายรวม ๆ ที่ใครอ่านก็ได้</p>
          </div>
          <a href="#profile" class="identity-edit">แก้ไขข้อมูลเกิด</a>
        </div>
        <div class="identity-grid">
          ${facts.map(f => `
            <div class="identity-fact${f.warn ? ' is-warn' : ''}">
              <div class="identity-fact-label">${escapeHtml(f.label)}</div>
              <div class="identity-fact-value">${escapeHtml(f.value)}</div>
              <div class="identity-fact-hint">${escapeHtml(f.hint)}</div>
            </div>`).join('')}
        </div>
        ${zodiac.bornBeforeLiChun ? `
        <div class="notice-card is-warn" style="margin-top: var(--space-4);">
          <span class="notice-icon">📅</span>
          <div>
            <strong>ทำไมปีนักษัตรถึงไม่ตรงกับปีเกิด?</strong>
            <p>คุณเกิดวันที่ ${escapeHtml(born.text)} ซึ่งอยู่<b>ก่อนวันลี่ชุน</b> (วันขึ้นปีใหม่ตามปฏิทินจีน ตกราววันที่ 4 กุมภาพันธ์ของทุกปี)
            ตามหลักโหราศาสตร์จีนจึงนับว่าคุณยังอยู่ในรอบปี${escapeHtml(zodiac.nameTh)} (พ.ศ. ${zodiac.buddhistYear}) ไม่ใช่นักษัตรของปีเกิดตามปฏิทินสากล</p>
            <p style="margin-top:6px;">พูดง่าย ๆ คือ <b>ปีเกิดของคุณคือ พ.ศ. ${born.buddhistYear}</b> แต่ <b>ปีนักษัตรคือปี${escapeHtml(zodiac.nameTh)}</b>
            ทั้งสองอย่างถูกต้องทั้งคู่ เพียงแต่ใช้คนละปฏิทิน — จุดนี้เว็บดูดวงหลายแห่งคำนวณผิด เพราะไปนับที่ 1 มกราคม</p>
          </div>
        </div>` : ''}
        <p class="identity-note">${withGlossary(meta.thai.signDiffersNoteTh)}</p>
      </section>`;
  }

  static renderTimeWarning() {
    return `
      <div class="notice-card is-warn">
        <span class="notice-icon">⏰</span>
        <div>
          <strong>ยังไม่ได้ใส่เวลาเกิด</strong>
          <p>ระบบจึงยังคำนวณ <b>ลัคนา</b> และ <b>ภพทั้ง 12</b> ให้ไม่ได้ ซึ่งเป็นส่วนที่บอกเรื่องคู่ครอง การงาน และการเงินได้ตรงที่สุด
          เราเลือกที่จะไม่เดาให้ ถ้าคุณทราบเวลาเกิด (ดูได้จากสูติบัตร) ใส่เพิ่มแล้วผลจะละเอียดขึ้นมาก</p>
          <a href="#profile" class="notice-link">ใส่เวลาเกิดเพิ่ม</a>
        </div>
      </div>`;
  }

  static renderColorStrip(taksa) {
    const items = [
      { key: 'dech', label: 'สีการงาน/อำนาจ' },
      { key: 'si', label: 'สีเสน่ห์/ความรัก' },
      { key: 'mula', label: 'สีเงินทอง/ทรัพย์สิน' },
      { key: 'montri', label: 'สีผู้ใหญ่ช่วยเหลือ' },
      { key: 'ayu', label: 'สีสุขภาพ' }
    ];
    const avoid = taksa.byId.kalakini;

    return `
      <section class="color-strip">
        <div class="color-strip-head">
          <h2>สีมงคลเฉพาะตัวคุณ</h2>
          <p>คำนวณจาก${escapeHtml(taksa.weekdayNameTh)}ที่คุณเกิด ตามตำราทักษาปกรณ์ — ไม่ใช่สีประจำวันนี้ที่ทุกคนใช้เหมือนกัน</p>
        </div>
        <div class="color-strip-grid">
          ${items.map(item => {
            const pos = taksa.byId[item.key];
            return `
            <div class="color-chip">
              <span class="color-dot" style="background:${pos.colorHex}"></span>
              <div>
                <div class="color-chip-label">${escapeHtml(item.label)}</div>
                <div class="color-chip-value">${escapeHtml(pos.colorName)}</div>
                <div class="color-chip-hint">${escapeHtml(pos.exampleTh)}</div>
              </div>
            </div>`;
          }).join('')}
          <div class="color-chip is-avoid">
            <span class="color-dot is-avoid" style="background:${avoid.colorHex}"></span>
            <div>
              <div class="color-chip-label">สีที่ควรเลี่ยง (กาลกิณี)</div>
              <div class="color-chip-value">${escapeHtml(avoid.colorName)}</div>
              <div class="color-chip-hint">${escapeHtml(avoid.exampleTh)}</div>
            </div>
          </div>
        </div>
      </section>`;
  }

  static renderDomain(domain, isActive) {
    const badge = scoreLabel(domain.score);
    return `
      <section class="domain-panel${isActive ? ' is-active' : ''}" data-panel="${domain.id}" role="tabpanel">
        <header class="domain-header">
          <div>
            <div class="domain-eyebrow">${DOMAIN_ICONS[domain.id]} เรื่อง${escapeHtml(domain.titleTh)}</div>
            <h2 class="domain-title">${escapeHtml(domain.subtitleTh)}</h2>
            <p class="domain-headline">${withGlossary(domain.headlineTh)}</p>
          </div>
          <div class="domain-score ${badge.cls}">
            <div class="domain-score-num">${domain.score}</div>
            <div class="domain-score-text">${badge.text}</div>
            ${domain.scoring ? `<button type="button" class="score-why-btn" data-score-why="${domain.id}">ดูที่มา</button>` : ''}
          </div>
        </header>

        ${domain.scoring ? `
          <div class="score-breakdown" data-score-panel="${domain.id}" hidden>
            <h4>คะแนน ${domain.score} นี้คำนวณมาจากอะไร</h4>
            <p class="score-base">เริ่มจากคะแนนกลาง ${domain.scoring.base} คะแนน แล้วบวกลบตามผลคำนวณจริงในดวงคุณ</p>
            <ul>
              ${domain.scoring.factors.map(f => `
                <li class="${f.points >= 0 ? 'is-plus' : 'is-minus'}">
                  <span class="score-delta">${f.points > 0 ? '+' : ''}${f.points}</span>
                  <span><b>${escapeHtml(f.labelTh)}</b> — ${escapeHtml(f.reasonTh)}</span>
                </li>`).join('')}
            </ul>
            <p class="score-note">คะแนนนี้เป็นการสรุปแนวโน้มตามตำรา ไม่ใช่การวัดผลแบบวิทยาศาสตร์
            ใช้เทียบว่าด้านไหนของคุณเด่นกว่าด้านไหนได้ แต่อย่าใช้ตัดสินชีวิต</p>
          </div>` : ''}

        ${domain.needsMoreDataTh ? `
          <div class="notice-card is-info">
            <span class="notice-icon">💡</span>
            <div><p>${escapeHtml(domain.needsMoreDataTh)}</p></div>
          </div>` : ''}

        <div class="domain-sections">
          ${domain.sections.map(s => `
            <article class="domain-section">
              <h3>${escapeHtml(s.headingTh)}</h3>
              <p>${withGlossary(s.bodyTh)}</p>
              <div class="source-badge">${escapeHtml(s.sourceTh)}</div>
            </article>`).join('')}
        </div>

        <div class="action-grid">
          <div class="action-box is-do">
            <h4>✅ สิ่งที่ควรทำ</h4>
            <ul>${domain.doThisTh.map(x => `<li>${withGlossary(x)}</li>`).join('')}</ul>
          </div>
          <div class="action-box is-avoid">
            <h4>⛔ สิ่งที่ควรเลี่ยง</h4>
            <ul>${domain.avoidThisTh.map(x => `<li>${withGlossary(x)}</li>`).join('')}</ul>
          </div>
        </div>

        ${domain.disclaimerTh ? `<p class="domain-disclaimer">${escapeHtml(domain.disclaimerTh)}</p>` : ''}

        <div class="ai-block">
          <div class="ai-block-head">
            <div>
              <strong>อยากรู้ลึกกว่านี้เรื่อง${escapeHtml(domain.titleTh)}?</strong>
              <p>ให้ AI อ่านผลคำนวณข้างบนแล้วอธิบายเจาะลึกเป็นภาษาคนให้คุณโดยเฉพาะ</p>
            </div>
            <button type="button" class="btn btn-primary ai-expand-btn" data-domain="${domain.id}">
              <span>ให้ AI อธิบายเพิ่ม</span>
            </button>
          </div>
          <div class="ai-answer" data-answer="${domain.id}" hidden></div>
          <div class="ai-followup" data-followup="${domain.id}" hidden>
            <input type="text" class="ai-followup-input" placeholder="ถามต่อได้เลย เช่น ปีนี้ควรย้ายงานไหม" />
            <button type="button" class="btn btn-secondary ai-followup-btn" data-domain="${domain.id}"><span>ถาม</span></button>
          </div>
        </div>
      </section>`;
    }

  static bindEvents(container, result, profile) {
    // สลับแท็บด้านของชีวิต
    container.querySelectorAll('.domain-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.domain;
        container.querySelectorAll('.domain-nav-btn').forEach(b => {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        container.querySelectorAll('.domain-panel').forEach(p => {
          p.classList.toggle('is-active', p.dataset.panel === id);
        });
        SoundManager.play('tab-switch');
      });
    });

    // เปิดปิดกล่องที่มาของคะแนน
    container.querySelectorAll('.score-why-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = container.querySelector('[data-score-panel="' + btn.dataset.scoreWhy + '"]');
        if (!panel) return;
        panel.hidden = !panel.hidden;
        btn.textContent = panel.hidden ? 'ดูที่มา' : 'ซ่อน';
        SoundManager.play('ui-select');
      });
    });

    // คำแปลศัพท์
    const popover = container.querySelector('#glossary-popover');
    container.addEventListener('click', event => {
      const chip = event.target.closest('.glossary-chip');
      if (!chip) {
        popover.hidden = true;
        return;
      }
      event.preventDefault();
      const entry = GLOSSARY[chip.dataset.term];
      if (!entry) return;
      SoundManager.play('ui-select');
      popover.innerHTML = `
        <button type="button" class="glossary-close" aria-label="ปิด">✕</button>
        <div class="glossary-term">${escapeHtml(entry.termTh)}</div>
        ${entry.aliasTh ? `<div class="glossary-alias">อีกชื่อ: ${escapeHtml(entry.aliasTh)}</div>` : ''}
        <dl>
          <dt>คืออะไร</dt><dd>${escapeHtml(entry.whatTh)}</dd>
          <dt>บอกเรื่องอะไร</dt><dd>${escapeHtml(entry.domainTh)}</dd>
          <dt>คำนวณจากอะไร</dt><dd>${escapeHtml(entry.howTh)}</dd>
          <dt>ตัวอย่าง</dt><dd>${escapeHtml(entry.exampleTh)}</dd>
        </dl>`;
      popover.hidden = false;
      const rect = chip.getBoundingClientRect();
      popover.style.top = `${window.scrollY + rect.bottom + 8}px`;
      popover.style.left = `${Math.max(12, Math.min(window.innerWidth - 340, rect.left))}px`;
      popover.querySelector('.glossary-close').addEventListener('click', () => { popover.hidden = true; });
    });

    // ให้ AI อธิบายเพิ่ม
    container.querySelectorAll('.ai-expand-btn').forEach(btn => {
      btn.addEventListener('click', () => this.askAI(container, result, profile, btn.dataset.domain, null, btn));
    });
    container.querySelectorAll('.ai-followup-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.domain;
        const input = container.querySelector(`[data-followup="${id}"] .ai-followup-input`);
        const q = input.value.trim();
        if (!q) return;
        input.value = '';
        this.askAI(container, result, profile, id, q, btn);
      });
    });
    container.querySelectorAll('.ai-followup-input').forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.closest('.ai-followup').querySelector('.ai-followup-btn').click();
        }
      });
    });
  }

  /** สร้างบริบทให้ AI จากผลคำนวณจริง เพื่อไม่ให้ AI มั่วตัวเลขเอง */
  static buildContext(result, profile, domainId) {
    const { meta, domains } = result;
    const d = domains[domainId];
    const lines = [
      `ชื่อที่ใช้เรียก: ${profile.nickname || 'ผู้รับคำอ่าน'}`,
      `วันเกิด: ${meta.taksa.weekdayNameTh} ${profile.birthDate}` + (meta.hasTime ? ` เวลา ${profile.birthTime}` : ' (ไม่ทราบเวลาเกิด)'),
      `อายุประมาณ: ${meta.age} ปี`,
      `ราศีเกิดสากล: ${meta.thai.westernSunSign.nameTh} / ราศีแบบไทย: ${meta.thai.thaiSunSignNameTh}`,
      `ปีนักษัตร: ${meta.zodiac.nameTh} (${meta.zodiac.animalTh})`,
      `ธาตุประจำตัวดวงจีน: ${meta.bazi.dayMasterElement.nameTh} (${meta.bazi.dayMaster.nameTh}) — ${meta.bazi.strength.labelTh}`,
      `ธาตุที่ควรเสริม: ${meta.bazi.favourableElementsTh.join(', ')}`,
      `ธาตุเจ้าเรือนแพทย์แผนไทย: ${meta.thai.bodyElement.nameTh}`,
      `เลขเส้นทางชีวิต: ${meta.numerology.lifePath} (${meta.numerology.meaningTh.title})`,
      `รอบโชคชะตา 10 ปีปัจจุบัน: ${meta.currentLuck.nameTh} อายุ ${meta.currentLuck.ageFrom}-${meta.currentLuck.ageTo} — ${meta.currentLuck.verdictTh}`,
      `สถานะปีชง: ${meta.chong.isChong ? meta.chong.matched[0].labelTh : 'ไม่ชง'}`,
      `สีมงคล: เดช=${meta.taksa.byId.dech.colorName}, ศรี=${meta.taksa.byId.si.colorName}, มูละ=${meta.taksa.byId.mula.colorName}, กาลกิณี(เลี่ยง)=${meta.taksa.byId.kalakini.colorName}`,
      '',
      `หัวข้อที่ผู้ใช้กำลังอ่าน: ${d.titleTh} (${d.subtitleTh})`,
      'สรุปผลคำนวณของหัวข้อนี้ที่ระบบสร้างไว้แล้ว:',
      ...d.sections.map(s => `- ${s.headingTh}: ${s.bodyTh}`)
    ];
    if (!meta.hasTime) {
      lines.push('', 'ข้อจำกัด: ผู้ใช้ไม่ทราบเวลาเกิด จึงไม่มีลัคนาและภพ 12 ห้ามเดาลัคนาหรือภพให้เด็ดขาด');
    }
    return lines.join('\n');
  }

  static async askAI(container, result, profile, domainId, question, btn) {
    const answerBox = container.querySelector(`[data-answer="${domainId}"]`);
    const followup = container.querySelector(`[data-followup="${domainId}"]`);
    const domain = result.domains[domainId];

    btn.disabled = true;
    const originalLabel = btn.querySelector('span').textContent;
    btn.querySelector('span').textContent = 'กำลังคิด…';
    answerBox.hidden = false;
    answerBox.innerHTML = `<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> กำลังอ่านผลดวงของคุณและเรียบเรียงคำตอบ…</div>`;
    SoundManager.play('ui-select');

    const prompt = question
      ? question
      : `ช่วยอธิบายเรื่อง "${domain.titleTh}" ของฉันให้ละเอียดขึ้น โดยอิงจากผลคำนวณที่ให้มาเท่านั้น `
        + `อธิบายเป็นภาษาที่คนทั่วไปเข้าใจ ยกตัวอย่างสถานการณ์จริงในชีวิตประจำวันประกอบ `
        + `และสรุปเป็นข้อ ๆ ว่าควรทำอะไรบ้างในช่วง 1 ปีข้างหน้า`;

    const response = await OracleAIService.sendChat(
      [{ role: 'user', content: prompt }],
      {
        purpose: `reading:${domainId}`,
        context: this.buildContext(result, profile, domainId),
        onRetry: (attempt) => {
          answerBox.innerHTML = `<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> สายยังไม่นิ่ง กำลังลองอีกครั้ง (ครั้งที่ ${attempt + 1})…</div>`;
        }
      }
    );

    btn.disabled = false;
    btn.querySelector('span').textContent = originalLabel;

    if (!response.success) {
      answerBox.innerHTML = `
        <div class="ai-error">
          <strong>ยังเรียก AI ไม่สำเร็จ</strong>
          <p>${escapeHtml(response.message)}</p>
          <p class="ai-error-hint">ลองกดปุ่มอีกครั้งใน 1-2 นาที ระบบจะต่อสายใหม่ให้เอง
          ส่วนผลดวงที่คำนวณไว้ด้านบนดูได้ตามปกติโดยไม่ต้องใช้ AI</p>
        </div>`;
      SoundManager.play('error-alert');
      return;
    }

    const html = this.formatAnswer(response.answer);
    answerBox.innerHTML = `
      <div class="ai-answer-body">
        <div class="ai-answer-tag">✦ คำอธิบายเพิ่มเติมจาก AI (อ้างอิงผลคำนวณของคุณ)</div>
        ${html}
      </div>`;
    followup.hidden = false;
    SoundManager.play('reading-complete');

    Storage.addReadingToHistory({
      type: 'AI Reading',
      domain: domain.titleTh,
      question: question || 'ขออธิบายเพิ่ม'
    });
  }

  /** แปลง markdown อย่างง่ายจาก AI ให้เป็น HTML ที่ปลอดภัย */
  static formatAnswer(text) {
    const lines = String(text || '').split('\n');
    let html = '';
    let inList = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        if (inList) { html += '</ul>'; inList = false; }
        continue;
      }
      const bulletMatch = line.match(/^[-*•]\s+(.*)$/) || line.match(/^\d+[.)]\s+(.*)$/);
      if (bulletMatch) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += `<li>${inlineFormat(bulletMatch[1])}</li>`;
        continue;
      }
      if (inList) { html += '</ul>'; inList = false; }

      const headingMatch = line.match(/^#{1,4}\s+(.*)$/);
      if (headingMatch) {
        html += `<h4>${inlineFormat(headingMatch[1])}</h4>`;
        continue;
      }
      // บรรทัดที่เป็นหัวข้อตัวหนาล้วน เช่น **ความหมาย:**
      const boldOnly = line.match(/^\*\*(.+?)\*\*:?$/);
      if (boldOnly) {
        html += `<h4>${escapeHtml(boldOnly[1])}</h4>`;
        continue;
      }
      html += `<p>${inlineFormat(line)}</p>`;
    }
    if (inList) html += '</ul>';
    return html || `<p>${escapeHtml(text)}</p>`;
  }
}

function inlineFormat(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}
