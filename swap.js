// swap.js - Faqat swap selection va asosiy funksiyalar

console.log("🚀 Swap System Loading...");

// Tokenlar ro'yxati - to'liq ma'lumotlar bilan
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

let provider, signer, userAddress, currentChainId = 1;

// DOM elementlari
let fromTokenSelect, toTokenSelect, swapAmount, connectWalletBtn, swapBtn, walletAddress, swapStatus;

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

function populateTokenSelects() {
    console.log("🔄 Populating token selects...");
    
    fromTokenSelect.innerHTML = '';
    toTokenSelect.innerHTML = '';

    const currentTokens = TOKENS[currentChainId] || TOKENS[1];
    const tokenSymbols = Object.keys(currentTokens);
    
    console.log("Available tokens:", tokenSymbols);
    
    if (tokenSymbols.length === 0) {
        console.error("❌ No tokens found for chain:", currentChainId);
        return;
    }
    
    // From token select
    tokenSymbols.forEach(symbol => {
        const token = currentTokens[symbol];
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = `${token.symbol} - ${token.name}`;
        option.className = 'token-option';
        fromTokenSelect.appendChild(option);
    });
    
    // To token select
    tokenSymbols.forEach(symbol => {
        const token = currentTokens[symbol];
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = `${token.symbol} - ${token.name}`;
        option.className = 'token-option';
        toTokenSelect.appendChild(option);
    });
    
    // Default values - bir xil token bo'lmasligi uchun
    if (tokenSymbols.length > 1) {
        toTokenSelect.value = tokenSymbols[1];
    }
    
    console.log("✅ Token selects populated");
    createFeeDisplay();
}

function setupEventListeners() {
    console.log("🔄 Setting up event listeners...");
    
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
        console.log("✅ Connect wallet listener added");
    }
    
    if (swapBtn) {
        swapBtn.addEventListener('click', executeRealSwap);
        console.log("✅ Swap button listener added");
    }

    if (fromTokenSelect && toTokenSelect) {
        fromTokenSelect.addEventListener('change', updateFeeDisplay);
        toTokenSelect.addEventListener('change', updateFeeDisplay);
        console.log("✅ Token select listeners added");
    }

    if (swapAmount) {
        swapAmount.addEventListener('input', updateFeeDisplay);
        console.log("✅ Amount input listener added");
    }
}

async function checkWalletConnection() {
    console.log("🔄 Checking wallet connection...");
    
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
                console.log("✅ Solana wallet auto-connected");
                return;
            }
        } catch (error) {
            console.log("❌ Solana auto-connect failed:", error.message);
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
                console.log("✅ EVM wallet auto-connected");
            }
        } catch (error) {
            console.log("❌ EVM auto-connect failed:", error.message);
        }
    }
    
    console.log("ℹ️ No wallet connected");
}

async function connectWallet() {
    try {
        updateStatus("Connecting wallet...", "info");
        console.log("🔄 Connecting wallet...");

        // Avval Solana ni tekshiramiz
        if (getSolanaProvider()) {
            const solanaConnected = await connectSolanaWallet();
            if (solanaConnected) {
                console.log("✅ Solana wallet connected successfully");
                return;
            }
        }

        // Keyin Ethereum ni tekshiramiz
        if (typeof window.ethereum !== 'undefined') {
            console.log("🔄 Connecting to EVM wallet...");
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAddress = accounts[0];
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            const network = await provider.getNetwork();
            currentChainId = network.chainId;
            updateUI();
            updateStatus("EVM wallet connected!", "success");
            console.log("✅ EVM wallet connected successfully");
        } else {
            updateStatus("Please install MetaMask or Phantom!", "error");
            console.log("❌ No wallet found");
        }
        
    } catch (error) {
        console.error("❌ Wallet connection error:", error);
        updateStatus("Connection failed: " + error.message, "error");
    }
}

function getSolanaProvider() {
    if (window.solana || window.phantom) {
        return window.solana || window.phantom;
    }
    return null;
}

