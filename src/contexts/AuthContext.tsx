"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface Profile {
  id: string;
  email: string | null;
  role: "customer" | "seller" | "admin" | "manager" | "warehouse";
  full_name: string | null;
}

interface AuthUser {
  id: string;
  email: string;
  role: Profile["role"];
  created_at?: string | null;
}

interface AuthResult {
  error: Error | null;
  profile: Profile | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function readJsonResponse<T>(response: Response): Promise<T & { error?: string }> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T & { error?: string }> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? window.setTimeout(() => controller.abort(), 8000) : null;

  try {
    return await readJsonResponse<T>(
      await fetch(url, {
        ...options,
        signal: controller?.signal,
      })
    );
  } catch (fetchError) {
    if (typeof XMLHttpRequest === "undefined") {
      throw fetchError;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(options.method || "GET", url);
      xhr.withCredentials = options.credentials === "include";

      const headers = options.headers instanceof Headers
        ? Array.from(options.headers.entries())
        : Array.isArray(options.headers)
          ? options.headers
          : Object.entries(options.headers || {});

      headers.forEach(([key, value]) => xhr.setRequestHeader(key, String(value)));

      xhr.onload = () => {
        const payload = JSON.parse(xhr.responseText || "{}");
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(payload.error || "Request failed"));
          return;
        }
        resolve(payload);
      };
      xhr.onerror = () => reject(fetchError);
      xhr.ontimeout = () => reject(new Error("Request timed out"));
      xhr.timeout = 8000;
      xhr.send(typeof options.body === "string" ? options.body : null);
    });
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    requestJson<{ user: AuthUser | null; profile: Profile | null }>("/api/auth/session", { credentials: "include" })
      .then((payload) => {
        if (!active) return;
        setUser(payload.user);
        setProfile(payload.profile);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setProfile(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const payload = await requestJson<{ user: AuthUser; profile: Profile }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      setUser(payload.user);
      setProfile(payload.profile);
      return { error: null, profile: payload.profile };
    } catch (error) {
      setUser(null);
      setProfile(null);
      return {
        error: error instanceof Error ? error : new Error("Login failed"),
        profile: null,
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      await requestJson<{ success: boolean }>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name: fullName || "Customer" }),
      });
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error("Registration failed") };
    }
  };

  const signOut = async () => {
    await requestJson("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async () => {
    return {
      error: new Error("Password reset requires email setup on cPanel"),
    };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
