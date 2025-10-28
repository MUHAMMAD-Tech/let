document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const body = document.body;
  const switchEl = document.getElementById("switch");
  const svgEl = document.querySelector(".swap-section .curen_color"); // faqat swap section ichidagi SVG

  // --- Theme Update Function ---
  function updateThemeColors() {
    if (!svgEl) return;

    if (body.classList.contains("light")) {
      svgEl.style.color = "#000"; // light theme → qora SVG
    } else {
      svgEl.style.color = "#fff"; // dark theme → oq SVG
    }
  }

  // --- Sahifa yuklanganda theme ---
  if (localStorage.getItem("theme") === "light") {
    body.classList.add("light");
    if (switchEl) switchEl.classList.add("switched");
  }
  updateThemeColors();

  // --- Switch Event ---
  if (switchEl) {
    switchEl.addEventListener("click", () => {
      body.classList.toggle("light");
      switchEl.classList.toggle("switched");
      localStorage.setItem("theme", body.classList.contains("light") ? "light" : "dark");
      updateThemeColors(); // faqat swap section ichidagi SVG rangini yangilash
    });
  }

  // --- Navigation ---
  const menu = document.querySelector(".menu-icon");
  if (menu) {
    menu.addEventListener("click", () => body.classList.toggle("nav-active"));
  }

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
});