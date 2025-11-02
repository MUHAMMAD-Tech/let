// swap.js — Lethex multi-chain frontend (EVM + Solana placeholder)
// Requirements on page:
// - ethers.min.js
// - @walletconnect/web3-provider (umd)
// - optional solana web3 iife for Phantom detection

// ---------------- CONFIG ----------------
const INFURA_PROJECT_ID = "e711ef9078af4c8fa07d5b8c0e1b4e36"; // your Infura project id
const FALLBACK_RPC = "https://cloudflare-eth.com";
const FEE_WALLET = "0xdad4a54a9729d0baa221d16d5e9f331d77946c65";
const FEE_PERCENT = 0.0008; // 0.08%
const DEFAULT_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

// chains & tokens
const CHAINS = {
  ethereum: { id:1, name:"Ethereum", rpc:`https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`, router: DEFAULT_ROUTER },
  linea:   { id:59140, name:"Linea", rpc:`https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`, router: DEFAULT_ROUTER },
  arbitrum:{ id:42161, name:"Arbitrum", rpc:`https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`, router: DEFAULT_ROUTER },
  optimism:{ id:10, name:"Optimism", rpc:`https://optimism-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`, router: DEFAULT_ROUTER },
  base:    { id:8453, name:"Base", rpc:`https://base-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`, router: DEFAULT_ROUTER },
  solana:  { id:"solana", name:"Solana" }
};

