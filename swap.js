// wallets.js - Ko'p walletlar uchun qo'llab-quvvatlash

class MultiWalletConnector {
    constructor() {
        this.supportedWallets = {
            'metamask': {
                name: 'MetaMask',
                icon: '🦊',
                check: () => typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
                connect: this.connectMetaMask.bind(this)
            },
            'trustwallet': {
                name: 'Trust Wallet',
                icon: '🔒',
                check: () => typeof window.ethereum !== 'undefined' && window.ethereum.isTrust,
                connect: this.connectTrustWallet.bind(this)
            },
            'binance': {
                name: 'Binance Wallet',
                icon: '💰',
                check: () => typeof window.BinanceChain !== 'undefined',
                connect: this.connectBinanceWallet.bind(this)
            },
            'coinbase': {
                name: 'Coinbase Wallet',
                icon: '🏦',
                check: () => typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet,
                connect: this.connectCoinbaseWallet.bind(this)
            },
            'phantom': {
                name: 'Phantom',
                icon: '👻',
                check: () => typeof window.phantom !== 'undefined' || typeof window.solana !== 'undefined',
                connect: this.connectPhantom.bind(this)
            },
            'walletconnect': {
                name: 'WalletConnect',
                icon: '🔗',
                check: () => true, // Always available
                connect: this.connectWalletConnect.bind(this)
            }
        };
        
        this.detectedWallets = [];
        this.init();
    }

    init() {
        this.detectWallets();
        this.createWalletModal();
    }

    detectWallets() {
        this.detectedWallets = [];
        
        for (const [key, wallet] of Object.entries(this.supportedWallets)) {
            if (wallet.check()) {
                this.detectedWallets.push({
                    id: key,
                    ...wallet
                });
            }
        }
        
        console.log('🎯 Detected wallets:', this.detectedWallets);
        return this.detectedWallets;
    }

