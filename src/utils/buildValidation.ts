// Build-time validation for environment variables
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredEnvVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file or Vercel environment settings.'
    );
  }

  // Validate URL format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
    console.warn('VITE_SUPABASE_URL format may be incorrect. Expected format: https://your-project.supabase.co');
  }

  return true;
};

// Validate on module load in development
if (import.meta.env.DEV) {
  validateEnvironment();
}