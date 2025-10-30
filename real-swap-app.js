// real-swap-app.js - Real swap UI integratsiyasi
class RealSwapApp {
    constructor() {
        this.currentNetwork = 'ethereum';
        this.selectedFromToken = null;
        this.selectedToToken = null;
        this.currentBalance = 0;
        
        this.initializeApp();
    }

    initializeApp() {
        console.log('🚀 Initializing Real Swap App...');
        
        // DOM elementlarni topish
        this.networkSelect = document.getElementById('networkSelect');
        this.fromTokenSelect = document.getElementById('fromTokenSelect');
        this.toTokenSelect = document.getElementById('toTokenSelect');
        this.swapAmount = document.getElementById('swapAmount');
        this.connectMetaMask = document.getElementById('connectMetaMask');
        this.connectPhantom = document.getElementById('connectPhantom');
        this.connectTrust = document.getElementById('connectTrust');
        this.realSwapBtn = document.getElementById('realSwapBtn');
        this.walletAddress = document.getElementById('walletAddress');
        this.swapStatus = document.getElementById('swapStatus');
        this.balanceInfo = document.getElementById('balanceInfo');
        this.transactionDetails = document.getElementById('transactionDetails');
        this.txHash = document.getElementById('txHash');
        this.feeInfo = document.getElementById('feeInfo');
        this.quoteInfo = document.getElementById('quoteInfo');

        this.setupEventListeners();
        this.populateTokenSelects();
        
        // Real swap system ni ishga tushirish
        if (typeof realSwapSystem !== 'undefined') {
            realSwapSystem.init().then(() => {
                console.log('✅ Real Swap System ready');
                this.updateStatus('Real swap system ready', 'success');
            });
        }

        console.log('✅ Real Swap App initialized');
    }

    setupEventListeners() {
        // Network o'zgarishi
        this.networkSelect.addEventListener('change', (e) => {
            this.currentNetwork = e.target.value;
            this.populateTokenSelects();
            this.updateUI();
        });

        // Token selectlar
        this.fromTokenSelect.addEventListener('change', (e) => {
            this.selectedFromToken = e.target.value;
            this.updateBalanceDisplay();
            this.updateSwapButton();
        });

        this.toTokenSelect.addEventListener('change', (e) => {
            this.selectedToToken = e.target.value;
            this.updateSwapButton();
        });

        // Amount input
        this.swapAmount.addEventListener('input', (e) => {
            this.updateSwapButton();
            this.updateFeeDisplay();
        });

        // Wallet connection buttons
        this.connectMetaMask.addEventListener('click', () => this.connectWallet('metamask'));
        this.connectPhantom.addEventListener('click', () => this.connectWallet('phantom'));
        this.connectTrust.addEventListener('click', () => this.connectWallet('trustwallet'));

        // Real swap button
        this.realSwapBtn.addEventListener('click', () => this.executeRealSwap());
    }

    populateTokenSelects() {
        if (!this.fromTokenSelect || !this.toTokenSelect) return;

        const tokens = REAL_TOKENS[this.currentNetwork];
        const tokenSymbols = Object.keys(tokens);

        // Tozalash
        this.fromTokenSelect.innerHTML = '';
        this.toTokenSelect.innerHTML = '';

        // Tokenlarni to'ldirish
        tokenSymbols.forEach(symbol => {
            const token = tokens[symbol];
            
            const option1 = new Option(
                `${token.symbol} - ${token.name}`,
                symbol
            );
            
            const option2 = new Option(
                `${token.symbol} - ${token.name}`,
                symbol
            );

            this.fromTokenSelect.appendChild(option1);
            this.toTokenSelect.appendChild(option2);
        });

        // Default values
        if (tokenSymbols.length > 0) {
            this.selectedFromToken = tokenSymbols[0];
            this.selectedToToken = tokenSymbols[1] || tokenSymbols[0];
            this.fromTokenSelect.value = this.selectedFromToken;
            this.toTokenSelect.value = this.selectedToToken;
        }

        this.updateBalanceDisplay();
        this.updateSwapButton();
    }

