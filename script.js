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



// script.js (to'liq xavfsiz versiya)

document.addEventListener('DOMContentLoaded', function () {
  // Elementlar
  const connectBtn = document.getElementById('connectWalletBtn');
  const walletAddrEl = document.getElementById('walletAddress');
  const fromSelect = document.getElementById('fromTokenSelect');
  const toSelect = document.getElementById('toTokenSelect');
  const amountInput = document.getElementById('swapAmount');
  const swapBtn = document.getElementById('swapBtn');
  const statusEl = document.getElementById('swapStatus');

  // Quick guards
  if (!connectBtn || !walletAddrEl || !fromSelect || !toSelect || !amountInput || !swapBtn || !statusEl) {
    console.error('DEX elements missing in DOM. Check IDs in index.html and script.js');
    return;
  }

  // Status helper
  const setStatus = (txt) => {
    statusEl.innerText = txt;
    console.log('[DEX STATUS]', txt);
  };

  // ====== Wallet modal init ======
  let web3Modal;
  let provider;
  let selectedAccount;

  async function initWallet() {
    const providerOptions = {
      walletconnect: {
        package: window.WalletConnectProvider?.default || window.WalletConnectProvider,
        options: {
          rpc: {
            1: "https://rpc.ankr.com/eth",
            56: "https://bsc-dataseed.binance.org/"
          }
        }
      }
    };

    web3Modal = new window.Web3Modal?.default?.({
      cacheProvider: false,
      providerOptions
    });

    if (!web3Modal) {
      console.warn('Web3Modal not available. WalletConnect / Web3Modal failed to load.');
    }
  }

  initWallet();

  async function connectWallet() {
    try {
      setStatus('Connecting wallet...');
      provider = await web3Modal.connect();
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const accounts = await ethersProvider.listAccounts();
      selectedAccount = accounts && accounts[0];

      if (!selectedAccount) {
        setStatus('No accounts found. Please unlock your wallet.');
        return;
      }

      walletAddrEl.innerText = `Connected: ${selectedAccount.substring(0,6)}...${selectedAccount.slice(-4)}`;
      window.userAccount = selectedAccount;
      setStatus('Wallet connected');
    } catch (err) {
      console.error('connectWallet error:', err);
      setStatus('Wallet connection failed');
      alert('Wallet connection failed. See console for details.');
    }
  }

  connectBtn.addEventListener('click', connectWallet);

  // ====== Tokens fetch ======
  async function fetchTokens() {
    try {
      setStatus('Loading token list...');
      const res = await fetch("https://api.1inch.io/v5.0/1/tokens");
      if (!res.ok) throw new Error('Tokens API error: ' + res.status);
      const data = await res.json();
      const tokens = Object.values(data.tokens || {}).slice(0, 200);

      // Clear selects
      fromSelect.innerHTML = '';
      toSelect.innerHTML = '';

      const placeholder1 = document.createElement('option');
      placeholder1.value = '';
      placeholder1.text = 'Select token';
      fromSelect.appendChild(placeholder1);

      const placeholder2 = document.createElement('option');
      placeholder2.value = '';
      placeholder2.text = 'Select token';
      toSelect.appendChild(placeholder2);

      tokens.forEach(t => {
        const opt1 = document.createElement('option');
        opt1.value = JSON.stringify(t);
        opt1.text = `${t.symbol} — ${t.name}`;
        fromSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = JSON.stringify(t);
        opt2.text = `${t.symbol} — ${t.name}`;
        toSelect.appendChild(opt2);
      });

      setStatus('Tokens loaded');
    } catch (err) {
      console.error('fetchTokens error:', err);
      setStatus('Failed to load tokens');
      fromSelect.innerHTML = '<option value="">Token load error</option>';
      toSelect.innerHTML = '<option value="">Token load error</option>';
    }
  }

  fetchTokens();

  // ====== Swap ======
  swapBtn.addEventListener('click', async () => {
    try {
      const fromVal = fromSelect.value;
      const toVal = toSelect.value;
      const amount = amountInput.value;
      const userAccount = window.userAccount || selectedAccount;

      if (!fromVal || !toVal) { alert('Please choose both tokens'); return; }
      if (!amount || Number(amount) <= 0) { alert('Enter valid amount'); return; }
      if (!userAccount) { alert('Connect wallet first'); return; }

      const fromToken = JSON.parse(fromVal);
      const toToken = JSON.parse(toVal);

      setStatus('Preparing swap...');

      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const signer = ethersProvider.getSigner();

      // convert amount to token decimals
      const amountInWei = ethers.utils.parseUnits(String(amount), fromToken.decimals).toString();

      const url = `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${fromToken.address}&toTokenAddress=${toToken.address}&amount=${amountInWei}&fromAddress=${userAccount}&slippage=1`;
      setStatus('Requesting swap quote...');

      const resp = await fetch(url);
      if (!resp.ok) throw new Error('1inch swap API error: ' + resp.status);
      const data = await resp.json();

      if (!data.tx) {
        console.error('1inch response:', data);
        throw new Error('Swap API did not return transaction. See console.');
      }

      setStatus('Waiting for user to confirm transaction in wallet...');
      const txResponse = await signer.sendTransaction(data.tx);
      setStatus('Transaction sent. Waiting for confirmation...');
      await txResponse.wait();

      setStatus('✅ Swap completed');
      alert('Swap completed successfully');
    } catch (err) {
      console.error('Swap failed:', err);
      setStatus('Swap failed — see console');
      alert('Swap failed. Open console for details.');
    }
  });

  // Optional: auto reconnect if provider cached
  // window.addEventListener("beforeunload", () => { if(provider?.disconnect) provider.disconnect(); });
});
  
  



