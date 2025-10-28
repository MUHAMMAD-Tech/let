document.addEventListener("DOMContentLoaded", function () {
  const body = document.body;
  const switchEl = document.getElementById("switch");
  const svgElements = document.querySelectorAll(".curen_color");
  const swapSection = document.querySelector(".swap-section");
  const menu = document.querySelector(".menu-icon");

  // --- Update Theme Colors ---
  function updateThemeColors() {
    // SVG
    svgElements.forEach(svg => {
      svg.style.color = body.classList.contains("light") ? "#000" : "#fff";
    });
    // Swap section
    if (swapSection) {
      swapSection.style.color = body.classList.contains("light") ? "#000" : "#fff";
    }
  }

  // --- Load theme from localStorage ---
  if (localStorage.getItem("theme") === "light") {
    body.classList.add("light");
    if (switchEl) switchEl.classList.add("switched");
  }
  updateThemeColors();

  // --- Theme toggle ---
  if (switchEl) {
    switchEl.addEventListener("click", () => {
      body.classList.toggle("light");
      switchEl.classList.toggle("switched");
      localStorage.setItem("theme", body.classList.contains("light") ? "light" : "dark");
      updateThemeColors();
    });
  }

  // --- Navigation menu toggle ---
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