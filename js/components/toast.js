/**
 * AETHRA ORACLE — Toast Notification System
 */

export class ToastManager {
  static init() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    this.container = container;
  }

  static show(message, duration = 3200) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', '#D4AF37');
    icon.setAttribute('stroke-width', '2');
    toast.innerHTML = `
      <span class="toast-message"></span>
    `;
    icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path>';
    toast.prepend(icon);
    toast.querySelector('.toast-message').textContent = String(message ?? '');

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}
