/* Visitor reactions + anonymous, moderated guestbook.
 * Google Apps Script is deployed separately from the site's existing profile feed.
 * GET uses read-only JSONP (published messages only); POST uses a simple form body.
 */
(() => {
  "use strict";
  const byId = id => document.getElementById(id);
  const form = byId("social-form");
  const status = byId("social-status");
  const comments = byId("social-comments");
  if (!form || !status || !comments) return;

  const endpoint = String(window.PORTFOLIO_CONFIG?.SOCIAL_API_URL || "").trim().replace(/\/$/, "");
  const connected = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);
  const btnLike = byId("social-like");
  const btnHeart = byId("social-heart");
  const nickInput = byId("social-nickname");
  const msgInput = byId("social-message");
  const sendButton = byId("social-submit");
  const nameKey = "jj-guestbook-nickname";
  const visitorKey = "jj-visitor-id-v1";
  let visitor = "";
  let selected = "";
  let busy = false;
  let pendingRefresh = false;
  let requestCounter = 0;

  function storageGet(key) {
    try { return window.localStorage.getItem(key) || ""; } catch { return ""; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch { /* private mode */ }
  }
  function newId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    if (window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, b => b.toString(16).padStart(2,"0")).join("");
    }
    // UUID-like fallback for older browsers; this ID is not an auth credential.
    return "jj" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
  function setStatus(message, kind = "info") {
    status.textContent = message;
    status.dataset.kind = kind;
  }
  function setBusy(value) {
    busy = value;
    const disabled = value || !connected;
    btnLike.disabled = disabled;
    btnHeart.disabled = disabled;
    nickInput.disabled = disabled;
    msgInput.disabled = disabled;
    sendButton.disabled = disabled;
  }

  // JSONP is restricted to public, read-only requests; never send private data.
  function readApi(action, args = {}) {
    return new Promise((resolve, reject) => {
      const callback = "__jjSocialCb_" + Date.now() + "_" + (++requestCounter);
      const url = new URL(endpoint);
      url.searchParams.set("action", action);
      url.searchParams.set("callback", callback);
      url.searchParams.set("_", Date.now().toString());
      Object.entries(args).forEach(([key, value]) => url.searchParams.set(key, String(value)));
      const script = document.createElement("script");
      script.async = true;
      let settled = false;
      let timeoutId;
      function cleanup() {
        clearTimeout(timeoutId);
        script.remove();
        try { delete window[callback]; } catch { window[callback] = undefined; }
      }
      function finish(error, data) {
        if (settled) return;
        settled = true;
        cleanup();
        if (error) reject(error);
        else resolve(data);
      }
      window[callback] = data => finish(null, data);
      script.onerror = () => finish(new Error("Unable to contact feedback service"));
      script.src = url.toString();
      timeoutId = setTimeout(() => finish(new Error("Feedback service timed out")), 9000);
      document.head.appendChild(script);
    });
  }

  // Anonymous write requests. Opaque responses cannot be trusted as confirmation:
  // the API is read back afterwards to verify acceptance.
  async function sendApi(fields) {
    const body = new URLSearchParams(fields);
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: body.toString(),
      cache: "no-store",
      redirect: "follow"
    });
  }

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function formatDate(raw) {
    const date = new Date(raw);
    if (Number.isNaN(date.valueOf())) return "";
    return new Intl.DateTimeFormat("en", {month:"short",day:"numeric",year:"numeric"}).format(date);
  }
  function showComments(items) {
    const messages = Array.isArray(items) ? items.slice(0,24) : [];
    comments.replaceChildren();
    if (!messages.length) {
      const p = document.createElement("p");
      p.className = "social-placeholder";
      p.textContent = "No public messages yet. You can be the first to leave one.";
      comments.appendChild(p);
      return;
    }
    const frag = document.createDocumentFragment();
    messages.forEach(message => {
      const article = document.createElement("article");
      article.className = "social-comment";
      const head = document.createElement("div");
      head.className = "social-comment-header";
      const author = document.createElement("strong");
      author.className = "social-comment-author";
      author.textContent = String(message.name || "Guest");
      const time = document.createElement("time");
      time.className = "social-comment-time";
      time.textContent = formatDate(message.at);
      const body = document.createElement("p");
      body.className = "social-comment-text";
      body.textContent = String(message.text || "");
      head.append(author, time);
      article.append(head, body);
      frag.appendChild(article);
    });
    comments.appendChild(frag);
  }
  function paintStats(data) {
    byId("social-like-count").textContent = String(Number(data.likes) || 0);
    byId("social-heart-count").textContent = String(Number(data.hearts) || 0);
    selected = data.mine === "like" || data.mine === "heart" ? data.mine : "";
    btnLike.setAttribute("aria-pressed", String(selected === "like"));
    btnHeart.setAttribute("aria-pressed", String(selected === "heart"));
    showComments(data.messages);
  }
  async function refresh() {
    if (!connected || busy || pendingRefresh || document.hidden) return;
    pendingRefresh = true;
    try {
      const data = await readApi("mine", {visitor});
      if (!data?.ok) throw new Error("Feedback data unavailable");
      paintStats(data);
      if (!status.dataset.initialized) {
        status.dataset.initialized = "yes";
        setStatus("Messages are public after approval. No account or email is required.");
      }
    } catch (error) {
      setStatus("Unable to load visitor messages right now. Please try again later.", "error");
      console.warn(error);
    } finally {
      pendingRefresh = false;
    }
  }
  async function verifyReaction(expected) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await sleep(attempt ? 850 : 550);
      try {
        const data = await readApi("mine", {visitor});
        if (!data?.ok) continue;
        paintStats(data);
        if ((data.mine || "") === expected) return true;
      } catch {}
    }
    return false;
  }
  async function react(choice) {
    if (busy) return;
    const next = selected === choice ? "none" : choice;
    setBusy(true);
    setStatus("Saving your reaction…");
    try {
      await sendApi({action:"react",reaction:next,visitor,website:""});
      const verified = await verifyReaction(next === "none" ? "" : next);
      if (verified) setStatus(next === "none" ? "Reaction removed." : "Thanks for your reaction!", "success");
      else setStatus("Could not confirm your reaction. Check your connection and try again.", "error");
    } catch (error) {
      console.warn(error);
      setStatus("Unable to save your reaction. Try again later.", "error");
    } finally {
      setBusy(false);
    }
  }
  async function verifyMessage(id) {
    for (let attempt = 0; attempt < 4; attempt++) {
      await sleep(attempt ? 900 : 700);
      try {
        const data = await readApi("status", {id});
        if (data?.ok && ["Pending","Approved","Rejected"].includes(data.status)) return data.status;
      } catch {}
    }
    return "";
  }
  async function submit(event) {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const name = nickInput.value.trim();
    const message = msgInput.value.trim();
    if (name.length < 2 || name.length > 24 || message.length < 3 || message.length > 350) {
      setStatus("Use a nickname (2–24 characters) and a message (3–350 characters).", "error");
      return;
    }
    if (/https?:\/\/|www\./i.test(message)) {
      setStatus("Links are not supported in guestbook messages.", "error");
      return;
    }
    const honeypot = byId("social-website").value;
    const id = newId();
    setBusy(true);
    setStatus("Submitting your message…");
    try {
      storageSet(nameKey, name);
      await sendApi({action:"message",id,visitor,nickname:name,message,website:honeypot});
      const result = await verifyMessage(id);
      if (result) {
        msgInput.value = "";
        setStatus(result === "Rejected" ? "This message could not be published." :
          result === "Approved" ? "Your message is published." :
          "Message received! It will appear after review.", result === "Rejected" ? "error" : "success");
        refresh();
      } else {
        setStatus("Submission could not be verified. Please check back before sending again.", "error");
      }
    } catch (error) {
      console.warn(error);
      setStatus("Message could not be submitted. Please try again later.", "error");
    } finally {
      setBusy(false);
    }
  }

  if (!connected) {
    comments.textContent = "Visitor feedback will open after Google Sheets is connected.";
    setStatus("Guestbook is being set up. Reactions and messages are not accepting submissions yet.");
    return;
  }
  visitor = storageGet(visitorKey);
  if (!/^[A-Za-z0-9_-]{18,80}$/.test(visitor)) {
    visitor = newId();
    storageSet(visitorKey, visitor);
  }
  nickInput.value = storageGet(nameKey).slice(0,24);
  setBusy(false);
  btnLike.addEventListener("click", () => react("like"));
  btnHeart.addEventListener("click", () => react("heart"));
  form.addEventListener("submit", submit);
  refresh();
  // Treat this as a moderated guestbook rather than real-time private chat.
  window.setInterval(() => { if (!document.hidden) refresh(); }, 45000);
})();
