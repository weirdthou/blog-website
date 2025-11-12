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
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Name is required';
        } else {
          delete newErrors.name;
        }
        break;

      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else if (value.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        } else if (!/[A-Z]/.test(value)) {
          newErrors.password =
            'Password must contain at least one uppercase letter';
        } else if (!/[a-z]/.test(value)) {
          newErrors.password =
            'Password must contain at least one lowercase letter';
        } else if (!/[0-9]/.test(value)) {
          newErrors.password = 'Password must contain at least one number';
        } else if (!/[^A-Za-z0-9]/.test(value)) {
          newErrors.password =
            'Password must contain at least one special character';
        } else {
          delete newErrors.password;
        }
        break;

      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newFormData = { ...formData, [name]: value };
    setFormData(newFormData);

    if (touched[name]) {
      validateField(name, value);

      if (name === 'password' && touched.confirmPassword) {
        validateField('confirmPassword', formData.confirmPassword);
      }
    }
    setApiError('');
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    Object.keys(formData).forEach((field) => {
      validateField(field, formData[field as keyof typeof formData]);
    });
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allTouched = Object.keys(formData).reduce(
      (acc, field) => ({
        ...acc,
        [field]: true,
      }),
      {}
    );
    setTouched(allTouched);

    if (!validateForm()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const result = await register(
        formData.name,
        formData.email,
        formData.password
      );

      if (result.success) {
        toast({
          title: 'Registration successful',
          description: 'Your account has been created successfully.',
        });
        navigate(result.user?.role === 'admin' ? '/admin' : '/profile');
      } else {
        setApiError(result.error?.message || 'Registration failed');

        if (result.error?.errors) {
          const fieldErrors: { [key: string]: string } = {};
          Object.entries(result.error.errors).forEach(([field, messages]) => {
            fieldErrors[field] = messages[0];
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
                Create an account
              </CardTitle>
              <CardDescription className="text-center">
                Join our community and start sharing your thoughts
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
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                    required
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {touched.name && errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    required
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {touched.email && errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      required
                      className={
                        errors.password ? 'border-red-500 pr-10' : 'pr-10'
                      }
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
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      required
                      className={
                        errors.confirmPassword
                          ? 'border-red-500 pr-10'
                          : 'pr-10'
                      }
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
                  {isSubmitting ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Already have an account?{' '}
                </span>
                <Link
                  to="/login"
                  className="text-newspaper-accent hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
