// Real swap ishlatish
async function performRealSwap() {
    try {
        await window.realSwapSystem.init();
        
        // Wallet ulash
        await window.realSwapSystem.connectWallet('metamask');
        
        // Real swap bajarish
        const result = await window.realSwapSystem.executeRealSwap('ETH', 'USDT', 0.1);
        
        console.log('✅ Real swap successful:', result);
    } catch (error) {
        console.error('❌ Real swap failed:', error);
    }
}