/**
 * AETHRA ORACLE — ดูดวงคนอื่น
 * กรอกชื่อจริง เบอร์โทร และวันเดือนปีเกิดของอีกคน
 * แล้วอ่านดวงเขาได้ครบทุกด้าน โดยอิงปีปัจจุบันเสมอ
 */

import { Storage } from '../core/storage.js';
import { parseThaiBirthDate, parseThaiBirthTime } from '../core/thai-date-input.js';
import { SoundManager } from '../core/sound.js';
import { LifeDomainsEngine } from '../engines/life-domains.js';
import { TaksaEngine } from '../engines/thai-taksa.js';
import { PhoneNumerologyEngine } from '../engines/phone-numerology.js';
import { CompatibilityEngine } from '../engines/compatibility.js';
import { PLANET_NUMBERS } from '../engines/life-domains.js';
import { MAJOR_CITIES, resolveBirthPlace } from '../core/storage.js';
import { currentDateContext } from '../services/question-router.js';
import { OracleAIService } from '../services/oracle-ai.js';
import { ReadingView } from './reading-view.js';

const DOMAIN_ORDER = ['career', 'money', 'love', 'health', 'luck'];
const DOMAIN_ICONS = { career: '💼', money: '💰', love: '💗', health: '🌿', luck: '🍀' };

