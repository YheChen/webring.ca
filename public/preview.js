// ── Site preview (Explore panel) ──
(function() {
  var MEMBERS = window.__PREVIEW_MEMBERS || [];
  var panel = document.getElementById('preview-panel');
  if (!panel || !MEMBERS.length) return;

  var iframeWrap = document.getElementById('preview-iframe-wrap');
  var skeleton = document.getElementById('preview-skeleton');
  var skeletonName = document.getElementById('preview-skeleton-name');
  var fallbackEl = document.getElementById('preview-fallback');
  var fallbackName = document.getElementById('preview-fallback-name');
  var fallbackMeta = document.getElementById('preview-fallback-meta');
  var fallbackLink = document.getElementById('preview-fallback-link');
  var nameEl = document.getElementById('preview-name');
  var urlEl = document.getElementById('preview-url');
  var cityEl = document.getElementById('preview-city');
  var openEl = document.getElementById('preview-open');
  var prevBtn = document.getElementById('preview-prev');
  var nextBtn = document.getElementById('preview-next');
  var overlay = document.getElementById('preview-overlay');

  // On touch devices, show "Tap to interact" instead of "Click to interact"
  if (overlay && window.matchMedia('(max-width: 767px)').matches) {
    var hint = overlay.querySelector('.preview-overlay-hint');
    if (hint) hint.textContent = 'Tap to interact';
  }

  var currentIdx = Math.floor(Math.random() * MEMBERS.length);
  var currentIframe = null;
  var loadTimer = null;
  var isActive = false;
  var isSettled = false;

  // Hide all preview content until panel is active
  panel.style.opacity = '0';
  panel.style.transition = 'opacity 0.2s';

  function updateControls(idx) {
    var m = MEMBERS[idx];
    nameEl.textContent = m.name;
    try { urlEl.textContent = new URL(m.url).hostname.replace(/^www\./, ''); } catch(e) { urlEl.textContent = m.url; }
    urlEl.href = m.url;
    cityEl.textContent = m.city;
    openEl.href = m.url;
  }

  function destroyPreview() {
    if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; }
    if (currentIframe) { currentIframe.remove(); currentIframe = null; }
    fallbackEl.style.display = 'none';
    skeleton.style.display = 'flex';
    overlay.classList.remove('is-dismissed', 'is-fading');
    overlay.classList.add('is-loading');
  }

  function showFallback(idx) {
    var m = MEMBERS[idx];
    skeleton.style.display = 'none';
    if (currentIframe) { currentIframe.remove(); currentIframe = null; }
    fallbackName.textContent = m.name;
    fallbackMeta.textContent = m.city || '';
    fallbackLink.href = m.url;
    fallbackEl.style.display = 'flex';
    overlay.classList.remove('is-loading');
  }

  function loadPreview(idx) {
    destroyPreview();
    var m = MEMBERS[idx];
    updateControls(idx);

    // Skip iframe entirely for sites that block framing
    if (m.frameable === false) {
      showFallback(idx);
      return;
    }

    skeletonName.textContent = m.name;

    var iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.setAttribute('title', m.name + ' website');
    currentIframe = iframe;

    loadTimer = setTimeout(function() {
      if (currentIframe === iframe) showFallback(idx);
    }, 5000);

    iframe.addEventListener('load', function() {
      if (currentIframe !== iframe) return;
      clearTimeout(loadTimer);
      loadTimer = null;

      try {
        iframe.contentWindow.location.href;
        showFallback(idx);
      } catch(e) {
        skeleton.style.display = 'none';
        iframe.classList.add('is-loaded');
        overlay.classList.remove('is-loading');
      }
    });

    iframe.addEventListener('error', function() {
      if (currentIframe === iframe) {
        clearTimeout(loadTimer);
        showFallback(idx);
      }
    });

    iframe.src = m.url;
    iframeWrap.appendChild(iframe);
  }

  prevBtn.addEventListener('click', function() {
    currentIdx = (currentIdx - 1 + MEMBERS.length) % MEMBERS.length;
    if (isActive) loadPreview(currentIdx);
  });

  nextBtn.addEventListener('click', function() {
    currentIdx = (currentIdx + 1) % MEMBERS.length;
    if (isActive) loadPreview(currentIdx);
  });

  // Click overlay to dismiss and interact with iframe
  var pendingDismiss = false;
  overlay.addEventListener('click', function(e) {
    e.stopPropagation();
    if (overlay.classList.contains('is-dismissed')) return;

    // Fade the hint immediately, snap the ring, dismiss after settle
    overlay.classList.add('is-fading');
    pendingDismiss = true;
    ringEl.dispatchEvent(new CustomEvent('snapto', { detail: { index: EXPLORE_INDEX } }));
  });

  // Show/hide the hint based on settled state
  function updateOverlayState() {
    overlay.classList.toggle('is-ready', isSettled);
  }

  function restoreOverlay() {
    if (!overlay.classList.contains('is-dismissed')) return;
    overlay.classList.remove('is-dismissed', 'is-fading');
    if (currentIframe) {
      currentIframe.classList.remove('is-interactive');
      currentIframe.blur();
    }
    window.focus();
  }

  // Escape restores the overlay when parent has focus
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') restoreOverlay();
  });

  // Click anywhere on the parent page (outside iframe) restores overlay
  document.addEventListener('mousedown', function(e) {
    if (!overlay.classList.contains('is-dismissed')) return;
    if (!currentIframe || !currentIframe.contains(e.target)) {
      restoreOverlay();
    }
  });

  // When iframe steals focus, restore overlay once the parent regains it
  window.addEventListener('blur', function() {
    if (!overlay.classList.contains('is-dismissed')) return;
    window.addEventListener('focus', function onFocus() {
      window.removeEventListener('focus', onFocus);
      restoreOverlay();
    });
  });

  // When user scrolls over the dismissed overlay, restore it so ring handles scroll
  overlay.addEventListener('wheel', function() {
    if (overlay.classList.contains('is-dismissed')) {
      restoreOverlay();
      isSettled = false;
    }
  });

  // Desktop: listen for panelchange events from scroll handler
  var EXPLORE_INDEX = 3;
  var ringEl = document.getElementById('ring');

  ringEl.addEventListener('panelchange', function(e) {
    if (e.detail.index === EXPLORE_INDEX && !isActive) {
      isActive = true;
      panel.style.opacity = '1';
      loadPreview(currentIdx);
    } else if (e.detail.index !== EXPLORE_INDEX && isActive) {
      isActive = false;
      isSettled = false;
      panel.style.opacity = '0';
      destroyPreview();
    }
  });

  // Re-enable overlay when scrolling starts (prevent iframe from capturing scroll)
  ringEl.addEventListener('panelunsettle', function() {
    isSettled = false;
    restoreOverlay();
    updateOverlayState();
  });

  // Allow interaction only when ring settles on this panel
  ringEl.addEventListener('panelsettle', function(e) {
    if (e.detail.index === EXPLORE_INDEX && isActive) {
      isSettled = true;
      updateOverlayState();
      if (pendingDismiss) {
        pendingDismiss = false;
        overlay.classList.add('is-dismissed');
        if (currentIframe) currentIframe.classList.add('is-interactive');
      }
    }
  });

  // Mobile: use IntersectionObserver (scroll handler doesn't run on mobile)
  if (window.matchMedia('(max-width: 767px)').matches) {
    var panelEl = panel.closest('.panel');
    if (panelEl && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && !isActive) {
            isActive = true;
            panel.style.opacity = '1';
            loadPreview(currentIdx);
          } else if (!entry.isIntersecting && isActive) {
            isActive = false;
            panel.style.opacity = '0';
            destroyPreview();
          }
        });
      }, { threshold: 0.5 });
      observer.observe(panelEl);
    }
  }
})();
