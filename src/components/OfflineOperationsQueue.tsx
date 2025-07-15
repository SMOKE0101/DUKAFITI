import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';
import { useOfflineFirst } from '@/hooks/useOfflineFirst';
import { cn } from '@/lib/utils';

interface QueuedOperation {
  id: string;
  type: 'sale' | 'product' | 'customer' | 'transaction';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
  attempts: number;
  synced: boolean;
}

export const OfflineOperationsQueue = () => {
  const { stats, syncInProgress, forceSync, clearOfflineData } = useOfflineFirst();
  const [isOpen, setIsOpen] = useState(false);
  const [operations, setOperations] = useState<QueuedOperation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<QueuedOperation | null>(null);

  // Load queued operations when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadQueuedOperations();
    }
  }, [isOpen]);

  const loadQueuedOperations = async () => {
    try {
      const { offlineDB } = await import('@/utils/indexedDB');
      const queue = await offlineDB.getSyncQueue();
      setOperations(queue || []);
    } catch (error) {
      console.error('Failed to load queued operations:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'sale': return '💰';
      case 'product': return '📦';
      case 'customer': return '👤';
      case 'transaction': return '💳';
      default: return '📄';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleClearQueue = async () => {
    if (confirm('Are you sure you want to clear all queued operations? This action cannot be undone.')) {
      await clearOfflineData();
      setOperations([]);
    }
  };

  const totalOperations = stats.queued.total;
  const syncProgress = syncInProgress ? 50 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Clock className="h-4 w-4 mr-2" />
          Queue ({totalOperations})
          {totalOperations > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
              {totalOperations}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Offline Operations Queue
          </DialogTitle>
          <DialogDescription>
            View and manage operations waiting to sync when back online
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.queued.high}</div>
                  <div className="text-sm text-muted-foreground">High Priority</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.queued.medium}</div>
                  <div className="text-sm text-muted-foreground">Medium Priority</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.queued.low}</div>
                  <div className="text-sm text-muted-foreground">Low Priority</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalOperations}</div>
                  <div className="text-sm text-muted-foreground">Total Queued</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sync Progress */}
          {syncInProgress && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Synchronizing operations...</div>
                    <Progress value={syncProgress} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={forceSync} 
              disabled={syncInProgress}
              size="sm"
            >
              {syncInProgress ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {syncInProgress ? 'Syncing...' : 'Force Sync'}
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleClearQueue}
              disabled={syncInProgress || totalOperations === 0}
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Queue
            </Button>
          </div>

          {/* Operations List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {operations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Queued Operations</h3>
                  <p className="text-muted-foreground">All operations have been synced successfully!</p>
                </CardContent>
              </Card>
            ) : (
              operations.map((operation) => (
                <Card key={operation.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getOperationIcon(operation.type)}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {operation.operation} {operation.type}
                          </span>
                          
                          <Badge className={cn("text-xs", getPriorityColor(operation.priority))}>
                            {operation.priority}
                          </Badge>
                          
                          {operation.attempts > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {operation.attempts} attempts
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {formatTimestamp(operation.timestamp)}
                        </div>
                        
                        {/* Operation summary */}
                        <div className="text-xs text-muted-foreground mt-1">
                          {operation.type === 'sale' && operation.data?.product_name && (
                            `${operation.data.product_name} - ${operation.data.quantity} units`
                          )}
                          {operation.type === 'product' && operation.data?.name && (
                            operation.data.name
                          )}
                          {operation.type === 'customer' && operation.data?.name && (
                            operation.data.name
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOperation(operation)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Operation Details Dialog */}
        {selectedOperation && (
          <Dialog open={!!selectedOperation} onOpenChange={() => setSelectedOperation(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Operation Details</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <div className="text-sm text-muted-foreground">
                    {selectedOperation.operation} {selectedOperation.type}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <div className="text-sm text-muted-foreground">
                    {selectedOperation.priority}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <div className="text-sm text-muted-foreground">
                    {new Date(selectedOperation.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Data</label>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-40">
                    {JSON.stringify(selectedOperation.data, null, 2)}
                  </pre>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};