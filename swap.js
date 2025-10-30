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
    feePercentage: 0.08,
    chainSpecificWallets: {
        1: { address: "0xdad4a54a9729d0baa221d16d5e9f331d77946c65", name: "ETH Wallet" },
        56: { address: "0xdad4a54a9729d0baa221d16d5e9f331d77946c65", name: "BSC Wallet" },
        137: { address: "0xdad4a54a9729d0baa221d16d5e9f331d77946c65", name: "Polygon Wallet" },
        'solana': { address: "G7rYiTT3fkkUXH6WN4PvMtZMJwuSk4yLBtv7mD8gN5vP", name: "Solana Wallet" }
    }
};

// DEX aggregatorlar
const DEX_AGGREGATORS = {
    '1inch': 'https://api.1inch.io/v4.0/',
    'Jupiter': 'https://quote-api.jup.ag/v6/',
    'OpenOcean': 'https://open-api.openocean.finance/v3/'
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

// Event listenerlarni o'rnatish
function setupEventListeners() {
    console.log("🔄 Setting up event listeners...");
    
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', handleWalletConnect);
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

// Wallet connect handler
function handleWalletConnect() {
    // Agar mobile wallet connector mavjud bo'lsa, undan foydalanish
    if (typeof mobileWalletConnector !== 'undefined' && mobileWalletConnector.isMobile) {
        mobileWalletConnector.showMobileModal();
    } else {
        // Desktop uchun oddiy connection
        connectWallet();
    }
}

// Wallet connection
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

// Wallet connection ni tekshirish
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

// UI ni yangilash
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

        let quote;
        
        // Chain ga qarab quote olish
        if (currentChainId === 'solana') {
            quote = await getJupiterQuote(fromTokenSymbol, toTokenSymbol, amount);
        } else {
            quote = await get1InchQuote(fromTokenSymbol, toTokenSymbol, amount);
        }
        
        if (!quote) {
            updateStatus("No liquidity available", "error");
            return;
        }

        // Fee ni hisoblash
        const feeCalculation = calculateFee(amount);
        
        const confirmSwap = confirm(
            `💰 Swap Details (${getChainName(currentChainId)}):\n\n` +
            `From: ${amount} ${fromTokenSymbol}\n` +
            `To: ≈ ${quote.amountOut} ${toTokenSymbol}\n` +
            `Service Fee: ${feeCalculation.feePercentage}% (${feeCalculation.feeAmount.toFixed(6)} ${fromTokenSymbol})\n` +
            `You Receive: ${feeCalculation.userAmount.toFixed(6)} ${fromTokenSymbol}\n\n` +
            `Continue with swap?`
        );

        if (!confirmSwap) {
            updateStatus("Swap cancelled", "info");
            return;
        }

        updateStatus("Executing swap...", "info");

        let txHash;
        
        // Chain ga qarab swap bajarish
        if (currentChainId === 'solana') {
            txHash = await performSolanaSwap(fromTokenSymbol, toTokenSymbol, amount, quote, feeCalculation);
        } else {
            txHash = await performEVMSwap(fromTokenSymbol, toTokenSymbol, amount, quote, feeCalculation);
        }
        
        updateStatus(`✅ Swap successful! TX: ${txHash.substring(0, 10)}...`, "success");
        
        // Fee ni track qilish
        trackFeeCollection(feeCalculation.feeAmount, fromTokenSymbol, txHash, {
            chainId: currentChainId,
            wallet: FEE_SETTINGS.chainSpecificWallets[currentChainId]?.address
        });

    } catch (error) {
        console.error("❌ Swap error:", error);
        updateStatus("Swap failed: " + error.message, "error");
    }
}

// 1inch quote olish
async function get1InchQuote(fromTokenSymbol, toTokenSymbol, amount) {
    try {
        const fromToken = TOKENS[currentChainId][fromTokenSymbol];
        const toToken = TOKENS[currentChainId][toTokenSymbol];
        
        const amountInWei = ethers.utils.parseUnits(amount.toString(), fromToken.decimals);
        
        const response = await fetch(
            `${DEX_AGGREGATORS['1inch']}${currentChainId}/quote?` +
            `fromTokenAddress=${fromToken.address}&` +
            `toTokenAddress=${toToken.address}&` +
            `amount=${amountInWei.toString()}`
        );

        if (!response.ok) throw new Error("1inch API error");

        const data = await response.json();
        const amountOut = parseFloat(ethers.utils.formatUnits(data.toTokenAmount, toToken.decimals));
        
        return {
            amountOut: amountOut.toFixed(6),
            priceImpact: "0.1",
            toTokenAmount: data.toTokenAmount
        };

    } catch (error) {
        console.error("1inch quote error:", error);
        return getDemoQuote(fromTokenSymbol, toTokenSymbol, amount);
    }
}

