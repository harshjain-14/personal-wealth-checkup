
// Auth service to handle login/logout functionality
import { toast } from "sonner";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
}

// Simulated authentication service
const AuthService = {
  currentUser: null as User | null,
  
  login: async (email: string, password: string): Promise<User> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, this would validate credentials against a backend
    if (!email || !password) {
      throw new Error("Email and password are required");
    }
    
    // Simple validation
    if (!email.includes("@") || password.length < 6) {
      toast.error("Invalid credentials. Please try again.");
      throw new Error("Invalid credentials");
    }
    
    // Mock successful login
    const user: User = {
      id: "usr_" + Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email: email
    };
    
    // Save to local storage to persist session
    localStorage.setItem("portfolio_analyzer_user", JSON.stringify(user));
    AuthService.currentUser = user;
    
    toast.success("Logged in successfully!");
    return user;
  },
  
  logout: () => {
    localStorage.removeItem("portfolio_analyzer_user");
    AuthService.currentUser = null;
    toast.info("Logged out successfully");
  },
  
  getCurrentUser: (): User | null => {
    if (AuthService.currentUser) {
      return AuthService.currentUser;
    }
    
    const storedUser = localStorage.getItem("portfolio_analyzer_user");
    if (storedUser) {
      try {
        AuthService.currentUser = JSON.parse(storedUser);
        return AuthService.currentUser;
      } catch (error) {
        localStorage.removeItem("portfolio_analyzer_user");
      }
    }
    
    return null;
  },
  
  isAuthenticated: (): boolean => {
    return AuthService.getCurrentUser() !== null;
  }
};

export default AuthService;
