// ================================
// NAOYA STYLE HUB - MAIN SCRIPT
// ================================

// IMPORTANT:
// AFK timer starts as soon as this JS file is loaded,
// so it also counts the loading screen time.
const afkStartTime = Date.now();

document.addEventListener("DOMContentLoaded", () => {
  // ================================
  // VOLUME & AUDIO
  // ================================
  const music = document.getElementById("music");
  const volumeInput = document.getElementById("volume");
  const volumeText = document.getElementById("volumeText");

  if (music && volumeInput) {
    const initialVolume = Number(volumeInput.value) / 100;
    music.volume = initialVolume;

    volumeInput.addEventListener("input", (e) => {
      const value = Math.max(0, Math.min(100, Number(e.target.value)));
      music.volume = value / 100;

      if (volumeText) {
        volumeText.textContent = `Volume: ${value}%`;
      }

      // If user moves the slider above 0, try to start music.
      if (value > 0 && music.paused) {
        music.play().catch(() => {
          // Browser may block autoplay until the user interacts.
        });
      }
    });

    // Browser autoplay policy: first user interaction unlocks audio.
    const unlockAudio = () => {
      if (music.paused && music.volume > 0) {
        music.play().catch(() => {});
      }
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("keydown", unlockAudio);
  }

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

    window.scrollTo({ top: 0, behavior: "smooth" });
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
    });
  }

  // ================================
  // NOTEPAD
  // ================================
  const note = document.getElementById("note");
  const notes = document.getElementById("notes");
  const addButton = document.getElementById("add");

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function renderNotes() {
    if (!notes) return;

    let savedNotes = [];
    try {
      savedNotes = JSON.parse(localStorage.getItem("notes") || "[]");
    } catch {
      savedNotes = [];
    }

    notes.innerHTML = savedNotes
      .map((item) => `<div class="note">${escapeHTML(item)}</div>`)
      .join("");
  }

  if (addButton && note) {
    addButton.addEventListener("click", () => {
      const value = note.value.trim();
      if (!value) return;

      let savedNotes = [];
      try {
        savedNotes = JSON.parse(localStorage.getItem("notes") || "[]");
      } catch {
        savedNotes = [];
      }

      savedNotes.unshift(value);
      localStorage.setItem(
        "notes",
        JSON.stringify(savedNotes.slice(0, 20))
      );

      note.value = "";
      renderNotes();
    });
  }

  renderNotes();

  // ================================
  // GALLERY / SKETCH / AUDIO TABS
  // ================================
  const tabs = document.querySelectorAll(".tab");
  const mediaItems = document.querySelectorAll(".media-item");

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
  }

  // HTML uses data-filter, not data-kind.
  // Artwork is the default tab.
  filterMedia("artwork");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      filterMedia(tab.dataset.filter);
    });
  });

  // Audio card controls the same BGM player from the sidebar.
  document.querySelectorAll(".play-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (!music) return;

      if (music.paused) {
        music.play().then(() => {
          button.textContent = "❚❚ PAUSE";
        }).catch(() => {
          button.textContent = "▶ PLAY";
        });
      } else {
        music.pause();
        button.textContent = "▶ PLAY";
      }
    });
  });

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
  // AFK TIMER
  // Starts from page/script load, NOT when AFK tab is opened.
  // ================================
  const timerElement = document.getElementById("afkTimer");

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

    timerElement.textContent = `${hours}:${minutes}:${seconds}`;
  }

  updateAFKTimer();
  setInterval(updateAFKTimer, 1000);
});
