// real-transactions.js - Haqiqiy blockchain transactions
class RealTransaction {
    constructor() {
        this.gasLimits = {
            'approve': 100000,
            'swap': 300000,
            'transfer': 50000
        };
    }

    async executeSwap(swapData, wallet, fromToken, toToken, amount) {
        try {
            console.log('🚀 Executing real swap transaction...');

            if (wallet.currentChainId === 'solana') {
                return await this.executeSolanaSwap(swapData, wallet);
            } else {
                return await this.executeEVMSwap(swapData, wallet, fromToken, amount);
            }
        } catch (error) {
            console.error('Transaction execution error:', error);
            throw new Error(`Swap failed: ${error.message}`);
        }
    }

    async executeEVMSwap(swapData, wallet, fromToken, amount) {
        const { signer, userAddress } = wallet;

        // Check if approval is needed for tokens
        if (fromToken.address !== 'native') {
            await this.checkAndApprove(fromToken, swapData.tx.to, amount, wallet);
        }

        // Execute swap
        let tx;
        if (fromToken.address === 'native') {
            // Native token swap (ETH, BNB, MATIC)
            tx = await signer.sendTransaction({
                to: swapData.tx.to,
                value: swapData.tx.value,
                data: swapData.tx.data,
                gasLimit: this.gasLimits.swap
            });
        } else {
            // ERC20 token swap
            tx = await signer.sendTransaction({
                to: swapData.tx.to,
                data: swapData.tx.data,
                gasLimit: this.gasLimits.swap
            });
        }

        console.log('📦 Transaction sent:', tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('✅ Transaction confirmed:', receipt.transactionHash);
        
        return receipt.transactionHash;
    }

    async executeSolanaSwap(swapData, wallet) {
        const { signer } = wallet;

        // Decode transaction
        const transaction = bs58.decode(swapData.swapTransaction);
        
        // Sign transaction
        const signedTransaction = await signer.signTransaction(
            window.solanaWeb3.Transaction.from(transaction)
        );
        
        // Send transaction
        const signature = await signer.sendRawTransaction(signedTransaction.serialize());
        console.log('📦 Solana transaction sent:', signature);
        
        // Wait for confirmation
        const connection = new window.solanaWeb3.Connection(
            window.solanaWeb3.clusterApiUrl('mainnet-beta')
        );
        
        const confirmation = await connection.confirmTransaction(signature);
        console.log('✅ Solana transaction confirmed:', signature);
        
        return signature;
    }

    async checkAndApprove(token, spender, amount, wallet) {
        const { signer, userAddress } = wallet;
        
        const tokenContract = new ethers.Contract(token.address, [
            "function approve(address spender, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ], signer);

        // Check current allowance
        const currentAllowance = await tokenContract.allowance(userAddress, spender);
        const requiredAllowance = ethers.utils.parseUnits(amount.toString(), token.decimals);

        if (currentAllowance.lt(requiredAllowance)) {
            console.log('🔓 Approving token...');
            
            const approveTx = await tokenContract.approve(spender, requiredAllowance, {
                gasLimit: this.gasLimits.approve
            });
            
            console.log('⏳ Waiting for approval confirmation...');
            await approveTx.wait();
            console.log('✅ Token approved');
        }
    }

    async getTransactionStatus(txHash, chain) {
        try {
            if (chain === 'solana') {
                return await this.getSolanaTransactionStatus(txHash);
            } else {
                return await this.getEVMTransactionStatus(txHash, chain);
            }
        } catch (error) {
            console.error('Status check error:', error);
            return 'unknown';
        }
    }

    async getEVMTransactionStatus(txHash, chain) {
        const provider = this.getProviderForChain(chain);
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (!receipt) return 'pending';
        return receipt.status === 1 ? 'success' : 'failed';
    }

    async getSolanaTransactionStatus(txHash) {
        const connection = new window.solanaWeb3.Connection(
            window.solanaWeb3.clusterApiUrl('mainnet-beta')
        );
        
        const status = await connection.getSignatureStatus(txHash);
        if (!status.value) return 'pending';
        return status.value.confirmationStatus === 'confirmed' ? 'success' : 'pending';
    }

    getProviderForChain(chain) {
        const rpcUrls = {
            'ethereum': 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
            'bsc': 'https://bsc-dataseed.binance.org/',
            'polygon': 'https://polygon-rpc.com/'
        };
        
        return new ethers.providers.JsonRpcProvider(rpcUrls[chain] || rpcUrls.ethereum);
    }
}