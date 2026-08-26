/**
 * AETHRA ORACLE — Unified Reading View
 * บทสรุปคำอ่านชะตาแบบองค์รวม รวมทุกศาสตร์ไว้ในที่เดียว ภาษาไทยเข้าใจง่าย
 */

import { UnifiedReadingEngine } from '../engines/unified.js';
import { Storage } from '../core/storage.js';
import { I18n } from '../core/i18n.js';
import { SoundManager } from '../core/sound.js';
import { elementFullTh } from '../core/element-names.js';

export class UnifiedView {
  static render(container) {
    const profile = Storage.getProfile();
    const result = UnifiedReadingEngine.synthesize(profile);

    container.innerHTML = `
      <div class="unified-view-wrapper">
        <div class="hero-badge" style="margin-bottom: var(--space-2);">
          <span>✦</span> <span>คำอ่านดวงชะตาแบบองค์รวม</span> <span>✦</span>
        </div>
        <h1 style="font-size: clamp(1.75rem, 4vw, 2.5rem); margin-bottom: var(--space-2);">บทสรุปชะตาชีวิตของคุณ</h1>
        <p style="color: var(--color-text-secondary); font-size: var(--font-size-base); margin-bottom: var(--space-8);">
          หลอมรวมโหราศาสตร์สากล พระเวท ดวงจีนโป๊ยหยี่ เลขศาสตร์ และไพ่ยิปซี เพื่อให้ได้คำตอบที่ชัดเจนที่สุดสำหรับคุณ
        </p>

        <!-- Master Synthesis Card -->
        <div class="editorial-card theme-unified" style="margin-bottom: var(--space-8); background: radial-gradient(circle at top, rgba(229, 195, 120, 0.08) 0%, #13151D 100%);">
          <div class="editorial-card-header">
            <span class="tradition-tag">บทอ่านชะตาสำหรับคุณ</span>
            <span style="font-size: var(--font-size-xs); color: var(--color-gold-bright); font-weight: 600;">
              คุณ: ${profile.nickname || profile.name || 'ผู้แสวงหาปัญญา'}
            </span>
          </div>

          <h3 class="font-editorial" style="font-size: clamp(1.25rem, 3vw, 1.75rem); line-height: 1.6; color: var(--color-gold-light); margin-bottom: var(--space-6);">
            "${result.synthesis.summaryTh || result.synthesis.summaryEn}"
          </h3>

          ${result.astrology ? `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--space-4); margin-top: var(--space-6); border-top: var(--border-subtle); padding-top: var(--space-6);">
            <div style="background: rgba(12, 13, 16, 0.4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-text-muted);">☉ ราศีเกิดและราศีจิตใจ</div>
              <div style="font-weight: 600; color: var(--color-gold-bright); font-size: var(--font-size-sm); margin-top: 2px;">
                ราศี${result.astrology.western.sun.nameTh} · พระจันทร์ราศี${result.astrology.western.moon.nameTh}
              </div>
            </div>

            <div style="background: rgba(12, 13, 16, 0.4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-text-muted);">🏮 ธาตุแท้ประจำตัว (โป๊ยหยี่)</div>
              <div style="font-weight: 600; color: var(--color-gold-bright); font-size: var(--font-size-sm); margin-top: 2px;">
                ${result.bazi.dayMaster.nameTh || result.bazi.dayMaster.pinyin} (${elementFullTh(result.bazi.dayMaster.element)})
              </div>
            </div>

            <div style="background: rgba(12, 13, 16, 0.4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-text-muted);">🔢 เลขนำทางชีวิต</div>
              <div style="font-weight: 600; color: var(--color-gold-bright); font-size: var(--font-size-sm); margin-top: 2px;">
                หมายเลข ${result.numerology.lifePath}
              </div>
            </div>

            <div style="background: rgba(12, 13, 16, 0.4); padding: var(--space-3) var(--space-4); border-radius: var(--radius-sm); border: var(--border-subtle);">
              <div style="font-size: 11px; color: var(--color-text-muted);">🃏 สัญลักษณ์ไพ่นำทาง</div>
              <div style="font-weight: 600; color: var(--color-gold-bright); font-size: var(--font-size-sm); margin-top: 2px;">
                ${result.synthesis.keyArchetypeTh || result.synthesis.keyArchetype}
              </div>
            </div>
          </div>` : ''}
        </div>
      </div>
    `;

    SoundManager.play('reading-complete');
  }
}
