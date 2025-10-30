// real-swap-main.js - Asosiy real swap integratsiyasi
class RealSwapSystem {
    constructor() {
        this.wallet = new RealWalletConnector();
        this.dex = new RealDEX();
        this.transaction = new RealTransaction();
        this.feeCollector = new RealFeeCollector();
        
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing Real Swap System...');
        this.isInitialized = true;
        
        window.REAL_TOKENS = REAL_TOKENS;
        
        console.log('✅ Real Swap System initialized');
    }

    async connectWallet(walletType = 'metamask') {
        try {
            let connection;
            
            switch (walletType) {
                case 'metamask':
                    connection = await this.wallet.connectMetaMask();
                    break;
                case 'phantom':
                    connection = await this.wallet.connectPhantom();
                    break;
                case 'trustwallet':
                    connection = await this.wallet.connectTrustWallet();
                    break;
                default:
                    throw new Error('Unsupported wallet type');
            }

            return connection;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            throw error;
        }
    }

    async executeRealSwap(fromTokenSymbol, toTokenSymbol, amount) {
        try {
            if (!this.wallet.userAddress) {
                throw new Error('Wallet not connected');
            }

            const chain = this.getCurrentChain();
            const fromToken = REAL_TOKENS[chain][fromTokenSymbol];
            const toToken = REAL_TOKENS[chain][toTokenSymbol];

            if (!fromToken || !toToken) {
                throw new Error('Invalid tokens selected');
            }

            const feeAmount = await this.feeCollector.collectFee(
                amount, fromToken, chain, this.wallet
            );

            const userAmount = amount - feeAmount;

            const quote = await this.dex.getQuote(fromToken, toToken, userAmount, chain);
            
            const swapData = await this.dex.getSwapData(
                fromToken, toToken, userAmount, chain, this.wallet.userAddress
            );

            const txHash = await this.transaction.executeSwap(
                swapData, this.wallet, fromToken, toToken, userAmount
            );

            return {
                success: true,
                txHash: txHash,
                fromAmount: userAmount,
                toAmount: quote.toAmount,
                feeAmount: feeAmount,
                quote: quote
            };

        } catch (error) {
            console.error('Real swap execution failed:', error);
            throw error;
        }
    }

    getCurrentChain() {
        if (this.wallet.currentChainId === 'solana') return 'solana';
        
        const chainMap = {
            1: 'ethereum',
            56: 'bsc', 
            137: 'polygon'
        };
        
        return chainMap[this.wallet.currentChainId] || 'ethereum';
    }

    async getTokenBalance(tokenSymbol) {
        const chain = this.getCurrentChain();
        const token = REAL_TOKENS[chain][tokenSymbol];
        
        if (!token) throw new Error('Token not found');
        
        return await this.wallet.getBalance(token.address);
    }
}

window.realSwapSystem = new RealSwapSystem();