# Top Bar Wallet Integration Guide

This guide shows how to integrate the wallet status hook into your top bar component to create a responsive wallet connection button.

## Overview

The wallet status hook provides reactive wallet state management for your top bar, automatically updating the UI when the wallet connection state changes. The integration handles three states:

- **Disconnected**: Shows "Connect Wallet" button
- **Connected**: Shows "Verify Wallet" button  
- **Verified**: Shows truncated address with disconnect option

## Quick Integration

### Option 1: Replace Existing Top Bar

If you want to replace your entire top bar:

```tsx
import { TopBarWithWallet } from '@johnqh/lib/examples/TopBarWalletButton';

function App() {
  return (
    <div>
      <TopBarWithWallet 
        logoSrc="/your-logo.svg"
        onNavigate={(path) => router.push(path)}
      />
      {/* Rest of your app */}
    </div>
  );
}
```

### Option 2: Add Wallet Button to Existing Top Bar

If you want to keep your existing top bar and just replace the wallet button:

```tsx
import { WalletStatusButton } from '@johnqh/lib/examples/TopBarWalletButton';

function YourExistingTopBar() {
  return (
    <header className="your-header-classes">
      <div className="your-container-classes">
        
        {/* Your existing left side content */}
        <div className="flex items-center">
          <YourLogo />
          <YourNavigation />
        </div>
        
        {/* Replace your wallet button with this */}
        <div className="flex items-center space-x-4">
          <YourOtherButtons />
          
          {/* 🎯 This replaces your existing wallet button */}
          <WalletStatusButton 
            variant="primary" // or 'secondary' or 'minimal'
            className="your-custom-classes"
          />
        </div>
      </div>
    </header>
  );
}
```

### Option 3: Custom Implementation

Create your own wallet button using the hook directly:

```tsx
import { useWalletStatus } from '@johnqh/lib';

function CustomWalletButton() {
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
      // Disconnect
      disconnectWallet();
    } else if (isConnected) {
      // Verify wallet
      try {
        const message = `Authenticate with 0xMail\nNonce: ${Date.now()}`;
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, walletAddress]
        });
        verifyWallet(walletAddress!, message, signature);
      } catch (error) {
        console.error('Verification failed:', error);
      }
    } else {
      // Connect wallet
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        connectWallet(accounts[0]);
      } catch (error) {
        console.error('Connection failed:', error);
      }
    }
  };

  return (
    <button 
      onClick={handleWalletAction}
      className={`your-button-classes ${
        isVerified ? 'verified-state' :
        isConnected ? 'connected-state' : 'disconnected-state'
      }`}
    >
      {isVerified 
        ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
        : isConnected 
          ? 'Verify Wallet'
          : 'Connect Wallet'
      }
    </button>
  );
}
```

## State-Based Styling

The wallet button should reflect the current connection state visually:

### CSS Classes for Different States

```css
/* Disconnected state */
.wallet-button-disconnected {
  @apply bg-blue-600 hover:bg-blue-700 text-white;
}

/* Connected but not verified */
.wallet-button-connected {
  @apply bg-yellow-600 hover:bg-yellow-700 text-white;
}

/* Fully verified */
.wallet-button-verified {
  @apply bg-green-600 hover:bg-green-700 text-white;
}

/* Status indicator dot */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot-disconnected {
  @apply bg-gray-400;
}

.status-dot-connected {
  @apply bg-yellow-500;
}

.status-dot-verified {
  @apply bg-green-500;
}
```

### Dynamic Styling Example

```tsx
import { useWalletStatus, WalletConnectionState } from '@johnqh/lib';

function WalletButtonWithDynamicStyles() {
  const { connectionState, walletAddress, isConnected } = useWalletStatus();

  const getButtonStyles = () => {
    switch (connectionState) {
      case WalletConnectionState.VERIFIED:
        return 'bg-green-600 hover:bg-green-700 text-white';
      case WalletConnectionState.CONNECTED:
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case WalletConnectionState.DISCONNECTED:
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const getStatusIcon = () => {
    switch (connectionState) {
      case WalletConnectionState.VERIFIED:
        return '✅';
      case WalletConnectionState.CONNECTED:
        return '⚠️';
      case WalletConnectionState.DISCONNECTED:
      default:
        return '🔗';
    }
  };

  return (
    <button className={`px-4 py-2 rounded-md font-medium ${getButtonStyles()}`}>
      <span className="flex items-center space-x-2">
        <span>{getStatusIcon()}</span>
        <span>
          {connectionState === WalletConnectionState.VERIFIED 
            ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
            : connectionState.charAt(0).toUpperCase() + connectionState.slice(1)
          }
        </span>
      </span>
    </button>
  );
}
```

## Advanced Features

### Dropdown Menu for Verified Wallets

