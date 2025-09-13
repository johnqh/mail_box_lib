# Wallet Status Singleton

A centralized wallet status management system using the singleton pattern to maintain consistent wallet state across the entire application.

## Overview

The WalletStatusManager provides a single source of truth for wallet connection and verification status. It manages three states:

- **Undefined**: No wallet connected  
- **Connected**: Wallet connected with address only  
- **Verified**: Wallet connected and verified with message + signature  

## Architecture

```typescript
// Singleton Manager
WalletStatusManager (singleton)
├── status: WalletStatus | undefined
├── listeners: Set<WalletStatusChangeListener>
└── methods: connect, verify, disconnect, subscribe

// React Integration
useWalletStatus() → reactive access to manager
├── status, isConnected, isVerified
├── connectWallet, verifyWallet, disconnectWallet
└── auto-subscribes to manager changes

// Type Guards & Utilities
isWalletConnected(status) → boolean
isWalletVerified(status) → boolean  
getWalletConnectionState(status) → enum
```

## Basic Usage

### Singleton Manager (Direct Access)

```typescript
import { 
  walletStatusManager, 
  connectWallet, 
  verifyWallet, 
  disconnectWallet,
  getWalletStatus,
  subscribeToWalletStatus
} from '@johnqh/lib';

// Connect wallet
connectWallet('0x742d35Cc6e3c05652aA6E10f35F74c29C5881398');

// Verify wallet
verifyWallet(
  '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398',
  'Authenticate with 0xMail',  
  '0x1234567890abcdef...'
);

// Check current status
const status = getWalletStatus();
console.log('Wallet:', status?.walletAddress);
console.log('Verified:', status?.message && status?.signature);

// Listen to changes
const unsubscribe = subscribeToWalletStatus((status) => {
  console.log('Wallet status changed:', status);
});

// Disconnect
disconnectWallet(); // status becomes undefined
```

### React Hook (Recommended for Components)

```typescript
import { useWalletStatus } from '@johnqh/lib';

function WalletComponent() {
  const {
    status,
    walletAddress,
    isConnected,
    isVerified,
    connectionState,
    connectWallet,
    verifyWallet, 
    disconnectWallet
  } = useWalletStatus();

  const handleConnect = async () => {
    // Get address from wallet provider
    const address = await window.ethereum?.request({
      method: 'eth_requestAccounts'
    });
    connectWallet(address[0]);
  };

  const handleVerify = async () => {
    const message = 'Authenticate with 0xMail';
    const signature = await window.ethereum?.request({
      method: 'personal_sign',
      params: [message, walletAddress]
    });
    verifyWallet(walletAddress!, message, signature);
  };

  if (!isConnected) {
    return <button onClick={handleConnect}>Connect Wallet</button>;
  }

  if (!isVerified) {
    return (
      <div>
        <p>Connected: {walletAddress}</p>
        <button onClick={handleVerify}>Verify Wallet</button>
        <button onClick={disconnectWallet}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      <p>✅ Verified: {walletAddress}</p>
      <button onClick={disconnectWallet}>Disconnect</button>
    </div>
  );
}
```

## Advanced Usage

### Lightweight Hooks

For performance-sensitive components that only need specific data:

```typescript
import { useWalletAddress, useWalletConnectionState } from '@johnqh/lib';

// Only subscribe to address changes
function AddressDisplay() {
  const address = useWalletAddress();
  return <span>{address || 'Not connected'}</span>;
}

// Only subscribe to connection state
function ConnectionIndicator() {
  const state = useWalletConnectionState();
  return <div className={`indicator ${state}`}>{state}</div>;
}
```

### Type Guards

For safe type handling:

```typescript
import { 
  isWalletConnected, 
  isWalletVerified, 
  getWalletConnectionState,
  WalletConnectionState 
} from '@johnqh/lib';

function handleWalletStatus(status: WalletStatus | undefined) {
  if (!isWalletConnected(status)) {
    console.log('No wallet connected');
    return;
  }
  
  // TypeScript knows status is WalletStatus here
  console.log('Address:', status.walletAddress);
  
  if (isWalletVerified(status)) {
    // TypeScript knows all properties are defined
    console.log('Message:', status.message);
    console.log('Signature:', status.signature);
  }
  
  const state = getWalletConnectionState(status);
  switch (state) {
    case WalletConnectionState.CONNECTED:
      console.log('Connected but not verified');
      break;
    case WalletConnectionState.VERIFIED:
      console.log('Fully verified');
      break;
  }
}
```

### Manager Operations

Advanced wallet status manipulation:

```typescript
import { walletStatusManager } from '@johnqh/lib';

// Update address while preserving verification
walletStatusManager.updateWalletAddress('0x8ba1f109551bD432803012645Hac136c');

// Clear verification but keep connected  
walletStatusManager.clearVerification();

// Subscribe with cleanup
const unsubscribe = walletStatusManager.subscribe((status) => {
  // Handle status changes
  updateUI(status);
});

// Component cleanup
useEffect(() => {
  return unsubscribe; // Auto-cleanup on unmount
}, []);
```

