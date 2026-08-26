/**
 * AETHRA ORACLE — Deterministic Personal Celestial Seal
 * Generates an astronomical monogram seal uniquely derived from user's name & birth data.
 */

export class CelestialSeal {
  // Simple deterministic hash
  static hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  static render(canvas, profile) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width = canvas.height = 180;
    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.42;

    const seedStr = `${profile.name}_${profile.birthDate}_${profile.birthTime}`;
    const hash = this.hashCode(seedStr);
    
    ctx.clearRect(0, 0, size, size);

    // Seal Base Glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    glow.addColorStop(0, '#1E2333');
    glow.addColorStop(0.8, '#12141D');
    glow.addColorStop(1, '#0C0D10');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer Celestial Seal Border
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Quadrant Cross Markers
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();

    // Deterministic Ring Geometry
    const ringCount = 3 + (hash % 3);
    for (let i = 0; i < ringCount; i++) {
      const ringTilt = ((hash >> (i * 3)) % 360) * (Math.PI / 180);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ringTilt);
      ctx.strokeStyle = 'rgba(229, 195, 120, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.72, r * (0.2 + (i * 0.15)), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Monogram Initial
    const initial = (profile.name || 'A')[0].toUpperCase();
    ctx.fillStyle = '#F2DFAB';
    ctx.font = '600 24px "Cinzel", "Cinzel Decorative", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial, cx, cy);

    // Planetary Nodes around rim
    const nodePoints = 4 + (hash % 5);
    for (let i = 0; i < nodePoints; i++) {
      const angle = (i * Math.PI * 2) / nodePoints + ((hash % 100) * 0.01);
      const nx = cx + Math.cos(angle) * (r * 0.88);
      const ny = cy + Math.sin(angle) * (r * 0.88);
      ctx.fillStyle = '#E5C378';
      ctx.beginPath();
      ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
