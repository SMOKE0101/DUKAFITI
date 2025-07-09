
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jrmwivphspbxmacqrava.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpybXdpdnBoc3BieG1hY3FyYXZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzYzOTEsImV4cCI6MjA2Njk1MjM5MX0.8_XUV2gd9mVJkMCvBwgWwqWXQjlH_1YcaWD0SxvQrZI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