## Integration Patterns

### With Authentication Flow

```typescript
class AuthService {
  async connectWallet(): Promise<string> {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    const address = accounts[0];
    
    connectWallet(address);
    return address;
  }
  
  async verifyWallet(address: string): Promise<void> {
    const nonce = await this.getNonce(address);
    const message = `Authenticate with 0xMail\nNonce: ${nonce}`;
    
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address]
    });
    
    // Verify signature on backend
    await this.validateSignature(address, message, signature);
    
    // Update singleton with verified status
    verifyWallet(address, message, signature);
  }
}
```

### With State Persistence

```typescript
import { useWalletStatus } from '@johnqh/lib';

function App() {
  const { status, connectWallet } = useWalletStatus();
  
  // Restore wallet on app start
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress && !status) {
      connectWallet(savedAddress);
    }
  }, []);
  
  // Persist wallet address
  useEffect(() => {
    if (status?.walletAddress) {
      localStorage.setItem('walletAddress', status.walletAddress);
    } else {
      localStorage.removeItem('walletAddress');
    }
  }, [status?.walletAddress]);
}
```

### Multi-Component Sync

All components automatically sync through the singleton:

```typescript
// Component A
function HeaderWallet() {
  const { walletAddress, disconnectWallet } = useWalletStatus();
  return walletAddress ? (
    <button onClick={disconnectWallet}>
      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
    </button>
  ) : null;
}

// Component B  
function ProfilePage() {
  const { isVerified, status } = useWalletStatus();
  return isVerified ? (
    <div>Welcome {status?.walletAddress}</div>
  ) : (
    <div>Please verify your wallet</div>
  );
}

// Component C
function SendTransaction() {
  const { isVerified, walletAddress } = useWalletStatus();
  
  if (!isVerified) return <div>Wallet not verified</div>;
  
  return <button>Send from {walletAddress}</button>;
}
```

## Error Handling

```typescript
import { walletStatusManager } from '@johnqh/lib';

try {
  walletStatusManager.connectWallet(''); // Throws error
} catch (error) {
  console.error('Connection failed:', error.message);
  // "Wallet address is required"
}

try {
  walletStatusManager.verifyWallet('0x123', '', 'sig'); // Throws error
} catch (error) {
  console.error('Verification failed:', error.message);
  // "Message is required for verification"
}
```

## Testing

```typescript
import { walletStatusManager } from '@johnqh/lib';

describe('MyComponent', () => {
  beforeEach(() => {
    // Reset singleton state before each test
    walletStatusManager.reset();
  });
  
  it('should handle wallet connection', () => {
    const { result } = renderHook(() => useWalletStatus());
    
    act(() => {
      result.current.connectWallet('0x742d35Cc...');
    });
    
    expect(result.current.isConnected).toBe(true);
  });
});
```

## State Diagram

```
┌─────────────┐    connectWallet()     ┌───────────┐
│ DISCONNECTED│───────────────────────→│ CONNECTED │
│   (undefined)│                        │(address)  │
└─────────────┘                        └───────────┘
       ▲                                      │
       │                                      │ verifyWallet()
       │ disconnectWallet()                   ▼
       │                               ┌──────────┐
       └───────────────────────────────│ VERIFIED │
                                       │(addr+sig)│
                                       └──────────┘
```

## Benefits

✅ **Single Source of Truth** - Consistent wallet state across app  
✅ **Reactive Updates** - Components auto-sync when status changes  
✅ **Type Safety** - Full TypeScript support with type guards  
✅ **Memory Efficient** - Singleton pattern prevents duplicate state  
✅ **Event-Driven** - Listener pattern for real-time updates  
✅ **Framework Agnostic** - Core logic works with any UI framework  
✅ **Testing Friendly** - Easy to mock and reset for tests  

## API Reference

### WalletStatus Interface
```typescript
interface WalletStatus {
  walletAddress: string;
  message?: string;
  signature?: string;
}
```

### WalletConnectionState Enum
```typescript
enum WalletConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTED = 'connected', 
  VERIFIED = 'verified'
}
```

### Manager Methods
- `connectWallet(address)` - Connect wallet with address
- `verifyWallet(address, message, signature)` - Verify wallet  
- `disconnectWallet()` - Disconnect wallet
- `updateWalletAddress(address)` - Update address preserving verification
- `clearVerification()` - Clear verification keeping connection
- `subscribe(listener)` - Subscribe to changes
- `getStatus()` - Get current status
- `getConnectionState()` - Get connection state

### Hook Returns
- `status` - Current wallet status
- `walletAddress` - Current address  
- `connectionState` - Current state enum
- `isConnected` - Boolean connected status
- `isVerified` - Boolean verified status
- Action functions (connect, verify, disconnect, etc.)

This singleton provides a robust foundation for wallet management across any Web3 application.