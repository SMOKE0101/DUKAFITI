import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import CubeLogo from '@/components/branding/CubeLogo';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    if (!email || !password || !shopName) {
      toast.error('Please fill in all fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await signUp({
        email: email,
        password: password,
        options: {
          data: {
            shop_name: shopName,
          },
          emailRedirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) {
        console.error('Sign-up error:', error);
        setApiError(error.message || 'An error occurred during sign-up.');
        toast.error(error.message || 'An error occurred during sign-up.');
      } else {
        toast.success('Check your email for verification!');
        navigate('/verify-email');
      }
    } catch (err) {
      console.error('Sign-up error:', err);
      setApiError('An unexpected error occurred.');
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Branding Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CubeLogo size="lg" />
          </div>
          <h1 className="font-caesar text-4xl font-normal text-gray-900 dark:text-white tracking-wide">
            DUKAFITI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Start managing your business today
          </p>
        </div>

        {/* Sign Up Form */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center text-gray-500 dark:text-gray-400">
              Enter your details below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {apiError && (
              <Alert variant="destructive">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                type="text"
                placeholder="Your Shop Name"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Your Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 w-9 h-9"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Bottom Links */}
        <div className="text-center space-y-4">
          <Link
            to="/sign-in"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Already have an account? Sign In
          </Link>
          <Link
            to="/"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 block"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
