/**
 * AETHRA ORACLE — Mandatory Celestial Induction Onboarding Component
 */

import { Storage, MAJOR_CITIES, resolveBirthPlace } from '../core/storage.js';
import { parseThaiBirthDate, parseThaiBirthTime } from '../core/thai-date-input.js';
import { I18n } from '../core/i18n.js';
import { SoundManager } from '../core/sound.js';
import { CelestialSeal } from './seal.js';
import { ToastManager } from './toast.js';

export class OnboardingModal {
  static init() {
    this.dialog = document.getElementById('onboarding-modal');
    if (!this.dialog) return;

    this.form = document.getElementById('onboarding-form');
    this.fullNameInput = document.getElementById('onboard-full-name');
    this.nicknameInput = document.getElementById('onboard-nickname');
    this.genderSelect = document.getElementById('onboard-gender');
    this.dateInput = document.getElementById('onboard-date');
    this.timeInput = document.getElementById('onboard-time');
    this.dateEcho = document.getElementById('onboard-date-echo');
    this.unknownDateCheckbox = document.getElementById('onboard-date-unknown');
    this.unknownTimeCheckbox = document.getElementById('onboard-time-unknown');
    this.unknownPlaceCheckbox = document.getElementById('onboard-place-unknown');
    this.unknownWarning = document.getElementById('onboard-unknown-warning');
    this.cityInput = document.getElementById('onboard-city');
    this.citySuggestions = document.getElementById('birthplace-suggestions');
    this.focusSelect = document.getElementById('onboard-focus');
    this.qualityBar = document.getElementById('onboard-quality-bar');
    this.qualityText = document.getElementById('onboard-quality-text');
    this.sealCanvas = document.getElementById('onboard-seal-canvas');

    this.populateCities();
    this.bindEvents();
  }

  static populateCities() {
    if (!this.citySuggestions) return;
    this.citySuggestions.innerHTML = MAJOR_CITIES.map(c => `
      <option value="${c.name}"></option>
    `).join('');
  }

