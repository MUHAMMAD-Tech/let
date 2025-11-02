// Import Web3Modal HTML SDK (EVM support)
import {
  EthereumClient,
  w3mProvider,
  w3mConnectors,
  WagmiCore,
  WagmiCoreChains
} from "https://unpkg.com/@web3modal/ethereum@2.6.2";

import { Web3Modal } from "https://unpkg.com/@web3modal/html@2.6.2";

// Destructure wagmi core utilities
const { configureChains, createConfig, getAccount, fetchBalance } = WagmiCore;
const { mainnet, polygon, bsc, arbitrum, sepolia } = WagmiCoreChains;

// ✅ WalletConnect Project ID (replace with your own)
const projectId = "b56e18d47c72ab683b10814fe9495694";

// ✅ Configure supported chains
const chains = [mainnet, polygon, bsc, arbitrum, sepolia];

// ✅ Configure wagmi with chains and providers
const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient
});

// ✅ Create EthereumClient for Web3Modal
const ethereumClient = new EthereumClient(wagmiConfig, chains);

// ✅ Initialize Web3Modal
const web3modal = new Web3Modal({
  projectId,
  themeMode: "dark",
  accentColor: "teal",
}, ethereumClient);

// ✅ Listen for connection updates
setInterval(async () => {
  const account = getAccount(wagmiConfig);
  const addrDiv = document.getElementById("address");
  
  if (account?.address) {
    try {
      const balance = await fetchBalance(wagmiConfig, { address: account.address });
      addrDiv.textContent = `Connected: ${account.address}\nBalance: ${balance.formatted} ${balance.symbol}`;
    } catch {
      addrDiv.textContent = `Connected: ${account.address}`;
    }
  } else {
    addrDiv.textContent = "";
  }
}, 2000);