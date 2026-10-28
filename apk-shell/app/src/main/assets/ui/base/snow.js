/* 朝歌 · 漂浮物（雪抄自连环 blocks/ambience 的 snow，猫爪自己画的）
   设置里勾哪样飘哪样，可以一起飘。 */
(function () {
  if (window.self !== window.top) return;   /* 子页里不再落一遍，省一手 */
  var K = 'zg.ui', cfg = {};
  try { cfg = JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch (e) { cfg = {}; }

  var kinds = [];
  if (Array.isArray(cfg.float)) kinds = cfg.float.slice();
  else if (typeof cfg.float === 'string' && cfg.float) kinds = [cfg.float];
  kinds = kinds.filter(function (k) { return k === 'snow' || k === 'paw'; });
  if (!kinds.length) return;
  if (document.querySelector('.floaty')) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var SNOW = '<svg data-line viewBox="0 0 24 24">'
    + '<path d="M10 4l2 1l2 -1"/><path d="M12 2v6.5l3 1.72"/>'
    + '<path d="M17.928 6.268l.134 2.232l1.866 1.232"/><path d="M20.66 7l-5.629 3.25l.01 3.458"/>'
    + '<path d="M19.928 14.268l-1.866 1.232l-.134 2.232"/><path d="M20.66 17l-5.629 -3.25l-2.99 1.738"/>'
    + '<path d="M14 20l-2 -1l-2 1"/><path d="M12 22v-6.5l-3 -1.72"/>'
    + '<path d="M6.072 17.732l-.134 -2.232l-1.866 -1.232"/><path d="M3.34 17l5.629 -3.25l-.01 -3.458"/>'
    + '<path d="M4.072 9.732l1.866 -1.232l.134 -2.232"/><path d="M3.34 7l5.629 3.25l2.99 -1.738"/></svg>';

  var PAW = '<svg data-solid viewBox="0 0 24 24">'
    + '<ellipse cx="12" cy="16.2" rx="6.2" ry="5"/>'
    + '<ellipse cx="5.6" cy="9.4" rx="2.3" ry="2.7"/>'
    + '<ellipse cx="9.9" cy="6.4" rx="2.3" ry="2.8"/>'
    + '<ellipse cx="14.1" cy="6.4" rx="2.3" ry="2.8"/>'
    + '<ellipse cx="18.4" cy="9.4" rx="2.3" ry="2.7"/></svg>';

  function draw() {
    var host = document.createElement('div');
    host.className = 'floaty';
    host.setAttribute('aria-hidden', 'true');
    var n = cfg.floatCount || 10, speed = cfg.floatSpeed || 1;
    var mixed = kinds.length > 1;
    for (var i = 0; i < n; i++) {
      var kind = kinds[i % kinds.length];
      var el = document.createElement('i'), sz;
      if (kind === 'paw') sz = 12 + Math.random() * 10;
      else sz = 9 + Math.random() * 11;
      if (mixed) sz *= 0.85;
      el.style.left = (Math.random() * 96) + '%';
      el.style.width = sz + 'px';
      el.style.height = sz + 'px';
      el.style.opacity = (kind === 'paw' ? 0.18 : 0.16) + Math.random() * 0.2;
      var dur = (16 + Math.random() * 18) / Math.max(0.1, speed);
      el.style.animationDuration = dur.toFixed(1) + 's';
      el.style.animationDelay = (-Math.random() * dur).toFixed(1) + 's';
      el.style.setProperty('--drift', (Math.random() * 80 - 40).toFixed(0) + 'px');
      el.style.setProperty('--spin', kind === 'paw'
        ? (Math.random() * 120 - 60).toFixed(0) + 'deg'
        : (Math.random() * 320 - 120).toFixed(0) + 'deg');
      el.innerHTML = kind === 'paw' ? PAW : SNOW;
      host.appendChild(el);
    }
    document.body.insertBefore(host, document.body.firstChild);
  }
  if (document.body) draw(); else document.addEventListener('DOMContentLoaded', draw);
})();