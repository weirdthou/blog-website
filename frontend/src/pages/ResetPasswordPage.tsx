import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api/auth';
import { AxiosError } from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

interface ErrorResponse {
  detail?: string;
  errors?: Record<string, string[]>;
}

const ResetPasswordPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const validateForm = () => {
    const schema = z
      .object({
        password: z
          .string()
          .min(8, 'Password must be at least 8 characters')
          .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
          .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
          .regex(/[0-9]/, 'Password must contain at least one number')
          .regex(
            /[^A-Za-z0-9]/,
            'Password must contain at least one special character'
          ),
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });

    try {
      schema.parse({ password, confirmPassword });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setApiError('Invalid or expired reset link. Please request a new one.');
      return;
    }

    setTouched({ password: true, confirmPassword: true });

    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      await authApi.resetPassword(token, password);
      toast({
        title: 'Password Reset Successful',
        description:
          'Your password has been changed. You can now log in with your new password.',
      });
      navigate('/login');
    } catch (error) {
      if (error instanceof AxiosError) {
        const response = error.response?.data as ErrorResponse;
        const errorMessage =
          response?.detail || 'Failed to reset password. Please try again.';
        setApiError(errorMessage);

        if (response?.errors) {
          const fieldErrors: { [key: string]: string } = {};
          Object.entries(response.errors).forEach(([field, messages]) => {
            fieldErrors[field] = Array.isArray(messages)
              ? messages[0]
              : String(messages);
          });
          setErrors(fieldErrors);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token || !email) {
    return (
      <Layout>
        <div className="container-newspaper py-12">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-serif text-center">
                  Invalid Reset Link
                </CardTitle>
                <CardDescription className="text-center">
                  This password reset link is invalid or has expired.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col space-y-4">
                <Link to="/forgot-password" className="w-full">
                  <Button className="w-full">Request New Reset Link</Button>
                </Link>
                <div className="text-center text-sm">
                  <Link
                    to="/login"
                    className="text-newspaper-accent hover:underline"
                  >
                    Back to login
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-newspaper py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-serif text-center">
                Reset Password
              </CardTitle>
              <CardDescription className="text-center">
                Reset password for {email}
              </CardDescription>
              <CardDescription className="text-center text-sm text-green-600">
                Reset token has been applied automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {apiError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                    {apiError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password)
                          setErrors({ ...errors, password: '' });
                        setApiError('');
                      }}
                      onBlur={() => handleBlur('password')}
                      className={`pr-10 ${
                        errors.password && touched.password
                          ? 'border-red-500'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {touched.password && errors.password && (
                    <p className="text-sm text-red-500">{errors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword)
                          setErrors({ ...errors, confirmPassword: '' });
                        setApiError('');
                      }}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={`pr-10 ${
                        errors.confirmPassword && touched.confirmPassword
                          ? 'border-red-500'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm">
                <Link
                  to="/login"
                  className="text-newspaper-accent hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPasswordPage;
