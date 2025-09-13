/**
 * Example usage of WalletStatusManager singleton
 * Demonstrates the complete wallet status management lifecycle
 */

import {
  // Singleton manager and utilities
  walletStatusManager,
  getWalletStatus,
  getWalletAddress,
  isWalletConnected,
  isWalletVerified,
  connectWallet,
  verifyWallet,
  disconnectWallet,
  subscribeToWalletStatus,
  
  // Types and enums
  WalletStatus,
  WalletConnectionState,
  
  // React hook (for React components)
  useWalletStatus
} from '@johnqh/lib';

// =============================================================================
// Example 1: Direct singleton usage (vanilla JS/TS)
// =============================================================================

function demonstrateBasicUsage() {
  console.log('=== Basic Wallet Status Usage ===');
  
  // Initial state - no wallet connected
  console.log('Initial status:', getWalletStatus()); // undefined
  console.log('Is connected:', isWalletConnected()); // false
  console.log('Is verified:', isWalletVerified()); // false
  
  // Connect wallet
  const testAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  connectWallet(testAddress);
  
  console.log('After connect:');
  console.log('Status:', getWalletStatus()); // { walletAddress: "0x742d..." }
  console.log('Address:', getWalletAddress()); // "0x742d..."
  console.log('Is connected:', isWalletConnected()); // true
  console.log('Is verified:', isWalletVerified()); // false
  console.log('Connection state:', walletStatusManager.getConnectionState()); // "connected"
  
  // Verify wallet
  const message = 'Authenticate with 0xMail\nNonce: 123456';
  const signature = '0x1234567890abcdef...'; // Mock signature
  verifyWallet(testAddress, message, signature);
  
  console.log('After verify:');
  console.log('Status:', getWalletStatus()); // { walletAddress, message, signature }
  console.log('Is verified:', isWalletVerified()); // true
  console.log('Connection state:', walletStatusManager.getConnectionState()); // "verified"
  
  // Disconnect wallet
  disconnectWallet();
  
  console.log('After disconnect:');
  console.log('Status:', getWalletStatus()); // undefined
  console.log('Is connected:', isWalletConnected()); // false
}

// =============================================================================
// Example 2: Event listener usage
// =============================================================================

function demonstrateEventListeners() {
  console.log('=== Event Listener Usage ===');
  
  // Subscribe to status changes
  const unsubscribe = subscribeToWalletStatus((status) => {
    console.log('Wallet status changed:', status);
    
    if (!status) {
      console.log('→ Wallet disconnected');
    } else if (status.message && status.signature) {
      console.log('→ Wallet verified:', status.walletAddress);
    } else {
      console.log('→ Wallet connected:', status.walletAddress);
    }
  });
  
  // Trigger status changes
  console.log('Connecting wallet...');
  connectWallet('0x742d35Cc6e3c05652aA6E10f35F74c29C5881398');
  
  console.log('Verifying wallet...');
  verifyWallet(
    '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398',
    'Auth message',
    'signature123'
  );
  
  console.log('Disconnecting wallet...');
  disconnectWallet();
  
  // Cleanup listener
  unsubscribe();
}

// =============================================================================
// Example 3: Advanced manager operations
// =============================================================================

function demonstrateAdvancedOperations() {
  console.log('=== Advanced Operations ===');
  
  const address1 = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const address2 = '0x8ba1f109551bD432803012645Hac136c';
  
  // Start with verified wallet
  verifyWallet(address1, 'test message', 'test signature');
  console.log('Initial verified status:', getWalletStatus());
  
  // Update address while preserving verification
  walletStatusManager.updateWalletAddress(address2);
  console.log('After address update:', getWalletStatus());
  // Should have new address but same message/signature
  
  // Clear verification while keeping connected
  walletStatusManager.clearVerification();
  console.log('After clearing verification:', getWalletStatus());
  // Should have address only, no message/signature
  
  // Reset for next example
  disconnectWallet();
}

// =============================================================================
// Example 4: React hook usage (pseudo-code)
// =============================================================================

