/**
 * AETHRA ORACLE — หน้าชื่อและดวงปีนี้
 * รวมสองเรื่องที่คนไทยถามบ่อยที่สุดไว้หน้าเดียว
 * คือชื่อของเราถูกโฉลกไหม และปีนี้ดวงเป็นยังไง
 */
import { Storage } from '../core/storage.js';
import { SoundManager } from '../core/sound.js';
import { parseThaiBirthDate } from '../core/thai-date-input.js';
import { ThaiNameEngine } from '../engines/thai-name.js';
import { YearlyPersonalEngine } from '../engines/yearly-personal.js';
import { OracleAIService } from '../services/oracle-ai.js';
import { currentDateContext } from '../services/question-router.js';
import { ReadingView } from './reading-view.js';

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const LEVEL_CLASS = {
  great: 'lv-great', good: 'lv-good', neutral: 'lv-neutral',
  watch: 'lv-watch', careful: 'lv-careful'
};

export class YearView {
  static render(container) {
    const profile = Storage.getProfile();
    const beYear = new Date().getFullYear() + 543;

    container.innerHTML = `
      <div class="reading-wrapper">
        <section class="hero-panel">
          <div class="hero-panel-eyebrow">📛 ชื่อและดวงปี ${beYear}</div>
          <h1 class="hero-panel-title">ชื่อคุณถูกโฉลกไหม<br>แล้วปีนี้ดวงเป็นยังไง</h1>
          <p class="hero-panel-sub">กรอกชื่อจริงกับวันเกิด ระบบจะดูสองอย่าง
          คือชื่อนี้มีอักษรที่ไม่ถูกโฉลกกับวันเกิดคุณไหม ตามตำราทักษาปกรณ์
          และปีนี้ดวงคุณเป็นยังไง โดยดูสี่ชั้น ไม่ใช่ดูแค่ว่าชงหรือไม่ชง</p>

          <form id="year-form" class="stack-form">
            <div class="field-row">
              <div class="field">
                <label class="form-label" for="yv-name">ชื่อจริงภาษาไทย</label>
                <input type="text" id="yv-name" class="form-control"
                  placeholder="เช่น สมชาย" value="${esc(profile.fullName || profile.name || '')}" />
                <p class="form-hint">ใส่แค่ชื่อจริงก็พอ ไม่ต้องใส่นามสกุล</p>
              </div>
              <div class="field">
                <label class="form-label" for="yv-date">วันเดือนปีเกิด</label>
                <input type="text" id="yv-date" class="form-control" placeholder="เช่น 27/06/2541"
                  value="${profile.birthDate
                    ? esc(profile.birthDate.slice(8, 10) + '/' + profile.birthDate.slice(5, 7)
                      + '/' + (Number(profile.birthDate.slice(0, 4)) + 543))
                    : ''}" />
                <p class="form-hint">พิมพ์ได้เลย ใส่ พ.ศ. หรือ ค.ศ. ก็ได้</p>
              </div>
            </div>
            <div id="yv-date-echo" class="date-echo" hidden></div>
            <button type="submit" class="btn btn-primary btn-block">
              <span>🔍 ดูชื่อและดวงปีนี้</span>
            </button>
          </form>
        </section>

        <div id="yv-result"></div>
      </div>
    `;

    this.bindEvents(container);
  }

