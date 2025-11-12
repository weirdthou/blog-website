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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const { login, logout } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const location = useLocation();
  const navigate = useNavigate();

  const isAdminLogin = location.pathname === '/admin/login';

  const defaultRedirect = isAdminLogin ? '/admin/dashboard' : '/profile';
  const from = location.state?.from || defaultRedirect;

  const themeColors = {
    accent: isAdminLogin
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-newspaper-accent hover:bg-newspaper-accent/90',
    title: isAdminLogin ? 'text-blue-800' : 'text-newspaper-900',
    link: isAdminLogin
      ? 'text-blue-600 hover:text-blue-800'
      : 'text-newspaper-accent hover:underline',
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
    if (touched[name]) {
      const newErrors = { ...errors };
      if (name === 'email') {
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
      } else if (name === 'password') {
        if (!value) {
          newErrors.password = 'Password is required';
        } else {
          delete newErrors.password;
        }
      }
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});
    setTouched({ email: true, password: true });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        const userRole = (result as any).user?.role;

        if (isAdminLogin && userRole !== 'admin') {
          setError('Access denied. This login is for administrators only.');
          setIsSubmitting(false);
          return;
        }

        if (!isAdminLogin && userRole === 'admin') {
          setError('Please use the admin login page.');
          setIsSubmitting(false);
          logout();
          return;
        }

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        toast({
          title: 'Login successful',
          description: 'You have been successfully logged in.',
          variant: 'default',
        });

        const redirectPath =
          userRole === 'admin' ? '/admin/dashboard' : '/profile';
        navigate(redirectPath, { replace: true });
      } else {
        const errorMessage = result.error?.message || 'Authentication failed';

        if (result.error?.errors) {
          const fieldErrors = result.error.errors;
          const newErrors: { [key: string]: string } = {};

          if (fieldErrors.email) {
            newErrors.email = fieldErrors.email[0];
          }
          if (fieldErrors.password) {
            newErrors.password = fieldErrors.password[0];
          }

          if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
          } else {
            setError(errorMessage);
          }
        } else if (
          errorMessage.toLowerCase().includes('credentials') ||
          errorMessage.toLowerCase().includes('invalid')
        ) {
          setError(
            'Invalid email or password. Please check your credentials and try again.'
          );
        } else if (errorMessage.toLowerCase().includes('email')) {
          setErrors((prev) => ({ ...prev, email: errorMessage }));
        } else if (errorMessage.toLowerCase().includes('password')) {
          setErrors((prev) => ({ ...prev, password: errorMessage }));
        } else if (errorMessage.toLowerCase().includes('verify')) {
          setError('Please verify your email address before logging in.');
        } else if (errorMessage.toLowerCase().includes('locked')) {
          setError(
            'Your account has been temporarily locked. Please try again later or contact support.'
          );
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <Layout>
      <div className="container-newspaper py-12">
        <div className="max-w-md mx-auto">
          <Card className={isAdminLogin ? 'border-blue-200' : ''}>
            <CardHeader className="space-y-1">
              <CardTitle
                className={`text-2xl font-serif text-center ${
                  isAdminLogin ? 'text-blue-800' : ''
                }`}
              >
                {isAdminLogin ? 'Admin Sign In' : 'Sign In'}
              </CardTitle>
              <CardDescription className="text-center">
                {isAdminLogin
                  ? 'Enter your admin credentials to access the dashboard'
                  : 'Enter your email and password to access your account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    disabled={isSubmitting}
                    required
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {touched.email && errors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className={
                        isAdminLogin
                          ? 'text-sm text-blue-600 hover:text-blue-800'
                          : 'text-sm text-newspaper-accent hover:underline'
                      }
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      disabled={isSubmitting}
                      required
                      className={`pr-10 ${
                        errors.password ? 'border-red-500' : ''
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
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>

                <Button
                  type="submit"
                  className={`w-full ${
                    isAdminLogin ? 'bg-blue-600 hover:bg-blue-700' : ''
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-pulse mr-2">•••</span> Signing
                      in...
                    </>
                  ) : isAdminLogin ? (
                    'Sign In to Admin'
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              {!isAdminLogin && (
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    Don't have an account?{' '}
                  </span>
                  <Link
                    to="/register"
                    className="text-newspaper-accent hover:underline"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              <div className="text-center text-sm">
                {isAdminLogin ? (
                  <Link
                    to="/login"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Go to user login
                  </Link>
                ) : (
                  <Link
                    to="/admin/login"
                    className="text-newspaper-accent hover:underline"
                  >
                    Admin login
                  </Link>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
