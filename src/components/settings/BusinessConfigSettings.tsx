
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '../../hooks/useSettings';
import { Save } from 'lucide-react';

const BusinessConfigSettings = () => {
  const { settings, saveSettings } = useSettings();
  const [formData, setFormData] = useState({
    currency: settings.currency,
    lowStockThreshold: settings.lowStockThreshold,
    businessHours: settings.businessHours,
    receiptNumberFormat: settings.receiptNumberFormat,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Configuration</CardTitle>
        <CardDescription>
          Configure your business operations and default settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                placeholder="10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openTime">Opening Time</Label>
              <Input
                id="openTime"
                type="time"
                value={formData.businessHours.open}
                onChange={(e) => setFormData({
                  ...formData,
                  businessHours: { ...formData.businessHours, open: e.target.value }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closeTime">Closing Time</Label>
              <Input
                id="closeTime"
                type="time"
                value={formData.businessHours.close}
                onChange={(e) => setFormData({
                  ...formData,
                  businessHours: { ...formData.businessHours, close: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptFormat">Receipt Number Format</Label>
            <Input
              id="receiptFormat"
              value={formData.receiptNumberFormat}
              onChange={(e) => setFormData({ ...formData, receiptNumberFormat: e.target.value })}
              placeholder="RCP-{number}"
            />
            <p className="text-sm text-gray-500">
              Use {'{number}'} for auto-incrementing numbers, {'{date}'} for current date
            </p>
          </div>

          <Button type="submit" className="w-full md:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BusinessConfigSettings;
