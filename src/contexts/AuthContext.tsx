"use client";

import { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isVendor: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      if (!data.user) {
        return {
          success: false,
          message: "Login failed",
        };
      }

      setUser(data.user);
      return {
        success: true,
        user: data.user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Login failed",
      };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "customer",
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: "customer",
      });

      if (profileError) throw profileError;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Get user role from metadata
  const userRole = user?.user_metadata?.role || "customer";

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: userRole === "admin",
    isVendor: userRole === "vendor",
    isCustomer: userRole === "customer",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}