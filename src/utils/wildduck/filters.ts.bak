import axios from 'axios';
import { Optional } from '@johnqh/types';

/**
 * Configuration for WildDuck API client
 */
export interface WildDuckConfig {
  apiUrl: string;
  accessToken: string;
}

/**
 * Filter query condition
 */
export interface FilterQuery {
  from?: string;
  to?: string;
  subject?: string;
  text?: string;
  ha?: boolean;
  size?: number;
}

/**
 * Filter action - forward, reply, delete, or move to mailbox
 */
export interface FilterAction {
  seen?: boolean;
  flag?: boolean;
  delete?: boolean;
  spam?: boolean;
  mailbox?: string;
  forward?: string;
  targetUrl?: string;
}

/**
 * Email filter
 */
export interface EmailFilter {
  id: string;
  name: string;
  query: FilterQuery;
  action: FilterAction;
  disabled?: boolean;
}

/**
 * Response from getting all filters
 */
export interface FiltersResponse {
  success: boolean;
  results: EmailFilter[];
}

/**
 * Response from filter operations
 */
export interface FilterResponse {
  success: boolean;
  id?: string;
}

/**
 * Parameters for creating/updating a filter
 */
export interface FilterParams {
  name: string;
  query: FilterQuery;
  action: FilterAction;
  disabled?: boolean;
  sess?: string;
  ip?: string;
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
 * Get all filters for a user
 * GET /users/:user/filters
 */
export async function getFilters(
  config: WildDuckConfig,
  userId: string
): Promise<EmailFilter[]> {
  const client = createWildDuckClient(config);
  const response = await client.get<any>(`/users/${userId}/filters`);
  return response.data.results || [];
}

/**
 * Get a specific filter by ID
 * GET /users/:user/filters/:filter
 */
export async function getFilter(
  config: WildDuckConfig,
  userId: string,
  filterId: string
): Promise<Optional<EmailFilter>> {
  const client = createWildDuckClient(config);
  try {
    const response = await client.get<any>(`/users/${userId}/filters/${filterId}`);
    return response.data;
  } catch {
    return null;
  }
}

/**
 * Create a new filter
 * POST /users/:user/filters
 */
export async function createFilter(
  config: WildDuckConfig,
  userId: string,
  params: FilterParams
): Promise<FilterResponse> {
  const client = createWildDuckClient(config);
  const response = await client.post<any>(`/users/${userId}/filters`, params);
  return response.data;
}

/**
 * Update an existing filter
 * PUT /users/:user/filters/:filter
 */
export async function updateFilter(
  config: WildDuckConfig,
  userId: string,
  filterId: string,
  params: Partial<FilterParams>
): Promise<{ success: boolean }> {
  const client = createWildDuckClient(config);
  const response = await client.put<any>(`/users/${userId}/filters/${filterId}`, params);
  return response.data;
}

/**
 * Delete a filter
 * DELETE /users/:user/filters/:filter
 */
export async function deleteFilter(
  config: WildDuckConfig,
  userId: string,
  filterId: string,
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  const client = createWildDuckClient(config);
  const response = await client.delete<any>(`/users/${userId}/filters/${filterId}`, {
    data: { sess, ip },
  } as any);
  return response.data;
}

/**
 * Enable a filter
 * PUT /users/:user/filters/:filter
 */
export async function enableFilter(
  config: WildDuckConfig,
  userId: string,
  filterId: string,
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  const params: any = { disabled: false };
  if (sess) params.sess = sess;
  if (ip) params.ip = ip;
  return updateFilter(config, userId, filterId, params);
}

/**
 * Disable a filter
 * PUT /users/:user/filters/:filter
 */
export async function disableFilter(
  config: WildDuckConfig,
  userId: string,
  filterId: string,
  sess?: string,
  ip?: string
): Promise<{ success: boolean }> {
  const params: any = { disabled: true };
  if (sess) params.sess = sess;
  if (ip) params.ip = ip;
  return updateFilter(config, userId, filterId, params);
}
