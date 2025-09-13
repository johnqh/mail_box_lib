/**
 * Shared WildDuck API types
 *
 * These types are used across multiple modules and were previously
 * defined in individual hook files.
 */

// Message-related types
export interface UpdateMessageParams {
  seen?: boolean;
  flagged?: boolean;
  deleted?: boolean;
  mailbox?: string;
}

// Address-related types
export interface CreateAddressParams {
  address: string;
  name?: string;
  main?: boolean;
  tags?: string[];
}

export interface UpdateAddressParams {
  name?: string;
  main?: boolean;
  tags?: string[];
}