    async connectWallet(walletType) {
        try {
            this.updateStatus(`Connecting ${walletType}...`, 'info');
            this.setLoadingState(true);

            const connection = await realSwapSystem.connectWallet(walletType);
            
            this.updateStatus(`${walletType} connected successfully!`, 'success');
            this.updateUI();
            
            // Balance ni yangilash
            await this.updateBalanceDisplay();

        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.updateStatus(`Connection failed: ${error.message}`, 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    async updateBalanceDisplay() {
        if (!realSwapSystem.wallet.userAddress || !this.selectedFromToken) {
            this.balanceInfo.textContent = 'Connect wallet to see balance';
            return;
        }

        try {
            const balance = await realSwapSystem.getTokenBalance(this.selectedFromToken);
            this.currentBalance = parseFloat(balance);
            
            this.balanceInfo.innerHTML = `
                <strong>Balance:</strong> ${this.currentBalance.toFixed(6)} ${this.selectedFromToken}
                <br><small>Available for swap</small>
            `;
        } catch (error) {
            this.balanceInfo.textContent = 'Balance unavailable';
        }
    }

    updateSwapButton() {
        const hasWallet = realSwapSystem.wallet.userAddress;
        const hasAmount = this.swapAmount.value && parseFloat(this.swapAmount.value) > 0;
        const hasValidTokens = this.selectedFromToken && this.selectedToToken && 
                              this.selectedFromToken !== this.selectedToToken;
        const sufficientBalance = hasAmount && this.currentBalance >= parseFloat(this.swapAmount.value);

        this.realSwapBtn.disabled = !(hasWallet && hasAmount && hasValidTokens && sufficientBalance);
        
        if (!sufficientBalance && hasAmount) {
            this.updateStatus('Insufficient balance', 'error');
        }
    }

    updateFeeDisplay() {
        const amount = parseFloat(this.swapAmount.value);
        if (!amount || amount <= 0) return;

        const feeAmount = amount * 0.0008; // 0.08%
        const userAmount = amount - feeAmount;

        // Fee info ni yangilash (agar transaction details ochiq bo'lsa)
        if (this.transactionDetails.style.display !== 'none') {
            this.feeInfo.innerHTML = `
                <strong>Fee:</strong> ${feeAmount.toFixed(6)} ${this.selectedFromToken} (0.08%)
                <br><strong>You receive:</strong> ${userAmount.toFixed(6)} ${this.selectedFromToken}
            `;
        }
    }

    async executeRealSwap() {
        try {
            const amount = parseFloat(this.swapAmount.value);
            
            if (!amount || amount <= 0) {
                throw new Error('Invalid amount');
            }

            if (amount > this.currentBalance) {
                throw new Error('Insufficient balance');
            }

            this.updateStatus('Starting real swap...', 'info');
            this.setLoadingState(true);
            this.transactionDetails.style.display = 'block';

            // Real swap ni bajarish
            const result = await realSwapSystem.executeRealSwap(
                this.selectedFromToken,
                this.selectedToToken,
                amount
            );

            // Natijalarni ko'rsatish
            this.showTransactionResult(result);

        } catch (error) {
            console.error('Real swap execution failed:', error);
            this.updateStatus(`Swap failed: ${error.message}`, 'error');
            this.transactionDetails.style.display = 'none';
        } finally {
            this.setLoadingState(false);
        }
    }

    showTransactionResult(result) {
        this.txHash.innerHTML = `<strong>TX Hash:</strong> <a href="${this.getExplorerUrl(result.txHash)}" target="_blank">${result.txHash}</a>`;
        
        this.feeInfo.innerHTML = `
            <strong>Fee Paid:</strong> ${result.feeAmount.toFixed(6)} ${this.selectedFromToken}
            <br><strong>You swapped:</strong> ${result.fromAmount.toFixed(6)} ${this.selectedFromToken}
        `;
        
        this.quoteInfo.innerHTML = `
            <strong>You received:</strong> ${result.toAmount.toFixed(6)} ${this.selectedToToken}
            <br><strong>Rate:</strong> 1 ${this.selectedFromToken} = ${(result.toAmount / result.fromAmount).toFixed(6)} ${this.selectedToToken}
        `;

        this.updateStatus('✅ Real swap completed successfully!', 'success');
    }

    getExplorerUrl(txHash) {
        const explorers = {
            'ethereum': `https://etherscan.io/tx/${txHash}`,
            'bsc': `https://bscscan.com/tx/${txHash}`,
            'solana': `https://solscan.io/tx/${txHash}`
        };
        return explorers[this.currentNetwork] || '#';
    }

    updateUI() {
        const wallet = realSwapSystem.wallet;
        
        if (wallet.userAddress) {
            const displayAddress = wallet.userAddress.length > 20 ? 
                `${wallet.userAddress.substring(0, 10)}...${wallet.userAddress.substring(wallet.userAddress.length - 8)}` : 
                wallet.userAddress;
            
            this.walletAddress.innerHTML = `
                <div class="network-indicator">
                    <span>Connected (${this.getChainName(wallet.currentChainId)})</span>
                    <div class="network-dot"></div>
                </div>
                <div>${displayAddress}</div>
            `;
        } else {
            this.walletAddress.textContent = '';
        }

        this.updateBalanceDisplay();
        this.updateSwapButton();
    }

    getChainName(chainId) {
        const chains = {
            'solana': 'Solana',
            1: 'Ethereum',
            56: 'BSC',
            137: 'Polygon'
        };
        return chains[chainId] || 'Unknown';
    }

    updateStatus(message, type = 'info') {
        if (!this.swapStatus) return;
        
        this.swapStatus.textContent = message;
        this.swapStatus.className = 'mt-3 status-message';
        
        this.swapStatus.classList.remove('status-success', 'status-error', 'status-info');
        
        switch (type) {
            case 'success':
                this.swapStatus.classList.add('status-success');
                break;
            case 'error':
                this.swapStatus.classList.add('status-error');
                break;
            case 'info':
                this.swapStatus.classList.add('status-info');
                break;
        }
    }

    setLoadingState(loading) {
        const elements = [
            this.connectMetaMask, this.connectPhantom, this.connectTrust,
            this.realSwapBtn, this.fromTokenSelect, this.toTokenSelect,
            this.swapAmount, this.networkSelect
        ];

        elements.forEach(element => {
            if (element) {
                element.disabled = loading;
                if (loading) {
                    element.classList.add('loading');
                } else {
                    element.classList.remove('loading');
                }
            }
        });

        if (loading) {
            this.updateStatus('Processing...', 'info');
        }
    }
}

// App ni ishga tushirish
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM fully loaded - Starting Real Swap App');
    window.realSwapApp = new RealSwapApp();
});