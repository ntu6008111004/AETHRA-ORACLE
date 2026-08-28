/**
 * AETHRA ORACLE — User Profile & Celestial Seal View
 */

import { Storage, MAJOR_CITIES, resolveBirthPlace } from '../core/storage.js';
import { parseThaiBirthDate, parseThaiBirthTime } from '../core/thai-date-input.js';
import { I18n } from '../core/i18n.js';
import { CelestialSeal } from '../components/seal.js';
import { ToastManager } from '../components/toast.js';
import { SoundManager } from '../core/sound.js';
import { OnboardingModal } from '../components/onboarding.js';

/**
 * กันข้อความจากผู้ใช้ไปทำลายโครงหน้าเว็บ
 *
 * ชื่อที่มีเครื่องหมายคำพูดหรือวงเล็บมุม เคยทำให้หน้าโปรไฟล์แสดงผลเพี้ยน
 * เพราะค่าถูกยัดเข้าไปในโครงหน้าเว็บตรง ๆ โดยไม่แปลงอักขระพิเศษก่อน
 */
function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export class ProfileView {
  static render(container) {
    const profile = Storage.getProfile();
    const quality = Storage.calculateDataQuality(profile);

    container.innerHTML = `
      <div class="profile-view-wrapper" style="max-width: 760px; margin: 0 auto;">
        <h2 style="font-size: var(--font-size-3xl); margin-bottom: var(--space-2); text-align: center;">${I18n.t('profile_title')}</h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-8); text-align: center;">${I18n.t('tagline')}</p>

        <!-- Deterministic Seal Box -->
        <div class="editorial-card" style="text-align: center; margin-bottom: var(--space-8);">
          <div class="editorial-card-header">
            <span class="tradition-tag">${I18n.t('profile_seal_title')}</span>
            <span style="font-size: var(--font-size-xs); color: var(--color-gold-bright);">
              ${I18n.t('onboarding_quality_label')}: <strong>${quality}%</strong>
            </span>
          </div>

          <div class="personal-seal-canvas-wrapper">
            <canvas id="profile-seal-canvas" width="180" height="180"></canvas>
          </div>

          <div style="font-family: var(--font-serif); font-size: var(--font-size-2xl); color: var(--color-gold-bright); margin-top: var(--space-2);">
            ${profile.nickname}
          </div>
          <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: 4px;">${profile.fullName}</div>
          <div style="font-size: var(--font-size-xs); color: var(--color-text-muted); margin-top: 4px;">
            ${Number.isFinite(profile.lat) && Number.isFinite(profile.lon) ? `พิกัดเกิด ${profile.lat.toFixed(2)}° ${profile.lon.toFixed(2)}° · ` : ''}${profile.birthDate ? `เกิด ${profile.birthDate.slice(8,10)}/${profile.birthDate.slice(5,7)}/${Number(profile.birthDate.slice(0,4)) + 543}` : I18n.t('onboarding_date_unknown')} ${profile.birthTime || ''}
          </div>
        </div>

        <!-- Edit Profile Form -->
        <div class="editorial-card">
          <div class="editorial-card-header">
            <span class="tradition-tag">ตั้งค่าข้อมูลวันเกิด</span>
            <button id="prof-reopen-onboard-btn" class="header-btn" style="height: 30px; font-size: 11px;">
              Re-open Calibration Wizard
            </button>
          </div>

          <form id="profile-edit-form">
            <!-- Full Name & Nickname -->
            <div class="profile-field-grid">
              <div>
                <label class="form-label" for="prof-full-name">${I18n.t('profile_fullname_label')}</label>
                <input type="text" id="prof-full-name" value="${profile.fullName}" class="form-control" required />
              </div>
              <div>
                <label class="form-label" for="prof-nickname">${I18n.t('profile_nickname_label')}</label>
                <input type="text" id="prof-nickname" value="${profile.nickname}" class="form-control" required />
              </div>
            </div>

            <div style="margin-bottom: var(--space-4);">
                <label class="form-label" for="prof-gender">${I18n.t('onboarding_gender_label')}</label>
                <select id="prof-gender" class="form-control">
                  <option value="yang" ${profile.gender === 'yang' ? 'selected' : ''}>${I18n.t('onboarding_gender_yang')}</option>
                  <option value="yin" ${profile.gender === 'yin' ? 'selected' : ''}>${I18n.t('onboarding_gender_yin')}</option>
                  <option value="unspecified" ${profile.gender === 'unspecified' ? 'selected' : ''}>${I18n.t('onboarding_gender_neutral')}</option>
                </select>
            </div>

            <!-- Date & Time -->
            <div class="profile-field-grid">
              <div>
                <label class="form-label" for="prof-date">${I18n.t('profile_birthdate_label')}</label>
                <input type="text" id="prof-date" value="${profile.birthDate ? profile.birthDate.slice(8,10) + '/' + profile.birthDate.slice(5,7) + '/' + (Number(profile.birthDate.slice(0,4)) + 543) : ''}" class="form-control" placeholder="เช่น 27/06/2541" autocomplete="bday" ${profile.isBirthDateUnknown ? 'disabled' : 'required'} />
                <div id="prof-date-echo" class="date-echo" hidden></div>
                <p class="form-hint">พิมพ์เองได้เลย ใส่ พ.ศ. หรือ ค.ศ. ก็ได้</p>
              </div>
              <div>
                <label class="form-label" for="prof-time">${I18n.t('profile_birthtime_label')}</label>
                <input type="text" id="prof-time" value="${escapeHtml(profile.birthTime || '')}" class="form-control" placeholder="เช่น 09:30 หรือ สองทุ่ม" ${profile.isTimeUnknown ? 'disabled' : 'required'} />
              </div>
            </div>

            <!-- Unknown Birth Details -->
            <div class="onboarding-unknown-grid">
              <label class="form-checkbox-label">
                <input type="checkbox" id="prof-date-unknown" ${profile.isBirthDateUnknown ? 'checked' : ''} style="accent-color: var(--color-gold-bright);" />
                <span>${I18n.t('onboarding_date_unknown')}</span>
              </label>
              <label style="display: inline-flex; align-items: center; gap: var(--space-2); font-size: 11px; color: var(--color-text-muted); cursor: pointer;">
                <input type="checkbox" id="prof-time-unknown" ${profile.isTimeUnknown ? 'checked' : ''} style="accent-color: var(--color-gold-bright);" />
                <span>${I18n.t('onboarding_time_unknown')}</span>
              </label>
            </div>

            <!-- Place of Birth -->
            <div style="margin-bottom: var(--space-4);">
              <label class="form-label" for="prof-city">${I18n.t('onboarding_city_label')}</label>
              <input type="text" id="prof-city" value="${escapeHtml(profile.birthPlace || '')}" class="form-control"
                list="prof-birthplace-suggestions" placeholder="เช่น เมืองเชียงใหม่, ประเทศไทย" autocomplete="off" required />
              <datalist id="prof-birthplace-suggestions">
                ${MAJOR_CITIES.map(c => `<option value="${c.name}"></option>`).join('')}
              </datalist>
              <p class="form-hint">${I18n.t('onboarding_city_hint')}</p>
              <label class="form-checkbox-label form-checkbox-label--spaced">
                <input type="checkbox" id="prof-place-unknown" ${profile.isBirthPlaceUnknown ? 'checked' : ''} style="accent-color: var(--color-gold-bright);" />
                <span>${I18n.t('onboarding_place_unknown')}</span>
              </label>
            </div>

            <!-- Focus Selection -->
            <div style="margin-bottom: var(--space-6);">
              <label class="form-label" for="prof-focus">${I18n.t('onboarding_focus_label')}</label>
              <select id="prof-focus" class="form-control">
                <option value="general" ${profile.focus === 'general' ? 'selected' : ''}>${I18n.t('onboarding_focus_general')}</option>
                <option value="love" ${profile.focus === 'love' ? 'selected' : ''}>${I18n.t('onboarding_focus_love')}</option>
                <option value="career" ${profile.focus === 'career' ? 'selected' : ''}>${I18n.t('onboarding_focus_career')}</option>
                <option value="spiritual" ${profile.focus === 'spiritual' ? 'selected' : ''}>${I18n.t('onboarding_focus_spiritual')}</option>
              </select>
            </div>

            <div style="display: flex; gap: var(--space-4); justify-content: flex-end;">
              <button type="submit" class="btn btn-primary">
                <span>${I18n.t('profile_save_btn')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    const canvas = container.querySelector('#profile-seal-canvas');
    if (canvas) CelestialSeal.render(canvas, profile);

    const unknownTimeCheckbox = container.querySelector('#prof-time-unknown');
    const unknownDateCheckbox = container.querySelector('#prof-date-unknown');
    const unknownPlaceCheckbox = container.querySelector('#prof-place-unknown');
    const dateInput = container.querySelector('#prof-date');
    const timeInput = container.querySelector('#prof-time');
    const placeInput = container.querySelector('#prof-city');

    if (placeInput && profile.isBirthPlaceUnknown) placeInput.disabled = true;

    unknownDateCheckbox?.addEventListener('change', (e) => {
      dateInput.disabled = e.target.checked;
      dateInput.required = !e.target.checked;
      if (e.target.checked) dateInput.value = '';
    });

    unknownTimeCheckbox?.addEventListener('change', (e) => {
      if (e.target.checked) {
        timeInput.value = '';
        timeInput.disabled = true;
        timeInput.required = false;
      } else {
        timeInput.disabled = false;
        timeInput.required = true;
      }
    });

    unknownPlaceCheckbox?.addEventListener('change', (e) => {
      placeInput.disabled = e.target.checked;
      placeInput.required = !e.target.checked;
      if (e.target.checked) placeInput.value = '';
    });

    // อ่านวันเกิดที่พิมพ์แบบสด ๆ ให้ผู้ใช้ยืนยันด้วยตาว่าระบบเข้าใจถูก
    const dateEcho = container.querySelector('#prof-date-echo');
    const refreshEcho = () => {
      if (!dateEcho || !dateInput) return;
      const raw = dateInput.value.trim();
      if (!raw) { dateEcho.hidden = true; return; }
      const r = parseThaiBirthDate(raw);
      dateEcho.hidden = false;
      dateEcho.className = r.ok ? 'date-echo is-ok' : 'date-echo is-bad';
      dateEcho.textContent = r.ok
        ? '✅ ระบบอ่านได้ว่า ' + r.displayTh + (r.assumed ? ' — ถ้าไม่ใช่ ลองพิมพ์ปีให้ครบสี่หลัก' : '')
        : '⚠️ ' + r.errorTh;
    };
    dateInput?.addEventListener('input', refreshEcho);
    dateInput?.addEventListener('blur', refreshEcho);
    refreshEcho();

    container.querySelector('#prof-reopen-onboard-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      OnboardingModal.open();
    });

    const form = container.querySelector('#profile-edit-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const isBirthPlaceUnknown = !!unknownPlaceCheckbox?.checked;
      const place = isBirthPlaceUnknown
        ? { birthPlace: '', lat: null, lon: null, timezone: null }
        : resolveBirthPlace(placeInput.value, profile);
      const isBirthDateUnknown = !!unknownDateCheckbox?.checked;
      const isUnknown = !!unknownTimeCheckbox?.checked;

      // ผู้ใช้พิมพ์วันเกิดเอง ต้องแปลงเป็นรูปแบบมาตรฐานก่อนเก็บ
      // ถ้าอ่านไม่ออกต้องไม่บันทึก ไม่งั้นดวงจะผิดทั้งหมดโดยผู้ใช้ไม่รู้ตัว
      let parsedBirthDate = null;
      if (!isBirthDateUnknown) {
        const parsed = parseThaiBirthDate(dateInput.value);
        if (!parsed.ok) {
          ToastManager.show(parsed.errorTh);
          dateInput.focus();
          return;
        }
        parsedBirthDate = parsed.isoDate;
      }

      // เวลาเกิดพิมพ์เป็นคำไทยได้ เช่น สองทุ่ม จึงต้องแปลงเหมือนกัน
      let parsedBirthTime = null;
      if (!isUnknown && timeInput.value.trim()) {
        const pt = parseThaiBirthTime(timeInput.value);
        if (!pt.ok) {
          ToastManager.show(pt.errorTh);
          timeInput.focus();
          return;
        }
        parsedBirthTime = pt.time;
      }

      const updated = Storage.saveProfile({
        name: container.querySelector('#prof-full-name').value.trim(),
        fullName: container.querySelector('#prof-full-name').value.trim(),
        nickname: container.querySelector('#prof-nickname').value.trim(),
        gender: container.querySelector('#prof-gender').value,
        birthDate: isBirthDateUnknown ? null : parsedBirthDate,
        isBirthDateUnknown,
        birthTime: isUnknown ? null : parsedBirthTime,
        isTimeUnknown: isUnknown,
        ...place,
        isBirthPlaceUnknown,
        focus: container.querySelector('#prof-focus').value
      });

      if (canvas) CelestialSeal.render(canvas, updated);
      SoundManager.play('reading-complete');
      ToastManager.show(I18n.t('toast_saved'));
    });
  }
}
