(function(){
  var g=document.querySelector(".qx-cell-grid");
  if(!g)return;
  var R=3,S=120,ov=document.createElement("div");
  ov.style.cssText="position:fixed;pointer-events:none;z-index:1;opacity:0;transition:opacity .4s ease";
  document.body.appendChild(ov);
  var lx=-1,ly=-1,rf=null;
  function onMove(e){
    var r=g.getBoundingClientRect(),gx=e.clientX-r.left,gy=e.clientY-r.top;
    if(gx<0||gy<0||gx>r.width||gy>r.height){ov.style.opacity="0";lx=ly=-1;return}
    ov.style.left=r.left+"px";ov.style.top=r.top+"px";
    ov.style.width=r.width+"px";ov.style.height=r.height+"px";
    if(gx===lx&&gy===ly)return;lx=gx;ly=gy;
    if(rf)cancelAnimationFrame(rf);
    rf=requestAnimationFrame(function(){
      ov.style.background="radial-gradient(circle "+(R*S)+"px at "+gx+"px "+gy+"px, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)";
      ov.style.opacity="1";
    });
  }
  document.addEventListener("mousemove",onMove);
  document.addEventListener("pointermove",onMove);
})();
