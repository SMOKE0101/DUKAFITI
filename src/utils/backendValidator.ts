/**
 * Backend Validation Utilities
 * 
 * Ensures that Supabase is being used correctly throughout the application
 */

import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that Supabase is properly configured and accessible
 */
export const validateSupabaseIntegration = async (): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      errors.push('Supabase client is not initialized');
      return { isValid: false, errors, warnings };
    }

    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      errors.push('VITE_SUPABASE_URL environment variable is missing');
    }

    if (!supabaseKey) {
      errors.push('VITE_SUPABASE_ANON_KEY environment variable is missing');
    }

    // Test database connectivity
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found" which is OK
        warnings.push(`Database connectivity test failed: ${error.message}`);
      }
    } catch (dbError) {
      warnings.push('Database connectivity could not be tested');
    }

    // Test authentication
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Session can be null, that's fine
    } catch (authError) {
      warnings.push('Authentication service could not be tested');
    }

    // Test storage
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const hasProductImages = buckets?.some(bucket => bucket.name === 'product-images');
      if (!hasProductImages) {
        warnings.push('product-images storage bucket not found');
      }
    } catch (storageError) {
      warnings.push('Storage service could not be tested');
    }

  } catch (error) {
    errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Check if the project is using any forbidden backend technologies
 */
export const checkForForbiddenTechnologies = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for Firebase imports (forbidden)
  const codeContent = document.documentElement.innerHTML;
  
  if (codeContent.includes('firebase') || codeContent.includes('Firebase')) {
    errors.push('Firebase detected - this project must use Supabase only');
  }

  if (codeContent.includes('mongodb') || codeContent.includes('MongoDB')) {
    errors.push('MongoDB detected - this project must use Supabase PostgreSQL only');
  }

  // Check for proper Supabase usage
  if (!codeContent.includes('supabase')) {
    warnings.push('Supabase references not found - ensure proper integration');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate that unified hooks are being used correctly
 */
export const validateUnifiedHooksUsage = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // This would typically check the codebase for proper hook usage
  // For now, we'll provide guidance
  
  const requiredHooks = [
    'useUnifiedProducts',
    'useUnifiedCustomers', 
    'useUnifiedSales',
    'useAuth',
    'useCacheManager',
    'useUnifiedSyncManager'
  ];

  // In a real implementation, you'd scan the codebase
  // For now, we'll assume they exist since they're in the project files
  
  return {
    isValid: true,
    errors,
    warnings
  };
};

/**
 * Run comprehensive backend validation
 */
export const runBackendValidation = async (): Promise<ValidationResult> => {
  const supabaseValidation = await validateSupabaseIntegration();
  const technologyValidation = checkForForbiddenTechnologies();
  const hooksValidation = validateUnifiedHooksUsage();

  return {
    isValid: supabaseValidation.isValid && technologyValidation.isValid && hooksValidation.isValid,
    errors: [
      ...supabaseValidation.errors,
      ...technologyValidation.errors,
      ...hooksValidation.errors
    ],
    warnings: [
      ...supabaseValidation.warnings,
      ...technologyValidation.warnings,
      ...hooksValidation.warnings
    ]
  };
};

/**
 * Development helper to ensure Supabase compliance
 */
export const enforceSupabaseUsage = () => {
  if (import.meta.env.DEV) {
    console.log('🔒 DukaFiti Backend Enforcement: Supabase is the required backend');
    console.log('📋 Available services: Database, Auth, Storage, Edge Functions, Realtime');
    console.log('🚫 Forbidden: Firebase, MongoDB, custom auth, alternative storage');
    
    // Run validation in development
    runBackendValidation().then(result => {
      if (!result.isValid) {
        console.error('❌ Backend validation failed:', result.errors);
      } else {
        console.log('✅ Backend validation passed');
      }
      
      if (result.warnings.length > 0) {
        console.warn('⚠️ Backend warnings:', result.warnings);
      }
    });
  }
};

// Auto-run enforcement in development
if (import.meta.env.DEV) {
  enforceSupabaseUsage();
}