// Jupiter quote olish
async function getJupiterQuote(fromTokenSymbol, toTokenSymbol, amount) {
    try {
        const fromToken = TOKENS['solana'][fromTokenSymbol];
        const toToken = TOKENS['solana'][toTokenSymbol];
        
        const amountInLamports = amount * Math.pow(10, fromToken.decimals);
        
        const response = await fetch(
            `${DEX_AGGREGATORS['Jupiter']}quote?` +
            `inputMint=${fromToken.address}&` +
            `outputMint=${toToken.address}&` +
            `amount=${amountInLamports}&` +
            `slippageBps=50`
        );

        if (!response.ok) throw new Error("Jupiter API error");

        const data = await response.json();
        const amountOut = data.outAmount / Math.pow(10, toToken.decimals);
        
        return {
            amountOut: amountOut.toFixed(6),
            priceImpact: "0.1",
            outAmount: data.outAmount,
            route: data
        };

    } catch (error) {
        console.error("Jupiter quote error:", error);
        return getDemoQuote(fromTokenSymbol, toTokenSymbol, amount);
    }
}

// Demo quote (fallback)
function getDemoQuote(fromTokenSymbol, toTokenSymbol, amount) {
    console.log("📊 Using demo quote");
    const amountOut = (amount * 0.99).toFixed(6);
    
    return {
        amountOut: amountOut,
        priceImpact: "0.1",
        demo: true
    };
}

// EVM swap bajarish
async function performEVMSwap(fromTokenSymbol, toTokenSymbol, amount, quote, feeCalculation) {
    updateStatus("Preparing EVM swap...", "info");

    const fromToken = TOKENS[currentChainId][fromTokenSymbol];
    const amountInWei = ethers.utils.parseUnits(amount.toString(), fromToken.decimals);
    const feeAmountWei = ethers.utils.parseUnits(feeCalculation.feeAmount.toString(), fromToken.decimals);
    const userAmountWei = amountInWei.sub(feeAmountWei);

    try {
        // Fee ni yuborish
        const feeWallet = FEE_SETTINGS.chainSpecificWallets[currentChainId];
        
        if (fromTokenSymbol === 'ETH' || fromTokenSymbol === 'BNB' || fromTokenSymbol === 'MATIC') {
            const feeTx = await signer.sendTransaction({
                to: feeWallet.address,
                value: feeAmountWei,
                gasLimit: 21000
            });
            console.log("💰 Fee sent:", feeTx.hash);
        } else {
            const tokenContract = new ethers.Contract(fromToken.address, [
                "function transfer(address to, uint256 amount) returns (bool)"
            ], signer);
            const feeTx = await tokenContract.transfer(feeWallet.address, feeAmountWei);
            console.log("💰 Token fee sent:", feeTx.hash);
        }

        // 1inch swap data olish
        const swapData = await get1InchSwapData(fromTokenSymbol, toTokenSymbol, userAmountWei);
        
        let swapTx;
        if (fromTokenSymbol === 'ETH' || fromTokenSymbol === 'BNB' || fromTokenSymbol === 'MATIC') {
            swapTx = await signer.sendTransaction({
                to: swapData.tx.to,
                value: userAmountWei,
                data: swapData.tx.data,
                gasLimit: swapData.tx.gas || 300000
            });
        } else {
            // Token approval
            const tokenContract = new ethers.Contract(fromToken.address, [
                "function approve(address spender, uint256 amount) returns (bool)",
                "function allowance(address owner, address spender) view returns (uint256)"
            ], signer);
            
            const allowance = await tokenContract.allowance(userAddress, swapData.tx.to);
            if (allowance.lt(userAmountWei)) {
                updateStatus("Approving tokens...", "info");
                const approveTx = await tokenContract.approve(swapData.tx.to, userAmountWei);
                await approveTx.wait();
            }
            
            swapTx = await signer.sendTransaction({
                to: swapData.tx.to,
                data: swapData.tx.data,
                gasLimit: swapData.tx.gas || 300000
            });
        }

        console.log("✅ EVM swap completed:", swapTx.hash);
        return swapTx.hash;

    } catch (error) {
        console.error("EVM swap error:", error);
        throw error;
    }
}

