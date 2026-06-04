import { useEffect, useState } from "react";
import { mockAuth, type MockUser } from "@/lib/mockAuth";

export function useAuth() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkAuth();
  }, []);

  const checkAuth = () => {
    const currentUser = mockAuth.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const response = mockAuth.login(email, password);
    
    if (response.success && response.user) {
      setUser(response.user);
      return response;
    }
    
    throw new Error(response.message || "Login failed");
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const response = mockAuth.register(email, password, fullName);
    
    if (response.success && response.user) {
      setUser(response.user);
      return response;
    }
    
    throw new Error(response.message || "Registration failed");
  };

  const signOut = async () => {
    mockAuth.logout();
    setUser(null);
  };

  return {
    user,
    profile: user, // For compatibility with existing code
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: mockAuth.isAuthenticated(),
    isAdmin: user?.role === "admin",
    isVendor: user?.role === "vendor",
    isCustomer: user?.role === "customer",
  };
}