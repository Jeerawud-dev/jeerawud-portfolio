/* Interactive portfolio showcase. Keeps the original app.js / Google Sheets data contract. */
(() => {
  "use strict";

  const byId = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
  const clean = value => String(value ?? "").trim();
  const prefersLessMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const visualTone = category => {
    const text = clean(category).toLowerCase();
    if (/software|\.net|c#|application|program|system|iot|data|cloud|digital|mes|pc.based/.test(text)) return "software";
    if (/r&d|research|innovation|design|prototype|develop/.test(text)) return "r-d";
    return "automation";
  };
  const validUrl = value => {
    const source = clean(value);
    if (!source) return "";
    try {
      const url = new URL(source, document.baseURI);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };
  const tags = value => clean(value).split(",").map(clean).filter(Boolean).slice(0, 8);
  const isFeatured = value => value === true || value === 1 || /^(yes|true|1|featured)$/i.test(clean(value));
  const pad = number => String(number).padStart(2, "0");
  const limitText = (value, limit) => clean(value).length > limit ? clean(value).slice(0, limit).trimEnd() + "…" : clean(value);
  const reduced = () => prefersLessMotion.matches;

  const state = { projects: [], category: "all", query: "", visible: 6, featured: [], activeFeatured: 0 };
  const menuButton = byId("nav-menu-toggle");
  const menuLinks = byId("primary-links");
  if (menuButton && menuLinks) {
    const setMenu = open => {
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      menuLinks.classList.toggle("menu-open", open);
    };
    menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
    menuLinks.addEventListener("click", event => { if (event.target.closest("a")) setMenu(false); });
    document.addEventListener("click", event => { if (!event.target.closest(".nav")) setMenu(false); });
    document.addEventListener("keydown", event => { if (event.key === "Escape") setMenu(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 900) setMenu(false); });
  }
  const rail = byId("showcase-featured");
  const grid = byId("showcase-grid");
  const modal = byId("project-dialog");
  if (!rail || !grid || !modal) return;

  function visual(project, type, number) {
    const tone = visualTone(project.category);
    const label = clean(project.category || "ENGINEERING").toUpperCase();
    const imageUrl = validUrl(project.imageUrl);
    return `<div class="${type === "dialog" ? "dialog-visual" : type === "feature" ? "feature-visual" : "case-visual"}">
      <div class="visual-art art-${tone}" aria-hidden="true"><span class="visual-ring"></span><span class="visual-node"></span></div>
      ${imageUrl ? `<img class="project-photo" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(project.title || "Engineering project")}" loading="lazy" decoding="async">` : ""}
      <span class="visual-code">${escapeHtml(limitText(label, 28))} / ${pad(number)}</span>
      <span class="visual-coordinate" aria-hidden="true">ENGINEERED WITH PURPOSE&nbsp; ↗</span>
      ${type === "case" ? `<span class="case-number">CASE / ${pad(number)}</span>` : ""}
    </div>`;
  }

  function techMarkup(project, count = 4) {
    return `<div class="tech">${tags(project.technologies).slice(0, count).map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`;
  }

  function featureMarkup({project, index}, number) {
    return `<article class="feature-card" aria-label="Featured project ${number}: ${escapeHtml(project.title)}">
      <div class="feature-copy">
        <div class="feature-eyebrow">FEATURED PROJECT ${pad(number)}</div>
        <h5>${escapeHtml(project.title || "Untitled project")}</h5>
        <p>${escapeHtml(project.description || "Software engineering and industrial automation.")}</p>
        <div class="feature-bottom">
          ${techMarkup(project, 3)}
          <button type="button" class="feature-open" data-open-project="${index}" aria-label="View details for ${escapeHtml(project.title || "project")}">Explore case <span aria-hidden="true">↗</span></button>
        </div>
      </div>
      ${visual(project, "feature", number)}
    </article>`;
  }

  function cardMarkup(project, index) {
    const number = index + 1;
    return `<article class="case-card" aria-label="${escapeHtml(project.title || "Engineering project")}">
      ${visual(project, "case", number)}
      <div class="case-content">
        <div class="case-overline"><span>${escapeHtml(project.category || "Engineering")}</span><span class="case-period">${escapeHtml(project.period)}</span></div>
        <h5>${escapeHtml(project.title || "Untitled project")}</h5>
        <p class="case-desc">${escapeHtml(project.description || "Engineering solution and software implementation.")}</p>
        ${techMarkup(project, 4)}
        <div class="case-bottom"><span class="case-context" title="${escapeHtml(project.context)}">${escapeHtml(project.context || "Engineering project")}</span>
          <button type="button" class="case-open" data-open-project="${index}" aria-label="View details for ${escapeHtml(project.title || "project")}">Details <span aria-hidden="true">↗</span></button>
        </div>
      </div>
    </article>`;
  }

  function attachImageFallback(parent) {
    parent.querySelectorAll("img.project-photo").forEach(image => {
      const failed = () => { image.hidden = true; };
      image.addEventListener("error", failed, {once:true});
      if (image.complete && image.naturalWidth === 0) failed();
    });
  }

  function updateRailControls() {
    const count = state.featured.length;
    const current = state.activeFeatured;
    byId("showcase-rail-index").textContent = `${pad(count ? current + 1 : 0)} / ${pad(count)}`;
    byId("showcase-prev").disabled = current === 0 || !count;
    byId("showcase-next").disabled = current >= count - 1 || !count;
  }

  function moveFeature(direction) {
    const cards = Array.from(rail.children);
    if (!cards.length) return;
    state.activeFeatured = Math.max(0, Math.min(cards.length - 1, state.activeFeatured + direction));
    rail.scrollTo({left: cards[state.activeFeatured].offsetLeft - cards[0].offsetLeft, behavior:reduced() ? "auto" : "smooth"});
    updateRailControls();
  }

  function renderFeatured() {
    const featured = state.projects.map((project, index) => ({project,index})).filter(entry => isFeatured(entry.project.featured));
    state.featured = (featured.length ? featured : state.projects.map((project,index) => ({project,index}))).slice(0, 8);
    state.activeFeatured = 0;
    rail.innerHTML = state.featured.map(featureMarkup).join("");
    rail.parentElement.querySelector(".showcase-kicker").hidden = state.featured.length === 0;
    rail.hidden = state.featured.length === 0;
    updateRailControls();
    attachImageFallback(rail);
  }

  function renderFilters() {
    const counts = new Map();
    state.projects.forEach(project => {
      const category = clean(project.category) || "Engineering";
      const key = category.toLowerCase();
      const previous = counts.get(key);
      counts.set(key, {name: previous?.name || category, count: (previous?.count || 0) + 1});
    });
    const categories = [{key:"all",name:"All projects",count:state.projects.length}, ...Array.from(counts.entries()).map(([key,value]) => ({key,...value}))];
    byId("showcase-filters").innerHTML = categories.map(x => `<button type="button" class="filter-button" data-filter="${escapeHtml(x.key)}" aria-pressed="${String(x.key === state.category)}">${escapeHtml(x.name)} <span class="chip-number">${x.count}</span></button>`).join("");
    byId("showcase-total").textContent = pad(state.projects.length);
  }

  const observer = ("IntersectionObserver" in window && !reduced()) ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("is-in-view");
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:.09,rootMargin:"0px 0px -25px 0px"}) : null;

  function renderCards() {
    const query = state.query.toLocaleLowerCase();
    const result = state.projects.map((project,index) => ({project,index})).filter(({project}) => {
      const category = clean(project.category || "Engineering").toLowerCase();
      const searchable = [project.title,project.description,project.category,project.technologies,project.context,project.period].map(clean).join(" ").toLocaleLowerCase();
      return (state.category === "all" || category === state.category) && (!query || searchable.includes(query));
    });

    const showing = result.slice(0, state.visible);
    if(observer) observer.disconnect();
    grid.innerHTML = showing.map(({project,index}) => cardMarkup(project,index)).join("");
    const empty = result.length === 0;
    byId("showcase-empty").hidden = !empty;
    byId("showcase-more").hidden = empty || result.length <= showing.length;
    byId("showcase-count").textContent = empty ? "No matching projects" : `Showing ${showing.length} of ${result.length} project${result.length !== 1 ? "s" : ""}`;
    attachImageFallback(grid);
    grid.querySelectorAll(".case-card").forEach((card,index) => {
      if(observer){ card.style.setProperty("--case-delay", `${Math.min(index % 3,2) * 75}ms`); observer.observe(card); }
      else card.classList.add("is-in-view");
    });
  }

  function openProject(index) {
    const project = state.projects[index];
    if (!project) return;
    const link = validUrl(project.projectLink);
    const info = [
      ["TIMELINE", project.period || "Not specified"],
      ["CONTEXT", project.context || "Engineering portfolio"]
    ];
    const content = byId("project-dialog-content");
    content.innerHTML = `${visual(project,"dialog",index+1)}
      <div class="dialog-content">
        <div class="micro-label">ENGINEERING PROJECT / ${pad(index+1)}</div>
        <h3 id="project-dialog-title">${escapeHtml(project.title || "Untitled project")}</h3>
        <p>${escapeHtml(project.description || "Details for this engineering project will be added soon.")}</p>
        <div class="dialog-information">${info.map(([label,value]) => `<div><span class="micro-label">${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>
        <span class="micro-label">TOOLS & TECHNOLOGIES</span>
        ${techMarkup(project, 8)}
        ${link ? `<a class="btn btn-primary dialog-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">Visit project <span aria-hidden="true">↗</span></a>` : `<p class="dialog-no-link">Project link is not available yet.</p>`}
      </div>`;
    attachImageFallback(content);
    if (!modal.open) modal.showModal();
    byId("project-dialog-close").focus();
  }

  rail.addEventListener("click", event => {
    const button = event.target.closest("button[data-open-project]");
    if(button) openProject(Number(button.dataset.openProject));
  });
  grid.addEventListener("click", event => {
    const button = event.target.closest("button[data-open-project]");
    if(button) openProject(Number(button.dataset.openProject));
  });
  byId("showcase-filters").addEventListener("click", event => {
    const button = event.target.closest("button[data-filter]");
    if(!button || state.category === button.dataset.filter) return;
    state.category = button.dataset.filter;
    state.visible = 6;
    renderFilters();
    renderCards();
    byId("showcase-filters").querySelector(`[data-filter="${CSS.escape(state.category)}"]`)?.focus({preventScroll:true});
  });
  let searchTimer;
  byId("showcase-query").addEventListener("input", event => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = clean(event.target.value);
      state.visible = 6;
      renderCards();
    }, 110);
  });
  byId("showcase-reset").addEventListener("click", () => {
    state.category = "all";
    state.query = "";
    state.visible = 6;
    byId("showcase-query").value = "";
    renderFilters();
    renderCards();
    byId("showcase-query").focus();
  });
  byId("showcase-more").addEventListener("click", () => { state.visible += 6; renderCards(); });
  byId("showcase-prev").addEventListener("click", () => moveFeature(-1));
  byId("showcase-next").addEventListener("click", () => moveFeature(1));

  // Sync pager with drag, touch swipes and horizontal trackpad scrolling.
  let railRaf;
  rail.addEventListener("scroll", () => {
    if(railRaf) cancelAnimationFrame(railRaf);
    railRaf = requestAnimationFrame(() => {
      const items = Array.from(rail.children);
      const left = rail.getBoundingClientRect().left;
      let best = 0, distance = Infinity;
      items.forEach((item,index) => {
        const d = Math.abs(item.getBoundingClientRect().left - left);
        if(d < distance) { best = index; distance = d; }
      });
      state.activeFeatured = best;
      updateRailControls();
    });
  }, {passive:true});

  const closeModal = () => { if(modal.open) modal.close(); };
  byId("project-dialog-close").addEventListener("click", closeModal);
  modal.addEventListener("click", event => {
    // Clicking on dialog backdrop (outside its rect) closes it.
    if(event.target !== modal) return;
    const rect = modal.getBoundingClientRect();
    if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeModal();
  });
  modal.addEventListener("wheel", event => event.stopPropagation(), {passive:true});
  window.addEventListener("keydown", event => {
    if(modal.open && ["PageDown","PageUp"].includes(event.key)) event.stopImmediatePropagation();
  }, {capture:true});

  async function start() {
    try {
      // Deliberately reads the same established source as the existing app.js;
      // no changes to config.js, the Google Apps Script, or Sheet columns required.
      const data = typeof window.loadData === "function" ? await window.loadData() : window.FALLBACK_DATA;
      const fallback = window.FALLBACK_DATA || {};
      const projects = Array.isArray(data?.portfolio) ? data.portfolio : (fallback.portfolio || []);
      state.projects = projects.filter(project => project && typeof project === "object").map(project => ({...project}));
      renderFeatured();
      renderFilters();
      renderCards();
    } catch (error) {
      console.error("Portfolio showcase could not load.",error);
      state.projects = Array.isArray(window.FALLBACK_DATA?.portfolio) ? window.FALLBACK_DATA.portfolio : [];
      renderFeatured();renderFilters();renderCards();
    }
  }
  start();
})();
