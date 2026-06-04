// Mock Authentication Service
// Uses localStorage for demo purposes until backend is ready

export interface MockUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
  role: "customer" | "vendor" | "admin";
  status: "active" | "pending" | "suspended";
  phone?: string;
  created_at?: string;
}

// Hardcoded demo accounts
export const DEMO_USERS: MockUser[] = [
  {
    id: "admin-001",
    email: "admin@marketplace.com",
    password: "Admin@123",
    full_name: "Admin User",
    role: "admin",
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "seller-001",
    email: "seller@marketplace.com",
    password: "Seller@123",
    full_name: "Approved Seller",
    role: "vendor",
    status: "active",
    phone: "+1-555-0001",
    created_at: "2026-02-15T00:00:00Z",
  },
  {
    id: "pending-001",
    email: "pending@marketplace.com",
    password: "Seller@123",
    full_name: "Pending Seller",
    role: "vendor",
    status: "pending",
    phone: "+1-555-0002",
    created_at: "2026-05-20T00:00:00Z",
  },
  {
    id: "customer-001",
    email: "customer@marketplace.com",
    password: "Customer@123",
    full_name: "John Customer",
    role: "customer",
    status: "active",
    phone: "+1-555-0003",
    created_at: "2026-03-10T00:00:00Z",
  },
];

export interface AuthResponse {
  success: boolean;
  user?: MockUser;
  token?: string;
  message?: string;
}

export const mockAuth = {
  // Login with email and password
  login: (email: string, password: string): AuthResponse => {
    const user = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password",
      };
    }

    // Create mock token
    const token = `mock_token_${user.id}_${Date.now()}`;

    // Store in localStorage
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(user));

    return {
      success: true,
      user,
      token,
    };
  },

  // Register new user (for customer registration)
  register: (email: string, password: string, fullName: string): AuthResponse => {
    // Check if user already exists
    const existingUser = DEMO_USERS.find((u) => u.email === email);
    if (existingUser) {
      return {
        success: false,
        message: "Email already registered",
      };
    }

    // Create new customer user
    const newUser: MockUser = {
      id: `customer-${Date.now()}`,
      email,
      password,
      full_name: fullName,
      role: "customer",
      status: "active",
      created_at: new Date().toISOString(),
    };

    // In a real app, this would be saved to database
    // For now, just store in localStorage
    const token = `mock_token_${newUser.id}_${Date.now()}`;
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_user", JSON.stringify(newUser));

    return {
      success: true,
      user: newUser,
      token,
    };
  },

  // Get current user from localStorage
  getCurrentUser: (): MockUser | null => {
    const userJson = localStorage.getItem("auth_user");
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },

  // Get current token
  getToken: (): string | null => {
    return localStorage.getItem("auth_token");
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("auth_user");
    return !!(token && user);
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  },
};