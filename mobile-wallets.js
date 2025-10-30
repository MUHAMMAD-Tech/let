// mobile-wallets.js - Mobil walletlar uchun alohida fayl

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

    checkMetaMask() {
        if (this.isMobile) {
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
        window.open(url, '_blank');
        
        setTimeout(() => {
            window.location.href = url;
        }, 500);
    }

    openDeepLink() {
        const defaultWallet = this.detectedWallets[0] || this.supportedWallets.metamask;
        if (defaultWallet && defaultWallet.mobileUrl) {
            this.openWalletDeepLink(defaultWallet.mobileUrl);
        }
    }

    setupDeepLinks() {
        const urlParams = new URLSearchParams(window.location.search);
        const walletParam = urlParams.get('wallet');
        
        if (walletParam && this.supportedWallets[walletParam]) {
            this.connectMobileWallet(walletParam);
        }
    }

    async connectMetaMask() {
        try {
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

    async connectWalletConnect() {
        updateStatus('WalletConnect coming soon for mobile...', 'info');
        return false;
    }

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
}

// Global mobile wallet connector
let mobileWalletConnector;

// Mobile init funksiyasi
function initMobileWallets() {
    console.log("📱 Initializing mobile wallets...");
    mobileWalletConnector = new MobileWalletConnector();
}

// Mobile event listenerlari
function setupMobileEventListeners() {
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', () => {
            if (mobileWalletConnector && mobileWalletConnector.isMobile) {
                mobileWalletConnector.showMobileModal();
            } else {
                // Desktop uchun boshqa modal
                if (typeof walletConnector !== 'undefined') {
                    walletConnector.showWalletModal();
                }
            }
        });
    }
}