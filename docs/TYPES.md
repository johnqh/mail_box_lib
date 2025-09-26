# Type Documentation

Complete TypeScript type definitions for @johnqh/lib v3.3.3.

## Table of Contents

- [Optional Pattern](#optional-pattern)
- [Core Types](#core-types)
- [Service Interfaces](#service-interfaces)
- [Business Logic Types](#business-logic-types)
- [Hook Types](#hook-types)
- [Platform Types](#platform-types)
- [Utility Types](#utility-types)
- [Enum Types](#enum-types)
- [API Response Types](#api-response-types)
- [Type Guards](#type-guards)
- [AI Assistant Examples](#ai-assistant-examples)

## Optional Pattern

**IMPORTANT**: This project uses `Optional<T>` from @johnqh/types for all nullable/optional values:

```typescript
import { Optional } from '@johnqh/types';

// ✅ CORRECT: Use Optional<T> for nullable values
interface User {
  id: string;
  name: string;
  email: Optional<string>; // T | undefined | null
  avatar: Optional<string>;
}

// ❌ WRONG: Don't use manual nullable patterns
interface User {
  email?: string | null; // Don't do this
  avatar: string | undefined; // Don't do this
}
```

### When to Use Optional<T>

- API responses that may contain null/undefined values
- User input fields that are not required
- Configuration options that have defaults
- Database fields that allow NULL
- React hook states that start as undefined

### AI Development Note

When creating new interfaces or updating existing ones, ALWAYS use `Optional<T>` instead of manual nullable patterns (`T | undefined | null`, `T?`, etc.).

## Core Types

### Email

Core email data structure used throughout the application.

```typescript
interface Email {
  /** Unique email identifier */
  id: string;

  /** Sender email address */
  from: string;

  /** Recipient email address */
  to: string;

  /** Email subject line */
  subject: string;

  /** Email body content (HTML or plain text) */
  body: string;

  /** Email timestamp */
  date: Date;

  /** Whether the email has been read */
  read: boolean;

  /** Whether the email is starred/favorited */
  starred: boolean;

  /** Whether the email is marked as important */
  important: Optional<boolean>;

  /** Email folder/mailbox */
  folder: EmailFolder;

  /** Email labels/tags */
  labels: Optional<string[]>;

  /** Attachment file names */
  attachments: Optional<string[]>;
}
```

### User

User account information and preferences.

```typescript
interface User {
  /** Unique user identifier */
  id: string;

  /** User display name */
  name: string;

  /** Primary email address */
  email: string;

  /** User avatar URL */
  avatar: Optional<string>;

  /** All associated email addresses */
  emailAddresses: EmailAddress[];

  /** Wallet connection information */
  wallet: Optional<WalletConnection>;
}
```

### EmailAddress

Individual email address with metadata (updated for indexer v2.2.0).

```typescript
import { Optional } from '@johnqh/types';

interface EmailAddress {
  /** The email address */
  address: string;

  /** Display name for this address */
  name: Optional<string>;

  /** Whether this is the primary address */
  primary: Optional<boolean>;

  /** Whether this address is verified */
  verified: boolean;

  /** Chain type for blockchain addresses */
  chainType: Optional<ChainType>;

  /** Wallet address associated with this email */
  walletAddress: Optional<string>;
}
```

### Mailbox

Email folder/mailbox structure.

```typescript
interface Mailbox {
  /** Unique mailbox identifier */
  id: string;

  /** Display name */
  name: string;

  /** Full path (e.g., "INBOX/Work/Projects") */
  path: string;

  /** Special use designation (INBOX, SENT, etc.) */
  specialUse: Optional<string>;

  /** Whether user is subscribed to this mailbox */
  subscribed: boolean;

  /** Whether mailbox is hidden in UI */
  hidden: boolean;

  /** Total number of emails */
  total: Optional<number>;

  /** Number of unread emails */
  unseen: Optional<number>;
}
```

## Service Interfaces

### EmailService

Core email operations interface.

```typescript
interface EmailService {
  /**
   * Retrieve emails from a mailbox
   * @param userId - User identifier
   * @param mailboxId - Mailbox identifier
   * @param options - Pagination and sorting options
   */
  getEmails(
    userId: string,
    mailboxId: string,
    options?: EmailListOptions
  ): Promise<Email[]>;

  /**
   * Get a specific email by ID
   * @param userId - User identifier
   * @param emailId - Email identifier
   */
  getEmail(userId: string, emailId: string): Promise<Email>;

  /**
   * Update email properties
   * @param userId - User identifier
   * @param emailId - Email identifier
   * @param updates - Properties to update
   */
  updateEmail(
    userId: string,
    emailId: string,
    updates: Partial<Email>
  ): Promise<Email>;

  /**
   * Delete an email
   * @param userId - User identifier
   * @param emailId - Email identifier
   */
  deleteEmail(userId: string, emailId: string): Promise<void>;

  /**
   * Send a new email
   * @param userId - User identifier
   * @param email - Email data to send
   */
  sendEmail(userId: string, email: Partial<Email>): Promise<Email>;

  /**
   * Search emails by query
   * @param userId - User identifier
   * @param query - Search query string
   * @param options - Search options
   */
  searchEmails(
    userId: string,
    query: string,
    options?: EmailListOptions
  ): Promise<Email[]>;
}
```

### StorageService

Platform-agnostic storage interface.

```typescript
interface StorageService {
  /**
   * Get a value from storage
   * @param key - Storage key
   * @returns Promise resolving to the stored value or null
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Store a value
   * @param key - Storage key
   * @param value - Value to store
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Remove a value from storage
   * @param key - Storage key
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all stored values
   */
  clear(): Promise<void>;

  /**
   * Get all storage keys
   * @returns Promise resolving to array of keys
   */
  keys(): Promise<string[]>;
}
```

### NetworkService

HTTP client interface.

```typescript
interface NetworkService {
  /**
   * Perform GET request
   * @param url - Request URL
   * @param options - Request options
   */
  get<T>(url: string, options?: RequestOptions): Promise<T>;

  /**
   * Perform POST request
   * @param url - Request URL
   * @param data - Request body data
   * @param options - Request options
   */
  post<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;

  /**
   * Perform PUT request
   * @param url - Request URL
   * @param data - Request body data
   * @param options - Request options
   */
  put<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;

  /**
   * Perform DELETE request
   * @param url - Request URL
   * @param options - Request options
   */
  delete<T>(url: string, options?: RequestOptions): Promise<T>;
}
```

### AnalyticsService

Analytics and tracking interface.

```typescript
interface AnalyticsService {
  /**
   * Track an event
   * @param event - Event name
   * @param properties - Event properties
   */
  track(event: string, properties?: Record<string, any>): Promise<void>;

  /**
   * Identify a user
   * @param userId - User identifier
   * @param traits - User traits/properties
   */
  identify(userId: string, traits?: Record<string, any>): Promise<void>;

  /**
   * Track screen view
   * @param name - Screen name
   * @param properties - Screen properties
   */
  screen(name: string, properties?: Record<string, any>): Promise<void>;

  /**
   * Flush pending events
   */
  flush(): Promise<void>;
}
```

## Business Logic Types

### EmailOperations

High-level email business logic operations.

```typescript
class EmailOperations {
  constructor(private emailService: EmailService) {}

  /**
   * Get emails with additional metadata and enrichment
   */
  async getEmailsWithMetadata(
    userId: string,
    mailboxId: string
  ): Promise<EnrichedEmail[]>;

  /**
   * Send email with validation and processing
   */
  async sendEmailWithValidation(
    userId: string,
    emailData: EmailDraft
  ): Promise<Email>;

  /**
   * Advanced search with filters and ranking
   */
  async searchEmailsWithFilters(
    userId: string,
    searchParams: SearchParams
  ): Promise<SearchResult>;
}
```

## Platform Types

### Platform Detection

```typescript
type Platform = 'web' | 'reactnative';

interface PlatformInfo {
  platform: Platform;
  version?: string;
  userAgent?: string;
}
```

### Environment Configuration

```typescript
interface EnvironmentVariables {
  VITE_WILDDUCK_API_TOKEN?: string;
  VITE_WILDDUCK_BACKEND_URL?: string;
  VITE_REVENUECAT_API_KEY?: string;
  VITE_WALLETCONNECT_PROJECT_ID?: string;
  VITE_PRIVY_APP_ID?: string;
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_MEASUREMENT_ID?: string;
  VITE_FIREBASE_VAPID_KEY?: string;
  VITE_USE_CLOUDFLARE_WORKER?: string;
  VITE_CLOUDFLARE_WORKER_URL?: string;
  VITE_USE_MOCK_FALLBACK?: string;
}

interface AppConfig {
  wildDuckApiToken: string;
  wildDuckBackendUrl: string;
  revenueCatApiKey: string;
  walletConnectProjectId: string;
  privyAppId: string;
  firebase: FirebaseConfig;
  useCloudflareWorker: boolean;
  cloudflareWorkerUrl: string;
  useMockFallback: boolean;
}
```

## Utility Types

### API Response Types

```typescript
// BaseResponse from @johnqh/types
import { BaseResponse, Optional } from '@johnqh/types';

interface BaseResponse<T = unknown> {
  /** Operation success status */
  success: boolean;
  /** Response data */
  data: Optional<T>;
  /** Error message if operation failed */
  error: Optional<string>;
  /** Response timestamp */
  timestamp: string;
}

// NetworkResponse extends BaseResponse with HTTP metadata
interface NetworkResponse<T = unknown> extends BaseResponse<T> {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor: Optional<string>;
}

// Indexer API specific response types
interface IndexerResponse<T> extends NetworkResponse<T> {
  // Indexer responses follow NetworkResponse pattern
}

interface WildDuckResponse<T> {
  success: boolean;
  data: Optional<T>;
  error: Optional<string>;
  // WildDuck has different response structure
}
```

### Search Types

```typescript
interface SearchParams {
  query: string;
  mailboxId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAttachments?: boolean;
  isUnread?: boolean;
  labels?: string[];
}

interface SearchResult {
  emails: Email[];
  totalCount: number;
  suggestions?: string[];
  filters?: SearchFilter[];
}

interface SearchFilter {
  name: string;
  count: number;
  active: boolean;
}
```

### Blockchain Types

```typescript
import { Optional, ChainType, ConnectionState } from '@johnqh/types';

// Local WalletUserData interface (not in @johnqh/di)
interface WalletUserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  emailAddresses: EmailAddress[];
  chainType: ChainType;
}

interface WalletInfo {
  name: string;
  icon: Optional<string>;
  installed: boolean;
  supported: boolean;
}

interface WalletConnection {
  address: string;
  chainId: string;
  chainType: ChainType;
  balance: Optional<string>;
}

// Wallet status management
interface WalletStatus {
  walletAddress: string;
  chainType: ChainType;
  isVerified: boolean;
  verificationData: Optional<{
    message: string;
    signature: string;
    timestamp: string;
  }>;
}

// Connection states
type WalletConnectionState = ConnectionState; // Imported from @johnqh/types
```

### AI Types

```typescript
interface AIEmailService {
  generateReply(email: Email, context?: string): Promise<string>;
  summarizeEmail(email: Email): Promise<string>;
  classifyEmail(email: Email): Promise<EmailClassification>;
  extractEntities(emailContent: string): Promise<ExtractedEntity[]>;
}

interface EmailClassification {
  category: 'personal' | 'work' | 'promotional' | 'spam' | 'newsletter';
  confidence: number;
  priority: 'low' | 'medium' | 'high';
}

interface ExtractedEntity {
  type: 'person' | 'organization' | 'location' | 'date' | 'money';
  text: string;
  confidence: number;
  metadata?: Record<string, any>;
}
```

## Enum Types

### ChainType

Supported blockchain networks (imported from @johnqh/types, with local extension).

```typescript
// Import from @johnqh/types
import { ChainType as BaseChainType } from '@johnqh/types';

// Local ChainType with additional 'unknown' value
export enum ChainType {
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
  UNKNOWN = 'unknown', // Local addition not in @johnqh/types
}

// Use BaseChainType when working with @johnqh/types interfaces
// Use local ChainType when unknown values are needed
```

### MailboxType (EmailFolder)

Standard mailbox/folder types (consolidated to MailboxType from @johnqh/types).

```typescript
// Import from @johnqh/types
import { MailboxType } from '@johnqh/types';

// Standard mailbox types
enum MailboxType {
  INBOX = 'INBOX',
  SENT = 'Sent',
  DRAFTS = 'Drafts',
  TRASH = 'Trash',
  SPAM = 'Junk',
  ARCHIVE = 'Archive'
}

// EmailFolder is now an alias for MailboxType
type EmailFolder = MailboxType;
```

### Theme

UI theme options.

```typescript
enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}
```

### FontSize

Font size preferences.

```typescript
enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra-large',
}
```

## Type Guards

Utility functions for type checking at runtime.

```typescript
/**
 * Check if an object is a valid Email
 */
function isEmail(obj: any): obj is Email {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.from === 'string' &&
    typeof obj.to === 'string' &&
    typeof obj.subject === 'string' &&
    typeof obj.body === 'string' &&
    obj.date instanceof Date &&
    typeof obj.read === 'boolean' &&
    typeof obj.starred === 'boolean'
  );
}

/**
 * Check if an object is a valid User
 */
function isUser(obj: any): obj is User {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    Array.isArray(obj.emailAddresses)
  );
}

/**
 * Check if a string is a valid ChainType
 */
function isChainType(value: string): value is ChainType {
  return Object.values(ChainType).includes(value as ChainType);
}
```

## Conditional Types

Advanced TypeScript utility types for conditional logic.

```typescript
/**
 * Extract service method names
 */
type ServiceMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

/**
 * Make specified properties optional
 */
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract return type from Promise
 */
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Service configuration type based on platform
 */
type PlatformConfig<P extends Platform> = P extends 'web'
  ? WebConfig
  : ReactNativeConfig;
```

## AI Assistant Examples

Common patterns and examples for AI-assisted development.

### Hook Return Types

```typescript
import { Optional } from '@johnqh/types';

// Standard hook return pattern
interface UseDataReturn<T> {
  data: Optional<T>;
  isLoading: boolean;
  error: Optional<string>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

// TanStack Query hook return (extends UseQueryResult)
interface UseQueryReturn<T> extends UseQueryResult<T> {
  // Inherits data, isLoading, error, refetch from TanStack Query
}

// Indexer hook pattern
interface UseIndexerReturn<T> {
  data: Optional<T>;
  isLoading: boolean;
  error: Optional<string>;
  execute: (...args: any[]) => Promise<T>;
  clearError: () => void;
}
```

### Configuration Patterns

```typescript
// WildDuck configuration
interface WildDuckConfig {
  apiToken: string;
  backendUrl: Optional<string>;
  cloudflareWorkerUrl: Optional<string>;
  useMockFallback: Optional<boolean>;
}

// Indexer configuration (passed as parameters)
// endpointUrl: string, dev: boolean

// Service factory pattern
type CreateService<T> = (config: ServiceConfig) => T;
```

### API Client Response Handling

```typescript
// Indexer client response pattern
async function handleIndexerResponse<T>(response: NetworkResponse<T>): Promise<T> {
  if (!response.ok) {
    throw new Error(
      `API call failed: ${(response.data as any)?.error || 'Unknown error'}`
    );
  }

  return response.data as T; // Type assertion needed for NetworkResponse
}

// WildDuck response pattern
async function handleWildDuckResponse<T>(response: WildDuckResponse<T>): Promise<T> {
  if (!response.success || response.data === undefined) {
    throw new Error(response.error || 'Operation failed');
  }

  return response.data;
}
```

### Error Handling Patterns

```typescript
// Custom error types
class IndexerError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'IndexerError';
  }
}

class WildDuckError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'WildDuckError';
  }
}

// Hook error handling
const useServiceWithError = () => {
  const [error, setError] = useState<Optional<string>>(null);

  const handleError = useCallback((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : 'Operation failed';
    setError(errorMessage);
  }, []);

  return { error, handleError, clearError: () => setError(null) };
};
```

### Type Migration Examples

```typescript
// BEFORE: Manual nullable patterns (❌ Don't do this)
interface OldInterface {
  id: string;
  name?: string;
  email: string | null | undefined;
  settings: UserSettings | null;
}

// AFTER: Using Optional<T> (✅ Correct pattern)
interface NewInterface {
  id: string;
  name: Optional<string>;
  email: Optional<string>;
  settings: Optional<UserSettings>;
}

// Import consolidation examples
// BEFORE: Local duplicates (❌ Don't do this)
enum LocalChainType { ETHEREUM = 'ethereum' }
enum LocalLoginMethod { WALLET = 'wallet' }

// AFTER: Import from @johnqh/types (✅ Correct)
import { ChainType, AnalyticsEvent } from '@johnqh/types';
// Use string literals instead of LoginMethod (removed)
type LoginMethod = 'wallet' | 'email' | 'google' | 'apple';
```

## Generic Types

Reusable generic type definitions.

```typescript
import { Optional } from '@johnqh/types';

/**
 * Generic service interface with Optional support
 */
interface Service<T, K = string> {
  get(id: K): Promise<Optional<T>>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: K, updates: Partial<T>): Promise<T>;
  delete(id: K): Promise<void>;
  list(options?: ListOptions): Promise<T[]>;
}

/**
 * Generic hook return type with Optional support
 */
interface UseServiceReturn<T, E = Error> {
  data: Optional<T>;
  loading: boolean;
  error: Optional<E>;
  refetch: () => Promise<void>;
}

/**
 * Generic operations class
 */
abstract class Operations<T, S extends Service<T>> {
  constructor(protected service: S) {}

  abstract validate(data: Partial<T>): boolean;
  abstract transform(data: any): T;
}
```
