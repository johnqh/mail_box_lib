import axios from 'axios';

/**
 * User information response
 */
export interface UserInfo {
  success: boolean;
  id: string;
  username: string;
  name?: string;
  address: string;
  retention?: number;
  enabled2fa?: string[];
  autoreply?: boolean;
  encryptMessages?: boolean;
  encryptForwarded?: boolean;
  pubKey?: string;
  metaData?: Record<string, any>;
  internalData?: Record<string, any>;
  hasPasswordSet?: boolean;
  activated?: boolean;
  disabled?: boolean;
  suspended?: boolean;
  quota: {
    allowed: number;
    used: number;
  };
  targets?: string[];
  spamLevel?: number;
  limits: {
    quota: {
      allowed: number;
      used: number;
    };
    recipients?: {
      allowed: number;
      used: number;
      ttl: number;
    };
    forwards?: {
      allowed: number;
      used: number;
      ttl: number;
    };
    received?: {
      allowed: number;
      used: number;
      ttl: number;
    };
    imapUpload?: {
      allowed: number;
      used: number;
      ttl: number;
    };
    imapDownload?: {
      allowed: number;
      used: number;
      ttl: number;
    };
    pop3Download?: {
      allowed: number;
      used: number;
      ttl: number;
    };
    imapMaxConnections?: {
      allowed: number;
    };
  };
  tags?: string[];
  disabledScopes?: string[];
  fromWhitelist?: string[];
}

/**
 * Configuration for WildDuck API client
 */
export interface WildDuckConfig {
  apiUrl: string;
  accessToken: string;
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
 * Get user information
 * GET /users/:user
 */
export async function getUserInfo(
  config: WildDuckConfig,
  userId: string
): Promise<UserInfo> {
  const client = createWildDuckClient(config);
  const response = await client.get<UserInfo>(`/users/${userId}`);
  return response.data;
}

/**
 * Update user display name
 * PUT /users/:user
 */
export async function updateUserName(
  config: WildDuckConfig,
  userId: string,
  name: string,
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  const client = createWildDuckClient(config);
  const response = await client.put<any>(`/users/${userId}`, {
    name,
    sess,
    ip,
  });
  return response.data;
}

/**
 * Update user settings (general purpose)
 * PUT /users/:user
 */
export async function updateUserSettings(
  config: WildDuckConfig,
  userId: string,
  settings: {
    name?: string;
    language?: string;
    retention?: number;
    quota?: number;
    recipients?: number;
    forwards?: number;
    filters?: number;
    imapMaxUpload?: number;
    imapMaxDownload?: number;
    pop3MaxDownload?: number;
    pop3MaxMessages?: number;
    imapMaxConnections?: number;
    receivedMax?: number;
    disable2fa?: boolean;
    tags?: string[];
    disabledScopes?: string[];
    disabled?: boolean;
    suspended?: boolean;
    sess?: string;
    ip?: string;
  }
): Promise<{ success: boolean }> {
  const client = createWildDuckClient(config);
  const response = await client.put<any>(`/users/${userId}`, settings);
  return response.data;
}
