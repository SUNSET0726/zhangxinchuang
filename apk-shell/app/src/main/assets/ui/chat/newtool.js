window.zdBottom=function(){try{var l=document.getElementById('chatlog'); if(l)l.scrollTop=l.scrollHeight;var b=document.getElementById('body'); if(b)b.scrollTop=b.scrollHeight;}catch(e){}};
try{var _l=document.getElementById('chatlog');if(_l){var _m=document.createElement('div');_m.textContent='NTOOL_LOADED';_m.style.cssText='color:#1a7f37;font-size:12px;padding:2px 0';_l.appendChild(_m);}}catch(e){}
(function(){
if(window.__zgToolOp) return; window.__zgToolOp=1;
var css='.zgtool{align-self:flex-start;display:flex;flex-direction:column;max-width:82%;margin:8px 0 6px 2px;background:#fff;border-radius:15px;box-shadow:0 1px 2px rgba(43,39,36,.05),0 6px 18px rgba(43,39,36,.09);padding:9px 13px;font-size:12.5px;color:#3a4453}'
+'.zgh{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none}'
+'.zgsp{width:11px;height:11px;border-radius:4px;background:#2E4E8F;animation:zgpu 1.05s ease-in-out infinite;flex:0 0 11px}'
+'@keyframes zgpu{0%,100%{transform:scale(.62) rotate(0deg);opacity:.45}50%{transform:scale(1) rotate(45deg);opacity:1}}'
+'.zgtool.done .zgsp{animation:none;background:#3BC46A;transform:none;opacity:1;border-radius:50%}'
+'.zgtool.er .zgsp{animation:none;background:#e5534b;transform:none;opacity:1;border-radius:50%}'
+'.zgsm{color:#3a4453;font-weight:500}'
+'.zga{color:#9aa6b6;font-size:11px;transition:transform .18s}'
+'.zgtool.open .zga{transform:rotate(90deg)}'
+'.zgrw{display:none;margin-top:7px;padding-top:6px;border-top:1px solid #eef1f6;max-height:200px;overflow:auto}'
+'.zgtool.open .zgrw{display:block}'
+'.zgr{padding:3px 0;font-size:11.5px;line-height:1.6;color:#6b7a8d;word-break:break-all}'
+'.zgn{color:#3a4453}'
+'.zgv{color:#8b9bb0}';
var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
var CN={fs_write:'写文件',fs_read:'读文件',fs_delete:'删文件',fs_list:'看目录',fs_mkdir:'建目录',
 time:'看时间',battery:'看电量',weather:'查天气',http_get:'联网取',http_post:'联网发',
 shell:'跑命令',terminal:'跑命令',todo_add:'记待办',todo_list:'看待办',todo_done:'勾待办',
 diary_write:'写日记',diary_read:'读日记',screen:'看屏幕',notify:'发通知'};
function cn(n){
 if(CN[n]) return CN[n];
 if(n.indexOf('todo')===0) return '看待办';
 if(n.indexOf('diary')===0) return '看日记';
 if(n.indexOf('fs_')===0) return '碰文件';
 return n;
}
function host(){ return document.getElementById('chatlog')||document.getElementById('body')||document.body; }
function cur(){
 var w=document.getElementById('zgtoolcard');
 if(!w||w.dataset.done==='1'){
  w=document.createElement('div'); w.id='zgtoolcard'; w.className='zgtool';
  w.innerHTML='<div class="zgh"><span class="zgsp"></span><span class="zgsm">在调用工具</span><span class="zga">›</span></div><div class="zgrw"></div>';
  w.style.position='fixed'; w.style.left='10px'; w.style.right='10px'; w.style.bottom='92px'; w.style.zIndex='9999';
  w.querySelector('.zgh').addEventListener('click',function(){
   w.classList.toggle('open');
  });
  host().appendChild(w);
 }
 return w;
}
function refresh(w){
 var run=w.querySelectorAll('.zgr .zgi.r').length;
 var er=w.querySelectorAll('.zgr .zgi.er').length;
 var nm=w.querySelector('.zgsm');
 var base=w.dataset.names||'';
 nm.textContent=(run?'在调用工具':'用完了工具')+(base?' · '+base:'');
 w.className='zgtool'+(run?'':' done')+(er?' er':'')+(w.classList.contains('open')?' open':'');
 if(!run) w.dataset.done='1';
}
window.zgToolStart=function(t){
 try{ var cl0=document.getElementById('chatlog'); window.__ztc=(window.__ztc||0)+1; if(cl0){ var mk=document.createElement('div'); mk.textContent='TOOLCALL '+window.__ztc; mk.style.cssText='color:#e5534b;font-size:12px;padding:2px 0'; cl0.appendChild(mk); } }catch(e){}

 try{ var ms=document.getElementById('mestat'); if(ms) ms.dataset.p='1'; }catch(e){}

 var a=String(t||'').split('|'), n=a[0]||'tool', b=a[1]||'';
 var w=cur();
 var cnt=parseInt(w.dataset.c||'0',10)+1; w.dataset.c=cnt;
 w.dataset.names=(w.dataset.names? w.dataset.names+'、':'')+cn(n);
 var r=document.createElement('div'); r.className='zgr'; r.id='zgr'+cnt;
 r.innerHTML='<span class="zgi r" style="color:#9aa6b6">·</span><span class="zgn">'+cn(n)+'</span> <span class="zgv">'+b.replace(/</g,'&lt;')+'</span>';
 w.querySelector('.zgrw').appendChild(r);
 refresh(w);
};
window.zgTool=function(t){
 var a=String(t||'').split('|'), n=a[0]||'tool', res=String(a[1]||'');
 var w=document.getElementById('zgtoolcard');
 if(!w){ window.zgToolStart(n); w=document.getElementById('zgtoolcard'); }
 var rows=w.querySelectorAll('.zgr'), r=null;
 for(var i=rows.length-1;i>=0;i--){ if(rows[i].querySelector('.zgi.r')){ r=rows[i]; break; } }
 if(!r&&rows.length){ r=rows[rows.length-1]; }
 if(r){
  var ic=r.querySelector('.zgi');
  var bad=/^(error|exception|失败|报错|tool error)/i.test(res.trim())||/^\{"?ok"?\s*:\s*false/i.test(res.trim());
  ic.textContent=bad?'✕':'✓';
  ic.className='zgi '+(bad?'er':'ok');
  ic.style.color=bad?'#e5534b':'#3BC46A';
  var s=document.createElement('div'); s.className='zgv';
  s.textContent=res.replace(/\s+/g,' ').slice(0,180);
  r.appendChild(s);
 }
 refresh(w);
};
window.zgToolDone=function(){ var w=document.getElementById('zgtoolcard'); if(w){ refresh(w); } };
setTimeout(function(){
  try{
    var l=document.getElementById('chatlog');
    if(l) l.scrollTop=l.scrollHeight;
    var b=document.querySelector('.body');
    if(b) b.scrollTop=b.scrollHeight;
  }catch(e){}
},500);
window.addEventListener('load',function(){
  setTimeout(function(){
    try{
      var l=document.getElementById('chatlog');
      if(l) l.scrollTop=l.scrollHeight;
      var b=document.querySelector('.body');
      if(b) b.scrollTop=b.scrollHeight;
    }catch(e){}
  },300);
});
})();