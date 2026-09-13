// ================================
// VOLUME & AUDIO (ĐẶT Ở ĐẦU FILE SCRIPT.JS)
// ================================
window.addEventListener("DOMContentLoaded", () => {
  const music = document.getElementById("music");
  const volumeInput = document.getElementById("volume");
  const volumeText = document.getElementById("volumeText");

  if (!music || !volumeInput) return;

  // Khởi tạo âm lượng
  music.volume = Number(volumeInput.value) / 100;

  // Lắng nghe kéo thanh slider -> tăng/giảm âm lượng trực tiếp
  volumeInput.addEventListener("input", (e) => {
    const val = Number(e.target.value);
    music.volume = val / 100;
    if (volumeText) volumeText.textContent = `Volume: ${val}%`;

    if (val > 0 && music.paused) {
      music.play().catch(() => {});
    }
  });

  // Mở khóa âm thanh ở lần tương tác đầu tiên
  const unlock = () => {
    if (music.paused) music.play().catch(() => {});
    document.removeEventListener("click", unlock);
    document.removeEventListener("keydown", unlock);
  };
  document.addEventListener("click", unlock);
  document.addEventListener("keydown", unlock);
});
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
// Bộ lọc Tab Media thông minh
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const category = tab.dataset.kind;

    document.querySelectorAll(".media-item").forEach((item) => {
      if (item.classList.contains(category)) {
        item.classList.remove("hidden");
      } else {
        item.classList.add("hidden");
      }
    });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const mediaItems = document.querySelectorAll("[data-category]");

  // Khởi tạo: Chỉ hiện artwork khi vừa tải trang
  mediaItems.forEach((item) => {
    if (item.getAttribute("data-category") !== "artwork") {
      item.style.display = "none";
    }
  });

  // Lắng nghe sự kiện click từng Tab
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Đổi trạng thái hiển thị của Nút
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      const targetFilter = tab.getAttribute("data-filter");

      // Lọc danh mục ảnh / audio
      mediaItems.forEach((item) => {
        if (item.getAttribute("data-category") === targetFilter) {
          item.style.display = ""; // Hiện
        } else {
          item.style.display = "none"; // Ẩn
        }
      });
    });
  });
});
// Bộ đếm AFK thời gian thực (Chuẩn xác 100%, không bị trôi khi ẩn tab)
document.addEventListener("DOMContentLoaded", () => {
  const timerElement = document.getElementById("afkTimer");
  if (!timerElement) return;

  const startTime = Date.now();

  function updateAFKTimer() {
    const elapsedMs = Date.now() - startTime;
    const totalSecs = Math.floor(elapsedMs / 1000);

    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
    const secs = String(totalSecs % 60).padStart(2, "0");

    timerElement.textContent = `${hrs}:${mins}:${secs}`;
  }

  // Chạy ngay lập tức 1 lần để không bị trễ 1s đầu tiên
  updateAFKTimer();
  setInterval(updateAFKTimer, 1000);
});
document.addEventListener("DOMContentLoaded", () => {
  // 1. Kích hoạt đồng hồ AFK thời gian thực
  const timerElement = document.getElementById("afkTimer");
  if (timerElement) {
    const startTime = Date.now();
    const updateAFKTimer = () => {
      const elapsedMs = Date.now() - startTime;
      const totalSecs = Math.floor(elapsedMs / 1000);
      const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
      const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
      const secs = String(totalSecs % 60).padStart(2, "0");
      timerElement.textContent = `${hrs}:${mins}:${secs}`;
    };
    updateAFKTimer();
    setInterval(updateAFKTimer, 1000);
  }

  // 2. Chuyển đổi Trang Sidebar an toàn
  const navLinks = document.querySelectorAll(".sidebar a, .sidebar button");
  const pages = document.querySelectorAll(".page");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId =
        link.dataset.page || link.getAttribute("href")?.replace("#", "");
      if (!targetId) return;

      const targetPage = document.getElementById(targetId);
      if (!targetPage) return;

      e.preventDefault();
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      pages.forEach((page) => {
        page.classList.remove("active");
        page.style.display = "none";
      });

      targetPage.classList.add("active");
      targetPage.style.display = targetId === "contact" ? "flex" : "block";
    });
  });
});
document.addEventListener("DOMContentLoaded", () => {
  // 1. Đồng hồ AFK thời gian thực
  const timerElement = document.getElementById("afkTimer");
  if (timerElement) {
    const startTime = Date.now();
    const updateAFKTimer = () => {
      const elapsedMs = Date.now() - startTime;
      const totalSecs = Math.floor(elapsedMs / 1000);
      const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
      const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
      const secs = String(totalSecs % 60).padStart(2, "0");
      timerElement.textContent = `${hrs}:${mins}:${secs}`;
    };
    updateAFKTimer();
    setInterval(updateAFKTimer, 1000);
  }

  // 2. Chuyển trang Sidebar (Hỗ trợ cả "afk" và "contact")
  const navLinks = document.querySelectorAll(".sidebar a, .sidebar button");
  const pages = document.querySelectorAll(".page");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      let targetId =
        link.dataset.page || link.getAttribute("href")?.replace("#", "");
      if (!targetId) return;

      // Đồng bộ nếu nút ghi "contact" thì tự hiểu là trang "afk"
      if (targetId === "contact") targetId = "afk";

      const targetPage = document.getElementById(targetId);
      if (!targetPage) return;

      e.preventDefault();

      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      pages.forEach((page) => {
        page.classList.remove("active");
        page.style.display = "none";
      });

      targetPage.classList.add("active");
      targetPage.style.display = targetId === "afk" ? "flex" : "block";
    });
  });

  // 3. Xử lý Notepad cơ bản (Chống lỗi Null nếu thiếu nút)
  const addBtn = document.getElementById("add");
  const noteInput = document.getElementById("note");
  const notesContainer = document.getElementById("notes");

  addBtn?.addEventListener("click", () => {
    if (!noteInput?.value.trim()) return;
    const noteDiv = document.createElement("div");
    noteDiv.className = "card";
    noteDiv.style.marginTop = "10px";
    noteDiv.textContent = noteInput.value;
    notesContainer?.appendChild(noteDiv);
    noteInput.value = "";
  });
});
(function initAFKClock() {
  const startTime = Date.now();

  function updateClock() {
    const timerElement = document.getElementById("afkTimer");
    if (!timerElement) return;

    const totalSecs = Math.floor((Date.now() - startTime) / 1000);
    const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, "0");
    const secs = String(totalSecs % 60).padStart(2, "0");

    timerElement.textContent = `${hrs}:${mins}:${secs}`;
  }

  // Chạy lặp lại mỗi 1 giây liên tục
  setInterval(updateClock, 1000);
})();
