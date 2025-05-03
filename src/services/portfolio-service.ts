
// Updated Portfolio service to use Supabase

import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

// Define types for portfolio data aligned with database schema
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

// Updated to match the database enum types
export type InvestmentType = 'Gold' | 'Fixed Deposit' | 'Real Estate' | 'Bank Deposit' | 'PPF' | 'EPF' | 'National Pension Scheme' | 'Bonds' | 'Others';

export interface ExternalInvestment {
  id?: number;
  name: string;
  type: InvestmentType;
  amount: number;
  notes?: string;
}

export type ExpenseFrequency = 'monthly' | 'quarterly' | 'yearly' | 'one-time';
export type ExpenseType = 'EMI' | 'Rent' | 'School Fees' | 'Loan Payment' | 'Insurance Premium' | 'Utility Bills' | 'Medical' | 'Others';

export interface Expense {
  id?: number;
  name: string;
  type: string;
  amount: number;
  frequency: ExpenseFrequency;
  notes?: string;
}

export type FuturePurpose = 'home' | 'education' | 'vehicle' | 'vacation' | 'wedding' | 'healthcare' | 'others';
export type TimeFrame = 'short_term' | 'medium_term' | 'long_term';
export type PriorityLevel = 'low' | 'medium' | 'high';

export interface FutureExpense {
  id?: number;
  purpose: FuturePurpose;
  amount: number;
  timeframe: TimeFrame;
  priority: PriorityLevel;
  notes?: string;
}

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type CityType = 'metro' | 'tier1' | 'tier2' | 'tier3' | 'overseas';

export interface UserInfo {
  id?: string;
  age: number;
  city: CityType;
  riskTolerance: RiskTolerance;
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
  expenses: Expense[];
  futureExpenses: FutureExpense[];
  userInfo?: UserInfo;
  lastUpdated: string;
  zerodhaHoldings?: ZerodhaHolding[];
}

// Helper function for mapping enum values
const mapCityToDbEnum = (city: string): CityType => {
  const cityMap: Record<string, CityType> = {
    'Mumbai': 'metro',
    'Delhi': 'metro',
    'Bangalore': 'metro',
    'Hyderabad': 'tier1',
    'Chennai': 'tier1',
    'Kolkata': 'tier1',
    'Pune': 'tier1',
    'Ahmedabad': 'tier2',
    'Jaipur': 'tier2',
    'Lucknow': 'tier3',
    'Other': 'overseas'
  };
  return cityMap[city] || 'overseas';
};