async function connectSolanaWallet() {
    try {
        const solana = getSolanaProvider();
        if (!solana) {
            console.log("❌ Solana provider not found");
            return false;
        }
        
        console.log("🔄 Connecting to Solana wallet...");
        const response = await solana.connect();
        userAddress = response.publicKey.toString();
        provider = { isSolana: true, connection: solana };
        signer = solana;
        currentChainId = 'solana';
        updateUI();
        updateStatus("Solana wallet connected!", "success");
        return true;
    } catch (error) {
        console.error("❌ Solana connection error:", error);
        return false;
    }
}

function updateUI() {
    console.log("🔄 Updating UI...");
    
    if (walletAddress) {
        const displayAddress = userAddress.length > 20 ? 
            `${userAddress.substring(0, 10)}...${userAddress.substring(userAddress.length - 8)}` : 
            userAddress;
        walletAddress.textContent = `Connected (${getChainName(currentChainId)}): ${displayAddress}`;
        console.log("✅ Wallet address updated");
    }
    
    if (connectWalletBtn) {
        connectWalletBtn.textContent = "Connected";
        connectWalletBtn.disabled = true;
        console.log("✅ Connect button updated");
    }
    
    populateTokenSelects();
    updateFeeDisplay();
    console.log("✅ UI updated successfully");
}

function getChainName(chainId) {
    const chains = {
        1: 'Ethereum',
        56: 'BSC',
        137: 'Polygon',
        'solana': 'Solana'
    };
    return chains[chainId] || 'Unknown';
}

function calculateFee(amount) {
    const feeAmount = (amount * FEE_SETTINGS.feePercentage) / 100;
    const userAmount = amount - feeAmount;
    
    return { feeAmount, userAmount, feePercentage: FEE_SETTINGS.feePercentage };
}

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

async function executeRealSwap() {
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
        updateStatus("Getting best price...", "info");

        // Demo quote - haqiqiy implementatsiya uchun DEX API lariga ulaning
        const demoQuote = {
            amountOut: (amount * 0.99).toFixed(6),
            priceImpact: "0.1"
        };
        
        // Fee ni hisoblash
        const feeCalculation = calculateFee(amount);
        
        const confirmSwap = confirm(
            `💰 Swap Details (${getChainName(currentChainId)}):\n\n` +
            `From: ${amount} ${fromTokenSymbol}\n` +
            `To: ≈ ${demoQuote.amountOut} ${toTokenSymbol}\n` +
            `Service Fee: ${feeCalculation.feePercentage}% (${feeCalculation.feeAmount.toFixed(6)} ${fromTokenSymbol})\n` +
            `You Receive: ${feeCalculation.userAmount.toFixed(6)} ${fromTokenSymbol}\n\n` +
            `Continue with swap?`
        );

        if (!confirmSwap) {
            updateStatus("Swap cancelled", "info");
            return;
        }

        updateStatus("Executing swap...", "info");

        // Demo transaction - haqiqiy implementatsiya uchun DEX API lariga ulaning
        const txHash = "0x" + Math.random().toString(16).substr(2, 64);
        
        // Kuting (simulate processing)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        updateStatus(`✅ Swap successful! TX: ${txHash.substring(0, 10)}...`, "success");
        
        // Fee ni track qilish
        trackFeeCollection(feeCalculation.feeAmount, fromTokenSymbol, txHash, {
            chainId: currentChainId
        });

    } catch (error) {
        console.error("❌ Swap error:", error);
        updateStatus("Swap failed: " + error.message, "error");
    }
}

function trackFeeCollection(feeAmount, token, txHash, metadata) {
    const feeData = {
        amount: feeAmount,
        token: token,
        txHash: txHash,
        timestamp: new Date().toISOString(),
        userWallet: userAddress,
        metadata: metadata
    };
    
    console.log("💰 Fee Collected:", feeData);
    
    try {
        const existingFees = JSON.parse(localStorage.getItem('collectedFees') || '[]');
        existingFees.push(feeData);
        localStorage.setItem('collectedFees', JSON.stringify(existingFees));
    } catch (e) {
        console.log("❌ Failed to save fee data");
    }
}

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