// mobile-wallets.js - Mobil qurilmalar uchun optimallashtirilgan wallet connection

class MobileWalletConnector {
    constructor() {
        this.isMobile = this.checkMobile();
        this.supportedWallets = {
            'metamask': {
                name: 'MetaMask',
                icon: '🦊',
                mobileUrl: 'https://metamask.app.link/dapp/' + window.location.host,
                check: () => this.checkMetaMask(),
                connect: this.connectMetaMask.bind(this)
            },
            'trustwallet': {
                name: 'Trust Wallet',
                icon: '🔒',
                mobileUrl: 'https://link.trustwallet.com/dapp/' + window.location.host,
                check: () => this.checkTrustWallet(),
                connect: this.connectTrustWallet.bind(this)
            },
            'phantom': {
                name: 'Phantom',
                icon: '👻',
                mobileUrl: 'https://phantom.app/ul/browse/' + btoa(window.location.href),
                check: () => this.checkPhantom(),
                connect: this.connectPhantom.bind(this)
            },
            'binance': {
                name: 'Binance Wallet',
                icon: '💰',
                mobileUrl: 'https://binance.com/dapp/' + window.location.host,
                check: () => this.checkBinanceWallet(),
                connect: this.connectBinanceWallet.bind(this)
            },
            'walletconnect': {
                name: 'WalletConnect',
                icon: '🔗',
                mobileUrl: null,
                check: () => true,
                connect: this.connectWalletConnect.bind(this)
            }
        };
        
        this.init();
    }

    init() {
        console.log('📱 Mobile Wallet Connector initialized');
        this.detectWallets();
        this.createMobileModal();
        this.setupDeepLinks();
    }

    checkMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Mobil walletlarni tekshirish
    checkMetaMask() {
        if (this.isMobile) {
            // Mobil brauzerda MetaMask ni tekshirish
            return typeof window.ethereum !== 'undefined' && 
                   (window.ethereum.isMetaMask || 
                    navigator.userAgent.includes('MetaMask'));
        }
        return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    }

    checkTrustWallet() {
        if (this.isMobile) {
            return typeof window.ethereum !== 'undefined' && 
                   (window.ethereum.isTrust || 
                    navigator.userAgent.includes('TrustWallet'));
        }
        return typeof window.ethereum !== 'undefined' && window.ethereum.isTrust;
    }

    checkPhantom() {
        if (this.isMobile) {
            return typeof window.phantom !== 'undefined' || 
                   typeof window.solana !== 'undefined' ||
                   navigator.userAgent.includes('Phantom');
        }
        return typeof window.phantom !== 'undefined' || typeof window.solana !== 'undefined';
    }

    checkBinanceWallet() {
        if (this.isMobile) {
            return typeof window.BinanceChain !== 'undefined' ||
                   navigator.userAgent.includes('Binance');
        }
        return typeof window.BinanceChain !== 'undefined';
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
        
        console.log('📱 Detected mobile wallets:', this.detectedWallets);
        return this.detectedWallets;
    }

