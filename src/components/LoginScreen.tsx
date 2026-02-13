import { useState } from 'react';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface LoginScreenProps {
  onLogin: (token: string, driver: any) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async () => {
    if (!email || !password) {
      setError('Please enter username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.login(email, password);
      onLogin(response.token, response.driver);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative accents */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-red-600 opacity-5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 left-10 w-60 h-60 bg-red-600 opacity-5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-16">
          <div className="inline-block flex flex-col items-center">
            <img src="/logo.png" alt="PathXpress Logo" className="h-16 mb-4 object-contain" />
            <div className="text-red-600 tracking-[0.3em] text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
              DRIVER
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 text-red-600 bg-red-50 p-4 rounded-xl border border-red-100 animate-in slide-in-from-top-2 fade-in duration-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm font-medium leading-relaxed">
                {error.includes('{') ? 'Login failed. Please check your connection or credentials.' : error}
              </div>
            </div>
          )}

          {/* Phone/Email Input */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username"
              className="w-full bg-white border border-gray-200 rounded-2xl px-12 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 transition-all shadow-sm"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white border border-gray-200 rounded-2xl px-12 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 transition-all shadow-sm"
            />
          </div>

          {/* Login Button */}
          <button
            onClick={handleLoginSubmit}
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl transition-all shadow-lg font-medium ${isLoading
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : 'bg-red-600 hover:bg-red-700 active:scale-[0.98] shadow-red-200 text-white'
              }`}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {isLoading ? 'LOGGING IN...' : 'LOGIN'}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center pt-2">
            <a href="#" className="text-gray-500 hover:text-red-600 transition-colors">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
