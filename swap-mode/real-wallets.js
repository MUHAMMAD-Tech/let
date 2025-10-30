// real-wallets-fixed.js - Tuzatilgan wallet connection
class RealWalletConnector {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.currentChainId = null;
        this.isConnected = false;
    }

    // MetaMask connection - FIXED
    async connectMetaMask() {
        console.log('🔍 Checking for MetaMask...');
        
        // MetaMask ni tekshirish
        if (typeof window.ethereum === 'undefined') {
            console.log('❌ window.ethereum not found');
            throw new Error('MetaMask not installed. Please install MetaMask browser extension.');
        }

        // MetaMask provider ni tekshirish
        if (!window.ethereum.isMetaMask && !window.ethereum.selectedAddress) {
            console.log('❌ MetaMask provider not detected');
            throw new Error('MetaMask not detected. Make sure MetaMask is installed and unlocked.');
        }

        console.log('✅ MetaMask detected, requesting accounts...');

        try {
            // Accounts ni so'rash
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            console.log('📨 Accounts response:', accounts);

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found. Please make sure your wallet is unlocked.');
            }

            this.userAddress = accounts[0];
            console.log('✅ User address:', this.userAddress);

            // Provider va signer ni yaratish
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();
            
            // Network ma'lumotlarini olish
            const network = await this.provider.getNetwork();
            this.currentChainId = network.chainId;
            console.log('✅ Network chainId:', this.currentChainId);

            // Event listeners
            this.setupEventListeners();

            this.isConnected = true;

            return {
                address: this.userAddress,
                chainId: this.currentChainId,
                provider: this.provider,
                signer: this.signer,
                isConnected: true
            };

        } catch (error) {
            console.error('❌ MetaMask connection error:', error);
            
            if (error.code === 4001) {
                throw new Error('Connection rejected by user.');
            } else if (error.code === -32002) {
                throw new Error('Connection request already pending. Please check MetaMask.');
            } else {
                throw new Error(`MetaMask connection failed: ${error.message}`);
            }
        }
    }

    // Phantom connection - FIXED
    async connectPhantom() {
        console.log('🔍 Checking for Phantom...');
        
        const solana = window.solana || window.phantom;
        
        if (!solana) {
            console.log('❌ Phantom not found');
            throw new Error('Phantom not installed. Please install Phantom wallet extension.');
        }

        if (!solana.isPhantom) {
            console.log('❌ Phantom provider not detected');
            throw new Error('Phantom wallet not detected properly.');
        }

        console.log('✅ Phantom detected, connecting...');

        try {
            // Phantom ga ulanish
            const response = await solana.connect();
            console.log('📨 Phantom connection response:', response);

            this.userAddress = response.publicKey.toString();
            this.provider = { isSolana: true, connection: solana };
            this.signer = solana;
            this.currentChainId = 'solana';
            this.isConnected = true;

            console.log('✅ Phantom connected, address:', this.userAddress);

            // Event listeners
            solana.on('disconnect', () => this.handleDisconnect());

            return {
                address: this.userAddress,
                chainId: this.currentChainId,
                provider: this.provider,
                signer: this.signer,
                isConnected: true
            };

        } catch (error) {
            console.error('❌ Phantom connection error:', error);
            
            if (error.code === 4001) {
                throw new Error('Connection rejected by user.');
            } else {
                throw new Error(`Phantom connection failed: ${error.message}`);
            }
        }
    }

    // Trust Wallet connection - FIXED
    async connectTrustWallet() {
        console.log('🔍 Checking for Trust Wallet...');
        
        if (typeof window.ethereum === 'undefined') {
            console.log('❌ window.ethereum not found');
            throw new Error('Trust Wallet not installed. Please install Trust Wallet mobile app or browser extension.');
        }

        // Trust Wallet ni tekshirish
        const isTrustWallet = window.ethereum.isTrust || 
                             (window.ethereum.providers && 
                              window.ethereum.providers.some(p => p.isTrust));

        if (!isTrustWallet && !window.ethereum.selectedAddress) {
            console.log('❌ Trust Wallet not detected');
            throw new Error('Trust Wallet not detected. Make sure Trust Wallet is installed and unlocked.');
        }

        console.log('✅ Trust Wallet detected, requesting accounts...');

        try {
            // Trust Wallet MetaMask compatible bo'lgani uchun
            return await this.connectMetaMask();
        } catch (error) {
            console.error('❌ Trust Wallet connection error:', error);
            throw new Error(`Trust Wallet connection failed: ${error.message}`);
        }
    }

    // Wallet detection - YANGI
    detectAvailableWallets() {
        const availableWallets = [];

        // MetaMask ni tekshirish
        if (typeof window.ethereum !== 'undefined') {
            if (window.ethereum.isMetaMask) {
                availableWallets.push({
                    id: 'metamask',
                    name: 'MetaMask',
                    icon: '🦊',
                    available: true
                });
            }
            
            if (window.ethereum.isTrust) {
                availableWallets.push({
                    id: 'trustwallet',
                    name: 'Trust Wallet',
                    icon: '🔒',
                    available: true
                });
            }

            // Agar hech qaysi wallet aniqlanmasa, lekin ethereum mavjud bo'lsa
            if (availableWallets.length === 0 && window.ethereum.selectedAddress) {
                availableWallets.push({
                    id: 'metamask',
                    name: 'EVM Wallet',
                    icon: '🦊',
                    available: true
                });
            }
        }

        // Phantom ni tekshirish
        if (window.solana || window.phantom) {
            const solana = window.solana || window.phantom;
            if (solana.isPhantom) {
                availableWallets.push({
                    id: 'phantom',
                    name: 'Phantom',
                    icon: '👻',
                    available: true
                });
            }
        }

        console.log('🎯 Detected wallets:', availableWallets);
        return availableWallets;
    }

    setupEventListeners() {
        if (window.ethereum) {
            // Accounts o'zgarishi
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('🔄 Accounts changed:', accounts);
                this.handleAccountsChanged(accounts);
            });

            // Network o'zgarishi
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('🔄 Chain changed:', chainId);
                this.handleChainChanged(chainId);
            });

            // Disconnect
            window.ethereum.on('disconnect', (error) => {
                console.log('🔌 Disconnected:', error);
                this.handleDisconnect();
            });
        }
    }

    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.handleDisconnect();
        } else {
            this.userAddress = accounts[0];
            this.updateUI();
        }
    }

    handleChainChanged(chainId) {
        this.currentChainId = parseInt(chainId, 16);
        this.updateUI();
    }

    handleDisconnect() {
        this.userAddress = null;
        this.provider = null;
        this.signer = null;
        this.currentChainId = null;
        this.isConnected = false;
        this.updateUI();
    }

    updateUI() {
        // UI ni yangilash
        if (typeof window.updateSwapUI === 'function') {
            window.updateSwapUI(this.userAddress, this.currentChainId, this.isConnected);
        }
    }

    // Disconnect funksiyasi
    disconnect() {
        this.handleDisconnect();
    }

    // Connection holatini tekshirish
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            address: this.userAddress,
            chainId: this.currentChainId,
            provider: this.provider ? 'connected' : 'disconnected'
        };
    }

    // Balance olish - FIXED
    async getBalance(tokenAddress = null) {
        if (!this.isConnected || !this.userAddress) {
            throw new Error('Wallet not connected');
        }

        try {
            if (this.currentChainId === 'solana') {
                return await this.getSolanaBalance(tokenAddress);
            } else {
                return await this.getEVMBalance(tokenAddress);
            }
        } catch (error) {
            console.error('Balance check error:', error);
            throw new Error(`Balance check failed: ${error.message}`);
        }
    }

    async getEVMBalance(tokenAddress) {
        if (!tokenAddress || tokenAddress === 'native') {
            // Native token balance (ETH, BNB, MATIC)
            const balance = await this.provider.getBalance(this.userAddress);
            return ethers.utils.formatEther(balance);
        } else {
            // ERC20 token balance
            const contract = new ethers.Contract(tokenAddress, [
                "function balanceOf(address) view returns (uint256)",
                "function decimals() view returns (uint8)"
            ], this.provider);
            
            const balance = await contract.balanceOf(this.userAddress);
            const decimals = await contract.decimals();
            return ethers.utils.formatUnits(balance, decimals);
        }
    }

    async getSolanaBalance(tokenAddress) {
        try {
            const connection = new window.solanaWeb3.Connection(
                window.solanaWeb3.clusterApiUrl('mainnet-beta')
            );
            
            if (!tokenAddress || tokenAddress === 'So11111111111111111111111111111111111111112') {
                // SOL balance
                const balance = await connection.getBalance(
                    new window.solanaWeb3.PublicKey(this.userAddress)
                );
                return (balance / 1e9).toString();
            } else {
                // SPL token balance
                const tokenAccounts = await connection.getTokenAccountsByOwner(
                    new window.solanaWeb3.PublicKey(this.userAddress),
                    { mint: new window.solanaWeb3.PublicKey(tokenAddress) }
                );
                
                if (tokenAccounts.value.length > 0) {
                    const balance = await connection.getTokenAccountBalance(
                        tokenAccounts.value[0].pubkey
                    );
                    return balance.value.uiAmount.toString();
                }
                return '0';
            }
        } catch (error) {
            console.error('Solana balance error:', error);
            throw new Error('Failed to get Solana balance');
        }
    }
}