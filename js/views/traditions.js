/**
 * AETHRA ORACLE — Traditions View
 * แปลเป็นภาษาไทยทั้งหมด อ่านง่าย สบายตา เข้าใจง่ายสำหรับทุกคน
 */

import { Storage } from '../core/storage.js';
import { I18n } from '../core/i18n.js';
import { AstrologyEngine } from '../engines/astrology.js';
import { BaZiEngine } from '../engines/bazi.js';
import { NumerologyEngine } from '../engines/numerology.js';

const ELEMENT_TH = {
  fire: 'ธาตุไฟ (กระตือรือร้น มีพลัง มุ่งมั่น)',
  water: 'ธาตุน้ำ (จิตใจอ่อนโยน ปรับตัวเก่ง ลึกซึ้ง)',
  earth: 'ธาตุดิน (มั่นคง หนักแน่น รอบคอบ ไว้วางใจได้)',
  air: 'ธาตุลม (เฉลียวฉลาด เจรจาเก่ง ช่างสังเกต)'
};

const BAZI_ELEMENT_TH = {
  Wood: 'ธาตุไม้ (การเติบโต คุณธรรม ความเมตตา)',
  Fire: 'ธาตุไฟ (ความอบอุ่น ความสดใส ชื่อเสียง)',
  Earth: 'ธาตุดิน (ความมั่นคง ความซื่อสัตย์ การโอบอุ้ม)',
  Metal: 'ธาตุทอง (ความเด็ดขาด ระเบียบวินัย ความยุติธรรม)',
  Water: 'ธาตุน้ำ (สติปัญญา ความยืดหยุ่น การค้าขาย)'
};

export class TraditionsView {
  static render(container) {
    const profile = Storage.getProfile();

    if (!profile.birthDate) {
      container.innerHTML = `
        <div class="traditions-view-wrapper">
          <h2 style="font-size: var(--font-size-3xl); margin-bottom: var(--space-2);">ศาสตร์พยากรณ์ประจำตัวคุณ</h2>
          <div class="editorial-card">
            <h3 style="margin-bottom: var(--space-3); color: var(--color-gold-bright);">ยังไม่ได้ระบุข้อมูลวันเดือนปีเกิด</h3>
            <p style="color: var(--color-text-secondary);">กรุณากรอกข้อมูลวันเดือนปีเกิดที่หน้าโปรไฟล์ เพื่อให้ระบบคำนวณผังดวงดาวได้อย่างแม่นยำ</p>
          </div>
        </div>`;
      return;
    }

    const astro = AstrologyEngine.calculateChart(profile.birthDate, profile.birthTime, profile.lat, profile.lon);
    const bazi = BaZiEngine.calculatePillars(profile.birthDate, profile.birthTime);
    const num = NumerologyEngine.analyze(profile.name, profile.birthDate);

    container.innerHTML = `
      <div class="traditions-view-wrapper">
        <div class="hero-badge" style="margin-bottom: var(--space-2);">
          <span>✦</span> <span>ผังชะตาส่วนบุคคล</span> <span>✦</span>
        </div>
        <h1 style="font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: var(--space-2);">ศาสตร์พยากรณ์ดวงชะตาของคุณ</h1>
        <p style="color: var(--color-text-secondary); font-size: var(--font-size-base); margin-bottom: var(--space-8);">
          วิเคราะห์เจาะลึกทั้งโหราศาสตร์สากล ดวงจีนโป๊ยหยี่ และรหัสตัวเลขศาสตร์ เพื่อให้คุณเข้าใจตนเองอย่างแท้จริง
        </p>

        <!-- 1. โหราศาสตร์สากล (Western Tropical) -->
        <div class="editorial-card theme-western" style="margin-bottom: var(--space-8);">
          <div class="editorial-card-header">
            <span class="tradition-tag">โหราศาสตร์สากล (ผังดวงดาวกำเนิด)</span>
            <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">ตำแหน่งดาว ณ เวลาเกิด</span>
          </div>
          <h3 style="font-size: var(--font-size-xl); margin-bottom: var(--space-4);">ผังดาวและ 12 จักรราศีประจำตัว</h3>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-4);">
            <!-- Sun Sign -->
            <div style="background: rgba(12, 13, 16, 0.5); padding: var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-gold-bright); font-weight: 600;">☉ ราศีเกิด (ตัวตนและพลังชีวิต)</div>
              <div style="font-size: var(--font-size-xl); font-weight: 600; color: var(--color-gold-bright); margin: 4px 0;">
                ราศี${astro.western.sun.nameTh} (${astro.western.sun.nameEn})
              </div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
                ${ELEMENT_TH[astro.western.sun.element] || astro.western.sun.element} · องศาดาว ${astro.western.sun.degreeInSign}°
              </div>
            </div>

            <!-- Moon Sign -->
            <div style="background: rgba(12, 13, 16, 0.5); padding: var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-gold-bright); font-weight: 600;">☽ ราศีของจิตใจ (อารมณ์ความรู้สึก)</div>
              <div style="font-size: var(--font-size-xl); font-weight: 600; color: var(--color-gold-bright); margin: 4px 0;">
                ราศี${astro.western.moon.nameTh} (${astro.western.moon.nameEn})
              </div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
                ${ELEMENT_TH[astro.western.moon.element] || astro.western.moon.element} · องศาดาว ${astro.western.moon.degreeInSign}°
              </div>
            </div>

            <!-- Ascendant -->
            <div style="background: rgba(12, 13, 16, 0.5); padding: var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-gold-bright); font-weight: 600;">↑ ลัคนาเกิด (บุคลิกที่คนอื่นมองเห็น)</div>
              <div style="font-size: var(--font-size-xl); font-weight: 600; color: var(--color-gold-bright); margin: 4px 0;">
                ${astro.western.ascendant ? `ราศี${astro.western.ascendant.nameTh} (${astro.western.ascendant.nameEn})` : 'ไม่ทราบเวลาตกฟาก'}
              </div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">
                ${astro.western.ascendant
                  ? `${ELEMENT_TH[astro.western.ascendant.element] || astro.western.ascendant.element} · องศา ${astro.western.ascendant.degreeInSign}°`
                  : 'หากทราบเวลาเกิดที่แน่นอน จะสามารถคำนวณองศาลัคนาได้แม่นยำยิ่งขึ้น'}
              </div>
            </div>
          </div>
        </div>

        <!-- 2. ดวงจีนโป๊ยหยี่ 4 แถว (BaZi) -->
        <div class="editorial-card theme-bazi" style="margin-bottom: var(--space-8);">
          <div class="editorial-card-header">
            <span class="tradition-tag" style="color: var(--color-bazi-accent); border-color: rgba(176, 42, 55, 0.4);">
              ดวงจีนโบราณ (โป๊ยหยี่ 4 แถว)
            </span>
            <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">สมดุลธาตุทั้ง 5 (ดิน ทอง น้ำ ไม้ ไฟ)</span>
          </div>
          <h3 style="font-size: var(--font-size-xl); margin-bottom: var(--space-4);">เสาชะตากิ่งฟ้า-ก้านดิน ทั้ง 4 เสา</h3>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); text-align: center; margin-bottom: var(--space-6);">
            <!-- เสาเวลาเกิด -->
            <div style="background: rgba(12, 13, 16, 0.5); padding: var(--space-3); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-text-muted);">เสาเวลาเกิด</div>
              <div style="font-size: 10px; color: var(--color-text-muted); margin-bottom: 2px;">(ลูกหลาน/บั้นปลาย)</div>
              ${bazi.pillars.hour
                ? `<div style="font-size: var(--font-size-base); font-weight: 700; color: ${bazi.pillars.hour.stem.color};">${bazi.pillars.hour.stem.nameTh} (${bazi.pillars.hour.stem.pinyin})</div>
                   <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">ปี${bazi.pillars.hour.branch.animalTh}</div>`
                : `<div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">ไม่ทราบเวลาเกิด</div>`}
            </div>

