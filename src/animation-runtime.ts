// animation-runtime.ts — Modular animation driver for PicJS SVGs
//
// Usage:
//   import { createAnimator } from './animation-runtime';
//   const animator = createAnimator(svgElement);
//   if (animator) { animator.play(); }

export interface Animator {
  play(): void;
  pause(): void;
  toggle(): void;
  seek(t: number): void;
  rewind(): void;
  getTime(): number;
  getDuration(): number;
  isPlaying(): boolean;
  getSpeed(): number;
  setSpeed(s: number): void;
  onUpdate(cb: (time: number, duration: number, playing: boolean) => void): void;
  destroy(): void;
}

interface AnimData {
  animations: any[];
  connectors: any[];
}

export function createAnimator(svg: SVGSVGElement): Animator | null {
  const dataEl = svg.querySelector('script[data-picjs-anim]');
  if (!dataEl) return null;
  let data: AnimData;
  try { data = JSON.parse(dataEl.textContent || ''); } catch { return null; }
  const anims = data.animations || [];
  const connectors = data.connectors || [];
  if (anims.length === 0) return null;

  // Compute total duration
  let totalDuration = 0;
  for (const a of anims) {
    const end = (a.startTime ?? 0) + a.duration;
    const bounceEnd = a.bounceEnd || 0;
    if (end + bounceEnd > totalDuration) totalDuration = end + bounceEnd;
  }
  if (totalDuration <= 0) totalDuration = 1;

  // --- Easing ---
  function easeIn(t: number, fn: string): number {
    switch (fn) {
      case 'quad': return t * t;
      case 'cubic': return t * t * t;
      case 'exponential': return t <= 0 ? 0 : Math.pow(2, 10 * (t - 1));
      default: return t;
    }
  }
  function easeOut(t: number, fn: string): number {
    switch (fn) {
      case 'quad': return 1 - (1 - t) * (1 - t);
      case 'cubic': return 1 - Math.pow(1 - t, 3);
      case 'exponential': return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
      default: return t;
    }
  }
  function applyEasing(t: number, eIn: string, eOut: string): number {
    if (eIn === 'linear' && eOut === 'linear') return t;
    if (eIn !== 'linear' && eOut !== 'linear') {
      if (t < 0.5) return easeIn(t * 2, eIn) * 0.5;
      return 0.5 + easeOut((t - 0.5) * 2, eOut) * 0.5;
    }
    if (eIn !== 'linear') return easeIn(t, eIn);
    return easeOut(t, eOut);
  }

  // --- Color interpolation (HSL space) ---
  function intToRGB(v: number): [number, number, number] {
    const iv = Math.round(v);
    return [(iv >> 16) & 0xFF, (iv >> 8) & 0xFF, iv & 0xFF];
  }
  function rgbToHSL(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h, s, l];
  }
  function hslToRGB(h: number, s: number, l: number): [number, number, number] {
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    function hue2rgb(p: number, q: number, t: number) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
      Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
    ];
  }
  function lerpColor(from: number, to: number, t: number): string {
    const c1 = intToRGB(from), c2 = intToRGB(to);
    const h1 = rgbToHSL(c1[0], c1[1], c1[2]);
    const h2 = rgbToHSL(c2[0], c2[1], c2[2]);
    let dh = h2[0] - h1[0];
    if (dh > 0.5) dh -= 1;
    if (dh < -0.5) dh += 1;
    let h = h1[0] + dh * t;
    if (h < 0) h += 1; if (h > 1) h -= 1;
    const s = h1[1] + (h2[1] - h1[1]) * t;
    const l = h1[2] + (h2[2] - h1[2]) * t;
    const rgb = hslToRGB(h, s, l);
    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  }
  function intToCSS(v: number): string {
    const rgb = intToRGB(v);
    return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
  }

  function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

  // --- Element cache ---
  const elemCache: Record<string, Element | null> = {};
  function getElem(id: string): Element | null {
    if (!(id in elemCache)) elemCache[id] = svg.querySelector(`[data-picjs-id="${id}"]`);
    return elemCache[id];
  }

  // --- Position tracking ---
  const posState: Record<string, { dx: number; dy: number }> = {};

  function applyAlter(alter: any, t: number): void {
    const el = getElem(alter.targetId) as HTMLElement | null;
    if (!el) return;
    const prop = alter.property;
    const from = alter.fromValue;
    const to = alter.toValue;

    if (prop === 'fill' || prop === 'color') {
      const colorStr = t <= 0 ? intToCSS(from) : t >= 1 ? intToCSS(to) : lerpColor(from, to, t);
      if (prop === 'fill') {
        el.querySelectorAll('path, rect, circle, ellipse, polygon').forEach(c => {
          let style = c.getAttribute('style') || '';
          style = style.replace(/fill:[^;]+;?/, `fill:${colorStr};`);
          c.setAttribute('style', style);
        });
      } else {
        el.querySelectorAll('path, rect, circle, ellipse, polygon, line').forEach(c => {
          let style = c.getAttribute('style') || '';
          if (style.indexOf('stroke:') >= 0) {
            style = style.replace(/stroke:[^;]+;?/, `stroke:${colorStr};`);
          } else {
            style += `stroke:${colorStr};`;
          }
          c.setAttribute('style', style);
        });
        el.querySelectorAll('text').forEach(c => c.setAttribute('fill', colorStr));
      }
    } else if (prop === 'opacity') {
      const val = lerp(from, to, t);
      el.style.opacity = String(val);
      el.querySelectorAll('[style*="opacity"]').forEach(c => {
        (c as HTMLElement).style.opacity = '';
      });
    } else if (prop === 'cx' || prop === 'cy') {
      const key = alter.targetId;
      if (!posState[key]) posState[key] = { dx: 0, dy: 0 };
      if (prop === 'cx') posState[key].dx = lerp(0, to - from, t);
      else posState[key].dy = lerp(0, to - from, t);
      el.setAttribute('transform', `translate(${posState[key].dx},${posState[key].dy})`);
    }
  }

  function applyBounce(alter: any, bounceTime: number, bounceDuration: number): void {
    if (bounceDuration <= 0) return;
    const el = getElem(alter.targetId) as HTMLElement | null;
    if (!el) return;
    const t = bounceTime / bounceDuration;
    const decay = Math.cos(t * Math.PI * 3) * (1 - t) * 0.1;
    const prop = alter.property;
    if (prop === 'cx' || prop === 'cy') {
      const key = alter.targetId;
      if (!posState[key]) posState[key] = { dx: 0, dy: 0 };
      const range = alter.toValue - alter.fromValue;
      if (prop === 'cx') posState[key].dx = range + decay * range;
      else posState[key].dy = range + decay * range;
      el.setAttribute('transform', `translate(${posState[key].dx},${posState[key].dy})`);
    }
  }

  // --- Connector tracking ---
  const connCache: Record<string, any> = {};

  function initConnectors(): void {
    for (const c of connectors) {
      const el = getElem(c.lineId);
      if (!el || connCache[c.lineId]) continue;
      const path = el.querySelector('path');
      if (!path) continue;
      const d = path.getAttribute('d') || '';
      const nums = d.match(/-?[\d.]+/g);
      if (!nums || nums.length < 4) continue;
      const pts: number[][] = [];
      for (let i = 0; i < nums.length; i += 2) pts.push([+nums[i], +nums[i + 1]]);
      const poly = el.querySelector('polygon');
      const cache: any = { path, pts, poly: null, polyPts: null, arrowAtEnd: true };
      if (poly) {
        const raw = poly.getAttribute('points') || '';
        const pp = raw.trim().split(/\s+/).map(s => { const ab = s.split(','); return [+ab[0], +ab[1]]; });
        cache.poly = poly;
        cache.polyPts = pp;
        const endPt = pts[pts.length - 1], startPt = pts[0];
        let dEnd = 1e9, dStart = 1e9;
        for (const p of pp) {
          const de = (p[0] - endPt[0]) ** 2 + (p[1] - endPt[1]) ** 2;
          const ds = (p[0] - startPt[0]) ** 2 + (p[1] - startPt[1]) ** 2;
          if (de < dEnd) dEnd = de;
          if (ds < dStart) dStart = ds;
        }
        cache.arrowAtEnd = dEnd <= dStart;
      }
      connCache[c.lineId] = cache;
    }
  }

  function norm(x: number, y: number): [number, number] {
    const l = Math.sqrt(x * x + y * y);
    return l < 1e-10 ? [1, 0] : [x / l, y / l];
  }

  function updateConnectors(): void {
    if (connectors.length === 0) return;
    const deltas: Record<string, { start: any; end: any }> = {};
    for (const c of connectors) {
      if (!deltas[c.lineId]) deltas[c.lineId] = { start: null, end: null };
      const st = posState[c.targetId];
      deltas[c.lineId][c.endpoint as 'start' | 'end'] = st ? { dx: st.dx, dy: st.dy } : { dx: 0, dy: 0 };
    }
    for (const lineId of Object.keys(deltas)) {
      const cache = connCache[lineId];
      if (!cache) continue;
      const sd = deltas[lineId].start || { dx: 0, dy: 0 };
      const ed = deltas[lineId].end || { dx: 0, dy: 0 };
      const pts: number[][] = cache.pts;
      const n = pts.length;
      const newPts = pts.map((pt: number[], i: number) => {
        const t = n > 1 ? i / (n - 1) : 0;
        return [pt[0] + lerp(sd.dx, ed.dx, t), pt[1] + lerp(sd.dy, ed.dy, t)];
      });
      let d = `M${newPts[0][0]},${newPts[0][1]}`;
      for (let i = 1; i < n; i++) d += `L${newPts[i][0]},${newPts[i][1]}`;
      cache.path.setAttribute('d', d);
      if (cache.poly && cache.polyPts) {
        const aDelta = cache.arrowAtEnd ? ed : sd;
        const anchorEnd = cache.arrowAtEnd ? pts[n - 1] : pts[0];
        const newAnchor = [anchorEnd[0] + aDelta.dx, anchorEnd[1] + aDelta.dy];
        const oDir = norm(pts[n - 1][0] - pts[0][0], pts[n - 1][1] - pts[0][1]);
        const nDir = norm(newPts[n - 1][0] - newPts[0][0], newPts[n - 1][1] - newPts[0][1]);
        const cosA = oDir[0] * nDir[0] + oDir[1] * nDir[1];
        const sinA = oDir[0] * nDir[1] - oDir[1] * nDir[0];
        const origAnchor = anchorEnd;
        const np = cache.polyPts.map((pt: number[]) => {
          const rx = pt[0] - origAnchor[0], ry = pt[1] - origAnchor[1];
          return [newAnchor[0] + rx * cosA - ry * sinA, newAnchor[1] + rx * sinA + ry * cosA];
        });
        cache.poly.setAttribute('points', np.map((p: number[]) => `${p[0]},${p[1]}`).join(' '));
      }
    }
  }

  // --- Render at time t ---
  function renderAtTime(t: number): void {
    for (const k in posState) posState[k] = { dx: 0, dy: 0 };

    for (const anim of anims) {
      const start = anim.startTime ?? (anim.endTime != null ? anim.endTime - anim.duration : 0);
      const end = start + anim.duration;

      for (const alter of anim.alterations) {
        if (t < start) {
          applyAlter(alter, 0);
        } else if (t <= end) {
          const progress = anim.duration > 0 ? (t - start) / anim.duration : 1;
          applyAlter(alter, applyEasing(progress, anim.easeIn, anim.easeOut));
        } else {
          applyAlter(alter, 1);
          const bounceEnd = anim.bounceEnd || 0;
          if (bounceEnd > 0 && t <= end + bounceEnd) {
            applyBounce(alter, t - end, bounceEnd);
          }
        }
      }
    }
    updateConnectors();
  }

  // --- Playback state ---
  let playing = false;
  let currentTime = 0;
  let speed = 1;
  let startTimestamp: number | null = null;
  let startOffset = 0;
  let rafId: number | null = null;
  const updateCallbacks: Array<(time: number, duration: number, playing: boolean) => void> = [];

  function notifyUpdate(): void {
    for (const cb of updateCallbacks) cb(currentTime, totalDuration, playing);
  }

  function tick(timestamp: number): void {
    if (!playing) return;
    if (startTimestamp === null) startTimestamp = timestamp;
    currentTime = startOffset + (timestamp - startTimestamp) * 0.001 * speed;
    if (currentTime >= totalDuration) {
      currentTime = totalDuration;
      playing = false;
    }
    renderAtTime(currentTime);
    notifyUpdate();
    if (playing) rafId = requestAnimationFrame(tick);
  }

  // --- Initialize ---
  renderAtTime(0);
  initConnectors();

  // --- Public API ---
  const animator: Animator = {
    play() {
      if (currentTime >= totalDuration) { currentTime = 0; startOffset = 0; }
      else { startOffset = currentTime; }
      playing = true;
      startTimestamp = null;
      rafId = requestAnimationFrame(tick);
    },
    pause() {
      playing = false;
      startOffset = currentTime;
      if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
    },
    toggle() { playing ? animator.pause() : animator.play(); },
    seek(t: number) {
      currentTime = Math.max(0, Math.min(t, totalDuration));
      startOffset = currentTime;
      startTimestamp = null;
      renderAtTime(currentTime);
      notifyUpdate();
    },
    rewind() { animator.seek(0); },
    getTime() { return currentTime; },
    getDuration() { return totalDuration; },
    isPlaying() { return playing; },
    getSpeed() { return speed; },
    setSpeed(s: number) { speed = s; startOffset = currentTime; startTimestamp = null; },
    onUpdate(cb) { updateCallbacks.push(cb); },
    destroy() {
      playing = false;
      if (rafId != null) cancelAnimationFrame(rafId);
      updateCallbacks.length = 0;
    },
  };

  return animator;
}
