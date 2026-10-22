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
    return `<div class="${modalView ? "dialog-visual" : "case-visual"}">
      <div class="visual-art art-${tone}" aria-hidden="true"><span class="visual-ring"></span><span class="visual-node"></span></div>
      ${src ? `<img class="project-photo" src="${escape(src)}" alt="${escape(project.title || "Project photo")}" loading="lazy" decoding="async">` : ""}
      <span class="visual-code">${escape(project.category || "Engineering")}</span>
      <span class="case-number">${pad(index+1)}</span>
    </div>`;
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
  function openProject(index){
    const p = state.projects[index];
    if(!p) return;
    const link = validUrl(p.projectLink);
    const content = el("project-dialog-content");
    content.innerHTML = `${visual(p,index,true)}
      <div class="dialog-content">
        <span class="micro-label">${escape(p.category || "Engineering")}</span>
        <h3 id="project-dialog-title">${escape(p.title || "Project")}</h3>
        <p>${escape(p.description || "")}</p>
        <div class="dialog-information">
          <div><span class="micro-label">Period</span><strong>${escape(p.period || "—")}</strong></div>
          <div><span class="micro-label">Company</span><strong>${escape(p.context || "—")}</strong></div>
        </div>
        <span class="micro-label">Technology</span>
        ${techMarkup(p,8)}
        ${link ? `<a class="btn btn-primary dialog-link" target="_blank" rel="noopener noreferrer" href="${escape(link)}">Open project ↗</a>` : ""}
      </div>`;
    handleImages(content);
    if(!modal.open) modal.showModal();
    el("project-dialog-close").focus();
  }

  grid.addEventListener("click", e => {
    const button = e.target.closest("[data-project]");
    if(button) openProject(Number(button.dataset.project));
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
