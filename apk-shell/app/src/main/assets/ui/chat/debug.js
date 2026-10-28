(function(){
if(window.__zgdbg) return; window.__zgdbg=1;
var box=document.createElement('div');
box.id='zgdbg';
box.style.cssText='position:fixed;left:8px;bottom:70px;max-width:72%;max-height:120px;overflow:auto;background:rgba(0,0,0,.75);color:#7ee787;font:11px/1.45 monospace;padding:6px 8px;border-radius:8px;z-index:99999;white-space:pre-wrap';
box.textContent='[自检] 启动';
document.body.appendChild(box);
var lines=[];
function log(s){ lines.push(s); while(lines.length>8) lines.shift(); box.textContent='[自检]\n'+lines.join('\n'); }
window.__zglog=log;
var names=['zgToolStart','zgTool','zgSayPush','zgSayErr','zgChunk'];
for(var i=0;i<names.length;i++){
 (function(k){
  var o=window[k];
  if(typeof o!=='function'){ log(k+': 没有'); return; }
  window[k]=function(a){ log(k+': '+String(a).slice(0,36)); return o.apply(this,arguments); };
 })(names[i]);
}
log('hook ok');
box.addEventListener('click',function(){ box.style.display='none'; });
})();