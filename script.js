// =======================
// UI & Theme JS
// =======================
document.addEventListener("DOMContentLoaded", function() {
  "use strict";

  // --- Cursor Animation ---
  const t = document.getElementById("cursor"),
        e = document.getElementById("cursor2"),
        i = document.getElementById("cursor3");

  if (t && e && i) {
    document.body.addEventListener("mousemove", (event) => {
      [t, e, i].forEach(el => {
        el.style.left = event.clientX + "px";
        el.style.top = event.clientY + "px";
      });
    });

    const hoverOn = () => { e.classList.add("hover"); i.classList.add("hover"); };
    const hoverOff = () => { e.classList.remove("hover"); i.classList.remove("hover"); };

    document.querySelectorAll(".hover-target").forEach(el => {
      el.addEventListener("mouseover", hoverOn);
      el.addEventListener("mouseout", hoverOff);
    });
  }

  // --- Navigation (Burger Menu) ---
  const body = document.body;
  const menu = document.querySelector(".menu-icon");
  if (menu) {
    menu.addEventListener("click", () => body.classList.toggle("nav-active"));
  }

  // --- Light / Dark Switch + SVG theme ---
  const switchEl = document.getElementById("switch");
  const svgEl = document.querySelector(".curen_color");
  const swapSection = document.querySelector(".swap-section");

  function updateThemeColors() {
    if (!svgEl || !swapSection) return;
    if (body.classList.contains("light")) {
      svgEl.style.color = "#000";      // SVG qora
      swapSection.style.color = "#000"; // form text qora
    } else {
      svgEl.style.color = "#fff";      // SVG oq
      swapSection.style.color = "#fff"; // form text oq
    }
  }

  if (localStorage.getItem("theme") === "light") {
    body.classList.add("light");
    if (switchEl) switchEl.classList.add("switched");
  }
  updateThemeColors();

  if (switchEl) {
    switchEl.addEventListener("click", () => {
      body.classList.toggle("light");
      switchEl.classList.toggle("switched");
      localStorage.setItem("theme", body.classList.contains("light") ? "light" : "dark");
      updateThemeColors();
    });
  }
});