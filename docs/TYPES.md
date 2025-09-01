# Type Documentation

Complete TypeScript type definitions for @johnqh/lib.

## Table of Contents

- [Core Types](#core-types)
- [Service Interfaces](#service-interfaces)
- [Business Logic Types](#business-logic-types)
- [Hook Types](#hook-types)
- [Platform Types](#platform-types)
- [Utility Types](#utility-types)
- [Enum Types](#enum-types)

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
  important?: boolean;
  
  /** Email folder/mailbox */
  folder: EmailFolder;
  
  /** Email labels/tags */
  labels?: string[];
  
  /** Attachment file names */
  attachments?: string[];
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
  avatar?: string;
  
  /** All associated email addresses */
  emailAddresses: EmailAddress[];
}
```

### EmailAddress

Individual email address with metadata.

```typescript
interface EmailAddress {
  /** Unique address identifier */
  id: string;
  
  /** The email address */
  email: string;
  
  /** Display name for this address */
  name: string;
  
  /** Whether this is the primary address */
  isPrimary: boolean;
  
  /** Whether this address is active */
  isActive: boolean;
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
  specialUse?: string;
  
  /** Whether user is subscribed to this mailbox */
  subscribed: boolean;
  
  /** Whether mailbox is hidden in UI */
  hidden: boolean;
  
  /** Total number of emails */
  total?: number;
  
  /** Number of unread emails */
  unseen?: number;
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
  getEmails(userId: string, mailboxId: string, options?: EmailListOptions): Promise<Email[]>;
  
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
  updateEmail(userId: string, emailId: string, updates: Partial<Email>): Promise<Email>;
  
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
  searchEmails(userId: string, query: string, options?: EmailListOptions): Promise<Email[]>;
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
  async getEmailsWithMetadata(userId: string, mailboxId: string): Promise<EnrichedEmail[]>;
  
  /**
   * Send email with validation and processing
   */
  async sendEmailWithValidation(userId: string, emailData: EmailDraft): Promise<Email>;
  
  /**
   * Advanced search with filters and ranking
   */
  async searchEmailsWithFilters(userId: string, searchParams: SearchParams): Promise<SearchResult>;
}
```

### AuthOperations

Authentication business logic operations.

```typescript
class AuthOperations {
  constructor(
    private authService: AuthService,
    private storageService: StorageService
  ) {}
  
  /**
   * Authenticate user with blockchain wallet
   */
  async authenticateWithBlockchain(walletAddress: string, signature: string): Promise<AuthResult>;
  
  /**
   * Refresh authentication token
   */
  async refreshAuthToken(refreshToken: string): Promise<AuthResult>;
  
  /**
   * Validate user permissions for a resource
   */
  async validateUserPermissions(userId: string, resource: string): Promise<boolean>;
}
```

## Hook Types

### UseEmailsReturn

Return type for the useEmails hook.

```typescript
interface UseEmailsReturn {
  /** Array of emails */
  emails: Email[];
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: Error | null;
  
  /** Function to refetch emails */
  refetch: () => Promise<void>;
  
  /** Function to load more emails (pagination) */
  loadMore: () => Promise<void>;
  
  /** Whether more emails are available */
  hasMore: boolean;
  
  /** Total count of emails */
  totalCount: number;
}
```

### UseEmailsOptions

Options for configuring the useEmails hook.

```typescript
interface UseEmailsOptions {
  /** Whether to automatically fetch data */
  enabled?: boolean;
  
  /** Number of emails per page */
  limit?: number;
  
  /** Sort order */
  order?: 'asc' | 'desc';
  
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  
  /** Callback for successful fetch */
  onSuccess?: (emails: Email[]) => void;
  
  /** Callback for fetch error */
  onError?: (error: Error) => void;
}
```

### UseAuthReturn

Return type for the useAuth hook.

```typescript
interface UseAuthReturn {
  /** Current user or null if not authenticated */
  user: User | null;
  
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  
  /** Loading state */
  loading: boolean;
  
  /** Authentication error */
  error: Error | null;
  
  /** Login function */
  login: (credentials: LoginCredentials) => Promise<void>;
  
  /** Logout function */
  logout: () => Promise<void>;
  
  /** Refresh authentication */
  refreshAuth: () => Promise<void>;
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
interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
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
  icon?: string;
  installed: boolean;
  supported: boolean;
}

interface WalletConnection {
  address: string;
  chainId: string;
  chainType: ChainType;
  balance?: string;
}
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

Supported blockchain networks.

```typescript
enum ChainType {
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
  POLYGON = 'polygon',
  BITCOIN = 'bitcoin'
}
```

### EmailFolder

Standard email folder types.

```typescript
enum EmailFolder {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFTS = 'drafts',
  TRASH = 'trash',
  SPAM = 'spam',
  ARCHIVE = 'archive',
  CUSTOM = 'custom'
}
```

### Theme

UI theme options.

```typescript
enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}
```

### FontSize

Font size preferences.

```typescript
enum FontSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra-large'
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

## Generic Types

Reusable generic type definitions.

```typescript
/**
 * Generic service interface
 */
interface Service<T, K = string> {
  get(id: K): Promise<T>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: K, updates: Partial<T>): Promise<T>;
  delete(id: K): Promise<void>;
  list(options?: ListOptions): Promise<T[]>;
}

/**
 * Generic hook return type
 */
interface UseServiceReturn<T, E = Error> {
  data: T | null;
  loading: boolean;
  error: E | null;
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