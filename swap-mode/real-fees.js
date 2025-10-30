// real-fees.js - Haqiqiy fee collection
class RealFeeCollector {
    constructor() {
        this.feeWallets = {
            'ethereum': '0xdad4a54a9729d0baa221d16d5e9f331d77946c65',
            'bsc': '0xdad4a54a9729d0baa221d16d5e9f331d77946c65',
            'polygon': '0xdad4a54a9729d0baa221d16d5e9f331d77946c65',
            'solana': 'G7rYiTT3fkkUXH6WN4PvMtZMJwuSk4yLBtv7mD8gN5vP'
        };
        
        this.feePercentage = 0.08; // 0.08%
    }

    async collectFee(amount, token, chain, userWallet) {
        try {
            const feeAmount = amount * (this.feePercentage / 100);
            console.log(`💰 Collecting fee: ${feeAmount} ${token.symbol}`);

            if (chain === 'solana') {
                await this.collectSolanaFee(feeAmount, token, userWallet);
            } else {
                await this.collectEVMFee(feeAmount, token, chain, userWallet);
            }

            this.trackFeeCollection(feeAmount, token, chain);
            return feeAmount;
        } catch (error) {
            console.error('Fee collection error:', error);
            throw new Error(`Fee collection failed: ${error.message}`);
        }
    }

    async collectEVMFee(feeAmount, token, chain, userWallet) {
        const { signer } = userWallet;
        const feeWallet = this.feeWallets[chain];

        if (token.address === 'native') {
            // Native token fee (ETH, BNB, MATIC)
            const tx = await signer.sendTransaction({
                to: feeWallet,
                value: ethers.utils.parseEther(feeAmount.toString()),
                gasLimit: 21000
            });
            console.log('💸 Native fee sent:', tx.hash);
            await tx.wait();
        } else {
            // ERC20 token fee
            const tokenContract = new ethers.Contract(token.address, [
                "function transfer(address to, uint256 amount) returns (bool)"
            ], signer);

            const feeAmountWei = ethers.utils.parseUnits(feeAmount.toString(), token.decimals);
            const tx = await tokenContract.transfer(feeWallet, feeAmountWei);
            console.log('💸 Token fee sent:', tx.hash);
            await tx.wait();
        }
    }

    async collectSolanaFee(feeAmount, token, userWallet) {
        const { signer, userAddress } = userWallet;
        const feeWallet = this.feeWallets.solana;

        const connection = new window.solanaWeb3.Connection(
            window.solanaWeb3.clusterApiUrl('mainnet-beta')
        );

        if (token.address === 'So11111111111111111111111111111111111111112') {
            // SOL fee
            const transaction = new window.solanaWeb3.Transaction().add(
                window.solanaWeb3.SystemProgram.transfer({
                    fromPubkey: new window.solanaWeb3.PublicKey(userAddress),
                    toPubkey: new window.solanaWeb3.PublicKey(feeWallet),
                    lamports: feeAmount * 1e9
                })
            );

            const signature = await signer.sendTransaction(transaction, connection);
            console.log('💸 SOL fee sent:', signature);
        } else {
            // SPL token fee
            const transaction = new window.solanaWeb3.Transaction().add(
                window.solanaWeb3.Token.createTransferInstruction(
                    window.solanaWeb3.TOKEN_PROGRAM_ID,
                    new window.solanaWeb3.PublicKey(token.address),
                    new window.solanaWeb3.PublicKey(feeWallet),
                    new window.solanaWeb3.PublicKey(userAddress),
                    [],
                    feeAmount * Math.pow(10, token.decimals)
                )
            );

            const signature = await signer.sendTransaction(transaction, connection);
            console.log('💸 SPL token fee sent:', signature);
        }
    }

    trackFeeCollection(feeAmount, token, chain) {
        const feeData = {
            amount: feeAmount,
            token: token.symbol,
            chain: chain,
            timestamp: new Date().toISOString(),
            wallet: this.feeWallets[chain]
        };

        // LocalStorage ga saqlash
        try {
            const existingFees = JSON.parse(localStorage.getItem('realFees') || '[]');
            existingFees.push(feeData);
            localStorage.setItem('realFees', JSON.stringify(existingFees));
        } catch (e) {
            console.log('Failed to save fee data');
        }

        // Serverga yuborish (optional)
        this.sendToServer(feeData);
    }

    async sendToServer(feeData) {
        try {
            // O'zingizning serveringizga yuborish
            await fetch('https://your-api.com/track-fee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feeData)
            });
        } catch (error) {
            console.log('Server fee tracking failed');
        }
    }

    getTotalFees() {
        try {
            const fees = JSON.parse(localStorage.getItem('realFees') || '[]');
            return fees.reduce((total, fee) => total + fee.amount, 0);
        } catch (e) {
            return 0;
        }
    }
}