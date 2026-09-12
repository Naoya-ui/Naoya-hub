// ================================
// KOKOMU LOADING SCREEN
// ================================

(function initLoader() {
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loaderBar");
  const loaderPercent = document.getElementById("loaderPercent");

  if (!loader || !loaderBar || !loaderPercent) {
    return;
  }

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
    }

    loaderBar.style.width = progress + "%";

    loaderPercent.textContent = String(progress).padStart(2, "0") + "%";
  }, 90);
})();
const names = {
  home: "Home Dashboard",
  about: "Profile / About",
  artwork: "PGR Media Layout",
  notepad: "Notepad",
  contact: "AFK Zone",
};
document.querySelectorAll(".nav").forEach((b) =>
  b.addEventListener("click", () => {
    document
      .querySelectorAll(".nav")
      .forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    document
      .querySelectorAll(".page")
      .forEach((p) => p.classList.remove("active"));
    document.getElementById(b.dataset.page).classList.add("active");
    document.getElementById("crumb").textContent = names[b.dataset.page];
    window.scrollTo({ top: 0, behavior: "smooth" });
  }),
);
document.getElementById("motion").onclick = () =>
  document.body.classList.toggle("reduce-motion");
const motionBtn = document.getElementById("motion");

if (localStorage.getItem("theme") === "light") {
  document.body.classList.add("light-mode");
  motionBtn.textContent = "☀";
}

motionBtn.addEventListener("click", () => {
  const isLight = document.body.classList.toggle("light-mode");

  localStorage.setItem("theme", isLight ? "light" : "dark");

  motionBtn.textContent = isLight ? "☀" : "◐";
});
document.getElementById("contrast").onclick = () =>
  document.body.classList.toggle("contrast");
const note = document.getElementById("note"),
  notes = document.getElementById("notes");
function render() {
  let a = [];
  try {
    a = JSON.parse(localStorage.getItem("notes") || "[]");
  } catch {}
  notes.innerHTML = a
    .map((n) => `<div class="note">${escape(n)}</div>`)
    .join("");
}
function escape(x) {
  const d = document.createElement("div");
  d.textContent = x;
  return d.innerHTML;
}
document.getElementById("add").onclick = () => {
  const v = note.value.trim();
  if (!v) return;
  let a = [];
  try {
    a = JSON.parse(localStorage.getItem("notes") || "[]");
  } catch {}
  a.unshift(v);
  localStorage.setItem("notes", JSON.stringify(a.slice(0, 20)));
  note.value = "";
  render();
};
render();
document.querySelectorAll(".tab").forEach(
  (t) =>
    (t.onclick = () => {
      document
        .querySelectorAll(".tab")
        .forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      const labels = {
        art: ["ARTWORK 01", "ARTWORK 02", "ARTWORK 03", "ARTWORK 04"],
        sketch: ["SKETCH 01", "SKETCH 02", "SKETCH 03", "SKETCH 04"],
        audio: ["AUDIO 01", "AUDIO 02", "AUDIO 03", "AUDIO 04"],
      }[t.dataset.kind];
      document
        .querySelectorAll(".tile")
        .forEach((x, i) => (x.textContent = labels[i]));
    }),
);
function clock() {
  const d = new Date();
  document.getElementById("clock").textContent = [
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
  ]
    .map((x) => String(x).padStart(2, "0"))
    .join(":");
}
clock();
setInterval(clock, 1000);
const crashChannel = new BroadcastChannel("web_crash_channel");
const blackoutBox = document.getElementById("blackoutBox");
const glitchBox = document.getElementById("glitchBox");
window.isBlackingOut = false;
let lastAutoBlackoutTime = 0;

const DISCORD_ID = 869568513864519690;

async function loadDiscordStatus() {
  const statusElement = document.getElementById("discordStatus");

  if (!statusElement) return;

  try {
    const response = await fetch(
      `https://api.lanyard.rest/v1/users/${DISCORD_ID}`,
    );

    if (!response.ok) {
      throw new Error("Lanyard request failed");
    }

    const result = await response.json();

    const status = result.data?.discord_status || "offline";

    let text = "Offline";

    if (status === "online") {
      text = "Online";
    } else if (status === "idle") {
      text = "Idle";
    } else if (status === "dnd") {
      text = "Do Not Disturb";
    }

    statusElement.innerHTML = `
            <span></span>
            ${text}
        `;

    statusElement.classList.toggle("offline", status === "offline");
  } catch (error) {
    console.error("Discord status error:", error);

    statusElement.innerHTML = `
            <span></span>
            Offline
        `;

    statusElement.classList.add("offline");
  }
}

loadDiscordStatus();

setInterval(loadDiscordStatus, 30000);
// ================================
// CUSTOM MUSIC PLAYER
// ================================

const music = document.getElementById("music");
const volumeSlider = document.getElementById("volumeSlider");
const volumeFill = document.getElementById("volumeFill");
const volumeThumb = document.getElementById("volumeThumb");
const volumeText = document.getElementById("volumeText");

let currentVolume = 24;

// ================================
// SET VOLUME
// ================================

function setVolume(value) {
  value = Math.max(0, Math.min(100, value));

  currentVolume = value;

  music.volume = value / 100;

  music.muted = value === 0;

  volumeFill.style.width = value + "%";
  volumeThumb.style.left = value + "%";

  if (volumeText) {
    volumeText.textContent = `Volume: ${Math.round(value)}%`;
  }
}

// Start at 24%
setVolume(24);

// ================================
// MOUSE / TOUCH SLIDER
// ================================

function updateSlider(event) {
  const rect = volumeSlider.getBoundingClientRect();

  let x;

  if (event.touches) {
    x = event.touches[0].clientX;
  } else {
    x = event.clientX;
  }

  let percentage = ((x - rect.left) / rect.width) * 100;

  percentage = Math.max(0, Math.min(100, percentage));

  setVolume(percentage);

  // User interacted with the slider,
  // so try to unlock audio.
  music.muted = false;

  music.play().catch(() => {});
}

// Mouse
volumeSlider.addEventListener("mousedown", (event) => {
  updateSlider(event);

  function move(e) {
    updateSlider(e);
  }

  function stop() {
    document.removeEventListener("mousemove", move);
    document.removeEventListener("mouseup", stop);
  }

  document.addEventListener("mousemove", move);
  document.addEventListener("mouseup", stop);
});

// Touch
volumeSlider.addEventListener(
  "touchstart",
  (event) => {
    updateSlider(event);
  },
  { passive: true },
);

volumeSlider.addEventListener(
  "touchmove",
  (event) => {
    updateSlider(event);
  },
  { passive: true },
);

// ================================
// AUTOPLAY
// ================================

async function startMusic() {
  setVolume(currentVolume);

  try {
    // Try normal autoplay
    music.muted = false;

    await music.play();

    console.log("Music autoplay started.");
  } catch (error) {
    console.log("Browser blocked autoplay with sound.");

    // Browser may allow muted autoplay
    music.muted = true;

    try {
      await music.play();

      console.log("Music started muted.");
    } catch (error2) {
      console.log("Autoplay completely blocked.");
    }
  }
}

startMusic();

// ================================
// FIRST USER INTERACTION
// ================================

function unlockMusic() {
  music.muted = false;

  setVolume(currentVolume);

  music.play().catch(() => {});
}

document.addEventListener("click", unlockMusic, { once: true });

document.addEventListener("keydown", unlockMusic, { once: true });
