import { useState } from 'react';
import { api } from '../services/api';
import { biometricService } from '../services/biometric';
import { BiometryType } from '@aparajita/capacitor-biometric-auth';
import { useEffect } from 'react';

interface LoginScreenProps {
  onLogin: (token: string, driver: any) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
    biometricService.checkAvailability().then(available => {
      setBiometricsAvailable(available);
      setBiometricsEnabled(biometricService.isBiometricEnabled());
    });
  }, []);

  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);
      const credentials = await biometricService.loginWithBiometric();
      if (credentials) {
        // Auto-login with stored credentials
        const response = await api.login(credentials.username, credentials.password);
        onLogin(response.token, response.driver);
      } else {
        // Failed or cancelled - do nothing or show error
        // If credentials returned null but no error thrown, it might be just cancellation.
        // But loginWithBiometric internal error handling logs it.
      }
    } catch (err: any) {
      setError('Biometric login failed. Please use password.');
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden font-sans">
      {/* Decorative accents */}
      <div className="absolute top-20 right-10 w-40 h-40 bg-primary opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-10 w-60 h-60 bg-primary opacity-5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-16">
          <div className="inline-flex flex-col items-center">
            <img src="/logo.png" alt="PathXpress Logo" className="h-16 mb-4 object-contain" />
            <div className="text-primary tracking-[0.3em] text-sm font-medium">DRIVER</div>
          </div>
        </div>

        {/* Login Form */}
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
              <span className="material-symbols-rounded text-xl shrink-0 mt-0.5">error</span>
              <div className="text-sm font-medium leading-relaxed">
                {error.includes('{') ? 'Login failed. Please check your connection or credentials.' : error}
              </div>
            </div>
          )}

          <div className="relative">
            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500">person</span>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username"
              className="w-full bg-card border border-gray-800/50 rounded-xl px-12 py-4 text-foreground placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="relative">
            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500">lock</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-card border border-gray-800/50 rounded-xl px-12 py-4 text-foreground placeholder-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </div>

          <button
            onClick={handleLoginSubmit}
            disabled={isLoading}
            className={`w-full py-4 rounded-xl transition-all font-bold text-base ${isLoading ? 'bg-gray-800 cursor-not-allowed text-gray-500' : 'bg-primary text-white active:scale-[0.98] shadow-lg shadow-red-900/30'
              }`}
          >
            {isLoading ? 'LOGGING IN...' : 'LOGIN'}
          </button>

          <div className="text-center pt-2">
            <a href="#" className="text-gray-500 hover:text-primary transition-colors text-sm">Forgot password?</a>
          </div>

          {/* Biometric Login Button */}
          {biometricsAvailable && biometricsEnabled && (
            <button
              onClick={handleBiometricLogin}
              className="w-full mt-4 bg-surface-light border border-gray-700 text-foreground py-4 rounded-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all font-medium"
            >
              <span className="material-symbols-rounded text-2xl text-primary">
                {biometricService.getBiometryType() === BiometryType.faceId || biometricService.getBiometryType() === BiometryType.faceAuthentication ? 'face' : 'fingerprint'}
              </span>
              Login with {biometricService.getBiometryType() === BiometryType.faceId ? 'Face ID' : 'Touch ID'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
