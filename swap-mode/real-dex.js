// real-dex.js - Haqiqiy DEX quotes
class RealDEX {
    constructor() {
        this.providers = {
            '1inch': 'https://api.1inch.io/v4.0/',
            'jupiter': 'https://quote-api.jup.ag/v6/',
            '0x': 'https://api.0x.org/swap/v1/'
        };
    }

    async getQuote(fromToken, toToken, amount, chain) {
        try {
            console.log(`🔄 Getting real quote: ${amount} ${fromToken.symbol} → ${toToken.symbol} on ${chain}`);

            if (chain === 'solana') {
                return await this.getJupiterQuote(fromToken, toToken, amount);
            } else {
                return await this.get1InchQuote(fromToken, toToken, amount, chain);
            }
        } catch (error) {
            console.error('Real quote error:', error);
            throw new Error(`DEX quote failed: ${error.message}`);
        }
    }

    async get1InchQuote(fromToken, toToken, amount, chain) {
        const chainId = this.getChainId(chain);
        const amountInWei = ethers.utils.parseUnits(amount.toString(), fromToken.decimals);

        const response = await fetch(
            `${this.providers['1inch']}${chainId}/quote?` +
            `fromTokenAddress=${fromToken.address}&` +
            `toTokenAddress=${toToken.address}&` +
            `amount=${amountInWei.toString()}`
        );

        if (!response.ok) {
            throw new Error(`1inch API error: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            fromToken: fromToken,
            toToken: toToken,
            fromAmount: amount,
            toAmount: parseFloat(ethers.utils.formatUnits(data.toTokenAmount, toToken.decimals)),
            toAmountWei: data.toTokenAmount,
            estimatedGas: data.estimatedGas,
            protocol: '1inch',
            data: data
        };
    }

    async getJupiterQuote(fromToken, toToken, amount) {
        const amountInLamports = amount * Math.pow(10, fromToken.decimals);

        const response = await fetch(
            `${this.providers['jupiter']}quote?` +
            `inputMint=${fromToken.address}&` +
            `outputMint=${toToken.address}&` +
            `amount=${amountInLamports}&` +
            `slippageBps=50`
        );

        if (!response.ok) {
            throw new Error(`Jupiter API error: ${response.status}`);
        }

        const data = await response.json();
        const toAmount = data.outAmount / Math.pow(10, toToken.decimals);

        return {
            fromToken: fromToken,
            toToken: toToken,
            fromAmount: amount,
            toAmount: toAmount,
            outAmount: data.outAmount,
            priceImpact: data.priceImpactPct,
            protocol: 'Jupiter',
            route: data
        };
    }

    async getSwapData(fromToken, toToken, amount, chain, userAddress) {
        if (chain === 'solana') {
            return await this.getJupiterSwapData(fromToken, toToken, amount, userAddress);
        } else {
            return await this.get1InchSwapData(fromToken, toToken, amount, chain, userAddress);
        }
    }

    async get1InchSwapData(fromToken, toToken, amount, chain, userAddress) {
        const chainId = this.getChainId(chain);
        const amountInWei = ethers.utils.parseUnits(amount.toString(), fromToken.decimals);

        const response = await fetch(
            `${this.providers['1inch']}${chainId}/swap?` +
            `fromTokenAddress=${fromToken.address}&` +
            `toTokenAddress=${toToken.address}&` +
            `amount=${amountInWei.toString()}&` +
            `fromAddress=${userAddress}&` +
            `slippage=1&` +
            `disableEstimate=true`
        );

        if (!response.ok) {
            throw new Error(`1inch swap data error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }

    async getJupiterSwapData(fromToken, toToken, amount, userAddress) {
        const amountInLamports = amount * Math.pow(10, fromToken.decimals);

        const quoteResponse = await fetch(
            `${this.providers['jupiter']}quote?` +
            `inputMint=${fromToken.address}&` +
            `outputMint=${toToken.address}&` +
            `amount=${amountInLamports}&` +
            `slippageBps=50`
        );

        if (!quoteResponse.ok) {
            throw new Error(`Jupiter quote error: ${quoteResponse.status}`);
        }

        const quoteData = await quoteResponse.json();

        const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quoteResponse: quoteData,
                userPublicKey: userAddress,
                wrapUnwrapSOL: true
            })
        });

        if (!swapResponse.ok) {
            throw new Error(`Jupiter swap error: ${swapResponse.status}`);
        }

        const swapData = await swapResponse.json();
        return swapData;
    }

    getChainId(chain) {
        const chains = {
            'ethereum': 1,
            'bsc': 56,
            'polygon': 137,
            'avalanche': 43114,
            'arbitrum': 42161,
            'optimism': 10
        };
        return chains[chain] || 1;
    }
}