// script.js - Ishonchli versiya

console.log("Script loaded successfully");

// Asosiy funktsiyani ishga tushirish
function initApp() {
    console.log("initApp function started");
    
    const body = document.body;
    console.log("Body element:", body);

    // Menu elementini qidirish
    const menu = document.querySelector(".menu-icon");
    console.log("Menu element found:", menu);

    // Agar menu topilsa, event qo'shamiz
    if (menu) {
        console.log("Adding click event to menu");
        
        menu.addEventListener("click", function(e) {
            console.log("Menu clicked!");
            body.classList.toggle("nav-active");
            console.log("nav-active class toggled. Current state:", body.classList.contains("nav-active"));
            e.preventDefault();
        });

        // Touch event ham qo'shamiz
        menu.addEventListener("touchstart", function(e) {
            console.log("Menu touched!");
            body.classList.toggle("nav-active");
            e.preventDefault();
        });
    } else {
        console.log("Menu element not found with .menu-icon selector");
        
        // Barcha elementlarni ko'rib chiqamiz
        const allElements = document.querySelectorAll('*');
        console.log("All elements count:", allElements.length);
        
        // ID orqali qidirish
        const menuById = document.getElementById("menu");
        console.log("Menu by ID:", menuById);
    }

    // Event delegation - ikkinchi zaxira usuli
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('menu-icon') || 
            e.target.closest('.menu-icon') || 
            e.target.id === 'menu') {
            console.log("Menu clicked via delegation");
            body.classList.toggle('nav-active');
            e.preventDefault();
        }
    });

    // Theme switcher
    const switchEl = document.getElementById("switch");
    if (switchEl) {
        console.log("Switch element found");
        switchEl.addEventListener("click", function() {
            body.classList.toggle("light");
            console.log("Theme toggled to:", body.classList.contains("light") ? "light" : "dark");
        });
    }
}

// DOM ready bo'lganda ishga tushirish
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOMContentLoaded event fired");
        initApp();
    });
} else {
    console.log("DOM already ready, initializing immediately");
    initApp();
}

// Window load event
window.addEventListener('load', function() {
    console.log("Window loaded completely");
    // Qayta ishga tushirish kerak bo'lsa
});

// 3 soniyadan keyin ham tekshiramiz (DOM o'zgarishi mumkin)
setTimeout(function() {
    console.log("3 second timeout check");
    const menu = document.querySelector(".menu-icon");
    if (menu && !menu.hasAttribute('data-listener-added')) {
        console.log("Adding listener via timeout");
        menu.setAttribute('data-listener-added', 'true');
        menu.addEventListener("click", function() {
            document.body.classList.toggle("nav-active");
        });
    }
}, 3000);