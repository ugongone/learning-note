/* ============================================================
   Media Lightbox v1.0
   - <img>/<video> に data-lightbox 属性を付けるだけで動作
   - もしくは data-lightbox-auto を <body> や任意の親要素に付けると、
     その配下の <img> と <video> をすべて自動対象化
   - 画像はクリック、動画はダブルクリックで開く（再生操作と競合しないため）
   - ズーム: ホイール / ピンチ / +/- キー / ボタン
   - パン: ドラッグ
   - 閉じる: 背景クリック / Esc / × ボタン
   ============================================================ */
(function () {
  if (window.__mediaLightboxLoaded) return;
  window.__mediaLightboxLoaded = true;

  const MIN_SCALE = 0.5;
  const MAX_SCALE = 6;

  // --- DOM 構築 ---
  const overlay = document.createElement('div');
  overlay.className = 'lb-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', '拡大表示');
  overlay.innerHTML = `
    <div class="lb-stage" data-lb-stage>
      <div class="lb-hint">ホイール / ピンチで拡大・縮小、ドラッグで移動、Esc で閉じる</div>
      <div class="lb-toolbar">
        <button type="button" class="lb-btn" data-lb-action="zoom-out" aria-label="縮小">−</button>
        <button type="button" class="lb-btn" data-lb-action="reset" aria-label="リセット">⤢</button>
        <button type="button" class="lb-btn" data-lb-action="zoom-in" aria-label="拡大">＋</button>
        <button type="button" class="lb-btn" data-lb-action="close" aria-label="閉じる">✕</button>
      </div>
      <div class="lb-zoom" data-lb-zoom>100%</div>
    </div>
  `;

  function mount() {
    if (!document.body.contains(overlay)) document.body.appendChild(overlay);
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  const stage = overlay.querySelector('[data-lb-stage]');
  const zoomLabel = overlay.querySelector('[data-lb-zoom]');

  // --- 状態 ---
  let currentEl = null;
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOriginX = 0;
  let dragOriginY = 0;
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  const activeTouches = new Map();

  // --- 操作 ---
  function applyTransform() {
    if (!currentEl) return;
    currentEl.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    if (zoomLabel) zoomLabel.textContent = Math.round(scale * 100) + '%';
  }
  function reset() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  }
  function setScale(next, originX, originY) {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
    if (originX != null && originY != null) {
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = originX - cx;
      const dy = originY - cy;
      const ratio = clamped / scale;
      translateX = dx - (dx - translateX) * ratio;
      translateY = dy - (dy - translateY) * ratio;
    }
    scale = clamped;
    applyTransform();
  }

  function open(srcEl) {
    if (currentEl) currentEl.remove();
    const tag = srcEl.tagName.toLowerCase();
    if (tag === 'img') {
      currentEl = document.createElement('img');
      currentEl.src = srcEl.currentSrc || srcEl.src;
      currentEl.alt = srcEl.alt || '';
    } else if (tag === 'video') {
      currentEl = document.createElement('video');
      currentEl.src = srcEl.currentSrc || srcEl.src;
      currentEl.controls = true;
      currentEl.playsInline = true;
    } else {
      return;
    }
    currentEl.className = 'lb-content';
    stage.appendChild(currentEl);
    reset();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (currentEl) {
      if (currentEl.tagName.toLowerCase() === 'video') currentEl.pause();
      currentEl.remove();
      currentEl = null;
    }
  }

  // --- 対象要素にハンドラ付与 ---
  function attach(el) {
    if (el.__lbAttached) return;
    el.__lbAttached = true;
    const tag = el.tagName.toLowerCase();
    if (tag === 'img') {
      el.addEventListener('click', () => open(el));
    } else if (tag === 'video') {
      // 再生コントロールと競合しないようダブルクリックで開く
      el.addEventListener('dblclick', (e) => {
        e.preventDefault();
        open(el);
      });
    }
  }
  function scan(root) {
    const ctx = root || document;
    // 明示的にマークされた要素
    ctx.querySelectorAll('img[data-lightbox], video[data-lightbox]').forEach(attach);
    // data-lightbox-auto コンテナ配下を一括対象化
    ctx.querySelectorAll('[data-lightbox-auto]').forEach(container => {
      container.querySelectorAll('img, video').forEach(el => {
        if (!el.hasAttribute('data-lightbox-skip')) attach(el);
      });
    });
  }
  function init() {
    scan(document);
    // 後から DOM が増えても拾う
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          scan(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 公開 API
  window.MediaLightbox = {
    open,
    close,
    attach,
    refresh: scan,
  };

  // --- 操作ハンドラ ---
  overlay.addEventListener('click', (e) => {
    const action = e.target.closest('[data-lb-action]')?.dataset.lbAction;
    if (action === 'close') return close();
    if (action === 'reset') return reset();
    if (action === 'zoom-in') return setScale(scale * 1.25);
    if (action === 'zoom-out') return setScale(scale / 1.25);
    // 背景 / ステージクリックで閉じる
    if (e.target === overlay || e.target === stage) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === '+' || e.key === '=') setScale(scale * 1.25);
    else if (e.key === '-' || e.key === '_') setScale(scale / 1.25);
    else if (e.key === '0') reset();
  });

  stage.addEventListener('wheel', (e) => {
    if (!currentEl) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setScale(scale * factor, e.clientX, e.clientY);
  }, { passive: false });

  // ドラッグでパン
  stage.addEventListener('pointerdown', (e) => {
    if (!currentEl) return;
    if (e.target.closest('.lb-btn')) return;
    if (e.pointerType === 'touch' && e.isPrimary === false) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOriginX = translateX;
    dragOriginY = translateY;
    currentEl.classList.add('is-dragging');
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });
  stage.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    translateX = dragOriginX + (e.clientX - dragStartX);
    translateY = dragOriginY + (e.clientY - dragStartY);
    applyTransform();
  });
  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    if (currentEl) currentEl.classList.remove('is-dragging');
    try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  // タッチ ピンチズーム
  stage.addEventListener('touchstart', (e) => {
    for (const t of e.changedTouches) activeTouches.set(t.identifier, t);
    if (activeTouches.size === 2) {
      const [a, b] = [...activeTouches.values()];
      pinchStartDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStartScale = scale;
      isDragging = false;
    }
  }, { passive: true });
  stage.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) activeTouches.set(t.identifier, t);
    if (activeTouches.size === 2) {
      e.preventDefault();
      const [a, b] = [...activeTouches.values()];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const next = pinchStartScale * (dist / pinchStartDist);
      const cx = (a.clientX + b.clientX) / 2;
      const cy = (a.clientY + b.clientY) / 2;
      setScale(next, cx, cy);
    }
  }, { passive: false });
  stage.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) activeTouches.delete(t.identifier);
  });

  // ダブルクリックで 100% / 200% トグル
  stage.addEventListener('dblclick', (e) => {
    if (!currentEl) return;
    if (e.target.closest('.lb-btn')) return;
    if (Math.abs(scale - 1) < 0.01) setScale(2, e.clientX, e.clientY);
    else reset();
  });
})();
