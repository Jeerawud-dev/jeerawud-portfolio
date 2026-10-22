/* Project grid — one clear list, backed by the existing Google Sheets feed. */
(() => {
  "use strict";
  const el = id => document.getElementById(id);
  const escape = v => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
  const clean = v => String(v ?? "").trim();
  const pad = n => String(n).padStart(2, "0");
  const tags = v => clean(v).split(",").map(clean).filter(Boolean);
  const lessMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const visualTone = category => {
    const text = clean(category).toLowerCase();
    if (/software|\.net|application|program|system|iot|data|digital|mes/.test(text)) return "software";
    if (/r&d|innovation|design/.test(text)) return "r-d";
    return "automation";
  };
  const validUrl = value => {
    if (!clean(value)) return "";
    try {
      const url = new URL(clean(value), document.baseURI);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };

  const state = {projects: [], category: "all", query: "", visible: 9, activeProject: null, gallery: null};
  const grid = el("showcase-grid");
  if (!grid) return;

  // Small-screen navigation stays independent of the project renderer.
  const menu = el("nav-menu-toggle"), links = el("primary-links");
  if(menu && links){
    const setMenu = open => {
      menu.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      links.classList.toggle("menu-open", open);
    };
    menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
    links.addEventListener("click", e => { if(e.target.closest("a")) setMenu(false); });
    document.addEventListener("click", e => { if(!e.target.closest(".nav")) setMenu(false); });
    document.addEventListener("keydown", e => { if(e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", () => { if(window.innerWidth > 900) setMenu(false); });
  }

  function visual(project, index, modalView = false){
    const tone = visualTone(project.category);
    const src = validUrl(project.imageUrl);
    const element = modalView ? "div" : "button";
    const action = modalView ? "" : ` type="button" data-project="${index}" aria-label="Show diagram for ${escape(project.title || "Project")}" aria-expanded="false" aria-controls="project-floating-layer"`;
    return `<${element}${action} class="${modalView ? "dialog-visual" : "case-visual case-visual-trigger"}">
      <div class="visual-art art-${tone}" aria-hidden="true"><span class="visual-ring"></span><span class="visual-node"></span></div>
      ${src ? `<img class="project-photo" src="${escape(src)}" alt="${escape(project.title || "Project photo")}" loading="lazy" decoding="async">` : ""}
      <span class="visual-code">${escape(project.category || "Engineering")}</span>
      <span class="case-number">${pad(index+1)}</span>
    </${element}>`;
  }
  function techMarkup(project, max = 4){
    const items = tags(project.technologies).slice(0, max);
    return items.length ? `<div class="tech">${items.map(t => `<span>${escape(t)}</span>`).join("")}</div>` : "";
  }
  function card(project, index){
    return `<article class="case-card">
      ${visual(project, index)}
      <div class="case-content">
        <div class="case-overline"><span>${escape(project.category || "Engineering")}</span><span class="case-period">${escape(project.period || "")}</span></div>
        <h5>${escape(project.title || "Project")}</h5>
        <p class="case-desc">${escape(project.description || "")}</p>
        ${techMarkup(project)}
        <div class="case-bottom">
          <span class="case-context" title="${escape(project.context || "")}">${escape(project.context || "")}</span>
          <button type="button" class="case-open" data-project="${index}" aria-label="Show diagram for ${escape(project.title || "project")}" aria-expanded="false" aria-controls="project-floating-layer">View diagram <span aria-hidden="true">↓</span></button>
        </div>
      </div>
    </article>`;
  }
  function handleImages(root){
    root.querySelectorAll("img.project-photo").forEach(img => {
      const fail = () => { img.hidden = true; };
      img.addEventListener("error", fail, {once:true});
      if(img.complete && img.naturalWidth === 0) fail();
    });
  }

  const observer = "IntersectionObserver" in window && !lessMotion
    ? new IntersectionObserver(entries => {
      for(const entry of entries){
        if(entry.isIntersecting){entry.target.classList.add("is-in-view");observer.unobserve(entry.target);}
      }
    }, {threshold:.08,rootMargin:"0px 0px -24px 0px"}) : null;

  function renderFilters(){
    const counts = new Map();
    for(const project of state.projects){
      const label = clean(project.category) || "Other";
      const key = label.toLowerCase();
      const previous = counts.get(key);
      counts.set(key, {label: previous?.label || label, count:(previous?.count || 0)+1});
    }
    const choices = [{key:"all",label:"All",count:state.projects.length},
      ...Array.from(counts, ([key, value]) => ({key,...value}))];
    el("showcase-filters").innerHTML = choices.map(x => `<button class="filter-button" type="button" data-filter="${escape(x.key)}" aria-pressed="${x.key === state.category}">${escape(x.label)} <span class="chip-number">${x.count}</span></button>`).join("");
  }

  function render(){
    const term = state.query.toLowerCase();
    const matches = state.projects.map((project,index)=>({project,index})).filter(({project})=>{
      const category = clean(project.category || "Other").toLowerCase();
      const search = [project.title,project.description,project.technologies,project.context,project.category]
        .map(clean).join(" ").toLowerCase();
      return (state.category==="all" || category===state.category) && (!term || search.includes(term));
    });
    const visible = matches.slice(0,state.visible);
    if(observer) observer.disconnect();
    closeFloating(false);
    grid.innerHTML = visible.map(({project,index})=>card(project,index)).join("");
    handleImages(grid);
    for(const c of grid.querySelectorAll(".case-card")){
      if(observer) observer.observe(c); else c.classList.add("is-in-view");
    }
    el("showcase-empty").hidden = matches.length > 0;
    el("showcase-more").hidden = visible.length >= matches.length;
    el("showcase-count").textContent = state.projects.length <= 9
      ? `${state.projects.length} projects`
      : `Showing ${visible.length} of ${matches.length} projects`;
  }
  const lookupCase = (title) => {
    const key = clean(title).toLowerCase();
    const local = window.PORTFOLIO_CASE_STUDIES || {};
    const override = state.caseStudies || {};
    const find = source => Object.entries(source).find(([k]) => clean(k).toLowerCase() === key)?.[1] || {};
    return {...find(local), ...find(override)};
  };


  // ProjectGallery is the primary source for chart image, title and details.
  // Live API data overrides the synced GitHub snapshot when provided.
  function galleryForProject(projectTitle) {
    const key=clean(projectTitle).toLowerCase();
    return (state.gallery || []).map(item => ({
      project:clean(item.project || item.projectTitle || item.ProjectTitle),
      title:clean(item.title || item.heading || item.galleryHeading || item.GalleryHeading),
      detail:clean(item.detail || item.description || item.shortDetail || item.ShortDetail),
      imageUrl:clean(item.imageUrl || item.image || item.url || item.ImageURL),
      order:Number(item.order ?? item.displayOrder ?? item.DisplayOrder ?? 0),
      visible:item.visible
    })).filter(item => item.project.toLowerCase()===key && item.title &&
      item.visible !== false && clean(item.visible).toLowerCase() !== "no")
    .sort((a,b)=>a.order-b.order).slice(0,6);
  }
  function setGalleryImage(image, src, container) {
    if(!image || !container) return;
    const url=validUrl(src);
    image.hidden=!url;
    container.classList.toggle("has-gallery-image",!!url);
    if(url) image.src=url; else image.removeAttribute("src");
  }
  // Radial Engineering System Overview: interactive, data-driven and keyboard accessible.
  // Ring arrows are a visual presentation of the published conceptual workflow,
  // not a machine's electrical wiring diagram.
  function diagramMarkup(p, detail) {
    if(state.galleryError) {
      return `<div class="cs-gallery-empty" role="status">
        <strong>Gallery temporarily unavailable</strong>
        <p>Unable to refresh project photos and headings. Try reloading the page.</p>
      </div>`;
    }
    const galleryNodes=galleryForProject(p.title);
    // Once ProjectGallery is configured, its row count is authoritative.
    // Never replace deleted gallery rows with the four old system-diagram nodes.
    const nodes = Array.isArray(state.gallery) ? galleryNodes :
      (Array.isArray(detail.diagram) ? detail.diagram : []).filter(n => n && (n.title || n.detail)).slice(0,6);
    if (!nodes.length) {
      return `<div class="cs-gallery-empty" role="status">
        <span class="cs-gallery-empty-icon" aria-hidden="true">▧</span>
        <strong>No gallery items</strong>
        <p>Add a ProjectGallery row for this project to display it here.</p>
      </div>`;
    }
    if (nodes.length === 1) {
      const item = nodes[0];
      const photo = validUrl(item.imageUrl);
      return `<div class="cs-single-gallery">
        <div class="cs-single-gallery-circle ${photo ? "has-gallery-image" : ""}">
          ${photo ? `<img class="cs-single-gallery-photo" src="${escape(photo)}" alt="${escape(item.title)}" decoding="async">` : ""}
          <span class="cs-single-gallery-symbol" aria-hidden="true">▤</span>
        </div>
        <div class="cs-single-gallery-caption">
          <span class="cs-eyebrow">PROJECT GALLERY · 01 / 01</span>
          <h5>${escape(item.title)}</h5>
          ${item.detail ? `<p>${escape(item.detail)}</p>` : ""}
        </div>
      </div>`;
    }
    const count = nodes.length;
    const angleStep = 360/count;
    const polar = (radius,deg) => {
      const radians=deg*Math.PI/180;
      return [320+Math.cos(radians)*radius,320+Math.sin(radians)*radius];
    };
    const coord = p => p.map(n=>n.toFixed(2)).join(" ");
    const arrows = nodes.map((n,i) => {
      const begin=-90 + angleStep*i + Math.min(17,angleStep*.24);
      const finish=-90+angleStep*(i+1)-Math.min(17,angleStep*.24);
      const headAt=finish-Math.min(13,(finish-begin)*.42);
      const r1=203,r2=161;
      const tip=polar(182,finish);
      const path=`M ${coord(polar(r1,begin))} A ${r1} ${r1} 0 0 1 ${coord(polar(r1,headAt))}
        L ${coord(tip)}
        L ${coord(polar(r2,headAt))} A ${r2} ${r2} 0 0 0 ${coord(polar(r2,begin))} Z`;
      return `<path class="cs-wheel-arrow cs-tone-${i%6} ${i===0?"is-active":""}" data-orbit-segment="${i}" d="${path.replace(/\s+/g," ")}"/>`;
    }).join("");
    const symbol = [
      '<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 9h6v6H9z"/><path d="M8 2v3m8-3v3M8 19v3m8-3v3M2 8h3m-3 8h3m14-8h3m-3 8h3"/>',
      '<path d="M4 8h16v11H4zM9 8V5h6v3"/><path d="M7 13h10M7 16h6"/>',
      '<rect x="3.5" y="4.5" width="17" height="13" rx="2"/><path d="M8 21h8M12 17.5V21M7 8l3 3 4-4 3 2"/>',
      '<circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 11l10-5M7 13l10 5"/>',
      '<path d="M4 7h16M4 12h16M4 17h16M8 4v16M16 4v16"/>',
      '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>'
    ];
    const icon = i => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${symbol[i%symbol.length]}</svg>`;
    const radialButtons = nodes.map((n,i) => {
      const centre=polar(251,-90+angleStep*i);
      const x=(centre[0]/640*100).toFixed(3);
      const y=(centre[1]/640*100).toFixed(3);
      const title=String(n.title||"Component");
      const sub=String(n.detail||"");
      return `<button class="cs-orbit-node cs-tone-${i%6} ${i===0?"is-active":""}" type="button"
        data-orbit-step="${i}" data-orbit-image="${escape(validUrl(n.imageUrl) || "")}" aria-pressed="${i===0?"true":"false"}"
        aria-label="Stage ${String(i+1).padStart(2,"0")}: ${escape(title)}. ${escape(sub)}"
        style="left:${x}%;top:${y}%">
        <span class="cs-orbit-node-number">${String(i+1).padStart(2,"0")}</span>
        <span class="cs-orbit-node-icon">${icon(i)}
          ${validUrl(n.imageUrl) ? `<img class="cs-orbit-gallery-image" src="${escape(validUrl(n.imageUrl))}" alt="" loading="lazy" decoding="async">` : ""}
        </span>
        <strong class="cs-orbit-node-label">${escape(title)}</strong>
        <span class="cs-orbit-node-description" hidden>${escape(sub)}</span>
      </button>`;
    }).join("");
    const active=nodes[0];
    return `<div class="cs-orbit-layout">
      <div class="cs-orbit-stage" role="group" aria-label="Interactive circular system diagram">
        <svg class="cs-orbit-graphic" viewBox="0 0 640 640" focusable="false" aria-hidden="true">
          <circle class="cs-orbit-background-ring" cx="320" cy="320" r="218"/>
          <circle class="cs-orbit-guide-ring" cx="320" cy="320" r="148"/>
          <circle class="cs-orbit-dashed-ring" cx="320" cy="320" r="225"/>
          ${arrows}
          <circle class="cs-orbit-inner-detail" cx="320" cy="320" r="140"/>
        </svg>
        <div class="cs-orbit-core ${validUrl(active.imageUrl) ? "has-gallery-image" : ""}" aria-hidden="true">
          <img class="cs-orbit-core-gallery-photo" ${validUrl(active.imageUrl) ? `src="${escape(validUrl(active.imageUrl))}"` : "hidden"} alt="" decoding="async">
          <span class="cs-orbit-core-glyph">⌘</span>
          <span class="cs-orbit-core-kicker">PROJECT GALLERY</span>
          <strong class="cs-orbit-core-title">${escape(active.title || "Component")}</strong>
          <span class="cs-orbit-core-detail">${escape(active.detail || "")}</span>
        </div>
        ${radialButtons}
      </div>
      <div class="cs-orbit-info" aria-label="Selected diagram component">
        <span class="cs-orbit-info-label">GALLERY ITEM</span>
        <span class="cs-orbit-selected-index">01 / ${String(count).padStart(2,"0")}</span>
        <h5 class="cs-orbit-selected-title" aria-live="polite">${escape(active.title || "Component")}</h5>
        <p class="cs-orbit-selected-detail" aria-live="polite">${escape(active.detail || "")}</p>
        <p class="cs-orbit-instruction">Select a photo or title around the circle.</p>
      </div>
    </div>`;
  }

  function syncOpenControls() {
    grid.querySelectorAll(".case-card").forEach(card => {
      const button=card.querySelector("[data-project]");
      const index=button ? Number(button.dataset.project) : -1;
      const open=index===state.activeProject;
      card.classList.toggle("is-selected",open);
      card.querySelectorAll("[data-project]").forEach(control => {
        control.setAttribute("aria-expanded",String(open));
        control.setAttribute("aria-label",(open?"Hide":"Show")+" system diagram for "+(state.projects[index]?.title || "project"));
        if(control.classList.contains("case-open")) {
          control.innerHTML=open ?
            'Close diagram <span aria-hidden="true">↑</span>' :
            'View diagram <span aria-hidden="true">↗</span>';
        }
      });
    });
  }

  function closeFloating(restoreFocus=false) {
    const index=state.activeProject;
    const layer=document.getElementById("project-floating-layer");
    if(layer) layer.remove();
    state.activeProject=null;
    syncOpenControls();
    if(restoreFocus && index!==null) {
      grid.querySelector(`[data-project="${index}"]`)?.focus();
    }
  }

  function selectOrbit(node) {
    const panel=node.closest(".cs-orbit-layout");
    if(!panel) return;
    const index=Number(node.dataset.orbitStep);
    if(!Number.isInteger(index)) return;
    for(const item of panel.querySelectorAll(".cs-orbit-node")) {
      const active=item===node;
      item.classList.toggle("is-active",active);
      item.setAttribute("aria-pressed",String(active));
    }
    for(const arc of panel.querySelectorAll("[data-orbit-segment]")) {
      arc.classList.toggle("is-active",Number(arc.dataset.orbitSegment)===index);
    }
    const title=node.querySelector(".cs-orbit-node-label")?.textContent || "Component";
    const detail=node.querySelector(".cs-orbit-node-description")?.textContent || "";
    const total=panel.querySelectorAll(".cs-orbit-node").length;
    const selected=panel.querySelector(".cs-orbit-selected-index");
    const heading=panel.querySelector(".cs-orbit-selected-title");
    const description=panel.querySelector(".cs-orbit-selected-detail");
    const centreTitle=panel.querySelector(".cs-orbit-core-title");
    const centreDetail=panel.querySelector(".cs-orbit-core-detail");
    if(selected) selected.textContent=pad(index+1)+" / "+pad(total);
    if(heading) heading.textContent=title;
    if(description) description.textContent=detail;
    if(centreTitle) centreTitle.textContent=title;
    if(centreDetail) centreDetail.textContent=detail;
    const core=panel.querySelector(".cs-orbit-core");
    setGalleryImage(core?.querySelector(".cs-orbit-core-gallery-photo"),node.dataset.orbitImage,core);
  }

  function toggleFloating(index) {
    const p=state.projects[index];
    if(!p) return;
    if(state.activeProject===index) {
      closeFloating(true);
      return;
    }
    closeFloating(false);
    const detail=lookupCase(p.title);
    const layer=document.createElement("div");
    layer.id="project-floating-layer";
    layer.className="project-float-layer";
    layer.setAttribute("role","dialog");
    layer.setAttribute("aria-modal","true");
    layer.setAttribute("aria-labelledby","project-floating-title");
    const summary=clean(detail.scope || p.description || "");
    const brief=summary.length>145 ? summary.slice(0,142).replace(/\s+\S*$/,"")+"…" : summary;
    layer.innerHTML=`
      <div class="project-float-veil" data-close-floating aria-hidden="true"></div>
      <div class="project-float-frame">
        <header class="project-float-header">
          <div class="project-float-heading">
            <span class="cs-eyebrow">PROJECT GALLERY · INTERACTIVE</span>
            <h4 id="project-floating-title">${escape(p.title || "Project")}</h4>
            ${brief ? `<p>${escape(brief)}</p>` : ""}
          </div>
          <button type="button" class="project-float-close" data-close-floating aria-label="Close system diagram">
            <span aria-hidden="true">✕</span>
          </button>
        </header>
        <div class="project-float-visual">${diagramMarkup(p,detail)}</div>
      </div>`;

    layer.addEventListener("click", event => {
      const node=event.target.closest("[data-orbit-step]");
      if(node) {selectOrbit(node);return;}
      if(event.target.closest("[data-close-floating]")) closeFloating(true);
    });

    layer.addEventListener("keydown", event => {
      if(event.key==="Escape") {
        event.preventDefault();
        closeFloating(true);
      } else if(event.key==="Tab") {
        // Keep keyboard focus on visible buttons while the overlay is open.
        const buttons=Array.from(layer.querySelectorAll("button:not([disabled])"));
        if(!buttons.length) return;
        const first=buttons[0],last=buttons[buttons.length-1];
        if(event.shiftKey && document.activeElement===first) {
          event.preventDefault();last.focus();
        } else if(!event.shiftKey && document.activeElement===last) {
          event.preventDefault();first.focus();
        }
      }
    });
    // Image loading errors do not leave broken picture icons.
    layer.querySelectorAll(".cs-orbit-gallery-image, .cs-orbit-core-gallery-photo, .cs-single-gallery-photo").forEach(img => {
      img.addEventListener("error", () => {
        img.hidden=true;
        if(img.classList.contains("cs-orbit-core-gallery-photo"))
          img.closest(".cs-orbit-core")?.classList.remove("has-gallery-image");
        if(img.classList.contains("cs-single-gallery-photo"))
          img.closest(".cs-single-gallery-circle")?.classList.remove("has-gallery-image");
      });
    });
    // The floating layer sits above the current page and never changes grid rows.
    document.body.appendChild(layer);
    state.activeProject=index;
    syncOpenControls();
    layer.querySelector(".project-float-close")?.focus();
  }

  grid.addEventListener("click", event => {
    const button=event.target.closest("[data-project]") ||
      event.target.closest(".case-card")?.querySelector("[data-project]");
    if(button) toggleFloating(Number(button.dataset.project));
  });

  el("showcase-filters").addEventListener("click", e => {
    const button = e.target.closest("[data-filter]");
    if(!button) return;
    state.category = button.dataset.filter;
    state.visible = 9;
    renderFilters();render();
  });
  let timer;
  el("showcase-query").addEventListener("input", e => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.query = clean(e.target.value);
      state.visible = 9;
      render();
    },120);
  });
  el("showcase-reset").addEventListener("click", () => {
    state.category = "all";state.query = "";state.visible = 9;
    el("showcase-query").value = "";
    renderFilters();render();
  });
  el("showcase-more").addEventListener("click", () => {
    state.visible += 9;render();
  });

  // Read-only JSONP feed: Google Apps Script ContentService redirects to a
  // Google-owned content domain and does not grant arbitrary CORS headers.
  // A tightly scoped callback lets a static GitHub Pages site read the data
  // without OAuth credentials or making the entire spreadsheet public.
  let liveGalleryRequestCounter=0;
  function fetchLiveGallery(url){
    return new Promise((resolve,reject)=>{
      const endpoint=String(url||"").trim();
      if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)){
        reject(new Error("Invalid ProjectGallery API URL"));return;
      }
      const callback="__jjGalleryCb_"+Date.now()+"_"+(++liveGalleryRequestCounter);
      const script=document.createElement("script");
      const src=new URL(endpoint);
      src.searchParams.set("action","gallery");
      src.searchParams.set("callback",callback);
      src.searchParams.set("_",String(Date.now()));
      let settled=false;
      let timer;
      const cleanup=()=>{
        clearTimeout(timer);
        script.remove();
        try{delete window[callback]}catch(_){window[callback]=undefined}
      };
      const finish=(err,rows)=>{
        if(settled)return;
        settled=true;
        cleanup();
        if(err)reject(err);
        else resolve(rows);
      };
      window[callback]=payload=>{
        if(payload?.ok!==true || !Array.isArray(payload.projectGallery)){
          finish(new Error("Invalid live Gallery response"));return;
        }
        // [] is authoritative; never replace it with the stale snapshot.
        finish(null,payload.projectGallery.slice(0,2000));
      };
      script.onerror=()=>finish(new Error("Could not reach the live Gallery endpoint"));
      script.src=src.toString();
      timer=setTimeout(()=>finish(new Error("Live Gallery request timed out")),9000);
      document.head.appendChild(script);
    });
  }

  async function start(){
    let mainFeedHasGallery=false;
    try{
      const data = typeof window.loadData === "function" ? await window.loadData() : window.FALLBACK_DATA;
      state.projects = (Array.isArray(data?.portfolio) ? data.portfolio : window.FALLBACK_DATA?.portfolio || [])
        .filter(p => p && typeof p === "object");
      mainFeedHasGallery=Array.isArray(data?.projectGallery);
      // When either live backend returns [], treat it as an intentional deletion.
      state.gallery = mainFeedHasGallery ? data.projectGallery :
        (Array.isArray(window.PORTFOLIO_PROJECT_GALLERY) ? window.PORTFOLIO_PROJECT_GALLERY : null);
      if(data?.projectDetails && !Array.isArray(data.projectDetails) && typeof data.projectDetails === "object"){
        state.caseStudies = data.projectDetails;
      }
    }catch(err){
      console.warn("Could not load main portfolio feed; using local projects.",err);
      state.projects = window.FALLBACK_DATA?.portfolio || [];
      state.gallery = Array.isArray(window.PORTFOLIO_PROJECT_GALLERY) ? window.PORTFOLIO_PROJECT_GALLERY : null;
    }
    const galleryUrl=String(window.PORTFOLIO_CONFIG?.PROJECT_GALLERY_API_URL || "").trim();
    if(galleryUrl){
      try{
        state.gallery=await fetchLiveGallery(galleryUrl);
        state.galleryError=false;
        console.info("ProjectGallery: live rows",state.gallery.length);
      }catch(err){
        console.warn("Live ProjectGallery could not be read.",err);
        // Never resurrect removed items from an old snapshot after live
        // service failure. The main feed is usable only if it has live rows.
        state.gallery=mainFeedHasGallery ? state.gallery : [];
        state.galleryError=!mainFeedHasGallery;
      }
    }
    el("showcase-toolbar").hidden = state.projects.length <= 9;
    renderFilters();
    render();
  }
  start();
})();