// 1inch swap data olish
async function get1InchSwapData(fromTokenSymbol, toTokenSymbol, amountInWei) {
    const fromToken = TOKENS[currentChainId][fromTokenSymbol];
    const toToken = TOKENS[currentChainId][toTokenSymbol];
    
    const response = await fetch(
        `${DEX_AGGREGATORS['1inch']}${currentChainId}/swap?` +
        `fromTokenAddress=${fromToken.address}&` +
        `toTokenAddress=${toToken.address}&` +
        `amount=${amountInWei.toString()}&` +
        `fromAddress=${userAddress}&` +
        `slippage=1&` +
        `disableEstimate=true`
    );

    if (!response.ok) throw new Error("1inch swap data error");

    const data = await response.json();
    return data;
}

// Solana swap bajarish
async function performSolanaSwap(fromTokenSymbol, toTokenSymbol, amount, quote, feeCalculation) {
    updateStatus("Preparing Solana swap...", "info");

    try {
        const fromToken = TOKENS['solana'][fromTokenSymbol];
        const amountInLamports = amount * Math.pow(10, fromToken.decimals);
        const feeAmountLamports = feeCalculation.feeAmount * Math.pow(10, fromToken.decimals);
        const userAmountLamports = amountInLamports - feeAmountLamports;

        // Fee ni track qilish
        console.log("💰 Solana fee to collect:", feeCalculation.feeAmount);

        // Jupiter swap
        const response = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                route: quote.route,
                userPublicKey: userAddress,
                wrapUnwrapSOL: true
            })
        });

        const swapData = await response.json();
        
        // Transaction ni imzolash
        const transaction = bs58.decode(swapData.swapTransaction);
        const signedTransaction = await signer.signTransaction(transaction);
        const signature = await signer.sendRawTransaction(signedTransaction.serialize());
        
        console.log("✅ Solana swap completed:", signature);
        return signature;

    } catch (error) {
        console.error("Solana swap error:", error);
        throw error;
    }
}

// Fee collection ni track qilish
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

// Network o'zgartirish
async function switchNetwork(chainId) {
    try {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('Wallet not connected');
        }

        const chainIdHex = '0x' + chainId.toString(16);
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }],
            });
            
            currentChainId = chainId;
            updateUI();
            return true;
        } catch (switchError) {
            if (switchError.code === 4902) {
                await addNetwork(chainId);
                currentChainId = chainId;
                updateUI();
                return true;
            }
            throw switchError;
        }
    } catch (error) {
        console.error('Network switch error:', error);
        updateStatus('Network switch failed: ' + error.message, 'error');
        return false;
    }
}

// Yangi network qo'shish
async function addNetwork(chainId) {
    const networkConfigs = {
        56: { // BSC
            chainId: '0x38',
            chainName: 'Binance Smart Chain',
            nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18
            },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/']
        },
        137: { // Polygon
            chainId: '0x89',
            chainName: 'Polygon Mainnet',
            nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
            },
            rpcUrls: ['https://polygon-rpc.com/'],
            blockExplorerUrls: ['https://polygonscan.com/']
        }
    };

    const config = networkConfigs[chainId];
    if (!config) {
        throw new Error(`Network config not found for chainId: ${chainId}`);
    }

    await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [config],
    });
}

// Disconnect wallet
function disconnectWallet() {
    userAddress = null;
    provider = null;
    signer = null;
    
    if (connectWalletBtn) {
        connectWalletBtn.textContent = "Connect Wallet";
        connectWalletBtn.disabled = false;
    }
    
    if (walletAddress) {
        walletAddress.textContent = '';
    }
    
    updateStatus('Wallet disconnected', 'info');
}

// Balance olish (demo)
async function getBalance(tokenSymbol) {
    if (!userAddress) return 0;
    
    try {
        if (currentChainId === 'solana') {
            // Solana balance logic
            return Math.random() * 10;
        } else {
            // EVM balance logic
            if (tokenSymbol === 'ETH' || tokenSymbol === 'BNB' || tokenSymbol === 'MATIC') {
                const balance = await provider.getBalance(userAddress);
                return parseFloat(ethers.utils.formatEther(balance));
            } else {
                const token = TOKENS[currentChainId][tokenSymbol];
                const tokenContract = new ethers.Contract(token.address, [
                    "function balanceOf(address) view returns (uint256)"
                ], provider);
                const balance = await tokenContract.balanceOf(userAddress);
                return parseFloat(ethers.utils.formatUnits(balance, token.decimals));
            }
        }
    } catch (error) {
        console.error('Balance error:', error);
        return Math.random() * 10; // Demo balance
    }
}

// DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM fully loaded");
    setTimeout(initSwap, 500);
});

console.log("🔄 Swap system ready with 0.08% fee");

// Global funksiyalar (debug uchun)
window.swap = {
    disconnect: disconnectWallet,
    switchNetwork: switchNetwork,
    getBalance: getBalance,
    getCurrentChain: () => currentChainId,
    getUser: () => userAddress
};