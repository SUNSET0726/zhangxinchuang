(function(){
if(window.__zgTF) return; window.__zgTF=1;
var om=window.zgSayPush;
window.zgSayPush=function(t){
 var s=String(t||'');
 try{
  var re=/([a-zA-Z_][a-zA-Z0-9_]{1,30})\s*(\{[\s\S]{0,600}?\})/g, m, list=[];
  while((m=re.exec(s))){ if(/^(fs_|http_|time$|battery$)/.test(m[1])) list.push(m); }
  if(!list.length){ if(om) om.call(this,s); return; }
  var out=s;
  for(var i=0;i<list.length;i++){
   if(window.zgToolStart) window.zgToolStart(list[i][1]+'|'+list[i][2].replace(/\s+/g,' ').slice(0,60));
   if(window.zgTool) window.zgTool(list[i][1]+'|未执行，原文 '+(list[i][2].match(/"path"\s*:\s*"([^"]*)"/)||[,''])[1]);
   out=out.replace(list[i][0],'');
  }
  out=out.replace(/\n{3,}/g,'\n\n').trim();
  if(om) om.call(this, out||'嗯');
 }catch(e){ if(om) om.call(this,s); }
};
})();