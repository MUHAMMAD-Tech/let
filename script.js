(function ($) {
    "use strict";

    // Page cursors
    document.getElementsByTagName("body")[0].addEventListener("mousemove", function (n) {
        t.style.left = n.clientX + "px",
        t.style.top = n.clientY + "px",
        e.style.left = n.clientX + "px",
        e.style.top = n.clientY + "px",
        i.style.left = n.clientX + "px",
        i.style.top = n.clientY + "px"
    });
    var t = document.getElementById("cursor"),
        e = document.getElementById("cursor2"),
        i = document.getElementById("cursor3");

    function n(t) {
        e.classList.add("hover"), i.classList.add("hover")
    }

    function s(t) {
        e.classList.remove("hover"), i.classList.remove("hover")
    }
    s();
    for (var r = document.querySelectorAll(".hover-target"), a = r.length - 1; a >= 0; a--) {
        o(r[a])
    }

    function o(t) {
        t.addEventListener("mouseover", n), t.addEventListener("mouseout", s)
    }

    // Navigation
    var app = function () {
        var body = undefined;
        var menu = undefined;
        var menuItems = undefined;
        var init = function init() {
            body = document.querySelector('body');
            menu = document.querySelector('.menu-icon');
            menuItems = document.querySelectorAll('.nav__list-item');
            applyListeners();
        };
        var applyListeners = function applyListeners() {
            menu.addEventListener('click', function () {
                return toggleClass(body, 'nav-active');
            });
        };
        var toggleClass = function toggleClass(element, stringClass) {
            if (element.classList.contains(stringClass)) element.classList.remove(stringClass); else element.classList.add(stringClass);
        };
        init();
    }();

    // Switch light/dark
    if (localStorage.getItem("theme") === "light") {
        $("body").addClass("light");
        $("#switch").addClass("switched");
    }

    $("#switch").on('click', function () {
        if ($("body").hasClass("light")) {
            $("body").removeClass("light");
            $("#switch").removeClass("switched");
            localStorage.setItem("theme", "dark");
        }
        else {
            $("body").addClass("light");
            $("#switch").addClass("switched");
            localStorage.setItem("theme", "light");
        }
    });

})(jQuery);

//$(document).ready(function() {
//$('a').on('click', function(event) {
       // event.preventDefault(); // Standart havola harakatini to'xtatish
     //   var link = $(this).attr('href');
        
        // Sahifani sekin so'ndirish (fade out)
      //  $('body').fadeOut(2000, function() { // 3 soniya davomida fadeOut animatsiyasi
         //   window.location = link; // Havolaga o'tish
    //    });
  //  });
//});


 // elementlarni olish
  const letai = document.querySelector('.letai');
  const curenColor = document.querySelector('.curen_color');

  let lastColorIsBlack = false;

  setInterval(() => {
    const letaiColor = getComputedStyle(letai).color;
    const isBlack = letaiColor === 'rgb(31, 32, 41)';

    if (isBlack && !lastColorIsBlack) {
      curenColor.style.color = 'rgb(31, 32, 41)';
      curenColor.style.transform = 'scale(1.1)';

      setTimeout(() => {
        curenColor.style.transform = 'scale(1)';
      }, 200); // qisqa scale effekti
    } else if (!isBlack) {
      curenColor.style.color = '#fff';
      curenColor.style.transform = 'scale(1)';
    }

    lastColorIsBlack = isBlack;
  }, );