    createWalletModal() {
        // Modal yaratish agar mavjud bo'lmasa
        if (!document.getElementById('walletModal')) {
            const modalHTML = `
                <div id="walletModal" class="wallet-modal" style="display: none;">
                    <div class="wallet-modal-content">
                        <div class="wallet-modal-header">
                            <h3>Connect Wallet</h3>
                            <span class="wallet-modal-close">&times;</span>
                        </div>
                        <div class="wallet-modal-body">
                            <div id="walletList" class="wallet-list">
                                <!-- Walletlar bu yerda ko'rsatiladi -->
                            </div>
                            <div class="wallet-install-links">
                                <p>Don't have a wallet?</p>
                                <div class="install-buttons">
                                    <a href="https://metamask.io/download/" target="_blank" class="install-btn metamask">
                                        Install MetaMask
                                    </a>
                                    <a href="https://trustwallet.com/download" target="_blank" class="install-btn trustwallet">
                                        Install Trust Wallet
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.setupModalEvents();
        }
    }

    setupModalEvents() {
        const modal = document.getElementById('walletModal');
        const closeBtn = document.querySelector('.wallet-modal-close');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    showWalletModal() {
        const modal = document.getElementById('walletModal');
        const walletList = document.getElementById('walletList');
        
        // Wallet listini to'ldirish
        walletList.innerHTML = '';
        
        this.detectedWallets.forEach(wallet => {
            const walletElement = document.createElement('div');
            walletElement.className = 'wallet-item';
            walletElement.innerHTML = `
                <div class="wallet-icon">${wallet.icon}</div>
                <div class="wallet-info">
                    <div class="wallet-name">${wallet.name}</div>
                    <div class="wallet-status">Available</div>
                </div>
                <div class="wallet-connect-btn">Connect</div>
            `;
            
            walletElement.addEventListener('click', () => {
                this.connectWallet(wallet.id);
            });
            
            walletList.appendChild(walletElement);
        });
        
        // Agar wallet topilmasa
        if (this.detectedWallets.length === 0) {
            walletList.innerHTML = `
                <div class="no-wallets">
                    <p>No wallets detected</p>
                    <p>Please install a wallet to continue</p>
                </div>
            `;
        }
        
        modal.style.display = 'block';
    }

    async connectWallet(walletId) {
        const wallet = this.supportedWallets[walletId];
        if (!wallet) {
            console.error('Wallet not found:', walletId);
            return false;
        }

        try {
            updateStatus(`Connecting to ${wallet.name}...`, 'info');
            const result = await wallet.connect();
            
            if (result) {
                updateStatus(`${wallet.name} connected successfully!`, 'success');
                document.getElementById('walletModal').style.display = 'none';
                return true;
            } else {
                updateStatus(`Failed to connect ${wallet.name}`, 'error');
                return false;
            }
        } catch (error) {
            console.error(`Error connecting to ${wallet.name}:`, error);
            updateStatus(`Connection failed: ${error.message}`, 'error');
            return false;
        }
    }

    // MetaMask connection
    async connectMetaMask() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask not installed');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            userAddress = accounts[0];
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            const network = await provider.getNetwork();
            currentChainId = network.chainId;

            // Network o'zgarishini kuzatish
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('Chain changed:', chainId);
                currentChainId = parseInt(chainId, 16);
                updateUI();
            });

            // Account o'zgarishini kuzatish
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('Accounts changed:', accounts);
                if (accounts.length === 0) {
                    // User disconnected
                    this.handleDisconnect();
                } else {
                    userAddress = accounts[0];
                    updateUI();
                }
            });

            updateUI();
            return true;
        } catch (error) {
            console.error('MetaMask connection error:', error);
            throw error;
        }
    }

    // Trust Wallet connection
    async connectTrustWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('Trust Wallet not installed');
            }

            // Trust Wallet MetaMask compatible
            return await this.connectMetaMask();
        } catch (error) {
            console.error('Trust Wallet connection error:', error);
            throw error;
        }
    }

    // Binance Wallet connection
    async connectBinanceWallet() {
        try {
            if (typeof window.BinanceChain === 'undefined') {
                throw new Error('Binance Wallet not installed');
            }

            const accounts = await window.BinanceChain.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            userAddress = accounts[0];
            provider = new ethers.providers.Web3Provider(window.BinanceChain);
            signer = provider.getSigner();
            currentChainId = 56; // BSC mainnet

            updateUI();
            return true;
        } catch (error) {
            console.error('Binance Wallet connection error:', error);
            throw error;
        }
    }

    // Coinbase Wallet connection
    async connectCoinbaseWallet() {
        try {
            if (typeof window.ethereum === 'undefined') {
                throw new Error('Coinbase Wallet not installed');
            }

            // Coinbase Wallet MetaMask compatible
            return await this.connectMetaMask();
        } catch (error) {
            console.error('Coinbase Wallet connection error:', error);
            throw error;
        }
    }

    // Phantom connection
    async connectPhantom() {
        try {
            const solana = window.solana || window.phantom;
            if (!solana) {
                throw new Error('Phantom not installed');
            }

            const response = await solana.connect();
            userAddress = response.publicKey.toString();
            provider = { isSolana: true, connection: solana };
            signer = solana;
            currentChainId = 'solana';

            // Disconnect event
            solana.on('disconnect', () => {
                this.handleDisconnect();
            });

            updateUI();
            return true;
        } catch (error) {
            console.error('Phantom connection error:', error);
            throw error;
        }
    }

    // WalletConnect connection (soddalashtirilgan versiya)
    async connectWalletConnect() {
        try {
            // Bu yerda WalletConnect integratsiyasi bo'lishi kerak
            // Hozircha demo versiya
            updateStatus('WalletConnect coming soon...', 'info');
            return false;
            
            // Haqiqiy implementatsiya:
            // 1. WalletConnect provider yaratish
            // 2. QR code ko'rsatish
            // 3. User connection ni tasdiqlashini kutish
        } catch (error) {
            console.error('WalletConnect error:', error);
            throw error;
        }
    }

    handleDisconnect() {
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

    // Wallet ni tekshirish
    checkWalletConnection() {
        return !!userAddress;
    }

    // Network ni o'zgartirish
    async switchNetwork(chainId) {
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
            } catch (switchError) {
                // Agar network mavjud bo'lmasa, qo'shish
                if (switchError.code === 4902) {
                    await this.addNetwork(chainId);
                } else {
                    throw switchError;
                }
            }
            
            return true;
        } catch (error) {
            console.error('Network switch error:', error);
            throw error;
        }
    }

    // Yangi network qo'shish
    async addNetwork(chainId) {
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
}

// Global instance
let walletConnector;

// Yangi swap.js funksiyalari
async function initSwapWithWallets() {
    console.log("🔄 Swap with multi-wallet support initializing...");
    
    // Wallet connector ni ishga tushirish
    walletConnector = new MultiWalletConnector();
    
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

    // Event listenerlarni o'rnatish
    setupEventListenersWithWallets();
    
    // Avvalgi connection ni tekshirish
    checkExistingConnection();
    
    console.log("✅ Swap with multi-wallet support initialized");
}

function setupEventListenersWithWallets() {
    console.log("🔄 Setting up event listeners with wallet support...");
    
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', () => {
            walletConnector.showWalletModal();
        });
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

function checkExistingConnection() {
    // LocalStorage dan oldingi connection ni tekshirish
    const savedConnection = localStorage.getItem('walletConnection');
    if (savedConnection) {
        const connection = JSON.parse(savedConnection);
        userAddress = connection.address;
        currentChainId = connection.chainId;
        updateUI();
    }
}

// Yangi CSS (wallets.css):
const walletStyles = `
/* Wallet Modal Styles */
.wallet-modal {
    position: fixed;
    z-index: 10000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(10px);
}

.wallet-modal-content {
    background: rgba(25, 25, 35, 0.95);
    margin: 5% auto;
    padding: 0;
    border-radius: 20px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

body.light .wallet-modal-content {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.1);
}

.wallet-modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

body.light .wallet-modal-header {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.wallet-modal-header h3 {
    margin: 0;
    color: #fff;
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
}

body.light .wallet-modal-header h3 {
    color: #1f2029;
}

.wallet-modal-close {
    color: #aaa;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    transition: color 0.3s ease;
}

.wallet-modal-close:hover {
    color: #fff;
}

body.light .wallet-modal-close:hover {
    color: #1f2029;
}

.wallet-modal-body {
    padding: 1.5rem;
}

/* Wallet List Styles */
.wallet-list {
    margin-bottom: 1.5rem;
}

.wallet-item {
    display: flex;
    align-items: center;
    padding: 1rem;
    margin-bottom: 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid transparent;
}

body.light .wallet-item {
    background: rgba(0, 0, 0, 0.03);
}

.wallet-item:hover {
    background: rgba(129, 103, 169, 0.1);
    border-color: rgba(129, 103, 169, 0.3);
    transform: translateY(-2px);
}

.wallet-icon {
    font-size: 1.5rem;
    margin-right: 1rem;
    width: 40px;
    text-align: center;
}

.wallet-info {
    flex: 1;
}

.wallet-name {
    font-weight: 600;
    color: #fff;
    margin-bottom: 0.25rem;
    font-family: 'Montserrat', sans-serif;
}

body.light .wallet-name {
    color: #1f2029;
}

.wallet-status {
    font-size: 0.8rem;
    color: #4CAF50;
}

.wallet-connect-btn {
    background: rgba(129, 103, 169, 0.2);
    color: #8167a9;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.wallet-item:hover .wallet-connect-btn {
    background: #8167a9;
    color: #fff;
}

/* No Wallets State */
.no-wallets {
    text-align: center;
    padding: 2rem;
    color: #c4c3ca;
}

body.light .no-wallets {
    color: #666;
}

/* Install Links */
.wallet-install-links {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 1.5rem;
}

body.light .wallet-install-links {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.wallet-install-links p {
    margin-bottom: 1rem;
    color: #c4c3ca;
    text-align: center;
}

body.light .wallet-install-links p {
    color: #666;
}

.install-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.install-btn {
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    text-decoration: none;
    border-radius: 8px;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 600;
    transition: all 0.3s ease;
    border: 1px solid transparent;
}

body.light .install-btn {
    background: rgba(0, 0, 0, 0.03);
    color: #1f2029;
}

.install-btn:hover {
    background: rgba(129, 103, 169, 0.1);
    border-color: rgba(129, 103, 169, 0.3);
    transform: translateY(-1px);
}

.install-btn.metamask {
    background: linear-gradient(135deg, #f6851b, #e2761b);
    color: white;
}

.install-btn.trustwallet {
    background: linear-gradient(135deg, #3375bb, #2a5f9e);
    color: white;
}

/* Network Indicator */
.network-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    font-size: 0.8rem;
    margin-left: 1rem;
}

body.light .network-indicator {
    background: rgba(0, 0, 0, 0.03);
}

.network-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4CAF50;
}

.network-dot.offline {
    background: #f44336;
}

/* Disconnect Button */
.disconnect-btn {
    background: rgba(244, 67, 54, 0.1);
    color: #f44336;
    border: 1px solid rgba(244, 67, 54, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-left: 1rem;
}

.disconnect-btn:hover {
    background: rgba(244, 67, 54, 0.2);
    transform: translateY(-1px);
}

/* Mobile Responsive */
@media (max-width: 480px) {
    .wallet-modal-content {
        margin: 10% auto;
        width: 95%;
    }
    
    .wallet-item {
        padding: 0.875rem;
    }
    
    .wallet-icon {
        font-size: 1.25rem;
        margin-right: 0.75rem;
    }
}
`;

// CSS ni qo'shish
const styleSheet = document.createElement('style');
styleSheet.textContent = walletStyles;
document.head.appendChild(styleSheet);

// DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM fully loaded with wallet support");
    setTimeout(initSwapWithWallets, 500);
});