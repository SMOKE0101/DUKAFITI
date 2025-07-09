
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '../../hooks/use-toast';
import { Save, MapPin, Loader2 } from 'lucide-react';

const ShopProfileSettings = () => {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    shopName: '',
    shopDescription: '',
    shopAddress: '',
    contactPhone: '',
    contactEmail: '',
    businessRegistration: '',
  });

  // Load profile data when component mounts
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;

      try {
        // Get profile data from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFormData({
            shopName: profile.shop_name || settings.shopName || '',
            shopDescription: settings.shopDescription || '',
            shopAddress: profile.location || settings.shopAddress || '',
            contactPhone: profile.phone || settings.contactPhone || '',
            contactEmail: profile.email || user.email || '',
            businessRegistration: settings.businessRegistration || '',
          });
        } else {
          // Use settings data if no profile found
          setFormData({
            shopName: settings.shopName || '',
            shopDescription: settings.shopDescription || '',
            shopAddress: settings.shopAddress || '',
            contactPhone: settings.contactPhone || '',
            contactEmail: settings.contactEmail || user.email || '',
            businessRegistration: settings.businessRegistration || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        // Fallback to settings data
        setFormData({
          shopName: settings.shopName || '',
          shopDescription: settings.shopDescription || '',
          shopAddress: settings.shopAddress || '',
          contactPhone: settings.contactPhone || '',
          contactEmail: settings.contactEmail || user.email || '',
          businessRegistration: settings.businessRegistration || '',
        });
      }
    };

    loadProfileData();
  }, [user, settings]);

  const getCurrentLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get address (using a free service)
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = `${data.locality}, ${data.principalSubdivision}, ${data.countryName}`;
            
            setFormData(prev => ({
              ...prev,
              shopAddress: address
            }));
            
            toast({
              title: "Success",
              description: "Location detected and address updated.",
            });
          } else {
            // Fallback to coordinates if reverse geocoding fails
            const address = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
            setFormData(prev => ({
              ...prev,
              shopAddress: address
            }));
            
            toast({
              title: "Location Detected",
              description: "Coordinates added to address field.",
            });
          }
        } catch (error) {
          console.error('Error getting address:', error);
          toast({
            title: "Error",
            description: "Failed to get address. Please enter manually.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Error",
          description: "Failed to get your location. Please check permissions.",
          variant: "destructive",
        });
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update settings
      await updateSettings(formData);
      
      // Update profile in Supabase
      if (user) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            shop_name: formData.shopName,
            location: formData.shopAddress,
            phone: formData.contactPhone,
            email: formData.contactEmail,
            updated_at: new Date().toISOString()
          });
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Profile Information</CardTitle>
        <CardDescription>
          Update your shop's basic information and contact details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop Name *</Label>
              <Input
                id="shopName"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                placeholder="Enter your shop name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+254 712 345 678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopDescription">Shop Description</Label>
            <Textarea
              id="shopDescription"
              value={formData.shopDescription}
              onChange={(e) => setFormData({ ...formData, shopDescription: e.target.value })}
              placeholder="Brief description of your shop"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shopAddress">Shop Address</Label>
            <div className="flex gap-2">
              <Textarea
                id="shopAddress"
                value={formData.shopAddress}
                onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                placeholder="Enter your shop's physical address"
                rows={2}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                className="h-auto"
              >
                {isLoadingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Click the location button to automatically detect your current address
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="shop@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessRegistration">Business Registration</Label>
              <Input
                id="businessRegistration"
                value={formData.businessRegistration}
                onChange={(e) => setFormData({ ...formData, businessRegistration: e.target.value })}
                placeholder="Business registration number"
              />
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Save Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShopProfileSettings;
