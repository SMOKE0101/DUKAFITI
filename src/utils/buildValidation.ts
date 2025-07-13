// Build-time validation for environment variables
export const validateEnvironment = () => {
  // In production, fallback values are already provided in client.ts
  // so this validation is less critical
  if (import.meta.env.PROD) {
    return true;
  }

  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredEnvVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `Missing environment variables: ${missingVars.join(', ')}\n` +
      'Using fallback values for development.'
    );
  }

  // Validate URL format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
    console.warn('VITE_SUPABASE_URL format may be incorrect. Expected format: https://your-project.supabase.co');
  }

  return true;
};

// Validate on module load in development only
if (import.meta.env.DEV) {
  try {
    validateEnvironment();
  } catch (error) {
    console.warn('Environment validation warning:', error);
  }
}