(function(){
if(window.__zgSp) return; window.__zgSp=1;
var seen={};
function once(k){
 if(seen[k]&&Date.now()-seen[k]<90000) return false;
 seen[k]=Date.now(); return true;
}
function row(n,args,rest){
 try{
  if(window.zgToolStart) window.zgToolStart(n+'|'+String(args||'').replace(/\s+/g,' ').slice(0,60));
  if(window.zgTool) window.zgTool(n+'|'+String(rest||args||'').replace(/\s+/g,' ').slice(0,90));
 }catch(e){}
}
window.zgSplit=function(t){
 var s=String(t||''), out=s;
 try{
  var re=/([a-z][a-z0-9_]{1,24})\s*(\{[^}]{0,300}\})/g, m;
  while((m=re.exec(s))){
   if(!/^(fs_|http_get$|time$|battery$)/.test(m[1])) continue;
   out=out.replace(m[0],'');
   if(!once('j'+m[1]+m[2])) continue;
   row(m[1], m[2], (m[2].match(/"path"\s*:\s*"([^"]*)"/)||[,''])[1]);
  }
  var re2=/[（(]\s*(?:调用)?工具\s*([a-z_][a-z0-9_]*)\s*[）)]([^\n]{0,240})/g, m2;
  while((m2=re2.exec(s))){
   out=out.replace(m2[0],'');
   if(!once('p'+m2[1]+m2[2])) continue;
   row(m2[1], m2[2], m2[2]);
  }
  if(out!==s) out=out.replace(/\n{3,}/g,'\n\n').replace(/^\s+|\s+$/g,'');
 }catch(e){ return s; }
 return out;
};
window.zgResetSeen=function(){ seen={}; };
})();