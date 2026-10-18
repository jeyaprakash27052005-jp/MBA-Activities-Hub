// Cracker / confetti burst shown after a successful Submit. No dependencies.
const COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#facc15', '#22d3ee'];

type P = { x: number; y: number; vx: number; vy: number; size: number; color: string; rot: number; vr: number; life: number; shape: number };

export function celebrate(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);

  const parts: P[] = [];
  const burst = (x: number, y: number, count: number, angle: number, spread: number, power: number) => {
    for (let i = 0; i < count; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const v = power * (0.45 + Math.random() * 0.75);
      parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        size: 5 + Math.random() * 6, color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.4, life: 1, shape: (Math.random() * 3) | 0,
      });
    }
  };

  // Two "crackers" firing up from the bottom corners, then a centre burst
  burst(0, h, 90, -Math.PI / 3, 0.7, 19);
  burst(w, h, 90, (-2 * Math.PI) / 3, 0.7, 19);
  const t0 = performance.now();
  let centreFired = false;

  const frame = (now: number) => {
    const t = now - t0;
    if (!centreFired && t > 350) {
      centreFired = true;
      burst(w / 2, h * 0.38, 140, 0, Math.PI * 2, 11);
    }
    ctx.clearRect(0, 0, w, h);
    let alive = 0;
    for (const p of parts) {
      p.vy += 0.32;          // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.0085;
      if (p.life <= 0 || p.y > h + 40) continue;
      alive++;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 0) ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else if (p.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.moveTo(0, -p.size / 2); ctx.lineTo(p.size / 2, p.size / 2); ctx.lineTo(-p.size / 2, p.size / 2); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    if (alive > 0 && t < 4000) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
