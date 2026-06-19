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
  login: (email: string, pass: string) => Promise<void>;
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
    const { data, error } = await supabase.from('users').select('*').eq('uid', userId).single();
    if (!error && data) {
      setUserData(data as UserProfile);
    } else {
      setUserData(null);
    }
    setLoading(false);
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const register = async (email: string, pass: string, name: string, mobile: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password: pass,
      options: {
        data: {
          full_name: name,
        }
      }
    });
    if (error) throw error;

    if (data.user) {
      const newUser: UserProfile = {
        uid: data.user.id,
        fullName: name,
        email,
        mobile,
        role: "customer",
        createdAt: new Date().toISOString(),
      };
      await supabase.from('users').insert([newUser]);
    }
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
