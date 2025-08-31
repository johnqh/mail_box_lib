import { useCallback, useState } from 'react';
import { EmailAddress } from '../../../types/email';
import { getENSNames } from '../../../utils/nameservice/ens';
import { getSNSNames } from '../../../utils/nameservice/sns';
import { detectAddressType } from '../../../utils/blockchain/addressDetection';
import { ChainType } from '../../../business/core/enums';

export interface UseEmailAddressesReturn {
  emailAddresses: EmailAddress[];
  isLoading: boolean;
  error: string | null;
  refreshEmailAddresses: (
    walletAddress: string,
    chainType?: ChainType
  ) => Promise<EmailAddress[]>;
}

/**
 * Custom hook to manage email address generation from wallet and ENS/SNS data
 * Handles the orchestration of fetching and creating email addresses
 */
export const useEmailAddresses = (): UseEmailAddressesReturn => {
  const [emailAddresses, setEmailAddresses] = useState<EmailAddress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create primary wallet email address
   */
  const createWalletEmailAddress = useCallback(
    (walletAddress: string): EmailAddress => {
      return {
        id: '1',
        email: `${walletAddress.toLowerCase()}@0xmail.box`,
        name: 'Wallet Address',
        isPrimary: true,
        isActive: true,
      };
    },
    []
  );

  /**
   * Fetch and create SNS-based email addresses for Solana wallets
   */
  const createSNSEmailAddresses = useCallback(
    async (walletAddress: string, startId: number): Promise<EmailAddress[]> => {
      const snsEmailAddresses: EmailAddress[] = [];

      try {
        const snsNames = await getSNSNames(walletAddress);

        snsNames.forEach((snsName, index) => {
          snsEmailAddresses.push({
            id: `sns_${startId + index}`,
            email: `${snsName.name}@0xmail.box`,
            name: snsName.name,
            isPrimary: false,
            isActive: true,
          });
        });

      } catch (error) {
        console.error('Error fetching SNS names:', error);
        // Don't throw - just return empty array to keep other addresses
        return [];
      }

      return snsEmailAddresses;
    },
    []
  );

  /**
   * Fetch and create ENS-based email addresses
   */
  const createENSEmailAddresses = useCallback(
    async (walletAddress: string, startId: number): Promise<EmailAddress[]> => {
      const ensEmailAddresses: EmailAddress[] = [];

      try {
        const ensNames = await getENSNames(walletAddress);



        ensNames.forEach((ensName, index) => {
          const emailAddress = {
            id: `ens_${startId + index}`,
            email: `${ensName.name}@0xmail.box`,
            name: ensName.name,
            isPrimary: false,
            isActive: true,
          };

          ensEmailAddresses.push(emailAddress);
        });

      } catch (error) {
        console.error('❌ Error fetching ENS names:', error);
        // Don't throw - just return empty array to keep other addresses
        // This prevents ENS failures from removing all email addresses
        return [];
      }

      return ensEmailAddresses;
    },
    []
  );

  /**
   * Generate all email addresses for a given wallet address with progressive enhancement
   * Returns wallet address immediately, then enhances with ENS/SNS names
   */
  const generateEmailAddresses = useCallback(
    async (
      walletAddress: string,
      chainType: ChainType = ChainType.UNKNOWN,
      progressCallback?: (addresses: EmailAddress[]) => void
    ): Promise<EmailAddress[]> => {
      const allEmailAddresses: EmailAddress[] = [];
      const errors: string[] = [];
      let idCounter = 2; // Start from 2 since wallet address uses ID 1

      // Always add the primary wallet address first for immediate UI response
      allEmailAddresses.push(createWalletEmailAddress(walletAddress));

      // Call progress callback with wallet address immediately
      progressCallback?.(allEmailAddresses);

      // Prepare parallel fetching of name services
      const fetchPromises: Promise<EmailAddress[]>[] = [];

      if (chainType === ChainType.SOLANA) {
        // For Solana, fetch SNS names
        fetchPromises.push(
          createSNSEmailAddresses(walletAddress, idCounter).catch(error => {
            errors.push(
              `SNS: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return []; // Return empty array on error to continue processing
          })
        );
      } else if (chainType === ChainType.EVM) {
        // For EVM, fetch ENS addresses
        fetchPromises.push(
          createENSEmailAddresses(walletAddress, idCounter).catch(error => {
            errors.push(
              `ENS: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return []; // Return empty array on error to continue processing
          })
        );
      } else if (chainType === ChainType.UNKNOWN) {
        // For unknown chain type, try both ENS and SNS in parallel to auto-detect
        fetchPromises.push(
          createENSEmailAddresses(walletAddress, idCounter).catch(error => {
            return [];
          }),
          createSNSEmailAddresses(walletAddress, idCounter + 100).catch(
            error => {
              return [];
            }
          )
        );
      }

      // Execute all name service lookups in parallel
      if (fetchPromises.length > 0) {
        try {
          const results = await Promise.all(fetchPromises);

          // Combine all results and add to addresses
          results.forEach(addresses => {
            allEmailAddresses.push(...addresses);
            idCounter += addresses.length;
          });

          // Call progress callback with enhanced addresses
          progressCallback?.(allEmailAddresses);
        } catch (error) {
        }
      }


      return allEmailAddresses;
    },
    [createWalletEmailAddress, createSNSEmailAddresses, createENSEmailAddresses]
  );

  /**
   * Refresh email addresses for a given wallet address with progressive enhancement
   * Returns wallet address immediately, then enhances with ENS/SNS names
   */
  const refreshEmailAddresses = useCallback(
    async (
      walletAddress: string,
      chainType?: ChainType
    ): Promise<EmailAddress[]> => {
      if (!walletAddress) {
        setEmailAddresses([]);
        setError('No wallet address provided');
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        const detectedChainType = chainType || detectAddressType(walletAddress);

        // Progressive enhancement: show wallet address immediately, then add name service addresses
        const progressCallback = (addresses: EmailAddress[]) => {
          setEmailAddresses([...addresses]); // Create new array to trigger React re-render
        };

        const newEmailAddresses = await generateEmailAddresses(
          walletAddress,
          detectedChainType,
          progressCallback
        );

        // Final update with all addresses
        setEmailAddresses(newEmailAddresses);
        setError(null);

        return newEmailAddresses;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to generate email addresses';
        console.error('Error generating email addresses:', errorMessage);

        // Even on error, ensure we have at least the wallet address
        const fallbackAddresses = [createWalletEmailAddress(walletAddress)];
        setEmailAddresses(fallbackAddresses);
        setError(errorMessage);
        return fallbackAddresses;
      } finally {
        setIsLoading(false);
      }
    },
    [generateEmailAddresses, createWalletEmailAddress]
  );

  // Return the hook interface
  return {
    emailAddresses,
    isLoading,
    error,
    refreshEmailAddresses,
  };
};
