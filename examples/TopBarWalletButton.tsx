/**
 * Example TopBar component with integrated wallet status button
 * This demonstrates how to use the wallet status hook in a top bar component
 */

import React, { useCallback } from 'react';
import { 
  useWalletStatus, 
  WalletConnectionState 
} from '@johnqh/lib';

// Mock wallet provider interface (replace with actual wallet provider)
declare global {
  interface Window {
    ethereum?: {
      request: (params: { method: string; params?: any[] }) => Promise<any>;
      isConnected: () => boolean;
    };
  }
}

interface TopBarProps {
  className?: string;
  showLogo?: boolean;
  logoSrc?: string;
  onNavigate?: (path: string) => void;
}

/**
 * TopBar component with integrated wallet status management
 * The rightmost button shows wallet connection state and handles wallet operations
 */
export const TopBarWithWallet: React.FC<TopBarProps> = ({
  className = '',
  showLogo = true,
  logoSrc = '/logo.svg',
  onNavigate
}) => {
  const {
    status,
    walletAddress,
    connectionState,
    isConnected,
    isVerified,
    connectWallet,
    verifyWallet,
    disconnectWallet
  } = useWalletStatus();

  // Handle wallet connection
  const handleConnect = useCallback(async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask or another Web3 wallet');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length > 0) {
        connectWallet(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  }, [connectWallet]);

  // Handle wallet verification
  const handleVerify = useCallback(async () => {
    if (!walletAddress || !window.ethereum) return;

    try {
      // Create authentication message
      const nonce = Date.now().toString();
      const message = `Authenticate with 0xMail\nNonce: ${nonce}`;

      // Request signature from wallet
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });

      // Update wallet status with verification
      verifyWallet(walletAddress, message, signature);
    } catch (error) {
      console.error('Failed to verify wallet:', error);
      alert('Failed to verify wallet. Please try again.');
    }
  }, [walletAddress, verifyWallet]);

  // Handle wallet disconnection
  const handleDisconnect = useCallback(() => {
    disconnectWallet();
  }, [disconnectWallet]);

  // Get button styling based on connection state
  const getButtonStyles = () => {
    const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (connectionState) {
      case WalletConnectionState.VERIFIED:
        return `${baseStyles} bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`;
      case WalletConnectionState.CONNECTED:
        return `${baseStyles} bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500`;
      case WalletConnectionState.DISCONNECTED:
      default:
        return `${baseStyles} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`;
    }
  };

  // Get button text and action based on state
  const getButtonContent = () => {
    switch (connectionState) {
      case WalletConnectionState.VERIFIED:
        return {
          text: `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`,
          action: handleDisconnect,
          icon: '✅'
        };
      case WalletConnectionState.CONNECTED:
        return {
          text: 'Verify Wallet',
          action: handleVerify,
          icon: '⚠️'
        };
      case WalletConnectionState.DISCONNECTED:
      default:
        return {
          text: 'Connect Wallet',
          action: handleConnect,
          icon: '🔗'
        };
    }
  };

  const buttonContent = getButtonContent();

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {showLogo && (
              <div className="flex-shrink-0">
                <img 
                  className="h-8 w-auto" 
                  src={logoSrc} 
                  alt="0xMail.box" 
                />
              </div>
            )}
            
            <nav className="hidden md:flex space-x-6">
              <button
                onClick={() => onNavigate?.('/inbox')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Inbox
              </button>
              <button
                onClick={() => onNavigate?.('/compose')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Compose
              </button>
              <button
                onClick={() => onNavigate?.('/contacts')}
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Contacts
              </button>
            </nav>
          </div>

          {/* Right side - Wallet Status Button */}
          <div className="flex items-center space-x-4">
            {/* Connection status indicator */}
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${
                isVerified ? 'bg-green-500' : 
                isConnected ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              <span className="capitalize">{connectionState}</span>
            </div>

            {/* Main wallet button */}
            <button
              onClick={buttonContent.action}
              className={getButtonStyles()}
              title={
                isVerified ? 'Wallet verified - Click to disconnect' :
                isConnected ? 'Wallet connected - Click to verify' :
                'Click to connect wallet'
              }
            >
              <span className="flex items-center space-x-2">
                <span>{buttonContent.icon}</span>
                <span>{buttonContent.text}</span>
              </span>
            </button>

            {/* Dropdown menu for verified wallets */}
            {isVerified && (
              <div className="relative">
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {/* Dropdown content would go here */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu (optional) */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <button
            onClick={() => onNavigate?.('/inbox')}
            className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-sm font-medium"
          >
            Inbox
          </button>
          <button
            onClick={() => onNavigate?.('/compose')}
            className="text-gray-700 hover:text-gray-900 block px-3 py-2 text-sm font-medium"
          >
            Compose
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * Alternative minimal wallet button component
 * For use in existing top bars where you just want to replace the wallet button
 */
export const WalletStatusButton: React.FC<{
  className?: string;
  variant?: 'primary' | 'secondary' | 'minimal';
}> = ({ className = '', variant = 'primary' }) => {
  const {
    walletAddress,
    connectionState,
    isConnected,
    isVerified,
    connectWallet,
    verifyWallet,
    disconnectWallet
  } = useWalletStatus();

  const handleConnect = useCallback(async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask');
        return;
      }
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      if (accounts.length > 0) {
        connectWallet(accounts[0]);
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  }, [connectWallet]);

  const handleVerify = useCallback(async () => {
    if (!walletAddress || !window.ethereum) return;
    try {
      const message = `Authenticate with 0xMail\nNonce: ${Date.now()}`;
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress]
      });
      verifyWallet(walletAddress, message, signature);
    } catch (error) {
      console.error('Verification failed:', error);
    }
  }, [walletAddress, verifyWallet]);

  // Get variant-specific styling
  const getVariantStyles = () => {
    const base = 'px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    switch (variant) {
      case 'secondary':
        return `${base} border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500`;
      case 'minimal':
        return `${base} text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100 focus:ring-gray-500`;
      case 'primary':
      default:
        if (isVerified) return `${base} bg-green-600 hover:bg-green-700 text-white focus:ring-green-500`;
        if (isConnected) return `${base} bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500`;
        return `${base} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`;
    }
  };

  const onClick = isVerified ? disconnectWallet : isConnected ? handleVerify : handleConnect;
  const text = isVerified 
    ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`
    : isConnected 
      ? 'Verify'
      : 'Connect';

  return (
    <button
      onClick={onClick}
      className={`${getVariantStyles()} ${className}`}
      title={`Wallet ${connectionState}`}
    >
      <span className="flex items-center space-x-2">
        <span className={`w-2 h-2 rounded-full ${
          isVerified ? 'bg-white' : 
          isConnected ? 'bg-white' : 'bg-white opacity-70'
        }`} />
        <span>{text}</span>
      </span>
    </button>
  );
};

export default TopBarWithWallet;