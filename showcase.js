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

  function diagramMarkup(p, detail) {
    const nodes = (Array.isArray(detail.diagram) ? detail.diagram : []).slice(0, 6);
    if (!nodes.length) {
      const stack = tags(p.technologies).slice(0, 4);
      if (!stack.length) return "";
      nodes.push(...stack.map(tech => ({title:tech, detail:"Listed technology"})));
    }
    return `<section class="cs-section cs-diagram-section">
      <div class="cs-section-top"><div><span class="cs-eyebrow">SYSTEM OVERVIEW</span>
        <h4>How the pieces connect</h4></div><span class="cs-context-note">Simplified technology map</span></div>
      <div class="cs-diagram" role="list" aria-label="Conceptual system component map">
        ${nodes.map((n,i) => `<div class="cs-diagram-node" role="listitem">
          <span class="cs-step">${String(i+1).padStart(2,"0")}</span>
          <span class="cs-node-icon" aria-hidden="true">${["◇","▤","⌘","⇆","⟲","◈"][i] || "◈"}</span>
          <strong>${escape(n.title || "Component")}</strong>
          <small>${escape(n.detail || "")}</small>
        </div>`).join("")}
      </div>
      <p class="cs-diagram-footnote">Overview based on the published project description and technology stack. It is not an electrical schematic.</p>
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
    const button = e.target.closest("[data-project]");
    if(button) openProject(Number(button.dataset.project));
  });
  el("project-dialog-content").addEventListener("click", e => {
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
