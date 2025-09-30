import axios from 'axios';

/**
 * Configuration for WildDuck API client
 */
export interface WildDuckConfig {
  apiUrl: string;
  accessToken: string;
}

/**
 * SMTP relay configuration
 * Allows users to route outbound mail through a custom SMTP server
 */
export interface SMTPRelay {
  enabled: boolean;
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
}

/**
 * Advanced settings response
 */
export interface AdvancedSettings {
  success: boolean;
  uploadSentMessages?: boolean;
  smtpRelay?: SMTPRelay;
}

/**
 * Create an axios instance configured for WildDuck API
 */
function createWildDuckClient(config: WildDuckConfig): ReturnType<typeof axios.create> {
  return axios.create({
    baseURL: config.apiUrl,
    headers: {
      'X-Access-Token': config.accessToken,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Get advanced settings (uploadSentMessages flag from user info)
 * GET /users/:user
 */
export async function getAdvancedSettings(
  config: WildDuckConfig,
  userId: string
): Promise<AdvancedSettings> {
  const client = createWildDuckClient(config);
  const response = await client.get<any>(`/users/${userId}`);
  return {
    success: response.data.success,
    uploadSentMessages: response.data.uploadSentMessages,
  };
}

/**
 * Update "upload sent messages" setting
 * PUT /users/:user
 * When enabled, messages sent through SMTP are automatically uploaded to the Sent folder
 */
export async function updateUploadSentMessages(
  config: WildDuckConfig,
  userId: string,
  uploadSentMessages: boolean,
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  const client = createWildDuckClient(config);
  const response = await client.put<any>(`/users/${userId}`, {
    uploadSentMessages,
    sess,
    ip,
  });
  return response.data;
}

/**
 * Get SMTP relay settings for a user
 * GET /users/:user/smtp
 */
export async function getSMTPRelay(
  config: WildDuckConfig,
  userId: string
): Promise<SMTPRelay> {
  const client = createWildDuckClient(config);
  try {
    const response = await client.get<any>(`/users/${userId}/smtp`);
    return response.data;
  } catch {
    // If no SMTP relay is configured, return disabled state
    return { enabled: false };
  }
}

/**
 * Update SMTP relay settings
 * PUT /users/:user/smtp
 * @param host - SMTP server hostname
 * @param port - SMTP server port (25, 465, 587)
 * @param secure - Use TLS encryption
 * @param auth - SMTP authentication credentials
 */
export async function updateSMTPRelay(
  config: WildDuckConfig,
  userId: string,
  settings: {
    enabled: boolean;
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  },
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  const client = createWildDuckClient(config);
  const response = await client.put<any>(`/users/${userId}/smtp`, {
    ...settings,
    sess,
    ip,
  });
  return response.data;
}

/**
 * Enable SMTP relay with configuration
 * PUT /users/:user/smtp
 */
export async function enableSMTPRelay(
  config: WildDuckConfig,
  userId: string,
  relay: {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  },
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  return updateSMTPRelay(
    config,
    userId,
    {
      enabled: true,
      ...relay,
    },
    sess,
    ip
  );
}

/**
 * Disable SMTP relay
 * PUT /users/:user/smtp
 */
export async function disableSMTPRelay(
  config: WildDuckConfig,
  userId: string,
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  return updateSMTPRelay(
    config,
    userId,
    {
      enabled: false,
    },
    sess,
    ip
  );
}

/**
 * Delete SMTP relay configuration
 * DELETE /users/:user/smtp
 */
export async function deleteSMTPRelay(
  config: WildDuckConfig,
  userId: string,
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  const client = createWildDuckClient(config);
  const response = await client.delete<any>(`/users/${userId}/smtp`, {
    data: { sess, ip },
  } as any);
  return response.data;
}
