
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TestTube2, 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2,
  BarChart3,
  Shield,
  Zap,
  Database
} from 'lucide-react';
import { offlineTestingSuite } from '@/utils/offlineTestingSuite';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export const OfflineTestingPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [progress, setProgress] = useState(0);

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const testResults = await offlineTestingSuite.runAllTests();
      
      clearInterval(progressInterval);
      setProgress(100);
      setResults(testResults);
      
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestIcon = (test: TestResult) => {
    if (test.name.includes('Performance')) return BarChart3;
    if (test.name.includes('Security') || test.name.includes('Integrity')) return Shield;
    if (test.name.includes('Service Worker') || test.name.includes('Cache')) return Zap;
    return Database;
  };

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TestTube2 className="h-4 w-4 mr-2" />
          Offline Tests
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube2 className="h-5 w-5" />
            Offline Functionality Testing Suite
          </DialogTitle>
          <DialogDescription>
            Comprehensive testing for offline-first PWA capabilities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Suite Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={runTests} 
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isRunning ? 'Running Tests...' : 'Run All Tests'}
                </Button>
                
                {results.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={passRate === 100 ? "default" : passRate > 50 ? "secondary" : "destructive"}
                      className="text-sm"
                    >
                      {passedTests}/{totalTests} Passed ({Math.round(passRate)}%)
                    </Badge>
                  </div>
                )}
              </div>
              
              {isRunning && (
                <div className="mt-4 space-y-2">
                  <Progress value={progress} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    Running comprehensive offline functionality tests...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results Overview */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Results Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{totalTests - passedTests}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">{totalTests}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">{Math.round(passRate)}%</div>
                    <div className="text-sm text-muted-foreground">Pass Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Individual Test Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Details</h3>
              
              {results.map((result, index) => {
                const TestIcon = getTestIcon(result);
                
                return (
                  <Card key={index} className={`border-l-4 ${
                    result.passed 
                      ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20' 
                      : 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <TestIcon className="h-5 w-5 text-muted-foreground" />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{result.name}</span>
                            {result.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground mt-1">
                            {result.passed ? (
                              result.details || 'Test passed successfully'
                            ) : (
                              result.error || 'Test failed'
                            )}
                          </div>
                        </div>
                        
                        <Badge 
                          variant={result.passed ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {result.passed ? 'PASS' : 'FAIL'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Test Categories Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium mb-2">Core Functionality</div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Data Persistence (IndexedDB)</li>
                    <li>• Sync Queue Operations</li>
                    <li>• Offline CRUD Operations</li>
                    <li>• Conflict Resolution</li>
                  </ul>
                </div>
                
                <div>
                  <div className="font-medium mb-2">Performance & Reliability</div>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Bulk Data Operations</li>
                    <li>• Data Integrity Checks</li>
                    <li>• Cache Management</li>
                    <li>• Service Worker Integration</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Assessment */}
          {results.length > 0 && (
            <Card className={`border-2 ${
              passRate === 100 
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                : passRate >= 80
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                : 'border-red-500 bg-red-50 dark:bg-red-950/20'
            }`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {passRate === 100 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : passRate >= 80 ? (
                    <Shield className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Professional Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {passRate === 100 ? (
                  <div className="space-y-2">
                    <div className="font-medium text-green-800 dark:text-green-200">
                      🎉 Excellent! Your offline-first PWA is production-ready!
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      All critical offline functionality tests passed. Your app provides a seamless 
                      offline experience comparable to industry leaders like Betika. Users can 
                      confidently work offline with automatic sync when back online.
                    </div>
                  </div>
                ) : passRate >= 80 ? (
                  <div className="space-y-2">
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">
                      ⚡ Good progress! Minor issues need attention.
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      Most core functionality works well, but some optimizations are needed 
                      for a truly professional offline experience. Review the failed tests above.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="font-medium text-red-800 dark:text-red-200">
                      🚨 Critical issues detected. Offline functionality needs work.
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">
                      Several core offline features are not working correctly. This could lead 
                      to data loss and poor user experience. Please address the failed tests.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