function WalletComponent() {
  const {
    status,
    walletAddress,
    isConnected,
    isVerified,
    connectionState,
    connectWallet,
    verifyWallet,
    disconnectWallet,
    updateWalletAddress,
    clearVerification
  } = useWalletStatus();
  
  // Handle wallet connection
  const handleConnect = async () => {
    try {
      // Mock getting address from wallet provider
      const mockAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
      connectWallet(mockAddress);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };
  
  // Handle wallet verification
  const handleVerify = async () => {
    if (!walletAddress) return;
    
    try {
      // Mock message signing
      const message = 'Authenticate with 0xMail';
      const mockSignature = '0x1234567890abcdef...';
      verifyWallet(walletAddress, message, mockSignature);
    } catch (error) {
      console.error('Failed to verify wallet:', error);
    }
  };
  
  // Render based on wallet state
  if (!isConnected) {
    return (
      <button onClick={handleConnect}>
        Connect Wallet
      </button>
    );
  }
  
  if (!isVerified) {
    return (
      <div>
        <p>Connected: {walletAddress}</p>
        <p>Status: {connectionState}</p>
        <button onClick={handleVerify}>Verify Wallet</button>
        <button onClick={() => clearVerification()}>Clear Verification</button>
        <button onClick={disconnectWallet}>Disconnect</button>
      </div>
    );
  }
  
  return (
    <div>
      <p>✅ Verified: {walletAddress}</p>
      <p>Message: {status?.message}</p>
      <p>Status: {connectionState}</p>
      <button onClick={disconnectWallet}>Disconnect</button>
    </div>
  );
}

// =============================================================================
// Example 5: Type guard usage
// =============================================================================

function demonstrateTypeGuards() {
  console.log('=== Type Guards Usage ===');
  
  import { 
    isWalletConnected as typeIsConnected,
    isWalletVerified as typeIsVerified,
    getWalletConnectionState 
  } from '@johnqh/lib';
  
  function handleStatus(status: WalletStatus | undefined) {
    if (!typeIsConnected(status)) {
      console.log('No wallet connected');
      return;
    }
    
    // TypeScript knows status is WalletStatus here
    console.log('Wallet address:', status.walletAddress);
    
    if (typeIsVerified(status)) {
      // TypeScript knows all properties are defined
      console.log('Message:', status.message);
      console.log('Signature:', status.signature);
    }
    
    const state = getWalletConnectionState(status);
    switch (state) {
      case WalletConnectionState.CONNECTED:
        console.log('Wallet connected but not verified');
        break;
      case WalletConnectionState.VERIFIED:
        console.log('Wallet fully verified');
        break;
      case WalletConnectionState.DISCONNECTED:
        console.log('Wallet disconnected');
        break;
    }
  }
  
  // Test with different states
  handleStatus(undefined); // No wallet
  handleStatus({ walletAddress: '0x123' }); // Connected only
  handleStatus({ 
    walletAddress: '0x123', 
    message: 'msg', 
    signature: 'sig' 
  }); // Fully verified
}

// =============================================================================
// Run all examples
// =============================================================================

export function runWalletStatusExamples() {
  console.log('🚀 Running Wallet Status Singleton Examples\n');
  
  demonstrateBasicUsage();
  console.log('\n');
  
  demonstrateEventListeners();
  console.log('\n');
  
  demonstrateAdvancedOperations();
  console.log('\n');
  
  demonstrateTypeGuards();
  console.log('\n');
  
  console.log('✅ All examples completed!');
}

// Export for potential usage
export { WalletComponent };

// Example: How to use in your app
/*
// In your main app file
import { runWalletStatusExamples } from '@johnqh/lib/examples/wallet-status-example';

// Run examples
runWalletStatusExamples();

// In React components
import { useWalletStatus } from '@johnqh/lib';
function App() {
  return <WalletComponent />;
}

// In vanilla JS/TS
import { 
  connectWallet, 
  verifyWallet, 
  subscribeToWalletStatus 
} from '@johnqh/lib';

connectWallet('0x742d35Cc6e3c05652aA6E10f35F74c29C5881398');
*/