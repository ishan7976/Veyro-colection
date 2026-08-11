import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { useToast } from './ToastContext';
import { supabase, fetchProfileFromSupabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, pwd: string) => Promise<{ success: boolean; role?: string; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: any }>;
  register: (email: string, pwd: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const formatSupabaseAuthError = (error: any): string => {
  if (!error) return 'Authentication failed.';
  const msg = (error.message || error.msg || error.error_description || '').toLowerCase();
  const code = (error.code || error.status || '').toString().toLowerCase();

  // Rate limiting errors
  if (
    code.includes('over_email_send_rate_limit') ||
    code.includes('rate_limit') ||
    code.includes('429') ||
    msg.includes('email rate limit exceeded') ||
    msg.includes('rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('too many requests') ||
    msg.includes('exceeded')
  ) {
    return 'Too many signup attempts. Please try again later.';
  }

  // Duplicate user / account exists errors
  if (
    code.includes('user_already_exists') ||
    code.includes('email_exists') ||
    msg.includes('user already registered') ||
    msg.includes('already registered') ||
    msg.includes('already in use') ||
    msg.includes('already exists') ||
    msg.includes('user already exists')
  ) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  // Email verification required
  if (
    code.includes('email_not_confirmed') ||
    code.includes('email_not_verified') ||
    msg.includes('email not confirmed') ||
    msg.includes('email not verified') ||
    msg.includes('confirm your email')
  ) {
    return 'Email not verified. Please check your inbox and verify your email address before signing in.';
  }

  // User not found
  if (
    code.includes('user_not_found') ||
    msg.includes('user not found') ||
    msg.includes('no user found') ||
    msg.includes('user does not exist')
  ) {
    return 'User not found. Please check your email address or create a new account.';
  }

  // Invalid credentials
  if (
    code.includes('invalid_credentials') ||
    code.includes('invalid_grant') ||
    msg.includes('invalid login credentials') ||
    msg.includes('invalid credentials') ||
    msg.includes('invalid email or password')
  ) {
    return 'Invalid credentials. Please check your email and password.';
  }

  return error.message || 'Authentication error. Please try again.';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('veyro_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const { addToast } = useToast();

  const handleSessionUser = async (sessionUser: any, accessToken: string, isMounted: boolean) => {
    const userEmail = sessionUser.email || '';
    const userId = sessionUser.id;
    const metadata = sessionUser.user_metadata || {};
    const fullName = metadata.full_name || metadata.name || userEmail.split('@')[0];
    const avatarUrl = metadata.avatar_url || metadata.picture || null;

    const { profile, role } = await fetchProfileFromSupabase(userEmail, userId, { fullName, avatarUrl });

    const resolvedName = profile?.full_name || profile?.name || fullName || userEmail.split('@')[0];
    const resolvedAvatar = profile?.avatar_url || avatarUrl || undefined;

    if (isMounted) {
      setUser({
        id: userId,
        email: userEmail,
        name: resolvedName,
        avatarUrl: resolvedAvatar,
        role: role === 'admin' ? 'admin' : 'user',
        createdAt: profile?.created_at || new Date().toISOString()
      });
      setToken(accessToken);
      localStorage.setItem('veyro_token', accessToken);

      const targetRedirect = localStorage.getItem('veyro_oauth_redirect');
      if (targetRedirect === 'account') {
        localStorage.removeItem('veyro_oauth_redirect');
        window.dispatchEvent(new CustomEvent('veyro_navigate', { detail: { page: 'account' } }));
      }
    }
  };

  // Primary authentication & Supabase auth session verification
  useEffect(() => {
    let isMounted = true;

    // Check URL for OAuth error query/hash parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = urlParams.get('error') || hashParams.get('error');
      const errorDesc = urlParams.get('error_description') || hashParams.get('error_description');

      if (error || errorDesc) {
        const isCanceled = error === 'access_denied' || (errorDesc && errorDesc.toLowerCase().includes('cancel'));
        addToast({
          title: isCanceled ? 'Sign In Canceled' : 'OAuth Error',
          message: errorDesc || error || 'Google sign-in was not completed.',
          type: isCanceled ? 'info' : 'error'
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        localStorage.removeItem('veyro_oauth_redirect');
      }
    }

    const initAuthSession = async () => {
      try {
        // Check Supabase Active Auth Session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await handleSessionUser(session.user, session.access_token, isMounted);
        } else {
          if (isMounted) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('veyro_token');
          }
        }
      } catch (err) {
        console.error('[Supabase Auth Debug] Auth initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuthSession();

    // Subscribe to Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleSessionUser(session.user, session.access_token, isMounted);
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('veyro_token');
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const refreshProfile = async () => {
    if (!user?.email) return;
    const { profile, role } = await fetchProfileFromSupabase(user.email, user.id);
    setUser(prev => prev ? {
      ...prev,
      name: profile?.full_name || profile?.name || prev.name,
      avatarUrl: profile?.avatar_url || prev.avatarUrl,
      role: role === 'admin' ? 'admin' : 'user'
    } : null);
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: any }> => {
    try {
      setIsLoading(true);
      localStorage.setItem('veyro_oauth_redirect', 'account');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('[Google OAuth Error]', error);
        addToast({
          title: 'Google Login Failed',
          message: error.message || 'Unable to connect to Google OAuth',
          type: 'error'
        });
        localStorage.removeItem('veyro_oauth_redirect');
        setIsLoading(false);
        return { success: false, error };
      }

      return { success: true };
    } catch (err: any) {
      console.error('[Google OAuth Exception]', err);
      addToast({
        title: 'Connection Error',
        message: err.message || 'Unexpected error during Google login',
        type: 'error'
      });
      localStorage.removeItem('veyro_oauth_redirect');
      setIsLoading(false);
      return { success: false, error: err };
    }
  };

  const login = async (email: string, pwd: string): Promise<{ success: boolean; role?: string; error?: string }> => {
    try {
      // Login exclusively via Supabase Auth
      const { data: supaAuthData, error: supaAuthError } = await supabase.auth.signInWithPassword({
        email,
        password: pwd
      });

      if (supaAuthError) {
        const userMessage = formatSupabaseAuthError(supaAuthError);
        addToast({ title: 'Sign In Failed', message: userMessage, type: 'error' });
        return { success: false, error: userMessage };
      }

      if (!supaAuthData?.session || !supaAuthData?.user) {
        const failMsg = 'Unable to establish authenticated session.';
        addToast({ title: 'Sign In Failed', message: failMsg, type: 'error' });
        return { success: false, error: failMsg };
      }

      const sessionUser = supaAuthData.user;
      const accessToken = supaAuthData.session.access_token;
      const userEmail = sessionUser.email || email;
      const userId = sessionUser.id;
      const metadata = sessionUser.user_metadata || {};
      const fullName = metadata.full_name || metadata.name || userEmail.split('@')[0];
      const avatarUrl = metadata.avatar_url || metadata.picture || null;

      setToken(accessToken);
      localStorage.setItem('veyro_token', accessToken);

      const { profile, role } = await fetchProfileFromSupabase(userEmail, userId, { fullName, avatarUrl });

      const resolvedName = profile?.full_name || profile?.name || fullName || userEmail.split('@')[0];
      const resolvedAvatar = profile?.avatar_url || avatarUrl || undefined;
      const finalRole = role === 'admin' ? 'admin' : 'user';

      const fullUser: User = {
        id: userId,
        email: userEmail,
        name: resolvedName,
        avatarUrl: resolvedAvatar,
        role: finalRole,
        createdAt: profile?.created_at || new Date().toISOString()
      };

      setUser(fullUser);

      addToast({
        title: `Welcome back, ${fullUser.name}`,
        message: finalRole === 'admin' ? 'Authenticated with Administrator privileges' : 'Logged in to VEYRO Club',
        type: 'success'
      });

      closeAuthModal();
      return { success: true, role: finalRole };
    } catch (err: any) {
      console.error('[Supabase Auth Debug] Login exception:', err);
      const excMsg = err?.message || 'Unable to process login';
      addToast({ title: 'Server Error', message: excMsg, type: 'error' });
      return { success: false, error: excMsg };
    }
  };

  const register = async (email: string, pwd: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();

      // Call Supabase Auth signUp directly (no pre-signup profile queries)
      const { data: supaSignUp, error: supaError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pwd,
        options: { data: { full_name: name } }
      });

      if (supaError) {
        const userMsg = supaError.message || formatSupabaseAuthError(supaError);
        addToast({ title: 'Registration Failed', message: userMsg, type: 'error' });
        return { success: false, error: userMsg };
      }

      // Handle Supabase email enumeration protection (existing user returns empty identities array)
      if (supaSignUp?.user?.identities && supaSignUp.user.identities.length === 0) {
        const userMsg = 'An account with this email address already exists. Please sign in instead.';
        addToast({ title: 'Account Exists', message: userMsg, type: 'error' });
        return { success: false, error: userMsg };
      }

      if (supaSignUp?.user) {
        const realUserId = supaSignUp.user.id;

        // Upsert profile into public.profiles using real Supabase Auth UUID
        const { profile, role } = await fetchProfileFromSupabase(cleanEmail, realUserId, { fullName: name });

        if (supaSignUp.session) {
          setToken(supaSignUp.session.access_token);
          localStorage.setItem('veyro_token', supaSignUp.session.access_token);
          setUser({
            id: realUserId,
            email: cleanEmail,
            name: profile?.full_name || profile?.name || name,
            role: role === 'admin' ? 'admin' : 'user',
            createdAt: new Date().toISOString()
          });
          addToast({ title: 'Account Created', message: 'Welcome to VEYRO Identity', type: 'success' });
        } else {
          // Email confirmation is enabled in Supabase project (session is null)
          addToast({
            title: 'Account Created',
            message: 'Account created. Please check your email to verify your account.',
            type: 'info'
          });
        }
        closeAuthModal();
        return { success: true };
      }

      return { success: false, error: 'Registration could not be completed.' };
    } catch (err: any) {
      const excMsg = err?.message || 'Unable to complete registration';
      addToast({ title: 'Server Error', message: excMsg, type: 'error' });
      return { success: false, error: excMsg };
    }
  };

  const logout = () => {
    supabase.auth.signOut();
    setToken(null);
    setUser(null);
    localStorage.removeItem('veyro_token');
    addToast({ title: 'Signed Out', message: 'You have been logged out', type: 'info' });
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const updatedUser = await res.json();
      if (res.ok) {
        setUser(updatedUser);
        addToast({ title: 'Profile Updated', message: 'Your details have been saved', type: 'success' });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthModalOpen,
        authMode,
        openAuthModal,
        closeAuthModal,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
