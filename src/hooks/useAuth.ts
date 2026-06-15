import { useAuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  const auth = useAuthContext();
  const role = auth.profile?.role;

  return {
    ...auth,
    isAuthenticated: !!auth.user,
    isAdmin: role === "admin",
    isVendor: role === "seller",
    isSeller: role === "seller",
    isCustomer: role === "customer",
  };
}
