
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSettings } from '../../hooks/useSettings';
import { Save } from 'lucide-react';

const ShopProfileSettings = () => {
  const { settings, saveSettings, loading } = useSettings();
  const [formData, setFormData] = useState({
    shopName: '',
    location: '',
    businessType: '',
    contactPhone: '',
    shopAddress: '',
  });

  // Update form data when settings are loaded
  useEffect(() => {
    console.log('Settings loaded in ShopProfileSettings:', settings);
    setFormData({
      shopName: settings.shopName || '',
      location: settings.location || '',
      businessType: settings.businessType || '',
      contactPhone: settings.contactPhone || '',
      shopAddress: settings.shopAddress || '',
    });
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving shop profile settings:', formData);
    await saveSettings(formData);
  };

  const businessTypes = [
    'Retail Store',
    'Grocery Store',
    'Restaurant',
    'Pharmacy',
    'Electronics Store',
    'Clothing Store',
    'Hardware Store',
    'Other'
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="shopName" className="block text-sm font-medium text-gray-700">
            Shop Name
          </Label>
          <Input
            id="shopName"
            value={formData.shopName}
            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
            placeholder="Enter your shop name"
            className="w-full bg-gray-100 rounded-xl p-4 border-0 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
            Business Type
          </Label>
          <Select
            value={formData.businessType}
            onValueChange={(value) => setFormData({ ...formData, businessType: value })}
          >
            <SelectTrigger className="w-full bg-gray-100 rounded-xl p-4 border-0 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all duration-200">
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-xl shadow-lg border border-gray-200">
              {businessTypes.map(type => (
                <SelectItem key={type} value={type} className="hover:bg-gray-50 rounded-lg">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
            Contact Phone
          </Label>
          <Input
            id="contactPhone"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            placeholder="+254 XXX XXX XXX"
            className="w-full bg-gray-100 rounded-xl p-4 border-0 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all duration-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="City, County"
            className="w-full bg-gray-100 rounded-xl p-4 border-0 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all duration-200"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shopAddress" className="block text-sm font-medium text-gray-700">
          Shop Address
        </Label>
        <Input
          id="shopAddress"
          value={formData.shopAddress}
          onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
          placeholder="Street address, building details"
          className="w-full bg-gray-100 rounded-xl p-4 border-0 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all duration-200"
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Profile
        </Button>
      </div>
    </form>
  );
};

export default ShopProfileSettings;
