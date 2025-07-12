
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '../../hooks/useSettings';
import { Save } from 'lucide-react';

const NotificationSettings = () => {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    lowStockAlerts: settings.lowStockAlerts,
    dailySummary: settings.dailySummary,
    debtReminders: settings.debtReminders,
    paymentNotifications: settings.paymentNotifications,
    emailNotifications: settings.emailNotifications,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const notifications = [
    {
      id: 'lowStockAlerts',
      label: 'Low Stock Alerts',
      description: 'Get notified when products are running low',
    },
    {
      id: 'dailySummary',
      label: 'Daily Sales Summary',
      description: 'Receive daily sales performance summaries',
    },
    {
      id: 'debtReminders',
      label: 'Debt Reminders',
      description: 'Reminders about outstanding customer debts',
    },
    {
      id: 'paymentNotifications',
      label: 'Payment Notifications',
      description: 'Notifications when customers make payments',
    },
    {
      id: 'emailNotifications',
      label: 'Email Notifications',
      description: 'Send notifications via email (requires setup)',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Control which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex items-center justify-between space-x-4">
                <div className="flex-1">
                  <Label htmlFor={notification.id} className="text-base font-medium">
                    {notification.label}
                  </Label>
                  <p className="text-sm text-gray-500">{notification.description}</p>
                </div>
                <Switch
                  id={notification.id}
                  checked={formData[notification.id as keyof typeof formData] as boolean}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, [notification.id]: checked })
                  }
                />
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full md:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Save Notification Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
