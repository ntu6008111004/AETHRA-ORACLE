/**
 * AETHRA ORACLE — Navigation Controller
 */

import { SoundManager } from '../core/sound.js';
import { I18n } from '../core/i18n.js';
import { ToastManager } from './toast.js';

export class NavigationController {
  static init() {
    this.header = document.querySelector('.site-header');
    this.mobileDrawer = document.getElementById('mobile-nav-drawer');
    this.mobileTrigger = document.getElementById('mobile-menu-trigger');
    this.mobileClose = document.getElementById('mobile-menu-close');
    this.langToggleBtn = document.getElementById('header-lang-toggle');
    this.soundToggleBtn = document.getElementById('header-sound-toggle');

    this.initScrollListener();
    this.initMobileDrawer();
    this.initHeaderToggles();
    this.updateSoundButtonState();
    this.updateLangButtonState();
  }

  static initScrollListener() {
    let lastKnownScrollPosition = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
      lastKnownScrollPosition = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (lastKnownScrollPosition > 40) {
            this.header?.classList.add('is-scrolled');
          } else {
            this.header?.classList.remove('is-scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  static initMobileDrawer() {
    const openDrawer = () => {
      SoundManager.play('navigation-open');
      this.mobileDrawer?.classList.add('is-open');
      this.mobileTrigger?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      this.mobileClose?.focus();
    };

    const closeDrawer = () => {
      SoundManager.play('ui-select');
      this.mobileDrawer?.classList.remove('is-open');
      this.mobileTrigger?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      this.mobileTrigger?.focus();
    };

    this.mobileTrigger?.addEventListener('click', openDrawer);
    this.mobileClose?.addEventListener('click', closeDrawer);

    // Close on navigation link click
    this.mobileDrawer?.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => closeDrawer());
    });

    // Escape Key to close
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileDrawer?.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  }

  static initHeaderToggles() {
    // Sound Toggle
    this.soundToggleBtn?.addEventListener('click', () => {
      const isMuted = SoundManager.toggleMute();
      this.updateSoundButtonState();
      ToastManager.show(isMuted ? I18n.t('toast_sound_off') : I18n.t('toast_sound_on'));
      if (!isMuted) SoundManager.play('ui-select');
    });

    // Language Toggle (TH <-> EN)
    this.langToggleBtn?.addEventListener('click', () => {
      const current = I18n.getLang();
      const next = current === 'th' ? 'en' : 'th';
      I18n.setLang(next);
      this.updateLangButtonState();
      SoundManager.play('ui-select');
      ToastManager.show(I18n.t('toast_lang_changed'));
    });
  }

  static updateSoundButtonState() {
    if (!this.soundToggleBtn) return;
    const isMuted = SoundManager.isMuted;
    this.soundToggleBtn.innerHTML = isMuted
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg><span class="sr-only">Unmute</span>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg><span class="sr-only">Mute</span>`;
  }

  static updateLangButtonState() {
    if (!this.langToggleBtn) return;
    const lang = I18n.getLang();
    this.langToggleBtn.textContent = lang === 'th' ? 'EN' : 'TH';
  }
}
