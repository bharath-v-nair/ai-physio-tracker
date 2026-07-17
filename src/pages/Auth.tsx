import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Activity } from 'lucide-react';

export const Auth = ({ mode = 'login' }: { mode?: 'login' | 'register' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const emailInput = document.getElementById('email') as HTMLInputElement;
      const passwordInput = document.getElementById('password') as HTMLInputElement;
      
      const formData = new URLSearchParams();
      formData.append('username', emailInput.value);
      formData.append('password', passwordInput.value);
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        alert('Login failed. Please use test@test.com / password');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#4F8EF7]/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[600px] h-[600px] bg-[#34C759]/10 rounded-full blur-3xl opacity-50" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-8">
        <Link to="/" className="inline-flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-[#4F8EF7] flex items-center justify-center shadow-sm">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-gray-900">PhysioAI</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card variant="glass" className="border-white/60 shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-center">
              {mode === 'login' ? 'Welcome back' : 'Create an account'}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === 'login' 
                ? 'Enter your credentials to access your account'
                : 'Start your rehabilitation journey today'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'register' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F8EF7] focus:border-[#4F8EF7] sm:text-sm transition-colors bg-white/50 backdrop-blur-sm"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F8EF7] focus:border-[#4F8EF7] sm:text-sm transition-colors bg-white/50 backdrop-blur-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4F8EF7] focus:border-[#4F8EF7] sm:text-sm transition-colors bg-white/50 backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-[#4F8EF7] focus:ring-[#4F8EF7] border-gray-300 rounded" />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">Remember me</label>
                  </div>
                  <div className="text-sm">
                    <a href="#" className="font-medium text-[#4F8EF7] hover:text-[#3B72C6]">Forgot your password?</a>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full rounded-xl h-12 text-base" isLoading={isLoading}>
                {mode === 'login' ? 'Sign in' : 'Sign up'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center pt-2">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <Link to={mode === 'login' ? '/register' : '/login'} className="font-medium text-[#4F8EF7] hover:text-[#3B72C6]">
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
