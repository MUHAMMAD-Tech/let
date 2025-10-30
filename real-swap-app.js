// real-swap-app-fixed.js - Tuzatilgan app integratsiyasi
class RealSwapApp {
    constructor() {
        this.currentNetwork = 'ethereum';
        this.selectedFromToken = null;
        this.selectedToToken = null;
        this.currentBalance = 0;
        this.walletDetector = new WalletDetector();
        
        this.initializeApp();
    }

    initializeApp() {
        console.log('🚀 Initializing Real Swap App...');
        
        // DOM elementlarni topish
        this.autoConnectBtn = document.getElementById('autoConnectBtn');
        this.networkSelect = document.getElementById('networkSelect');
        this.fromTokenSelect = document.getElementById('fromTokenSelect');
        this.toTokenSelect = document.getElementById('toTokenSelect');
        this.swapAmount = document.getElementById('swapAmount');
        this.realSwapBtn = document.getElementById('realSwapBtn');
        this.walletAddress = document.getElementById('walletAddress');
        this.swapStatus = document.getElementById('swapStatus');
        this.balanceInfo = document.getElementById('balanceInfo');
        this.transactionDetails = document.getElementById('transactionDetails');
        this.txHash = document.getElementById('txHash');
        this.feeInfo = document.getElementById('feeInfo');
        this.quoteInfo = document.getElementById('quoteInfo');

        this.setupEventListeners();
        this.populateTokenSelects();
        
        // Wallet detector ni ishga tushirish
        this.walletDetector.init();
        
        // Real swap system ni ishga tushirish
        if (typeof realSwapSystem !== 'undefined') {
            realSwapSystem.init().then(() => {
                console.log('✅ Real Swap System ready');
                this.updateStatus('Real swap system ready', 'success');
            });
        }

        console.log('✅ Real Swap App initialized');
    }

    setupEventListeners() {
        // Auto connect button
        this.autoConnectBtn.addEventListener('click', () => {
            this.walletDetector.showSelector();
        });

        // Network o'zgarishi
        this.networkSelect.addEventListener('change', (e) => {
            this.currentNetwork = e.target.value;
            this.populateTokenSelects();
            this.updateUI();
        });

        // Token selectlar
        this.fromTokenSelect.addEventListener('change', (e) => {
            this.selectedFromToken = e.target.value;
            this.updateBalanceDisplay();
            this.updateSwapButton();
        });

        this.toTokenSelect.addEventListener('change', (e) => {
            this.selectedToToken = e.target.value;
            this.updateSwapButton();
        });

        // Amount input
        this.swapAmount.addEventListener('input', (e) => {
            this.updateSwapButton();
            this.updateFeeDisplay();
        });

        // Real swap button
        this.realSwapBtn.addEventListener('click', () => this.executeRealSwap());

        // Global UI update funksiyasi
        window.updateSwapUI = (address, chainId, isConnected) => {
            this.updateUI();
        };
    }

    // ... (qolgan funksiyalar o'zgarmaydi)
}

// App ni ishga tushirish
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM fully loaded - Starting Real Swap App');
    window.realSwapApp = new RealSwapApp();
});