  static bindEvents(container) {
    const dateInput = container.querySelector('#yv-date');
    const echo = container.querySelector('#yv-date-echo');

    const refreshEcho = () => {
      const raw = dateInput.value.trim();
      if (!raw) { echo.hidden = true; return; }
      const r = parseThaiBirthDate(raw);
      echo.hidden = false;
      echo.className = r.ok ? 'date-echo is-ok' : 'date-echo is-bad';
      echo.textContent = r.ok ? '✅ ระบบอ่านได้ว่า ' + r.displayTh : '⚠️ ' + r.errorTh;
    };
    dateInput.addEventListener('input', refreshEcho);
    refreshEcho();

    container.querySelector('#year-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const box = container.querySelector('#yv-result');
      const name = container.querySelector('#yv-name').value.trim();
      const parsed = parseThaiBirthDate(dateInput.value);

      if (!parsed.ok) {
        echo.hidden = false;
        echo.className = 'date-echo is-bad';
        echo.textContent = '⚠️ ' + parsed.errorTh;
        dateInput.focus();
        return;
      }

      const nameResult = ThaiNameEngine.analyze(name, parsed.isoDate);
      const yearResult = YearlyPersonalEngine.analyze({ birthDate: parsed.isoDate });

      SoundManager.play('reading-complete');
      box.innerHTML = this.renderResult(nameResult, yearResult);
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.bindResultEvents(box, nameResult, yearResult, name);
    });
  }

  static renderResult(nameResult, yearResult) {
    return `
      ${this.renderYear(yearResult)}
      ${this.renderName(nameResult)}

      <section class="panel">
        <div class="ai-ask-block">
          <label class="form-label" for="yv-ai-q">อยากถามหมอดูเพิ่ม</label>
          <div class="ai-ask-row">
            <input type="text" id="yv-ai-q" class="form-control"
              placeholder="เช่น ปีนี้ควรเปลี่ยนงานไหม หรือชื่อนี้เหมาะกับงานที่ทำอยู่หรือเปล่า" />
            <button class="btn btn-primary" id="yv-ai-btn"><span>ถาม</span></button>
          </div>
          <div id="yv-ai-answer" class="ai-answer" hidden></div>
        </div>
      </section>
    `;
  }

  static renderYear(y) {
    if (!y.available) {
      return `<section class="panel"><div class="notice-card is-warning" style="text-align:left;">
        <span class="notice-icon">📅</span><div><p>${esc(y.reasonTh)}</p></div></div></section>`;
    }

    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-eyebrow">📅 ดวงปี พ.ศ. ${y.beYear}</div>
            <h2 class="panel-title">${esc(y.levelTh)}</h2>
            <p class="panel-sub">ปีนี้เป็นปี${esc(y.yearAnimalTh)} ธาตุ${esc(y.yearElementTh)}
            ${y.isChong ? ' และคุณเข้าข่าย' + esc(y.chongLabelTh) : ' และคุณไม่ชง'}</p>
          </div>
          <div class="level-pill ${LEVEL_CLASS[y.level] || 'lv-neutral'}">${esc(y.levelTh.split(' ')[0])}</div>
        </div>

        <div class="layer-grid">
          ${y.layers.map((l, i) => `
            <article class="layer-card">
              <div class="layer-num">ชั้นที่ ${i + 1}</div>
              <h3>${esc(l.titleTh)}</h3>
              <div class="layer-value">${esc(l.valueTh)}</div>
              <p>${esc(l.detailTh)}</p>
              <div class="source-badge">มาจาก: ${esc(l.sourceTh)}</div>
            </article>`).join('')}
        </div>

        <div class="domain-strip">
          <div class="domain-strip-item">
            <span class="ds-icon">💼</span>
            <div><b>การงานปีนี้</b><p>${esc(y.workTh)}</p></div>
          </div>
          <div class="domain-strip-item">
            <span class="ds-icon">💰</span>
            <div><b>การเงินปีนี้</b><p>${esc(y.moneyTh)}</p></div>
          </div>
          <div class="domain-strip-item">
            <span class="ds-icon">💗</span>
            <div><b>ความรักปีนี้</b><p>${esc(y.loveTh)}</p></div>
          </div>
        </div>

        <div class="source-badge">${esc(y.methodNoteTh)}</div>
      </section>
    `;
  }

  static renderName(n) {
    if (!n.available) {
      return `<section class="panel"><div class="notice-card is-info" style="text-align:left;">
        <span class="notice-icon">📛</span><div><p>${esc(n.reasonTh)}</p></div></div></section>`;
    }

    return `
      <section class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-eyebrow">📛 ชื่อของคุณตามตำราทักษา</div>
            <h2 class="panel-title">${esc(n.verdictTh)}</h2>
            <p class="panel-sub">${esc(n.verdictDetailTh)}</p>
          </div>
          <div class="level-pill ${LEVEL_CLASS[n.level] || 'lv-neutral'}">
            ${n.kalakiniLetters.length ? 'มี ' + n.kalakiniLetters.length + ' ตัว' : 'ไม่มี'}
          </div>
        </div>

        <div class="letter-row">
          ${n.breakdown.map(b => `
            <span class="letter-chip${b.isKalakini ? ' is-bad' : ''}"
              title="${esc(b.letter)} อยู่${esc(b.varkaTh)}${b.positionTh ? ' ตกตำแหน่ง' + esc(b.positionTh) : ''}">
              <b>${esc(b.letter)}</b>
              <small>${esc(b.positionTh || b.planetTh)}</small>
            </span>`).join('')}
        </div>

        ${n.supports.length ? `
        <div class="support-grid">
          ${n.supports.map(sp => `
            <div class="support-chip">
              <b>${esc(sp.labelTh)} × ${sp.count}</b>
              <small>${esc(sp.supportTh)}</small>
            </div>`).join('')}
        </div>` : ''}

        <article class="layer-card" style="margin-top: var(--space-3);">
          <h3>อักษรที่ไม่ถูกโฉลกกับคนเกิด${esc(n.birthDayTh)}</h3>
          <p>คุณเกิด${esc(n.birthDayTh)} ดาว${esc(n.kalakiniPlanetTh)}จึงตกตำแหน่งกาลกิณีของคุณ
          อักษรกลุ่มนี้คือกลุ่มที่ตำราแนะนำให้เลี่ยงตอนตั้งชื่อ</p>
          <div class="letter-row" style="margin-top:8px;">
            ${n.kalakiniAllLetters.slice(0, 24).map(l => `<span class="letter-chip is-bad"><b>${esc(l)}</b></span>`).join('')}
          </div>
          <div class="source-badge">มาจาก: ${esc(n.sourceTh)}</div>
        </article>

        <div class="source-badge">${esc(n.methodNoteTh)}</div>
      </section>
    `;
  }

  static bindResultEvents(box, nameResult, yearResult, rawName) {
    box.querySelector('#yv-ai-btn')?.addEventListener('click', async () => {
      const btn = box.querySelector('#yv-ai-btn');
      const answer = box.querySelector('#yv-ai-answer');
      const q = box.querySelector('#yv-ai-q').value.trim() || 'ปีนี้ควรโฟกัสเรื่องอะไรเป็นพิเศษ';

      btn.disabled = true;
      btn.querySelector('span').textContent = 'กำลังดู…';
      answer.hidden = false;
      answer.innerHTML = '<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> กำลังเปิดตำราดูดวงปีนี้…</div>';

      const NL = String.fromCharCode(10);
      const context = [
        currentDateContext().blockTh,
        '',
        '[ผลคำนวณของระบบ ห้ามตอบสวนทางกับข้อมูลชุดนี้ และห้ามอ้างอะไรที่ไม่มีในนี้]',
        yearResult.available ? 'ดวงปี พ.ศ. ' + yearResult.beYear + ': ' + yearResult.levelTh : '',
        ...(yearResult.available
          ? yearResult.layers.map(l => l.titleTh + ': ' + l.valueTh + ' — ' + l.detailTh)
          : []),
        yearResult.available ? 'การงานปีนี้: ' + yearResult.workTh : '',
        yearResult.available ? 'การเงินปีนี้: ' + yearResult.moneyTh : '',
        yearResult.available ? 'ความรักปีนี้: ' + yearResult.loveTh : '',
        '',
        nameResult.available
          ? 'ชื่อตามตำราทักษา: ' + nameResult.verdictTh + ' — ' + nameResult.verdictDetailTh
            + ' อักษรกาลกิณีในชื่อ: '
            + (nameResult.kalakiniLetters.length ? nameResult.kalakiniLetters.join(' ') : 'ไม่มี')
            + ' อักษรที่หนุน: ' + nameResult.supports.map(s => s.labelTh).join(' ')
          : 'ยังวิเคราะห์ชื่อไม่ได้ ห้ามเดาเรื่องชื่อ',
        '',
        '[สิ่งที่ระบบไม่รู้ ห้ามพูดเหมือนรู้ ให้ใช้คำว่าถ้า]',
        'ไม่รู้ว่าตอนนี้โสดหรือมีคู่',
        'ไม่รู้ว่าทำงานอะไร มีหนี้ไหม มีลูกไหม',
        '',
        '[กติกาการตอบ]',
        'ตอบภาษาไทยล้วน ห้ามมีคำภาษาอังกฤษหรือภาษาจีนแม้แต่ตัวเดียว',
        'พูดแบบคนคุยกัน เป็นกันเอง ไม่ต้องทางการ ไม่ต้องขึ้นต้นว่าสวัสดีครับท่านผู้ถาม',
        'เรื่องความรัก ต้องแยกให้ครบสองทางเสมอ ว่าถ้ายังโสดทำแบบไหน ถ้ามีคู่แล้วเป็นยังไง',
        'ห้ามฟันธงเวลาว่าอีกกี่เดือนจะเกิดอะไร ห้ามวินิจฉัยโรค ห้ามชี้นำการพนัน',
        'ห้ามบอกให้เปลี่ยนชื่อ บอกได้แค่ว่าตามตำราแล้วชื่อนี้มีจุดไหน',
        'คำแนะนำต้องทำได้จริง บอกให้ชัดว่าทำอะไร ตอนไหน',
        'ขึ้นบรรทัดใหม่ทุกครั้งที่เปลี่ยนเรื่อง',
        '',
        'สิ่งที่ผู้ใช้ถาม: ' + q
      ].filter(Boolean).join(NL);

      const res = await OracleAIService.sendChat(
        [{ role: 'user', content: q + ' — ตอบโดยอ้างผลคำนวณที่ให้มาเท่านั้น' }],
        {
          purpose: 'year:reading',
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
        <div class="ai-answer-tag">✦ คำอธิบายจากหมอดู</div>
        ${ReadingView.formatAnswer(res.answer)}
      </div>`;
      SoundManager.play('reading-complete');
    });
  }
}
