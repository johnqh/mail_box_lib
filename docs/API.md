# API Documentation

## Core Services

### EmailService

Handles all email-related operations across platforms.

```typescript
interface EmailService {
  getEmails(
    userId: string,
    mailboxId: string,
    options?: EmailListOptions
  ): Promise<Email[]>;
  getEmail(userId: string, emailId: string): Promise<Email>;
  updateEmail(
    userId: string,
    emailId: string,
    updates: Partial<Email>
  ): Promise<Email>;
  deleteEmail(userId: string, emailId: string): Promise<void>;
  sendEmail(userId: string, email: Partial<Email>): Promise<Email>;
  searchEmails(
    userId: string,
    query: string,
    options?: EmailListOptions
  ): Promise<Email[]>;
}
```

**Usage:**

```typescript
import { getEmailService } from '@johnqh/lib';

const emailService = getEmailService();
const emails = await emailService.getEmails('user123', 'inbox');
```

### MailboxService

Manages email folders and mailbox operations.

```typescript
interface MailboxService {
  getMailboxes(userId: string): Promise<Mailbox[]>;
  createMailbox(
    userId: string,
    name: string,
    options?: { hidden?: boolean }
  ): Promise<Mailbox>;
  deleteMailbox(userId: string, mailboxId: string): Promise<void>;
}
```

## Business Operations

### EmailOperations

High-level business logic for email operations.

```typescript
class EmailOperations {
  async getEmailsWithMetadata(
    userId: string,
    mailboxId: string
  ): Promise<EnrichedEmail[]>;
  async sendEmailWithValidation(
    userId: string,
    emailData: EmailDraft
  ): Promise<Email>;
  async searchEmailsWithFilters(
    userId: string,
    searchParams: SearchParams
  ): Promise<SearchResult>;
}
```

### AuthOperations

Authentication and user management business logic.

```typescript
class AuthOperations {
  async authenticateWithBlockchain(
    walletAddress: string,
    signature: string
  ): Promise<AuthResult>;
  async refreshAuthToken(refreshToken: string): Promise<AuthResult>;
  async validateUserPermissions(
    userId: string,
    resource: string
  ): Promise<boolean>;
}
```

## React Hooks

### useEmails

Hook for fetching and managing email lists.

```typescript
const useEmails = (mailboxId: string, options?: UseEmailsOptions) => {
  const { emails, loading, error, refetch, loadMore, hasMore } = useEmails('inbox');

  return {
    emails: Email[],
    loading: boolean,
    error: Error | null,
    refetch: () => Promise<void>,
    loadMore: () => Promise<void>,
    hasMore: boolean
  };
}
```

**Example:**

```tsx
function EmailList({ mailboxId }: { mailboxId: string }) {
  const { emails, loading, error, refetch } = useEmails(mailboxId);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <div>
      {emails.map(email => (
        <EmailItem key={email.id} email={email} />
      ))}
    </div>
  );
}
```

### useEmailAddresses

Hook for managing user email addresses.

```typescript
const useEmailAddresses = (userId: string) => {
  return {
    addresses: EmailAddress[],
    loading: boolean,
    error: Error | null,
    addAddress: (address: string) => Promise<void>,
    removeAddress: (addressId: string) => Promise<void>,
    setPrimary: (addressId: string) => Promise<void>
  };
}
```

### useAuth

Hook for authentication state and operations.

```typescript
const useAuth = () => {
  return {
    user: User | null,
    isAuthenticated: boolean,
    loading: boolean,
    login: (credentials: LoginCredentials) => Promise<void>,
    logout: () => Promise<void>,
    refreshAuth: () => Promise<void>,
  };
};
```

## Storage Services

### StorageService

Platform-agnostic storage operations.

```typescript
interface StorageService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}
```

**Implementations:**

- **Web**: Uses localStorage/sessionStorage
- **React Native**: Uses AsyncStorage

## Network Services

### NetworkService

HTTP client with platform-specific optimizations.

```typescript
interface NetworkService {
  get<T>(url: string, options?: RequestOptions): Promise<T>;
  post<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;
  put<T>(url: string, data?: any, options?: RequestOptions): Promise<T>;
  delete<T>(url: string, options?: RequestOptions): Promise<T>;
}
```

