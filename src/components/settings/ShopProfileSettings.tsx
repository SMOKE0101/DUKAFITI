
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSettings } from '../../hooks/useSettings';
import { Store, User, MapPin } from 'lucide-react';

const ShopProfileSettings = () => {
  const { settings, updateSettings, loading } = useSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    updateSettings({
      shopName: formData.get('shopName') as string,
      contactPhone: formData.get('contactPhone') as string,
      shopAddress: formData.get('shopAddress') as string,
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Store Name */}
        <div className="space-y-2">
          <Label htmlFor="shopName" className="flex items-center gap-2">
            <Store className="w-4 h-4" />
            Store Name
          </Label>
          <Input
            id="shopName"
            name="shopName"
            defaultValue={settings.shopName}
            placeholder="Enter your store name"
            required
          />
        </div>

        {/* Owner Name */}
        <div className="space-y-2">
          <Label htmlFor="contactPhone" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Owner Name
          </Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            defaultValue={settings.contactPhone}
            placeholder="Enter owner name"
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="shopAddress" className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location
        </Label>
        <Textarea
          id="shopAddress"
          name="shopAddress"
          defaultValue={settings.shopAddress}
          placeholder="Enter your store location/address"
          rows={3}
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
