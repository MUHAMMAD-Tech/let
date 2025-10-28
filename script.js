document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const body = document.body;
  const switchEl = document.getElementById("switch");
  const svgElements = document.querySelectorAll(".curen_color"); // barcha SVG lar
  const swapSection = document.querySelector(".swap-section"); // swap section

  // --- Theme Update Function ---
  function updateThemeColors() {
    // SVG rangini yangilash
    svgElements.forEach(svg => {
      if (body.classList.contains("light")) {
        svg.style.color = "#000"; // light → qora
      } else {
        svg.style.color = "#fff"; // dark → oq
      }
    });

    // Swap section matnlarini yangilash
    if (swapSection) {
      if (body.classList.contains("light")) {
        swapSection.style.color = "#000"; // light → qora
      } else {
        swapSection.style.color = "#fff"; // dark → oq
      }
    }
  }

  // --- Sahifa yuklanganda theme ---
  if (localStorage.getItem("theme") === "light") {
    body.classList.add("light");
    if (switchEl) switchEl.classList.add("switched");
  }
  updateThemeColors();

  // --- Theme switch ---
  if (switchEl) {
    switchEl.addEventListener("click", () => {
      body.classList.toggle("light");
      switchEl.classList.toggle("switched");
      localStorage.setItem("theme", body.classList.contains("light") ? "light" : "dark");
      updateThemeColors(); // ranglarni yangilash
    });
  }

  // --- Navigation menu toggle ---
  const menu = document.querySelector(".menu-icon");
  if (menu) {
    menu.addEventListener("click", () => body.classList.toggle("nav-active"));
  }

  // --- Cursor animation ---
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