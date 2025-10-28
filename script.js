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






//  DEX



document.getElementById('connectWalletBtn').addEventListener('click', async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      document.getElementById('walletAddress').innerText = `Connected: ${account.substring(0,6)}...${account.slice(-4)}`;
      window.userAccount = account; // global account
      console.log("Wallet connected:", account);
    } catch (err) {
      console.error("Connection error:", err);
    }
  } else {
    alert("Please install MetaMask!");
  }
});



// Fetch top 200 tokens from 1inch
async function fetchTokens() {
  try {
    const response = await fetch("https://api.1inch.io/v5.0/1/tokens");
    const data = await response.json();
    const tokens = Object.values(data.tokens).slice(0, 200);

    const fromSelect = document.getElementById('fromTokenSelect');
    const toSelect = document.getElementById('toTokenSelect');

    tokens.forEach(token => {
      const optionFrom = document.createElement('option');
      optionFrom.value = JSON.stringify(token);
      optionFrom.text = token.symbol;
      fromSelect.appendChild(optionFrom);

      const optionTo = document.createElement('option');
      optionTo.value = JSON.stringify(token);
      optionTo.text = token.symbol;
      toSelect.appendChild(optionTo);
    });
  } catch (err) {
    console.error("Token fetch error:", err);
  }
}

fetchTokens();

// Swap function
document.getElementById('swapBtn').addEventListener('click', async () => {
  const fromToken = JSON.parse(document.getElementById('fromTokenSelect').value);
  const toToken = JSON.parse(document.getElementById('toTokenSelect').value);
  const amount = document.getElementById('swapAmount').value;
  const userAccount = window.userAccount;

  if (!fromToken || !toToken || !amount || !userAccount) {
    alert("Please fill all fields and connect wallet");
    return;
  }

  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();

  const url = `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${fromToken.address}&toTokenAddress=${toToken.address}&amount=${ethers.utils.parseUnits(amount, fromToken.decimals).toString()}&fromAddress=${userAccount}&slippage=1`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const tx = await signer.sendTransaction(data.tx);
    await tx.wait();
    alert("Swap completed!");
  } catch (err) {
    console.error("Swap error:", err);
    alert("Swap failed. See console for details.");
  }
});



