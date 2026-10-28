(function(){
  function mk(en,cn){
    var wrap=document.createElement('div'); wrap.className='vwrap';
    var vd=document.createElement('button'); vd.className='vmsg';
    var secs=Math.max(2,Math.round(en.length/11));
    vd.innerHTML='<span class="vplay"><svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg></span>'
      +'<span class="bars">'+new Array(15).join('<i></i>')+'</span>'
      +'<span class="vtime">0:'+(secs<10?'0'+secs:secs)+'</span>';
    var au=null;
    vd.addEventListener('click',function(){
      if(!au){ au=new Audio('http://127.0.0.1:8002/tts?text='+encodeURIComponent(en)); }
      if(au.paused){ au.play(); vd.classList.add('on'); } else { au.pause(); vd.classList.remove('on'); }
    });
    wrap.appendChild(vd);
    if(cn){ var cd=document.createElement('div'); cd.className='vcn'; cd.textContent=cn; wrap.appendChild(cd); }
    return wrap;
  }
  function fix(){
    try{
      var list=document.querySelectorAll('.msg.him');
      var last=list[list.length-1];
      if(!last) return;
      if(last.querySelector && last.querySelector('.vmsg')) return;
      var txt=(last.textContent||'').trim();
      var m=/^(?:\[voice\]|voice[:：])\s*([\s\S]*)$/i.exec(txt);
      if(!m) return;
      var body=(m[1]||'').split('|||');
      var en=(body[0]||'').trim(), cn=(body[1]||'').trim();
      if(!en) return;
      var w=mk(en,cn);
      if(last.parentNode) last.parentNode.replaceChild(w,last);
    }catch(e){}
  }
  var impl=null;
  try{ if(typeof window.zgSayDone==='function') impl=window.zgSayDone; }catch(e){}
  try{
    Object.defineProperty(window,'zgSayDone',{
      configurable:true,
      get:function(){
        return function(){
          if(impl){ try{ impl.apply(this,arguments); }catch(e){} }
          setTimeout(fix,0); setTimeout(fix,150); setTimeout(fix,500);
        };
      },
      set:function(f){ impl=f; }
    });
  }catch(e){}
  setTimeout(fix,1500);
})();