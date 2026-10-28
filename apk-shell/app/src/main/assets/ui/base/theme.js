/* 朝歌 · 换肤（抄自连环 blocks/base/accent.js）
   一个界面只有一个重点色。重点色上面的字是白是深，算出来，不猜。 */
(function () {
  var K = 'zg.ui', cfg = {};
  try { cfg = JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch (e) { cfg = {}; }

  var h = document.documentElement;

  function srgb(c) { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }
  function luminance(hex) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return 1;
    return .2126 * srgb(parseInt(m[1], 16)) + .7152 * srgb(parseInt(m[2], 16)) + .0722 * srgb(parseInt(m[3], 16));
  }
  function onAccent(hex) {
    var dark = '#2b2724', L = luminance(hex);
    var w = 1.05 / (L + .05), d = (L + .05) / 0.071;
    return d > w ? dark : '#fff';
  }
  if (cfg.accent) {
    var a = cfg.accent, s = h.style;
    s.setProperty('--accent', a);
    s.setProperty('--accent-soft', 'color-mix(in srgb, ' + a + ' 18%, transparent)');
    s.setProperty('--on-accent', onAccent(a));
    s.setProperty('--accent-fg', onAccent(a));
    s.setProperty('--ink', 'color-mix(in srgb, ' + a + ' 60%, #1B3556)');
    s.setProperty('--ink2', 'color-mix(in srgb, ' + a + ' 40%, #4C5B6C)');
    s.setProperty('--pen', a);
    s.setProperty('--line', 'color-mix(in srgb, ' + a + ' 22%, #DCE6F1)');
  }
  window.ZGTheme = { onAccent: onAccent, luminance: luminance, reload: function () { location.reload(); } };
})();

/* 二级页：点进去从右划入覆盖，点左上角箭头退回 */
(function () {
  if (window.self !== window.top) {
    window.ZGGo = function (u) { try { window.top.postMessage({ __zg: 'go', u: u }, '*'); } catch (e) { location.href = u; } };
    window.ZGBack = function () { try { window.top.postMessage({ __zg: 'back' }, '*'); } catch (e) {} };
    return;
  }
  var cur = null;
  function isInner(h) {
    return h && h.charAt(0) !== '#' && !/^(mailto:|tel:|javascript:|http)/i.test(h);
  }
  function close(f) {
    if (!f || f.__closing) return;
    f.__closing = true;
    f.classList.remove('on');
    setTimeout(function () {
      if (f.parentNode) f.parentNode.removeChild(f);
      if (cur === f) cur = null;
    }, 230);
  }
  function bind(f) {
    var d;
    try { d = f.contentDocument; } catch (e) { return; }
    if (!d || d.__zgBound) return;
    d.__zgBound = true;
    d.addEventListener('click', function (ev) {
      var a = ev.target.closest && ev.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      var t = (a.textContent || '').trim();
      if (t.indexOf('←') >= 0 || t.indexOf('‹') >= 0) {
        ev.preventDefault(); close(f); return;
      }
      if (!isInner(h)) return;
      ev.preventDefault();
      try { f.contentWindow.location.href = a.href; } catch (e) { f.src = a.href; }
    }, true);
  }
  function open(url) {
    if (cur) { try { cur.contentWindow.location.href = url; return; } catch (e) {} }
    var f = document.createElement('iframe');
    f.className = 'zg-cover';
    f.setAttribute('src', url);
    document.body.appendChild(f);
    cur = f;
    setTimeout(function () { f.classList.add('on'); }, 20);
    f.addEventListener('load', function () { bind(f); });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var h = a.getAttribute('href') || '';
    if (!isInner(h) || a.target === '_blank' || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    open(a.href);
  }, true);
  window.ZGCover = { open: open, back: function () { close(cur); } };
  window.ZGGo = function (u) { open(u); };
  window.ZGBack = function () {
    if (cur) { close(cur); return; }
    location.href = '../home/home.html';
  };
  window.addEventListener('message', function (e) {
    var d = e.data || {};
    if (d.__zg === 'back') close(cur);
    else if (d.__zg === 'go' && d.u) open(d.u);
  });
})();
