
const $ = (s) => document.querySelector(s);
const esc = (v = "") => String(v ?? "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

async function loadData(){
  const url = window.PORTFOLIO_CONFIG?.GOOGLE_APPS_SCRIPT_URL?.trim();
  if(url){
    try{
      const r = await fetch(url, {cache:"no-store"});
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      $("#data-status").textContent = "Live data from Google Sheets";
      return data;
    }catch(err){
      console.warn("Google Sheets data unavailable; using local fallback.", err);
      $("#data-status").textContent = "Local resume data (Google Sheet unavailable)";
    }
  }
  return window.FALLBACK_DATA;
}

function splitTech(s){
  return String(s||"").split(",").map(x=>x.trim()).filter(Boolean);
}

function render(data){
  const p = data.profile || {};
  const settings = data.settings || {};
  document.title = settings.SiteTitle || `${p.fullName || "Portfolio"} | Software Engineer`;
  $("#hero-name").textContent = p.fullName || "";
  $("#hero-headline").textContent = settings.HeroTagline || p.specialization || p.headline || "";
  $("#hero-summary").textContent = p.summary || "";
  $("#about-summary").textContent = p.summary || "";
  $("#about-location").textContent = p.location || "";
  $("#about-email").textContent = p.email || "";
  $("#about-email").href = p.email ? `mailto:${p.email}` : "#";
  $("#primary-cta").textContent = settings.PrimaryCTA || "View Portfolio";

  $("#experience-list").innerHTML = (data.experience || []).map(x => `
    <article class="timeline-item">
      <div class="timeline-period">${esc(x.startYear)} — ${esc(x.endYear)}</div>
      <div>
        <h4>${esc(x.company)}</h4>
        <div class="role">${esc(x.role)} · ${esc(x.area)}</div>
        <p>${esc(x.description)}</p>
      </div>
    </article>`).join("");

  $("#portfolio-grid").innerHTML = (data.portfolio || []).map((x,i) => {
    const image = x.imageUrl ? `<img src="${esc(x.imageUrl)}" alt="${esc(x.title)}">` : "";
    const link = x.projectLink ? `<a class="project-link" href="${esc(x.projectLink)}" target="_blank" rel="noopener">View project ↗</a>` : "";
    return `<article class="project-card">
      <div class="project-visual">${image}<span class="project-index">PROJECT ${String(i+1).padStart(2,"0")}</span></div>
      <div class="project-body">
        <div class="tag">${esc(x.category || "ENGINEERING")}</div>
        <h4>${esc(x.title)}</h4>
        <p>${esc(x.description)}</p>
        <div class="tech">${splitTech(x.technologies).map(t=>`<span>${esc(t)}</span>`).join("")}</div>
        <div class="project-meta">${esc(x.period)}${x.period && x.context ? " · " : ""}${esc(x.context)}</div>
        ${link}
      </div>
    </article>`;
  }).join("");

  $("#skills-grid").innerHTML = (data.skills || []).map(x => `
    <article class="skill-card">
      <h4>${esc(x.category)}</h4>
      <div class="skill-level">${esc(x.level || "ENGINEERING STACK")}</div>
      <p>${esc(x.technologies)}</p>
    </article>`).join("");

  $("#cert-grid").innerHTML = (data.certificates || []).map(x => `
    <div class="cert">
      <div><strong>${esc(x.name)}</strong><span>${esc(x.provider)}</span></div>
      <div class="cert-year">${esc(x.year)}</div>
    </div>`).join("");

  $("#education-list").innerHTML = (data.education || []).map(x => `
    <article class="education">
      <div><h4>${esc(x.program)}</h4><p>${esc(x.institution)} · ${esc(x.startYear)}–${esc(x.endYear)}</p></div>
      <div class="gpa">GPA ${esc(x.gpa)}</div>
    </article>`).join("");

  const email = p.email || "";
  $("#contact-email").href = email ? `mailto:${email}` : "#";
  $("#contact-email").textContent = email ? email : "Email Me";

  const showPhone = String(settings.ShowPhone || "Yes").toLowerCase() !== "no";
  const phoneEl = $("#contact-phone");
  if(showPhone && p.phone){
    phoneEl.href = `tel:${String(p.phone).replace(/[^\d+]/g,"")}`;
    phoneEl.textContent = p.phone;
  } else {
    phoneEl.style.display = "none";
  }
}

$("#year").textContent = new Date().getFullYear();


function initSmartScroll(){
  const sections = [...document.querySelectorAll("main > section[id]")];
  const dotWrap = document.querySelector("#scroll-dots");
  const progressFill = document.querySelector("#scroll-progress-fill");
  const sectionName = document.querySelector("#scroll-section-name");
  const navLinks = [...document.querySelectorAll(".nav-links a[href^='#']")];

  if(!sections.length) return;

  const titleFor = section => section.dataset.title || section.id.toUpperCase();

  // Build right-side section navigator.
  if(dotWrap && !dotWrap.children.length){
    sections.forEach((section, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scroll-dot";
      btn.setAttribute("aria-label", `Go to ${titleFor(section)}`);
      btn.dataset.target = section.id;
      btn.innerHTML = `<span>${String(index + 1).padStart(2,"0")}</span>`;
      btn.addEventListener("click", () => {
        section.scrollIntoView({behavior:"smooth", block:"start"});
      });
      dotWrap.appendChild(btn);
    });
  }

  const dots = [...document.querySelectorAll(".scroll-dot")];

  function setActive(section){
    if(!section) return;
    const id = section.id;
    dots.forEach(d => d.classList.toggle("active", d.dataset.target === id));
    navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${id}`));
    if(sectionName) sectionName.textContent = titleFor(section);
  }

  // Reveal content as it enters the viewport.
  const revealTargets = [
    ...document.querySelectorAll(
      ".section-heading, .about-grid, .timeline-item, .project-card, .skill-card, .cert, .education, .contact-card"
    )
  ];

  revealTargets.forEach((el, i) => {
    el.classList.add("smart-reveal");
    if(
      el.classList.contains("timeline-item") ||
      el.classList.contains("project-card") ||
      el.classList.contains("skill-card") ||
      el.classList.contains("cert")
    ){
      el.style.setProperty("--reveal-delay", `${(i % 4) * 75}ms`);
    }
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if("IntersectionObserver" in window && !reducedMotion){
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold:.12, rootMargin:"0px 0px -6% 0px"});
    revealTargets.forEach(el => revealObserver.observe(el));
  }else{
    revealTargets.forEach(el => el.classList.add("is-visible"));
  }

  // Active section tracking.
  if("IntersectionObserver" in window){
    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(x => x.isIntersecting)
        .sort((a,b) => b.intersectionRatio - a.intersectionRatio);
      if(visible[0]) setActive(visible[0].target);
    }, {threshold:[.25,.45,.6], rootMargin:"-12% 0px -35% 0px"});
    sections.forEach(s => sectionObserver.observe(s));
  }else{
    setActive(sections[0]);
  }

  function updateProgress(){
    if(!progressFill) return;
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - doc.clientHeight);
    const ratio = Math.max(0, Math.min(1, window.scrollY / max));
    progressFill.style.height = `${ratio * 100}%`;
  }
  updateProgress();
  window.addEventListener("scroll", updateProgress, {passive:true});

  // Smart mouse-wheel section navigation on desktop.
  // Small trackpad gestures still use normal scrolling; normal mouse-wheel ticks snap to the next section.
  let wheelSum = 0;
  let wheelResetTimer = 0;
  let locked = false;

  function currentSectionIndex(){
    const probeY = window.scrollY + window.innerHeight * .38;
    let index = 0;
    for(let i = 0; i < sections.length; i++){
      if(sections[i].offsetTop <= probeY) index = i;
    }
    return index;
  }

  // Long sections such as Portfolio can be taller than one screen.
  // Keep normal scrolling inside them and smart-snap only at their edges.
  function shouldUseNativeScroll(section, direction){
    if(!section) return false;

    const rect = section.getBoundingClientRect();
    const headerOffset = 76;
    const edgeTolerance = 28;
    const usableViewport = window.innerHeight - headerOffset;

    if(rect.height <= usableViewport + 80) return false;

    if(direction > 0){
      return rect.bottom > window.innerHeight + edgeTolerance;
    }

    return rect.top < headerOffset - edgeTolerance;
  }

  function smartWheel(event){
    if(window.innerWidth < 901 || reducedMotion) return;
    if(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if(Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    // Trackpads usually emit many small delta values; don't hijack them.
    const delta = event.deltaY;
    if(Math.abs(delta) < 18) return;

    const current = currentSectionIndex();
    const direction = delta > 0 ? 1 : -1;

    // Let tall sections scroll normally until their final content is reached.
    if(shouldUseNativeScroll(sections[current], direction)){
      wheelSum = 0;
      return;
    }

    wheelSum += delta;
    window.clearTimeout(wheelResetTimer);
    wheelResetTimer = window.setTimeout(() => { wheelSum = 0; }, 160);

    if(locked || Math.abs(wheelSum) < 74){
      if(locked) event.preventDefault();
      return;
    }

    const next = Math.max(0, Math.min(sections.length - 1, current + direction));
    wheelSum = 0;

    if(next !== current){
      event.preventDefault();
      locked = true;
      document.body.classList.add("is-smart-scrolling");
      sections[next].scrollIntoView({behavior:"smooth", block:"start"});
      window.setTimeout(() => {
        locked = false;
        document.body.classList.remove("is-smart-scrolling");
      }, 760);
    }
  }

  window.addEventListener("wheel", smartWheel, {passive:false});

  // Keyboard support mirrors the section navigation without interfering with typing.
  window.addEventListener("keydown", event => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if(tag === "input" || tag === "textarea" || tag === "select" || document.activeElement?.isContentEditable) return;
    if(window.innerWidth < 901 || reducedMotion) return;
    if(!["PageDown","PageUp"].includes(event.key)) return;
    const current = currentSectionIndex();
    const direction = event.key === "PageDown" ? 1 : -1;

    if(shouldUseNativeScroll(sections[current], direction)) return;

    const next = Math.max(0, Math.min(sections.length - 1, current + direction));
    if(next !== current){
      event.preventDefault();
      sections[next].scrollIntoView({behavior:"smooth", block:"start"});
    }
  });

  setActive(sections[0]);
}

// Render first, then initialize scroll interactions for generated cards.
loadData().then(data => {
  render(data);
  initSmartScroll();
});

// The original loadData().then(render) call is intentionally bypassed below by this guard.
