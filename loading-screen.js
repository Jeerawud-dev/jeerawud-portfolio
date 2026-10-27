/* Wait for both independent Google Sheets render paths; never trap visitors indefinitely. */
(() => {
  "use strict";
  const overlay=document.getElementById("site-loader");
  if(!overlay)return;
  const doc=document.documentElement;
  const message=document.getElementById("site-loading-description");
  const bar=document.getElementById("site-loading-progress");
  const profile=document.getElementById("site-loading-profile");
  const gallery=document.getElementById("site-loading-gallery");
  const ready=new Set();
  const begun=Date.now();
  let completed=false;
  let waitingForImages=false;
  const hardStop=setTimeout(()=>finish(true),12500);

  function finish(timeout){
    if(completed)return;
    completed=true;
    clearTimeout(hardStop);
    if(message)message.textContent=timeout?"Opening available portfolio content…":"Portfolio ready";
    if(bar)bar.style.width="100%";
    // Defer dismissal very briefly to allow decoded images to appear on first reveal.
    const minDelay=Math.max(0,480-(Date.now()-begun));
    setTimeout(()=>{
      overlay.setAttribute("aria-busy","false");
      doc.classList.remove("site-loading");
      doc.classList.add("site-ready");
      setTimeout(()=>overlay.remove(),600);
    },minDelay);
  }

  function revealWhenReady(){
    if(completed || ready.size<2 || waitingForImages)return;
    waitingForImages=true;
    if(message)message.textContent="Preparing images and layout…";
    if(bar)bar.style.width="94%";
    // Only preload images already rendered above the fold / certificate previews.
    // Lazy below-the-fold gallery media must not delay the entire website.
    const images=Array.from(document.querySelectorAll(".portrait-photo img, .cert-picture img")).slice(0,4);
    const done=Promise.all(images.map(img=>{
      if(img.complete)return Promise.resolve();
      return new Promise(resolve=>{
        img.addEventListener("load",resolve,{once:true});
        img.addEventListener("error",resolve,{once:true});
      });
    }));
    Promise.race([done,new Promise(resolve=>setTimeout(resolve,1200))]).then(()=>finish(false),()=>finish(false));
  }

  window.PORTFOLIO_BOOT={
    ready(part){
      if(completed || (part!=="profile" && part!=="gallery"))return;
      ready.add(part);
      if(part==="profile" && profile)profile.classList.add("is-ready");
      if(part==="gallery" && gallery)gallery.classList.add("is-ready");
      if(bar)bar.style.width=ready.size===2?"88%":"53%";
      if(message)message.textContent=ready.size===2?"Preparing your portfolio…":
        (part==="profile"?"Loading project gallery…":"Loading profile and certificates…");
      revealWhenReady();
    }
  };
})();
