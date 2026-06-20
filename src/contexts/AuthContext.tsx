import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { User } from "@supabase/supabase-js";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  mobile?: string;
  role: "customer" | "admin";
  profileImage?: string;
  createdAt: any;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile | null>;
  register: (email: string, pass: string, name: string, mobile: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setCurrentUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setUserData(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('uid, full_name, email, mobile, role, created_at')
        .eq('uid', userId)
        .single();
      if (error) {
        console.error('fetchUserData supabase error:', error);
        setUserData(null);
        setLoading(false);
        return;
      }
      if (!data) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const profile: UserProfile = {
        uid: data.uid,
        fullName: data.full_name || '',
        email: data.email,
        mobile: data.mobile,
        role: data.role,
        profileImage: (data as any).profile_image || undefined,
        createdAt: data.created_at,
      };
      setUserData(profile);
    } catch (err) {
      console.error('fetchUserData unexpected error:', err);
      setUserData(null);
    }
    setLoading(false);
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user.id;
    if (!userId) return null;
    
    const { data, error: userError } = await supabase.from('users').select('*').eq('uid', userId).single();
    if (!userError && data) {
      setUserData(data as UserProfile);
      return data as UserProfile;
    }
    return null;
  };

  const register = async (email: string, pass: string, name: string, mobile: string) => {
    // Use backend admin endpoint to create user (service role). This avoids RLS issues.
    const API_URL = import.meta.env.VITE_API_URL || '/api';
    const resp = await fetch(`${API_URL}/admin/create-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, fullName: name, mobile })
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || 'Failed to create user via admin API');
    }
    // Account created successfully. User will sign in next.
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return <AuthContext.Provider value={{ currentUser, userData, loading, login, register, loginWithGoogle, logout }}>{!loading && children}</AuthContext.Provider>;
}
