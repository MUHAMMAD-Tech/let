// =============================================
// LETHEX Multi-Chain SWAP (safe demo version)
// =============================================

// ==== CONFIG ====
const INFURA_RPC = "https://cloudflare-eth.com";
const JUPITER_API = "https://quote-api.jup.ag/v6/quote";
const ONEINCH_API = "https://api.1inch.dev/swap/v5.2";
const ONEINCH_KEY = "demo-key"; // 1inch API key (demo uchun ishlamaydi, siznikini qo‘ying)
const FEE_PERCENT = 0.0008; // 0.08%

// ==== STATE ====
let walletType = null;
let provider = null;
let signer = null;
let solanaConn = null;
let userAddress = null;

// ==== UTILS ====
const $ = s => document.querySelector(s);
function formatNumber(x, d = 6) {
  return Number(x).toFixed(d);
}
function calcFee(amount) {
  const fee = amount * FEE_PERCENT;
  return { fee, afterFee: amount - fee };
}

// ==== CHAINS ====
const CHAINS = {
  ethereum: { id: 1, name: "Ethereum", rpc: INFURA_RPC },
  polygon: { id: 137, name: "Polygon", rpc: "https://polygon-rpc.com" },
  solana: { id: "solana", name: "Solana", rpc: "https://api.mainnet-beta.solana.com" },
};

// ==== TOKENS ====
const TOKENS = {
  ethereum: [
    { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
    { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
  ],
  solana: [
    { symbol: "SOL", mint: "So11111111111111111111111111111111111111112", decimals: 9 },
    { symbol: "USDC", mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6 },
  ],
};

// ==== CONNECT WALLETS ====
async function connectEVM() {
  if (!window.ethereum) return alert("MetaMask topilmadi");
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();
  walletType = "evm";
  $("#walletAddress").textContent = `Connected: ${userAddress}`;
}

async function connectSolana() {
  if (!window.solana || !window.solana.isPhantom) return alert("Phantom topilmadi");
  const res = await window.solana.connect();
  userAddress = res.publicKey.toString();
  solanaConn = new solanaWeb3.Connection(CHAINS.solana.rpc, "confirmed");
  walletType = "solana";
  $("#walletAddress").textContent = `Connected: ${userAddress}`;
}

// ==== FETCH QUOTE ====
async function getQuote(chain, fromSym, toSym, amount) {
  if (chain === "solana") {
    const from = TOKENS.solana.find(t => t.symbol === fromSym);
    const to = TOKENS.solana.find(t => t.symbol === toSym);
    const amt = Math.floor(amount * 10 ** from.decimals);
    const url = `${JUPITER_API}?inputMint=${from.mint}&outputMint=${to.mint}&amount=${amt}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.outAmount / 10 ** to.decimals;
  } else {
    const from = TOKENS.ethereum.find(t => t.symbol === fromSym);
    const to = TOKENS.ethereum.find(t => t.symbol === toSym);
    const amt = Math.floor(amount * 10 ** from.decimals);
    const url = `${ONEINCH_API}/${CHAINS[chain].id}/quote?src=${from.address}&dst=${to.address}&amount=${amt}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${ONEINCH_KEY}` } });
    const data = await res.json();
    return data.toTokenAmount / 10 ** to.decimals;
  }
}

// ==== EXECUTE SWAP (demo) ====
async function executeSwap() {
  const chain = $("#chainSelect").value;
  const from = $("#fromTokenSymbol").textContent;
  const to = $("#toTokenSymbol").textContent;
  const amount = parseFloat($("#fromAmount").value);
  if (!amount || !walletType) return alert("Avval walletni ulang va miqdor kiriting");

  const { fee, afterFee } = calcFee(amount);
  $("#swapStatus").textContent = "Getting quote...";

  try {
    const out = await getQuote(chain, from, to, afterFee);
    $("#toAmount").value = formatNumber(out);
    $("#swapStatus").textContent = `Taxminiy chiqim: ${out} ${to} (fee ${fee})`;
    console.log("SWAP DEMO:", { chain, from, to, afterFee, out });
  } catch (e) {
    $("#swapStatus").textContent = "Xato: " + e.message;
  }
}

// ==== INIT ====
document.addEventListener("DOMContentLoaded", () => {
  $("#connectWalletBtn").onclick = async () => {
    const chain = $("#chainSelect").value;
    if (chain === "solana") await connectSolana();
    else await connectEVM();
  };
  $("#swapBtn").onclick = executeSwap;
  $("#chainSelect").innerHTML = Object.keys(CHAINS)
    .map(k => `<option value="${k}">${CHAINS[k].name}</option>`)
    .join("");
});