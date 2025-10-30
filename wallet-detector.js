// wallet-detector.js - Walletlarni avtomatik aniqlash
class WalletDetector {
    constructor() {
        this.detectedWallets = [];
    }

    init() {
        this.detectWallets();
        this.createWalletSelector();
    }

    detectWallets() {
        this.detectedWallets = [];
        
        console.log('🔍 Scanning for available wallets...');

        if (typeof window.ethereum !== 'undefined') {
            if (window.ethereum.isMetaMask) {
                this.detectedWallets.push({
                    id: 'metamask',
                    name: 'MetaMask',
                    icon: '🦊',
                    description: 'Ethereum Wallet',
                    available: true,
                    type: 'evm'
                });
            }
            
            if (window.ethereum.isTrust) {
                this.detectedWallets.push({
                    id: 'trustwallet',
                    name: 'Trust Wallet',
                    icon: '🔒', 
                    description: 'Multi-chain Wallet',
                    available: true,
                    type: 'evm'
                });
            }

            if (window.ethereum.selectedAddress && this.detectedWallets.length === 0) {
                this.detectedWallets.push({
                    id: 'evm',
                    name: 'EVM Wallet',
                    icon: '💰',
                    description: 'Ethereum Compatible Wallet',
                    available: true,
                    type: 'evm'
                });
            }
        }

        if (window.solana && window.solana.isPhantom) {
            this.detectedWallets.push({
                id: 'phantom',
                name: 'Phantom',
                icon: '👻',
                description: 'Solana Wallet',
                available: true,
                type: 'solana'
            });
        }

        if (window.ethereum && window.ethereum.isCoinbaseWallet) {
            this.detectedWallets.push({
                id: 'coinbase',
                name: 'Coinbase Wallet',
                icon: '🏦',
                description: 'Coinbase Wallet',
                available: true,
                type: 'evm'
            });
        }

        console.log('✅ Detected wallets:', this.detectedWallets);
        return this.detectedWallets;
    }

    createWalletSelector() {
        if (document.getElementById('walletSelector')) return;

        const selectorHTML = `
            <div id="walletSelector" class="wallet-selector-modal" style="display: none;">
                <div class="wallet-selector-content">
                    <div class="wallet-selector-header">
                        <h3>Select Wallet</h3>
                        <span class="close-selector">&times;</span>
                    </div>
                    <div class="wallet-selector-body">
                        <div id="detectedWalletsList" class="wallets-list">
                        </div>
                        <div class="wallet-install-links">
                            <p>Don't have a wallet?</p>
                            <div class="install-buttons">
                                <a href="https://metamask.io/download/" target="_blank" class="install-btn">
                                    Install MetaMask
                                </a>
                                <a href="https://phantom.app/download" target="_blank" class="install-btn">
                                    Install Phantom
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', selectorHTML);
        this.setupSelectorEvents();
        this.updateWalletList();
    }

    setupSelectorEvents() {
        const modal = document.getElementById('walletSelector');
        const closeBtn = document.querySelector('.close-selector');

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    updateWalletList() {
        const walletsList = document.getElementById('detectedWalletsList');
        if (!walletsList) return;

        walletsList.innerHTML = '';

        if (this.detectedWallets.length === 0) {
            walletsList.innerHTML = `
                <div class="no-wallets">
                    <p>No wallets detected</p>
                    <p>Please install a wallet to continue</p>
                </div>
            `;
            return;
        }

        this.detectedWallets.forEach(wallet => {
            const walletElement = document.createElement('div');
            walletElement.className = `wallet-item ${wallet.type}`;
            walletElement.innerHTML = `
                <div class="wallet-icon">${wallet.icon}</div>
                <div class="wallet-info">
                    <div class="wallet-name">${wallet.name}</div>
                    <div class="wallet-description">${wallet.description}</div>
                </div>
                <div class="wallet-connect-btn">Connect</div>
            `;

            walletElement.addEventListener('click', () => {
                this.connectWallet(wallet.id);
            });

            walletsList.appendChild(walletElement);
        });
    }

    showSelector() {
        this.detectWallets();
        this.updateWalletList();
        document.getElementById('walletSelector').style.display = 'block';
    }

    async connectWallet(walletId) {
        const modal = document.getElementById('walletSelector');
        modal.style.display = 'none';

        try {
            if (typeof realSwapSystem !== 'undefined') {
                await realSwapSystem.connectWallet(walletId);
            } else {
                console.error('Real swap system not available');
            }
        } catch (error) {
            console.error('Wallet connection failed:', error);
        }
    }
}