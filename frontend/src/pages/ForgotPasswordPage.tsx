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
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';

interface ErrorResponse {
  detail?: string;
  errors?: Record<string, string[]>;
}

const ForgotPasswordPage = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState('');
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const validateForm = () => {
    const schema = z.object({
      email: z.string().email('Please enter a valid email address'),
    });

    try {
      schema.parse({ email });
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

    setTouched({ email: true });

    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      await authApi.requestPasswordReset(email);
      toast({
        title: 'Reset Link Sent',
        description:
          "If your email is registered with us, you'll receive a password reset link shortly.",
      });
      setEmail('');
    } catch (error) {
      if (error instanceof AxiosError) {
        const response = error.response?.data as ErrorResponse;
        const errorMessage =
          response?.detail || 'Failed to send reset link. Please try again.';
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

  return (
    <Layout>
      <div className="container-newspaper py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-serif text-center">
                Forgot Password
              </CardTitle>
              <CardDescription className="text-center">
                Enter your email and we'll send you a link to reset your
                password
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                      setApiError('');
                    }}
                    onBlur={() => handleBlur('email')}
                    className={
                      errors.email && touched.email ? 'border-red-500' : ''
                    }
                  />
                  {touched.email && errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Remember your password?{' '}
                </span>
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

export default ForgotPasswordPage;
