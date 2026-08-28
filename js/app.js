/**
 * AETHRA ORACLE — Main Application Controller
 */

import { NavigationController } from './components/navigation.js';
import { AstrolabeInstrument } from './components/astrolabe.js';
import { ToastManager } from './components/toast.js';
import { OnboardingModal } from './components/onboarding.js';
import { I18n } from './core/i18n.js';
import { SoundManager } from './core/sound.js';
import { Storage } from './core/storage.js';

// Views
import { DashboardView } from './views/dashboard.js';
import { TraditionsView } from './views/traditions.js';
import { TarotView } from './views/tarot-view.js';
import { IChingView } from './views/iching-view.js';
import { UnifiedView } from './views/unified-view.js';
import { ConsultationView } from './views/consultation.js';
import { ProfileView } from './views/profile.js';
import { ReadingView } from './views/reading-view.js';
import { MatchView } from './views/match-view.js';
import { ElementsView } from './views/elements-view.js';
import { PhoneView } from './views/phone-view.js';
import { DreamView } from './views/dream-view.js';
import { YearView } from './views/year-view.js';
import { OtherView } from './views/other-view.js';

class AethraApp {
  constructor() {
    this.currentRoute = 'home';
    this.astrolabe = null;
    this.appRoot = document.getElementById('app-main-content');
    this.heroSection = document.getElementById('hero-section');
    this.introSplash = document.getElementById('intro-splash');
    this.aboutModal = document.getElementById('about-modal');
  }