function esc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export class OtherView {
  static render(container) {
    const today = currentDateContext();

    container.innerHTML = `
      <div class="reading-wrapper">
        <section class="identity-card">
          <div class="identity-head">
            <div>
              <div class="identity-eyebrow">👥 ดูดวงคนอื่น</div>
              <h1 class="identity-name">อยากรู้ดวงของใคร กรอกข้อมูลเขาได้เลย</h1>
              <p class="identity-sub">ใส่ชื่อจริง เบอร์โทร และวันเดือนปีเกิด
              ระบบจะอ่านให้ครบทั้งการงาน การเงิน ความรัก สุขภาพ และโชคลาภ
              โดยคำนวณอิงปีปัจจุบัน (พ.ศ. ${today.beYear}) เสมอ</p>
            </div>
          </div>

          <form id="other-form" class="match-form">
            <div class="match-form-grid">
              <div class="match-person">
                <h3>ข้อมูลพื้นฐาน</h3>
                <label class="form-label" for="oth-name">ชื่อจริง–นามสกุล</label>
                <input type="text" id="oth-name" class="form-control" placeholder="เช่น สมชาย ใจดี" required />

                <label class="form-label" for="oth-nick">ชื่อเล่น (ถ้ามี)</label>
                <input type="text" id="oth-nick" class="form-control" placeholder="เช่น ชาย" />

                <label class="form-label" for="oth-gender">เพศ / พลังประจำตัว</label>
                <select id="oth-gender" class="form-control">
                  <option value="yang">ชาย (พลังหยาง)</option>
                  <option value="yin">หญิง (พลังหยิน)</option>
                  <option value="unspecified" selected>ไม่ระบุ</option>
                </select>
              </div>

              <div class="match-person">
                <h3>ข้อมูลเกิดและเบอร์</h3>
                <label class="form-label" for="oth-date">วันเดือนปีเกิด</label>
                <input type="text" id="oth-date" class="form-control" placeholder="เช่น 27/06/2541" required />
                <p class="form-hint">พิมพ์ได้เลย ใส่ พ.ศ. หรือ ค.ศ. ก็ได้</p>
                <div id="oth-date-warn" class="date-echo" hidden></div>

                <label class="form-label" for="oth-time">เวลาเกิด (ถ้าทราบ)</label>
                <input type="text" id="oth-time" class="form-control" placeholder="เช่น 09:30 หรือ สองทุ่ม" />
                <p class="form-hint">ถ้าไม่ทราบให้เว้นว่าง ระบบจะไม่เดาลัคนาให้</p>

                <label class="form-label" for="oth-phone">เบอร์โทรศัพท์ (ถ้ามี)</label>
                <input type="tel" id="oth-phone" class="form-control" inputmode="numeric" placeholder="เช่น 081-234-5678" />

                <label class="form-label" for="oth-city">สถานที่เกิด (ถ้าทราบ)</label>
                <input type="text" id="oth-city" class="form-control" list="oth-city-list"
                  placeholder="เช่น กรุงเทพ, เชียงใหม่, โคราช" autocomplete="off" />
                <datalist id="oth-city-list">
                  ${MAJOR_CITIES.map(c => `<option value="${esc(c.name)}"></option>`).join('')}
                </datalist>
              </div>
            </div>

            <button type="submit" class="btn btn-primary match-submit">
              <span>🔮 ดูดวงคนนี้</span>
            </button>
          </form>

          <div class="notice-card is-info" style="margin-top: var(--space-4);">
            <span class="notice-icon">🔒</span>
            <div>
              <p>ข้อมูลที่กรอกใช้คำนวณในเครื่องของคุณเท่านั้น ไม่ถูกบันทึกและไม่ถูกส่งไปไหน
              ยกเว้นตอนกดถามหมอดู AI ซึ่งจะส่งเฉพาะผลคำนวณ ไม่ส่งชื่อจริงหรือเบอร์
              และควรขออนุญาตเจ้าตัวก่อนนำข้อมูลของเขามาดูด้วยนะครับ</p>
            </div>
          </div>
        </section>

        <div id="other-result"></div>
      </div>`;

    this.bindEvents(container);
  }

  static bindEvents(container) {
    const form = container.querySelector('#other-form');
    const box = container.querySelector('#other-result');

    form.addEventListener('submit', event => {
      event.preventDefault();

      const name = container.querySelector('#oth-name').value.trim();
      const nickname = container.querySelector('#oth-nick').value.trim() || name.split(' ')[0];
      const gender = container.querySelector('#oth-gender').value;
      // ผู้ใช้พิมพ์วันเกิดเอง ต้องแปลงเป็นรูปแบบมาตรฐานก่อนคำนวณ
      const parsedDate = parseThaiBirthDate(container.querySelector('#oth-date').value);
      const warn = container.querySelector('#oth-date-warn');
      if (!parsedDate.ok) {
        if (warn) {
          warn.hidden = false;
          warn.className = 'date-echo is-bad';
          warn.textContent = '⚠️ ' + parsedDate.errorTh;
        }
        return;
      }
      if (warn) warn.hidden = true;
      const birthDate = parsedDate.isoDate;

      const rawTime = container.querySelector('#oth-time').value.trim();
      const parsedTime = rawTime ? parseThaiBirthTime(rawTime) : null;
      const birthTime = parsedTime && parsedTime.ok ? parsedTime.time : null;
      const phone = container.querySelector('#oth-phone').value.trim();
      const place = resolveBirthPlace(container.querySelector('#oth-city').value);

      if (!name || !birthDate) return;

      const target = {
        name, nickname, gender, birthDate, birthTime,
        lat: place.lat, lon: place.lon, timezone: place.timezone
      };

      const reading = LifeDomainsEngine.analyze(target);
      if (!reading.available) {
        box.innerHTML = `<div class="notice-card is-warn"><span class="notice-icon">⚠️</span>
          <div><strong>ดูให้ไม่ได้</strong><p>${esc(reading.reasonTh)}</p></div></div>`;
        return;
      }

      SoundManager.play('reading-complete');
      const taksa = TaksaEngine.calculate(birthDate, birthTime);
      const nameAudit = TaksaEngine.auditName(name, taksa);
      const phoneResult = phone ? PhoneNumerologyEngine.analyze(phone) : null;
      const phoneMatch = phoneResult?.available
        ? PhoneNumerologyEngine.matchWithOwner(taksa, phoneResult, PLANET_NUMBERS)
        : null;

      // เทียบกับเจ้าของเว็บถ้ามีวันเกิดของตัวเอง
      const me = Storage.getProfile();
      const compat = me.birthDate
        ? CompatibilityEngine.compare(
            { birthDate: me.birthDate, birthTime: me.birthTime, nickname: me.nickname || 'คุณ' },
            { birthDate, birthTime, nickname }
          )
        : null;

      box.innerHTML = this.renderResult({ target, reading, taksa, nameAudit, phoneResult, phoneMatch, compat });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.bindResultEvents(box, { target, reading, phoneResult, compat });
    });
  }

  static renderResult({ target, reading, taksa, nameAudit, phoneResult, phoneMatch, compat }) {
    const meta = reading.meta;
    const today = currentDateContext();

    return `
      <section class="identity-card">
        <div class="identity-head">
          <div>
            <div class="identity-eyebrow">ผลดูดวงของ</div>
            <h1 class="identity-name">${esc(target.nickname || target.name)}</h1>
            <p class="identity-sub">คำนวณ ณ ${esc(today.thaiDateTh)} — ทุกคำทำนายเรื่องจังหวะเวลาอิงปี พ.ศ. ${today.beYear}</p>
          </div>
        </div>

        <div class="identity-grid">
          <div class="identity-fact">
            <div class="identity-fact-label">วันเกิด</div>
            <div class="identity-fact-value">${esc(taksa.weekdayNameTh)}</div>
            <div class="identity-fact-hint">${esc(target.birthDate)} · อายุประมาณ ${meta.age} ปี</div>
          </div>
          <div class="identity-fact">
            <div class="identity-fact-label">ปีนักษัตร</div>
            <div class="identity-fact-value">ปี${esc(meta.zodiac.nameTh)}</div>
            <div class="identity-fact-hint">${esc(meta.zodiac.animalTh)}</div>
          </div>
          <div class="identity-fact">
            <div class="identity-fact-label">ราศีเกิด (สากล)</div>
            <div class="identity-fact-value">ราศี${esc(meta.thai.westernSunSign.nameTh)}</div>
            <div class="identity-fact-hint">ราศีที่คนทั่วไปถามกัน</div>
          </div>
          <div class="identity-fact">
            <div class="identity-fact-label">ธาตุประจำตัว</div>
            <div class="identity-fact-value">ธาตุ${esc(meta.bazi.dayMasterElement.nameTh)}</div>
            <div class="identity-fact-hint">${esc(meta.bazi.strength.labelTh)}</div>
          </div>
          <div class="identity-fact${meta.chong.isChong ? ' is-warn' : ''}">
            <div class="identity-fact-label">สถานะปีชง พ.ศ. ${meta.chong.buddhistYear}</div>
            <div class="identity-fact-value">${meta.chong.isChong ? 'ปีนี้ชง' : 'ปีนี้ไม่ชง'}</div>
            <div class="identity-fact-hint">${esc(meta.chong.isChong ? meta.chong.matched[0].labelTh : 'เดินได้ตามปกติ')}</div>
          </div>
          <div class="identity-fact">
            <div class="identity-fact-label">เลขเส้นทางชีวิต</div>
            <div class="identity-fact-value">เลข ${meta.numerology.lifePath}</div>
            <div class="identity-fact-hint">${esc(meta.numerology.meaningTh.title)}</div>
          </div>
        </div>
      </section>

      ${compat ? `
      <section class="identity-card">
        <div class="identity-head"><div>
          <div class="identity-eyebrow">💞 เทียบกับดวงคุณ</div>
          <h2 class="identity-name" style="font-size:clamp(1.1rem,3vw,1.5rem);">${esc(compat.headlineTh)}</h2>
        </div></div>
        <div class="domain-sections">
          <article class="domain-section">
            <h3>ความสัมพันธ์ของปีนักษัตร: ${esc(compat.branchRelation.labelTh)}</h3>
            <p>${esc(compat.branchRelation.plainTh)}</p>
            <div class="source-badge">มาจาก: กฎสามฮะ ลิ่วฮะ ชง ไห่ ตามตำราจีน</div>
          </article>
          <article class="domain-section">
            <h3>ความเข้ากันของธาตุ: ${esc(compat.elementRelation.labelTh)}</h3>
            <p>${esc(compat.elementRelation.plainTh)}</p>
            <div class="source-badge">มาจาก: ธาตุประจำตัวของทั้งสองคน</div>
          </article>
        </div>
      </section>` : ''}

      <div class="domain-nav" role="tablist">
        ${DOMAIN_ORDER.map((id, i) => `
          <button type="button" class="domain-nav-btn${i === 0 ? ' is-active' : ''}"
            role="tab" data-oth-domain="${id}">
            <span class="domain-nav-icon">${DOMAIN_ICONS[id]}</span>
            <span class="domain-nav-label">${esc(reading.domains[id].titleTh)}</span>
            <span class="domain-nav-score">${reading.domains[id].score}</span>
          </button>`).join('')}
      </div>

      <div id="oth-panels">
        ${DOMAIN_ORDER.map((id, i) => {
          const d = reading.domains[id];
          return `
          <section class="domain-panel${i === 0 ? ' is-active' : ''}" data-oth-panel="${id}">
            <header class="domain-header">
              <div>
                <div class="domain-eyebrow">${DOMAIN_ICONS[id]} เรื่อง${esc(d.titleTh)}</div>
                <h2 class="domain-title">${esc(d.subtitleTh)}</h2>
                <p class="domain-headline">${esc(d.headlineTh)}</p>
              </div>
              <div class="domain-score"><div class="domain-score-num">${d.score}</div></div>
            </header>
            <div class="domain-sections">
              ${d.sections.map(s => `
                <article class="domain-section">
                  <h3>${esc(s.headingTh)}</h3>
                  <p>${esc(s.bodyTh)}</p>
                  <div class="source-badge">${esc(s.sourceTh)}</div>
                </article>`).join('')}
            </div>
            <div class="action-grid">
              <div class="action-box is-do"><h4>✅ สิ่งที่ควรทำ</h4>
                <ul>${d.doThisTh.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
              <div class="action-box is-avoid"><h4>⛔ สิ่งที่ควรเลี่ยง</h4>
                <ul>${d.avoidThisTh.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
            </div>
          </section>`;
        }).join('')}
      </div>

      <section class="identity-card">
        <div class="identity-head"><div>
          <div class="identity-eyebrow">📝 ชื่อและเบอร์</div>
          <h2 class="identity-name" style="font-size:clamp(1.1rem,3vw,1.5rem);">ตรวจชื่อและเบอร์ตามตำราไทย</h2>
        </div></div>
        <div class="domain-sections">
          <article class="domain-section">
            <h3>ตรวจชื่อตามอักษรทักษา</h3>
            <p>${esc(nameAudit.verdictTh)}</p>
            <p style="margin-top:8px;">${esc(nameAudit.adviceTh)}</p>
            <div class="source-badge">มาจาก: อักษรวรรคกาลกิณีตามวันเกิด ในตำราทักษาปกรณ์</div>
          </article>
          ${phoneResult?.available ? `
          <article class="domain-section">
            <h3>ตรวจเบอร์ ${esc(phoneResult.formatted)} — ${esc(phoneResult.gradeTh)}</h3>
            <p>${esc(phoneResult.summaryTh)}</p>
            <div class="pair-grid" style="margin-top:var(--space-3);">
              ${phoneResult.pairs.map(p => {
                const toneClass = p.mainstream.tone === 'ดี' ? 'tone-great'
                  : p.mainstream.tone === 'เสีย' ? 'tone-bad' : 'tone-neutral';
                return `
                <div class="pair-chip ${toneClass}${p.isLast ? ' is-last' : ''}">
                  <span class="pair-num">${esc(p.text)}</span>
                  <span class="pair-info"><b>${p.mainstream.tone === 'ดี' ? '✅' : p.mainstream.tone === 'เสีย' ? '⚠️' : '⚪'} ${esc(p.mainstream.tone)}</b><small>${esc(p.mainstream.m)}</small></span>
                </div>`;
              }).join('')}
            </div>
            ${phoneMatch ? `<p style="margin-top:var(--space-3);">${esc(phoneMatch.verdictTh)}</p>` : ''}
            <div class="source-badge">มาจาก: ผลรวมเบอร์และคู่เลขตามตำราเลขศาสตร์ไทย</div>
          </article>` : `
          <article class="domain-section">
            <h3>ยังไม่ได้กรอกเบอร์โทร</h3>
            <p>ถ้ากรอกเบอร์เข้ามาด้วย ระบบจะวิเคราะห์ผลรวมและคู่เลขให้ครบ พร้อมบอกว่าถูกโฉลกกับวันเกิดเขาไหม</p>
          </article>`}
        </div>

        <div class="ai-block">
          <div class="ai-block-head">
            <div>
              <strong>อยากถามเจาะจงเรื่องคนนี้?</strong>
              <p>เช่น เขาเหมาะกับงานแบบไหน ปีนี้ดวงเขาเป็นยังไง เขากับเราเข้ากันไหม</p>
            </div>
          </div>
          <div class="ai-followup" style="display:flex;">
            <input type="text" id="oth-ai-q" class="ai-followup-input" placeholder="เช่น ปีนี้เขาควรเปลี่ยนงานไหม" />
            <button type="button" class="btn btn-primary" id="oth-ai-btn"><span>ถาม</span></button>
          </div>
          <div class="ai-answer" id="oth-ai-answer" hidden></div>
        </div>
      </section>`;
  }

  static bindResultEvents(box, { target, reading, phoneResult, compat }) {
    box.querySelectorAll('[data-oth-domain]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.othDomain;
        box.querySelectorAll('[data-oth-domain]').forEach(b => b.classList.toggle('is-active', b === btn));
        box.querySelectorAll('[data-oth-panel]').forEach(p => p.classList.toggle('is-active', p.dataset.othPanel === id));
        SoundManager.play('tab-switch');
      });
    });

    box.querySelector('#oth-ai-btn')?.addEventListener('click', async () => {
      const btn = box.querySelector('#oth-ai-btn');
      const answer = box.querySelector('#oth-ai-answer');
      const q = box.querySelector('#oth-ai-q').value.trim() || 'ภาพรวมดวงของคนนี้ปีนี้เป็นยังไง';
      const meta = reading.meta;

      btn.disabled = true;
      btn.querySelector('span').textContent = 'กำลังดู…';
      answer.hidden = false;
      answer.innerHTML = '<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> กำลังเปิดผังดวงของเขา…</div>';

      // ส่งเฉพาะผลคำนวณ ไม่ส่งชื่อจริงหรือเบอร์
      const context = [
        'นี่คือผลคำนวณดวงของบุคคลที่ผู้ใช้อยากรู้ (ไม่ระบุชื่อจริงเพื่อความเป็นส่วนตัว)',
        'เรียกเขาว่า: ' + (target.nickname || 'บุคคลนี้'),
        'เกิด' + meta.taksa.weekdayNameTh + ' อายุประมาณ ' + meta.age + ' ปี',
        'ปีนักษัตร: ปี' + meta.zodiac.nameTh + ' — ' + meta.zodiac.profile.strengthTh,
        'จุดที่ต้องระวัง: ' + meta.zodiac.profile.cautionTh,
        'ราศีเกิดสากล: ' + meta.thai.westernSunSign.nameTh,
        'ธาตุประจำตัว: ธาตุ' + meta.bazi.dayMasterElement.nameTh + ' (' + meta.bazi.strength.labelTh + ')',
        'ธาตุเจ้าเรือน: ' + meta.thai.bodyElement.nameTh,
        'เลขเส้นทางชีวิต: ' + meta.numerology.lifePath + ' (' + meta.numerology.meaningTh.title + ')',
        'เลขจังหวะชีวิตปีนี้: ' + meta.numerology.personalYear,
        'รอบโชคชะตา 10 ปี: ' + meta.currentLuck.nameTh + ' อายุ ' + meta.currentLuck.ageFrom + '-' + meta.currentLuck.ageTo + ' — ' + meta.currentLuck.verdictTh,
        'สถานะปีชงปีนี้: ' + (meta.chong.isChong ? meta.chong.matched[0].labelTh : 'ไม่ชง'),
        'คะแนนรายด้าน: งาน ' + reading.domains.career.score + ' เงิน ' + reading.domains.money.score
          + ' รัก ' + reading.domains.love.score + ' สุขภาพ ' + reading.domains.health.score
          + ' โชค ' + reading.domains.luck.score,
        phoneResult?.available
          ? 'เบอร์โทรสรุปตามตารางเบอร์มงคล: ' + phoneResult.gradeTh + ' (ผลรวม ' + phoneResult.sum + ' — ' + phoneResult.sumInfo.titleTh + ')'
          : 'ไม่ทราบเบอร์โทร',
        compat ? 'เทียบกับผู้ถาม: ' + compat.branchRelation.labelTh + ' และธาตุ ' + compat.elementRelation.labelTh : '',
        '',
        'คำถามของผู้ใช้: ' + q,
        'ตอบเฉพาะคำถามนี้ อ้างข้อมูลข้างบนเท่านั้น ห้ามเดาสิ่งที่ไม่มีในข้อมูล'
      ].filter(Boolean).join(String.fromCharCode(10));

      const res = await OracleAIService.sendChat([{ role: 'user', content: q }], {
        purpose: 'other-person:reading',
        context,
        onRetry: (n) => {
          answer.innerHTML = `<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> สายยังไม่นิ่ง กำลังลองอีกครั้ง (ครั้งที่ ${n + 1})…</div>`;
        }
      });

      btn.disabled = false;
      btn.querySelector('span').textContent = 'ถาม';
      if (!res.success) {
        answer.innerHTML = `<div class="ai-error"><strong>ยังตอบไม่สำเร็จ</strong><p>${esc(res.message)}</p></div>`;
        return;
      }
      answer.innerHTML = `<div class="ai-answer-body">
        <div class="ai-answer-tag">✦ คำอ่านดวงของ${esc(target.nickname || 'คนนี้')}</div>
        ${ReadingView.formatAnswer(res.answer)}
      </div>`;
      SoundManager.play('reading-complete');
    });
  }
}
