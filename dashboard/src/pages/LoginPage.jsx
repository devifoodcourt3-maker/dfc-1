import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import dfcLogo from '../assets/dfc-logo.png';
import { unlockAudio } from '../utils/audioContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Unlock the AudioContext on this user gesture so the order buzzer
    // works automatically without any extra clicks after login.
    unlockAudio();
    const result = await login(email, password);
    if (result.success) {
      navigate('/orders', { replace: true });
    } else {
      setError(result.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Soft ambient color blobs */}
      <div className="absolute w-96 h-96 rounded-full -top-32 -left-32 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(226,19,28,0.1) 0%, transparent 70%)' }} />
      <div className="absolute w-80 h-80 rounded-full -bottom-24 -right-24 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(91,158,15,0.1) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={dfcLogo} alt="DFC" className="w-20 h-20 object-contain mx-auto mb-4" />
          <h1 className="font-display text-3xl tracking-wide text-ink-900">DFC Restaurant</h1>
          <p className="text-ink-500 mt-1 text-sm">Staff dashboard login</p>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label">Email Address</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dfcrestaurant.com" className="input" required autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="input pr-12" required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="btn-primary w-full text-base py-3 justify-center flex">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-400 mt-6">
          DFC Restaurant Management System · Secure Staff Access
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
