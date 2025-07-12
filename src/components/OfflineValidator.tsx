
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  Wifi,
  HardDrive,
  Zap
} from 'lucide-react';
import { useOfflineValidator } from '../hooks/useOfflineValidator';

const OfflineValidator: React.FC = () => {
  const { 
    isValidating, 
    lastValidation, 
    validateAndReport 
  } = useOfflineValidator();

  if (!lastValidation && !isValidating) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Offline System Validator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Run comprehensive tests to validate offline functionality
          </p>
          <Button onClick={validateAndReport} className="w-full">
            <Zap className="w-4 h-4 mr-2" />
            Run Offline Tests
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Offline System Status
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={validateAndReport}
            disabled={isValidating}
          >
            {isValidating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isValidating && (
          <div className="space-y-2">
            <Progress value={75} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              Running comprehensive offline tests...
            </p>
          </div>
        )}

        {lastValidation && (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center gap-2">
              {lastValidation.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">
                {lastValidation.success ? 'All Tests Passed' : 'Issues Detected'}
              </span>
              
              <div className="flex gap-2 ml-auto">
                {lastValidation.errors.length > 0 && (
                  <Badge variant="destructive">
                    {lastValidation.errors.length} Error{lastValidation.errors.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {lastValidation.warnings.length > 0 && (
                  <Badge variant="secondary">
                    {lastValidation.warnings.length} Warning{lastValidation.warnings.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>

            {/* Errors */}
            {lastValidation.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Critical Issues
                </h4>
                <div className="space-y-1">
                  {lastValidation.errors.map((error, index) => (
                    <div key={index} className="text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {lastValidation.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-orange-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Warnings
                </h4>
                <div className="space-y-1">
                  {lastValidation.warnings.map((warning, index) => (
                    <div key={index} className="text-sm bg-orange-50 dark:bg-orange-950/20 p-2 rounded border border-orange-200 dark:border-orange-800">
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            {lastValidation.stats && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Storage Statistics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {Object.entries(lastValidation.stats).map(([key, value]) => (
                    <div key={key} className="bg-muted p-2 rounded flex justify-between">
                      <span className="capitalize">{key}:</span>
                      <span className="font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {lastValidation.success && (
              <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  🎉 Offline functionality is working perfectly! Your app will work seamlessly even without internet connection.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OfflineValidator;
