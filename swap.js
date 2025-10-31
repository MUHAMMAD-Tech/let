// swap.js

let provider, signer, userAddress;

// Tokenlar ro‘yxati (misol uchun 2ta token)
const tokens = [
  { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  { symbol: "DAI", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 }
];

// DEX Router (Uniswap v2)
const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const FEE_WALLET = "0xYourFeeWalletHere"; // bu yerda o‘zingning fee manziling bo‘ladi
const FEE_PERCENT = 0.0008; // 0.08%

// HTML elementlari
const connectBtn = document.getElementById("connectWalletBtn");
const swapBtn = document.getElementById("swapBtn");
const walletDiv = document.getElementById("walletAddress");
const swapStatus = document.getElementById("swapStatus");
const fromTokenSelect = document.getElementById("fromTokenSelect");
const toTokenSelect = document.getElementById("toTokenSelect");
const amountInput = document.getElementById("swapAmount");

// Tokenlarni selectga joylash
tokens.forEach((t) => {
  const opt1 = document.createElement("option");
  opt1.value = t.address;
  opt1.textContent = t.symbol;
  fromTokenSelect.appendChild(opt1);
  
  const opt2 = document.createElement("option");
  opt2.value = t.address;
  opt2.textContent = t.symbol;
  toTokenSelect.appendChild(opt2);
});
toTokenSelect.selectedIndex = 1;

// Wallet connect
connectBtn.onclick = async () => {
  if (!window.ethereum) {
    alert("MetaMask o‘rnatilmagan!");
    return;
  }
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  userAddress = await signer.getAddress();
  
  walletDiv.textContent = `Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
  connectBtn.textContent = "Connected ✅";
};

// Swap bosilganda
swapBtn.onclick = async () => {
  if (!signer) return alert("Avval walletni ulang!");
  const fromToken = fromTokenSelect.value;
  const toToken = toTokenSelect.value;
  const amount = parseFloat(amountInput.value);
  if (!amount || fromToken === toToken) return alert("To‘g‘ri ma’lumot kiriting!");
  
  try {
    swapStatus.textContent = "Calculating fee...";
    const tokenInfo = tokens.find((t) => t.address === fromToken);
    const amountIn = ethers.utils.parseUnits(amount.toString(), tokenInfo.decimals);
    const feeAmount = amountIn.mul(Math.floor(FEE_PERCENT * 1e6)).div(1e6);
    
    // ERC20 approve va fee yuborish
    const token = new ethers.Contract(fromToken, [
      "function approve(address spender, uint256 amount) public returns (bool)",
      "function transfer(address to, uint256 amount) public returns (bool)"
    ], signer);
    
    swapStatus.textContent = "Yuborilmoqda: fee...";
    await token.transfer(FEE_WALLET, feeAmount);
    
    swapStatus.textContent = "Approving router...";
    await token.approve(ROUTER_ADDRESS, amountIn.sub(feeAmount));
    
    // Router orqali swap
    const router = new ethers.Contract(ROUTER_ADDRESS, [
      "function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline)"
    ], signer);
    
    const path = [fromToken, toToken];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    
    swapStatus.textContent = "Swapping...";
    const tx = await router.swapExactTokensForTokens(
      amountIn.sub(feeAmount),
      0,
      path,
      userAddress,
      deadline
    );
    
    await tx.wait();
    swapStatus.textContent = "✅ Swap muvaffaqiyatli yakunlandi!";
  } catch (e) {
    console.error(e);
    swapStatus.textContent = "❌ Xatolik yuz berdi.";
  }
};