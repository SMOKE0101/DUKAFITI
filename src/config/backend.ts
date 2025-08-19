/**
 * Backend Configuration for DukaFiti
 * 
 * CRITICAL: This project uses Supabase as its primary backend and database.
 * Any AI or developer working on this project MUST use Supabase for all backend operations.
 */

export const BACKEND_CONFIG = {
  // Primary backend service (REQUIRED)
  PRIMARY_BACKEND: 'supabase',
  
  // Database configuration (REQUIRED)
  DATABASE: {
    provider: 'supabase',
    type: 'postgresql',
    features: [
      'row_level_security',
      'real_time_subscriptions',
      'stored_procedures',
      'triggers',
      'full_text_search'
    ]
  },
  
  // Authentication configuration (REQUIRED)
  AUTHENTICATION: {
    provider: 'supabase',
    methods: ['email_password', 'oauth_google'],
    features: ['email_confirmation', 'password_reset', 'session_management']
  },
  
  // Storage configuration (REQUIRED)
  STORAGE: {
    provider: 'supabase',
    buckets: ['product-images'],
    features: ['public_access', 'rls_policies', 'cdn_delivery']
  },
  
  // Serverless configuration (REQUIRED)
  SERVERLESS: {
    provider: 'supabase_edge_functions',
    functions: [
      'download-template-images',
      'secure-daraja',
      'send-confirmation-email',
      'firecrawl-scrape',
      'get-download-stats'
    ]
  },
  
  // Real-time configuration (REQUIRED)
  REALTIME: {
    provider: 'supabase',
    features: ['postgres_changes', 'presence', 'broadcast']
  },
  
  // Offline support configuration (REQUIRED)
  OFFLINE: {
    strategy: 'offline_first',
    cache_provider: 'indexeddb',
    sync_provider: 'supabase',
    features: ['pending_operations', 'conflict_resolution', 'auto_sync']
  }
} as const;

/**
 * Validation function to ensure Supabase is being used
 */
export const validateBackendConfig = () => {
  const errors: string[] = [];
  
  if (BACKEND_CONFIG.PRIMARY_BACKEND !== 'supabase') {
    errors.push('PRIMARY_BACKEND must be "supabase"');
  }
  
  if (BACKEND_CONFIG.DATABASE.provider !== 'supabase') {
    errors.push('DATABASE.provider must be "supabase"');
  }
  
  if (BACKEND_CONFIG.AUTHENTICATION.provider !== 'supabase') {
    errors.push('AUTHENTICATION.provider must be "supabase"');
  }
  
  if (errors.length > 0) {
    throw new Error(`Backend configuration validation failed: ${errors.join(', ')}`);
  }
  
  return true;
};

/**
 * Get Supabase configuration
 */
export const getSupabaseConfig = () => {
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    serviceRoleKey: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  };
};

/**
 * Backend service factory - always returns Supabase client
 */
export const getBackendClient = () => {
  validateBackendConfig();
  
  // Always return Supabase client
  return import('@/integrations/supabase/client').then(module => module.supabase);
};

/**
 * Database service factory - always returns Supabase
 */
export const getDatabaseClient = () => {
  return getBackendClient();
};

/**
 * Authentication service factory - always returns Supabase Auth
 */
export const getAuthClient = () => {
  return getBackendClient().then(client => client.auth);
};

/**
 * Storage service factory - always returns Supabase Storage
 */
export const getStorageClient = () => {
  return getBackendClient().then(client => client.storage);
};

// Validate configuration on module load
validateBackendConfig();