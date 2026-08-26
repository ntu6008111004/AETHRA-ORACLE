/**
 * AETHRA ORACLE — Interactive Celestial Astrolabe Instrument
 * Canvas-based interactive celestial visualization with smooth mouse parallax & orbital inertia.
 */

export class AstrolabeInstrument {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.width = canvasElement.width = 540;
    this.height = canvasElement.height = 540;
    
    this.rotation = 0;
    this.targetRotation = 0;
    this.mouseOffsetX = 0;
    this.mouseOffsetY = 0;
    this.targetOffsetX = 0;
    this.targetOffsetY = 0;
    this.isRunning = false;
    this.animationFrameId = null;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initEvents();
  }

  initEvents() {
    window.addEventListener('resize', () => this.handleResize());

    const handlePointer = (clientX, clientY) => {
      if (this.prefersReducedMotion) return;
      const rect = this.canvas.getBoundingClientRect();
      // ถ้าแคนวาสถูกซ่อนอยู่ ขนาดจะเป็น 0 ซึ่งทำให้หารด้วยศูนย์แล้วได้ NaN
      if (!rect.width || !rect.height) return;
      const x = clientX - (rect.left + rect.width / 2);
      const y = clientY - (rect.top + rect.height / 2);
      const nextX = (x / rect.width) * 20;
      const nextY = (y / rect.height) * 20;
      if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) return;
      this.targetOffsetX = nextX;
      this.targetOffsetY = nextY;
    };

    window.addEventListener('mousemove', (e) => handlePointer(e.clientX, e.clientY));
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
  }

  handleResize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      // อย่าให้ขนาดเล็กกว่า 120px มิฉะนั้นรัศมีจะกลายเป็น 0 และวาดไม่ได้
      const size = Math.max(120, Math.min(540, Math.floor(rect.width)));
      this.width = this.canvas.width = size;
      this.height = this.canvas.height = size;
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.handleResize();
    this.render();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  render() {
    if (!this.isRunning) return;

    const ctx = this.ctx;

    // ด่านกันพัง: ถ้าค่าใดกลายเป็น NaN/Infinity ให้รีเซ็ตกลับเป็นศูนย์
    if (!Number.isFinite(this.mouseOffsetX) || !Number.isFinite(this.mouseOffsetY)) {
      this.mouseOffsetX = 0;
      this.mouseOffsetY = 0;
    }
    if (!Number.isFinite(this.targetOffsetX) || !Number.isFinite(this.targetOffsetY)) {
      this.targetOffsetX = 0;
      this.targetOffsetY = 0;
    }

    const cx = this.width / 2 + this.mouseOffsetX;
    const cy = this.height / 2 + this.mouseOffsetY;
    const maxRadius = Math.min(this.width, this.height) * 0.44;

    // ถ้าแคนวาสยังไม่มีขนาดจริง ให้ข้ามเฟรมนี้ไปก่อนแล้วรอเฟรมถัดไป
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !(maxRadius > 0)) {
      this.animationFrameId = requestAnimationFrame(() => this.render());
      return;
    }

    // Smooth inertia interpolation
    this.mouseOffsetX += (this.targetOffsetX - this.mouseOffsetX) * 0.05;
    this.mouseOffsetY += (this.targetOffsetY - this.mouseOffsetY) * 0.05;

    if (!this.prefersReducedMotion) {
      this.rotation += 0.0015;
    }

    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Ambient Background Glow
    const bgGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 1.1);
    bgGlow.addColorStop(0, 'rgba(229, 195, 120, 0.08)');
    bgGlow.addColorStop(0.6, 'rgba(67, 97, 238, 0.03)');
    bgGlow.addColorStop(1, 'rgba(12, 13, 16, 0)');
    ctx.fillStyle = bgGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 1.1, 0, Math.PI * 2);
    ctx.fill();

    // 2. Outer Meridian Coordinate Rings
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(197, 160, 89, 0.2)';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. 12 Zodiacal Division Nodes
    for (let i = 0; i < 12; i++) {
      const angle = this.rotation + (i * Math.PI) / 6;
      const x1 = cx + Math.cos(angle) * (maxRadius * 0.92);
      const y1 = cy + Math.sin(angle) * (maxRadius * 0.92);
      const x2 = cx + Math.cos(angle) * maxRadius;
      const y2 = cy + Math.sin(angle) * maxRadius;

      ctx.strokeStyle = 'rgba(229, 195, 120, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Node Pearl
      ctx.fillStyle = '#E5C378';
      ctx.beginPath();
      ctx.arc(x1, y1, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Tilted Ecliptic Astrolabe Ellipse
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation * 0.6 - 0.41); // ~23.5 deg tilt
    ctx.strokeStyle = 'rgba(229, 195, 120, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, maxRadius * 0.82, maxRadius * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 5. Counter-Orbit Ring
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-this.rotation * 0.8);
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, maxRadius * 0.65, maxRadius * 0.5, 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 6. Central Celestial 8-Point Compass Star
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation * 0.4);
    
    ctx.fillStyle = 'rgba(242, 223, 171, 0.85)';
    ctx.beginPath();
    const starR = maxRadius * 0.28;
    const innerR = maxRadius * 0.08;
    for (let i = 0; i < 8; i++) {
      const a1 = (i * Math.PI) / 4;
      const a2 = a1 + Math.PI / 8;
      const x1 = Math.cos(a1) * (i % 2 === 0 ? starR : starR * 0.6);
      const y1 = Math.sin(a1) * (i % 2 === 0 ? starR : starR * 0.6);
      const x2 = Math.cos(a2) * innerR;
      const y2 = Math.sin(a2) * innerR;
      if (i === 0) ctx.moveTo(x1, y1);
      else ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fill();

    // Central Luminary Node
    ctx.fillStyle = '#0C0D10';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    this.animationFrameId = requestAnimationFrame(() => this.render());
  }
}
