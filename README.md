# @johnqh/lib

Shared utilities and common functions for 0xmail.box projects.

## Installation

```bash
npm install @johnqh/lib
```

## Features

### Environment Management

Platform-agnostic environment variable management that works across web and React Native environments.

#### Basic Usage

```typescript
import { env, getAppConfig } from '@johnqh/lib';

// Check environment
if (env.isDevelopment()) {
  console.log('Running in development mode');
}

// Get environment variables
const apiToken = env.get('VITE_WILDDUCK_API_TOKEN', 'default-value');

// Get full app configuration
const config = getAppConfig();
console.log(config.wildDuckApiToken);
```

#### Web Environment (Vite)

```typescript
import { WebEnvProvider, createWebAppConfig } from '@johnqh/lib';

const envProvider = new WebEnvProvider();
const config = createWebAppConfig(envProvider);
```

#### React Native Environment

```typescript
import { ReactNativeEnvProvider, createReactNativeAppConfig } from '@johnqh/lib';
import Config from 'react-native-config'; // Optional

const envProvider = new ReactNativeEnvProvider(Config);
const config = createReactNativeAppConfig(envProvider);
```

## Supported Environment Variables

- `VITE_WILDDUCK_API_TOKEN`
- `VITE_REVENUECAT_API_KEY`
- `VITE_WALLETCONNECT_PROJECT_ID`
- `VITE_PRIVY_APP_ID`
- `VITE_FIREBASE_*` (Firebase configuration)
- `VITE_USE_CLOUDFLARE_WORKER`
- `VITE_CLOUDFLARE_WORKER_URL`
- `VITE_USE_MOCK_FALLBACK`

## Development

```bash
# Build the library
npm run build

# Watch for changes
npm run build:watch

# Clean build directory
npm run clean
```

## License

MIT