## Analytics Services

### AnalyticsService

Event tracking and user analytics.

```typescript
interface AnalyticsService {
  track(event: string, properties?: Record<string, any>): Promise<void>;
  identify(userId: string, traits?: Record<string, any>): Promise<void>;
  screen(name: string, properties?: Record<string, any>): Promise<void>;
  flush(): Promise<void>;
}
```

## Blockchain Integration

### WalletCapabilities

Blockchain wallet interaction utilities.

```typescript
export class WalletCapabilities {
  static async detectWallets(): Promise<WalletInfo[]>;
  static async connectWallet(walletType: WalletType): Promise<WalletConnection>;
  static async signMessage(
    message: string,
    wallet: WalletConnection
  ): Promise<string>;
  static async getBalance(address: string, chainId: string): Promise<string>;
}
```

### AddressDetection

Blockchain address validation and network detection.

```typescript
export class AddressDetection {
  static isValidAddress(address: string, chainType?: ChainType): boolean;
  static detectChainType(address: string): ChainType | null;
  static normalizeAddress(address: string, chainType: ChainType): string;
}
```

## AI Services

### AIEmailService

AI-powered email processing and management.

```typescript
interface AIEmailService {
  generateReply(email: Email, context?: string): Promise<string>;
  summarizeEmail(email: Email): Promise<string>;
  classifyEmail(email: Email): Promise<EmailClassification>;
  extractEntities(emailContent: string): Promise<ExtractedEntity[]>;
}
```

### AISearchService

Intelligent email search and filtering.

```typescript
interface AISearchService {
  semanticSearch(query: string, emails: Email[]): Promise<SearchResult[]>;
  suggestQueries(partial: string): Promise<string[]>;
  categorizeEmails(emails: Email[]): Promise<CategorizedEmails>;
}
```

## Error Handling

### Custom Error Types

```typescript
export class EmailServiceError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'EmailServiceError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## Configuration

### Environment Setup

```typescript
// Web environment
import { createWebAppConfig } from '@johnqh/lib/di';
const config = createWebAppConfig();

// React Native environment
import { createReactNativeAppConfig } from '@johnqh/lib/di';
const config = createReactNativeAppConfig();
```

### Service Registration

```typescript
import { DependencyContainer } from '@johnqh/lib/business/core/container';

const container = new DependencyContainer();
container.register('emailService', new WebEmailService(config));
container.register('storageService', new WebStorageService());

// Get services
const emailService = container.resolve<EmailService>('emailService');
```

## Type Definitions

### Core Types

```typescript
interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  important?: boolean;
  folder: EmailFolder;
  labels?: string[];
  attachments?: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  emailAddresses: EmailAddress[];
}

interface EmailAddress {
  id: string;
  email: string;
  name: string;
  isPrimary: boolean;
  isActive: boolean;
}

interface Mailbox {
  id: string;
  name: string;
  path: string;
  specialUse?: string;
  subscribed: boolean;
  hidden: boolean;
  total?: number;
  unseen?: number;
}
```

### Enum Types

```typescript
enum ChainType {
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
  POLYGON = 'polygon',
}

enum EmailFolder {
  INBOX = 'inbox',
  SENT = 'sent',
  DRAFTS = 'drafts',
  TRASH = 'trash',
  SPAM = 'spam',
  ARCHIVE = 'archive',
}

enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}
```

## Platform Detection

The library automatically detects the platform and uses appropriate implementations:

```typescript
// This automatically chooses WebEmailService or ReactNativeEmailService
import { getEmailService } from '@johnqh/lib';

const emailService = getEmailService();
```

## Testing Utilities

The library provides testing utilities for easier testing:

```typescript
import { createMockEmailService, createTestUser } from '@johnqh/lib/testing';

const mockService = createMockEmailService();
const testUser = createTestUser();
```

## Migration Guide

When updating from older versions, refer to the migration guide for breaking changes and upgrade paths.

## Support

- GitHub Issues: [Report bugs and request features](https://github.com/0xmail/mail_box_lib/issues)
- Documentation: [Full documentation](https://docs.0xmail.box)
- Examples: [Sample implementations](https://github.com/0xmail/mail_box_lib/tree/main/examples)