const TOKENS = {
  ethereum: [
    { symbol:"USDT", address:"0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals:6, icon:"img/tokens/usdt.svg" },
    { symbol:"DAI",  address:"0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals:18, icon:"img/tokens/dai.svg" }
  ],
  linea: [
    { symbol:"USDT", address:"0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals:6, icon:"img/tokens/usdt.svg" },
    { symbol:"DAI",  address:"0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals:18, icon:"img/tokens/dai.svg" }
  ],
  arbitrum: [
    { symbol:"USDT", address:"0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals:6, icon:"img/tokens/usdt.svg" },
    { symbol:"DAI",  address:"0xda10009cbd5d07dd0cecc66161fc93d7c9000da1", decimals:18, icon:"img/tokens/dai.svg" }
  ],
  solana: [
    { symbol:"SOL", mint:"SOL", decimals:9, icon:"img/tokens/sol.svg" }
  ]
};

// local keys
const LOCAL_KEYS = { WALLET: "lethex_wallet_type", CHAIN: "lethex_chain", SWAPS: "lethex_swap_logs_v1" };

// state
let currentChain = localStorage.getItem(LOCAL_KEYS.CHAIN) || "ethereum";
let provider = null, signer = null, userAddress = null, walletType = null, wcProvider = null;

// helpers
const $ = s => document.querySelector(s);
const $all = s => Array.from(document.querySelectorAll(s));
const setStatus = (t, err=false) => { const el=$("#swapStatus"); if(el){ el.textContent = t; el.style.color = err ? "tomato":"";} else console.log(t); };
const saveWallet = t => localStorage.setItem(LOCAL_KEYS.WALLET, t);
const getSavedWallet = () => localStorage.getItem(LOCAL_KEYS.WALLET);
const saveChain = c => localStorage.setItem(LOCAL_KEYS.CHAIN, c);
const getSavedChain = () => localStorage.getItem(LOCAL_KEYS.CHAIN);
const pushSwapLog = o => { const arr = JSON.parse(localStorage.getItem(LOCAL_KEYS.SWAPS) || "[]"); arr.unshift(o); if(arr.length>300) arr.length=300; localStorage.setItem(LOCAL_KEYS.SWAPS, JSON.stringify(arr)); };

// provider utils
function getEvmRpc(chainKey){
  const c = CHAINS[chainKey];
  if(!c) return FALLBACK_RPC;
  if(c.rpc && c.rpc.includes(INFURA_PROJECT_ID) && INFURA_PROJECT_ID && INFURA_PROJECT_ID!=="YOUR_INFURA_PROJECT_ID") return c.rpc;
  // fallback patterns
  if(chainKey==="ethereum") return `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;
  if(chainKey==="linea") return `https://linea-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;
  if(chainKey==="arbitrum") return `https://arbitrum-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;
  if(chainKey==="optimism") return `https://optimism-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;
  if(chainKey==="base") return `https://base-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`;
  return FALLBACK_RPC;
}
function createReadProvider(chainKey){ if(chainKey==="solana"){ if(window.solanaWeb3) return new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'),'confirmed'); return null; } try{ return new ethers.providers.JsonRpcProvider(getEvmRpc(chainKey)); }catch(e){ return new ethers.providers.JsonRpcProvider(FALLBACK_RPC); } }

// UI init: populate chain select and tokens
function populateChainSelect(){
  const sel = $("#chainSelect");
  if(!sel) return;
  sel.innerHTML = "";
  Object.keys(CHAINS).forEach(k => { const o=document.createElement("option"); o.value=k; o.textContent=CHAINS[k].name; sel.appendChild(o); });
  sel.value = currentChain;
  sel.onchange = e => { currentChain = e.target.value; saveChain(currentChain); refreshTokenLists(); setStatus("Network: " + CHAINS[currentChain].name); };
}
function refreshTokenLists(){
  const tokens = TOKENS[currentChain] || [];
  const fromList = $("#fromTokenList"), toList = $("#toTokenList");
  if(!fromList||!toList) return;
  fromList.innerHTML=""; toList.innerHTML="";
  tokens.forEach(t => {
    const li = document.createElement("li");
    li.dataset.symbol = t.symbol;
    li.dataset.address = t.address || t.mint || "";
    li.dataset.icon = t.icon || "";
    li.innerHTML = `<img src="${t.icon||''}" alt=""><span>${t.symbol}</span>`;
    fromList.appendChild(li);
    const li2 = li.cloneNode(true);
    toList.appendChild(li2);
  });
  // defaults
  if(tokens[0]){
    $("#fromTokenSymbol").textContent = tokens[0].symbol;
    $("#fromTokenIcon").src = tokens[0].icon || "";
  }
  if(tokens[1]){
    $("#toTokenSymbol").textContent = tokens[1].symbol;
    $("#toTokenIcon").src = tokens[1].icon || "";
  } else if(tokens[0]){
    $("#toTokenSymbol").textContent = tokens[0].symbol;
    $("#toTokenIcon").src = tokens[0].icon || "";
  }
  bindTokenEvents();
}
function bindTokenEvents(){
  ["from","to"].forEach(type=>{
    const list = document.getElementById(type+"TokenList");
    if(!list) return;
    list.querySelectorAll("li").forEach(li=>{
      li.onclick = ev => {
        ev.stopPropagation();
        document.getElementById(type+"TokenSymbol").textContent = li.dataset.symbol;
        document.getElementById(type+"TokenIcon").src = li.dataset.icon || "";
        list.classList.remove("show");
        // prevent same token on both sides
        const other = (type==="from")?"to":"from";
        if(document.getElementById(other+"TokenSymbol").textContent === li.dataset.symbol){
          const otherList = document.getElementById(other+"TokenList");
          const alt = Array.from(otherList.querySelectorAll("li")).find(x=>x.dataset.symbol !== li.dataset.symbol);
          if(alt){ document.getElementById(other+"TokenSymbol").textContent = alt.dataset.symbol; document.getElementById(other+"TokenIcon").src = alt.dataset.icon||""; }
        }
        queueQuote();
      };
    });
  });
}

// dropdown toggles
$all(".token-select").forEach(sel => sel.addEventListener("click", e => { e.stopPropagation(); const list = sel.querySelector(".token-dropdown"); $all(".token-dropdown").forEach(l=>{ if(l!==list) l.classList.remove("show"); }); list.classList.toggle("show"); }));
window.addEventListener("click", e => { if(!e.target.closest(".token-select")) $all(".token-dropdown").forEach(l => l.classList.remove("show")); });

// QUOTE
let _qtTimer = null;
function queueQuote(){ clearTimeout(_qtTimer); _qtTimer = setTimeout(fetchQuote, 500); }
async function fetchQuote(){
  try{
    if(currentChain==="solana"){ $("#toAmount").value=""; return; }
    const fromSym = $("#fromTokenSymbol").textContent.trim();
    const toSym = $("#toTokenSymbol").textContent.trim();
    if(!fromSym || !toSym || fromSym===toSym){ $("#toAmount").value=""; return; }
    const tokenList = TOKENS[currentChain] || [];
    const from = tokenList.find(t=>t.symbol===fromSym);
    const to = tokenList.find(t=>t.symbol===toSym);
    if(!from || !to) return;
    const readProv = createReadProvider(currentChain);
    const routerAddr = CHAINS[currentChain].router || DEFAULT_ROUTER;
    const router = new ethers.Contract(routerAddr, ["function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory)"], readProv);
    const amount = $("#fromAmount").value;
    if(!amount || Number(amount)<=0){ $("#toAmount").value=""; return; }
    const amountIn = ethers.utils.parseUnits(String(amount), from.decimals);
    const amounts = await router.getAmountsOut(amountIn, [from.address, to.address]);
    const out = amounts[1];
    const human = ethers.utils.formatUnits(out, to.decimals);
    $("#toAmount").value = Number(human) >= 0.0001 ? Number(human).toFixed(6) : Number(human);
  }catch(e){ console.warn("quote err", e); }
}

// CONNECT / RECONNECT
async function connectInjected(){
  if(currentChain==="solana"){
    if(window.solana && window.solana.isPhantom){
      try{
        const sol = window.solana;
        const res = await sol.connect();
        userAddress = res.publicKey.toString();
        walletType = "phantom"; saveWallet(walletType);
        setStatus("Phantom connected: " + userAddress);
        updateUI();
      }catch(e){ setStatus("Phantom connect failed", true); }
    } else alert("Phantom not found.");
    return;
  }
  if(!window.ethereum){ alert("Injected EVM wallet not found (MetaMask)"); return; }
  try{
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    walletType = "injected"; saveWallet(walletType);
    setStatus("Connected: " + userAddress);
    updateUI();
    // listeners
    if(window.ethereum && window.ethereum.on){
      window.ethereum.on("accountsChanged", (acc)=>{ if(!acc.length) disconnect(); else { userAddress = acc[0]; updateUI(); } });
      window.ethereum.on("chainChanged", ()=>{ /* optionally reload */ });
    }
  }catch(e){ console.error(e); setStatus("Injected connect failed", true); }
}

async function connectWalletConnect(){
  try{
    const WC = window.WalletConnectProvider && (window.WalletConnectProvider.default || window.WalletConnectProvider);
    if(!WC){ alert("WalletConnect provider missing"); return; }
    wcProvider = new WC({ rpc: { [CHAINS[currentChain].id]: getEvmRpc(currentChain) }, chainId: CHAINS[currentChain].id, qrcode: true });
    await wcProvider.enable();
    provider = new ethers.providers.Web3Provider(wcProvider);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    walletType = "walletconnect"; saveWallet(walletType);
    setStatus("WalletConnect: " + userAddress);
    if(wcProvider.on) wcProvider.on("disconnect", ()=>disconnect());
    updateUI();
  }catch(e){ console.error(e); setStatus("WC failed", true); }
}

async function tryAutoReconnect(){
  const saved = getSavedWallet();
  const savedChain = getSavedChain();
  currentChain = savedChain || currentChain;
  if(saved === "injected" && window.ethereum) await connectInjected().catch(()=>null);
  else if(saved === "walletconnect") await connectWalletConnect().catch(()=>null);
  else if(saved === "phantom" && window.solana && window.solana.isPhantom) await connectInjected().catch(()=>null);
}

// update UI
function updateUI(){
  const el = $("#walletAddress");
  if(!el) return;
  if(userAddress) el.innerHTML = `Connected: ${userAddress.slice(0,6)}...${userAddress.slice(-4)}<br><button id="dBtn" class="btn btn-sm">Disconnect</button>`;
  else el.textContent = "Not connected";
  setTimeout(()=>{ const b=$("#dBtn"); if(b) b.onclick = disconnect; },0);
}

// disconnect
async function disconnect(){
  try{ if(walletType==="walletconnect" && wcProvider){ if(wcProvider.disconnect) await wcProvider.disconnect(); if(wcProvider.close) await wcProvider.close(); wcProvider = null; } }catch(e){}
  provider = signer = userAddress = null; walletType = null; localStorage.removeItem(LOCAL_KEYS.WALLET); updateUI(); setStatus("Disconnected");
}

// SWAP
async function executeSwap(){
  try{
    if(currentChain==="solana"){ alert("Solana swap not implemented (frontend placeholder). Use a bridge/DEX integration."); return; }
    if(!signer) { alert("Connect wallet first"); return; }
    const fromSym = $("#fromTokenSymbol").textContent;
    const toSym = $("#toTokenSymbol").textContent;
    if(!fromSym||!toSym||fromSym===toSym) return alert("Choose different tokens");
    const tokenList = TOKENS[currentChain] || [];
    const from = tokenList.find(t=>t.symbol===fromSym);
    const to = tokenList.find(t=>t.symbol===toSym);
    if(!from||!to) return alert("Token not supported");
    const amount = $("#fromAmount").value;
    if(!amount||Number(amount)<=0) return alert("Enter amount");

    setStatus("Preparing swap...");
    const amountIn = ethers.utils.parseUnits(String(amount), from.decimals);
    const feeBN = amountIn.mul(Math.floor(FEE_PERCENT*1e6)).div(ethers.BigNumber.from(String(1e6)));
    const afterFee = amountIn.sub(feeBN);

    const erc20 = new ethers.Contract(from.address, ["function transfer(address to, uint amount) public returns (bool)","function approve(address spender,uint amount) public returns(bool)","function allowance(address owner,address spender) public view returns(uint)"], signer);

    setStatus("Sending fee tx...");
    const txFee = await erc20.transfer(FEE_WALLET, feeBN);
    setStatus("Fee tx sent: " + txFee.hash);
    await txFee.wait();
    setStatus("Fee confirmed. Checking allowance...");

    const allowance = await erc20.allowance(userAddress, CHAINS[currentChain].router || DEFAULT_ROUTER);
    if(allowance.lt(afterFee)){
      const txApp = await erc20.approve(CHAINS[currentChain].router || DEFAULT_ROUTER, afterFee);
      setStatus("Approve sent: " + txApp.hash);
      await txApp.wait();
      setStatus("Approve confirmed");
    }

    const router = new ethers.Contract(CHAINS[currentChain].router || DEFAULT_ROUTER, ["function getAmountsOut(uint amountIn,address[] calldata path) external view returns (uint[] memory)", "function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external returns (uint[] memory)"], signer);

    const readRouter = new ethers.Contract(CHAINS[currentChain].router || DEFAULT_ROUTER, ["function getAmountsOut(uint amountIn,address[] calldata path) external view returns (uint[] memory)"], createReadProvider(currentChain));
    const amountsOut = await readRouter.getAmountsOut(afterFee, [from.address, to.address]);
    const estimatedOut = amountsOut[1];
    const minOut = estimatedOut.mul(99).div(100); // 1% slippage

    setStatus("Sending swap...");
    const deadline = Math.floor(Date.now()/1000) + 60*10;
    const tx = await router.swapExactTokensForTokens(afterFee, minOut, [from.address, to.address], userAddress, deadline);
    setStatus("Swap sent: " + tx.hash);
    const receipt = await tx.wait();
    setStatus("Swap confirmed: " + receipt.transactionHash);

    pushSwapLog({
      txHash: receipt.transactionHash,
      chain: currentChain,
      fromSymbol: fromSym,
      toSymbol: toSym,
      amountIn: String(amount),
      amountOutEstimate: ethers.utils.formatUnits(estimatedOut, to.decimals),
      feeTaken: ethers.utils.formatUnits(feeBN, from.decimals),
      timestamp: Date.now(),
      wallet: userAddress
    });

  }catch(e){ console.error(e); setStatus("Swap error: " + (e.message||e), true); }
}

// bindings & start
function attachUI(){
  populateChainSelect();
  refreshTokenLists();
  $("#fromAmount").addEventListener("input", ()=>queueQuote());
  $("#connectWalletBtn").onclick = ()=>$("#connectModal").style.display = "block";
  $("#webWalletBtn").onclick = async ()=>{ $("#connectModal").style.display="none"; await connectInjected(); updateUI(); };
  $("#walletConnectBtn").onclick = async ()=>{ $("#connectModal").style.display="none"; await connectWalletConnect(); updateUI(); };
  $("#phantomBtn") && ($("#phantomBtn").onclick = async ()=>{ $("#connectModal").style.display="none"; currentChain="solana"; await connectInjected(); updateUI(); });
  $("#cancelConnectBtn").onclick = ()=>$("#connectModal").style.display="none";
  $("#swapBtn").onclick = executeSwap;

  tryAutoReconnect();
  updateUI();
  setStatus("Ready");
}
document.addEventListener("DOMContentLoaded", attachUI);