import React, { createContext, useContext, useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';

interface User {
  id: string;
  email: string;
  verified: boolean;
  created: string;
  updated: string;
}

interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    if (pb.authStore.isValid && pb.authStore.model) {
      setUser(pb.authStore.model as any);
      setSession({ token: pb.authStore.token, user: pb.authStore.model });
    }
    setLoading(false);

    // Listen for auth changes
    pb.authStore.onChange((token, model) => {
      setUser(model as any);
      setSession(token ? { token, user: model } : null);
    });
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      // Create user account
      const user = await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        emailVisibility: true,
      });

      // Auto-login after signup
      await pb.collection('users').authWithPassword(email, password);

      // Create profile
      await pb.collection('profiles').create({
        user: user.id,
        display_name: displayName || email.split('@')[0],
        native_language: 'en',
        target_language: 'es',
        daily_lingq_goal: 20,
        daily_reading_goal: 15,
      });

      return { error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: new Error(error.message || 'Failed to sign up') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password);
      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: new Error(error.message || 'Failed to sign in') };
    }
  };

  const signOut = async () => {
    pb.authStore.clear();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
