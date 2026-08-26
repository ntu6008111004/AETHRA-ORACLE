/**
 * AETHRA ORACLE — Dashboard View
 * ออกแบบภาษาไทยให้อ่านง่าย สบายตา เข้าใจง่ายที่สุดสำหรับทุกคน
 */

import { Storage } from '../core/storage.js';
import { I18n } from '../core/i18n.js';
import { AstrologyEngine } from '../engines/astrology.js';
import { DailyGuidanceEngine } from '../engines/daily-guidance.js';
import { elementWithMeaningTh } from '../core/element-names.js';

export class DashboardView {
  static render(container) {
    const profile = Storage.getProfile();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // 1. Dynamic celestial chart & Daily Auspicious Matrix
    const todayChart = AstrologyEngine.calculateChart(dateStr);
    const sunSign = todayChart.western.sun;
    const moonSign = todayChart.western.moon;
    const daily = DailyGuidanceEngine.getTodayGuidance(now);

    const greeting = I18n.getLang() === 'th'
      ? `สวัสดีคุณ ${profile.nickname || profile.name || 'ผู้แสวงหาปัญญา'}`
      : `Welcome, ${profile.nickname || profile.name || 'Seeker'}`;

    container.innerHTML = `
      <div class="dashboard-wrapper">
        <!-- Greeting Header -->
        <div style="margin-bottom: var(--space-6);">
          <div class="hero-badge" style="margin-bottom: var(--space-2);">
            <span>✦</span> <span>ดวงชะตาประจำวันของคุณ</span> <span>✦</span>
          </div>
          <h1 style="font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: var(--space-1);">${greeting}</h1>
          <p style="color: var(--color-text-secondary); font-size: var(--font-size-base);">
            ประจำ${daily.formattedDateTh} (${daily.energyTheme})
          </p>
        </div>

        <!-- 1. HERO CARD: สีมงคลและดวงประจำวัน (เด่นชัด เข้าใจง่ายทันที) -->
        <div class="editorial-card theme-unified" style="margin-bottom: var(--space-8); background: radial-gradient(circle at top right, rgba(212, 175, 55, 0.08) 0%, var(--color-surface-elevated) 100%);">
          <div class="editorial-card-header">
            <span class="tradition-tag" style="background: rgba(212, 175, 55, 0.15); color: var(--color-gold-bright);">
              🎨 สีมงคลและแนวทางชีวิตวันนี้
            </span>
            <span style="font-size: var(--font-size-xs); color: var(--color-gold-bright); font-weight: 600;">
              ${daily.dayNameTh} (${daily.planetTh})
            </span>
          </div>

          <!-- Daily Advice (คำแนะนำเข้าใจง่าย) -->
          <div style="background: rgba(12, 13, 16, 0.6); border-left: 4px solid var(--color-gold-bright); padding: var(--space-4) var(--space-5); border-radius: var(--radius-sm); margin-bottom: var(--space-6);">
            <div style="font-size: var(--font-size-xs); color: var(--color-gold-bright); font-weight: 600; margin-bottom: 4px;">
              💡 ข้อคิดและคำแนะนำประจำวัน:
            </div>
            <p style="font-size: var(--font-size-base); color: var(--color-text-primary); line-height: 1.7;">
              "${daily.dailyAdvice}"
            </p>
          </div>

          <!-- 4 Color Quadrants -->
          <h3 style="font-size: var(--font-size-lg); color: var(--color-gold-light); margin-bottom: var(--space-3);">
            ตารางสีมงคลประจำ${daily.dayNameTh}
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-6);">
            <!-- สีโชคลาภการเงิน -->
            <div style="background: rgba(12, 13, 16, 0.45); border: var(--border-subtle); border-radius: var(--radius-sm); padding: var(--space-3) var(--space-4); display: flex; align-items: center; gap: var(--space-3);">
              <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: ${daily.luckyColors.wealth.hex}; flex-shrink: 0; box-shadow: 0 0 10px ${daily.luckyColors.wealth.hex}66; border: 2px solid rgba(255,255,255,0.4);"></div>
              <div>
                <div style="font-size: 11px; color: var(--color-text-muted);">สีเสริมโชคลาภ/เงินทอง</div>
                <div style="font-size: var(--font-size-sm); font-weight: 600; color: var(--color-gold-bright);">${daily.luckyColors.wealth.name}</div>
                <div style="font-size: 10px; color: var(--color-text-secondary);">${daily.luckyColors.wealth.desc}</div>
              </div>
            </div>

            <!-- สีการงาน/อำนาจบารมี -->
            <div style="background: rgba(12, 13, 16, 0.45); border: var(--border-subtle); border-radius: var(--radius-sm); padding: var(--space-3) var(--space-4); display: flex; align-items: center; gap: var(--space-3);">
              <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: ${daily.luckyColors.career.hex}; flex-shrink: 0; box-shadow: 0 0 10px ${daily.luckyColors.career.hex}66; border: 2px solid rgba(255,255,255,0.4);"></div>
              <div>
                <div style="font-size: 11px; color: var(--color-text-muted);">สีเสริมการงาน/ผู้ใหญ่เมตตา</div>
                <div style="font-size: var(--font-size-sm); font-weight: 600; color: #FFFFFF;">${daily.luckyColors.career.name}</div>
                <div style="font-size: 10px; color: var(--color-text-secondary);">${daily.luckyColors.career.desc}</div>
              </div>
            </div>

            <!-- สีความรัก/เสน่ห์ -->
            <div style="background: rgba(12, 13, 16, 0.45); border: var(--border-subtle); border-radius: var(--radius-sm); padding: var(--space-3) var(--space-4); display: flex; align-items: center; gap: var(--space-3);">
              <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: ${daily.luckyColors.love.hex}; flex-shrink: 0; box-shadow: 0 0 10px ${daily.luckyColors.love.hex}66; border: 2px solid rgba(255,255,255,0.4);"></div>
              <div>
                <div style="font-size: 11px; color: var(--color-text-muted);">สีเสริมเสน่ห์/ความรัก</div>
                <div style="font-size: var(--font-size-sm); font-weight: 600; color: #FFFFFF;">${daily.luckyColors.love.name}</div>
                <div style="font-size: 10px; color: var(--color-text-secondary);">${daily.luckyColors.love.desc}</div>
              </div>
            </div>

            <!-- สีกาลกิณีที่ควรเลี่ยง -->
            <div style="background: rgba(197, 48, 48, 0.08); border: 1px solid rgba(197, 48, 48, 0.3); border-radius: var(--radius-sm); padding: var(--space-3) var(--space-4); display: flex; align-items: center; gap: var(--space-3);">
              <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: ${daily.luckyColors.avoid.hex}; flex-shrink: 0; border: 2px dashed #FC8181;"></div>
              <div>
                <div style="font-size: 11px; color: #FC8181; font-weight: 600;">สีกาลกิณี (ควรเลี่ยง)</div>
                <div style="font-size: var(--font-size-sm); font-weight: 600; color: #FEB2B2;">${daily.luckyColors.avoid.name}</div>
                <div style="font-size: 10px; color: var(--color-text-secondary);">${daily.luckyColors.avoid.desc}</div>
              </div>
            </div>
          </div>

          <!-- Numbers, Direction & Auspicious Hours Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3); border-top: var(--border-subtle); padding-top: var(--space-4);">
            <div>
              <div style="font-size: 11px; color: var(--color-text-muted);">🔢 เลขนำโชคประจำวัน:</div>
              <div style="font-size: var(--font-size-xl); font-weight: 700; color: var(--color-gold-bright);">
                ${daily.luckyNumbers.join(' · ')} <span style="font-size: var(--font-size-xs); font-weight: 400; color: var(--color-text-secondary);">(คู่เด่น: ${daily.luckyPair})</span>
              </div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--color-text-muted);">🧭 ทิศมงคลเปิดรับทรัพย์:</div>
              <div style="font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-primary); margin-top: 2px;">
                ${daily.luckyDirection}
              </div>
            </div>
            <div>
              <div style="font-size: 11px; color: var(--color-text-muted);">⏰ ช่วงเวลาดี (ฤกษ์มงคล):</div>
              <div style="font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-primary); margin-top: 2px;">
                ${daily.auspiciousHours}
              </div>
            </div>
          </div>
        </div>

        <!-- 2. ตำแหน่งดวงดาววันนี้แบบภาษาไทยเข้าใจง่าย -->
        <div class="editorial-card theme-western" style="margin-bottom: var(--space-8);">
          <div class="editorial-card-header">
            <span class="tradition-tag">🌌 ตำแหน่งดวงดาวบนท้องฟ้าวันนี้</span>
            <span style="font-size: var(--font-size-xs); color: var(--color-text-muted);">${dateStr}</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4);">
            <div style="background: rgba(12, 13, 16, 0.4); padding: var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-gold-bright);">☉ พระอาทิตย์ (พลังชีวิตและความสดใส)</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600; margin: 4px 0;">ราศี${sunSign.nameTh} (${sunSign.nameEn})</div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">องศาดาว: ${sunSign.degreeInSign}° (${elementWithMeaningTh(sunSign.element)})</div>
            </div>
            <div style="background: rgba(12, 13, 16, 0.4); padding: var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-gold-bright);">☽ พระจันทร์ (อารมณ์และจิตใจ)</div>
              <div style="font-size: var(--font-size-lg); font-weight: 600; margin: 4px 0;">ราศี${moonSign.nameTh} (${moonSign.nameEn})</div>
              <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary);">องศาดาว: ${moonSign.degreeInSign}° (${elementWithMeaningTh(moonSign.element)})</div>
            </div>
          </div>
        </div>

        <!-- 3. เมนูเลือกดูศาสตร์พยากรณ์ต่างๆ (ชื่อภาษาไทยชัดเจน) -->
        <div style="margin-bottom: var(--space-12);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6);">
            <h3 style="font-size: var(--font-size-xl);">เลือกดูศาสตร์พยากรณ์ประจำตัวคุณ</h3>
          </div>
          <div class="traditions-grid">
            <div class="editorial-card theme-unified" onclick="location.hash='#reading'" style="cursor: pointer; border: 2px solid var(--color-gold-bright); grid-column: 1 / -1; background: radial-gradient(circle at top left, rgba(212, 175, 55, 0.12) 0%, var(--color-surface-elevated) 100%);">
              <span class="tradition-tag" style="background: rgba(212, 175, 55, 0.2); color: var(--color-gold-bright);">แนะนำ: ครบจบในหน้าเดียว</span>
              <h4 style="font-size: var(--font-size-xl); margin: var(--space-2) 0;">🔮 ดูดวงของฉัน — การงาน การเงิน ความรัก สุขภาพ โชคลาภ</h4>
              <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">คำนวณจากวันเกิดคุณจริง ๆ ทั้งสีมงคล เลขมงคล ปีชง ธาตุประจำตัว พร้อมคำอธิบายภาษาชาวบ้าน ตัวอย่างการใช้ และปุ่มให้ AI อธิบายเจาะลึกทุกหัวข้อ</p>
            </div>
            <div class="editorial-card theme-western" onclick="location.hash='#traditions'" style="cursor: pointer;">
              <span class="tradition-tag">โหราศาสตร์สากล</span>
              <h4 style="font-size: var(--font-size-lg); margin: var(--space-2) 0;">ผังดวงดาวกำเนิด 12 ราศี</h4>
              <p style="font-size: var(--font-size-sm); color: var(--color-text-muted);">ดูราศีเกิด ลัคนา และองศาตำแหน่งดาวที่ส่งผลต่อชีวิตคุณ</p>
            </div>

            <div class="editorial-card theme-bazi" onclick="location.hash='#traditions'" style="cursor: pointer;">
              <span class="tradition-tag" style="color: var(--color-bazi-accent);">ดวงจีนโบราณ</span>
              <h4 style="font-size: var(--font-size-lg); margin: var(--space-2) 0;">โป๊ยหยี่สี่แถว (BaZi)</h4>
              <p style="font-size: var(--font-size-sm); color: var(--color-text-muted);">วิเคราะห์ธาตุทั้ง 5 (ดิน ทอง น้ำ ไม้ ไฟ) และธาตุแท้ประจำตัว</p>
            </div>

            <div class="editorial-card theme-numerology" onclick="location.hash='#traditions'" style="cursor: pointer;">
              <span class="tradition-tag" style="color: var(--color-numerology-accent);">เลขศาสตร์สากล</span>
              <h4 style="font-size: var(--font-size-lg); margin: var(--space-2) 0;">รหัสตัวเลขนำทางชีวิต</h4>
              <p style="font-size: var(--font-size-sm); color: var(--color-text-muted);">ถอดรหัส Life Path Number และจังหวะชีวิตในปีนี้</p>
            </div>

            <div class="editorial-card theme-tarot" onclick="location.hash='#tarot'" style="cursor: pointer;">
              <span class="tradition-tag" style="color: var(--color-tarot-accent);">ไพ่ยิปซี</span>
              <h4 style="font-size: var(--font-size-lg); margin: var(--space-2) 0;">ไพ่ทาโรต์ 3 ใบ (อดีต ปัจจุบัน อนาคต)</h4>
              <p style="font-size: var(--font-size-sm); color: var(--color-text-muted);">เปิดไพ่สะท้อนสภาวะจิตใจและคำแนะนำเรื่องราวที่กำลังพบเจอ</p>
            </div>

            <div class="editorial-card theme-iching" onclick="location.hash='#iching'" style="cursor: pointer;">
              <span class="tradition-tag" style="color: var(--color-iching-accent);">คัมภีร์เปลี่ยนเส้นทาง</span>
              <h4 style="font-size: var(--font-size-lg); margin: var(--space-2) 0;">เสี่ยงทายอี้จิง (โยนเหรียญโบราณ)</h4>
              <p style="font-size: var(--font-size-sm); color: var(--color-text-muted);">โยนเหรียญบรอนซ์ 3 เหรียญ เพื่อรับคำแนะนำในการตัดสินใจ</p>
            </div>

            <div class="editorial-card theme-unified" onclick="location.hash='#unified'" style="cursor: pointer;">
              <span class="tradition-tag">อ่านแบบองค์รวม</span>
              <h4 style="font-size: var(--font-size-lg); margin: var(--space-2) 0;">คำทำนายสังเคราะห์ทุกศาสตร์</h4>
              <p style="font-size: var(--font-size-sm); color: var(--color-text-muted);">รวมทุกศาสตร์เข้าด้วยกันเป็นคำอ่านบทสรุปส่วนตัวของคุณ</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
