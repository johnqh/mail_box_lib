import { getENSNames } from './ens';
import { getSNSNames } from './sns';

// Test ENS resolution with a known address
export async function testENSResolution() {
  console.log('🧪 Testing ENS resolution...');
  
  // Test with the user's specific address
  const userAddress = '0x03280150272c3B45071bEbD4A937d250D151Db46';
  console.log('Testing with user\'s address:', userAddress);
  
  try {
    const ensNames = await getENSNames(userAddress);
    console.log('ENS names found for user address:', ensNames);
  } catch (error) {
    console.error('ENS test failed for user address:', error);
  }
  
  // Test with vitalik.eth address for comparison
  const vitalikAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  console.log('Testing with Vitalik\'s address for comparison:', vitalikAddress);
  
  try {
    const ensNames = await getENSNames(vitalikAddress);
    console.log('ENS names found for Vitalik:', ensNames);
  } catch (error) {
    console.error('ENS test failed:', error);
  }
  
  // Test with a Solana address (example)
  const solanaAddress = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy';
  console.log('Testing SNS with Solana address:', solanaAddress);
  
  try {
    const snsNames = await getSNSNames(solanaAddress);
    console.log('SNS names found:', snsNames);
  } catch (error) {
    console.error('SNS test failed:', error);
  }
}

// Export for easy testing in console
if (typeof window !== 'undefined') {
  (window as any).testENSResolution = testENSResolution;
}