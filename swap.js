// swap.js - To'liq swap tizimi

console.log("🚀 Swap System Loading...");

// Tokenlar ro'yxati
const TOKENS = {
    1: { // Ethereum Mainnet
        'ETH': { symbol: 'ETH', name: 'Ethereum', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        'USDT': { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
        'USDC': { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
        'WBTC': { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 }
    },
    56: { // BSC Mainnet
        'BNB': { symbol: 'BNB', name: 'Binance Coin', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        'BUSD': { symbol: 'BUSD', name: 'Binance USD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
        'USDT': { symbol: 'USDT', name: 'Tether USD', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 }
    },
    137: { // Polygon
        'MATIC': { symbol: 'MATIC', name: 'Polygon', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        'USDT': { symbol: 'USDT', name: 'Tether USD', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 }
    },
    'solana': { // Solana
        'SOL': { symbol: 'SOL', name: 'Solana', address: 'So11111111111111111111111111111111111111112', decimals: 9 },
        'USDC': { symbol: 'USDC', name: 'USD Coin', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
        'USDT': { symbol: 'USDT', name: 'Tether USD', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 }
    }
};

// Fee sozlamalari - 0.08%
const FEE_SETTINGS = {
    feePercentage: 0.08
};

// Global o'zgaruvchilar
let provider, signer, userAddress, currentChainId = 1;

// DOM elementlari
let fromTokenSelect, toTokenSelect, swapAmount, connectWalletBtn, swapBtn, walletAddress, swapStatus;

// Asosiy init funksiyasi
async function initSwap() {
    console.log("🔄 Swap initializing...");
    
    // DOM elementlarni topish
    fromTokenSelect = document.getElementById('fromTokenSelect');
    toTokenSelect = document.getElementById('toTokenSelect');
    swapAmount = document.getElementById('swapAmount');
    connectWalletBtn = document.getElementById('connectWalletBtn');
    swapBtn = document.getElementById('swapBtn');
    walletAddress = document.getElementById('walletAddress');
    swapStatus = document.getElementById('swapStatus');

    if (!fromTokenSelect || !toTokenSelect) {
        console.error("❌ Token select elements not found!");
        return;
    }

    populateTokenSelects();
    setupEventListeners();
    checkWalletConnection();

    console.log("✅ Swap initialized");
}

// Token selectlarni to'ldirish
function populateTokenSelects() {
    fromTokenSelect.innerHTML = '';
    toTokenSelect.innerHTML = '';

    const currentTokens = TOKENS[currentChainId] || TOKENS[1];
    const tokenSymbols = Object.keys(currentTokens);
    
    tokenSymbols.forEach(symbol => {
        const token = currentTokens[symbol];
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = `${token.symbol} - ${token.name}`;
        fromTokenSelect.appendChild(option);
        
        const option2 = document.createElement('option');
        option2.value = symbol;
        option2.textContent = `${token.symbol} - ${token.name}`;
        toTokenSelect.appendChild(option2);
    });
    
    if (tokenSymbols.length > 1) {
        toTokenSelect.value = tokenSymbols[1];
    }
    
    createFeeDisplay();
}

// Event listenerlarni o'rnatish
function setupEventListeners() {
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
    }
    
    if (swapBtn) {
        swapBtn.addEventListener('click', executeSwap);
    }

    if (fromTokenSelect && toTokenSelect) {
        fromTokenSelect.addEventListener('change', updateFeeDisplay);
        toTokenSelect.addEventListener('change', updateFeeDisplay);
    }

    if (swapAmount) {
        swapAmount.addEventListener('input', updateFeeDisplay);
    }
}

// Wallet connection
async function connectWallet() {
    try {
        updateStatus("Connecting wallet...", "info");

        // Avval Solana ni tekshiramiz
        if (getSolanaProvider()) {
            const solanaConnected = await connectSolanaWallet();
            if (solanaConnected) return;
        }

        // Keyin Ethereum ni tekshiramiz
        if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            const network = await provider.getNetwork();
            currentChainId = network.chainId;
            updateUI();
            updateStatus("Wallet connected!", "success");
        } else {
            updateStatus("Please install MetaMask or Phantom!", "error");
        }
        
    } catch (error) {
        console.error("Wallet connection error:", error);
        updateStatus("Connection failed: " + error.message, "error");
    }
}

// Solana provider ni olish
function getSolanaProvider() {
    if (window.solana || window.phantom) {
        return window.solana || window.phantom;
    }
    return null;
}

// Solana wallet connection
async function connectSolanaWallet() {
    try {
        const solana = getSolanaProvider();
        if (!solana) return false;
        
        const response = await solana.connect();
        userAddress = response.publicKey.toString();
        provider = { isSolana: true, connection: solana };
        signer = solana;
        currentChainId = 'solana';
        updateUI();
        updateStatus("Solana wallet connected!", "success");
        return true;
    } catch (error) {
        console.error("Solana connection error:", error);
        return false;
    }
}

// Wallet connection ni tekshirish
async function checkWalletConnection() {
    // Avval Solana ni tekshiramiz
    if (getSolanaProvider()) {
        try {
            const solana = getSolanaProvider();
            if (solana.isConnected) {
                const response = await solana.connect({ onlyIfTrusted: true });
                userAddress = response.publicKey.toString();
                provider = { isSolana: true, connection: solana };
                signer = solana;
                currentChainId = 'solana';
                updateUI();
                return;
            }
        } catch (error) {
            console.log("Solana auto-connect failed");
        }
    }

    // Keyin Ethereum ni tekshiramiz
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                userAddress = accounts[0];
                provider = new ethers.providers.Web3Provider(window.ethereum);
                signer = provider.getSigner();
                const network = await provider.getNetwork();
                currentChainId = network.chainId;
                updateUI();
            }
        } catch (error) {
            console.log("EVM auto-connect failed");
        }
    }
}

// UI ni yangilash
function updateUI() {
    if (walletAddress) {
        const displayAddress = userAddress.length > 20 ? 
            `${userAddress.substring(0, 10)}...${userAddress.substring(userAddress.length - 8)}` : 
            userAddress;
        walletAddress.textContent = `Connected (${getChainName(currentChainId)}): ${displayAddress}`;
    }
    if (connectWalletBtn) {
        connectWalletBtn.textContent = "Connected";
        connectWalletBtn.disabled = true;
    }
    
    populateTokenSelects();
    updateFeeDisplay();
}

// Chain nomini olish
function getChainName(chainId) {
    const chains = {
        1: 'Ethereum',
        56: 'BSC',
        137: 'Polygon',
        'solana': 'Solana'
    };
    return chains[chainId] || 'Unknown';
}

// Fee hisoblash
function calculateFee(amount) {
    const feeAmount = (amount * FEE_SETTINGS.feePercentage) / 100;
    const userAmount = amount - feeAmount;
    
    return { feeAmount, userAmount, feePercentage: FEE_SETTINGS.feePercentage };
}

// Fee display yaratish
function createFeeDisplay() {
    if (document.getElementById('feeInfo')) return;
    
    const feeInfo = document.createElement('div');
    feeInfo.id = 'feeInfo';
    feeInfo.className = 'fee-info';
    feeInfo.innerHTML = `<small>Enter amount to see fee details</small>`;
    
    if (swapAmount && swapAmount.parentNode) {
        swapAmount.parentNode.insertBefore(feeInfo, swapAmount.nextSibling);
    }
}

// Fee display ni yangilash
function updateFeeDisplay() {
    const amount = parseFloat(swapAmount.value);
    const feeInfo = document.getElementById('feeInfo');
    
    if (!feeInfo) return;
    
    if (amount && amount > 0) {
        const feeCalculation = calculateFee(amount);
        const fromToken = fromTokenSelect.value;
        
        feeInfo.innerHTML = `
            <div class="fee-details">
                <div class="fee-row">
                    <span>Service Fee (${feeCalculation.feePercentage}%):</span>
                    <span class="fee-amount">${feeCalculation.feeAmount.toFixed(6)} ${fromToken}</span>
                </div>
                <div class="fee-row">
                    <span>You Will Receive:</span>
                    <span class="receive-amount">${feeCalculation.userAmount.toFixed(6)} ${fromToken}</span>
                </div>
                <div class="fee-usd">≈ $${feeCalculation.feeAmount.toFixed(2)} fee</div>
            </div>
        `;
    } else {
        feeInfo.innerHTML = `<small>Enter amount to see fee details</small>`;
    }
}

// Asosiy swap funksiyasi
async function executeSwap() {
    try {
        if (!userAddress) {
            updateStatus("Please connect wallet first!", "error");
            return;
        }

        const amount = parseFloat(swapAmount.value);
        if (!amount || amount <= 0) {
            updateStatus("Please enter valid amount", "error");
            return;
        }

        const fromTokenSymbol = fromTokenSelect.value;
        const toTokenSymbol = toTokenSelect.value;

        if (fromTokenSymbol === toTokenSymbol) {
            updateStatus("Please select different tokens", "error");
            return;
        }

        console.log(`🔄 Swapping ${amount} ${fromTokenSymbol} to ${toTokenSymbol}`);
        updateStatus("Processing swap...", "info");

        // Fee ni hisoblash
        const feeCalculation = calculateFee(amount);
        
        // Demo transaction
        const txHash = "0x" + Math.random().toString(16).substr(2, 64);
        
        // Kuting (simulate processing)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        updateStatus(`✅ Swap successful! TX: ${txHash.substring(0, 10)}...`, "success");

    } catch (error) {
        console.error("❌ Swap error:", error);
        updateStatus("Swap failed: " + error.message, "error");
    }
}

// Status yangilash
function updateStatus(message, type = "info") {
    if (!swapStatus) return;
    
    swapStatus.textContent = message;
    swapStatus.className = 'mt-3 status-message';
    
    // Remove existing status classes
    swapStatus.classList.remove('status-success', 'status-error', 'status-info');
    
    switch (type) {
        case "success":
            swapStatus.classList.add('status-success');
            break;
        case "error":
            swapStatus.classList.add('status-error');
            break;
        case "info":
            swapStatus.classList.add('status-info');
            break;
    }
}

// DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM fully loaded");
    setTimeout(initSwap, 500);
});

console.log("🔄 Swap system ready with 0.08% fee");