  static bindEvents() {
    // Live update Seal and Data Quality as user types
    const liveUpdate = () => {
      const tempProfile = this.getFormData();
      if (this.sealCanvas) {
        CelestialSeal.render(this.sealCanvas, tempProfile);
      }
      const quality = Storage.calculateDataQuality(tempProfile);
      if (this.qualityBar) this.qualityBar.style.width = `${quality}%`;
      if (this.qualityText) this.qualityText.textContent = `${quality}%`;
    };

    this.fullNameInput?.addEventListener('input', liveUpdate);
    this.nicknameInput?.addEventListener('input', liveUpdate);
    this.dateInput?.addEventListener('input', liveUpdate);
    this.timeInput?.addEventListener('input', liveUpdate);
    this.genderSelect?.addEventListener('change', liveUpdate);
    this.cityInput?.addEventListener('input', liveUpdate);
    this.focusSelect?.addEventListener('change', liveUpdate);

    const updateUnknownWarning = () => {
      const hasUnknown = this.unknownDateCheckbox?.checked || this.unknownTimeCheckbox?.checked || this.unknownPlaceCheckbox?.checked;
      if (this.unknownWarning) {
        this.unknownWarning.hidden = !hasUnknown;
        this.unknownWarning.textContent = hasUnknown ? I18n.t('onboarding_unknown_warning') : '';
      }
    };

    this.unknownDateCheckbox?.addEventListener('change', (e) => {
      if (this.dateInput) {
        this.dateInput.disabled = e.target.checked;
        this.dateInput.required = !e.target.checked;
        if (e.target.checked) this.dateInput.value = '';
      }
      updateUnknownWarning();
      liveUpdate();
    });

    // อ่านวันเกิดที่พิมพ์แบบสด ๆ เพื่อให้ผู้ใช้เห็นทันทีว่าระบบเข้าใจถูกไหม
    this.dateInput?.addEventListener('input', () => this.refreshDateEcho());
    this.dateInput?.addEventListener('blur', () => this.refreshDateEcho());
    this.timeInput?.addEventListener('input', () => this.refreshTimeParse());

    // Toggle Unknown Birth Time
    this.unknownTimeCheckbox?.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (this.timeInput) {
          this.timeInput.value = '';
          this.timeInput.disabled = true;
          this.timeInput.required = false;
        }
      } else {
        if (this.timeInput) {
          this.timeInput.disabled = false;
          this.timeInput.required = true;
        }
      }
      updateUnknownWarning();
      liveUpdate();
    });

    this.unknownPlaceCheckbox?.addEventListener('change', (e) => {
      if (this.cityInput) {
        this.cityInput.disabled = e.target.checked;
        this.cityInput.required = !e.target.checked;
        if (e.target.checked) this.cityInput.value = '';
      }
      updateUnknownWarning();
      liveUpdate();
    });

    // Form Submit
    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const profileData = this.getFormData();

      const missingDate = !profileData.isBirthDateUnknown && !profileData.birthDate;
      const missingTime = !profileData.isTimeUnknown && !profileData.birthTime;
      const missingPlace = !profileData.isBirthPlaceUnknown && !profileData.birthPlace;
      if (!profileData.fullName || !profileData.nickname || missingDate || missingTime || missingPlace) {
        alert(I18n.t('onboarding_validation_error'));
        return;
      }

      SoundManager.play('reading-complete');
      Storage.saveProfile(profileData);
      this.close();

      ToastManager.show(I18n.t('toast_saved'));

      // Dispatch event to refresh views
      window.dispatchEvent(new CustomEvent('aethra:onboarding-complete', { detail: profileData }));
    });
  }

  /**
   * อ่านวันเกิดและเวลาที่ผู้ใช้พิมพ์ แล้วแสดงกลับให้ยืนยันด้วยตา
   *
   * ต้องแสดงกลับ เพราะการพิมพ์เองมีโอกาสพิมพ์ผิดสูงกว่าการเลือกจากปฏิทิน
   * และการเดา พ.ศ. กับ ค.ศ. ผิด จะทำให้ดวงผิดทั้งหมดโดยผู้ใช้ไม่รู้ตัว
   */
  static refreshDateEcho() {
    const echo = this.dateEcho;
    const raw = this.dateInput?.value || '';

    if (!echo) return;

    if (!raw.trim()) {
      echo.hidden = true;
      this.parsedDate = null;
      return;
    }

    const result = parseThaiBirthDate(raw);
    echo.hidden = false;

    if (!result.ok) {
      this.parsedDate = null;
      echo.className = 'date-echo is-bad';
      echo.textContent = '⚠️ ' + result.errorTh;
      return;
    }

    this.parsedDate = result.isoDate;
    echo.className = 'date-echo is-ok';
    echo.textContent = '✅ ระบบอ่านได้ว่า ' + result.displayTh
      + (result.assumed ? ' — ถ้าไม่ใช่ ลองพิมพ์ปีให้ครบสี่หลัก' : '');
  }

  static refreshTimeParse() {
    const raw = this.timeInput?.value || '';
    if (!raw.trim()) { this.parsedTime = null; return; }
    const result = parseThaiBirthTime(raw);
    this.parsedTime = result.ok ? result.time : null;
  }

  static getFormData() {
    const currentProfile = Storage.getProfile();
    const isBirthPlaceUnknown = !!this.unknownPlaceCheckbox?.checked;
    const place = isBirthPlaceUnknown
      ? { birthPlace: '', lat: null, lon: null, timezone: null }
      : resolveBirthPlace(this.cityInput?.value, currentProfile);

    const isBirthDateUnknown = !!this.unknownDateCheckbox?.checked;
    const isUnknown = !!this.unknownTimeCheckbox?.checked;
    const timeVal = isUnknown ? null : (this.timeInput?.value || null);

    return {
      name: this.fullNameInput?.value.trim() || '',
      fullName: this.fullNameInput?.value.trim() || '',
      nickname: this.nicknameInput?.value.trim() || '',
      gender: this.genderSelect?.value || 'unspecified',
      // ผู้ใช้พิมพ์เอง ระบบจึงต้องแปลงเป็นรูปแบบมาตรฐานก่อนเก็บ
      birthDate: isBirthDateUnknown ? null : (this.parsedDate || null),
      isBirthDateUnknown,
      birthTime: timeVal,
      isTimeUnknown: isUnknown,
      ...place,
      isBirthPlaceUnknown,
      focus: this.focusSelect?.value || 'general'
    };
  }

  static open(isForced = false) {
    if (!this.dialog) this.init();
    if (!this.dialog) return;

    const currentProfile = Storage.getProfile();
    const isFirstVisit = !Storage.isOnboarded();
    if (this.fullNameInput) this.fullNameInput.value = isFirstVisit ? '' : currentProfile.fullName;
    if (this.nicknameInput) this.nicknameInput.value = isFirstVisit ? '' : currentProfile.nickname;
    if (this.dateInput) {
      // ค่าที่เก็บเป็นรูปแบบมาตรฐาน แปลงกลับเป็นแบบที่คนไทยอ่านง่ายก่อนแสดง
      const saved = isFirstVisit ? '' : (currentProfile.birthDate || '');
      if (saved) {
        const [y, m, d] = saved.split('-');
        this.dateInput.value = d + '/' + m + '/' + (Number(y) + 543);
        this.parsedDate = saved;
      } else {
        this.dateInput.value = '';
        this.parsedDate = null;
      }
      this.refreshDateEcho();
    }
    if (this.timeInput) {
      this.timeInput.value = isFirstVisit ? '' : (currentProfile.birthTime || '');
      this.parsedTime = isFirstVisit ? null : (currentProfile.birthTime || null);
    }
    if (this.genderSelect) this.genderSelect.value = currentProfile.gender || 'unspecified';
    if (this.focusSelect) this.focusSelect.value = currentProfile.focus || 'general';
    if (this.cityInput) this.cityInput.value = isFirstVisit ? '' : (currentProfile.birthPlace || '');

    if (this.unknownDateCheckbox) {
      this.unknownDateCheckbox.checked = !isFirstVisit && !!currentProfile.isBirthDateUnknown;
      if (this.dateInput) {
        this.dateInput.disabled = this.unknownDateCheckbox.checked;
        this.dateInput.required = !this.unknownDateCheckbox.checked;
      }
    }

    if (this.unknownTimeCheckbox) {
      this.unknownTimeCheckbox.checked = !!currentProfile.isTimeUnknown;
      if (this.timeInput) {
        this.timeInput.disabled = !!currentProfile.isTimeUnknown;
        this.timeInput.required = !currentProfile.isTimeUnknown;
      }
    }

    if (this.unknownPlaceCheckbox) {
      this.unknownPlaceCheckbox.checked = !isFirstVisit && !!currentProfile.isBirthPlaceUnknown;
      if (this.cityInput) {
        this.cityInput.disabled = this.unknownPlaceCheckbox.checked;
        this.cityInput.required = !this.unknownPlaceCheckbox.checked;
      }
    }

    const hasUnknown = this.unknownDateCheckbox?.checked || this.unknownTimeCheckbox?.checked || this.unknownPlaceCheckbox?.checked;
    if (this.unknownWarning) {
      this.unknownWarning.hidden = !hasUnknown;
      this.unknownWarning.textContent = hasUnknown ? I18n.t('onboarding_unknown_warning') : '';
    }

    const formProfile = this.getFormData();
    if (this.sealCanvas) {
      CelestialSeal.render(this.sealCanvas, formProfile);
    }

    const quality = Storage.calculateDataQuality(formProfile);
    if (this.qualityBar) this.qualityBar.style.width = `${quality}%`;
    if (this.qualityText) this.qualityText.textContent = `${quality}%`;

    this.dialog.showModal();
    SoundManager.play('oracle-open');
  }

  static close() {
    this.dialog?.close();
  }
}
