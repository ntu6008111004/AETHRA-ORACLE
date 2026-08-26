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
    window.addEventListener('aethra:lang-changed', () => {
      this.handleRoute();
      I18n.applyTranslations();
    });

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

    // Initial Route Handling
    this.handleRoute();
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
