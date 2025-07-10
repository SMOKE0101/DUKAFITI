
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { Shield, Key, Smartphone, AlertTriangle, CheckCircle, Lock } from 'lucide-react';

const SecuritySettings = () => {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Mock security status
  const securityStatus = {
    passwordStrength: 'Strong',
    twoFactorEnabled: false,
    lastPasswordChange: '30 days ago',
    loginSessions: 3,
    suspiciousActivity: false
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Password Updated",
        description: "Your password has been updated successfully",
      });
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    }, 1500);
  };

  const handleEnable2FA = () => {
    toast({
      title: "Two-Factor Authentication",
      description: "2FA setup will be available in a future update",
    });
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">
            SECURITY OVERVIEW
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Password Strength',
              value: securityStatus.passwordStrength,
              icon: Key,
              status: 'good',
              color: 'border-green-300 text-green-700 dark:text-green-300'
            },
            {
              label: 'Two-Factor Auth',
              value: securityStatus.twoFactorEnabled ? 'Enabled' : 'Disabled',
              icon: Smartphone,
              status: securityStatus.twoFactorEnabled ? 'good' : 'warning',
              color: securityStatus.twoFactorEnabled ? 'border-green-300 text-green-700 dark:text-green-300' : 'border-orange-300 text-orange-700 dark:text-orange-300'
            },
            {
              label: 'Active Sessions',
              value: securityStatus.loginSessions.toString(),
              icon: Lock,
              status: 'neutral',
              color: 'border-blue-300 text-blue-700 dark:text-blue-300'
            },
            {
              label: 'Security Status',
              value: securityStatus.suspiciousActivity ? 'Alert' : 'Good',
              icon: securityStatus.suspiciousActivity ? AlertTriangle : CheckCircle,
              status: securityStatus.suspiciousActivity ? 'error' : 'good',
              color: securityStatus.suspiciousActivity ? 'border-red-300 text-red-700 dark:text-red-300' : 'border-green-300 text-green-700 dark:text-green-300'
            }
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className={`border-2 ${item.color} rounded-xl p-4 bg-transparent`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 border border-current rounded-full flex items-center justify-center opacity-70">
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wide opacity-70">
                    {item.label}
                  </span>
                </div>
                <p className="font-semibold text-lg">{item.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Change Password */}
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
            <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">
            CHANGE PASSWORD
          </h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="font-mono text-sm font-bold uppercase tracking-wide">
              Current Password *
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:border-blue-500"
              required
              disabled={isChangingPassword}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="font-mono text-sm font-bold uppercase tracking-wide">
              New Password *
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:border-blue-500"
              required
              disabled={isChangingPassword}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-mono text-sm font-bold uppercase tracking-wide">
              Confirm New Password *
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-transparent focus:border-blue-500"
              required
              disabled={isChangingPassword}
            />
          </div>

          <Button
            type="submit"
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-mono font-bold uppercase tracking-wide px-8"
          >
            {isChangingPassword ? 'UPDATING...' : 'UPDATE PASSWORD'}
          </Button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white">
            TWO-FACTOR AUTHENTICATION
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>
            <Badge 
              variant={securityStatus.twoFactorEnabled ? "default" : "secondary"}
              className="rounded-full"
            >
              {securityStatus.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
            </Badge>
          </div>
          <Button
            onClick={handleEnable2FA}
            variant={securityStatus.twoFactorEnabled ? "outline" : "default"}
            className="h-12 bg-transparent border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full font-mono font-bold uppercase tracking-wide px-6"
          >
            {securityStatus.twoFactorEnabled ? 'MANAGE' : 'ENABLE'}
          </Button>
        </div>
      </div>

      {/* Security Tips */}
      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-transparent">
        <h3 className="font-mono text-lg font-black uppercase tracking-wider text-gray-900 dark:text-white mb-4">
          SECURITY TIPS
        </h3>
        
        <div className="space-y-3">
          {[
            'Use a strong, unique password for your account',
            'Enable two-factor authentication for additional security',
            'Regularly review your login sessions and devices',
            'Never share your login credentials with others',
            'Log out from shared or public devices'
          ].map((tip, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/30 dark:bg-gray-800/30">
              <div className="w-5 h-5 border border-green-300 rounded-full flex items-center justify-center mt-0.5">
                <CheckCircle className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
