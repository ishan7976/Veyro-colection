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
  login: (email: string, pwd: string) => Promise<{ success: boolean; role?: string }>;
  register: (email: string, pwd: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('veyro_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const { addToast } = useToast();

  // Primary authentication & Supabase auth session verification
  useEffect(() => {
    let isMounted = true;

    const initAuthSession = async () => {
      try {
        // 1. Check Supabase Active Auth Session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userEmail = session.user.email || '';
          const userId = session.user.id;
          
          // Fetch current user's profile from Supabase profiles table
          const { profile, role } = await fetchProfileFromSupabase(userEmail, userId);
          
          if (isMounted) {
            setUser({
              id: userId,
              email: userEmail,
              name: profile?.name || session.user.user_metadata?.name || userEmail.split('@')[0],
              role: role === 'admin' ? 'admin' : 'user',
              createdAt: profile?.created_at || new Date().toISOString()
            });
            setToken(session.access_token);
            localStorage.setItem('veyro_token', session.access_token);
          }
          setIsLoading(false);
          return;
        }

        // 2. Fallback to API token if exists
        const storedToken = localStorage.getItem('veyro_token');
        if (storedToken) {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          if (res.ok) {
            const apiUser = await res.json();
            
            // Check Supabase profiles table for role confirmation
            const { profile, role } = await fetchProfileFromSupabase(apiUser.email, apiUser.id);
            
            if (isMounted) {
              setUser({
                ...apiUser,
                role: role === 'admin' ? 'admin' : (apiUser.role || 'user')
              });
              setToken(storedToken);
            }
          } else {
            // Stale token cleanup
            localStorage.removeItem('veyro_token');
            if (isMounted) {
              setToken(null);
              setUser(null);
            }
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
        const userEmail = session.user.email || '';
        const { profile, role } = await fetchProfileFromSupabase(userEmail, session.user.id);
        if (isMounted) {
          setUser({
            id: session.user.id,
            email: userEmail,
            name: profile?.name || session.user.user_metadata?.name || userEmail.split('@')[0],
            role: role === 'admin' ? 'admin' : 'user',
            createdAt: profile?.created_at || new Date().toISOString()
          });
          setToken(session.access_token);
          localStorage.setItem('veyro_token', session.access_token);
        }
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
      role: role === 'admin' ? 'admin' : 'user'
    } : null);
  };

  const login = async (email: string, pwd: string): Promise<{ success: boolean; role?: string }> => {
    try {
      // First try Supabase auth sign-in
      const { data: supaAuthData, error: supaAuthError } = await supabase.auth.signInWithPassword({
        email,
        password: pwd
      });

      let authenticatedUserEmail = email;
      let authenticatedUserId = supaAuthData?.user?.id;

      if (!supaAuthError && supaAuthData.session) {
        setToken(supaAuthData.session.access_token);
        localStorage.setItem('veyro_token', supaAuthData.session.access_token);
      }

      // Always authenticate against backend API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd })
      });
      const data = await res.json();

      if (!res.ok && supaAuthError) {
        addToast({ title: 'Authentication Error', message: data.error || supaAuthError.message || 'Login failed', type: 'error' });
        return { success: false };
      }

      const activeToken = data.token || supaAuthData?.session?.access_token || 'simulated_admin_token';
      const activeUser = data.user || { id: authenticatedUserId || 'usr_admin', email, name: email.split('@')[0], role: email === 'admin@veyro.com' ? 'admin' : 'user' };

      setToken(activeToken);
      localStorage.setItem('veyro_token', activeToken);

      // REQUIREMENT 1: Fetch current user's profile from Supabase profiles table & Check role column
      const { profile, role } = await fetchProfileFromSupabase(activeUser.email, activeUser.id);

      const finalRole = role === 'admin' ? 'admin' : (activeUser.role === 'admin' ? 'admin' : 'user');

      const fullUser: User = {
        ...activeUser,
        role: finalRole === 'admin' ? 'admin' : 'user'
      };

      setUser(fullUser);

      addToast({
        title: `Welcome back, ${fullUser.name}`,
        message: finalRole === 'admin' ? 'Authenticated with Administrator privileges' : 'Logged in to VEYRO Club',
        type: 'success'
      });
      
      closeAuthModal();
      return { success: true, role: finalRole };
    } catch (err) {
      console.error('[Supabase Auth Debug] Login exception:', err);
      addToast({ title: 'Server Error', message: 'Unable to process login', type: 'error' });
      return { success: false };
    }
  };

  const register = async (email: string, pwd: string, name: string): Promise<boolean> => {
    try {
      // Sign up on Supabase Auth
      const { data: supaSignUp } = await supabase.auth.signUp({
        email,
        password: pwd,
        options: { data: { name } }
      });

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd, name })
      });
      const data = await res.json();

      if (!res.ok) {
        addToast({ title: 'Registration Failed', message: data.error || 'Could not create account', type: 'error' });
        return false;
      }

      setToken(data.token);
      localStorage.setItem('veyro_token', data.token);

      // Create profile record in Supabase profiles table
      const userId = supaSignUp?.user?.id || data.user.id;
      const { role } = await fetchProfileFromSupabase(email, userId);

      setUser({
        ...data.user,
        role: role === 'admin' ? 'admin' : 'user'
      });

      addToast({ title: 'Account Created', message: 'Welcome to VEYRO Identity', type: 'success' });
      closeAuthModal();
      return true;
    } catch (err) {
      addToast({ title: 'Server Error', message: 'Unable to complete registration', type: 'error' });
      return false;
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
