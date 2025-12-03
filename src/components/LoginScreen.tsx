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
    <div className="min-h-screen bg-gradient-to-br from-[#0a1128] via-[#0a1128] to-[#1a0808] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative accents */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-[#e10600] opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-40 left-10 w-60 h-60 bg-[#e10600] opacity-5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-16">
          <div className="inline-block flex flex-col items-center">
            <img src="/logo.png" alt="PathXpress Logo" className="h-16 mb-4 object-contain" />
            <div className="text-[#e10600] tracking-[0.3em] text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
              DRIVER
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="space-y-5">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-[#e10600] bg-[#e10600]/10 p-3 rounded-xl border border-[#e10600]/20">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Phone/Email Input */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555555]" />
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username (driver)"
              className="w-full bg-[#050505]/40 backdrop-blur-sm border border-[#555555]/30 rounded-2xl px-12 py-4 text-[#f2f4f8] placeholder-[#555555] focus:outline-none focus:border-[#e10600] transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555555]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (12345)"
              className="w-full bg-[#050505]/40 backdrop-blur-sm border border-[#555555]/30 rounded-2xl px-12 py-4 text-[#f2f4f8] placeholder-[#555555] focus:outline-none focus:border-[#e10600] transition-all"
            />
          </div>

          {/* Login Button */}
          <button
            onClick={handleLoginSubmit}
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl transition-all shadow-lg ${isLoading
              ? 'bg-[#555555]/50 cursor-not-allowed'
              : 'bg-[#e10600] hover:bg-[#c10500] active:scale-[0.98] shadow-[#e10600]/20'
              } text-[#f2f4f8]`}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {isLoading ? 'LOGGING IN...' : 'LOGIN'}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center pt-2">
            <a href="#" className="text-[#555555] hover:text-[#f2f4f8] transition-colors">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
