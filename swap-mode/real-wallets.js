// real-wallets.js - Haqiqiy wallet connection
class RealWalletConnector {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.userAddress = null;
        this.currentChainId = null;
    }

    // MetaMask connection
    async connectMetaMask() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask not installed');
        }

        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
            throw new Error('No accounts found');
        }

        this.userAddress = accounts[0];
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        
        const network = await this.provider.getNetwork();
        this.currentChainId = network.chainId;

        // Event listeners
        window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
        window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));

        return {
            address: this.userAddress,
            chainId: this.currentChainId,
            provider: this.provider,
            signer: this.signer
        };
    }

    // Phantom connection
    async connectPhantom() {
        const solana = window.solana || window.phantom;
        if (!solana) {
            throw new Error('Phantom not installed');
        }

        const response = await solana.connect();
        this.userAddress = response.publicKey.toString();
        this.provider = { isSolana: true, connection: solana };
        this.signer = solana;
        this.currentChainId = 'solana';

        solana.on('disconnect', this.handleDisconnect.bind(this));

        return {
            address: this.userAddress,
            chainId: this.currentChainId,
            provider: this.provider,
            signer: this.signer
        };
    }

    // Trust Wallet connection
    async connectTrustWallet() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('Trust Wallet not installed');
        }

        // Trust Wallet MetaMask compatible
        return await this.connectMetaMask();
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
        this.updateUI();
    }

    updateUI() {
        // UI ni yangilash
        if (typeof window.updateSwapUI === 'function') {
            window.updateSwapUI(this.userAddress, this.currentChainId);
        }
    }

    async getBalance(tokenAddress = null) {
        if (!this.userAddress || !this.provider) {
            throw new Error('Wallet not connected');
        }

        if (this.currentChainId === 'solana') {
            return await this.getSolanaBalance(tokenAddress);
        } else {
            return await this.getEVMBalance(tokenAddress);
        }
    }

    async getEVMBalance(tokenAddress) {
        if (!tokenAddress) {
            // Native token balance
            const balance = await this.provider.getBalance(this.userAddress);
            return ethers.utils.formatEther(balance);
        } else {
            // ERC20 token balance
            const contract = new ethers.Contract(tokenAddress, [
                "function balanceOf(address) view returns (uint256)"
            ], this.provider);
            
            const balance = await contract.balanceOf(this.userAddress);
            const decimals = await contract.decimals();
            return ethers.utils.formatUnits(balance, decimals);
        }
    }

    async getSolanaBalance(tokenAddress) {
        // Solana balance logic
        const connection = new window.solanaWeb3.Connection(
            window.solanaWeb3.clusterApiUrl('mainnet-beta')
        );
        
        if (!tokenAddress || tokenAddress === 'So11111111111111111111111111111111111111112') {
            // SOL balance
            const balance = await connection.getBalance(
                new window.solanaWeb3.PublicKey(this.userAddress)
            );
            return balance / 1e9;
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
                return balance.value.uiAmount;
            }
            return 0;
        }
    }
}