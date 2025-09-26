/**
 * Shared WildDuck API types
 *
 * These types are used across multiple modules and were previously
 * defined in individual hook files.
 */

import { Optional } from '@johnqh/types';

// Message-related types
export interface UpdateMessageParams {
  seen: Optional<boolean>;
  flagged: Optional<boolean>;
  deleted: Optional<boolean>;
  mailbox: Optional<string>;
}

// Address-related types
export interface CreateAddressParams {
  address: string;
  name: Optional<string>;
  main: Optional<boolean>;
  tags: Optional<string[]>;
}

export interface UpdateAddressParams {
  name: Optional<string>;
  main: Optional<boolean>;
  tags: Optional<string[]>;
}
