// =======================
// LETAI FRONT CORE JS
// =======================
(function ($) {
  "use strict";

  // --- Cursor Animation ---
  const t = document.getElementById("cursor"),
        e = document.getElementById("cursor2"),
        i = document.getElementById("cursor3");

  if (t && e && i) {
    document.body.addEventListener("mousemove", (n) => {
      const { clientX, clientY } = n;
      [t, e, i].forEach((el) => {
        el.style.left = clientX + "px";
        el.style.top = clientY + "px";
      });
    });

    function hoverOn() { e.classList.add("hover"); i.classList.add("hover"); }
    function hoverOff() { e.classList.remove("hover"); i.classList.remove("hover"); }

    document.querySelectorAll(".hover-target").forEach((el) => {
      el.addEventListener("mouseover", hoverOn);
      el.addEventListener("mouseout", hoverOff);
    });
  }

  // --- Navigation (Burger Menu) ---
  const menu = document.querySelector('.menu-icon');
  const body = document.querySelector('body');
  if (menu) {
    menu.addEventListener('click', () => {
      body.classList.toggle('nav-active');
    });
  }

  // --- Light / Dark Switch ---
  if (localStorage.getItem("theme") === "light") {
    $("body").addClass("light");
    $("#switch").addClass("switched");
  }

  $("#switch").on('click', function () {
    $("body").toggleClass("light");
    $("#switch").toggleClass("switched");
    const theme = $("body").hasClass("light") ? "light" : "dark";
    localStorage.setItem("theme", theme);
  });

})(jQuery);

// =======================
// DEX (SWAP) SECTION
// =======================
document.addEventListener('DOMContentLoaded', function () {
  const connectBtn = document.getElementById('connectWalletBtn');
  const walletAddrEl = document.getElementById('walletAddress');
  const fromSelect = document.getElementById('fromTokenSelect');
  const toSelect = document.getElementById('toTokenSelect');
  const amountInput = document.getElementById('swapAmount');
  const swapBtn = document.getElementById('swapBtn');
  const statusEl = document.getElementById('swapStatus');

  if (!connectBtn) return; // If DEX section not on this page, skip

  const setStatus = (txt) => statusEl.innerText = txt;

  let web3Modal, provider, selectedAccount;

  async function initWallet() {
    const providerOptions = {
      walletconnect: {
        package: window.WalletConnectProvider?.default || window.WalletConnectProvider,
        options: {
          rpc: { 1: "https://rpc.ankr.com/eth", 56: "https://bsc-dataseed.binance.org/" }
        }
      }
    };

    web3Modal = new window.Web3Modal.default({ cacheProvider: false, providerOptions });
  }

  async function connectWallet() {
    try {
      setStatus('Connecting wallet...');
      provider = await web3Modal.connect();
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const accounts = await ethersProvider.listAccounts();
      selectedAccount = accounts[0];
      walletAddrEl.innerText = `Connected: ${selectedAccount.substring(0,6)}...${selectedAccount.slice(-4)}`;
      window.userAccount = selectedAccount;
      setStatus('Wallet connected');
    } catch (err) {
      console.error(err);
      setStatus('Wallet connection failed');
    }
  }

  connectBtn.addEventListener('click', connectWallet);
  initWallet();

  async function fetchTokens() {
    try {
      setStatus('Loading tokens...');
      const res = await fetch("https://api.1inch.io/v5.0/1/tokens");
      const data = await res.json();
      const tokens = Object.values(data.tokens).slice(0, 200);
      [fromSelect, toSelect].forEach(sel => {
        sel.innerHTML = '<option value="">Select token</option>';
        tokens.forEach(t => {
          const opt = document.createElement('option');
          opt.value = JSON.stringify(t);
          opt.text = `${t.symbol}`;
          sel.appendChild(opt);
        });
      });
      setStatus('Tokens loaded');
    } catch {
      setStatus('Token load failed');
    }
  }

  fetchTokens();

  swapBtn.addEventListener('click', async () => {
    try {
      const fromToken = JSON.parse(fromSelect.value);
      const toToken = JSON.parse(toSelect.value);
      const amount = amountInput.value;
      if (!fromToken || !toToken || !amount) return alert('Fill all fields');
      const userAccount = window.userAccount;
      if (!userAccount) return alert('Connect wallet first');

      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const signer = ethersProvider.getSigner();
      const amountInWei = ethers.utils.parseUnits(amount, fromToken.decimals).toString();

      const url = `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${fromToken.address}&toTokenAddress=${toToken.address}&amount=${amountInWei}&fromAddress=${userAccount}&slippage=1`;
      setStatus('Preparing swap...');
      const res = await fetch(url);
      const data = await res.json();
      const tx = await signer.sendTransaction(data.tx);
      await tx.wait();
      setStatus('✅ Swap complete!');
    } catch (err) {
      console.error('Swap failed', err);
      setStatus('❌ Swap failed');
    }
  });
});