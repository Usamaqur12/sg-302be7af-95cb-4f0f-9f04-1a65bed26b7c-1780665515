import { useEffect, useState } from "react";
import { mockAuth, type MockUser } from "@/lib/mockAuth";

export function useAuth() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Only check auth after component mounts (client-side only)
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const currentUser = mockAuth.getCurrentUser();
      const authenticated = mockAuth.isAuthenticated();
      
      setUser(currentUser);
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = mockAuth.login(email, password);
    
    if (response.success && response.user) {
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    }
    
    throw new Error(response.message || "Login failed");
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const response = mockAuth.register(email, password, fullName);
    
    if (response.success && response.user) {
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    }
    
    throw new Error(response.message || "Registration failed");
  };

  const signOut = async () => {
    mockAuth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    profile: user, // For compatibility with existing code
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
    isAdmin: user?.role === "admin",
    isVendor: user?.role === "vendor",
    isCustomer: user?.role === "customer",
  };
}