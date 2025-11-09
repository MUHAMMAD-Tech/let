console.log("Script loaded successfully");

function initApp() {
  console.log("initApp function started");

  const body = document.body;
  const menu = document.querySelector(".menu-icon");

  // ===== MENU TOGGLE =====
  if (menu) {
    menu.addEventListener("click", function (e) {
      console.log("Menu clicked!");
      body.classList.toggle("nav-active");
      e.preventDefault();
    });

    menu.addEventListener("touchstart", function (e) {
      console.log("Menu touched!");
      body.classList.toggle("nav-active");
      e.preventDefault();
    });
  } else {
    console.log("Menu element not found!");
  }

  // ===== THEME SWITCHER =====
  const switchEl = document.getElementById("switch");
  const circle = document.getElementById("circle");
  const logo = document.querySelector(".curen_color");

  if (switchEl) {
    console.log("Switch element found");
    switchEl.addEventListener("click", function () {
      body.classList.toggle("light");
      const isLight = body.classList.contains("light");
      console.log("Theme toggled to:", isLight ? "light" : "dark");

      // Circle movement
      if (circle) {
        circle.style.transform = isLight ? "translateX(50px)" : "translateX(0)";
        circle.style.transition = "transform 0.3s ease";
        console.log("Circle moved:", isLight ? "right" : "left");
      }

      // Logo color change
      if (logo) {
        logo.style.color = isLight ? "#000" : "#fff";
        logo.style.transition = "color 0.1s";
        console.log("Logo color changed:", isLight ? "black" : "white");
      }
    });
  } else {
    console.log("Switch element not found!");
  }

  // ===== DELEGATED MENU BACKUP =====
  document.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("menu-icon") ||
      e.target.closest(".menu-icon")
    ) {
      body.classList.toggle("nav-active");
      e.preventDefault();
      console.log("Menu toggled via delegation");
    }
  });
}

// ===== DOM READY =====
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    console.log("DOMContentLoaded event fired");
    initApp();
  });
} else {
  console.log("DOM already ready, initializing immediately");
  initApp();
}

// ===== WINDOW LOAD =====
window.addEventListener("load", function () {
  console.log("Window loaded completely");
});

// ===== 3 SECOND RECHECK =====
setTimeout(function () {
  console.log("3 second timeout check");
  const menu = document.querySelector(".menu-icon");
  if (menu && !menu.hasAttribute("data-listener-added")) {
    console.log("Adding listener via timeout");
    menu.setAttribute("data-listener-added", "true");
    menu.addEventListener("click", function () {
      document.body.classList.toggle("nav-active");
    });
  }
}, 3000);



const LethexUI = (() => {
  // ✅ Qurilma mobil ekanligini aniqlash
 function adjustMobileModal() {
  const modal = document.querySelector(".modal-content");
  if (!modal) return;

  const isMobile = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) {
    // 📱 Mobil uchun
    modal.style.position = "relative";
    modal.style.top = "50%";
  } else {
    // 💻 Desktop uchun normal holatga qaytaramiz
    modal.style.position = "relative";
    modal.style.top = "30%";
    modal.style.transform = "translateY(-50%)";
  }
}

  // ✅ Modal oynani ochish
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "block";
  }

  // ✅ Modal oynani yopish
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  }

  // ✅ Token tanlov dropdown boshqaruvi
  function setupDropdowns() {
    document.querySelectorAll(".token-select").forEach((sel) => {
      sel.addEventListener("click", (e) => {
        e.stopPropagation();
        const list = sel.querySelector(".token-dropdown");
        if (!list) return;
        // boshqa ochiq dropdownlarni yopish
        document.querySelectorAll(".token-dropdown").forEach((l) => {
          if (l !== list) l.classList.remove("show");
        });
        list.classList.toggle("show");
      });
    });

    // Tashqariga bosilganda dropdownni yopish
    window.addEventListener("click", (e) => {
      if (!e.target.closest(".token-select")) {
        document
          .querySelectorAll(".token-dropdown")
          .forEach((l) => l.classList.remove("show"));
      }
    });
  }

  // 🔹 Hammasini qaytaramiz
  return { adjustMobileModal, openModal, closeModal, setupDropdowns };
})();

// ✅ Global holatga qo‘shamiz (React yoki module ichida ham ishlaydi)
window.LethexUI = LethexUI;

// ✅ Sahifa yuklanganda ishga tushadi (faqat oddiy HTML loyihalarda)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    LethexUI.adjustMobileModal();
    LethexUI.setupDropdowns();
  });
} else {
  // Agar sahifa allaqachon yuklangan bo‘lsa
  LethexUI.adjustMobileModal();
  LethexUI.setupDropdowns();
}









