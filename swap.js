// swap.js - To'liq yangilangan haqiqiy swap tizimi

console.log("🚀 Swap System Loading...");

// Tokenlar ro'yxati
const TOKENS = {
    1: { // Ethereum Mainnet
        'ETH': { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        'USDT': { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
        'USDC': { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
        'WBTC': { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 }
    },
    56: { // BSC Mainnet
        'BNB': { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        'BUSD': { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
        'USDT': { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 }
    },
    137: { // Polygon
        'MATIC': { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', decimals: 18 },
        'USDT': { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 }
    },
    'solana': { // Solana
        'SOL': { address: 'So11111111111111111111111111111111111111112', decimals: 9 },
        'USDC': { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
        'USDT': { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 }
    },
    'tron': { // Tron
        'TRX': { address: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', decimals: 6 },
        'USDT': { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', decimals: 6 }
    }
};

// Fee sozlamalari - 0.08%
const FEE_SETTINGS = {
    feePercentage: 0.08,
    
    // 🔥 SIZNING WALLET MANZILLARINGIZ
    chainSpecificWallets: {
        // Ethereum & barcha EVM chains
        1: { address: "0xdad4a54a9729d0baa221d16d5e9f331d77946c65", name: "ETH Wallet" },
        56: { address: "0xdad4a54a9729d0baa221d16d5e9f331d77946c65", name: "BSC Wallet" },
        137: { address: "0xdad4a54a9729d0baa221d16d5e9f331d77946c65", name: "Polygon Wallet" },
        
        // Solana
        'solana': { address: "G7rYiTT3fkkUXH6WN4PvMtZMJwuSk4yLBtv7mD8gN5vP", name: "Solana Wallet" },
        
        // Tron
        'tron': { address: "TKBRy3HVp7dJEkxkkjnRgWpVSy74BxrEHr", name: "Tron Wallet" }
    }
};

// DEX aggregatorlar
const DEX_AGGREGATORS = {
    '1inch': 'https://api.1inch.io/v4.0/',
    'Jupiter': 'https://quote-api.jup.ag/v6/',
    'OpenOcean': 'https://open-api.openocean.finance/v3/'
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

    populateTokenSelects();
    setupEventListeners();
    checkWalletConnection();

    console.log("✅ Swap initialized");
}

function populateTokenSelects() {
    if (!fromTokenSelect || !toTokenSelect) return;
    
    fromTokenSelect.innerHTML = '';
    toTokenSelect.innerHTML = '';

    const currentTokens = TOKENS[currentChainId] || TOKENS[1];
    
    Object.values(currentTokens).forEach(token => {
        const option1 = new Option(token.symbol, token.symbol);
        const option2 = new Option(token.symbol, token.symbol);
        
        fromTokenSelect.appendChild(option1);
        toTokenSelect.appendChild(option2);
    });
    
    // Default values
    const tokenSymbols = Object.keys(currentTokens);
    fromTokenSelect.value = tokenSymbols[0];
    toTokenSelect.value = tokenSymbols[1] || tokenSymbols[0];
    
    createFeeDisplay();
}

function setupEventListeners() {
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
    }
    
    if (swapBtn) {
        swapBtn.addEventListener('click', executeRealSwap);
    }

    if (fromTokenSelect && toTokenSelect) {
        fromTokenSelect.addEventListener('change', updateFeeDisplay);
        toTokenSelect.addEventListener('change', updateFeeDisplay);
    }

    if (swapAmount) {
        swapAmount.addEventListener('input', updateFeeDisplay);
    }
}

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
            updateStatus("EVM wallet connected!", "success");
        } else {
            updateStatus("Please install MetaMask or Phantom!", "error");
        }
        
    } catch (error) {
        console.error("Wallet connection error:", error);
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

function getChainName(chainId) {
    const chains = {
        1: 'Ethereum',
        56: 'BSC',
        137: 'Polygon',
        'solana': 'Solana',
        'tron': 'Tron'
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
        return null;
    }
}

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
        return null;
    }
}

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

async function performSolanaSwap(fromTokenSymbol, toTokenSymbol, amount, quote, feeCalculation) {
    updateStatus("Preparing Solana swap...", "info");

    try {
        const fromToken = TOKENS['solana'][fromTokenSymbol];
        const amountInLamports = amount * Math.pow(10, fromToken.decimals);
        const feeAmountLamports = feeCalculation.feeAmount * Math.pow(10, fromToken.decimals);
        const userAmountLamports = amountInLamports - feeAmountLamports;

        // Fee ni track qilish (Solana da keyinroq implement qilamiz)
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
    swapStatus.className = 'mt-2 status-message';
    
    switch (type) {
        case "success":
            swapStatus.style.color = "#4CAF50";
            swapStatus.style.fontWeight = "600";
            break;
        case "error":
            swapStatus.style.color = "#f44336";
            swapStatus.style.fontWeight = "600";
            break;
        case "info":
            swapStatus.style.color = "#2196F3";
            break;
    }
}

// DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSwap);
} else {
    setTimeout(initSwap, 100);
}

console.log("🔄 Swap system ready with 0.08% fee");