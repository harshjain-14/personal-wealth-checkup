
// Updated Portfolio service to use Supabase

import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

// Define types for portfolio data
export interface Stock {
  id?: number;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  sector: string;
}

export interface MutualFund {
  id?: number;
  name: string;
  investedAmount: number;
  currentValue: number;
  category: string;
  nav?: number;
  units?: number;
}

export interface ExternalInvestment {
  id?: number;
  name: string;
  type: 'Gold' | 'Fixed Deposit' | 'Real Estate' | 'Insurance' | 'EPF/PPF' | 'Bonds' | 'Crypto' | 'Others';
  amount: number;
  notes?: string;
}

export interface RegularExpense {
  id?: number;
  description: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  expense_type: 'essential' | 'discretionary' | 'investment' | 'debt' | 'healthcare' | 'education' | 'others';
  notes?: string;
}

export interface FutureExpense {
  id?: number;
  purpose: 'home' | 'education' | 'vehicle' | 'vacation' | 'wedding' | 'healthcare' | 'others';
  amount: number;
  timeframe: 'short_term' | 'medium_term' | 'long_term';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface UserInfo {
  id?: string;
  age: number;
  city: 'metro' | 'tier1' | 'tier2' | 'tier3' | 'overseas';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  financialGoals?: string[];
}

export interface ZerodhaCredentials {
  id?: number;
  user_id?: string;
  zerodha_user_id: string;
  access_token?: string;
  created_at?: string;
}

export interface ZerodhaHolding {
  tradingsymbol: string;
  exchange: string;
  isin: string;
  quantity: number;
  average_price: number;
  last_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
}

export interface PortfolioData {
  stocks: Stock[];
  mutualFunds: MutualFund[];
  externalInvestments: ExternalInvestment[];
  expenses: RegularExpense[];
  futureExpenses: FutureExpense[];
  userInfo?: UserInfo;
  lastUpdated: string;
  zerodhaHoldings?: ZerodhaHolding[];
}

const PortfolioService = {
  // Save portfolio data to Supabase
  savePortfolioData: async (portfolioData: PortfolioData): Promise<PortfolioData> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not logged in');
        throw new Error('User not logged in');
      }
      
      // Take a snapshot of the portfolio
      await PortfolioService.takePortfolioSnapshot(portfolioData);
      
      const updatedPortfolioData = {
        ...portfolioData,
        lastUpdated: new Date().toISOString()
      };
      
