// =======================
// LETAI FRONT CORE JS + WalletConnect V2
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
// DEX (SWAP) SECTION with WalletConnect V2
// =======================
document.addEventListener('DOMContentLoaded', async function () {
  const connectBtn = document.getElementById('connectWalletBtn');
  const walletAddrEl = document.getElementById('walletAddress');
  const fromSelect = document.getElementById('fromTokenSelect');
  const toSelect = document.getElementById('toTokenSelect');
  const amountInput = document.getElementById('swapAmount');
  const swapBtn = document.getElementById('swapBtn');
  const statusEl = document.getElementById('swapStatus');

  if (!connectBtn) return;

  const setStatus = txt => { statusEl.innerText = txt; console.log('[DEX STATUS]', txt); };

  let web3Modal, provider, selectedAccount;

  // --- WalletConnect V2 Provider Options ---
  const providerOptions = {
    walletconnect: {
      package: window.WalletConnectEthereumProvider,
      options: {
        projectId: "f76f0bcabf40fadb066240a1c96eff76", // sizning Project ID
        chains: [1, 56], // Ethereum & BSC
        showQrModal: true
      }
    }
  };

  // Init Web3Modal
  web3Modal = new window.Web3Modal.default({
    cacheProvider: false,
    providerOptions
  });

  // Connect Wallet
  async function connectWallet() {
    try {
      setStatus('Connecting wallet...');
      provider = await web3Modal.connect();
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const accounts = await ethersProvider.listAccounts();
      selectedAccount = accounts[0];
      if (!selectedAccount) return setStatus('No accounts found');
      walletAddrEl.innerText = `Connected: ${selectedAccount.substring(0,6)}...${selectedAccount.slice(-4)}`;
      window.userAccount = selectedAccount;
      setStatus('Wallet connected');
    } catch (err) {
      console.error('Wallet connect failed', err);
      setStatus('Connection failed');
    }
  }

  connectBtn.addEventListener('click', connectWallet);

  // --- Fetch Tokens ---
  async function fetchTokens() {
    try {
      setStatus('Loading tokens...');
      const res = await fetch("https://api.1inch.io/v5.0/1/tokens");
      const data = await res.json();
      const tokens = Object.values(data.tokens || {}).slice(0, 200);
      [fromSelect, toSelect].forEach(sel => {
        sel.innerHTML = '<option value="">Select token</option>';
        tokens.forEach(t => {
          const opt = document.createElement('option');
          opt.value = JSON.stringify(t);
          opt.text = `${t.symbol} — ${t.name}`;
          sel.appendChild(opt);
        });
      });
      setStatus('Tokens loaded');
    } catch (err) {
      console.error('Token load failed', err);
      setStatus('Failed to load tokens');
    }
  }

  fetchTokens();

  // --- Swap Function ---
  swapBtn.addEventListener('click', async () => {
    try {
      const fromToken = JSON.parse(fromSelect.value);
      const toToken = JSON.parse(toSelect.value);
      const amount = amountInput.value;
      const userAccount = window.userAccount;
      if (!fromToken || !toToken || !amount) return alert('Please fill all fields');
      if (!userAccount) return alert('Connect wallet first');

      setStatus('Preparing swap...');
      const ethersProvider = new ethers.providers.Web3Provider(provider);
      const signer = ethersProvider.getSigner();
      const amountInWei = ethers.utils.parseUnits(amount, fromToken.decimals).toString();

      const url = `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${fromToken.address}&toTokenAddress=${toToken.address}&amount=${amountInWei}&fromAddress=${userAccount}&slippage=1`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (!data.tx) throw new Error('No transaction returned');
      setStatus('Confirm transaction in wallet...');
      const txResponse = await signer.sendTransaction(data.tx);
      await txResponse.wait();
      setStatus('✅ Swap completed');
      alert('Swap successful!');
    } catch (err) {
      console.error('Swap failed', err);
      setStatus('❌ Swap failed — check console');
    }
  });
});