    createMobileModal() {
        if (!document.getElementById('mobileWalletModal')) {
            const modalHTML = `
                <div id="mobileWalletModal" class="mobile-wallet-modal" style="display: none;">
                    <div class="mobile-wallet-content">
                        <div class="mobile-wallet-header">
                            <h3>Connect Wallet</h3>
                            <span class="mobile-wallet-close">&times;</span>
                        </div>
                        <div class="mobile-wallet-body">
                            <div class="mobile-wallet-instructions">
                                <p>Choose your wallet to connect:</p>
                            </div>
                            <div id="mobileWalletList" class="mobile-wallet-list">
                                <!-- Walletlar bu yerda ko'rsatiladi -->
                            </div>
                            <div class="mobile-wallet-deeplink">
                                <p>Or open in wallet app:</p>
                                <button id="openInWallet" class="deeplink-btn">
                                    Open in Wallet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.setupMobileModalEvents();
        }
    }

    setupMobileModalEvents() {
        const modal = document.getElementById('mobileWalletModal');
        const closeBtn = document.querySelector('.mobile-wallet-close');
        const deeplinkBtn = document.getElementById('openInWallet');
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        deeplinkBtn.addEventListener('click', () => {
            this.openDeepLink();
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    showMobileModal() {
        const modal = document.getElementById('mobileWalletModal');
        const walletList = document.getElementById('mobileWalletList');
        
        walletList.innerHTML = '';
        
        this.detectedWallets.forEach(wallet => {
            const walletElement = document.createElement('div');
            walletElement.className = 'mobile-wallet-item';
            walletElement.innerHTML = `
                <div class="mobile-wallet-icon">${wallet.icon}</div>
                <div class="mobile-wallet-info">
                    <div class="mobile-wallet-name">${wallet.name}</div>
                    <div class="mobile-wallet-status">Tap to connect</div>
                </div>
            `;
            
            walletElement.addEventListener('click', () => {
                this.connectMobileWallet(wallet.id);
            });
            
            walletList.appendChild(walletElement);
        });
        
        modal.style.display = 'block';
    }

    async connectMobileWallet(walletId) {
        const wallet = this.supportedWallets[walletId];
        if (!wallet) {
            console.error('Wallet not found:', walletId);
            return false;
        }

        try {
            updateStatus(`Connecting to ${wallet.name}...`, 'info');
            
            // Mobil brauzerda deep link ochish
            if (this.isMobile && wallet.mobileUrl) {
                this.openWalletDeepLink(wallet.mobileUrl);
            }
            
            // Connection ni urinib ko'rish
            const result = await wallet.connect();
            
            if (result) {
                updateStatus(`${wallet.name} connected!`, 'success');
                document.getElementById('mobileWalletModal').style.display = 'none';
                return true;
            } else {
                // Agar direct connection ishlamasa, deep link ochish
                if (this.isMobile && wallet.mobileUrl) {
                    this.openWalletDeepLink(wallet.mobileUrl);
                }
                return false;
            }
        } catch (error) {
            console.error(`Mobile connection error:`, error);
            
            // Xatolik yuz berganda ham deep link ochish
            if (this.isMobile && wallet.mobileUrl) {
                this.openWalletDeepLink(wallet.mobileUrl);
            }
            
            updateStatus(`Please open in ${wallet.name} app`, 'info');
            return false;
        }
    }

    openWalletDeepLink(url) {
        console.log('🔗 Opening deep link:', url);
        
        // Yangi oynada ochish
        window.open(url, '_blank');
        
        // Fallback: agar yangi oyna ochilmasa
        setTimeout(() => {
            window.location.href = url;
        }, 500);
    }

    openDeepLink() {
        // Eng ko'p ishlatiladigan wallet uchun deep link
        const defaultWallet = this.detectedWallets[0] || this.supportedWallets.metamask;
        if (defaultWallet && defaultWallet.mobileUrl) {
            this.openWalletDeepLink(defaultWallet.mobileUrl);
        }
    }

    setupDeepLinks() {
        // URL parametrlari orqali wallet connection
        const urlParams = new URLSearchParams(window.location.search);
        const walletParam = urlParams.get('wallet');
        
        if (walletParam && this.supportedWallets[walletParam]) {
            this.connectMobileWallet(walletParam);
        }
    }

    // MetaMask connection (mobil uchun optimallashtirilgan)
    async connectMetaMask() {
        try {
            // Mobil brauzerda ethereum object ni kutish
            if (this.isMobile) {
                return await this.waitForEthereum('metamask');
            }
            
            if (typeof window.ethereum === 'undefined') {
                throw new Error('MetaMask not found');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            return this.handleEthereumConnection(accounts[0]);
        } catch (error) {
            console.error('MetaMask mobile error:', error);
            throw error;
        }
    }

    // Trust Wallet connection
    async connectTrustWallet() {
        try {
            if (this.isMobile) {
                return await this.waitForEthereum('trustwallet');
            }
            
            if (typeof window.ethereum === 'undefined') {
                throw new Error('Trust Wallet not found');
            }

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }

            return this.handleEthereumConnection(accounts[0]);
        } catch (error) {
            console.error('Trust Wallet mobile error:', error);
            throw error;
        }
    }

    // Phantom connection
    async connectPhantom() {
        try {
            if (this.isMobile) {
                return await this.waitForSolana();
            }
            
            const solana = window.solana || window.phantom;
            if (!solana) {
                throw new Error('Phantom not found');
            }

            const response = await solana.connect();
            userAddress = response.publicKey.toString();
            provider = { isSolana: true, connection: solana };
            signer = solana;
            currentChainId = 'solana';

            updateUI();
            return true;
        } catch (error) {
            console.error('Phantom mobile error:', error);
            throw error;
        }
    }

    // Binance Wallet connection
    async connectBinanceWallet() {
        try {
            if (typeof window.BinanceChain === 'undefined') {
                throw new Error('Binance Wallet not found');
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
            currentChainId = 56;

            updateUI();
            return true;
        } catch (error) {
            console.error('Binance Wallet error:', error);
            throw error;
        }
    }

    // WalletConnect
    async connectWalletConnect() {
        // Mobil uchun WalletConnect - keyinroq implement qilamiz
        updateStatus('WalletConnect coming soon for mobile...', 'info');
        return false;
    }

    // Ethereum object ni kutish (mobil uchun)
    async waitForEthereum(walletName, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkEthereum = () => {
                if (typeof window.ethereum !== 'undefined') {
                    this.handleEthereumConnection()
                        .then(resolve)
                        .catch(reject);
                    return;
                }
                
                if (Date.now() - startTime > timeout) {
                    reject(new Error(`${walletName} timeout - please make sure the app is open`));
                    return;
                }
                
                setTimeout(checkEthereum, 100);
            };
            
            checkEthereum();
        });
    }

    // Solana object ni kutish
    async waitForSolana(timeout = 10000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkSolana = () => {
                const solana = window.solana || window.phantom;
                if (solana) {
                    this.connectPhantom()
                        .then(resolve)
                        .catch(reject);
                    return;
                }
                
                if (Date.now() - startTime > timeout) {
                    reject(new Error('Phantom timeout - please make sure the app is open'));
                    return;
                }
                
                setTimeout(checkSolana, 100);
            };
            
            checkSolana();
        });
    }

    // Ethereum connection ni boshqarish
    async handleEthereumConnection(address = null) {
        if (!address) {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            address = accounts[0];
        }

        userAddress = address;
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        const network = await provider.getNetwork();
        currentChainId = network.chainId;

        // Event listeners
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.handleDisconnect();
            } else {
                userAddress = accounts[0];
                updateUI();
            }
        });

        window.ethereum.on('chainChanged', (chainId) => {
            currentChainId = parseInt(chainId, 16);
            updateUI();
        });

        updateUI();
        return true;
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

    // QR code generator (WalletConnect uchun)
    generateQRCode(text) {
        // Soddalashtirilgan QR code generator
        const qrContainer = document.createElement('div');
        qrContainer.className = 'qr-code-container';
        qrContainer.innerHTML = `
            <div class="qr-code">
                <p>Scan with WalletConnect</p>
                <div class="qr-placeholder">QR Code: ${text.substring(0, 20)}...</div>
            </div>
        `;
        return qrContainer;
    }
}

// Global mobile wallet connector
let mobileWalletConnector;

// Yangi init funksiyasi
async function initMobileSwap() {
    console.log("📱 Mobile Swap initializing...");
    
    // Mobile wallet connector ni ishga tushirish
    mobileWalletConnector = new MobileWalletConnector();
    
    // DOM elementlarni topish
    fromTokenSelect = document.getElementById('fromTokenSelect');
    toTokenSelect = document.getElementById('toTokenSelect');
    swapAmount = document.getElementById('swapAmount');
    connectWalletBtn = document.getElementById('connectWalletBtn');
    swapBtn = document.getElementById('swapBtn');
    walletAddress = document.getElementById('walletAddress');
    swapStatus = document.getElementById('swapStatus');

    // Event listenerlarni o'rnatish
    setupMobileEventListeners();
    
    // Avvalgi connection ni tekshirish
    checkMobileConnection();
    
    console.log("✅ Mobile Swap initialized");
}

function setupMobileEventListeners() {
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', () => {
            if (mobileWalletConnector.isMobile) {
                mobileWalletConnector.showMobileModal();
            } else {
                // Desktop uchun eski modal
                if (typeof walletConnector !== 'undefined') {
                    walletConnector.showWalletModal();
                }
            }
        });
    }
    
    // Qolgan event listenerlar
    if (swapBtn) swapBtn.addEventListener('click', executeRealSwap);
    if (fromTokenSelect) fromTokenSelect.addEventListener('change', updateFeeDisplay);
    if (toTokenSelect) toTokenSelect.addEventListener('change', updateFeeDisplay);
    if (swapAmount) swapAmount.addEventListener('input', updateFeeDisplay);
}

function checkMobileConnection() {
    // LocalStorage dan connection ni tekshirish
    const saved = localStorage.getItem('mobileWalletConnection');
    if (saved) {
        const connection = JSON.parse(saved);
        userAddress = connection.address;
        currentChainId = connection.chainId;
        updateUI();
    }
}

// Mobile uchun CSS
const mobileWalletStyles = `
/* Mobile Wallet Modal */
.mobile-wallet-modal {
    position: fixed;
    z-index: 10000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 15, 20, 0.95);
    backdrop-filter: blur(20px);
}

.mobile-wallet-content {
    background: rgba(25, 25, 35, 0.98);
    margin: 10% auto;
    padding: 0;
    border-radius: 20px;
    width: 90%;
    max-width: 400px;
    border: 1px solid rgba(129, 103, 169, 0.3);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

body.light .mobile-wallet-content {
    background: rgba(255, 255, 255, 0.98);
}

.mobile-wallet-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(129, 103, 169, 0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mobile-wallet-header h3 {
    margin: 0;
    color: #fff;
    font-family: 'Montserrat', sans-serif;
    font-weight: 600;
}

body.light .mobile-wallet-header h3 {
    color: #1f2029;
}

.mobile-wallet-close {
    color: #8167a9;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    transition: color 0.3s ease;
}

.mobile-wallet-close:hover {
    color: #a68ccd;
}

.mobile-wallet-body {
    padding: 1.5rem;
}

.mobile-wallet-instructions {
    text-align: center;
    margin-bottom: 1.5rem;
    color: #c4c3ca;
}

body.light .mobile-wallet-instructions {
    color: #666;
}

/* Mobile Wallet List */
.mobile-wallet-list {
    margin-bottom: 2rem;
}

.mobile-wallet-item {
    display: flex;
    align-items: center;
    padding: 1.25rem;
    margin-bottom: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

body.light .mobile-wallet-item {
    background: rgba(0, 0, 0, 0.03);
}

.mobile-wallet-item:hover {
    background: rgba(129, 103, 169, 0.15);
    border-color: rgba(129, 103, 169, 0.5);
    transform: translateY(-3px);
}

.mobile-wallet-icon {
    font-size: 2rem;
    margin-right: 1rem;
    width: 50px;
    text-align: center;
}

.mobile-wallet-info {
    flex: 1;
}

.mobile-wallet-name {
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
    font-family: 'Montserrat', sans-serif;
}

body.light .mobile-wallet-name {
    color: #1f2029;
}

.mobile-wallet-status {
    font-size: 0.9rem;
    color: #4CAF50;
    font-weight: 600;
}

/* Deep Link Button */
.mobile-wallet-deeplink {
    border-top: 1px solid rgba(129, 103, 169, 0.2);
    padding-top: 1.5rem;
    text-align: center;
}

.mobile-wallet-deeplink p {
    margin-bottom: 1rem;
    color: #c4c3ca;
    font-size: 0.9rem;
}

body.light .mobile-wallet-deeplink p {
    color: #666;
}

.deeplink-btn {
    background: linear-gradient(135deg, #8153a9, #a68ccd);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    font-family: 'Montserrat', sans-serif;
}

.deeplink-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(129, 103, 169, 0.4);
}

/* QR Code */
.qr-code-container {
    text-align: center;
    padding: 1rem;
}

.qr-code {
    background: white;
    padding: 1rem;
    border-radius: 12px;
    display: inline-block;
}

.qr-placeholder {
    background: #f0f0f0;
    padding: 2rem;
    border-radius: 8px;
    margin-top: 1rem;
    color: #333;
    font-family: monospace;
}

/* Mobile Responsive */
@media (max-width: 480px) {
    .mobile-wallet-content {
        margin: 5% auto;
        width: 95%;
    }
    
    .mobile-wallet-item {
        padding: 1rem;
    }
    
    .mobile-wallet-icon {
        font-size: 1.75rem;
        margin-right: 0.75rem;
    }
    
    .mobile-wallet-name {
        font-size: 1rem;
    }
}

/* Touch improvements */
@media (hover: none) and (pointer: coarse) {
    .mobile-wallet-item {
        min-height: 60px;
    }
    
    .deeplink-btn {
        min-height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}
`;

// CSS ni qo'shish
const mobileStyleSheet = document.createElement('style');
mobileStyleSheet.textContent = mobileWalletStyles;
document.head.appendChild(mobileStyleSheet);

// DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("📱 Mobile DOM ready");
    setTimeout(initMobileSwap, 500);
});