            <!-- เสาวันเกิด (Day Master) เด่นสุด -->
            <div style="background: rgba(12, 13, 16, 0.6); padding: var(--space-3); border-radius: var(--radius-sm); border: 2px solid var(--color-gold-bright); box-shadow: 0 0 12px rgba(212, 175, 55, 0.2);">
              <div style="font-size: 11px; color: var(--color-gold-bright); font-weight: 700;">เสาวันเกิด (ธาตุประจำตัว)</div>
              <div style="font-size: 10px; color: var(--color-gold-light); margin-bottom: 2px;">(จิตวิญญาณและตัวตนคุณ)</div>
              <div style="font-size: var(--font-size-lg); font-weight: 700; color: ${bazi.pillars.day.stem.color};">${bazi.pillars.day.stem.nameTh} (${bazi.pillars.day.stem.pinyin})</div>
              <div style="font-size: var(--font-size-xs); color: var(--color-gold-light);">ปี${bazi.pillars.day.branch.animalTh}</div>
            </div>

            <!-- เสาเดือนเกิด -->
            <div style="background: rgba(12, 13, 16, 0.5); padding: var(--space-3); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-text-muted);">เสาเดือนเกิด</div>
              <div style="font-size: 10px; color: var(--color-text-muted); margin-bottom: 2px;">(การงาน/พ่อแม่พี่น้อง)</div>
              <div style="font-size: var(--font-size-base); font-weight: 700; color: ${bazi.pillars.month.stem.color};">${bazi.pillars.month.stem.nameTh} (${bazi.pillars.month.stem.pinyin})</div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">ปี${bazi.pillars.month.branch.animalTh}</div>
            </div>

            <!-- เสาปีเกิด -->
            <div style="background: rgba(12, 13, 16, 0.5); padding: var(--space-3); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-text-muted);">เสาปีเกิด</div>
              <div style="font-size: 10px; color: var(--color-text-muted); margin-bottom: 2px;">(ราศีปีนักษัตร/บรรพบุรุษ)</div>
              <div style="font-size: var(--font-size-base); font-weight: 700; color: ${bazi.pillars.year.stem.color};">${bazi.pillars.year.stem.nameTh} (${bazi.pillars.year.stem.pinyin})</div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">ปี${bazi.pillars.year.branch.animalTh}</div>
            </div>
          </div>

