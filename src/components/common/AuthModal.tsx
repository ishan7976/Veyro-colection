import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authMode, closeAuthModal, login, loginWithGoogle, register, openAuthModal } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        const res = await login(email, password);
        if (!res.success && res.error) {
          setErrorMessage(res.error);
        }
      } else {
        const res = await register(email, password, name);
        if (!res.success && res.error) {
          setErrorMessage(res.error);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeAuthModal}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 text-center">
          <span className="font-mono text-[10px] font-black tracking-widest text-neutral-400 uppercase">
            VEYRO IDENTITY CLUB
          </span>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight mt-1">
            {authMode === 'login' ? 'Welcome Back' : 'Create VEYRO Identity'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {authMode === 'login'
              ? 'Access early drop notifications, order history & loyalty rewards.'
              : 'Join the underground movement. Get 100 bonus identity points.'}
          </p>
        </div>

        {/* Google OAuth Login Button */}
        <div className="mb-5 space-y-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={loginWithGoogle}
            className="w-full py-3.5 px-4 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-3 shadow-sm hover:bg-neutral-900 hover:text-white hover:border-neutral-900 dark:hover:bg-white dark:hover:text-black transition-all duration-200 cursor-pointer group active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
            <span className="bg-white dark:bg-neutral-900 px-3 font-mono text-[9px] font-bold text-neutral-400 uppercase tracking-widest absolute">
              OR CONTINUE WITH EMAIL
            </span>
          </div>
        </div>

        {/* Error Alert Display */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  required
                  disabled={isSubmitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kaelen Vance"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition disabled:opacity-60"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="identity@veyro.com"
                className="w-full pl-10 pr-4 py-3 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white transition disabled:opacity-60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-black dark:hover:bg-neutral-100 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{authMode === 'login' ? 'Authenticating...' : 'Creating Account...'}</span>
              </div>
            ) : (
              <>
                <span>{authMode === 'login' ? 'Sign In' : 'Join VEYRO'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-800 text-center">
          <p className="text-xs text-neutral-500">
            {authMode === 'login' ? "Don't have a VEYRO identity yet?" : 'Already registered?'}
            <button
              onClick={() => {
                setErrorMessage(null);
                openAuthModal(authMode === 'login' ? 'register' : 'login');
              }}
              disabled={isSubmitting}
              className="ml-1.5 font-bold text-neutral-900 dark:text-white hover:underline disabled:opacity-50"
            >
              {authMode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
