/**
 * AETHRA ORACLE — หน้าคู่มือธาตุ
 * อธิบายว่าแต่ละธาตุมีนิสัยยังไง และธาตุไหนขัดกับธาตุไหน
 * รวมทั้งสามระบบที่เว็บนี้ใช้ เพื่อไม่ให้ผู้ใช้สับสนว่าทำไมตัวเองมีหลายธาตุ
 */

import { Storage } from '../core/storage.js';
import { SoundManager } from '../core/sound.js';
import {
  ELEMENT_GENERATES, ELEMENT_CONTROLS, ELEMENT_GENERATED_BY, ELEMENT_CONTROLLED_BY
} from '../engines/bazi.js';
import { LifeDomainsEngine } from '../engines/life-domains.js';
import {
  CHINESE_ELEMENTS, THAI_ELEMENTS_GUIDE, WESTERN_ELEMENTS_GUIDE,
  RELATION_LABELS, CLASH_DETAIL, ELEMENTS_DISCLAIMER_TH
} from '../data/elements-guide.js';

const CN_ORDER = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];

function esc(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** หาความสัมพันธ์ระหว่างธาตุจีนสองธาตุ */
export function relationBetween(a, b) {
  if (a === b) return RELATION_LABELS.same;
  if (ELEMENT_GENERATES[a] === b) return RELATION_LABELS.generates;
  if (ELEMENT_GENERATED_BY[a] === b) return RELATION_LABELS.generatedBy;
  if (ELEMENT_CONTROLS[a] === b) return RELATION_LABELS.controls;
  if (ELEMENT_CONTROLLED_BY[a] === b) return RELATION_LABELS.controlledBy;
  return RELATION_LABELS.same;
}

export class ElementsView {
  static render(container) {
    const profile = Storage.getProfile();
    let mine = null;
    if (profile.birthDate) {
      const result = LifeDomainsEngine.analyze(profile);
      if (result.available) {
        mine = {
          chinese: result.meta.bazi.dayMaster.element,
          thai: result.meta.thai.bodyElement.id,
          western: result.meta.thai.westernSunSign.element
        };
      }
    }

    container.innerHTML = `
      <div class="reading-wrapper">
        ${this.renderIntro(mine)}
        ${this.renderChineseCards(mine)}
        ${this.renderCycles()}
        ${this.renderClashTable(mine)}
        ${this.renderClashDetail()}
        ${this.renderThaiCards(mine)}
        ${this.renderWesternCards(mine)}
        <p class="domain-disclaimer" style="font-size:12px;">${esc(ELEMENTS_DISCLAIMER_TH)}</p>
      </div>`;

    container.querySelectorAll('.element-card-head').forEach(head => {
      head.addEventListener('click', () => {
        const card = head.closest('.element-card');
        card.classList.toggle('is-open');
        SoundManager.play('ui-select');
      });
    });
  }

  static renderIntro(mine) {
    return `
      <section class="identity-card">
        <div class="identity-head">
          <div>
            <div class="identity-eyebrow">📖 คู่มือธาตุ</div>
            <h1 class="identity-name">ธาตุแต่ละธาตุ นิสัยเป็นยังไง ขัดกับใครบ้าง</h1>
            <p class="identity-sub">เว็บนี้ใช้ธาตุอยู่ 3 ระบบที่คนละที่มา คุณจึงมีได้หลายธาตุพร้อมกัน
            และไม่ได้แปลว่าคำนวณผิด หน้านี้อธิบายทั้งสามระบบและบอกว่าธาตุไหนหนุนกัน ธาตุไหนขัดกัน</p>
          </div>
        </div>
        ${mine ? `
        <div class="identity-grid">
          <div class="identity-fact">
            <div class="identity-fact-label">ธาตุประจำตัวคุณ (ดวงจีน)</div>
            <div class="identity-fact-value">${esc(CHINESE_ELEMENTS[mine.chinese].nameTh)}</div>
            <div class="identity-fact-hint">ดูจากวันเกิด ใช้อ่านนิสัยและการงานการเงิน</div>
          </div>
          <div class="identity-fact">
            <div class="identity-fact-label">ธาตุเจ้าเรือนคุณ (แพทย์แผนไทย)</div>
            <div class="identity-fact-value">${esc(THAI_ELEMENTS_GUIDE[mine.thai].nameTh)}</div>
            <div class="identity-fact-hint">ดูจากเดือนเกิด ใช้อ่านสุขภาพและอาหาร</div>
          </div>
          <div class="identity-fact">
            <div class="identity-fact-label">ธาตุราศีคุณ (สากล)</div>
            <div class="identity-fact-value">${esc(WESTERN_ELEMENTS_GUIDE[mine.western].nameTh)}</div>
            <div class="identity-fact-hint">ดูจากราศีเกิด ใช้อ่านนิสัยการเข้าสังคม</div>
          </div>
        </div>
        <p class="identity-note">ทั้งสามค่านี้ถูกต้องพร้อมกันได้ เพราะมาจากคนละตำราและใช้ตอบคนละคำถาม</p>`
        : `<p class="identity-sub">กรอกวันเกิดที่<a href="#profile" class="notice-link">หน้าโปรไฟล์</a>แล้วระบบจะไฮไลต์ธาตุของคุณให้ในตารางด้านล่าง</p>`}
      </section>`;
  }

  static renderChineseCards(mine) {
    return `
      <section class="color-strip">
        <div class="color-strip-head">
          <h2>ธาตุจีน 5 ธาตุ — ดูจากวันเกิด</h2>
          <p>ใช้ในดวงจีนโป๊ยหยี่ เป็นธาตุที่บอกนิสัยหลักและแนวทางการงานการเงิน กดที่การ์ดเพื่อดูรายละเอียด</p>
        </div>
        <div class="element-card-grid">
          ${CN_ORDER.map(id => {
            const el = CHINESE_ELEMENTS[id];
            const isMine = mine && mine.chinese === id;
            return `
            <div class="element-card${isMine ? ' is-mine' : ''}" style="--el-color:${el.color}">
              <button type="button" class="element-card-head">
                <span class="element-emoji">${el.emoji}</span>
                <span class="element-title">
                  <b>${esc(el.nameTh)} <span class="element-hanzi">${el.hanzi}</span></b>
                  <small>${esc(el.coreTh)}</small>
                </span>
                ${isMine ? '<span class="element-mine-tag">ธาตุคุณ</span>' : ''}
                <span class="element-toggle">▾</span>
              </button>
              <div class="element-card-body">
                <p class="element-image">เปรียบเหมือน ${esc(el.imageTh)}</p>
                <h4>นิสัยที่มักเป็น</h4>
                <ul>${el.traitsTh.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
                <div class="element-two">
                  <div class="element-good"><b>จุดแข็ง</b><p>${esc(el.strengthTh)}</p></div>
                  <div class="element-bad"><b>จุดที่ต้องระวัง</b><p>${esc(el.weaknessTh)}</p></div>
                </div>
                <dl class="element-meta">
                  <dt>อาชีพที่เหมาะ</dt><dd>${esc(el.careerTh)}</dd>
                  <dt>สีประจำธาตุ</dt><dd>${esc(el.colorTh)}</dd>
                  <dt>ทิศ</dt><dd>${esc(el.directionTh)}</dd>
                  <dt>ฤดู</dt><dd>${esc(el.seasonTh)}</dd>
                  <dt>อวัยวะที่สัมพันธ์</dt><dd>${esc(el.organTh)}</dd>
                </dl>
                <p class="element-advice">💡 ${esc(el.adviceTh)}</p>
              </div>
            </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  static renderCycles() {
    const gen = CN_ORDER.map(id => CHINESE_ELEMENTS[id].nameTh.replace('ธาตุ', ''));
    return `
      <section class="color-strip">
        <div class="color-strip-head">
          <h2>วงจรธาตุ — ใครหนุนใคร ใครข่มใคร</h2>
          <p>ธาตุทั้งห้าเรียงกันเป็นวงกลม มีสองวงจรซ้อนกันอยู่</p>
        </div>

        <div class="cycle-box is-generate">
          <h3>✅ วงจรก่อเกิด — หนุนกัน</h3>
          <p class="cycle-flow">${gen.map((n, i) => `<span>${n}</span>${i < gen.length - 1 ? '<em>→</em>' : '<em>↻</em>'}`).join('')}</p>
          <ul class="cycle-list">
            <li><b>ไม้ → ไฟ</b> ไม้เป็นเชื้อเพลิงให้ไฟลุก</li>
            <li><b>ไฟ → ดิน</b> ไฟเผาไหม้กลายเป็นเถ้าถ่านบำรุงดิน</li>
            <li><b>ดิน → ทอง</b> แร่ทองเกิดและถูกขุดขึ้นมาจากดิน</li>
            <li><b>ทอง → น้ำ</b> โลหะเย็นทำให้ไอน้ำกลั่นตัวเป็นหยดน้ำ</li>
            <li><b>น้ำ → ไม้</b> น้ำรดต้นไม้ให้เติบโต</li>
          </ul>
          <p class="cycle-note">ถ้าคุณกับอีกฝ่ายอยู่ในวงจรนี้ แปลว่าคนหนึ่งช่วยผลักดันอีกคนโดยธรรมชาติ อยู่ด้วยแล้วสบายใจ</p>
        </div>

        <div class="cycle-box is-control">
          <h3>⚔️ วงจรข่ม — ขัดกัน</h3>
          <p class="cycle-flow"><span>ไม้</span><em>⚔</em><span>ดิน</span><em>⚔</em><span>น้ำ</span><em>⚔</em><span>ไฟ</span><em>⚔</em><span>ทอง</span><em>↻</em></p>
          <ul class="cycle-list">
            <li><b>ไม้ ⚔ ดิน</b> รากไม้ชอนไชทำให้ดินแตก</li>
            <li><b>ดิน ⚔ น้ำ</b> ดินกั้นทางน้ำไม่ให้ไหล</li>
            <li><b>น้ำ ⚔ ไฟ</b> น้ำดับไฟ</li>
            <li><b>ไฟ ⚔ ทอง</b> ไฟหลอมโลหะให้ละลาย</li>
            <li><b>ทอง ⚔ ไม้</b> ขวานโลหะตัดต้นไม้</li>
          </ul>
          <p class="cycle-note">ขัดกันไม่ได้แปลว่าอยู่ด้วยกันไม่ได้ แต่แปลว่าต้องคุยกันให้ชัดและมีคนยอมถอยบ้าง
          หลายคู่ที่ธาตุข่มกันกลับไปได้ดีมาก เพราะต่างเติมสิ่งที่อีกฝ่ายขาด</p>
        </div>
      </section>`;
  }

  static renderClashTable(mine) {
    return `
      <section class="color-strip">
        <div class="color-strip-head">
          <h2>ตารางเทียบธาตุ — คุณเข้ากับธาตุไหน</h2>
          <p>อ่านจากซ้ายไปขวา แถวคือธาตุของคุณ คอลัมน์คือธาตุของอีกฝ่าย${mine ? ' — แถวธาตุคุณถูกไฮไลต์ไว้แล้ว' : ''}</p>
        </div>
        <div class="element-table-scroll">
          <table class="element-table">
            <thead>
              <tr>
                <th>ธาตุคุณ \\ อีกฝ่าย</th>
                ${CN_ORDER.map(id => `<th>${CHINESE_ELEMENTS[id].emoji}<br>${esc(CHINESE_ELEMENTS[id].nameTh.replace('ธาตุ', ''))}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${CN_ORDER.map(rowId => {
                const isMineRow = mine && mine.chinese === rowId;
                return `
                <tr class="${isMineRow ? 'is-mine-row' : ''}">
                  <th>${CHINESE_ELEMENTS[rowId].emoji} ${esc(CHINESE_ELEMENTS[rowId].nameTh)}</th>
                  ${CN_ORDER.map(colId => {
                    const rel = relationBetween(rowId, colId);
                    return `<td class="rel-${rel.tone}" title="${esc(rel.explainTh)}">
                      <span class="rel-sym">${rel.symbol}</span>
                      <span class="rel-name">${esc(rel.shortTh)}</span>
                    </td>`;
                  }).join('')}
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <div class="element-legend">
          <span class="rel-good">หนุนกัน — อยู่ด้วยแล้วเติบโต</span>
          <span class="rel-neutral">เหมือนกัน — เข้าใจง่ายแต่จุดอ่อนเหมือนกัน</span>
          <span class="rel-clash">ขัดกัน — ต้องคุยกันให้ชัด</span>
        </div>
      </section>`;
  }

  static renderClashDetail() {
    return `
      <section class="color-strip">
        <div class="color-strip-head">
          <h2>คู่ที่ขัดกัน — ขัดกันเรื่องอะไร แก้ยังไง</h2>
          <p>ห้าคู่นี้คือคู่ที่ตำราบอกว่าธาตุข่มกัน แต่ละคู่มีเรื่องที่มักทะเลาะกันต่างกัน</p>
        </div>
        <div class="domain-sections">
          ${Object.entries(CLASH_DETAIL).map(([key, d]) => {
            const [a, b] = key.split('-');
            return `
            <article class="domain-section">
              <h3>⚔️ ${esc(CHINESE_ELEMENTS[a].nameTh)} กับ ${esc(CHINESE_ELEMENTS[b].nameTh)} — ${esc(d.imageTh)}</h3>
              <p><b>ต่างกันตรงไหน:</b> ${esc(d.meaningTh)}</p>
              <p style="margin-top:8px;"><b>มักทะเลาะกันเรื่อง:</b> ${esc(d.frictionTh)}</p>
              <p style="margin-top:8px;color:#68D391;"><b>วิธีอยู่ด้วยกันให้รอด:</b> ${esc(d.fixTh)}</p>
              <div class="source-badge">มาจาก: วงจรข่มของธาตุทั้งห้าตามตำราจีน</div>
            </article>`;
          }).join('')}
        </div>
      </section>`;
  }

  static renderThaiCards(mine) {
    return `
      <section class="color-strip">
        <div class="color-strip-head">
          <h2>ธาตุเจ้าเรือนไทย 4 ธาตุ — ดูจากเดือนเกิด</h2>
          <p>มาจากตำราแพทย์แผนไทย ใช้ดูลักษณะร่างกาย โรคที่ควรระวัง และอาหารที่เหมาะ
          คนละระบบกับธาตุจีน จึงอาจได้ธาตุไม่ตรงกันเป็นเรื่องปกติ</p>
        </div>
        <div class="element-card-grid">
          ${Object.values(THAI_ELEMENTS_GUIDE).map(el => {
            const isMine = mine && mine.thai === el.id;
            return `
            <div class="element-card${isMine ? ' is-mine' : ''}" style="--el-color:${el.color}">
              <button type="button" class="element-card-head">
                <span class="element-emoji">${el.emoji}</span>
                <span class="element-title">
                  <b>${esc(el.nameTh)}</b>
                  <small>${esc(el.monthsTh)}</small>
                </span>
                ${isMine ? '<span class="element-mine-tag">ธาตุคุณ</span>' : ''}
                <span class="element-toggle">▾</span>
              </button>
              <div class="element-card-body">
                <p class="element-image">${esc(el.natureTh)}</p>
                <dl class="element-meta">
                  <dt>ลักษณะร่างกาย</dt><dd>${esc(el.bodyTh)}</dd>
                  <dt>นิสัย</dt><dd>${esc(el.personalityTh)}</dd>
                  <dt>โรคที่ควรระวัง</dt><dd>${esc(el.riskTh)}</dd>
                  <dt>อาหารที่เหมาะ</dt><dd>${esc(el.foodTh)}</dd>
                </dl>
                <p class="element-advice">💡 ${esc(el.balanceTh)}</p>
              </div>
            </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  static renderWesternCards(mine) {
    return `
      <section class="color-strip">
        <div class="color-strip-head">
          <h2>ธาตุราศีสากล 4 ธาตุ — ดูจากราศีเกิด</h2>
          <p>ใช้ในโหราศาสตร์สากล บอกนิสัยการเข้าสังคมและวิธีที่คุณรับมือกับโลก</p>
        </div>
        <div class="element-card-grid">
          ${Object.values(WESTERN_ELEMENTS_GUIDE).map(el => {
            const isMine = mine && mine.western === el.id;
            return `
            <div class="element-card${isMine ? ' is-mine' : ''}" style="--el-color:${el.color}">
              <button type="button" class="element-card-head">
                <span class="element-emoji">${el.emoji}</span>
                <span class="element-title">
                  <b>${esc(el.nameTh)}</b>
                  <small>${esc(el.signsTh)}</small>
                </span>
                ${isMine ? '<span class="element-mine-tag">ธาตุคุณ</span>' : ''}
                <span class="element-toggle">▾</span>
              </button>
              <div class="element-card-body">
                <p class="element-image">${esc(el.traitTh)}</p>
                <div class="element-two">
                  <div class="element-good"><b>จุดแข็ง</b><p>${esc(el.goodTh)}</p></div>
                  <div class="element-bad"><b>จุดที่ต้องระวัง</b><p>${esc(el.watchTh)}</p></div>
                </div>
                <p class="element-advice">💞 ${esc(el.matchTh)}</p>
              </div>
            </div>`;
          }).join('')}
        </div>
      </section>`;
  }
}
