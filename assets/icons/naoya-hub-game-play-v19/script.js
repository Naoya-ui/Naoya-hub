// ================================
// NAOYA STYLE HUB - MAIN SCRIPT
// ================================

// IMPORTANT:
// AFK timer starts as soon as this JS file is loaded,
// so it also counts the loading screen time.
const afkStartTime = Date.now();

document.addEventListener("DOMContentLoaded", () => {
  // ================================
  // COLLAPSIBLE / DRAGGABLE PROFILE SIDEBAR
  // Drag the edge handle left to tuck the profile in, right to restore it.
  // Clicking the handle does the same thing and the choice is remembered.
  // ================================
  const siteShell = document.querySelector(".shell");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const SIDEBAR_STATE_KEY = "naoyaSidebarCollapsed";

  function setSidebarCollapsed(collapsed, persist = true) {
    if (!siteShell || !sidebarToggle) return;

    siteShell.classList.toggle("sidebar-collapsed", collapsed);
    sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    sidebarToggle.setAttribute(
      "aria-label",
      collapsed ? "Expand profile sidebar" : "Collapse profile sidebar"
    );
    sidebarToggle.title = collapsed
      ? "Drag or click to expand profile"
      : "Drag or click to collapse profile";

    const icon = sidebarToggle.querySelector(".sidebar-toggle-icon");
    if (icon) icon.textContent = collapsed ? "›" : "‹";

    if (persist) {
      localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "1" : "0");
    }
  }

  if (siteShell && sidebarToggle) {
    const storedSidebarState = localStorage.getItem(SIDEBAR_STATE_KEY);
    setSidebarCollapsed(storedSidebarState === "1", false);

    let sidebarDragStartX = 0;
    let sidebarDragMoved = false;
    let sidebarPointerId = null;

    sidebarToggle.addEventListener("pointerdown", (event) => {
      sidebarDragStartX = event.clientX;
      sidebarDragMoved = false;
      sidebarPointerId = event.pointerId;
      sidebarToggle.classList.add("is-dragging");
      sidebarToggle.setPointerCapture?.(event.pointerId);
    });

    sidebarToggle.addEventListener("pointermove", (event) => {
      if (sidebarPointerId !== event.pointerId) return;
      const deltaX = event.clientX - sidebarDragStartX;

      if (Math.abs(deltaX) > 6) sidebarDragMoved = true;
      if (deltaX <= -42) setSidebarCollapsed(true);
      if (deltaX >= 42) setSidebarCollapsed(false);
    });

    const finishSidebarDrag = (event) => {
      if (sidebarPointerId !== null && event.pointerId !== sidebarPointerId) return;
      sidebarToggle.classList.remove("is-dragging");
      if (sidebarPointerId !== null) {
        try { sidebarToggle.releasePointerCapture?.(sidebarPointerId); } catch {}
      }
      sidebarPointerId = null;
    };

    sidebarToggle.addEventListener("pointerup", finishSidebarDrag);
    sidebarToggle.addEventListener("pointercancel", finishSidebarDrag);

    sidebarToggle.addEventListener("click", () => {
      if (sidebarDragMoved) {
        sidebarDragMoved = false;
        return;
      }
      setSidebarCollapsed(!siteShell.classList.contains("sidebar-collapsed"));
    });

    sidebarToggle.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSidebarCollapsed(true);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setSidebarCollapsed(false);
      }
    });
  }
  // ================================
  // BACKGROUND VIDEO PERFORMANCE v16
  // ================================
  // Desktop keeps the animated background. Phones/tablets, data-saver,
  // low-memory devices and reduced-motion users keep only the poster.
  // This avoids decoding video and compositing blur while scrolling on mobile.
  const siteVideoBackground = document.getElementById("siteVideoBackground");
  const siteVideoSource = siteVideoBackground?.querySelector("source[data-src]") || null;
  const mobileVideoQuery = window.matchMedia("(max-width: 760px), (pointer: coarse)");
  const reducedVideoQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  function shouldUseStaticBackground() {
    const saveData = Boolean(connection?.saveData);
    const veryLowMemory = Number(navigator.deviceMemory || 8) <= 2;
    return mobileVideoQuery.matches || reducedVideoQuery.matches || saveData || veryLowMemory || document.body.classList.contains("reduce-motion");
  }

  function unloadBackgroundVideo() {
    if (!siteVideoBackground) return;
    siteVideoBackground.pause();
    siteVideoBackground.classList.add("is-static");
    document.body.classList.add("static-background");
    if (siteVideoSource?.getAttribute("src")) {
      siteVideoSource.removeAttribute("src");
      siteVideoBackground.load();
    }
  }

  function loadBackgroundVideo() {
    if (!siteVideoBackground || !siteVideoSource) return;
    document.body.classList.remove("static-background");
    siteVideoBackground.classList.remove("is-static");
    if (!siteVideoSource.getAttribute("src")) {
      siteVideoSource.setAttribute("src", siteVideoSource.dataset.src || "");
      siteVideoBackground.load();
    }
  }

  function syncBackgroundVideo() {
    if (!siteVideoBackground) return;
    if (shouldUseStaticBackground()) {
      unloadBackgroundVideo();
      return;
    }

    loadBackgroundVideo();
    if (document.hidden) {
      siteVideoBackground.pause();
      return;
    }
    siteVideoBackground.play().catch(() => {});
  }

  if (siteVideoBackground) {
    document.addEventListener("visibilitychange", syncBackgroundVideo);
    window.addEventListener("pagehide", () => siteVideoBackground.pause());
    window.addEventListener("pageshow", syncBackgroundVideo);
    mobileVideoQuery.addEventListener?.("change", syncBackgroundVideo);
    reducedVideoQuery.addEventListener?.("change", syncBackgroundVideo);
    connection?.addEventListener?.("change", syncBackgroundVideo);
    syncBackgroundVideo();
  }
  // ================================
  // ELASTIC RANGE SLIDERS
  // React Bits-inspired stretch + spring snap, implemented in vanilla JS.
  // ================================
  function syncElasticRange(input) {
    if (!input) return;
    const wrapper = input.closest("[data-elastic-range]");
    if (!wrapper) return;

    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const value = Number(input.value || 0);
    const span = Math.max(1, max - min);
    const percent = Math.max(0, Math.min(100, ((value - min) / span) * 100));
    wrapper.style.setProperty("--elastic-value", `${percent}%`);
  }

  function initElasticRange(input) {
    const wrapper = input.closest("[data-elastic-range]");
    if (!wrapper) return;
    const thumb = wrapper.querySelector(".elastic-slider-thumb");

    let dragging = false;
    let lastX = 0;
    let lastTime = 0;
    let currentStretch = 1;
    let currentSquash = 1;
    let currentLean = 0;

    const setElasticShape = (stretch = 1, squash = 1, lean = 0) => {
      currentStretch = stretch;
      currentSquash = squash;
      currentLean = lean;
      wrapper.style.setProperty("--elastic-stretch", stretch.toFixed(3));
      wrapper.style.setProperty("--elastic-squash", squash.toFixed(3));
      wrapper.style.setProperty("--elastic-lean", `${lean.toFixed(2)}px`);
    };

    const springBack = () => {
      if (!thumb) {
        setElasticShape();
        return;
      }

      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
      wrapper.classList.remove("is-dragging");
      wrapper.style.setProperty("--elastic-stretch", "1");
      wrapper.style.setProperty("--elastic-squash", "1");
      wrapper.style.setProperty("--elastic-lean", "0px");

      if (reduceMotion || typeof thumb.animate !== "function") {
        currentStretch = 1;
        currentSquash = 1;
        currentLean = 0;
        return;
      }

      const startStretch = currentStretch;
      const startSquash = currentSquash;
      const startLean = currentLean;
      thumb.getAnimations().forEach((animation) => animation.cancel());
      thumb.animate(
        [
          { transform: `translate(calc(-50% + ${startLean}px), -50%) scaleX(${startStretch}) scaleY(${startSquash})` },
          { transform: "translate(calc(-50% - 1px), -50%) scaleX(.88) scaleY(1.13)", offset: .42 },
          { transform: "translate(calc(-50% + .5px), -50%) scaleX(1.055) scaleY(.96)", offset: .68 },
          { transform: "translate(-50%, -50%) scaleX(1) scaleY(1)" }
        ],
        { duration: 520, easing: "cubic-bezier(.2,.9,.24,1)" }
      );

      currentStretch = 1;
      currentSquash = 1;
      currentLean = 0;
    };

    input.addEventListener("input", () => syncElasticRange(input));

    input.addEventListener("pointerdown", (event) => {
      dragging = true;
      lastX = event.clientX;
      lastTime = performance.now();
      wrapper.classList.add("is-dragging");
      if (thumb) thumb.getAnimations().forEach((animation) => animation.cancel());
    });

    input.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const now = performance.now();
      const elapsed = Math.max(8, now - lastTime);
      const dx = event.clientX - lastX;
      const speed = Math.min(1, Math.abs(dx) / Math.max(1, elapsed) * 2.2);
      const stretch = 1 + speed * .58;
      const squash = 1 - speed * .20;
      const lean = Math.max(-3.4, Math.min(3.4, dx * .28));
      setElasticShape(stretch, squash, lean);
      lastX = event.clientX;
      lastTime = now;
    });

    const release = () => {
      if (!dragging) return;
      dragging = false;
      springBack();
    };

    input.addEventListener("pointerup", release);
    input.addEventListener("pointercancel", release);
    input.addEventListener("blur", release);

    input.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) return;
      wrapper.classList.add("is-dragging");
      setElasticShape(1.18, .91, event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1.5 : 1.5);
    });

    input.addEventListener("keyup", springBack);
    syncElasticRange(input);
  }

  document.querySelectorAll("[data-elastic-range] .elastic-range-input").forEach(initElasticRange);
  // ================================
  // VOLUME & AUDIO
  // ================================
  const backgroundMusic = document.getElementById("backgroundMusic");
  const volumeInput = document.getElementById("volume");
  const volumeText = document.getElementById("volumeText");

  // Background BGM volume is remembered separately from the Audio-tab player.
  let bgmBaseVolume = volumeInput ? Number(volumeInput.value) / 100 : 0.24;
  let bgmFadeTimer = null;
  const BGM_FADE_MS = 1200;
  const BGM_DUCK_VOLUME = 0; // Spotify-like: fade the BGM completely out.

  function fadeBackgroundMusic(target, duration = BGM_FADE_MS) {
    if (!backgroundMusic) return;
    if (bgmFadeTimer) cancelAnimationFrame(bgmFadeTimer);

    const start = backgroundMusic.volume;
    const end = Math.max(0, Math.min(1, target));
    const startedAt = performance.now();

    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      // Smooth ease-in-out curve.
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      backgroundMusic.volume = start + (end - start) * eased;

      if (progress < 1) {
        bgmFadeTimer = requestAnimationFrame(step);
      } else {
        backgroundMusic.volume = end;
        bgmFadeTimer = null;
      }
    };

    bgmFadeTimer = requestAnimationFrame(step);
  }

  function restoreBackgroundMusic() {
    if (!backgroundMusic) return;
    fadeBackgroundMusic(bgmBaseVolume);
    if (backgroundMusic.paused && bgmBaseVolume > 0) {
      backgroundMusic.play().catch(() => {});
    }
  }

  function duckBackgroundMusic() {
    if (!backgroundMusic) return;
    fadeBackgroundMusic(BGM_DUCK_VOLUME);
  }

  if (backgroundMusic) {
    backgroundMusic.volume = bgmBaseVolume;

    if (volumeInput) {
      volumeInput.addEventListener("input", (e) => {
        const value = Math.max(0, Math.min(100, Number(e.target.value)));
        bgmBaseVolume = value / 100;

        // If the Audio player is currently playing, keep the BGM ducked.
        const audioTabPlayer = document.getElementById("music");
        if (!audioTabPlayer || audioTabPlayer.paused) {
          backgroundMusic.volume = bgmBaseVolume;
        }

        if (volumeText) {
          volumeText.textContent = `BGM Volume: ${value}%`;
        }
      });
    }

    // Try to start ONLY the background BGM. The Audio-tab player is independent.
    const unlockBackgroundAudio = () => {
      if (backgroundMusic.paused && bgmBaseVolume > 0) {
        backgroundMusic.play().catch(() => {});
      }
      document.removeEventListener("click", unlockBackgroundAudio);
      document.removeEventListener("keydown", unlockBackgroundAudio);
    };

    document.addEventListener("click", unlockBackgroundAudio);
    document.addEventListener("keydown", unlockBackgroundAudio);
  }

  // ================================
  // DISCORD LIVE STATUS
  // ================================
  // Uses Lanyard's public presence API so no Discord bot token is exposed
  // in the browser. Statuses handled: online, idle, dnd and offline.
  const DISCORD_USER_ID = "869568513864519690";
  const discordStatus = document.getElementById("discordStatus");
  const discordStatusText = discordStatus
    ? discordStatus.querySelector(".discord-status-text")
    : null;
  const discordAvatarEls = document.querySelectorAll("[data-discord-avatar]");

  function updateDiscordAvatar(user) {
    if (!user || !discordAvatarEls.length) return;

    let avatarUrl = "";
    if (user.avatar) {
      const extension = user.avatar.startsWith("a_") ? "gif" : "png";
      avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=512`;
    }

    // Keep the local avatar as a fallback if Discord has no custom avatar.
    if (!avatarUrl) return;

    discordAvatarEls.forEach((img) => {
      if (!(img instanceof HTMLImageElement)) return;
      if (img.src === avatarUrl) return;
      img.src = avatarUrl;
      img.alt = `${user.global_name || user.display_name || user.username || "Discord"} avatar`;
    });
  }

  const discordStatusMap = {
    online: { label: "Online", className: "status-online" },
    idle: { label: "Idle", className: "status-idle" },
    dnd: { label: "Do Not Disturb", className: "status-dnd" },
    offline: { label: "Offline", className: "status-offline" },
  };

  let discordPresenceRequestRunning = false;

  function setDiscordStatus(status, customLabel = "") {
    if (!discordStatus || !discordStatusText) return;

    const knownStatus = discordStatusMap[status];
    const nextClass = knownStatus ? knownStatus.className : "status-unknown";
    const nextLabel = customLabel || (knownStatus ? knownStatus.label : "Unavailable");

    discordStatus.classList.remove(
      "status-loading",
      "status-online",
      "status-idle",
      "status-dnd",
      "status-offline",
      "status-unknown"
    );
    discordStatus.classList.add(nextClass);
    discordStatusText.textContent = nextLabel;
    discordStatus.setAttribute("aria-label", `Discord status: ${nextLabel}`);
    discordStatus.title = `${nextLabel} · Open Discord profile`;
  }

  async function updateDiscordPresence() {
    if (!discordStatus || discordPresenceRequestRunning || document.hidden) return;

    discordPresenceRequestRunning = true;
    try {
      const response = await fetch(
        `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`,
        { cache: "no-store" }
      );

      if (!response.ok) throw new Error(`Discord status HTTP ${response.status}`);

      const payload = await response.json();
      if (!payload.success || !payload.data) {
        throw new Error("Discord presence is not available");
      }

      const status = payload.data.discord_status || "offline";
      updateDiscordAvatar(payload.data.discord_user);
      setDiscordStatus(status);
    } catch (error) {
      setDiscordStatus("unknown", "Status unavailable");
      console.warn("Could not load Discord presence:", error);
    } finally {
      discordPresenceRequestRunning = false;
    }
  }

  updateDiscordPresence();
  setInterval(updateDiscordPresence, 45000);

  // Refresh immediately when the user returns to the tab.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateDiscordPresence();
  });

  // ================================
  // LOADING SCREEN
  // ================================
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loaderBar");
  const loaderPercent = document.getElementById("loaderPercent");

  if (loader && loaderBar && loaderPercent) {
    document.body.classList.add("loading");

    let progress = 0;

    const loadingTimer = setInterval(() => {
      progress += Math.floor(Math.random() * 7) + 3;

      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingTimer);

        loaderBar.style.width = "100%";
        loaderPercent.textContent = "100%";

        setTimeout(() => {
          loader.classList.add("hide");
          document.body.classList.remove("loading");
        }, 450);

        return;
      }

      loaderBar.style.width = `${progress}%`;
      loaderPercent.textContent = String(progress).padStart(2, "0") + "%";
    }, 90);
  }

  // ================================
  // SIDEBAR NAVIGATION
  // ================================
  const names = {
    home: "Home Dashboard",
    about: "Profile / About",
    artwork: "PGR Media Layout",
    notepad: "Notepad",
    contact: "AFK Zone",
  };

  const navButtons = document.querySelectorAll(".nav");
  const pages = document.querySelectorAll(".page");
  const crumb = document.getElementById("crumb");

  function showPage(pageId) {
    const targetPage = document.getElementById(pageId);
    if (!targetPage) return;

    navButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.page === pageId);
    });

    pages.forEach((page) => {
      page.classList.remove("active");
      page.style.display = "none";
    });

    targetPage.classList.add("active");
    targetPage.style.display = pageId === "contact" ? "flex" : "block";

    if (crumb) {
      crumb.textContent = names[pageId] || pageId;
    }

    document.dispatchEvent(new CustomEvent("naoya:pagechange", { detail: { pageId } }));
    const smoothScroll = window.matchMedia("(min-width: 761px) and (prefers-reduced-motion: no-preference)").matches;
    window.scrollTo({ top: 0, behavior: smoothScroll ? "smooth" : "auto" });
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const pageId = button.dataset.page;
      if (pageId) showPage(pageId);
    });
  });

  // Keep initial Home page correct.
  const activePage = document.querySelector(".page.active");
  if (activePage) {
    activePage.style.display =
      activePage.id === "contact" ? "flex" : "block";
  }

  // ================================
  // THEME / MOTION
  // ================================
  const motionBtn = document.getElementById("motion");

  if (motionBtn) {
    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light-mode");
      motionBtn.textContent = "☀";
    }

    motionBtn.addEventListener("click", () => {
      document.body.classList.toggle("reduce-motion");

      const isLight = document.body.classList.toggle("light-mode");
      localStorage.setItem("theme", isLight ? "light" : "dark");
      motionBtn.textContent = isLight ? "☀" : "◐";
      syncBackgroundVideo();
    });
  }

  // ================================
  // FULL NOTEPAD v7
  // Local add/edit/delete + cut/copy/paste + import/export + undo/redo.
  // ================================
  const note = document.getElementById("note");
  const noteTitle = document.getElementById("noteTitle");
  const notes = document.getElementById("notes");
  const noteNew = document.getElementById("noteNew");
  const noteSave = document.getElementById("noteSave");
  const noteDelete = document.getElementById("noteDelete");
  const noteUndo = document.getElementById("noteUndo");
  const noteRedo = document.getElementById("noteRedo");
  const noteCut = document.getElementById("noteCut");
  const noteCopy = document.getElementById("noteCopy");
  const notePaste = document.getElementById("notePaste");
  const noteImport = document.getElementById("noteImport");
  const noteExport = document.getElementById("noteExport");
  const noteExportAll = document.getElementById("noteExportAll");
  const noteFileInput = document.getElementById("noteFileInput");
  const noteSearch = document.getElementById("noteSearch");
  const noteCount = document.getElementById("noteCount");
  const noteMode = document.getElementById("noteMode");
  const noteStats = document.getElementById("noteStats");
  const noteSavedState = document.getElementById("noteSavedState");
  const noteClearAll = document.getElementById("noteClearAll");
  const notepadEditorCard = document.getElementById("notepadEditorCard");

  const NOTE_STORAGE_KEY = "notes";
  const NOTE_HISTORY_LIMIT = 60;
  let savedNotes = [];
  let selectedNoteId = null;
  let undoStack = [];
  let redoStack = [];
  let inputHistoryTimer = null;

  function makeNoteId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function normalizeNote(item, index = 0) {
    const now = new Date().toISOString();
    if (typeof item === "string") {
      const clean = item.trim();
      const firstLine = clean.split(/\r?\n/)[0].trim();
      return {
        id: makeNoteId(),
        title: firstLine.slice(0, 80) || `Note ${index + 1}`,
        content: item,
        createdAt: now,
        updatedAt: now,
      };
    }

    if (!item || typeof item !== "object") return null;
    const content = String(item.content ?? item.text ?? "");
    const firstLine = content.trim().split(/\r?\n/)[0].trim();
    return {
      id: String(item.id || makeNoteId()),
      title: String(item.title || firstLine || `Note ${index + 1}`).slice(0, 80),
      content,
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || item.createdAt || now,
    };
  }

  function loadSavedNotes() {
    try {
      const raw = JSON.parse(localStorage.getItem(NOTE_STORAGE_KEY) || "[]");
      const source = Array.isArray(raw) ? raw : Array.isArray(raw?.notes) ? raw.notes : [];
      savedNotes = source.map(normalizeNote).filter(Boolean);
      // This also migrates the old string-only note format to the v7 object format.
      persistNotes();
    } catch (error) {
      console.warn("Could not read saved notes:", error);
      savedNotes = [];
    }
  }

  function persistNotes() {
    try {
      localStorage.setItem(NOTE_STORAGE_KEY, JSON.stringify(savedNotes));
      return true;
    } catch (error) {
      setNoteStatus("Storage full / unavailable", true);
      console.warn("Could not save notes:", error);
      return false;
    }
  }

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function deriveTitle(content) {
    const firstLine = String(content || "").trim().split(/\r?\n/)[0].trim();
    return firstLine.slice(0, 80) || "Untitled note";
  }

  function formatNoteDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "just now";
    return date.toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getEditorState() {
    return {
      notes: savedNotes.map((item) => ({ ...item })),
      selectedNoteId,
      title: noteTitle ? noteTitle.value : "",
      content: note ? note.value : "",
    };
  }

  function stateSignature(state) {
    return JSON.stringify(state);
  }

  function recordHistory() {
    if (!note || !noteTitle) return;
    const snapshot = getEditorState();
    const signature = stateSignature(snapshot);
    const last = undoStack[undoStack.length - 1];
    if (last && stateSignature(last) === signature) return;
    undoStack.push(snapshot);
    if (undoStack.length > NOTE_HISTORY_LIMIT) undoStack.shift();
    redoStack = [];
    updateUndoRedoButtons();
  }

  function flushInputHistory() {
    if (inputHistoryTimer) {
      clearTimeout(inputHistoryTimer);
      inputHistoryTimer = null;
      recordHistory();
    }
  }

  function scheduleInputHistory() {
    setNoteStatus("Unsaved changes");
    updateNoteStats();
    clearTimeout(inputHistoryTimer);
    inputHistoryTimer = setTimeout(() => {
      inputHistoryTimer = null;
      recordHistory();
    }, 350);
  }

  function applyHistoryState(state) {
    if (!state || !note || !noteTitle) return;
    savedNotes = (state.notes || []).map((item) => ({ ...item }));
    selectedNoteId = state.selectedNoteId || null;
    noteTitle.value = state.title || "";
    note.value = state.content || "";
    persistNotes();
    renderNotes();
    updateEditorMode();
    updateNoteStats();
    setNoteStatus("History restored");
  }

  function undoNotepad() {
    flushInputHistory();
    if (undoStack.length <= 1) return setNoteStatus("Nothing to undo");
    const current = undoStack.pop();
    redoStack.push(current);
    applyHistoryState(undoStack[undoStack.length - 1]);
    updateUndoRedoButtons();
  }

  function redoNotepad() {
    flushInputHistory();
    if (!redoStack.length) return setNoteStatus("Nothing to redo");
    const next = redoStack.pop();
    undoStack.push(next);
    applyHistoryState(next);
    updateUndoRedoButtons();
  }

  function updateUndoRedoButtons() {
    if (noteUndo) noteUndo.disabled = undoStack.length <= 1;
    if (noteRedo) noteRedo.disabled = redoStack.length === 0;
  }

  function setNoteStatus(message, isError = false) {
    if (!noteSavedState) return;
    noteSavedState.textContent = message;
    noteSavedState.classList.toggle("error", Boolean(isError));
  }

  function updateNoteStats() {
    if (!noteStats || !note) return;
    const text = note.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    noteStats.textContent = `${text.length} chars · ${words} words`;
  }

  function updateEditorMode() {
    const selected = savedNotes.find((item) => item.id === selectedNoteId);
    if (noteMode) noteMode.textContent = selected ? "EDITING" : "NEW NOTE";
    if (noteSave) noteSave.textContent = selected ? "UPDATE" : "SAVE";
    if (noteDelete) noteDelete.disabled = !selected;
  }

  function renderNotes() {
    if (!notes) return;
    const query = (noteSearch?.value || "").trim().toLowerCase();
    const filtered = savedNotes.filter((item) => {
      if (!query) return true;
      return `${item.title} ${item.content}`.toLowerCase().includes(query);
    });

    if (noteCount) {
      noteCount.textContent = `${savedNotes.length} NOTE${savedNotes.length === 1 ? "" : "S"}`;
    }

    if (!filtered.length) {
      notes.innerHTML = `<div class="note-empty">${query ? "No matching notes" : "No notes yet"}</div>`;
      return;
    }

    notes.innerHTML = filtered
      .map((item) => {
        const preview = item.content.replace(/\s+/g, " ").trim().slice(0, 110) || "Empty note";
        const selected = item.id === selectedNoteId ? " selected" : "";
        return `
          <article class="note-list-item${selected}" data-note-id="${escapeHTML(item.id)}">
            <button class="note-select" type="button" data-note-action="select" data-note-id="${escapeHTML(item.id)}">
              <strong>${escapeHTML(item.title)}</strong>
              <span>${escapeHTML(preview)}</span>
              <small>${escapeHTML(formatNoteDate(item.updatedAt))}</small>
            </button>
            <div class="note-item-actions">
              <button type="button" data-note-action="edit" data-note-id="${escapeHTML(item.id)}">EDIT</button>
              <button type="button" class="danger" data-note-action="delete" data-note-id="${escapeHTML(item.id)}">DEL</button>
            </div>
          </article>`;
      })
      .join("");
  }

  function loadNoteIntoEditor(id, shouldRecord = true) {
    const item = savedNotes.find((entry) => entry.id === id);
    if (!item || !note || !noteTitle) return;
    selectedNoteId = item.id;
    noteTitle.value = item.title;
    note.value = item.content;
    updateEditorMode();
    updateNoteStats();
    renderNotes();
    setNoteStatus("Loaded");
    if (shouldRecord) recordHistory();
    note.focus();
  }

  function newNote(shouldRecord = true) {
    if (!note || !noteTitle) return;
    flushInputHistory();
    selectedNoteId = null;
    noteTitle.value = "";
    note.value = "";
    updateEditorMode();
    updateNoteStats();
    renderNotes();
    setNoteStatus("New note");
    if (shouldRecord) recordHistory();
    noteTitle.focus();
  }

  function saveCurrentNote() {
    if (!note || !noteTitle) return;
    flushInputHistory();
    const content = note.value;
    const typedTitle = noteTitle.value.trim();
    if (!content.trim() && !typedTitle) {
      return setNoteStatus("Write something first", true);
    }

    const now = new Date().toISOString();
    const title = (typedTitle || deriveTitle(content)).slice(0, 80);
    const existingIndex = savedNotes.findIndex((item) => item.id === selectedNoteId);

    if (existingIndex >= 0) {
      savedNotes[existingIndex] = {
        ...savedNotes[existingIndex],
        title,
        content,
        updatedAt: now,
      };
      // Bring the edited note to the top.
      const updated = savedNotes.splice(existingIndex, 1)[0];
      savedNotes.unshift(updated);
    } else {
      const created = {
        id: makeNoteId(),
        title,
        content,
        createdAt: now,
        updatedAt: now,
      };
      savedNotes.unshift(created);
      selectedNoteId = created.id;
    }

    noteTitle.value = title;
    persistNotes();
    renderNotes();
    updateEditorMode();
    setNoteStatus("Saved locally");
    recordHistory();
  }

  function deleteNoteById(id) {
    const item = savedNotes.find((entry) => entry.id === id);
    if (!item) return;
    if (!window.confirm(`Delete “${item.title}”?`)) return;

    flushInputHistory();
    savedNotes = savedNotes.filter((entry) => entry.id !== id);
    if (selectedNoteId === id && note && noteTitle) {
      selectedNoteId = null;
      noteTitle.value = "";
      note.value = "";
    }
    persistNotes();
    renderNotes();
    updateEditorMode();
    updateNoteStats();
    setNoteStatus("Deleted");
    recordHistory();
  }

  function getActiveEditorField() {
    const active = document.activeElement;
    if (active === note || active === noteTitle) return active;
    return note;
  }

  async function writeClipboard(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  async function copySelection(cut = false) {
    const field = getActiveEditorField();
    if (!field) return;
    const start = field.selectionStart ?? 0;
    const end = field.selectionEnd ?? 0;
    if (start === end) return setNoteStatus("Select text first");
    const selectedText = field.value.slice(start, end);

    try {
      await writeClipboard(selectedText);
      if (cut) {
        field.setRangeText("", start, end, "start");
        field.dispatchEvent(new Event("input", { bubbles: true }));
        setNoteStatus("Cut to clipboard");
      } else {
        setNoteStatus("Copied");
      }
    } catch (error) {
      console.warn("Clipboard write blocked:", error);
      setNoteStatus("Clipboard blocked by browser", true);
    }
  }

  async function pasteClipboard() {
    const field = getActiveEditorField();
    if (!field) return;
    if (!navigator.clipboard?.readText) {
      return setNoteStatus("Use Ctrl/Cmd + V to paste", true);
    }

    try {
      const textToPaste = await navigator.clipboard.readText();
      const start = field.selectionStart ?? field.value.length;
      const end = field.selectionEnd ?? start;
      field.setRangeText(textToPaste, start, end, "end");
      field.dispatchEvent(new Event("input", { bubbles: true }));
      setNoteStatus("Pasted");
    } catch (error) {
      console.warn("Clipboard read blocked:", error);
      setNoteStatus("Browser blocked paste — use Ctrl/Cmd + V", true);
    }
  }

  function safeFilename(value, fallback = "note") {
    const clean = String(value || fallback)
      .replace(/[\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 70);
    return clean || fallback;
  }

  function downloadBlob(filename, data, type) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function exportCurrentNote() {
    if (!note || !noteTitle) return;
    const content = note.value;
    const title = noteTitle.value.trim() || deriveTitle(content);
    if (!content && !title) return setNoteStatus("Nothing to export", true);
    downloadBlob(`${safeFilename(title)}.txt`, content, "text/plain;charset=utf-8");
    setNoteStatus("Saved .txt file");
  }

  function exportAllNotes() {
    const backup = {
      app: "Naoya Hub Notepad",
      version: 7,
      exportedAt: new Date().toISOString(),
      notes: savedNotes,
    };
    downloadBlob(
      `naoya-notes-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(backup, null, 2),
      "application/json;charset=utf-8"
    );
    setNoteStatus("Backup downloaded");
  }

  function importTextFile(file, text) {
    const now = new Date().toISOString();
    const titleFromFile = file.name.replace(/\.[^.]+$/, "") || deriveTitle(text);
    const imported = {
      id: makeNoteId(),
      title: titleFromFile.slice(0, 80),
      content: text,
      createdAt: now,
      updatedAt: now,
    };
    savedNotes.unshift(imported);
    selectedNoteId = imported.id;
    persistNotes();
    if (noteTitle) noteTitle.value = imported.title;
    if (note) note.value = imported.content;
    renderNotes();
    updateEditorMode();
    updateNoteStats();
    setNoteStatus("Text file imported");
    recordHistory();
  }

  function importJsonFile(text) {
    const parsed = JSON.parse(text);
    const source = Array.isArray(parsed) ? parsed : parsed?.notes;
    if (!Array.isArray(source)) throw new Error("JSON does not contain a notes array");
    const imported = source.map(normalizeNote).filter(Boolean).map((item) => ({ ...item, id: makeNoteId() }));
    savedNotes = [...imported, ...savedNotes];
    persistNotes();
    renderNotes();
    setNoteStatus(`${imported.length} notes imported`);
    recordHistory();
  }

  async function handleImportFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      flushInputHistory();
      if (file.name.toLowerCase().endsWith(".json") || file.type.includes("json")) {
        importJsonFile(text);
      } else {
        importTextFile(file, text);
      }
    } catch (error) {
      console.warn("Could not import note file:", error);
      setNoteStatus("Import failed / invalid file", true);
    } finally {
      if (noteFileInput) noteFileInput.value = "";
    }
  }

  if (note && noteTitle && notes) {
    loadSavedNotes();
    renderNotes();
    updateEditorMode();
    updateNoteStats();
    recordHistory();

    note.addEventListener("input", scheduleInputHistory);
    noteTitle.addEventListener("input", scheduleInputHistory);
    noteSearch?.addEventListener("input", renderNotes);

    noteNew?.addEventListener("click", () => newNote(true));
    noteSave?.addEventListener("click", saveCurrentNote);
    noteDelete?.addEventListener("click", () => {
      if (selectedNoteId) deleteNoteById(selectedNoteId);
    });
    noteUndo?.addEventListener("click", undoNotepad);
    noteRedo?.addEventListener("click", redoNotepad);
    noteCut?.addEventListener("click", () => copySelection(true));
    noteCopy?.addEventListener("click", () => copySelection(false));
    notePaste?.addEventListener("click", pasteClipboard);
    noteImport?.addEventListener("click", () => noteFileInput?.click());
    noteExport?.addEventListener("click", exportCurrentNote);
    noteExportAll?.addEventListener("click", exportAllNotes);
    noteFileInput?.addEventListener("change", () => handleImportFile(noteFileInput.files?.[0]));

    notes.addEventListener("click", (event) => {
      const button = event.target.closest("[data-note-action]");
      if (!button) return;
      const id = button.dataset.noteId;
      const action = button.dataset.noteAction;
      if (action === "select" || action === "edit") loadNoteIntoEditor(id, true);
      if (action === "delete") deleteNoteById(id);
    });

    noteClearAll?.addEventListener("click", () => {
      if (!savedNotes.length) return setNoteStatus("No notes to clear");
      if (!window.confirm("Delete ALL saved notes? This can be undone until you reload the page.")) return;
      flushInputHistory();
      savedNotes = [];
      selectedNoteId = null;
      noteTitle.value = "";
      note.value = "";
      persistNotes();
      renderNotes();
      updateEditorMode();
      updateNoteStats();
      setNoteStatus("All notes cleared");
      recordHistory();
    });

    // Drag a .txt or .json file directly onto the editor card to import it.
    notepadEditorCard?.addEventListener("dragover", (event) => {
      event.preventDefault();
      notepadEditorCard.classList.add("dragging-file");
    });
    notepadEditorCard?.addEventListener("dragleave", () => {
      notepadEditorCard.classList.remove("dragging-file");
    });
    notepadEditorCard?.addEventListener("drop", (event) => {
      event.preventDefault();
      notepadEditorCard.classList.remove("dragging-file");
      const file = event.dataTransfer?.files?.[0];
      if (file) handleImportFile(file);
    });

    // Shortcuts work only while the Notepad page or its controls are active.
    document.addEventListener("keydown", (event) => {
      const page = document.getElementById("notepad");
      const notepadVisible = page?.classList.contains("active");
      if (!notepadVisible) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (!modifier) return;

      const key = event.key.toLowerCase();
      if (key === "s" && !event.shiftKey) {
        event.preventDefault();
        saveCurrentNote();
      } else if (key === "n") {
        event.preventDefault();
        newNote(true);
      } else if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undoNotepad();
      } else if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        redoNotepad();
      } else if (key === "s" && event.shiftKey) {
        event.preventDefault();
        exportCurrentNote();
      }
    });
  }

  // ================================
  // GALLERY / GAME PROJECT / AUDIO TABS
  // ================================
  const tabs = document.querySelectorAll(".tab");
  const mediaItems = document.querySelectorAll(".media-item, .playlist-panel[data-category]");

  function filterMedia(category) {
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.filter === category);
    });

    mediaItems.forEach((item) => {
      const itemCategory = item.dataset.category;
      const visible = itemCategory === category;

      item.classList.toggle("hidden", !visible);
      item.style.display = visible ? "" : "none";
    });

    document.dispatchEvent(new CustomEvent("naoya:mediafilter", { detail: { category } }));
  }

  // HTML uses data-filter, not data-kind.
  // Artwork is the default tab.
  filterMedia("artwork");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterMedia(tab.dataset.filter);
    });
  });

  // ================================
  // DEPTH CAROUSEL GALLERY
  // Vanilla implementation inspired by a 3D depth-carousel interaction.
  // ================================
  const depthCarousel = document.getElementById("galleryDepthCarousel");
  const depthStage = document.getElementById("depthStage");
  const depthSlides = depthCarousel
    ? Array.from(depthCarousel.querySelectorAll(".depth-slide"))
    : [];
  const depthPrev = document.getElementById("depthPrev");
  const depthNext = document.getElementById("depthNext");
  const depthDots = document.getElementById("depthDots");
  const depthCurrent = document.getElementById("depthCurrent");
  const depthTotal = document.getElementById("depthTotal");
  const galleryLightbox = document.getElementById("galleryLightbox");
  const galleryLightboxImage = document.getElementById("galleryLightboxImage");
  const galleryLightboxCaption = document.getElementById("galleryLightboxCaption");
  const galleryLightboxClose = document.getElementById("galleryLightboxClose");

  let depthIndex = 0;
  let depthAutoTimer = null;
  let depthPointerStartX = 0;
  let depthPointerDeltaX = 0;
  let depthDragging = false;
  let depthMoved = false;
  const DEPTH_AUTO_MS = 5000;

  function getDepthDistance(index) {
    const count = depthSlides.length;
    if (!count) return 0;
    let distance = index - depthIndex;
    if (distance > count / 2) distance -= count;
    if (distance < -count / 2) distance += count;
    return distance;
  }

  function updateDepthCarousel() {
    if (!depthSlides.length) return;

    depthSlides.forEach((slide, index) => {
      const distance = getDepthDistance(index);
      const abs = Math.abs(distance);
      const direction = distance === 0 ? 0 : Math.sign(distance);
      const compactDepth = window.matchMedia("(max-width: 700px), (pointer: coarse)").matches;
      const x = distance * (compactDepth ? 112 : 205);
      const z = -Math.min(abs, 2) * (compactDepth ? 50 : 180);
      const rotateY = compactDepth ? 0 : direction * -18;
      const scale = Math.max(compactDepth ? 0.80 : 0.72, 1 - abs * (compactDepth ? 0.08 : 0.12));
      const opacity = abs > 2 ? 0 : Math.max(compactDepth ? 0.42 : 0.3, 1 - abs * 0.24);
      const blur = abs === 0 ? 0 : Math.min(2.2, abs * 0.75);

      slide.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg) scale(${scale})`;
      slide.style.opacity = String(opacity);
      slide.style.filter = compactDepth ? "none" : `brightness(${1 - Math.min(abs, 2) * 0.13}) blur(${blur}px)`;
      slide.style.zIndex = String(20 - abs);
      slide.style.pointerEvents = abs > 2 ? "none" : "auto";
      slide.classList.toggle("is-active", index === depthIndex);
      slide.setAttribute("aria-current", index === depthIndex ? "true" : "false");
    });

    if (depthCurrent) depthCurrent.textContent = String(depthIndex + 1).padStart(2, "0");
    if (depthTotal) depthTotal.textContent = String(depthSlides.length).padStart(2, "0");

    if (depthDots) {
      depthDots.querySelectorAll(".depth-dot").forEach((dot, index) => {
        dot.classList.toggle("is-active", index === depthIndex);
        dot.setAttribute("aria-current", index === depthIndex ? "true" : "false");
      });
    }
  }

  function goToDepth(index, restartAuto = true) {
    if (!depthSlides.length) return;
    depthIndex = (index + depthSlides.length) % depthSlides.length;
    updateDepthCarousel();
    if (restartAuto) restartDepthAuto();
  }

  function depthNextSlide() {
    goToDepth(depthIndex + 1);
  }

  function depthPrevSlide() {
    goToDepth(depthIndex - 1);
  }

  function stopDepthAuto() {
    if (depthAutoTimer) {
      clearInterval(depthAutoTimer);
      depthAutoTimer = null;
    }
  }

  function startDepthAuto() {
    stopDepthAuto();
    const galleryPageActive = document.getElementById("artwork")?.classList.contains("active");
    const artworkTabActive = document.querySelector('.tab[data-filter="artwork"]')?.classList.contains("active");
    const compactOrTouch = window.matchMedia("(max-width: 700px), (pointer: coarse)").matches;
    if (!depthSlides.length || document.hidden || document.body.classList.contains("reduce-motion")) return;
    if (!galleryPageActive || !artworkTabActive || compactOrTouch) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    depthAutoTimer = setInterval(() => goToDepth(depthIndex + 1, false), DEPTH_AUTO_MS);
  }

  function restartDepthAuto() {
    stopDepthAuto();
    startDepthAuto();
  }

  function openGalleryLightbox(slide) {
    if (!galleryLightbox || !galleryLightboxImage || !slide) return;
    const image = slide.querySelector("img");
    const title = slide.querySelector("strong");
    if (!image) return;
    galleryLightboxImage.src = image.getAttribute("src") || "";
    galleryLightboxImage.alt = image.getAttribute("alt") || "Artwork preview";
    if (galleryLightboxCaption) galleryLightboxCaption.textContent = title ? title.textContent : galleryLightboxImage.alt;
    galleryLightbox.classList.add("open");
    galleryLightbox.setAttribute("aria-hidden", "false");
    stopDepthAuto();
  }

  function closeGalleryLightbox() {
    if (!galleryLightbox) return;
    galleryLightbox.classList.remove("open");
    galleryLightbox.setAttribute("aria-hidden", "true");
    if (galleryLightboxImage) galleryLightboxImage.src = "";
    startDepthAuto();
  }

  if (depthCarousel && depthSlides.length) {
    if (depthDots) {
      depthDots.innerHTML = depthSlides
        .map((_, index) => `<button class="depth-dot${index === 0 ? " is-active" : ""}" type="button" aria-label="Go to artwork ${index + 1}" data-depth-dot="${index}"></button>`)
        .join("");

      depthDots.addEventListener("click", (event) => {
        const dot = event.target.closest("[data-depth-dot]");
        if (!dot) return;
        goToDepth(Number(dot.dataset.depthDot));
      });
    }

    if (depthPrev) depthPrev.addEventListener("click", depthPrevSlide);
    if (depthNext) depthNext.addEventListener("click", depthNextSlide);

    depthSlides.forEach((slide, index) => {
      slide.addEventListener("click", () => {
        if (depthMoved) return;
        if (index !== depthIndex) goToDepth(index);
        else openGalleryLightbox(slide);
      });

      slide.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (index !== depthIndex) goToDepth(index);
          else openGalleryLightbox(slide);
        }
      });
    });

    depthCarousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        depthPrevSlide();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        depthNextSlide();
      }
    });

    if (depthStage) {
      depthStage.addEventListener("pointerdown", (event) => {
        depthPointerStartX = event.clientX;
        depthPointerDeltaX = 0;
        depthDragging = true;
        depthMoved = false;
        depthStage.classList.add("is-dragging");
        depthStage.setPointerCapture?.(event.pointerId);
        stopDepthAuto();
      });

      depthStage.addEventListener("pointermove", (event) => {
        if (!depthDragging) return;
        depthPointerDeltaX = event.clientX - depthPointerStartX;
        if (Math.abs(depthPointerDeltaX) > 8) depthMoved = true;
      });

      const finishDepthDrag = (event) => {
        if (!depthDragging) return;
        depthDragging = false;
        depthStage.classList.remove("is-dragging");
        depthStage.releasePointerCapture?.(event.pointerId);
        if (Math.abs(depthPointerDeltaX) >= 45) {
          if (depthPointerDeltaX < 0) goToDepth(depthIndex + 1, false);
          else goToDepth(depthIndex - 1, false);
        }
        setTimeout(() => { depthMoved = false; }, 0);
        startDepthAuto();
      };

      depthStage.addEventListener("pointerup", finishDepthDrag);
      depthStage.addEventListener("pointercancel", finishDepthDrag);
    }

    depthCarousel.addEventListener("mouseenter", stopDepthAuto);
    depthCarousel.addEventListener("mouseleave", startDepthAuto);
    depthCarousel.addEventListener("focusin", stopDepthAuto);
    depthCarousel.addEventListener("focusout", (event) => {
      if (!depthCarousel.contains(event.relatedTarget)) startDepthAuto();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopDepthAuto();
      else startDepthAuto();
    });
    document.addEventListener("naoya:pagechange", () => startDepthAuto());
    document.addEventListener("naoya:mediafilter", () => startDepthAuto());
    window.addEventListener("resize", () => {
      updateDepthCarousel();
      startDepthAuto();
    }, { passive: true });

    updateDepthCarousel();
    startDepthAuto();
  }

  if (galleryLightboxClose) galleryLightboxClose.addEventListener("click", closeGalleryLightbox);
  if (galleryLightbox) {
    galleryLightbox.addEventListener("click", (event) => {
      if (event.target === galleryLightbox) closeGalleryLightbox();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && galleryLightbox?.classList.contains("open")) {
      closeGalleryLightbox();
    }
  });

  // ================================
  // MINI MUSIC PLAYER
  // ================================
  const audioPlayer = document.getElementById("audioPlayer");
  const music = document.getElementById("music");
  const playBtn = document.getElementById("playBtn");
  const prevTrack = document.getElementById("prevTrack");
  const nextTrack = document.getElementById("nextTrack");
  const muteBtn = document.getElementById("muteBtn");
  const progressBar = document.getElementById("progressBar");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");
  const playerVolume = document.getElementById("playerVolume");
  const audioStatus = document.getElementById("audioStatus");
  const playlist = document.getElementById("playlist");
  const playlistCount = document.getElementById("playlistCount");

  // IMPORTANT: these tracks are completely separate from the background BGM.
  // Put your audio files in assets/audio/ and add their paths here.
  const tracks = [
    {
      title: "A Lone Prayer",
      artist: "Yumi Kawamura · Shoji Meguro",
      meta: "Persona · 320kbps",
      src: "assets/audio/A Lone Prayer.mp3"
    },
    {
      title: "pepepepe (Bocchi the Rock!)",
      artist: "Tomoki Kikuya",
      meta: "Bocchi the Rock! OST · 320kbps",
      src: "assets/audio/pepepepe.wav"
    },
    {
      title: "School Days",
      artist: "Yumi Kawamura · Shoji Meguro",
      meta: "Persona · 320kbps",
      src: "assets/audio/Persona (PSP) ost - School Days [Extended] - MeRuleDaWorld (youtube).mp3"
    },
    {
      title: "Clavar La Espada",
      artist: "Shiro Sagisu",
      meta: "BLEACH OST 3 · 320kbps",
      src: "assets/audio/y2mate.com - Clavar La Espada.mp3"
    },
    {
      title: "Mass Destruction",
      artist: "Yumi Kawamura · Lotus Juice · Shoji Meguro",
      meta: "Persona 3 · 320kbps",
      src: "assets/audio/1412 Mass Destruction (Ost Persona 3).mp3"
    }
  ];
  let trackIndex = 0;

  function renderPlaylist() {
    if (!playlist) return;
    playlist.innerHTML = tracks.map((track, index) => `
      <button class="playlist-item${index === trackIndex ? " active" : ""}" data-track-index="${index}" type="button">
        <span class="playlist-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="playlist-cover">♫</span>
        <span class="playlist-track-info">
          <strong>${track.title}</strong>
          <small>${track.artist}</small>
        </span>
        <span class="playlist-meta">${track.meta}</span>
        <span class="playlist-play">▶</span>
      </button>
    `).join("");

    playlist.querySelectorAll(".playlist-item").forEach((item) => {
      item.addEventListener("click", () => {
        const index = Number(item.dataset.trackIndex);
        if (index === trackIndex && music && !music.paused) {
          music.pause();
        } else {
          loadTrack(index, true);
        }
      });
    });

    if (playlistCount) playlistCount.textContent = `${tracks.length} TRACKS`;
  }

  function syncPlaylistUI() {
    if (!playlist) return;
    playlist.querySelectorAll(".playlist-item").forEach((item, index) => {
      const active = index === trackIndex;
      item.classList.toggle("active", active);
      item.classList.toggle("playing", active && music && !music.paused);
      const icon = item.querySelector(".playlist-play");
      if (icon) icon.textContent = active && music && !music.paused ? "❚❚" : "▶";
    });
  }

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  function syncPlayerUI() {
    if (!music) return;
    const playing = !music.paused;
    if (audioPlayer) audioPlayer.classList.toggle("is-playing", playing);
    if (playBtn) {
      playBtn.textContent = playing ? "❚❚" : "▶";
      playBtn.title = playing ? "Pause" : "Play";
      playBtn.setAttribute("aria-label", playing ? "Pause music" : "Play music");
    }
    if (audioStatus) audioStatus.textContent = playing ? "PLAYING" : "PAUSED";
    if (currentTimeEl) currentTimeEl.textContent = formatTime(music.currentTime);
    if (durationEl) durationEl.textContent = formatTime(music.duration);
    if (progressBar && Number.isFinite(music.duration) && music.duration > 0) {
      progressBar.value = (music.currentTime / music.duration) * 100;
      syncElasticRange(progressBar);
    }
    if (playerVolume) {
      playerVolume.value = String(Math.round(music.volume * 100));
      syncElasticRange(playerVolume);
    }
    if (muteBtn) muteBtn.textContent = music.muted || music.volume === 0 ? "🔇" : "🔊";
    syncPlaylistUI();
  }

  function loadTrack(index, autoPlay = false) {
    if (!music || !tracks.length) return;
    trackIndex = (index + tracks.length) % tracks.length;
    const track = tracks[trackIndex];
    music.src = track.src;
    const title = document.getElementById("trackTitle");
    const meta = document.getElementById("trackMeta");
    if (title) title.textContent = track.title;
    if (meta) meta.textContent = `${track.artist} · ${track.meta}`;
    renderPlaylist();
    music.load();
    if (autoPlay) music.play().catch(() => {});
  }

  if (music && playBtn) {
    music.addEventListener("play", () => {
      // Audio-tab music gets priority: fade the website BGM down smoothly.
      duckBackgroundMusic();
      syncPlayerUI();
    });

    music.addEventListener("pause", () => {
      syncPlayerUI();
      // When the user pauses the Audio tab, bring the website BGM back smoothly.
      restoreBackgroundMusic();
    });

    music.addEventListener("timeupdate", syncPlayerUI);
    music.addEventListener("loadedmetadata", syncPlayerUI);
    music.addEventListener("volumechange", syncPlayerUI);
    music.addEventListener("ended", () => {
      if (tracks.length > 1) {
        loadTrack(trackIndex + 1, true);
      } else {
        music.currentTime = 0;
        syncPlayerUI();
        restoreBackgroundMusic();
      }
    });

    playBtn.addEventListener("click", () => {
      if (music.paused) music.play().catch(() => {});
      else music.pause();
    });

    prevTrack.addEventListener("click", () => {
      if (tracks.length > 1) loadTrack(trackIndex - 1, true);
      else music.currentTime = 0;
    });

    nextTrack.addEventListener("click", () => {
      if (tracks.length > 1) loadTrack(trackIndex + 1, true);
      else music.currentTime = 0;
    });

    muteBtn.addEventListener("click", () => {
      music.muted = !music.muted;
      syncPlayerUI();
    });

    progressBar.addEventListener("input", () => {
      if (Number.isFinite(music.duration) && music.duration > 0) {
        music.currentTime = (Number(progressBar.value) / 100) * music.duration;
      }
    });

    if (playerVolume) {
      playerVolume.addEventListener("input", () => {
        const value = Math.max(0, Math.min(100, Number(playerVolume.value)));
        music.volume = value / 100;
        music.muted = value === 0;
        syncPlayerUI();
      });
    }

    renderPlaylist();
    loadTrack(0, false);
    syncPlayerUI();
  }

  // ================================
  // REAL CLOCK (only if an element exists)
  // ================================
  const clockElement = document.getElementById("clock");

  function updateClock() {
    if (!clockElement) return;

    const now = new Date();
    clockElement.textContent = [
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
    ]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  if (clockElement) {
    updateClock();
    setInterval(updateClock, 1000);
  }

  // ================================
  // AFK TIMER - rolling counter
  // Inspired by the React Bits Counter motion, adapted to vanilla JS.
  // Starts from page/script load, NOT when AFK tab is opened.
  // ================================
  const timerElement = document.getElementById("afkTimer");
  const afkDigitState = [];

  function buildAFKCounter(initialValue = "00:00:00") {
    if (!timerElement) return;

    timerElement.textContent = "";
    timerElement.setAttribute("aria-label", initialValue);

    let digitIndex = 0;

    [...initialValue].forEach((character) => {
      if (character === ":") {
        const separator = document.createElement("span");
        separator.className = "afk-counter-separator";
        separator.textContent = ":";
        separator.setAttribute("aria-hidden", "true");
        timerElement.appendChild(separator);
        return;
      }

      const digit = Number(character);
      const slot = document.createElement("span");
      slot.className = "afk-counter-digit";
      slot.setAttribute("aria-hidden", "true");

      const reel = document.createElement("span");
      reel.className = "afk-counter-reel";

      // Three 0-9 cycles let the digit roll through 9 -> 0 smoothly.
      for (let cycle = 0; cycle < 3; cycle += 1) {
        for (let number = 0; number <= 9; number += 1) {
          const cell = document.createElement("span");
          cell.className = "afk-counter-number";
          cell.textContent = String(number);
          reel.appendChild(cell);
        }
      }

      const step = 10 + digit;
      reel.style.setProperty("--counter-step", String(step));
      slot.appendChild(reel);
      timerElement.appendChild(slot);

      afkDigitState[digitIndex] = { reel, digit, step };
      digitIndex += 1;
    });
  }

  function setAFKCounter(value) {
    if (!timerElement) return;

    timerElement.setAttribute("aria-label", value);
    const digits = value.replaceAll(":", "").split("").map(Number);

    digits.forEach((nextDigit, index) => {
      const state = afkDigitState[index];
      if (!state || state.digit === nextDigit) return;

      // Timer values normally move forward, so use forward modulo distance.
      const distance = (nextDigit - state.digit + 10) % 10;
      state.step += distance || 10;
      state.digit = nextDigit;
      state.reel.style.setProperty("--counter-step", String(state.step));

      // Keep the reel inside the middle cycle after the animation completes.
      if (state.step >= 20) {
        window.setTimeout(() => {
          state.reel.classList.add("is-resetting");
          state.step = 10 + state.digit;
          state.reel.style.setProperty("--counter-step", String(state.step));

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              state.reel.classList.remove("is-resetting");
            });
          });
        }, 680);
      }
    });
  }

  function updateAFKTimer() {
    if (!timerElement) return;

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - afkStartTime) / 1000)
    );

    const hours = String(Math.floor(elapsedSeconds / 3600)).padStart(2, "0");
    const minutes = String(
      Math.floor((elapsedSeconds % 3600) / 60)
    ).padStart(2, "0");
    const seconds = String(elapsedSeconds % 60).padStart(2, "0");
    const displayValue = `${hours}:${minutes}:${seconds}`;

    if (!afkDigitState.length) buildAFKCounter(displayValue);
    setAFKCounter(displayValue);
  }

  updateAFKTimer();
  setInterval(updateAFKTimer, 1000);
});
