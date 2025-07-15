
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOfflineAudit } from '@/hooks/useOfflineAudit';
import { 
  TestTube, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  Zap,
  Trash,
  RefreshCw
} from 'lucide-react';

export const OfflineAuditPanel: React.FC = () => {
  const { 
    isRunning, 
    runCompleteAudit, 
    getAuditSummary, 
    getFailedTests, 
    clearAuditResults 
  } = useOfflineAudit();
  
  const [showDetails, setShowDetails] = useState(false);
  const auditSummary = getAuditSummary();
  const failedTests = getFailedTests();

  const handleRunAudit = async () => {
    try {
      await runCompleteAudit();
    } catch (error) {
      console.error('Audit failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Offline Functionality Audit
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Control Panel */}
        <div className="flex gap-3">
          <Button 
            onClick={handleRunAudit}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Complete Audit
              </>
            )}
          </Button>
          
          {auditSummary && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={clearAuditResults}
                className="flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                Clear Results
              </Button>
            </>
          )}
        </div>

        {/* Progress Indicator */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Running comprehensive offline tests...
            </div>
            <Progress value={50} className="w-full" />
          </div>
        )}

        {/* Audit Results Summary */}
        {auditSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className={`border-2 ${auditSummary.successRate === 100 ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl font-bold">{auditSummary.successRate}%</p>
                  </div>
                  {auditSummary.successRate === 100 ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-orange-600" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tests Passed</p>
                    <p className="text-2xl font-bold text-green-600">{auditSummary.passed}/{auditSummary.totalTests}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-2xl font-bold">{auditSummary.duration}ms</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Queue Size</p>
                    <p className="text-2xl font-bold">{auditSummary.performance.queueSize}</p>
                  </div>
                  <Database className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Performance Metrics */}
        {auditSummary && showDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">IndexedDB Read</span>
                  <Badge variant={auditSummary.performance.indexedDbRead < 50 ? "default" : "destructive"}>
                    {auditSummary.performance.indexedDbRead}ms
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">IndexedDB Write</span>
                  <Badge variant={auditSummary.performance.indexedDbWrite < 100 ? "default" : "destructive"}>
                    {auditSummary.performance.indexedDbWrite}ms
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium">Cache Hit</span>
                  <Badge variant={auditSummary.performance.cacheHit < 20 ? "default" : "destructive"}>
                    {auditSummary.performance.cacheHit}ms
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed Tests */}
        {failedTests.length > 0 && showDetails && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                <XCircle className="h-5 w-5" />
                Failed Tests ({failedTests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {failedTests.map((test, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-red-800">{test.name}</p>
                        <p className="text-sm text-red-600 mt-1">{test.error}</p>
                      </div>
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        {test.duration}ms
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => (window as any).__runOfflineAudit?.()}>
              Console Test
            </Button>
            <Button size="sm" variant="outline" onClick={() => console.log('Network status:', navigator.onLine)}>
              Check Network
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              Reload App
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
