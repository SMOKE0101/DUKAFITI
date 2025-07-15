
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Smartphone,
  TestTube2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineFirst } from '@/hooks/useOfflineFirst';
import { OfflineDataManager } from './OfflineDataManager';
import { OfflineOperationsQueue } from './OfflineOperationsQueue';
import { OfflineTestingPanel } from './OfflineTestingPanel';
import OfflineStatus from './OfflineStatus';

const SettingsPage = () => {
  const { user } = useAuth();
  const { isOnline, stats } = useOfflineFirst();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your DukaFiti account and offline capabilities
            </p>
          </div>
        </div>

        {/* Offline Status */}
        <OfflineStatus />

        {/* Main Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="text-sm">{user?.email || 'Not available'}</div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <div className="text-xs font-mono bg-muted p-2 rounded">
                  {user?.id || 'Not available'}
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default">Active</Badge>
                  <Badge variant={isOnline ? "default" : "secondary"}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offline Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Offline Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Cached Data</div>
                  <div className="text-muted-foreground">
                    {stats.cached.products + stats.cached.customers + stats.cached.sales + stats.cached.transactions} items
                  </div>
                </div>
                
                <div>
                  <div className="font-medium">Pending Sync</div>
                  <div className="text-muted-foreground">
                    {stats.queued.total} operations
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex flex-wrap gap-2">
                <OfflineDataManager />
                <OfflineOperationsQueue />
                <OfflineTestingPanel />
              </div>
            </CardContent>
          </Card>

          {/* PWA Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                PWA Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Offline Mode</span>
                  <Badge variant="default">✓ Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Background Sync</span>
                  <Badge variant="default">✓ Active</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>App Installation</span>
                  <Badge variant="secondary">Available</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Push Notifications</span>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-3">
                <div>
                  <div className="font-medium">Data Encryption</div>
                  <div className="text-muted-foreground">
                    All data is encrypted in transit and at rest
                  </div>
                </div>
                
                <div>
                  <div className="font-medium">Local Storage</div>
                  <div className="text-muted-foreground">
                    Offline data is securely stored on your device
                  </div>
                </div>
                
                <div>
                  <div className="font-medium">Sync Security</div>
                  <div className="text-muted-foreground">
                    All sync operations use authenticated connections
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Offline Testing */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <TestTube2 className="h-5 w-5" />
              Professional Offline Testing Suite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                DukaFiti includes a comprehensive testing suite to ensure your offline experience 
                is reliable and professional. Run these tests to verify all offline functionality 
                works correctly.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="font-medium">Core Tests</div>
                  <div className="text-muted-foreground">
                    • Data persistence<br/>
                    • Sync operations<br/>
                    • Offline CRUD
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="font-medium">Performance</div>
                  <div className="text-muted-foreground">
                    • Bulk operations<br/>
                    • Memory usage<br/>
                    • Response times
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="font-medium">Reliability</div>
                  <div className="text-muted-foreground">
                    • Conflict resolution<br/>
                    • Error recovery<br/>
                    • Data integrity
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <OfflineTestingPanel />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
