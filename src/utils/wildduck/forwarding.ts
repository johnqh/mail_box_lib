import axios from 'axios';

/**
 * Configuration for WildDuck API client
 */
export interface WildDuckConfig {
  apiUrl: string;
  accessToken: string;
}

/**
 * Forwarding target - can be email, SMTP relay, or HTTP webhook
 * Examples:
 * - Email: "user@example.com"
 * - SMTP: "smtp://mx.example.com:25" or "smtps://smtp.example.com:465"
 * - HTTP: "http://example.com/webhook" or "https://example.com/webhook"
 */
export type ForwardingTarget = string;

/**
 * Response from getting forwarding targets
 */
export interface ForwardingTargetsResponse {
  success: boolean;
  targets?: ForwardingTarget[];
}

/**
 * Create an axios instance configured for WildDuck API
 */
function createWildDuckClient(config: WildDuckConfig): ReturnType<typeof axios.create> {
  // Use Authorization Bearer header for user tokens (returned from /authenticate)
  return axios.create({
    baseURL: config.apiUrl,
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Get current forwarding targets for a user
 * GET /users/:user
 */
export async function getForwardingTargets(
  config: WildDuckConfig,
  userId: string
): Promise<ForwardingTarget[]> {
  const client = createWildDuckClient(config);
  const response = await client.get<any>(`/users/${userId}`);
  return response.data.targets || [];
}

/**
 * Update forwarding targets (replaces entire targets array)
 * PUT /users/:user
 */
export async function updateForwardingTargets(
  config: WildDuckConfig,
  userId: string,
  targets: ForwardingTarget[],
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  const client = createWildDuckClient(config);
  const response = await client.put<any>(`/users/${userId}`, {
    targets,
    sess,
    ip,
  });
  return response.data;
}

/**
 * Add a single forwarding target to existing targets
 * GET /users/:user -> PUT /users/:user
 */
export async function addForwardingTarget(
  config: WildDuckConfig,
  userId: string,
  target: ForwardingTarget,
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  const currentTargets = await getForwardingTargets(config, userId);

  // Avoid duplicates
  if (currentTargets.includes(target)) {
    return { success: true };
  }

  const updatedTargets = [...currentTargets, target];
  return updateForwardingTargets(config, userId, updatedTargets, sess, ip);
}

/**
 * Remove a forwarding target by value
 * GET /users/:user -> PUT /users/:user
 */
export async function removeForwardingTarget(
  config: WildDuckConfig,
  userId: string,
  target: ForwardingTarget,
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  const currentTargets = await getForwardingTargets(config, userId);
  const updatedTargets = currentTargets.filter(t => t !== target);
  return updateForwardingTargets(config, userId, updatedTargets, sess, ip);
}
