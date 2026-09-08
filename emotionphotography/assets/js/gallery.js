/* e'MoTIoN Photography — gallery, justified layout and lightbox. */
(function () {
  'use strict';

  var DATA   = window.__PHOTOS__ || { hero: null, photos: [] };
  var PHOTOS = DATA.photos || [];
  var grid   = document.getElementById('grid');
  var GAP    = 10;
  var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── helpers ─────────────────────────────────────────────────────── */

  function srcset(p, ext) {
    return p.widths.map(function (w) {
      return 'photos/' + p.base + '-' + w + '.' + ext + ' ' + w + 'w';
    }).join(', ');
  }

  // Smallest rendition that still covers the space we need.
  function pick(p, cssPx) {
    var need = cssPx * Math.min(window.devicePixelRatio || 1, 2);
    for (var i = 0; i < p.widths.length; i++) {
      if (p.widths[i] >= need) return p.widths[i];
    }
    return p.widths[p.widths.length - 1];
  }

  function targetHeight(w) {
    if (w < 900)  return 300;
    if (w < 1280) return 340;
    if (w < 1700) return 400;
    return 460;
  }

  /* ── hero ────────────────────────────────────────────────────────── */

  (function hero() {
    var h = DATA.hero, box = document.getElementById('hero-media');
    if (!h || !box) return;

    box.style.background = 'center/cover no-repeat url("' + h.lqip + '")';

    var img = new Image();
    img.alt = h.alt || '';
    img.decoding = 'async';
    img.fetchPriority = 'high';
    img.width = h.w; img.height = h.h;
    img.sizes = '100vw';
    img.srcset = srcset(h, 'jpg');
    img.src = 'photos/' + h.base + '-' + h.widths[h.widths.length - 1] + '.jpg';

    function show() { img.classList.add('is-in'); }
    if (img.complete) show(); else img.addEventListener('load', show);
    box.appendChild(img);
  })();

  /* ── justified rows ──────────────────────────────────────────────── */

  function buildRows(items, W, narrow) {
    if (narrow) return items.map(function (i) { return [i]; });

    var rows = [], row = [], sum = 0, tH = targetHeight(W);

    items.forEach(function (it) {
      if (it.feature === 'wide') {
        if (row.length) { rows.push(row); row = []; sum = 0; }
        rows.push([it]);
        return;
      }
      row.push(it);
      sum += it.w / it.h;
      if (sum * tH + GAP * (row.length - 1) >= W) {
        rows.push(row); row = []; sum = 0;
      }
    });
    if (row.length) rows.push(row);
    return rows;
  }

  function render() {
    if (!grid || !PHOTOS.length) return;

    var W = grid.clientWidth;
    if (W <= 0) return;

    var narrow = W < 640;
    var tH = targetHeight(W);
    var rows = buildRows(PHOTOS, W, narrow);
    var maxFeature = Math.min(window.innerHeight * 0.82, 900);

    var frag = document.createDocumentFragment();
    var flat = [];

    rows.forEach(function (row, ri) {
      var el = document.createElement('div');
      el.className = 'g-row';

      var aspSum = row.reduce(function (s, i) { return s + i.w / i.h; }, 0);
      var avail  = W - GAP * (row.length - 1);
      var h;

      if (narrow) {
        h = W / aspSum;
      } else if (row.length === 1 && row[0].feature === 'wide') {
        h = Math.min(W / aspSum, maxFeature);
      } else if (ri === rows.length - 1) {
        // never let a short final row balloon
        h = Math.min(avail / aspSum, tH * 1.35);
      } else {
        h = avail / aspSum;
      }

      row.forEach(function (p) {
        var w = h * (p.w / p.h);
        var btn = document.createElement('button');
        btn.className = 'tile';
        btn.type = 'button';
        btn.style.width  = w.toFixed(2) + 'px';
        btn.style.height = h.toFixed(2) + 'px';
        btn.style.background = 'center/cover no-repeat url("' + p.lqip + '")';
        btn.setAttribute('aria-label', 'Open photograph: ' + p.alt);

        var idx = PHOTOS.indexOf(p);
        btn.dataset.index = idx;

        var chosen = pick(p, w);
        var pic = document.createElement('picture');
        var s = document.createElement('source');
        s.type = 'image/webp';
        s.srcset = srcset(p, 'webp');
        s.sizes = Math.ceil(w) + 'px';

        var img = document.createElement('img');
        img.alt = p.alt;
        img.width = p.w; img.height = p.h;
        img.decoding = 'async';
        img.loading = (ri < 2) ? 'eager' : 'lazy';
        img.sizes = Math.ceil(w) + 'px';
        img.srcset = srcset(p, 'jpg');
        img.src = 'photos/' + p.base + '-' + chosen + '.jpg';
        img.addEventListener('load', function () { img.classList.add('is-loaded'); });
        if (img.complete) img.classList.add('is-loaded');

        pic.appendChild(s); pic.appendChild(img);
        btn.appendChild(pic);
        el.appendChild(btn);
        flat.push(btn);
      });

      frag.appendChild(el);
    });

    grid.textContent = '';
    grid.appendChild(frag);

    // gentle entrance
    if (REDUCE || !('IntersectionObserver' in window)) {
      flat.forEach(function (t) { t.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var t = e.target;
          var d = Number(t.dataset.stagger || 0);
          setTimeout(function () { t.classList.add('is-in'); }, d);
          io.unobserve(t);
        });
      }, { rootMargin: '80px 0px -8% 0px' });

      flat.forEach(function (t, i) {
        t.dataset.stagger = (i % 4) * 70;
        io.observe(t);
      });
    }
  }

  /* ── relayout ────────────────────────────────────────────────────── */

  var lastW = 0, rafId = null;
  function onResize() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(function () {
      var w = grid ? grid.clientWidth : 0;
      if (Math.abs(w - lastW) < 2) return;
      lastW = w;
      render();
    });
  }

  if (grid) {
    lastW = grid.clientWidth;
    render();
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize);
  }

  /* ── section reveals ─────────────────────────────────────────────── */

  (function reveals() {
    var els = document.querySelectorAll('.reveal');
    if (REDUCE || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, function (e) { e.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    Array.prototype.forEach.call(els, function (e) { io.observe(e); });
  })();

  /* ── header state ────────────────────────────────────────────────── */

  (function head() {
    var el = document.getElementById('head');
    var heroEl = document.getElementById('hero');
    if (!el) return;
    function upd() {
      var limit = heroEl ? heroEl.offsetHeight - 90 : 120;
      el.classList.toggle('is-solid', window.scrollY > limit);
    }
    upd();
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
  })();

  /* ── lightbox ────────────────────────────────────────────────────── */

  var lb    = document.getElementById('lb');
  var lbImg = document.getElementById('lb-img');
  var lbCap = document.getElementById('lb-cap');
  var lbNum = document.getElementById('lb-count');
  var bPrev = document.getElementById('lb-prev');
  var bNext = document.getElementById('lb-next');
  var bClose= document.getElementById('lb-close');
  var cur = -1, restoreTo = null;

  function lbSrc(p) {
    var vw = Math.max(window.innerWidth, window.innerHeight);
    return 'photos/' + p.base + '-' + pick(p, vw) + '.jpg';
  }

  function preload(i) {
    var p = PHOTOS[i];
    if (p) { var im = new Image(); im.src = lbSrc(p); }
  }

  function show(i) {
    if (i < 0 || i >= PHOTOS.length) return;
    cur = i;
    var p = PHOTOS[i];

    lbImg.classList.remove('is-in');
    lbImg.alt = p.alt;
    lbCap.textContent = p.alt;
    lbNum.textContent = (i + 1) + ' / ' + PHOTOS.length;

    var next = new Image();
    next.onload = function () {
      lbImg.src = next.src;
      requestAnimationFrame(function () { lbImg.classList.add('is-in'); });
    };
    next.src = lbSrc(p);
    if (next.complete) next.onload();

    bPrev.disabled = (i === 0);
    bNext.disabled = (i === PHOTOS.length - 1);
    preload(i + 1); preload(i - 1);
  }

  function open(i) {
    restoreTo = document.activeElement;
    lb.hidden = false;
    document.body.classList.add('lb-open');
    requestAnimationFrame(function () { lb.classList.add('is-open'); });
    show(i);
    bClose.focus();
    document.addEventListener('keydown', onKey);
  }

  function close() {
    lb.classList.remove('is-open');
    document.removeEventListener('keydown', onKey);
    document.body.classList.remove('lb-open');
    var done = function () {
      lb.hidden = true;
      lbImg.removeAttribute('src');
      lbImg.classList.remove('is-in');
    };
    if (REDUCE) done(); else setTimeout(done, 420);
    if (restoreTo && restoreTo.focus) restoreTo.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape')     { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(Math.min(cur + 1, PHOTOS.length - 1)); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); show(Math.max(cur - 1, 0)); }
    else if (e.key === 'Home')  { e.preventDefault(); show(0); }
    else if (e.key === 'End')   { e.preventDefault(); show(PHOTOS.length - 1); }
    else if (e.key === 'Tab')   { trap(e); }
  }

  function trap(e) {
    var f = [bClose, bPrev, bNext].filter(function (b) { return !b.disabled; });
    if (!f.length) return;
    var i = f.indexOf(document.activeElement);
    e.preventDefault();
    var n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
    f[n].focus();
  }

  if (grid) {
    grid.addEventListener('click', function (e) {
      var t = e.target.closest('.tile');
      if (t) open(Number(t.dataset.index));
    });
  }
  if (lb) {
    bClose.addEventListener('click', close);
    bPrev.addEventListener('click', function () { show(Math.max(cur - 1, 0)); });
    bNext.addEventListener('click', function () { show(Math.min(cur + 1, PHOTOS.length - 1)); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.id === 'lb-stage') close();
    });

    // swipe
    var x0 = null, y0 = null;
    lb.addEventListener('touchstart', function (e) {
      x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) show(Math.min(cur + 1, PHOTOS.length - 1));
        else        show(Math.max(cur - 1, 0));
      } else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
        close();
      }
      x0 = y0 = null;
    }, { passive: true });
  }
})();
