/**
 * Utility helper class for Indexer Webhook operations
 * These functions are designed for internal backend communication
 * Note: These endpoints are typically called from backend services, not frontend
 */

import axios from 'axios';

// Configuration interface for indexer webhook endpoints
export interface IndexerWebhookConfig {
  indexerBackendUrl: string;
}

export interface WebhookEmailSent {
  senderAddress: string;
  recipientAddress: string;
  emailId: string;
  chainId?: number;
}

export interface WebhookRecipientLogin {
  recipientAddress: string;
}

export interface WebhookReferralRegistration {
  referrerAddress: string;
  refereeAddress: string;
  referralCode?: string;
  source?: string;
}

export interface WebhookLoginEvent {
  walletAddress: string;
  signature: string;
  message?: string;
  refer?: string;
  referralCode?: string;
}

export interface WebhookLoginResult {
  message: string;
  walletAddress: string;
  results: {
    recipientLogin: boolean;
    referralBonus: boolean;
    referralRegistration: boolean;
    pointsAwarded: number;
  };
}

export interface WebhookResponse {
  success: boolean;
  data: {
    message: string;
  };
}

const getIndexerBaseUrl = (config: IndexerWebhookConfig): string => {
  return config.indexerBackendUrl;
};

/**
 * Indexer Webhook Helper Class
 * Contains methods for webhook operations that are typically called from backend services
 */
export class IndexerWebhookHelper {
  private config: IndexerWebhookConfig;
  
  constructor(config: IndexerWebhookConfig) {
    this.config = config;
  }
  /**
   * Process email sent event
   * This would typically be called from the WildDuck email backend
   */
  async processEmailSent(emailData: WebhookEmailSent): Promise<WebhookResponse> {
    const response = await axios.post(`${getIndexerBaseUrl(this.config)}/webhook/email-sent`, emailData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  /**
   * Process recipient login event
   * This would typically be called from the authentication backend
   */
  async processRecipientLogin(loginData: WebhookRecipientLogin): Promise<WebhookResponse> {
    const response = await axios.post(`${getIndexerBaseUrl(this.config)}/webhook/recipient-login`, loginData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  /**
   * Register referral relationship
   * This would typically be called from the authentication backend
   */
  async registerReferral(referralData: WebhookReferralRegistration): Promise<WebhookResponse> {
    const response = await axios.post(`${getIndexerBaseUrl(this.config)}/points/register-referral`, referralData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  /**
   * Process referee first login for referral bonus
   * This would typically be called from the authentication backend
   */
  async processRefereeLogin(
    walletAddress: string,
    signature: string,
    message?: string
  ): Promise<WebhookResponse> {
    const response = await axios.post(`${getIndexerBaseUrl(this.config)}/points/referee-login`, {
      walletAddress,
      signature,
      message,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  /**
   * Process combined login event (handles recipient login and referral processing)
   * This would typically be called from the authentication backend
   */
  async processLogin(loginData: WebhookLoginEvent): Promise<WebhookLoginResult> {
    const response = await axios.post(`${getIndexerBaseUrl(this.config)}/webhook/login`, loginData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data.data;
  }

  /**
   * Process Solana webhook (for Helius transaction notifications)
   * This would typically be called from Helius webhook service
   */
  async processSolanaWebhook(transactions: unknown[]): Promise<{
    success: boolean;
    processed: number;
    total: number;
  }> {
    const response = await axios.post(`${getIndexerBaseUrl(this.config)}/api/solana/webhook`, transactions, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }
}