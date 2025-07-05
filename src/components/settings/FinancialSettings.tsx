
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '../../hooks/useSettings';
import { Save, DollarSign, AlertTriangle, Percent } from 'lucide-react';

const FinancialSettings = () => {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState({
    defaultDebtLimit: settings.defaultDebtLimit,
    paymentReminderDays: settings.paymentReminderDays,
    enablePenalty: settings.enablePenalty,
    penaltyRate: settings.penaltyRate,
    penaltyGraceDays: settings.penaltyGraceDays,
    interestRate: settings.interestRate,
    mpesaTillNumber: settings.mpesaTillNumber,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Debt Management
          </CardTitle>
          <CardDescription>
            Configure customer debt limits and payment terms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultDebtLimit">Default Debt Limit (KSh)</Label>
                <Input
                  id="defaultDebtLimit"
                  type="number"
                  min="0"
                  value={formData.defaultDebtLimit}
                  onChange={(e) => setFormData({ ...formData, defaultDebtLimit: parseInt(e.target.value) || 0 })}
                  placeholder="10000"
                />
                <p className="text-sm text-gray-500">
                  Maximum debt amount allowed for new customers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentReminderDays">Payment Reminder (Days)</Label>
                <Input
                  id="paymentReminderDays"
                  type="number"
                  min="1"
                  value={formData.paymentReminderDays}
                  onChange={(e) => setFormData({ ...formData, paymentReminderDays: parseInt(e.target.value) || 7 })}
                  placeholder="7"
                />
                <p className="text-sm text-gray-500">
                  Send reminders before debt is due
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mpesaTillNumber">M-Pesa Till Number</Label>
              <Input
                id="mpesaTillNumber"
                value={formData.mpesaTillNumber}
                onChange={(e) => setFormData({ ...formData, mpesaTillNumber: e.target.value })}
                placeholder="123456"
              />
              <p className="text-sm text-gray-500">
                Your M-Pesa Till Number for customer payments
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Penalty & Interest Settings
          </CardTitle>
          <CardDescription>
            Optional features for managing overdue debts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="enablePenalty"
                checked={formData.enablePenalty}
                onCheckedChange={(checked) => setFormData({ ...formData, enablePenalty: checked })}
              />
              <Label htmlFor="enablePenalty">Enable Penalty for Overdue Debts</Label>
            </div>

            {formData.enablePenalty && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="penaltyGraceDays">Penalty Grace Period (Days)</Label>
                  <Input
                    id="penaltyGraceDays"
                    type="number"
                    min="0"
                    value={formData.penaltyGraceDays}
                    onChange={(e) => setFormData({ ...formData, penaltyGraceDays: parseInt(e.target.value) || 0 })}
                    placeholder="7"
                  />
                  <p className="text-sm text-orange-600">
                    Days after due date before penalty applies
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penaltyRate">Penalty Rate (%)</Label>
                  <div className="relative">
                    <Input
                      id="penaltyRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.penaltyRate}
                      onChange={(e) => setFormData({ ...formData, penaltyRate: parseFloat(e.target.value) || 0 })}
                      placeholder="5"
                    />
                    <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-orange-600">
                    Percentage penalty on overdue amount
                  </p>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (% per month)</Label>
                  <div className="relative">
                    <Input
                      id="interestRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-orange-600">
                    Monthly interest rate on outstanding debts (optional)
                  </p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">How Penalty System Works:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Customers get a grace period after the due date</li>
                <li>• After grace period, penalty percentage is added to debt</li>
                <li>• Interest is calculated monthly on outstanding amounts</li>
                <li>• All calculations are automatic and transparent</li>
              </ul>
            </div>

            <Button onClick={handleSubmit} className="w-full md:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Save Financial Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSettings;
