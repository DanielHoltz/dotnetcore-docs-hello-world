/*
 * EnfCalc — camada de interação: toque com ondulação e vibração leve, transições entre telas,
 * entrada escalonada dos cartões, contadores animados, swipe entre abas, tema claro/escuro,
 * relógio, status offline e atalhos de teclado. Não altera dados; só a experiência.
 */
(function () {
  'use strict';
  var app = document.getElementById('app');
  var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem('enfcalc.' + k); localStorage.setItem('enfcalc.' + k, v); } catch (e) { return null; } }

  // ---- tema: automático → escuro → claro ----
  var TEMAS = ['auto', 'dark', 'light'], ICONE = { auto: '🌓', dark: '🌙', light: '☀️' };
  function aplicaTema(t) {
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
    var b = document.getElementById('btn-tema'); if (b) { b.textContent = ICONE[t]; b.setAttribute('aria-label', 'Tema: ' + (t === 'auto' ? 'automático' : t === 'dark' ? 'escuro' : 'claro')); }
    var escuro = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    var m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', escuro ? '#0b1220' : '#0f766e');
  }
  var tema = ls('tema') || 'auto';
  aplicaTema(tema);
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#btn-tema')) return;
    tema = TEMAS[(TEMAS.indexOf(tema) + 1) % TEMAS.length]; ls('tema', tema); aplicaTema(tema);
    if (window.EnfCalc && window.EnfCalc.toast) window.EnfCalc.toast('Tema ' + (tema === 'auto' ? 'automático (segue o celular)' : tema === 'dark' ? 'escuro' : 'claro'));
  });

  document.addEventListener('click', function (e) { if (e.target.closest('#btn-busca') && window.EnfCalc && window.EnfCalc.palette) window.EnfCalc.palette(); });

  // ---- toque: ondulação + vibração curta ----
  var TOCAVEIS = '.card, .tile, .qa-b, .btn, .pill, .mod-c, .duo-b, .turno-l, .hub-tile, .tab, .chipnav-b, .tabbar a, .opt, .icon-btn';
  document.addEventListener('pointerdown', function (e) {
    var el = e.target.closest(TOCAVEIS);
    if (!el || reduz) return;
    var r = el.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
    var s = document.createElement('span'); s.className = 'ripple';
    s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.classList.add('has-ripple'); el.appendChild(s);
    setTimeout(function () { s.remove(); }, 550);
  }, { passive: true });
  document.addEventListener('click', function (e) {
    if (e.target.closest('.qa-b, .tile, .tabbar a, .tab, .opt, #ssave, #scopy, .pcr-btn') && navigator.vibrate) { try { navigator.vibrate(8); } catch (x) { /* sem suporte */ } }
  });

  // ---- transição de tela e entrada escalonada ----
  function animaTela() {
    if (reduz) return;
    app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
    var i = 0;
    app.querySelectorAll('.qa-b, .tile, .mod-c, .list > .card, .turno-l, .hero, .sec, .duo-b, .pill').forEach(function (el) {
      if (i < 24 && el.getBoundingClientRect().top < innerHeight) el.style.setProperty('--i', i++); else el.style.setProperty('--i', 0);
    });
  }
  // ---- contadores animados ----
  function contadores() {
    app.querySelectorAll('[data-count]:not([data-ok])').forEach(function (el) {
      el.setAttribute('data-ok', '1');
      var alvo = +el.getAttribute('data-count'); if (reduz || !(alvo > 0)) return;
      var t0 = performance.now(), dur = 900;
      (function passo(t) {
        var p = Math.min(1, (t - t0) / dur), v = Math.round(alvo * (1 - Math.pow(1 - p, 3)));
        el.textContent = v.toLocaleString('pt-BR');
        if (p < 1) requestAnimationFrame(passo);
      })(t0);
    });
  }
  window.addEventListener('hashchange', function () { requestAnimationFrame(function () { animaTela(); contadores(); relogio(); }); });

  // ---- resultado mudou: pulso no valor principal ----
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.target.nodeType !== 1 || m.target === app) return;
      var main = m.target.querySelector && m.target.querySelector('.res.main, .score-bar b');
      if (main && !reduz) { main.classList.remove('pulse'); void main.offsetWidth; main.classList.add('pulse'); }
    });
  }).observe(app, { childList: true, subtree: true });

  // ---- swipe entre abas da ficha ----
  var x0 = null, y0 = null;
  app.addEventListener('touchstart', function (e) { if (!e.target.closest('.pane') || e.target.closest('input, select, textarea, .hscroll')) { x0 = null; return; } x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  app.addEventListener('touchend', function (e) {
    if (x0 == null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    var tabs = [].slice.call(app.querySelectorAll('.tabs .tab')), at = tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
    var nx = tabs[at + (dx < 0 ? 1 : -1)]; if (nx) { nx.click(); var p = app.querySelector('.pane:not([hidden])'); if (p && !reduz) { p.classList.remove('slide-l', 'slide-r'); void p.offsetWidth; p.classList.add(dx < 0 ? 'slide-l' : 'slide-r'); } }
  }, { passive: true });

  // ---- relógio e status de conexão ----
  function relogio() {
    var c = document.getElementById('hh-clock'); if (!c) return;
    var d = new Date(); c.textContent = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    var st = document.getElementById('hh-status');
    if (st) {
      var off = !navigator.onLine, pronto = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
      var txt = off ? 'Sem internet · modo offline' : pronto ? 'Online · disponível offline' : 'Online';
      st.className = 'hh-status ' + (off ? 'off' : 'on');
      if (st.textContent !== txt) st.textContent = txt;   // só muda (e anuncia) quando o estado muda
    }
  }
  setInterval(relogio, 15000);
  window.addEventListener('online', relogio); window.addEventListener('offline', relogio);

  // ---- atalhos de teclado: Ctrl/⌘+K ou / abre a busca rápida ----
  document.addEventListener('keydown', function (e) {
    var digitando = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !digitando)) {
      e.preventDefault(); if (window.EnfCalc && window.EnfCalc.palette) window.EnfCalc.palette();
    }
  });

  requestAnimationFrame(function () { animaTela(); contadores(); relogio(); });
})();
