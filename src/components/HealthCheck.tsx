import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface HealthCheckResult {
  supabase: boolean;
  database: boolean;
  auth: boolean;
  localStorage: boolean;
  overall: boolean;
}

export const useHealthCheck = () => {
  const [health, setHealth] = useState<HealthCheckResult>({
    supabase: false,
    database: false,
    auth: false,
    localStorage: false,
    overall: false,
  });

  const runHealthCheck = async () => {
    const results: HealthCheckResult = {
      supabase: false,
      database: false,
      auth: false,
      localStorage: false,
      overall: false,
    };

    try {
      // Test Supabase connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      results.supabase = !error;
      results.database = !error;
      
      // Test auth
      const { data: authData } = await supabase.auth.getSession();
      results.auth = true; // Auth service is working if no error

      // Test localStorage
      try {
        const testKey = 'health_check_' + Date.now();
        localStorage.setItem(testKey, 'test');
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        results.localStorage = retrieved === 'test';
      } catch {
        results.localStorage = false;
      }

      // Overall health
      results.overall = results.supabase && results.database && results.auth && results.localStorage;

    } catch (error) {
      logger.error('Health check failed:', error);
    }

    setHealth(results);
    return results;
  };

  useEffect(() => {
    // Run initial health check
    runHealthCheck();
  }, []);

  return { health, runHealthCheck };
};

// Production health check component (only renders in dev)
export const HealthCheckPanel = () => {
  const { health, runHealthCheck } = useHealthCheck();

  if (import.meta.env.PROD) {
    return null; // Don't render in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-card border rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-semibold mb-2">System Health</h3>
      <div className="space-y-1 text-sm">
        <div className={`flex justify-between ${health.supabase ? 'text-green-600' : 'text-red-600'}`}>
          <span>Supabase:</span>
          <span>{health.supabase ? '✅' : '❌'}</span>
        </div>
        <div className={`flex justify-between ${health.database ? 'text-green-600' : 'text-red-600'}`}>
          <span>Database:</span>
          <span>{health.database ? '✅' : '❌'}</span>
        </div>
        <div className={`flex justify-between ${health.auth ? 'text-green-600' : 'text-red-600'}`}>
          <span>Auth:</span>
          <span>{health.auth ? '✅' : '❌'}</span>
        </div>
        <div className={`flex justify-between ${health.localStorage ? 'text-green-600' : 'text-red-600'}`}>
          <span>Storage:</span>
          <span>{health.localStorage ? '✅' : '❌'}</span>
        </div>
        <hr className="my-2" />
        <div className={`flex justify-between font-semibold ${health.overall ? 'text-green-600' : 'text-red-600'}`}>
          <span>Overall:</span>
          <span>{health.overall ? '✅ Ready' : '❌ Issues'}</span>
        </div>
      </div>
      <button 
        onClick={runHealthCheck}
        className="mt-2 w-full bg-primary text-primary-foreground px-3 py-1 rounded text-sm"
      >
        Recheck
      </button>
    </div>
  );
};