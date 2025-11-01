import { getENSNames } from './ens';
import { getSNSNames } from './sns';

// Test ENS resolution with a known address
export async function testENSResolution() {
  // Test with the user's specific address
  const userAddress = '0x03280150272c3B45071bEbD4A937d250D151Db46';

  try {
    await getENSNames(userAddress);
  } catch (error) {
    console.error('ENS test failed for user address:', error);
  }

  // Test with vitalik.eth address for comparison
  const vitalikAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

  try {
    await getENSNames(vitalikAddress);
  } catch (error) {
    console.error('ENS test failed:', error);
  }

  // Test with a Solana address (example)
  const solanaAddress = 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy';

  try {
    await getSNSNames(solanaAddress);
  } catch (error) {
    console.error('SNS test failed:', error);
  }
}

// Export for easy testing in console
if (typeof window !== 'undefined') {
  (window as any).testENSResolution = testENSResolution;
}