  init() {
    // 1. Initialize Localization, Navigation, Sound & Onboarding
    I18n.applyTranslations();
    NavigationController.init();
    ToastManager.init();
    OnboardingModal.init();
    SoundManager.attachGlobalListeners();

    // 2. Initialize Intro Splash & Initial Onboarding Trigger
    this.initIntroSplash();

    // 3. Initialize Astrolabe Canvas
    const canvas = document.getElementById('astrolabe-canvas');
    if (canvas) {
      this.astrolabe = new AstrolabeInstrument(canvas);
      this.astrolabe.start();
    }

    // 4. Initialize Router & Events
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('aethra:onboarding-complete', () => {
      this.handleRoute();
    });

    window.addEventListener('aethra:profile-updated', () => {
      this.handleRoute();
    });

    // 5. About / Disclaimer Modal listeners
    document.querySelectorAll('[data-action="open-about"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        SoundManager.play('ui-select');
        this.aboutModal?.showModal();
      });
    });

    document.getElementById('about-modal-close')?.addEventListener('click', () => {
      SoundManager.play('ui-select');
      this.aboutModal?.close();
    });

    // แถบแนะนำวิธีรีเฟรชเมื่อหน้าเว็บแสดงผลเพี้ยน
    this.initRefreshTip();

    // ตัวช่วยให้เว็บอัปเดทเองทันทีที่ deploy โดยไม่ต้องกดรีเฟรชแรง
    this.initAutoUpdate();

    // Initial Route Handling
    this.handleRoute();
  }

  /**
   * ลงทะเบียนตัวช่วยใน sw.js ที่บังคับให้ดึงไฟล์สดจากเซิร์ฟเวอร์เสมอ
   * updateViaCache: 'none' สำคัญมาก เพราะสั่งไม่ให้เก็บตัว sw.js เองไว้
   * ไม่งั้นตัวแก้จะกลายเป็นของเก่าเสียเอง
   */
  initAutoUpdate() {
    if (!('serviceWorker' in navigator)) return;
    const isSecure = window.location.protocol === 'https:'
      || window.location.hostname === 'localhost'
      || window.location.hostname === '127.0.0.1';
    if (!isSecure) return;

    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then(reg => {
        // เช็คของใหม่ทุกครั้งที่กลับมาที่แท็บนี้
        reg.update().catch(() => {});
        window.addEventListener('focus', () => reg.update().catch(() => {}));
      })
      .catch(() => { /* ถ้าลงทะไม่ได้ เว็บก็ยังใช้งานได้ตามปกติ */ });
  }

  initIntroSplash() {
    const hasSeenSplash = sessionStorage.getItem('aethra_splash_seen');
    if (hasSeenSplash) {
      this.introSplash?.classList.add('is-hidden');
      this.checkMandatoryOnboarding();
    } else {
      setTimeout(() => {
        this.hideIntroSplash();
      }, 2000);

      document.getElementById('intro-skip-btn')?.addEventListener('click', () => {
        this.hideIntroSplash();
      });
    }
  }

  hideIntroSplash() {
    this.introSplash?.classList.add('is-hidden');
    sessionStorage.setItem('aethra_splash_seen', 'true');
    SoundManager.play('oracle-open');
    this.checkMandatoryOnboarding();
  }

  checkMandatoryOnboarding() {
    // If user has never calibrated their personal coordinates, open induction modal immediately
    if (!Storage.isOnboarded()) {
      setTimeout(() => {
        OnboardingModal.open(true);
      }, 300);
    }
  }

  /**
   * แถบแนะนำวิธีล้างแคช
   * แสดงให้ผู้ใช้ใหม่เห็นหนึ่งครั้ง และแสดงอัตโนมัติถ้าจับได้ว่าไฟล์เก่าค้างอยู่
   */
  initRefreshTip() {
    const tip = document.getElementById('refresh-tip');
    if (!tip) return;

    const DISMISS_KEY = 'aethra_refresh_tip_dismissed';
    const show = () => { tip.hidden = false; };

    document.getElementById('refresh-tip-close')?.addEventListener('click', () => {
      tip.hidden = true;
      try { localStorage.setItem(DISMISS_KEY, 'true'); } catch { /* โหมดส่วนตัวเขียนไม่ได้ */ }
    });

    // กดจากฟุตเตอร์แล้วให้แสดงอีกครั้งเสมอ
    document.getElementById('footer-refresh-help')?.addEventListener('click', () => {
      tip.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === 'true'; } catch { /* ignore */ }
    if (!dismissed) show();

    // ถ้าหน้าจอไม่ขึ้นเนื้อหาเลยภายใน 6 วินาที แปลว่าน่าจะมีไฟล์เก่าค้าง ให้เตือนทันที
    setTimeout(() => {
      const main = document.getElementById('app-main-content');
      if (main && main.innerText.trim().length < 30) show();
    }, 6000);
  }

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'home';
    this.currentRoute = hash;

    // Update active nav links
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      const linkHash = link.getAttribute('href')?.replace('#', '');
      if (linkHash === hash || (hash === 'home' && linkHash === '')) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });

    // Toggle Hero section visibility
    if (hash === 'home' || hash === '') {
      if (this.heroSection) this.heroSection.style.display = 'block';
      this.astrolabe?.start();
    } else {
      if (this.heroSection) this.heroSection.style.display = 'none';
      this.astrolabe?.stop();
    }

    // Render View Content
    if (!this.appRoot) return;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    switch (hash) {
      case 'home':
      case '':
        DashboardView.render(this.appRoot);
        break;

      case 'reading':
        ReadingView.render(this.appRoot);
        break;

      case 'match':
        MatchView.render(this.appRoot);
        break;

      case 'elements':
        ElementsView.render(this.appRoot);
        break;

      case 'phone':
        PhoneView.render(this.appRoot);
        break;

      case 'other':
        OtherView.render(this.appRoot);
        break;

      case 'dream':
        DreamView.render(this.appRoot);
        break;

      case 'year':
        YearView.render(this.appRoot);
        break;

      case 'traditions':
        TraditionsView.render(this.appRoot);
        break;

      case 'tarot':
        TarotView.render(this.appRoot);
        break;

      case 'iching':
        IChingView.render(this.appRoot);
        break;

      case 'unified':
        UnifiedView.render(this.appRoot);
        break;

      case 'consultation':
        ConsultationView.render(this.appRoot);
        break;

      case 'profile':
        ProfileView.render(this.appRoot);
        break;

      default:
        this.render404();
    }
  }

  render404() {
    this.appRoot.innerHTML = `
      <div style="text-align: center; padding: var(--space-16) var(--space-4);">
        <h2 style="font-size: var(--font-size-3xl); color: var(--color-gold-bright); margin-bottom: var(--space-3);">
          ${I18n.t('error_404_title')}
        </h2>
        <p style="color: var(--color-text-secondary); margin-bottom: var(--space-6); max-width: 500px; margin-left: auto; margin-right: auto;">
          ${I18n.t('error_404_sub')}
        </p>
        <a href="#home" class="btn btn-primary">
          <span>${I18n.t('btn_return_home')}</span>
        </a>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new AethraApp();
  app.init();
});
