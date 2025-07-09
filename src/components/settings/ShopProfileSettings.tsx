
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '../../hooks/useSettings';
import { Store, MapPin, Phone, Mail, FileText } from 'lucide-react';

const ShopProfileSettings = () => {
  const { settings, updateSettings, loading } = useSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    updateSettings({
      shopName: formData.get('shopName') as string,
      shopDescription: formData.get('shopDescription') as string,
      shopAddress: formData.get('shopAddress') as string,
      contactPhone: formData.get('contactPhone') as string,
      contactEmail: formData.get('contactEmail') as string,
      businessRegistration: formData.get('businessRegistration') as string,
      currency: formData.get('currency') as string,
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shop Name */}
        <div className="space-y-2">
          <Label htmlFor="shopName" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Shop Name
          </Label>
          <Input
            id="shopName"
            name="shopName"
            defaultValue={settings.shopName}
            placeholder="Enter your shop name"
            required
          />
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select name="currency" defaultValue={settings.currency}>
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

        {/* Contact Phone */}
        <div className="space-y-2">
          <Label htmlFor="contactPhone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Contact Phone
          </Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            defaultValue={settings.contactPhone}
            placeholder="+254 700 000 000"
          />
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contactEmail" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Contact Email
          </Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={settings.contactEmail}
            placeholder="shop@example.com"
          />
        </div>

        {/* Business Registration */}
        <div className="space-y-2">
          <Label htmlFor="businessRegistration" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Business Registration Number
          </Label>
          <Input
            id="businessRegistration"
            name="businessRegistration"
            defaultValue={settings.businessRegistration}
            placeholder="Enter registration number"
          />
        </div>
      </div>

      {/* Shop Address */}
      <div className="space-y-2">
        <Label htmlFor="shopAddress" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Shop Address
        </Label>
        <Textarea
          id="shopAddress"
          name="shopAddress"
          defaultValue={settings.shopAddress}
          placeholder="Enter your complete shop address"
          rows={3}
        />
      </div>

      {/* Shop Description */}
      <div className="space-y-2">
        <Label htmlFor="shopDescription">Shop Description</Label>
        <Textarea
          id="shopDescription"
          name="shopDescription"
          defaultValue={settings.shopDescription}
          placeholder="Describe your business (optional)"
          rows={4}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" className="px-8">
          Save Profile Settings
        </Button>
      </div>
    </form>
  );
};

export default ShopProfileSettings;
