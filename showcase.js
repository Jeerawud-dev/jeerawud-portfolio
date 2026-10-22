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

  const state = {projects: [], category: "all", query: "", visible: 9};
  const grid = el("showcase-grid");
  const modal = el("project-dialog");
  if (!grid || !modal) return;

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
    const action = modalView ? "" : ` type="button" data-project="${index}" aria-label="View details for ${escape(project.title || "Project")}"`;
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
          <button type="button" class="case-open" data-project="${index}" aria-label="View ${escape(project.title || "project")} details">View details <span aria-hidden="true">↗</span></button>
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


  // Radial Engineering System Overview: interactive, data-driven and keyboard accessible.
  // Ring arrows are a visual presentation of the published conceptual workflow,
  // not a machine's electrical wiring diagram.
  function diagramMarkup(p, detail) {
    const nodes = (Array.isArray(detail.diagram) ? detail.diagram : []).filter(n => n && (n.title || n.detail)).slice(0,6);
    if (!nodes.length) {
      const stack = tags(p.technologies).slice(0,4);
      if (!stack.length) return "";
      nodes.push(...stack.map(tech => ({title:tech,detail:"Listed technology"})));
    }
    const count = nodes.length;
    const colors = ["cyan","amber","blue","mint","violet","coral"];
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
        data-orbit-step="${i}" aria-pressed="${i===0?"true":"false"}"
        aria-label="Stage ${String(i+1).padStart(2,"0")}: ${escape(title)}. ${escape(sub)}"
        style="left:${x}%;top:${y}%">
        <span class="cs-orbit-node-number">${String(i+1).padStart(2,"0")}</span>
        <span class="cs-orbit-node-icon">${icon(i)}</span>
        <strong class="cs-orbit-node-label">${escape(title)}</strong>
        <span class="cs-orbit-node-description" hidden>${escape(sub)}</span>
      </button>`;
    }).join("");
    const active=nodes[0];
    return `<section class="cs-section cs-diagram-section cs-radial-section">
      <div class="cs-section-top"><div><span class="cs-eyebrow">SYSTEM OVERVIEW</span>
        <h4>System workflow</h4></div><span class="cs-context-note">Select a stage to view its details</span></div>
      <div class="cs-orbit-layout">
        <div class="cs-orbit-stage" role="group" aria-label="Interactive circular system component map">
          <svg class="cs-orbit-graphic" viewBox="0 0 640 640" focusable="false" aria-hidden="true">
            <circle class="cs-orbit-background-ring" cx="320" cy="320" r="218"/>
            <circle class="cs-orbit-guide-ring" cx="320" cy="320" r="148"/>
            <circle class="cs-orbit-dashed-ring" cx="320" cy="320" r="225"/>
            ${arrows}
            <circle class="cs-orbit-inner-detail" cx="320" cy="320" r="140"/>
          </svg>
          <div class="cs-orbit-core" aria-hidden="true">
            <span class="cs-orbit-core-glyph">⌘</span>
            <span class="cs-orbit-core-kicker">SYSTEM MAP</span>
            <strong class="cs-orbit-core-title">${escape(active.title || "Component")}</strong>
            <span class="cs-orbit-core-detail">${escape(active.detail || "")}</span>
          </div>
          ${radialButtons}
        </div>
        <aside class="cs-orbit-info">
          <div class="cs-orbit-info-top"><span class="cs-orbit-info-kicker">SYSTEM / ${String(count).padStart(2,"0")} STAGES</span>
          <span class="cs-orbit-info-mark" aria-hidden="true">↻</span></div>
          <span class="cs-orbit-selected-index">01 <span>/ ${String(count).padStart(2,"0")}</span></span>
          <span class="cs-orbit-info-label">SELECTED STAGE</span>
          <h5 class="cs-orbit-selected-title" aria-live="polite">${escape(active.title || "Component")}</h5>
          <p class="cs-orbit-selected-detail" aria-live="polite">${escape(active.detail || "Select any stage in the circle to see its role.")}</p>
          <div class="cs-orbit-info-divider"></div>
          <span class="cs-orbit-info-label">SEQUENCE</span>
          <div class="cs-orbit-mini-steps" aria-hidden="true">${nodes.map((n,i)=>`<span class="cs-orbit-mini-step cs-tone-${i%6} ${i===0?"is-active":""}" data-orbit-mini="${i}">${String(i+1).padStart(2,"0")}</span>`).join("")}</div>
          <p class="cs-orbit-instruction">The arrows show a simplified system flow. Select any component for details.</p>
        </aside>
      </div>
      <p class="cs-diagram-footnote">Conceptual overview based on the published project description and technologies; not an electrical schematic.</p>
    </section>`;
  }

  function caseHighlights(detail) {
    const highlights = Array.isArray(detail.highlights) ? detail.highlights.map(clean).filter(Boolean).slice(0,8) : [];
    if (!highlights.length) return "";
    return `<section class="cs-section cs-scope">
      <span class="cs-eyebrow">WORK AREAS</span><h4>What the project involved</h4>
      <ul class="cs-highlights">${highlights.map(x => `<li>${escape(x)}</li>`).join("")}</ul>
    </section>`;
  }
  function mediaBlock(group, sourceImages) {
    const images = (Array.isArray(sourceImages) ? sourceImages : []).filter(x => validUrl(x?.url)).slice(0,8);
    const name = group === "machine" ? "Machine & process photos" : "Software UI screenshots";
    const desc = group === "machine" ? "MACHINE / HARDWARE" : "CONTROL UI / APPLICATION";
    if (!images.length) {
      return `<div class="cs-media-panel cs-media-panel--empty">
        <div class="cs-media-placeholder" aria-hidden="true"><span>${group === "machine" ? "▱" : "▤"}</span><i></i><i></i><i></i></div>
        <div class="cs-media-info"><span class="cs-eyebrow">${desc}</span>
        <h5>${name}</h5><p>No images added for this project yet.</p></div>
      </div>`;
    }
    return `<div class="cs-media-panel"><div class="cs-media-label">
      <span class="cs-eyebrow">${desc}</span><h5>${name}</h5></div>
      <div class="cs-media-grid">${images.map((img,i) => `<figure class="cs-media-item">
        <a href="${escape(validUrl(img.url))}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escape(img.caption || name)} image">
          <img loading="lazy" decoding="async" src="${escape(validUrl(img.url))}" alt="${escape(img.alt || img.caption || name)}">
          <span class="cs-image-expand" aria-hidden="true">↗</span>
        </a><figcaption>${escape(img.caption || `Image ${i+1}`)}</figcaption>
      </figure>`).join("")}</div></div>`;
  }

  function openProject(index){
    const p = state.projects[index];
    if(!p) return;
    const detail = lookupCase(p.title);
    const machineImages = [...(Array.isArray(detail.machineImages) ? detail.machineImages : [])];
    if (validUrl(p.imageUrl) && !machineImages.some(x=>validUrl(x.url)===validUrl(p.imageUrl))) {
      machineImages.unshift({url:p.imageUrl,caption:p.title});
    }
    const link = validUrl(p.projectLink);
    const title = escape(p.title || "Project");
    const content = el("project-dialog-content");
    content.innerHTML = `<div class="cs-case-study">
      <div class="cs-hero">
        <div class="cs-hero-copy">
          <span class="cs-eyebrow">SELECTED PROJECT / ${pad(index + 1)}</span>
          <h3 id="project-dialog-title">${title}</h3>
          <p class="cs-intro">${escape(detail.overview || p.description || "")}</p>
          <div class="cs-summary-strip">
            <div><span>YEAR / PERIOD</span><strong>${escape(p.period || "Not specified")}</strong></div>
            <div><span>COMPANY / CONTEXT</span><strong>${escape(p.context || "Not specified")}</strong></div>
          </div>
        </div>
        <div class="cs-hero-graphic">${visual(p,index,true)}</div>
      </div>
      <div class="cs-body">
        ${(clean(detail.scope) || clean(detail.role)) ? `<div class="cs-overview">
          ${clean(detail.scope) ? `<div><span class="cs-eyebrow">PROJECT SCOPE</span><p>${escape(detail.scope)}</p></div>` : ""}
          ${clean(detail.role) ? `<div><span class="cs-eyebrow">MY WORK</span><p>${escape(detail.role)}</p></div>` : ""}
        </div>` : ""}
        ${diagramMarkup(p,detail)}
        <div class="cs-specs">
          <section class="cs-section cs-technologies"><span class="cs-eyebrow">TECHNOLOGY</span>
            <h4>Stack & interfaces</h4>${techMarkup(p,20) || "<p>No technologies specified.</p>"}
          </section>
          ${caseHighlights(detail)}
        </div>
        <section class="cs-section cs-gallery">
          <div class="cs-section-top"><div><span class="cs-eyebrow">PROJECT GALLERY</span>
          <h4>Machine & software interface</h4></div><span class="cs-context-note">Images can be added per project</span></div>
          <div class="cs-media-layout">${mediaBlock("machine",machineImages)}${mediaBlock("ui",detail.uiImages)}</div>
        </section>
        <div class="cs-end">${link ? `<a class="btn btn-primary" target="_blank" rel="noopener noreferrer" href="${escape(link)}">Open project link ↗</a>` : ""}
          <button class="cs-back" type="button" data-close-project>← Back to projects</button>
        </div>
      </div>
    </div>`;
    handleImages(content);
    if(!modal.open) modal.showModal();
    else modal.scrollTop = 0;
    el("project-dialog-close").focus();
  }

  grid.addEventListener("click", e => {
    // Any part of a project card opens its details. Visual and action buttons
    // remain independently keyboard-accessible.
    const button = e.target.closest("[data-project]") ||
      e.target.closest(".case-card")?.querySelector("[data-project]");
    if(button) openProject(Number(button.dataset.project));
  });
  el("project-dialog-content").addEventListener("click", e => {
    const node=e.target.closest("[data-orbit-step]");
    if(node) {
      const panel=node.closest(".cs-orbit-layout");
      if(!panel) return;
      const index=Number(node.dataset.orbitStep);
      if(!Number.isInteger(index)) return;
      for(const item of panel.querySelectorAll(".cs-orbit-node")) {
        const active=item===node;
        item.classList.toggle("is-active",active);
        item.setAttribute("aria-pressed", String(active));
      }
      for(const arc of panel.querySelectorAll("[data-orbit-segment]")) {
        arc.classList.toggle("is-active",Number(arc.dataset.orbitSegment)===index);
      }
      for(const chip of panel.querySelectorAll("[data-orbit-mini]")) {
        chip.classList.toggle("is-active",Number(chip.dataset.orbitMini)===index);
      }
      const title=node.querySelector(".cs-orbit-node-label")?.textContent || "Component";
      const detail=node.querySelector(".cs-orbit-node-description")?.textContent || "";
      const total=panel.querySelectorAll(".cs-orbit-node").length;
      const selected=panel.querySelector(".cs-orbit-selected-index");
      const h=panel.querySelector(".cs-orbit-selected-title");
      const p=panel.querySelector(".cs-orbit-selected-detail");
      const coreTitle=panel.querySelector(".cs-orbit-core-title");
      const coreDetail=panel.querySelector(".cs-orbit-core-detail");
      if(selected) selected.textContent=String(index+1).padStart(2,"0") + " / " + String(total).padStart(2,"0");
      if(h) h.textContent=title;
      if(p) p.textContent=detail || "Component in this project's system flow.";
      if(coreTitle) coreTitle.textContent=title;
      if(coreDetail) coreDetail.textContent=detail;
      return;
    }
    if(e.target.closest("[data-close-project]") && modal.open) modal.close();
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
  el("project-dialog-close").addEventListener("click", () => {
    if(modal.open) modal.close();
  });
  modal.addEventListener("click", e => {
    if(e.target !== modal) return;
    const r = modal.getBoundingClientRect();
    if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) modal.close();
  });
  modal.addEventListener("wheel", e => e.stopPropagation(),{passive:true});
  window.addEventListener("keydown", e => {
    if(modal.open && ["PageDown","PageUp"].includes(e.key)) e.stopImmediatePropagation();
  },{capture:true});

  async function start(){
    try{
      const data = typeof window.loadData === "function" ? await window.loadData() : window.FALLBACK_DATA;
      state.projects = (Array.isArray(data?.portfolio) ? data.portfolio : window.FALLBACK_DATA?.portfolio || [])
        .filter(p => p && typeof p === "object");
      // Optional future compatibility if the existing Google Sheets feed returns projectDetails.
      if(data?.projectDetails && !Array.isArray(data.projectDetails) && typeof data.projectDetails === "object"){
        state.caseStudies = data.projectDetails;
      }
    }catch(err){
      console.warn("Could not load live projects; using local list.",err);
      state.projects = window.FALLBACK_DATA?.portfolio || [];
    }
    // Search and category filters become useful only when the gallery grows.
    el("showcase-toolbar").hidden = state.projects.length <= 9;
    renderFilters();
    render();
  }
  start();
})();
