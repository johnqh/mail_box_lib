# Wallet Status Integration - Quick Start

Use the wallet status hook to create a reactive wallet button for your top bar.

## 🚀 Quick Setup

### 1. Import the Hook

```typescript
import { useWalletStatus } from '@johnqh/lib';
```

### 2. Replace Your Wallet Button

```tsx
function TopBar() {
  const {
    walletAddress,
    isConnected,
    isVerified,
    connectionState,
    connectWallet,
    verifyWallet,
    disconnectWallet
  } = useWalletStatus();

  const handleWalletAction = async () => {
    if (isVerified) {
      disconnectWallet();
    } else if (isConnected) {
      // Verify wallet
      const message = `Authenticate with 0xMail\nNonce: ${Date.now()}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });
      verifyWallet(walletAddress!, message, signature);
    } else {
      // Connect wallet
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      connectWallet(accounts[0]);
    }
  };

  return (
    <header>
      {/* Your existing content */}
      
      {/* 🎯 Replace your wallet button with this */}
      <button
        onClick={handleWalletAction}
        className={`wallet-btn ${
          isVerified ? 'verified' : isConnected ? 'connected' : 'disconnected'
        }`}
      >
        {isVerified 
          ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
          : isConnected 
            ? 'Verify Wallet'
            : 'Connect Wallet'
        }
      </button>
    </header>
  );
}
```

## ✨ Features

- **🔄 Auto-sync** - All components automatically update when wallet state changes
- **🎨 State-aware** - Different styles for disconnected/connected/verified states  
- **⚡ Optimized** - Singleton pattern prevents duplicate state management
- **🔒 Type-safe** - Full TypeScript support with proper interfaces
- **🧪 Testable** - Easy to mock wallet states for testing

## 📋 Button States

| State | Appearance | Action |
|-------|------------|--------|
| **Disconnected** | "Connect Wallet" (Blue) | Connects wallet |
| **Connected** | "Verify Wallet" (Yellow) | Signs message |
| **Verified** | "0x742d...1398" (Green) | Disconnects wallet |

## 🎨 Styling

```css
.wallet-btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors;
}

.wallet-btn.disconnected {
  @apply bg-blue-600 hover:bg-blue-700 text-white;
}

.wallet-btn.connected {
  @apply bg-yellow-600 hover:bg-yellow-700 text-white;
}

.wallet-btn.verified {
  @apply bg-green-600 hover:bg-green-700 text-white;
}
```

## 🔧 Advanced Usage

See the full documentation:
- **[Top Bar Integration Guide](./TOP_BAR_WALLET_INTEGRATION.md)** - Complete integration patterns
- **[Wallet Status Singleton](./WALLET_STATUS_SINGLETON.md)** - Detailed API reference
- **[Example Components](../examples/TopBarWalletButton.tsx)** - Ready-to-use components

## 🛠️ Migration Tool

Find components that need updating:

```bash
node scripts/find-wallet-components.js /path/to/your/project
```

This will scan your project and identify wallet-related components that can benefit from the hook migration.