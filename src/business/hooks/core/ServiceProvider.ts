/**
 * Service container and resolver hooks for dependency injection
 * Provides access to service container in React components
 */

import { createContext, useContext } from 'react';
import {
  ServiceContainer,
  ServiceResolver,
} from '../../core/container/dependency-container';

// Service container context
const ServiceContainerContext = createContext<ServiceContainer | null>(null);

// Service resolver context (convenience layer)
const ServiceResolverContext = createContext<ServiceResolver | null>(null);

/**
 * Hook to get the service container
 * @throws Error if used outside ServiceProvider
 */
export const useServiceContainer = (): ServiceContainer => {
  const container = useContext(ServiceContainerContext);
  if (!container) {
    throw new Error(
      'useServiceContainer must be used within a ServiceProvider. ' +
        'Make sure to set up the service container properly in your app.'
    );
  }
  return container;
};

/**
 * Hook to get the service resolver (convenience layer)
 * @throws Error if used outside ServiceProvider
 */
export const useServiceResolver = (): ServiceResolver => {
  const resolver = useContext(ServiceResolverContext);
  if (!resolver) {
    throw new Error(
      'useServiceResolver must be used within a ServiceProvider. ' +
        'Make sure to set up the service container properly in your app.'
    );
  }
  return resolver;
};

// Export contexts for use in consuming applications
export { ServiceContainerContext, ServiceResolverContext };