const mapRiskToleranceToDbEnum = (risk: string): RiskTolerance => {
  const riskMap: Record<string, RiskTolerance> = {
    'low': 'conservative',
    'medium': 'moderate',
    'high': 'aggressive'
  };
  return riskMap[risk] || 'moderate';
};

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
        // Map to valid investment types if needed
        for (const investment of investments) {
          await supabase
            .from('external_investments')
            .insert({
              user_id: user.id,
              investment_name: investment.name,
              investment_type: investment.type,
              amount: investment.amount,
              notes: investment.notes
            });
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
        type: inv.investment_type as InvestmentType,
        amount: inv.amount,
        notes: inv.notes
      }));
    } catch (error) {
      console.error('Error fetching external investments:', error);
      return [];
    }
  },
  
  // Save regular expenses
  saveExpenses: async (expenses: Expense[]): Promise<Expense[]> => {
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
        for (const expense of expenses) {
          await supabase
            .from('regular_expenses')
            .insert({
              user_id: user.id,
              description: expense.name,
              amount: expense.amount,
              frequency: expense.frequency,
              expense_type: expense.type,
              notes: expense.notes
            });
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
  getExpenses: async (): Promise<Expense[]> => {
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
      
      return data.map(exp => ({
        id: exp.id,
        name: exp.description,
        type: exp.expense_type,
        amount: exp.amount,
        frequency: exp.frequency as ExpenseFrequency,
        notes: exp.notes
      }));
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
        for (const expense of expenses) {
          await supabase
            .from('future_expenses')
            .insert({
              user_id: user.id,
              purpose: expense.purpose,
              amount: expense.amount,
              timeframe: expense.timeframe,
              priority: expense.priority,
              notes: expense.notes
            });
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
      
      return data.map(exp => ({
        id: exp.id,
        purpose: exp.purpose as FuturePurpose,
        amount: exp.amount,
        timeframe: exp.timeframe as TimeFrame,
        priority: exp.priority as PriorityLevel,
        notes: exp.notes
      }));
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
      
      // Map UI values to database enums
      const city = typeof userInfo.city === 'string' ? 
        mapCityToDbEnum(userInfo.city as string) : userInfo.city;
        
      const riskTolerance = typeof userInfo.riskTolerance === 'string' ?
        mapRiskToleranceToDbEnum(userInfo.riskTolerance as string) : userInfo.riskTolerance;
      
      // Check if user info exists
      const { data: existingData } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingData) {
        // Update existing user info
        await supabase
          .from('personal_info')
          .update({
            age: userInfo.age,
            city: city,
            risk_tolerance: riskTolerance,
            financial_goals: userInfo.financialGoals || []
          })
          .eq('user_id', user.id);
      } else {
        // Insert new user info
        await supabase
          .from('personal_info')
          .insert({
            user_id: user.id,
            age: userInfo.age,
            city: city,
            risk_tolerance: riskTolerance,
            financial_goals: userInfo.financialGoals || []
          });
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
        city: data.city as CityType,
        riskTolerance: data.risk_tolerance as RiskTolerance,
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
          snapshot_data: JSON.stringify(portfolioData),
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
      
      // Since the stored function is not available, let's fetch it directly
      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        console.error("Error fetching latest portfolio snapshot:", error);
        return null;
      }
      
      // Return the snapshot data
      try {
        const portfolioData = JSON.parse(data.snapshot_data);
        return portfolioData as PortfolioData;
      } catch (parseError) {
        console.error("Error parsing portfolio data:", parseError);
        return null;
      }
    } catch (error) {
      console.error("Error in getLatestPortfolioSnapshot:", error);
      return null;
    }
  },
  
  // Zerodha portfolio integration methods
  getZerodhaLoginUrl: async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('zerodha-login-url');
      
      if (error) {
        console.error('Error getting Zerodha login URL:', error);
        return null;
      }
      
      return data?.url || null;
    } catch (error) {
      console.error('Error in getZerodhaLoginUrl:', error);
      return null;
    }
  },
  
  exchangeZerodhaToken: async (requestToken: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('zerodha-exchange-token', {
        body: { requestToken }
      });
      
      if (error || !data?.success) {
        console.error('Error exchanging Zerodha token:', error || data?.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in exchangeZerodhaToken:', error);
      return false;
    }
  },
  
  logoutFromZerodha: async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('zerodha-logout');
      
      if (error || !data?.success) {
        console.error('Error logging out from Zerodha:', error || data?.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in logoutFromZerodha:', error);
      return false;
    }
  },
  
  getZerodhaPortfolio: async (): Promise<{ stocks: Stock[], mutualFunds: MutualFund[] }> => {
    try {
      const { data, error } = await supabase.functions.invoke('zerodha-portfolio');
      
      if (error) {
        console.error('Error fetching Zerodha portfolio:', error);
        throw new Error('Failed to fetch Zerodha portfolio: ' + error.message);
      }
      
      if (!data) {
        throw new Error('No data returned from Zerodha portfolio endpoint');
      }
      
      // Process the holdings data into stocks and mutual funds
      const stocks: Stock[] = [];
      const mutualFunds: MutualFund[] = [];
      
      // Process holdings
      if (data.holdings && Array.isArray(data.holdings)) {
        data.holdings.forEach((holding: ZerodhaHolding) => {
          // Based on some logic (e.g., exchange) determine if it's a stock or mutual fund
          if (holding.exchange === 'NSE' || holding.exchange === 'BSE') {
            stocks.push({
              symbol: holding.tradingsymbol,
              name: holding.tradingsymbol, // Zerodha doesn't provide full names
              quantity: holding.quantity,
              averagePrice: holding.average_price,
              currentPrice: holding.last_price,
              sector: 'Unknown' // Zerodha doesn't provide sector information
            });
          } else if (holding.tradingsymbol.includes('MF')) {
            // This is a simplistic check - real implementation would be more sophisticated
            mutualFunds.push({
              name: holding.tradingsymbol,
              investedAmount: holding.quantity * holding.average_price,
              currentValue: holding.quantity * holding.last_price,
              category: 'Unknown' // Zerodha doesn't provide category information
            });
          }
        });
      }
      
      return { stocks, mutualFunds };
    } catch (error) {
      console.error('Error in getZerodhaPortfolio:', error);
      throw error;
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
