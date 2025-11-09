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







<!-- === Connect tugmasi === -->
<button id="connectWalletBtn" style="padding:10px 20px;border-radius:8px;">
  <span id="Connected">Connect Wallet</span>
</button>

<!-- === Modal (avval yashirin holatda) === -->
<div id="connectModal" 
     style="display:none;
            position:fixed;
            top:0;
            left:0;
            width:100%;
            height:100%;
            background-color:rgba(0,0,0,0.5);
            justify-content:center;
            align-items:center;
            z-index:9999;">

  <div style="background:#fff;
              padding:20px;
              border-radius:12px;
              text-align:center;
              min-width:250px;">
    <p>Walletni ulang</p>
    <button id="cancelConnectBtn" 
            style="margin-top:10px;padding:6px 14px;border-radius:8px;">
      Cancel
    </button>
  </div>
</div>

<script>
// Elementlarni olish
const connectWalletBtn = document.getElementById("connectWalletBtn");
const connectModal = document.getElementById("connectModal");
const cancelConnectBtn = document.getElementById("cancelConnectBtn");
const connectSpan = document.getElementById("Connected");

// Wallet holati
let isWalletConnected = false;

// Tugmani bosganda modalni ochish
connectWalletBtn.addEventListener("click", () => {
  connectModal.style.display = "flex"; // sahifani to‘smasdan markazda ko‘rsatadi

  // Wallet holatiga qarab matnni yangilash
  if (isWalletConnected) {
    connectSpan.textContent = "Connected ✅";
  } else {
    connectSpan.textContent = "Connect Wallet";
  }
});

// Cancel tugmasini bosganda modalni yopish
cancelConnectBtn.addEventListener("click", () => {
  connectModal.style.display = "none";
});

// Walletni tekshirish (demo uchun)
function checkWalletConnection() {
  // Bu yerda haqiqiy wallet logikasi bo‘ladi (hozircha random demo)
  const connected = Math.random() > 0.5;
  isWalletConnected = connected;
  connectSpan.textContent = connected ? "Connected ✅" : "Connect Wallet";
}

// Sahifa yuklanganda tekshirish
document.addEventListener("DOMContentLoaded", checkWalletConnection);
</script>