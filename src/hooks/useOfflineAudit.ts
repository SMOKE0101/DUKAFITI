
import { useState, useCallback } from 'react';
import { offlineTestingSuite } from '@/utils/offlineTestingSuite';
import { useToast } from './use-toast';

interface AuditResult {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  tests: Array<{
    name: string;
    success: boolean;
    duration: number;
    details?: any;
    error?: string;
  }>;
  performance: {
    indexedDbReadTime: number;
    indexedDbWriteTime: number;
    cacheHitTime: number;
    syncQueueSize: number;
  };
}

export const useOfflineAudit = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastAuditResult, setLastAuditResult] = useState<AuditResult | null>(null);
  const { toast } = useToast();

  const runCompleteAudit = useCallback(async () => {
    if (isRunning) {
      toast({
        title: "Audit In Progress",
        description: "An offline audit is already running",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    
    try {
      toast({
        title: "Starting Offline Audit",
        description: "Running comprehensive offline functionality tests...",
      });

      const result = await offlineTestingSuite.runCompleteAudit();
      setLastAuditResult(result);

      const successRate = Math.round((result.passed / result.totalTests) * 100);
      
      toast({
        title: `Audit Complete - ${successRate}% Pass Rate`,
        description: `${result.passed}/${result.totalTests} tests passed in ${Math.round(result.duration)}ms`,
        variant: result.failed === 0 ? "default" : "destructive",
      });

      // Log detailed results to console
      console.log('[OfflineAudit] 📊 Complete Results:', result);
      
      return result;

    } catch (error) {
      console.error('[OfflineAudit] ❌ Audit failed:', error);
      
      toast({
        title: "Audit Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, toast]);

  const getAuditSummary = useCallback(() => {
    if (!lastAuditResult) return null;

    const { passed, failed, totalTests, duration, performance } = lastAuditResult;
    const successRate = Math.round((passed / totalTests) * 100);
    
    return {
      successRate,
      totalTests,
      passed,
      failed,
      duration: Math.round(duration),
      performance: {
        indexedDbRead: Math.round(performance.indexedDbReadTime),
        indexedDbWrite: Math.round(performance.indexedDbWriteTime),
        cacheHit: Math.round(performance.cacheHitTime),
        queueSize: performance.syncQueueSize
      },
      timestamp: lastAuditResult.timestamp
    };
  }, [lastAuditResult]);

  const getFailedTests = useCallback(() => {
    if (!lastAuditResult) return [];
    
    return lastAuditResult.tests
      .filter(test => !test.success)
      .map(test => ({
        name: test.name,
        error: test.error,
        duration: Math.round(test.duration)
      }));
  }, [lastAuditResult]);

  const clearAuditResults = useCallback(() => {
    setLastAuditResult(null);
  }, []);

  return {
    isRunning,
    lastAuditResult,
    runCompleteAudit,
    getAuditSummary,
    getFailedTests,
    clearAuditResults
  };
};