```tsx
import { useState } from 'react';
import { useWalletStatus } from '@johnqh/lib';

function WalletButtonWithDropdown() {
  const [showDropdown, setShowDropdown] = useState(false);
  const { isVerified, walletAddress, status, disconnectWallet } = useWalletStatus();

  if (!isVerified) {
    return <BasicWalletButton />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
      >
        <span>✅</span>
        <span>{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">Wallet Status</p>
            <p className="text-xs text-gray-600 font-mono mt-1">{walletAddress}</p>
          </div>
          
          <div className="p-2">
            <div className="px-3 py-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-600 font-medium">✅ Verified</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Message:</span>
                <span className="text-xs text-gray-500 truncate ml-2">
                  {status?.message?.slice(0, 20)}...
                </span>
              </div>
            </div>
            
            <hr className="my-2" />
            
            <button
              onClick={() => {
                disconnectWallet();
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Loading States

Handle loading states during wallet operations:

```tsx
import { useState } from 'react';
import { useWalletStatus } from '@johnqh/lib';

function WalletButtonWithLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const { connectionState, walletAddress, connectWallet, verifyWallet } = useWalletStatus();

  const handleAction = async () => {
    setIsLoading(true);
    try {
      if (connectionState === 'disconnected') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        connectWallet(accounts[0]);
      } else if (connectionState === 'connected') {
        const message = `Authenticate with 0xMail\nNonce: ${Date.now()}`;
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, walletAddress]
        });
        verifyWallet(walletAddress!, message, signature);
      }
    } catch (error) {
      console.error('Wallet operation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleAction}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md flex items-center space-x-2"
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      <span>
        {isLoading ? 'Processing...' : 'Connect Wallet'}
      </span>
    </button>
  );
}
```

### Error Handling

```tsx
import { useState } from 'react';
import { useWalletStatus } from '@johnqh/lib';

function WalletButtonWithErrorHandling() {
  const [error, setError] = useState<string | null>(null);
  const { connectWallet } = useWalletStatus();

  const handleConnect = async () => {
    setError(null);
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask or another Web3 wallet');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      connectWallet(accounts[0]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
    }
  };

  return (
    <div className="relative">
      <button onClick={handleConnect} className="wallet-button">
        Connect Wallet
      </button>
      
      {error && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-md shadow-lg z-50">
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-xs text-red-500 hover:text-red-700 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
```

## Testing Integration

Test your wallet button integration:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { walletStatusManager } from '@johnqh/lib';
import YourTopBarComponent from './YourTopBarComponent';

describe('TopBar Wallet Integration', () => {
  beforeEach(() => {
    walletStatusManager.reset();
  });

  it('should show connect button when wallet is disconnected', () => {
    render(<YourTopBarComponent />);
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('should show verify button when wallet is connected', () => {
    walletStatusManager.connectWallet('0x742d35Cc6e3c05652aA6E10f35F74c29C5881398');
    render(<YourTopBarComponent />);
    expect(screen.getByText('Verify Wallet')).toBeInTheDocument();
  });

  it('should show wallet address when verified', () => {
    walletStatusManager.verifyWallet(
      '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398',
      'test message',
      'test signature'
    );
    render(<YourTopBarComponent />);
    expect(screen.getByText('0x742d...1398')).toBeInTheDocument();
  });
});
```

## Migration from Existing Implementation

If you have an existing wallet button, here's how to migrate:

### Before (Manual State Management)
```tsx
// Old implementation with manual state
const [walletAddress, setWalletAddress] = useState<string | undefined>();
const [isConnected, setIsConnected] = useState(false);
const [isVerified, setIsVerified] = useState(false);

// Manual event handlers
const connectWallet = async () => {
  // ... manual logic
  setWalletAddress(address);
  setIsConnected(true);
};
```

### After (Using Wallet Status Hook)
```tsx
// New implementation with hook
const {
  walletAddress,
  isConnected,
  isVerified,
  connectWallet,
  verifyWallet,
  disconnectWallet
} = useWalletStatus();

// Simplified handlers - state management is automatic
const handleConnect = async () => {
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  connectWallet(accounts[0]); // Automatically updates all components
};
```

## Benefits of Integration

✅ **Automatic Synchronization** - All components using the hook stay in sync  
✅ **Simplified State Management** - No manual state updates required  
✅ **Centralized Logic** - Wallet operations managed in one place  
✅ **Type Safety** - Full TypeScript support with proper interfaces  
✅ **Event-Driven Updates** - Components automatically re-render on state changes  
✅ **Memory Efficient** - Single source of truth prevents state duplication  
✅ **Testing Friendly** - Easy to mock wallet states for testing  

The wallet status hook provides a robust foundation for wallet integration in your top bar, handling all the complexity of state management while providing a simple, reactive API for your components.