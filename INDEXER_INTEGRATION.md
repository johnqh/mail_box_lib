# Indexer Integration Guide

This project has been updated to work with the latest mail_box_indexer API (v2.2.0). The integration provides comprehensive support for all indexer endpoints including email generation, points system, campaigns, and admin functions.

## Quick Start

### 1. Import the Services

```typescript
import { 
  IndexerService, 
  createIndexerService,
  IndexerClient,
  createIndexerClient 
} from '@0xmail/lib';
```

### 2. Initialize the Service

```typescript
const config = {
  indexerBackendUrl: 'https://indexer.0xmail.box',
  // ... other config
};

const indexerService = createIndexerService(config);
```

### 3. Use the Service

```typescript
// Get email addresses for a wallet
const emailData = await indexerService.getEmailAddresses(
  walletAddress,
  signature,
  message
);

// Get points summary
const pointsData = await indexerService.getPointsSummary(
  walletAddress,
  signature,
  message
);

// Get leaderboard
const leaderboard = await indexerService.getLeaderboard(100, 0);

// Claim promotional code
const claimResult = await indexerService.claimPromoCode(
  walletAddress,
  'PROMO123',
  signature,
  message
);
```

## Available Services

### IndexerClient (Low-level API client)
Direct access to all indexer API endpoints with minimal abstraction.

### IndexerService (Business logic service)
High-level service with caching, error handling, and convenience methods.

## API Coverage

### Mail & Authentication
- ✅ Email address generation (`POST /emails`)
- ✅ Signature verification (`POST /verify`) 
- ✅ Message generation (`GET /message/:chainId/:walletAddress/:domain/:url`)
- ✅ Nonce management (`POST /nonce/:walletAddress/create`, `POST /nonce/:walletAddress`)
- ✅ Delegation info (`POST /delegated`, `GET /delegatedTo/:walletAddress`)
- ✅ Nameservice entitlements (`GET /:walletAddress/entitlement/nameservice`)

### Points System
- ✅ How to earn points (`GET /points/how-to-earn`)
- ✅ Public stats (`GET /points/public-stats`)
- ✅ User points summary (`POST /points/summary`)
- ✅ Points history (`POST /points/history`)
- ✅ Promotional codes (`POST /points/claim-promo`, `POST /points/validate-promo`)
- ✅ Referral system (`POST /points/register-referral`, `POST /points/referee-login`)
- ✅ Leaderboard (`GET /leaderboard`)
- ✅ Campaigns (`GET /campaigns`, `GET /campaigns/:campaignId/stats`)

### Webhooks (Internal Use)
- ✅ Email sent notifications (`POST /webhook/email-sent`)
- ✅ Recipient login notifications (`POST /webhook/recipient-login`)
- ✅ Login notifications (`POST /webhook/login`)

### Admin Functions
- ✅ Campaign management (`POST /admin/campaigns/create`)
- ✅ Manual point awards (`POST /admin/points/award`)
- ✅ User flagging (`POST /admin/points/flag-user`)
- ✅ Admin statistics (`GET /admin/stats/overview`)
- ✅ Bulk code generation (`POST /admin/campaigns/bulk-codes`)

## Type Safety

All API responses are fully typed with TypeScript interfaces:

```typescript
import {
  IndexerEmailResponse,
  IndexerPointsSummaryResponse,
  IndexerLeaderboardResponse,
  IndexerCampaignsResponse,
  // ... many more types available
} from '@0xmail/lib';
```

## Caching

The `IndexerService` includes intelligent caching:
- 5-minute cache for public data (campaigns, leaderboard, stats)
- No caching for user-specific authenticated requests
- Automatic cache invalidation when user performs actions that change their state

## Error Handling

All methods include proper error handling and will throw descriptive errors:

```typescript
try {
  const points = await indexerService.getPointsSummary(wallet, sig, msg);
} catch (error) {
  console.error('Failed to get points:', error.message);
}
```

## Signature Helper

The service includes a helper for preparing signed requests:

```typescript
const { message, signFunction } = await indexerService.prepareSignedRequest(
  walletAddress,
  chainId,
  domain,
  url
);

// User signs the message with their wallet
const signature = await wallet.signMessage(message);

// Create the signed request data
const requestData = signFunction(signature);

// Use in API calls
const result = await indexerService.getPointsSummary(
  requestData.walletAddress,
  requestData.signature,
  requestData.message
);
```

## Platform Compatibility

This integration is fully compatible with both web and React Native environments, following the project's platform abstraction principles.

## Migration from Old Integration

If you were previously using any localStorage-based points system or custom indexer integration, you can now replace it with this standardized service that works with the latest indexer API.

The new integration provides:
- Better error handling
- Comprehensive type safety
- Built-in caching
- Support for all indexer features
- Consistent API across platforms