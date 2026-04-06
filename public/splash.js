(function() {
  var isMobile = window.matchMedia('(max-width: 767px)').matches;
  if (isMobile) return;

  var ring = document.getElementById('ring');
  var track = ring.querySelector('.ring-track');
  var panels = track.querySelectorAll('.panel:not(.panel--clone)');
  var dots = document.querySelectorAll('.ring-dot');
  var hint = document.getElementById('scroll-hint');
  var PANEL_COUNT = parseInt(ring.getAttribute('data-panel-count'), 10);
  var ANGLE_STEP = 360 / PANEL_COUNT;
  var panelW = window.innerWidth;

  // Scroll state (angle-based)
  var currentAngle = 0;
  var targetAngle = 0;
  var rawTarget = 0;
  var hasScrolled = false;

  // Tuning
  var SCROLL_EASE = 0.18;
  var STEPS_PER_PANEL = 20;
  var prevActiveIdx = -1;
  var isSettled = true;

  function computeRadius() {
    return Math.round(panelW / (2 * Math.tan(Math.PI / PANEL_COUNT)));
  }

  var radius = computeRadius();

  function snapAngle(a) {
    return Math.round(a / ANGLE_STEP) * ANGLE_STEP;
  }

  function quantize(a) {
    var step = ANGLE_STEP / STEPS_PER_PANEL;
    return Math.round(a / step) * step;
  }

  // Place each panel on the cylinder surface
  function layoutPanels() {
    for (var i = 0; i < panels.length; i++) {
      panels[i].style.transform =
        'rotateY(' + (i * ANGLE_STEP) + 'deg) translateZ(' + radius + 'px)';
    }
  }

  function renderTrack() {
    track.style.transform =
      'translateZ(' + (-radius) + 'px) rotateY(' + (-currentAngle) + 'deg)';
  }

  layoutPanels();
  renderTrack();

  // ── Wheel ──
  ring.addEventListener('wheel', function(e) {
    e.preventDefault();

    var delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 40;
    if (e.deltaMode === 2) delta *= panelW;

    // Convert pixel delta to angle delta
    rawTarget += (delta / panelW) * ANGLE_STEP;
    targetAngle = quantize(rawTarget);

    if (isSettled) {
      isSettled = false;
      ring.dispatchEvent(new CustomEvent('panelunsettle'));
    }

    if (!hasScrolled) {
      hasScrolled = true;
      hint.classList.add('is-hidden');
    }
  }, { passive: false });

  // ── Dots ──
  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      var idx = parseInt(dot.getAttribute('data-dot'), 10);
      // Find shortest rotation path to target
      var target = idx * ANGLE_STEP;
      var norm = ((currentAngle % 360) + 360) % 360;
      var diff = target - norm;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      targetAngle = currentAngle + diff;
      rawTarget = targetAngle;
      if (isSettled) { isSettled = false; ring.dispatchEvent(new CustomEvent('panelunsettle')); }
    });
  });

  // ── Keyboard ──
  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      targetAngle = snapAngle(currentAngle) + ANGLE_STEP;
      rawTarget = targetAngle;
      if (isSettled) { isSettled = false; ring.dispatchEvent(new CustomEvent('panelunsettle')); }
      if (!hasScrolled) { hasScrolled = true; hint.classList.add('is-hidden'); }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      targetAngle = snapAngle(currentAngle) - ANGLE_STEP;
      rawTarget = targetAngle;
      if (isSettled) { isSettled = false; ring.dispatchEvent(new CustomEvent('panelunsettle')); }
      if (!hasScrolled) { hasScrolled = true; hint.classList.add('is-hidden'); }
    }
  });

  // ── Tick ──
  var rafId = 0;

  function tick() {
    var diff = targetAngle - currentAngle;
    if (Math.abs(diff) > 0.05) {
      currentAngle += diff * SCROLL_EASE;
    } else {
      currentAngle = targetAngle;
    }

    renderTrack();

    // Active panel index
    var norm = ((Math.round(currentAngle / ANGLE_STEP) % PANEL_COUNT) + PANEL_COUNT) % PANEL_COUNT;
    dots.forEach(function(dot, i) {
      dot.classList.toggle('is-active', i === norm);
    });

    if (norm !== prevActiveIdx) {
      prevActiveIdx = norm;
      ring.dispatchEvent(new CustomEvent('panelchange', { detail: { index: norm } }));
    }

    // Dispatch settle event when animation finishes
    if (!isSettled && currentAngle === targetAngle) {
      isSettled = true;
      ring.dispatchEvent(new CustomEvent('panelsettle', { detail: { index: norm } }));
    }

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  // ── Pause when hidden ──
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) cancelAnimationFrame(rafId);
    else rafId = requestAnimationFrame(tick);
  });

  // ── Resize ──
  window.addEventListener('resize', function() {
    if (window.matchMedia('(max-width: 767px)').matches) return;
    panelW = window.innerWidth;
    radius = computeRadius();
    layoutPanels();
    renderTrack();
  });
})();

/* ── Webring line animation ── */
(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var lines = document.querySelectorAll('.anim-line');
  if (!lines.length) return;

  var NS = 'http://www.w3.org/2000/svg';
  var STAGGER = 700;
  var DRAW_DUR = 500;
  var DOT_LEAD = 250;
  var uid = 0;

  lines.forEach(function(line) {
    var idx = parseInt((line.className.baseVal || '').replace(/.*anim-line-(\d+).*/, '$1'), 10);
    if (isNaN(idx)) return;

    var svg = line.closest('svg');
    var len = line.getTotalLength();
    var id = 'anim-m-' + (uid++);

    // Build a mask with a solid copy of the path — acts as a reveal wipe
    var defs = svg.querySelector('defs');
    if (!defs) { defs = document.createElementNS(NS, 'defs'); svg.insertBefore(defs, svg.firstChild); }

    var mask = document.createElementNS(NS, 'mask');
    mask.setAttribute('id', id);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    var vb = svg.viewBox.baseVal;
    mask.setAttribute('x', vb.x); mask.setAttribute('y', vb.y);
    mask.setAttribute('width', vb.width); mask.setAttribute('height', vb.height);

    var rev = document.createElementNS(NS, 'path');
    rev.setAttribute('d', line.getAttribute('d'));
    rev.setAttribute('fill', 'none');
    rev.setAttribute('stroke', 'white');
    rev.setAttribute('stroke-width', '4');
    rev.setAttribute('stroke-linecap', 'round');
    rev.style.strokeDasharray = len + ' ' + len;
    rev.style.strokeDashoffset = '' + len;

    mask.appendChild(rev);
    defs.appendChild(mask);
    line.setAttribute('mask', 'url(#' + id + ')');

    // Visible line is always dashed
    line.style.strokeDasharray = '8 5';

    var delay = idx * STAGGER + DOT_LEAD;

    // Animate the mask to reveal the dashed line
    setTimeout(function() {
      rev.style.transition = 'stroke-dashoffset ' + DRAW_DUR + 'ms ease-in-out';
      rev.style.strokeDashoffset = '0';
    }, delay);
  });

  // After all lines drawn, start marching
  var totalTime = 12 * STAGGER + DOT_LEAD + DRAW_DUR + 150;
  setTimeout(function() {
    lines.forEach(function(line) {
      line.style.strokeDasharray = '';
      line.classList.add('is-marching');
    });
  }, totalTime);
})();
