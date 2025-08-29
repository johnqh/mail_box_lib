/**
 * Wallet debugging utilities to help diagnose signing issues
 */

import { ChainType } from './addressDetection';

export interface WalletDebugInfo {
  chainType: ChainType;
  address: string | null;
  isConnected: boolean;
  walletProvider: string | null;
  diagnostics: string[];
  recommendations: string[];
}

/**
 * Generate diagnostic information for wallet issues
 */
export const generateWalletDiagnostics = (
  chainType: ChainType,
  address: string | null,
  isConnected: boolean,
  error?: Error
): WalletDebugInfo => {
  const diagnostics: string[] = [];
  const recommendations: string[] = [];

  // Basic connection checks
  if (!isConnected) {
    diagnostics.push('Wallet is not connected');
    recommendations.push('Please connect your wallet first');
  }

  if (!address) {
    diagnostics.push('No wallet address detected');
    recommendations.push('Ensure your wallet is unlocked and connected');
  }

  // Chain-specific diagnostics
  if (chainType === 'solana') {
    const windowObj = window as any;
    
    // Check for Solana providers
    const hasPhantom = !!windowObj.phantom?.solana;
    const hasSolflare = !!windowObj.solflare;
    const hasSollet = !!windowObj.sollet;
    
    diagnostics.push(`Phantom detected: ${hasPhantom}`);
    diagnostics.push(`Solflare detected: ${hasSolflare}`);
    diagnostics.push(`Sollet detected: ${hasSollet}`);

    if (!hasPhantom && !hasSolflare && !hasSollet) {
      recommendations.push('Install a Solana wallet like Phantom or Solflare');
    }

    // Check if wallet is connected to Solana
    if (hasPhantom && windowObj.phantom?.solana?.isConnected === false) {
      recommendations.push('Connect your Phantom wallet to this site');
    }

  } else if (chainType === 'evm') {
    const windowObj = window as any;
    
    // Check for Ethereum providers
    const hasEthereum = !!windowObj.ethereum;
    const isMetaMask = !!windowObj.ethereum?.isMetaMask;
    const isCoinbase = !!windowObj.ethereum?.isCoinbaseWallet;
    const isTrust = !!windowObj.ethereum?.isTrust;
    
    diagnostics.push(`Ethereum provider detected: ${hasEthereum}`);
    diagnostics.push(`MetaMask detected: ${isMetaMask}`);
    diagnostics.push(`Coinbase Wallet detected: ${isCoinbase}`);
    diagnostics.push(`Trust Wallet detected: ${isTrust}`);

    if (!hasEthereum) {
      recommendations.push('Install an Ethereum wallet like MetaMask');
    }

    // Check network
    if (hasEthereum && windowObj.ethereum.networkVersion) {
      const networkId = windowObj.ethereum.networkVersion;
      diagnostics.push(`Network ID: ${networkId}`);
    }
  }

  // Error-specific diagnostics
  if (error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
      diagnostics.push('User cancelled the signing request');
      recommendations.push('Please approve the signature request in your wallet');
    } else if (errorMessage.includes('wallet not connected')) {
      diagnostics.push('Wallet connection lost during signing');
      recommendations.push('Refresh the page and reconnect your wallet');
    } else if (errorMessage.includes('invalid signature')) {
      diagnostics.push('Signature format validation failed');
      recommendations.push('Try disconnecting and reconnecting your wallet');
    } else if (errorMessage.includes('timeout')) {
      diagnostics.push('Signing request timed out');
      recommendations.push('Try again and approve the request more quickly');
    } else if (errorMessage.includes('insufficient funds')) {
      diagnostics.push('Insufficient funds for transaction');
      recommendations.push('Note: Signing messages is free and does not require funds');
    } else {
      diagnostics.push(`Unexpected error: ${error.message}`);
      recommendations.push('Try refreshing the page and reconnecting your wallet');
    }
  }

  // Detect wallet provider
  let walletProvider = 'Unknown';
  if (chainType === 'solana') {
    const windowObj = window as any;
    if (windowObj.phantom?.solana) walletProvider = 'Phantom';
    else if (windowObj.solflare) walletProvider = 'Solflare';
    else if (windowObj.sollet) walletProvider = 'Sollet';
  } else if (chainType === 'evm') {
    const windowObj = window as any;
    if (windowObj.ethereum?.isMetaMask) walletProvider = 'MetaMask';
    else if (windowObj.ethereum?.isCoinbaseWallet) walletProvider = 'Coinbase Wallet';
    else if (windowObj.ethereum?.isTrust) walletProvider = 'Trust Wallet';
    else if (windowObj.ethereum?.isRainbow) walletProvider = 'Rainbow';
    else if (windowObj.ethereum) walletProvider = 'Generic Ethereum Wallet';
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('If the issue persists, try refreshing the page');
    recommendations.push('Make sure your wallet is updated to the latest version');
  }

  return {
    chainType,
    address,
    isConnected,
    walletProvider,
    diagnostics,
    recommendations
  };
};

/**
 * Log detailed wallet diagnostics to console
 */
export const logWalletDiagnostics = (
  chainType: ChainType,
  address: string | null,
  isConnected: boolean,
  error?: Error
): void => {
  const info = generateWalletDiagnostics(chainType, address, isConnected, error);
  
  console.group('🔍 Wallet Diagnostics');
  console.log('Chain Type:', info.chainType);
  console.log('Address:', info.address);
  console.log('Connected:', info.isConnected);
  console.log('Provider:', info.walletProvider);
  
  console.group('📊 Diagnostics:');
  info.diagnostics.forEach(diag => console.log('-', diag));
  console.groupEnd();
  
  console.group('💡 Recommendations:');
  info.recommendations.forEach(rec => console.log('-', rec));
  console.groupEnd();
  
  if (error) {
    console.group('❌ Error Details:');
    console.error(error);
    console.groupEnd();
  }
  
  console.groupEnd();
};