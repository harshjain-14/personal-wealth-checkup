// This file is now deprecated as we're using Supabase auth
// Keeping the file for now to prevent breaking changes while transitioning
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
}

// Auth service that uses Supabase
const AuthService = {
  currentUser: null as User | null,
  
  login: async (email: string, password: string): Promise<User> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast.error(error.message || "Invalid credentials. Please try again.");
        throw new Error(error.message);
      }
      
      if (!data.user) {
        toast.error("User not found.");
        throw new Error("User not found");
      }
      
      // Create a User object from Supabase user
      const user: User = {
        id: data.user.id,
        name: data.user.email?.split('@')[0] || 'User',
        email: data.user.email || ''
      };
      
      // Save to local storage to maintain compatibility
      localStorage.setItem("portfolio_analyzer_user", JSON.stringify(user));
      AuthService.currentUser = user;
      
      toast.success("Logged in successfully!");
      return user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("portfolio_analyzer_user");
      AuthService.currentUser = null;
      toast.info("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
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
  
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    } catch (error) {
      return false;
    }
  }
};

export default AuthService;
