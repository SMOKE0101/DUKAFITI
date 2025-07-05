
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '../../hooks/useSettings';
import { Save, MessageSquare, Users, Bell } from 'lucide-react';

const SMSSettings = () => {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    smsNotificationsEnabled: settings.smsNotifications || false,
    smsPhoneNumber: settings.smsPhoneNumber || '',
    debtReminderMessage: settings.debtReminderMessage || 'Hello {customerName}, you have an outstanding debt of {amount}. Please settle by {dueDate}. Thank you.',
    paymentConfirmationMessage: settings.paymentConfirmationMessage || 'Thank you {customerName}! Payment of {amount} received. Outstanding balance: {balance}.',
    lowStockMessage: settings.lowStockMessage || 'Alert: {productName} is running low. Current stock: {currentStock}',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      smsNotifications: formData.smsNotificationsEnabled,
      smsPhoneNumber: formData.smsPhoneNumber,
      debtReminderMessage: formData.debtReminderMessage,
      paymentConfirmationMessage: formData.paymentConfirmationMessage,
      lowStockMessage: formData.lowStockMessage,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            SMS Configuration
          </CardTitle>
          <CardDescription>
            Configure SMS notifications for customers and business alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="smsEnabled"
                checked={formData.smsNotificationsEnabled}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, smsNotificationsEnabled: checked })
                }
              />
              <Label htmlFor="smsEnabled">Enable SMS Notifications</Label>
            </div>

            {formData.smsNotificationsEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="smsPhone">Business SMS Phone Number</Label>
                  <Input
                    id="smsPhone"
                    value={formData.smsPhoneNumber}
                    onChange={(e) => setFormData({ ...formData, smsPhoneNumber: e.target.value })}
                    placeholder="+254700000000"
                  />
                  <p className="text-sm text-gray-500">
                    The phone number customers will see SMS messages from
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Customer Messages
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="debtReminder">Debt Reminder Message</Label>
                    <Textarea
                      id="debtReminder"
                      value={formData.debtReminderMessage}
                      onChange={(e) => setFormData({ ...formData, debtReminderMessage: e.target.value })}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Available variables: {'{customerName}'}, {'{amount}'}, {'{dueDate}'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentConfirmation">Payment Confirmation Message</Label>
                    <Textarea
                      id="paymentConfirmation"
                      value={formData.paymentConfirmationMessage}
                      onChange={(e) => setFormData({ ...formData, paymentConfirmationMessage: e.target.value })}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Available variables: {'{customerName}'}, {'{amount}'}, {'{balance}'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    Business Alerts
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="lowStockAlert">Low Stock Alert Message</Label>
                    <Textarea
                      id="lowStockAlert"
                      value={formData.lowStockMessage}
                      onChange={(e) => setFormData({ ...formData, lowStockMessage: e.target.value })}
                      rows={2}
                    />
                    <p className="text-xs text-gray-500">
                      Available variables: {'{productName}'}, {'{currentStock}'}
                    </p>
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full md:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Save SMS Settings
            </Button>
          </form>
        </CardContent>
      </Card>

      {formData.smsNotificationsEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>SMS Service Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> SMS functionality requires a compatible SMS service provider. 
                Contact DukaFiti support to set up SMS services for your account.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SMSSettings;