          <div style="background: rgba(12, 13, 16, 0.4); padding: var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle);">
            <div style="font-size: var(--font-size-sm); color: var(--color-text-primary); margin-bottom: var(--space-2);">
              🔥 <strong>ธาตุที่เด่นที่สุดในดวงคุณ:</strong> <span style="color: var(--color-gold-bright); font-size: var(--font-size-base); font-weight: 700;">${BAZI_ELEMENT_TH[bazi.dominantElement] || bazi.dominantElement}</span>
            </div>
            <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); line-height: 1.6;">
              สรุปจำนวนพลังธาตุในดวง: 
              ธาตุไม้: <strong>${bazi.fiveElements.Wood}</strong> · 
              ธาตุไฟ: <strong>${bazi.fiveElements.Fire}</strong> · 
              ธาตุดิน: <strong>${bazi.fiveElements.Earth}</strong> · 
              ธาตุทอง: <strong>${bazi.fiveElements.Metal}</strong> · 
              ธาตุน้ำ: <strong>${bazi.fiveElements.Water}</strong>
            </div>
          </div>
        </div>

        <!-- 3. รหัสตัวเลขศาสตร์สากล (Numerology) -->
        <div class="editorial-card theme-numerology" style="margin-bottom: var(--space-8);">
          <div class="editorial-card-header">
            <span class="tradition-tag">รหัสตัวเลขศาสตร์มงคล (Numerology)</span>
            <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">ถอดรหัสจากวันเกิดและชื่อของคุณ</span>
          </div>
          <h3 style="font-size: var(--font-size-xl); margin-bottom: var(--space-4);">พลังงานตัวเลขนำทางชีวิต</h3>

          <!-- Life path meaning highlight box -->
          <div style="background: rgba(12, 13, 16, 0.6); border-left: 4px solid var(--color-gold-bright); padding: var(--space-4) var(--space-5); border-radius: var(--radius-sm); margin-bottom: var(--space-6);">
            <div style="font-size: 11px; color: var(--color-gold-bright); font-weight: 600; margin-bottom: 2px;">
              🌟 ความหมายของเลขเส้นทางชีวิต หมายเลข ${num.lifePath} (Life Path):
            </div>
            <div style="font-size: var(--font-size-lg); font-weight: 700; color: var(--color-gold-light); margin-bottom: 4px;">
              "${num.meaningTh.title}"
            </div>
            <p style="font-size: var(--font-size-sm); color: var(--color-text-primary); line-height: 1.6;">
              ${num.meaningTh.desc}
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-4);">
            <!-- เลขเส้นทางชีวิต -->
            <div style="background: rgba(12, 13, 16, 0.5); padding: var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle); text-align: center;">
              <div style="font-size: 11px; color: var(--color-text-muted);">เลขเส้นทางชีวิต (ชะตาหลัก)</div>
              <div style="font-family: var(--font-serif); font-size: var(--font-size-4xl); color: var(--color-gold-bright); margin: 4px 0;">${num.lifePath}</div>
              <div style="font-size: 10px; color: var(--color-text-secondary);">คำนวณจากวันเดือนปีเกิด</div>
            </div>

            <!-- เลขศักยภาพความสามารถ -->
            <div style="background: rgba(12, 13, 16, 0.5); padding: var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle); text-align: center;">
              <div style="font-size: 11px; color: var(--color-text-muted);">เลขศักยภาพความสามารถ</div>
              <div style="font-family: var(--font-serif); font-size: var(--font-size-4xl); color: var(--color-gold-bright); margin: 4px 0;">${num.expression}</div>
              <div style="font-size: 10px; color: var(--color-text-secondary);">คำนวณจากชื่อเต็มของคุณ</div>
            </div>

            <!-- เลขความปรารถนาในใจ -->
            <div style="background: rgba(12, 13, 16, 0.5); padding: var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle); text-align: center;">
              <div style="font-size: 11px; color: var(--color-text-muted);">เลขความปรารถนาในใจ</div>
              <div style="font-family: var(--font-serif); font-size: var(--font-size-4xl); color: var(--color-gold-bright); margin: 4px 0;">${num.soulUrge}</div>
              <div style="font-size: 10px; color: var(--color-text-secondary);">คำนวณจากเสียงสระในชื่อ</div>
            </div>

            <!-- เลขจังหวะชีวิตปีนี้ -->
            <div style="background: rgba(12, 13, 16, 0.5); padding: var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle); text-align: center;">
              <div style="font-size: 11px; color: var(--color-text-muted);">เลขจังหวะชีวิตปีนี้ (Personal Year)</div>
              <div style="font-family: var(--font-serif); font-size: var(--font-size-4xl); color: var(--color-gold-bright); margin: 4px 0;">${num.personalYear}</div>
              <div style="font-size: 10px; color: var(--color-text-secondary);">จังหวะชีวิตประจำปี ${new Date().getFullYear()}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
