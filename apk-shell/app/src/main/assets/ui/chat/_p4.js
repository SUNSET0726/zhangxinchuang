<script>
(function (global) {
  'use strict';
  var NAME = '烬先生';

  var TOOL = {search_diary:'翻日记', query_todos:'看待办', read_wallet:'看小金库',
    peek_screen:'看你的屏幕', write_diary:'写日记', write_letter:'写信',
    memory_search:'翻记忆', get_weather:'查天气', screen_time:'看屏幕时长',
    lock_phone:'锁手机', read_calendar:'翻日历', query_memory:'翻记忆'};
  var TOOL_DID = {search_diary:'翻了翻日记', query_todos:'看了看待办',
    read_wallet:'看了看小金库', peek_screen:'看了眼你的屏幕', write_diary:'写了页日记',
    write_letter:'写了封信', memory_search:'翻了翻记忆', get_weather:'查了查天气',
    screen_time:'看了看屏幕时长', lock_phone:'把手机锁上了', read_calendar:'翻了翻日历',
    query_memory:'翻了翻记忆'};

  var ACTS_HTML = '<div class="acts">'
    + '<button data-act="star" aria-label="收藏"><svg viewBox="0 0 24 24"><path d="M12 17.4l-6.1 3.2 1.2-6.8-4.9-4.8 6.8-1 3-6.2 3 6.2 6.8 1-4.9 4.8 1.2 6.8z"/></svg></button>'
    + '<button data-act="play" aria-label="念给我听"><svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg></button>'
    + '<button data-act="share" aria-label="分享"><svg viewBox="0 0 24 24"><path d="M8 9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1"/><path d="M12 14V3"/><path d="M9 6l3-3 3 3"/></svg></button>'
    + '<button data-act="more" aria-label="更多"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg></button>'
    + '<time></time></div>';

  function Chat(root, opts) {
    root = root || document;
    opts = opts || {};
    var $ = function (s) { return root.querySelector(s); };
    var NO_DOOR = opts.noDoorText || '这里还没接线';

    var app = $('#app'), log = $('#chatlog'), stat = $('#chatstat'),
        ta = $('#ta'), send = root.querySelector('.send'), bodyEl = $('#body');
    if (!log || !ta) return null;

    var tEl = $('#toast'), tT = null;
    function toast(m) {
      if (!tEl) return;
      tEl.textContent = m; tEl.classList.add('on');
      clearTimeout(tT); tT = setTimeout(function () { tEl.classList.remove('on'); }, 2000);
    }
    var esc = function (t) {
      return String(t == null ? '' : t).replace(/[&<>]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
      });
    };
    var linkify = function (t) {
      return esc(t).replace(/(https?:\/\/[^\s）)」』]+)/g, function (u) {
        return '<a href="' + u + '" target="_blank" rel="noopener">' + (u.length > 40 ? u.slice(0, 38) + '…' : u) + '</a>';
      });
    };
    var toolCN = function (n) {
      n = String(n || ''); var k = n.replace(/^mcp__[a-z_]+__/, '');
      return TOOL[k] || TOOL[n] || k;
    };
    var toolDid = function (list) {
      var out = [];
      (list || []).forEach(function (t) {
        var nm = (t && t.name) || t || '';
        var s = TOOL_DID[String(nm).replace(/^mcp__[a-z_]+__/, '')] || TOOL_DID[nm];
        if (s && out.indexOf(s) < 0) out.push(s);
      });
      return out.slice(0, 4).join(' · ');
    };
    var fmtTS = function (ms) {
      if (!ms) return '';
      var d = new Date(ms), n = new Date();
      var hm = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
      return d.toDateString() === n.toDateString() ? hm
        : ((d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hm);
    };
    var _sep = 0;
    function maybeSep(ms) {
      if (!ms || ms - _sep <= 8 * 60000) { if (ms) _sep = ms; return; }
      var t = document.createElement('div');
      t.className = 'timeline-t'; t.textContent = fmtTS(ms);
      log.appendChild(t); _sep = ms;
    }
    function toBottom() { if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight; }
    var demo = log.hasAttribute('data-demo'), streamEl = null;
    function clearDemo() { if (!demo) return; log.innerHTML = ''; log.removeAttribute('data-demo'); demo = false; }

    function moveActs() {
      var want = [], group = null;
      [].slice.call(log.children).forEach(function (el) {
        if (!el.classList) return;
        if (el.classList.contains('acts')) return;
        if (el.classList.contains('msg') && el.classList.contains('him')) {
          var cid = el.dataset.cid || '';
          if (group && group.cid !== cid) { want.push(group.last); group = null; }
          if (!group) group = { cid: cid, last: el }; else group.last = el;
          return;
        }
        if (group) { want.push(group.last); group = null; }
      });
      if (group) want.push(group.last);
      var keep = [];
      want.forEach(function (e) { keep.push(e); });
      log.querySelectorAll('.acts').forEach(function (a) {
        var pv = a.previousElementSibling;
        if (!pv || keep.indexOf(pv) < 0) a.remove();
      });
      want.forEach(function (el) {
        var a = el.nextElementSibling;
        if (!(a && a.classList && a.classList.contains('acts'))) {
          var box = document.createElement('div');
          box.innerHTML = ACTS_HTML;
          a = box.firstElementChild; if (!a) return; el.after(a);
        }
        var st = a.querySelector('[data-act="star"]');
        if (st) st.classList.toggle('on', el.classList.contains('starred'));
        var tm = a.querySelector('time');
        var at = Number(el.dataset.ts || 0);
        if (tm) tm.textContent = at ? fmtTS(at) : '';
      });
    }

    function say(text, side, think, ts, src) {
      var at = ts || Date.now();
      maybeSep(at);
      var frag = document.createDocumentFragment();
      if (think) {
        var tb = document.createElement('button');
        tb.className = 'thinkbar';
        tb.setAttribute('data-think', think);
        tb.innerHTML = '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>Thought process'
          + '<svg class="i cv" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
        frag.appendChild(tb);
      }
      var d = document.createElement('div');
      d.className = 'msg ' + (side === 'me' ? 'me' : 'him');
      d.dataset.ts = String(at);
      if (src) d.dataset.src = src;
      d.innerHTML = linkify(text);
      frag.appendChild(d);
      if (side === 'me') {
        var mt = document.createElement('div');
        mt.className = 'metime';
        mt.textContent = fmtTS(at);
        frag.appendChild(mt);
      }
      log.appendChild(frag);
      toBottom();
      return d;
    }
    function setStat(t) {
      if (!stat) return;
      if (!t) { stat.hidden = true; stat.querySelector('.txt').textContent = ''; return; }
      stat.hidden = false; stat.querySelector('.txt').textContent = t;
      toBottom();
    }
    function splitSay(text) {
      var s = String(text == null ? '' : text);
      if (s.indexOf('|||') >= 0) {
        var segs = s.split('|||').map(function (x) { return x.trim(); }).filter(Boolean);
        if (segs.length) return segs.slice(0, 40);
      }
      var ps = s.split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean);
      return ps.length ? ps.slice(0, 40) : [s];
    }
    function toolNote(list) {
      var txt = toolDid(list);
      if (!txt) return;
      var n = document.createElement('div');
      n.className = 'toolnote';
      n.innerHTML = '<span>' + esc(NAME) + esc(txt) + ' ›</span>';
      n.addEventListener('click', function () { toolSheet(list); });
      log.appendChild(n); toBottom();
    }
    function toolSheet(list) {
      var ov = document.createElement('div');
      ov.className = 'toolwrap';
      ov.innerHTML = '<div class="toolcard"><h5>' + esc(NAME) + '这轮真实做了什么</h5>'
        + (list || []).map(function (t) {
          var nm = (t && t.name) || t || '';
          var lab = toolDid([t]) || String(nm).replace(/^mcp__[a-z_]+__/, '');
          return '<div class="one"><div class="lab">' + esc(lab) + '</div>'
            + (t && t['in'] ? '<div class="gv">给出：' + esc(String(t['in']).slice(0, 150)) + '</div>' : '')
            + (t && t.out ? '<div class="sw">看到：' + esc(String(t.out).slice(0, 200)) + '</div>' : '')
            + '</div>';
        }).join('')
        + '<div class="bye">点任意处关掉</div></div>';
      ov.addEventListener('click', function () { ov.remove(); });
      document.body.appendChild(ov);
    }
    var ICON_SEND = send ? send.innerHTML : '';
    var ICON_STOP = '<svg class="i" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1.6" fill="currentColor" stroke="none"/></svg>';
    var busy = false;
    function setBusy(v) {
      busy = v;
      if (!send) return;
      send.innerHTML = v ? ICON_STOP : ICON_SEND;
      send.setAttribute('aria-label', v ? '让他停下' : '发送');
    }
    function emit(type, d) {
      d = d || {};
      switch (type) {
        case 'room':
          log.innerHTML = ''; setStat(''); break;
        case 'sent': clearDemo(); say(d.text, 'me'); setStat('送出去了…'); streamEl = null; setBusy(true); break;
        case 'sending': setStat('送出去了…'); setBusy(true); break;
        case 'recv': setStat('✓ 到他那了'); break;
        case 'stage': setStat(d.text === '翻记忆' ? '翻着记忆想你这句…' : '在想…'); break;
        case 'tool':
          setStat(d.done ? toolCN(d.name) + ' ✓'
            : (d.detail ? '正在' + d.detail + '…' : '动手了 · ' + toolCN(d.name) + '…')); break;
        case 'os': setStat('想好了，在写…'); break;
        case 'say':
          clearDemo();
          streamEl = say(d.text, 'him', d.first ? d.think : '');
          setStat(''); moveActs(); break;
        case 'meta': toolNote(d.tools); break;
        case 'stop': setStat('停下了。'); setTimeout(function () { setStat(''); }, 1400); break;
        case 'resume': clearDemo(); setStat('上一条还没说完，线接回去了…'); setBusy(true); break;
        case 'end': setStat(''); setBusy(false); break;
      }
    }

    /* 思考链 sheet：三档吸附 0 / 40 / 72，往下拖到 100 关掉 */
    var sheet = $('#thinksheet'), sscrim = $('#sheetscrim'), shead = $('#sheethead');
    var SNAP = [0, 40, 72], CLOSED = 100, sy2 = CLOSED;
    function setSheet(pct, smooth) {
      if (!sheet) return;
      sy2 = pct;
      sheet.classList.toggle('dragging', !smooth);
      sheet.style.transform = 'translateY(' + pct + '%)';
      if (sscrim) {
        sscrim.style.transition = smooth ? '' : 'none';
        sscrim.style.opacity = Math.max(0, (CLOSED - pct) / CLOSED * 0.9).toFixed(3);
        sscrim.style.pointerEvents = pct >= CLOSED ? 'none' : 'auto';
      }
      var cv = root.querySelector('#thinksheet .cv');
      if (cv) cv.style.transform = pct >= CLOSED ? '' : 'rotate(90deg)';
    }
    function sheetOpen(v) { setSheet(v ? SNAP[1] : CLOSED, true); }

    var sbody = $('#sheetbody'), demoThink = sbody ? sbody.innerHTML : '';
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.thinkbar');
      if (!b || !sheet) return;
      var t = b.getAttribute('data-think');
      if (sbody) {
        sbody.innerHTML = t
          ? t.split(/\n{2,}/).map(function (p) {
            return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>';
          }).join('')
          : demoThink;
        sbody.scrollTop = 0;
      }
      sheetOpen(true);
    });
    var sheetclose = $('#sheetclose');
    if (sheetclose) sheetclose.addEventListener('click', function () { sheetOpen(false); });
    if (sscrim) sscrim.addEventListener('click', function () { sheetOpen(false); });

    var dragging = false, y0 = 0, sy0 = 0, lastY = 0, lastT = 0, vel = 0;
    if (shead) {
      shead.addEventListener('pointerdown', function (e) {
        dragging = true; y0 = e.clientY; sy0 = sy2;
        lastY = e.clientY; lastT = e.timeStamp; vel = 0;
        shead.setPointerCapture(e.pointerId);
        sheet.classList.add('dragging');
      });
      shead.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var h = sheet.offsetHeight || 1;
        var pct = sy0 + (e.clientY - y0) / h * 100;
        if (pct < 0) pct = pct / 3;
        var dt = e.timeStamp - lastT;
        if (dt > 0) { vel = (e.clientY - lastY) / dt; lastY = e.clientY; lastT = e.timeStamp; }
        setSheet(Math.min(pct, CLOSED), false);
      });
      shead.addEventListener('pointerup', endDrag);
      shead.addEventListener('pointercancel', endDrag);
    }
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      var targets = SNAP.concat([CLOSED]), t;
      if (vel > 0.6) {
        t = targets.find(function (v) { return v > sy2 + 1; }); if (t == null) t = CLOSED;
      } else if (vel < -0.6) {
        t = targets.slice().reverse().find(function (v) { return v < sy2 - 1; }); if (t == null) t = 0;
      } else {
        t = targets.reduce(function (a, b) { return Math.abs(b - sy2) < Math.abs(a - sy2) ? b : a; });
      }
      setSheet(t, true);
    }

    /* 那颗星：五个字符十帧，120ms 一帧 */
    (function () {
      var el = $('#cspin'); if (!el || !stat) return;
      var F = ['·', '✢', '✶', '✻', '✽', '✽', '✻', '✶', '✢', '·'], i = 0, t = 0;
      function tick() { el.textContent = F[i = (i + 1) % F.length]; }
      function run(on) {
        if (on && !t) t = setInterval(tick, 120);
        else if (!on && t) { clearInterval(t); t = 0; }
      }
      new MutationObserver(function () { run(!stat.hidden); })
        .observe(stat, { attributes: true, attributeFilter: ['hidden'] });
      run(!stat.hidden);
    })();

    /* 那排键 + 长按菜单 */
    var page = $('#p-chat') || log.parentNode, popm = $('#popmenu');
    page.addEventListener('click', function (e) {
      var b = e.target.closest('.acts button'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'star') {
        var host = b.closest('.acts'), tgt = host && host.previousElementSibling;
        var want = !b.classList.contains('on');
        b.classList.toggle('on', want);
        if (tgt) tgt.classList.toggle('starred', want);
        toast(want ? '收下了，连同这段想法' : '取消收藏');
      } else if (act === 'play') {
        var ph = b.closest('.acts'), pm = ph && ph.previousElementSibling;
        var ptxt = pm && pm.classList.contains('msg') ? pm.textContent : '';
        if (b.classList.contains('playing')) {
          b.classList.remove('playing'); toast('停了'); return;
        }
        if (!ptxt) return;
        b.classList.add('playing');
        if (opts.onPlay) opts.onPlay(ptxt, b);
        else { toast(NO_DOOR); setTimeout(function () { b.classList.remove('playing'); }, 1100); }
      } else if (act === 'share') {
        toast(NO_DOOR);
      } else if (act === 'more') {
        if (!popm) return;
        var r = b.getBoundingClientRect(), pr = app.getBoundingClientRect();
        var ml = Math.min(r.left - pr.left, pr.width - 158);
        popm.style.left = ml + 'px';
        popm.style.top = (r.bottom - pr.top + 6) + 'px';
        popm.style.setProperty('--po', Math.round(r.left - pr.left - ml + r.width / 2) + 'px 0');
        popm.classList.add('on');
        popm._for = b; popm._msg = null; syncStarLabel();
        e.stopPropagation();
      }
    });
    function popMsgEl() {
      if (!popm) return null;
      if (popm._msg && popm._msg.isConnected) return popm._msg;
      var h = popm._for && popm._for.closest('.acts');
      var p = h && h.previousElementSibling;
      return (p && p.classList && p.classList.contains('msg')) ? p : null;
    }
    function syncStarLabel() {
      if (!popm) return;
      var el = popMsgEl(), lb = popm.querySelector('[data-starlabel]');
      if (!lb) return;
      lb.textContent = (el && el.classList.contains('starred')) ? '取消收藏' : '收藏这句';
    }
    if (popm) {
      popm.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var m = b.dataset.m, el = popMsgEl(), txt = el ? el.textContent : '';
        popm.classList.remove('on');
        if (m === 'copy') {
          if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast('复制了'); });
          else toast('这台机子不让复制');
          return;
        }
        if (m === 'quote') {
          ta.value = '「' + txt.slice(0, 40) + '」\n' + ta.value; ta.focus();
          return;
        }
        if (m === 'star') {
          if (!el) return;
          var want = !el.classList.contains('starred');
          el.classList.toggle('starred', want);
          var a = el.nextElementSibling;
          if (a && a.classList.contains('acts')) {
            var s = a.querySelector('[data-act="star"]'); if (s) s.classList.toggle('on', want);
          }
          toast(want ? '收下了' : '取消收藏');
          return;
        }
        if (m === 'redo') { toast(opts.onRedo ? '' : NO_DOOR); if (opts.onRedo) opts.onRedo(el); return; }
        if (m === 'hide') {
          if (el) { el.style.transition = 'opacity .3s,transform .3s'; el.style.opacity = '0'; el.style.transform = 'translateY(-6px)'; setTimeout(function () { el.remove(); moveActs(); }, 300); }
          toast('藏起来了，没删');
        }
      });
      document.addEventListener('click', function () { popm.classList.remove('on'); });
    }
    /* 长按任意一条 */
    (function () {
      var t = 0, sx = 0, syy = 0;
      log.addEventListener('pointerdown', function (e) {
        var m = e.target.closest && e.target.closest('.msg'); if (!m) return;
        sx = e.clientX; syy = e.clientY;
        t = setTimeout(function () { openFor(m, e.clientX, e.clientY); }, 520);
      });
      log.addEventListener('pointermove', function (e) {
        if (!t) return;
        if (Math.abs(e.clientX - sx) > 8 || Math.abs(e.clientY - syy) > 8) { clearTimeout(t); t = 0; }
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (k) {
        log.addEventListener(k, function () { clearTimeout(t); t = 0; });
      });
      function openFor(m, x, y) {
        if (!popm) return;
        var pr = app.getBoundingClientRect();
        var ml = Math.min(Math.max(8, x - pr.left - 40), pr.width - 158);
        popm.style.left = ml + 'px';
        popm.style.top = (y - pr.top + 8) + 'px';
        popm.style.setProperty('--po', '30px 0');
        popm._msg = m; popm._for = null;
        syncStarLabel(); popm.classList.add('on');
        if (navigator.vibrate) navigator.vibrate(8);
      }
    })();

    /* 加号十五项 */
    (function () {
      var ps = $('#plussheet'), psc = $('#plusscrim'), grid = $('#plusgrid');
      if (!ps || !grid) return;
      function open(v) {
        ps.style.transform = v ? 'translateY(0)' : '';
        if (psc) psc.classList.toggle('on', v);
      }
      document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-sub="加号菜单"]');
        if (!b) return;
        e.preventDefault(); e.stopPropagation(); open(true);
      }, true);
      if (psc) psc.addEventListener('click', function () { open(false); });
      var pc = $('#plusclose'); if (pc) pc.addEventListener('click', function () { open(false); });
      grid.addEventListener('click', function (e) {
        var b = e.target.closest('.pit'); if (!b) return;
        var door = b.dataset.door, pick = b.dataset.pick, act = b.dataset.act;
        open(false);
        if (act === 'sync') { if (opts.hooks && opts.hooks.sync) setTimeout(opts.hooks.sync, 120); else toast(NO_DOOR); return; }
        if (pick) {
          if (opts.hooks && ((pick === 'photos' && opts.hooks.pickPhotos) || (pick === 'files' && opts.hooks.pickFiles))) {
            setTimeout(function () { (pick === 'photos' ? opts.hooks.pickPhotos : opts.hooks.pickFiles)(); }, 120);
          } else toast(NO_DOOR);
          return;
        }
        if (door) {
          if (opts.hooks && opts.hooks.door) setTimeout(function () { opts.hooks.door(door); }, 60);
          else toast(NO_DOOR);
        }
      });
      root.querySelectorAll('.cbtn').forEach(function (b) {
        if ((b.getAttribute('data-sub') || '').indexOf('语音') < 0) return;
        b.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          if (opts.hooks && opts.hooks.voice) opts.hooks.voice(); else toast(NO_DOOR);
        });
      });
    })();

    /* 暂存条：挑完先不发，停在输入框上头等配一句话 */
    var bar = $('#stagebar'), staged = [], stageSeq = 0;
    var FIC = '<span class="fic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg></span>';
    function drawStage() {
      if (!bar) return;
      bar.hidden = !staged.length;
      var had = {};
      bar.querySelectorAll('.chip[data-k]').forEach(function (c) { had[c.getAttribute('data-k')] = 1; });
      bar.innerHTML = staged.map(function (s, i) {
        if (!s.k) s.k = ++stageSeq;
        return '<div class="chip" data-k="' + s.k + '">'
          + (s.kind === 'img' ? '<img src="' + s.dataURL + '" alt="">' : FIC)
          + '<span class="nm">' + esc(s.name || '图片') + '</span>'
          + '<button class="x" data-drop="' + i + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>';
      }).join('');
      bar.querySelectorAll('.chip[data-k]').forEach(function (c) {
        if (!had[c.getAttribute('data-k')]) c.classList.add('fresh');
      });
    }
    if (bar) bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-drop]'); if (!b) return;
      staged.splice(+b.getAttribute('data-drop'), 1); drawStage();
    });

    /* 输入条 */
    ta.addEventListener('input', function () {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 110) + 'px';
    });
    function go() {
      if (busy) { emit('stop'); setBusy(false); if (opts.onStop) opts.onStop(); return; }
      var t = ta.value.trim();
      if (!t && !staged.length) return;
      ta.value = ''; ta.style.height = '';
      staged = []; drawStage();
      emit('sent', { text: t });
      if (opts.onSend) opts.onSend(t);
    }
    if (send) {
      send.addEventListener('click', function () {
        send.classList.remove('pop');
        void send.offsetWidth;
        send.classList.add('pop');
      });
      send.addEventListener('click', go);
    }
    ta.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.isComposing) return;
      if (e.metaKey || e.ctrlKey) { e.preventDefault(); go(); }
    });
    var md = $('#mdbtn');
    if (md) md.addEventListener('click', function () { toast(NO_DOOR); });
    var bk = $('#back');
    if (bk) bk.addEventListener('click', function () {
      document.dispatchEvent(new CustomEvent('zhaoge:chat:back'));
      if (history.length > 1) history.back();
      else location.href = '../home/home.html';
    });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', toBottom);

    return {
      emit: emit, say: say, splitSay: splitSay, setStat: setStat, setBusy: setBusy,
      moveActs: moveActs, toast: toast, toolNote: toolNote, clearDemo: clearDemo,
      sheetOpen: sheetOpen, stage: function (l) { staged = l || []; drawStage(); },
      fmtTS: fmtTS, toolCN: toolCN, toolDid: toolDid,
      busy: function () { return busy; }
    };
  }

  Chat.play = function (chat, turn, done) {
    var steps = [];
    steps.push([260, function () { chat.emit('recv'); }]);
    steps.push([520, function () { chat.emit('stage', { text: (turn.tools && turn.tools.length) ? '翻记忆' : '' }); }]);
    (turn.tools || []).forEach(function (t) {
      steps.push([700, function () { chat.emit('tool', { name: t.name, detail: t.detail }); }]);
      steps.push([880, function () { chat.emit('tool', { name: t.name, done: true }); }]);
    });
    steps.push([620, function () { chat.emit('os'); }]);
    chat.splitSay(turn.text).forEach(function (seg, i) {
      steps.push([i === 0 ? 700 : 620, function () {
        chat.emit('say', { text: seg, think: turn.think, first: i === 0 });
      }]);
    });
    if (turn.tools && turn.tools.length) {
      steps.push([340, function () { chat.emit('meta', { tools: turn.tools }); }]);
    }
    steps.push([120, function () { chat.emit('end', { ok: true }); if (done) done(); }]);
    var i = 0;
    (function next() {
      if (i >= steps.length) return;
      var s = steps[i++];
      setTimeout(function () { s[1](); next(); }, s[0]);
    })();
  };

  global.Chat = Chat;
})(window);
</script>