      return updatedPortfolioData;
    } catch (error) {
      console.error('Error saving portfolio data:', error);
      toast.error('Failed to save portfolio data');
      throw error;
    }
  },
  
  // Get the user's portfolio data
  getPortfolioData: async (): Promise<PortfolioData> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not logged in');
        throw new Error('User not logged in');
      }
      
      // Try to get the latest portfolio snapshot
      const snapshotData = await PortfolioService.getLatestPortfolioSnapshot();
      
      if (snapshotData) {
        return snapshotData;
      }

      // If no snapshot, return empty portfolio structure
      return {
        stocks: [],
        mutualFunds: [],
        externalInvestments: [],
        expenses: [],
        futureExpenses: [],
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      toast.error('Failed to load portfolio data');
      
      // Return empty portfolio structure
      return {
        stocks: [],
        mutualFunds: [],
        externalInvestments: [],
        expenses: [],
        futureExpenses: [],
        lastUpdated: new Date().toISOString()
      };
    }
  },

  // Save external investments
  saveExternalInvestments: async (investments: ExternalInvestment[]): Promise<ExternalInvestment[]> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not logged in');
        throw new Error('User not logged in');
      }
      
      // Clear existing investments
      await supabase
        .from('external_investments')
        .delete()
        .eq('user_id', user.id);
      
      // Insert new investments
      if (investments.length > 0) {
        const { error } = await supabase
          .from('external_investments')
          .insert(
            investments.map((inv, index) => ({
              id: index + 1,
              user_id: user.id,
              investment_name: inv.name,
              investment_type: inv.type,
              amount: inv.amount,
              notes: inv.notes
            }))
          );
          
        if (error) {
          console.error('Error saving external investments:', error);
          toast.error('Failed to save external investments');
          throw error;
        }
      }
      
      return investments;
    } catch (error) {
      console.error('Error saving external investments:', error);
      toast.error('Failed to save external investments');
      throw error;
    }
  },
  
  // Fetch external investments
  getExternalInvestments: async (): Promise<ExternalInvestment[]> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('external_investments')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching external investments:', error);
        return [];
      }
      
      return data.map(inv => ({
        id: inv.id,
        name: inv.investment_name,
        type: inv.investment_type,
        amount: inv.amount,
        notes: inv.notes
      }));
    } catch (error) {
      console.error('Error fetching external investments:', error);
      return [];
    }
  },
  
  // Save regular expenses
  saveRegularExpenses: async (expenses: RegularExpense[]): Promise<RegularExpense[]> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not logged in');
        throw new Error('User not logged in');
      }
      
      // Clear existing expenses
      await supabase
        .from('regular_expenses')
        .delete()
        .eq('user_id', user.id);
      
      // Insert new expenses
      if (expenses.length > 0) {
        const { error } = await supabase
          .from('regular_expenses')
          .insert(
            expenses.map(exp => ({
              user_id: user.id,
              description: exp.description,
              amount: exp.amount,
              frequency: exp.frequency,
              expense_type: exp.expense_type,
              notes: exp.notes
            }))
          );
          
        if (error) {
          console.error('Error saving regular expenses:', error);
          toast.error('Failed to save regular expenses');
          throw error;
        }
      }
      
      return expenses;
    } catch (error) {
      console.error('Error saving regular expenses:', error);
      toast.error('Failed to save regular expenses');
      throw error;
    }
  },
  
  // Fetch regular expenses
  getRegularExpenses: async (): Promise<RegularExpense[]> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('regular_expenses')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching regular expenses:', error);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching regular expenses:', error);
      return [];
    }
  },
  
  // Save future expenses
  saveFutureExpenses: async (expenses: FutureExpense[]): Promise<FutureExpense[]> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not logged in');
        throw new Error('User not logged in');
      }
      
      // Clear existing future expenses
      await supabase
        .from('future_expenses')
        .delete()
        .eq('user_id', user.id);
      
      // Insert new future expenses
      if (expenses.length > 0) {
        const { error } = await supabase
          .from('future_expenses')
          .insert(
            expenses.map(exp => ({
              user_id: user.id,
              purpose: exp.purpose,
              amount: exp.amount,
              timeframe: exp.timeframe,
              priority: exp.priority,
              notes: exp.notes
            }))
          );
          
        if (error) {
          console.error('Error saving future expenses:', error);
          toast.error('Failed to save future expenses');
          throw error;
        }
      }
      
      return expenses;
    } catch (error) {
      console.error('Error saving future expenses:', error);
      toast.error('Failed to save future expenses');
      throw error;
    }
  },
  
  // Fetch future expenses
  getFutureExpenses: async (): Promise<FutureExpense[]> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('future_expenses')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching future expenses:', error);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching future expenses:', error);
      return [];
    }
  },
  
  // Save user info
  saveUserInfo: async (userInfo: UserInfo): Promise<UserInfo> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not logged in');
        throw new Error('User not logged in');
      }
      
      // Check if user info exists
      const { data: existingData } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingData) {
        // Update existing user info
        const { error } = await supabase
          .from('personal_info')
          .update({
            age: userInfo.age,
            city: userInfo.city,
            risk_tolerance: userInfo.riskTolerance,
            financial_goals: userInfo.financialGoals || []
          })
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Error updating user info:', error);
          toast.error('Failed to update user information');
          throw error;
        }
      } else {
        // Insert new user info
        const { error } = await supabase
          .from('personal_info')
          .insert({
            id: crypto.randomUUID(),
            user_id: user.id,
            age: userInfo.age,
            city: userInfo.city,
            risk_tolerance: userInfo.riskTolerance,
            financial_goals: userInfo.financialGoals || []
          });
          
        if (error) {
          console.error('Error saving user info:', error);
          toast.error('Failed to save user information');
          throw error;
        }
      }
      
      return userInfo;
    } catch (error) {
      console.error('Error saving user info:', error);
      toast.error('Failed to save user information');
      throw error;
    }
  },
  
  // Fetch user info
  getUserInfo: async (): Promise<UserInfo | null> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user info:', error);
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      return {
        id: data.id,
        age: data.age,
        city: data.city,
        riskTolerance: data.risk_tolerance,
        financialGoals: data.financial_goals || []
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  },
  
  // Take a snapshot of the portfolio
  takePortfolioSnapshot: async (portfolioData: PortfolioData): Promise<void> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return;
      }
      
      // Save the snapshot
      await supabase
        .from('portfolio_snapshots')
        .insert({
          user_id: user.id,
          snapshot_data: portfolioData,
          snapshot_date: new Date().toISOString()
        });
        
    } catch (error) {
      console.error('Error taking portfolio snapshot:', error);
    }
  },
  
  // Get the latest portfolio snapshot
  getLatestPortfolioSnapshot: async (): Promise<PortfolioData | null> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        return null;
      }
      
      // Use a raw query approach to avoid TypeScript errors
      const { data, error } = await supabase
        .rpc('get_latest_portfolio_snapshot');
      
      if (error || !data) {
        console.error("Error fetching latest portfolio snapshot:", error);
        return null;
      }
      
      // Return the snapshot data
      return data as PortfolioData;
    } catch (error) {
      console.error("Error in getLatestPortfolioSnapshot:", error);
      return null;
    }
  },
  
  // Check for Zerodha credentials
  getZerodhaCredentials: async (): Promise<{ hasCredentials: boolean, hasToken: boolean, error: any }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { hasCredentials: false, hasToken: false, error: new Error('No active session') };
      }

      const { data, error } = await supabase
        .from('zerodha_credentials')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching Zerodha credentials:', error);
        return { hasCredentials: false, hasToken: false, error };
      }

      return { 
        hasCredentials: !!data, 
        hasToken: !!(data && data.access_token),
        error: null
      };
    } catch (error) {
      console.error('Error in getZerodhaCredentials:', error);
      return { hasCredentials: false, hasToken: false, error };
    }
  }
};

export default PortfolioService;
