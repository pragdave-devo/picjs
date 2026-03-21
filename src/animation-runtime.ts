// animation-runtime.ts — Embedded JS runtime for PicJS animated SVGs
// This file is compiled/minified and embedded as a <script> in animated SVGs.
// It reads the JSON animation data from <script type="application/json" data-picjs-anim>
// and drives playback via requestAnimationFrame.

// The runtime is exported as a string constant for embedding.

export const ANIMATION_RUNTIME = `
(function() {
  var svg = document.currentScript.closest('svg');
  if (!svg) return;
  var dataEl = svg.querySelector('script[data-picjs-anim]');
  if (!dataEl) return;
  var data;
  try { data = JSON.parse(dataEl.textContent); } catch(e) { return; }
  var anims = data.animations || [];
  var connectors = data.connectors || [];
  if (anims.length === 0) return;

  // Compute total duration
  var totalDuration = 0;
  anims.forEach(function(a) {
    var end = (a.startTime != null ? a.startTime : 0) + a.duration;
    if (a.endTime != null) end = a.endTime;
    var bounceEnd = a.bounceEnd || 0;
    if (end + bounceEnd > totalDuration) totalDuration = end + bounceEnd;
  });
  if (totalDuration <= 0) totalDuration = 1;

  // Easing functions
  function easeIn(t, fn) {
    switch(fn) {
      case 'quad': return t * t;
      case 'cubic': return t * t * t;
      case 'exponential': return t <= 0 ? 0 : Math.pow(2, 10 * (t - 1));
      default: return t;
    }
  }
  function easeOut(t, fn) {
    switch(fn) {
      case 'quad': return 1 - (1-t)*(1-t);
      case 'cubic': return 1 - Math.pow(1-t, 3);
      case 'exponential': return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
      default: return t;
    }
  }
  function applyEasing(t, eIn, eOut) {
    if (eIn === 'linear' && eOut === 'linear') return t;
    if (eIn !== 'linear' && eOut !== 'linear') {
      // Both: ease in first half, ease out second half
      if (t < 0.5) return easeIn(t * 2, eIn) * 0.5;
      return 0.5 + easeOut((t - 0.5) * 2, eOut) * 0.5;
    }
    if (eIn !== 'linear') return easeIn(t, eIn);
    return easeOut(t, eOut);
  }

  // Color interpolation in HSL space
  function intToRGB(v) {
    var iv = Math.round(v);
    return [(iv >> 16) & 0xFF, (iv >> 8) & 0xFF, iv & 0xFF];
  }
  function rgbToHSL(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h, s, l];
  }
  function hslToRGB(h, s, l) {
    if (s === 0) { var v = Math.round(l * 255); return [v, v, v]; }
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    return [
      Math.round(hue2rgb(p, q, h + 1/3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1/3) * 255)
    ];
  }
  function lerpColor(from, to, t) {
    var c1 = intToRGB(from), c2 = intToRGB(to);
    var h1 = rgbToHSL(c1[0], c1[1], c1[2]);
    var h2 = rgbToHSL(c2[0], c2[1], c2[2]);
    // Shortest hue path
    var dh = h2[0] - h1[0];
    if (dh > 0.5) dh -= 1;
    if (dh < -0.5) dh += 1;
    var h = h1[0] + dh * t;
    if (h < 0) h += 1; if (h > 1) h -= 1;
    var s = h1[1] + (h2[1] - h1[1]) * t;
    var l = h1[2] + (h2[2] - h1[2]) * t;
    var rgb = hslToRGB(h, s, l);
    return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
  }
  function intToCSS(v) {
    var rgb = intToRGB(v);
    return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
  }

  // Lerp for numbers
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Cache element lookups
  var elemCache = {};
  function getElem(id) {
    if (!elemCache[id]) elemCache[id] = svg.querySelector('[data-picjs-id="' + id + '"]');
    return elemCache[id];
  }

  // Initial state capture (from values in the animation data)
  var initialState = {};

  // Apply a single alter at progress t
  function applyAlter(alter, t) {
    var el = getElem(alter.targetId);
    if (!el) return;
    var prop = alter.property;
    var from = alter.fromValue;
    var to = alter.toValue;

    if (prop === 'fill' || prop === 'color') {
      // Color interpolation
      var colorStr = t <= 0 ? intToCSS(from) : t >= 1 ? intToCSS(to) : lerpColor(from, to, t);
      // Apply to all child elements with matching style
      var styleProp = prop === 'fill' ? 'fill' : 'stroke';
      var children = el.querySelectorAll('path, rect, circle, ellipse, polygon, line');
      children.forEach(function(c) {
        var style = c.getAttribute('style') || '';
        style = style.replace(new RegExp(styleProp + ':[^;]+;?'), styleProp + ':' + colorStr + ';');
        c.setAttribute('style', style);
      });
    } else if (prop === 'opacity') {
      var val = lerp(from, to, t);
      el.style.opacity = val;
    } else if (prop === 'cx' || prop === 'cy') {
      // Position animation via transform translate
      var key = alter.targetId;
      if (!initialState[key]) initialState[key] = { dx: 0, dy: 0 };
      if (prop === 'cx') initialState[key].dx = lerp(0, to - from, t);
      else initialState[key].dy = lerp(0, to - from, t);
      el.setAttribute('transform', 'translate(' + initialState[key].dx + ',' + initialState[key].dy + ')');
    } else if (prop === 'width' || prop === 'height' || prop === 'radius' || prop === 'sw') {
      // Dimension changes — scale the group
      // For now, just apply as a transform scale factor
      var val = lerp(from, to, t);
      // Store for potential combined transforms
    }
  }

  // Apply bounce effect
  function applyBounce(alter, bounceTime, bounceDuration) {
    if (bounceDuration <= 0) return;
    var el = getElem(alter.targetId);
    if (!el) return;
    var t = bounceTime / bounceDuration;
    var decay = Math.cos(t * Math.PI * 3) * (1 - t) * 0.1; // Dampened oscillation
    var prop = alter.property;
    if (prop === 'cx' || prop === 'cy') {
      var key = alter.targetId;
      if (!initialState[key]) initialState[key] = { dx: 0, dy: 0 };
      var range = alter.toValue - alter.fromValue;
      if (prop === 'cx') initialState[key].dx = range + decay * range;
      else initialState[key].dy = range + decay * range;
      el.setAttribute('transform', 'translate(' + initialState[key].dx + ',' + initialState[key].dy + ')');
    }
  }

  // Main render at time t (seconds)
  function renderAtTime(t) {
    // Reset position state
    for (var k in initialState) initialState[k] = { dx: 0, dy: 0 };

    anims.forEach(function(anim) {
      var start = anim.startTime != null ? anim.startTime : (anim.endTime != null ? anim.endTime - anim.duration : 0);
      var end = start + anim.duration;

      anim.alterations.forEach(function(alter) {
        if (t < start) {
          // Before animation: show from value
          applyAlter(alter, 0);
        } else if (t >= start && t <= end) {
          // During animation
          var progress = anim.duration > 0 ? (t - start) / anim.duration : 1;
          progress = applyEasing(progress, anim.easeIn, anim.easeOut);
          applyAlter(alter, progress);
        } else if (t > end) {
          // After animation: show to value
          applyAlter(alter, 1);
          // Apply bounce if specified
          var bounceEnd = anim.bounceEnd || 0;
          if (bounceEnd > 0 && t <= end + bounceEnd) {
            applyBounce(alter, t - end, bounceEnd);
          }
        }
      });
    });
  }

  // Playback state
  var playing = false;
  var currentTime = 0;
  var speed = 1;
  var startTimestamp = null;
  var startOffset = 0;

  function tick(timestamp) {
    if (!playing) return;
    if (startTimestamp === null) startTimestamp = timestamp;
    currentTime = startOffset + (timestamp - startTimestamp) * 0.001 * speed;
    if (currentTime >= totalDuration) {
      currentTime = totalDuration;
      playing = false;
    }
    renderAtTime(currentTime);
    updateControls();
    if (playing) requestAnimationFrame(tick);
  }

  function play() {
    if (currentTime >= totalDuration) {
      currentTime = 0;
      startOffset = 0;
    } else {
      startOffset = currentTime;
    }
    playing = true;
    startTimestamp = null;
    requestAnimationFrame(tick);
  }

  function pause() {
    playing = false;
    startOffset = currentTime;
  }

  function seek(t) {
    currentTime = Math.max(0, Math.min(t, totalDuration));
    startOffset = currentTime;
    startTimestamp = null;
    renderAtTime(currentTime);
    updateControls();
  }

  function setSpeed(s) { speed = s; startOffset = currentTime; startTimestamp = null; }

  // Controls UI (created on demand)
  var controlsEl = null;
  var scrubber = null;
  var timeDisplay = null;
  var playBtn = null;

  function formatTime(t) {
    var s = Math.floor(t);
    var ms = Math.floor((t - s) * 10);
    return s + '.' + ms + 's';
  }

  function updateControls() {
    if (!scrubber || !timeDisplay || !playBtn) return;
    scrubber.value = (currentTime / totalDuration * 1000).toString();
    timeDisplay.textContent = formatTime(currentTime) + ' / ' + formatTime(totalDuration);
    playBtn.textContent = playing ? '\\u23F8' : '\\u25B6';
  }

  function createControls() {
    var ns = 'http://www.w3.org/2000/svg';
    var fo = document.createElementNS(ns, 'foreignObject');
    var vb = svg.viewBox.baseVal;
    var ctrlH = 30;
    fo.setAttribute('x', vb.x.toString());
    fo.setAttribute('y', (vb.y + vb.height).toString());
    fo.setAttribute('width', vb.width.toString());
    fo.setAttribute('height', ctrlH.toString());

    // Expand viewBox to accommodate controls
    svg.setAttribute('viewBox', vb.x + ' ' + vb.y + ' ' + vb.width + ' ' + (vb.height + ctrlH));

    var div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:4px;padding:2px 4px;font:11px system-ui;background:#f5f5f5;border-top:1px solid #ddd;height:' + ctrlH + 'px;box-sizing:border-box;';

    playBtn = document.createElement('button');
    playBtn.textContent = '\\u25B6';
    playBtn.style.cssText = 'border:none;background:none;font-size:14px;cursor:pointer;padding:0 4px;';
    playBtn.onclick = function() { playing ? pause() : play(); updateControls(); };

    var rewindBtn = document.createElement('button');
    rewindBtn.textContent = '\\u23EE';
    rewindBtn.style.cssText = 'border:none;background:none;font-size:14px;cursor:pointer;padding:0 4px;';
    rewindBtn.onclick = function() { seek(0); };

    scrubber = document.createElement('input');
    scrubber.type = 'range';
    scrubber.min = '0';
    scrubber.max = '1000';
    scrubber.value = '0';
    scrubber.style.cssText = 'flex:1;height:12px;cursor:pointer;';
    scrubber.oninput = function() { seek(parseFloat(scrubber.value) / 1000 * totalDuration); };

    timeDisplay = document.createElement('span');
    timeDisplay.style.cssText = 'min-width:80px;text-align:right;font-variant-numeric:tabular-nums;';

    var speedSel = document.createElement('select');
    speedSel.style.cssText = 'font-size:11px;border:1px solid #ccc;border-radius:2px;';
    [0.5, 1, 2, 4].forEach(function(s) {
      var opt = document.createElement('option');
      opt.value = s.toString();
      opt.textContent = s + 'x';
      if (s === 1) opt.selected = true;
      speedSel.appendChild(opt);
    });
    speedSel.onchange = function() { setSpeed(parseFloat(speedSel.value)); };

    div.appendChild(playBtn);
    div.appendChild(rewindBtn);
    div.appendChild(scrubber);
    div.appendChild(timeDisplay);
    div.appendChild(speedSel);
    fo.appendChild(div);
    svg.appendChild(fo);
    controlsEl = fo;
    updateControls();
  }

  // Initialize
  renderAtTime(0);
  createControls();
})();
`;
