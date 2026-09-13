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
    }
    if (playerVolume) playerVolume.value = String(Math.round(music.volume * 100));
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
