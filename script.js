document.addEventListener("DOMContentLoaded", async function() {
  "use strict";

  // =======================
  // Cursor Animation
  // =======================
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

  // =======================
  // Navigation (Burger Menu)
  // =======================
  const body = document.body;
  const menu = document.querySelector(".menu-icon");
  if (menu) {
    menu.addEventListener("click", () => body.classList.toggle("nav-active"));
  }

  // =======================
  // Light / Dark Switch + SVG theme
  // =======================
  const switchEl = document.getElementById("switch");
  const svgEl = document.querySelector(".curen_color");

  function updateSvgTheme() {
    if (!svgEl) return;
    svgEl.style.color = body.classList.contains("light") ? "#000" : "#fff";
  }

  // Sahifa yuklanganda theme
  if (localStorage.getItem("theme") === "light") {
    body.classList.add("light");
    if (switchEl) switchEl.classList.add("switched");
  }
  updateSvgTheme();

  if (switchEl) {
    switchEl.addEventListener("click", () => {
      body.classList.toggle("light");
      switchEl.classList.toggle("switched");
      localStorage.setItem("theme", body.classList.contains("light") ? "light" : "dark");
      updateSvgTheme();
      generateSwapSection(); // Theme o‘zgarganda form ham generatsiya bo‘lsin
    });
  }

  // =======================
  // Swap Form generation (agar light theme)
  // =======================
  const swapContainer = document.querySelector(".swap-section .container");
  function generateSwapSection() {
    if (!swapContainer) return;
    swapContainer.innerHTML = ""; // avvalgi kontentni tozalash

    if (body.classList.contains("light")) {
      swapContainer.innerHTML = `
        <h2 class="mb-4">Swap Tokens</h2>
        <div class="swap-box">
          <div class="form-group">
            <label for="fromTokenSelect">From Token</label>
            <select id="fromTokenSelect" class="form-control"></select>
          </div>
          <div class="form-group">
            <label for="toTokenSelect">To Token</label>
            <select id="toTokenSelect" class="form-control"></select>
          </div>
          <div class="form-group">
            <label for="swapAmount">Amount</label>
            <input type="number" id="swapAmount" class="form-control" placeholder="Enter amount">
          </div>
          <button id="connectWalletBtn" class="btn btn-primary mt-2">Connect Wallet</button>
          <div id="walletAddress" class="mt-2 mb-2"></div>
          <button id="swapBtn" class="btn btn-success">Swap</button>
          <div id="swapStatus" class="mt-2"></div>
        </div>
      `;
      initDEX(); // Swap funksiyasini qayta ishga tushirish
    }
  }

  generateSwapSection();

  // =======================
  // DEX + WalletConnect V2
  // =======================
  async function initDEX() {
    const connectBtn = document.getElementById("connectWalletBtn");
    const walletAddrEl = document.getElementById("walletAddress");
    const fromSelect = document.getElementById("fromTokenSelect");
    const toSelect = document.getElementById("toTokenSelect");
    const amountInput = document.getElementById("swapAmount");
    const swapBtn = document.getElementById("swapBtn");
    const statusEl = document.getElementById("swapStatus");

    if (!connectBtn) return;

    const setStatus = txt => {
      if (statusEl) statusEl.innerText = txt;
      console.log("[DEX STATUS]", txt);
    };

    let web3Modal, provider, selectedAccount;

    const providerOptions = {
      walletconnect: {
        package: window.WalletConnectProvider,
        options: {
          projectId: "f76f0bcabf40fadb066240a1c96eff76",
          chains: [1, 56],
          showQrModal: true
        }
      }
    };

    web3Modal = new window.Web3Modal.default({
      cacheProvider: false,
      providerOptions
    });

    connectBtn.addEventListener("click", async () => {
      try {
        setStatus("Connecting wallet...");
        provider = await web3Modal.connect();
        const ethersProvider = new ethers.providers.Web3Provider(provider);
        const accounts = await ethersProvider.listAccounts();
        selectedAccount = accounts[0];
        if (!selectedAccount) return setStatus("No accounts found");
        if (walletAddrEl) walletAddrEl.innerText = `Connected: ${selectedAccount.substring(0,6)}...${selectedAccount.slice(-4)}`;
        window.userAccount = selectedAccount;
        setStatus("Wallet connected");
      } catch (err) {
        console.error("Wallet connect failed", err);
        setStatus("Connection failed");
      }
    });

    // Fetch tokens va selectga joylash
    async function fetchTokens() {
      try {
        setStatus("Loading tokens...");
        const res = await fetch("https://api.1inch.io/v5.0/1/tokens");
        const data = await res.json();
        const tokens = Object.values(data.tokens || {}).slice(0, 200);
        [fromSelect, toSelect].forEach(sel => {
          if (!sel) return;
          sel.innerHTML = '<option value="">Select token</option>';
          tokens.forEach(t => {
            const opt = document.createElement("option");
            opt.value = JSON.stringify(t);
            opt.text = `${t.symbol} — ${t.name}`;
            sel.appendChild(opt);
          });
        });
        setStatus("Tokens loaded");
      } catch (err) {
        console.error("Token load failed", err);
        setStatus("Failed to load tokens");
      }
    }

    fetchTokens();

    // Swap funksiyasi
    if (swapBtn) {
      swapBtn.addEventListener("click", async () => {
        try {
          if (!fromSelect || !toSelect || !amountInput) return;
          const fromToken = JSON.parse(fromSelect.value);
          const toToken = JSON.parse(toSelect.value);
          const amount = amountInput.value;
          const userAccount = window.userAccount;
          if (!fromToken || !toToken || !amount) return alert("Please fill all fields");
          if (!userAccount) return alert("Connect wallet first");

          setStatus("Preparing swap...");
          const ethersProvider = new ethers.providers.Web3Provider(provider);
          const signer = ethersProvider.getSigner();
          const amountInWei = ethers.utils.parseUnits(amount, fromToken.decimals).toString();

          const url = `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${fromToken.address}&toTokenAddress=${toToken.address}&amount=${amountInWei}&fromAddress=${userAccount}&slippage=1`;
          const resp = await fetch(url);
          const data = await resp.json();
          if (!data.tx) throw new Error("No transaction returned");

          setStatus("Confirm transaction in wallet...");
          const txResponse = await signer.sendTransaction(data.tx);
          await txResponse.wait();

          setStatus("✅ Swap completed");
          alert("Swap successful!");
        } catch (err) {
          console.error("Swap failed", err);
          setStatus("❌ Swap failed — check console");
        }
      });
    }
  }

});