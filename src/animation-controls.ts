// animation-controls.ts — Playback controls for PicJS animated SVGs
//
// Usage:
//   import { createControls } from './animation-controls';
//   const controls = createControls(containerDiv, animator);
//   // later: controls.destroy();

import type { Animator } from './animation-runtime';

export interface Controls {
  destroy(): void;
}

function formatTime(t: number): string {
  const s = Math.floor(t);
  const ms = Math.floor((t - s) * 10);
  return `${s}.${ms}s`;
}

export function createControls(container: HTMLElement, animator: Animator): Controls {
  const dur = animator.getDuration();

  const bar = document.createElement('div');
  bar.style.cssText = 'display:flex;align-items:center;gap:4px;padding:2px 4px;font:11px system-ui;background:#f5f5f5;border-top:1px solid #ddd;height:30px;box-sizing:border-box;position:sticky;bottom:0;z-index:10;';

  const playBtn = document.createElement('button');
  playBtn.textContent = '\u25B6';
  playBtn.style.cssText = 'border:none;background:none;font-size:14px;cursor:pointer;padding:0 4px;';
  playBtn.onclick = () => { animator.toggle(); };

  const rewindBtn = document.createElement('button');
  rewindBtn.textContent = '\u23EE';
  rewindBtn.style.cssText = 'border:none;background:none;font-size:14px;cursor:pointer;padding:0 4px;';
  rewindBtn.onclick = () => { animator.rewind(); };

  const scrubber = document.createElement('input');
  scrubber.type = 'range';
  scrubber.min = '0';
  scrubber.max = '1000';
  scrubber.value = '0';
  scrubber.style.cssText = 'flex:1;height:12px;cursor:pointer;';
  scrubber.oninput = () => { animator.seek(parseFloat(scrubber.value) / 1000 * dur); };

  const timeDisplay = document.createElement('span');
  timeDisplay.style.cssText = 'min-width:80px;text-align:right;font-variant-numeric:tabular-nums;';
  timeDisplay.textContent = `${formatTime(0)} / ${formatTime(dur)}`;

  const speedSel = document.createElement('select');
  speedSel.style.cssText = 'font-size:11px;border:1px solid #ccc;border-radius:2px;';
  for (const s of [0.5, 1, 2, 4]) {
    const opt = document.createElement('option');
    opt.value = String(s);
    opt.textContent = `${s}x`;
    if (s === 1) opt.selected = true;
    speedSel.appendChild(opt);
  }
  speedSel.onchange = () => { animator.setSpeed(parseFloat(speedSel.value)); };

  bar.append(playBtn, rewindBtn, scrubber, timeDisplay, speedSel);
  container.appendChild(bar);

  function sync(time: number, duration: number, playing: boolean): void {
    scrubber.value = String(time / duration * 1000);
    timeDisplay.textContent = `${formatTime(time)} / ${formatTime(duration)}`;
    playBtn.textContent = playing ? '\u23F8' : '\u25B6';
  }

  animator.onUpdate(sync);

  return {
    destroy() {
      bar.remove();
    },
  };
}
