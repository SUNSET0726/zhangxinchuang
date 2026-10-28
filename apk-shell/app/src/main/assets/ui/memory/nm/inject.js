(function () {
  var LIGHT = '#EDF5FC';
  function lum(c) {
    if (!c) return -1;
    var m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return -1;
    var p = m[1].split(',').map(Number);
    var a = p.length > 3 ? p[3] : 1;
    if (a === 0) return -1;
    return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
  }
  var done = new WeakSet();
  function paint(el) {
    if (!(el instanceof Element) || done.has(el)) return;
    done.add(el);
    var cs = getComputedStyle(el);
    var bl = lum(cs.backgroundColor);
    if (bl >= 0 && bl < 0.45) {
      el.style.setProperty('background-color', bl < 0.14 ? LIGHT : 'rgba(255,255,255,.72)', 'important');
      el.style.setProperty('background-image', 'none', 'important');
    }
    var cl = lum(cs.color);
    if (cl > 0.7) {
      el.style.setProperty('color', '#1B3556', 'important');
      el.style.setProperty('fill', '#1B3556', 'important');
    }
    var bd = cs.borderColor;
    if (bd) {
      var b2 = lum(bd);
      if (b2 >= 0 && b2 > 0.5) el.style.setProperty('border-color', 'rgba(27,53,86,.14)', 'important');
    }
  }
  function all(root) {
    var list = root.querySelectorAll ? root.querySelectorAll('*') : [];
    for (var i = 0; i < list.length; i++) paint(list[i]);
    if (root.nodeType === 1) paint(root);
  }
  function fit() {
    var de = document.documentElement;
    de.style.zoom = '';
    var b = document.body, r = document.getElementById('root');
    var w = Math.max(de.scrollWidth, b ? b.scrollWidth : 0, r ? r.scrollWidth : 0);
    var vw = window.innerWidth;
    if (w > vw + 8) de.style.zoom = Math.max(0.35, vw / w).toFixed(3);
  }
  function boot() {
    all(document);
    fit();
    var mo = new MutationObserver(function () {
      clearTimeout(window.__jt);
      window.__jt = setTimeout(function () { all(document); fit(); }, 120);
    });
    if (document.body) mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  }
  window.addEventListener('load', boot);
  setTimeout(boot, 400);
  setTimeout(function () { all(document); fit(); }, 1500);
  window.addEventListener('resize', function () { done = new WeakSet(); all(document); fit(); });
})();