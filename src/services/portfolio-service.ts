// Updated Portfolio service to use Supabase

import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { Json } from '@/integrations/supabase/types';

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

// Database enum types - use literal string types to match exactly what's in the database
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
  type: ExpenseType;
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

// Type mapping helpers for UI to Database conversions
const mapExpenseFrequencyForDb = (frequency: ExpenseFrequency): Database["public"]["Enums"]["expense_frequency_enum"] => {
  const frequencyMap: Record<ExpenseFrequency, Database["public"]["Enums"]["expense_frequency_enum"]> = {
    'monthly': 'Monthly',
    'quarterly': 'Quarterly',
    'yearly': 'Yearly',
    'one-time': 'One-time'
  };
  return frequencyMap[frequency];
};

const mapExpenseTypeForDb = (type: ExpenseType): Database["public"]["Enums"]["expense_type_enum"] => {
  // The types should directly match the database enum, with exact casing
  return type as unknown as Database["public"]["Enums"]["expense_type_enum"];
};

const mapFuturePurposeForDb = (purpose: FuturePurpose): Database["public"]["Enums"]["future_expense_enumm"] => {
  const purposeMap: Record<FuturePurpose, Database["public"]["Enums"]["future_expense_enumm"]> = {
    'home': 'House Purchase',
    'education': 'Education',
    'vehicle': 'Car Purchase',
    'vacation': 'Vacation',
    'wedding': 'Wedding',
    'healthcare': 'Medical Treatment',
    'others': 'Other'
  };
  return purposeMap[purpose];
};

const mapTimeFrameForDb = (timeframe: TimeFrame): Database["public"]["Enums"]["timeframe_enum"] => {
  // Map UI timeframe values to database enum values
  if (timeframe === 'short_term') return '1 year';
  if (timeframe === 'medium_term') return '5 years';
  if (timeframe === 'long_term') return '10 years';
  
  // Default case (should not happen with proper type checking)
  return '5 years';
};

const mapPriorityLevelForDb = (priority: PriorityLevel): Database["public"]["Enums"]["priority_enum"] => {
  const priorityMap: Record<PriorityLevel, Database["public"]["Enums"]["priority_enum"]> = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High'
  };
  return priorityMap[priority];
};

const mapRiskToleranceForDb = (risk: RiskTolerance): Database["public"]["Enums"]["risk_tolerance_enum"] => {
  const riskMap: Record<RiskTolerance, Database["public"]["Enums"]["risk_tolerance_enum"]> = {
    'conservative': 'low - safety first',
    'moderate': 'medium - balanced apporach',
    'aggressive': 'high - growth focused'
  };
  return riskMap[risk];
};

const mapCityToDbEnum = (city: CityType): Database["public"]["Enums"]["city_enum"] => {
  // For UI to DB mapping
  const cityDisplayMap: Record<CityType, Database["public"]["Enums"]["city_enum"]> = {
    'metro': 'Mumbai',
    'tier1': 'Chennai',
    'tier2': 'Ahmedabad', 
    'tier3': 'Lucknow',
    'overseas': 'Other'
  };
  return cityDisplayMap[city];
};

// For DB to UI mapping
const mapDbCityToUiEnum = (city: Database["public"]["Enums"]["city_enum"]): CityType => {
  const cityMap: Record<Database["public"]["Enums"]["city_enum"], CityType> = {
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
  return cityMap[city];
};

const mapDbRiskToUiEnum = (risk: Database["public"]["Enums"]["risk_tolerance_enum"]): RiskTolerance => {
  const riskMap: Record<Database["public"]["Enums"]["risk_tolerance_enum"], RiskTolerance> = {
    'low - safety first': 'conservative',
    'medium - balanced apporach': 'moderate',
    'high - growth focused': 'aggressive'
  };
  return riskMap[risk];
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
      
      // Take a snapshot of the portfolio - convert to Json type
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

      // Gather data from individual sources
      const [externalInvestments, expenses, futureExpenses, userInfo] = await Promise.all([
        PortfolioService.getExternalInvestments(),
        PortfolioService.getExpenses(),
        PortfolioService.getFutureExpenses(),
        PortfolioService.getUserInfo()
      ]);

      return {
        stocks: [],
        mutualFunds: [],
        externalInvestments,
        expenses,
        futureExpenses,
        userInfo: userInfo || undefined,
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

  saveExternalInvestments: async (investments: ExternalInvestment[]): Promise<ExternalInvestment[]> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not logged in');
        throw new Error('User not logged in');
      }
      
      console.log('Saving external investments:', investments);
      
      // Clear existing investments
      const { error: deleteError } = await supabase
        .from('external_investments')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.error('Error deleting existing investments:', deleteError);
        toast.error('Failed to update investments');
        throw deleteError;
      }
      
      // Only insert if there are investments to save
      if (investments.length > 0) {
        // Create an array of investments to insert
        const investmentsToInsert = investments.map(investment => ({
          user_id: user.id,
          investment_name: investment.name,
          investment_type: investment.type,
          amount: investment.amount,
          notes: investment.notes || ''
        }));
        
        // Insert all investments in a single request
        const { error: insertError } = await supabase
          .from('external_investments')
          .insert(investmentsToInsert);
          
        if (insertError) {
          console.error('Error inserting investments:', insertError);
          toast.error('Failed to save investments');
          throw insertError;
        }
      }
      
      console.log("Investments saved successfully");
      toast.success("Investments saved successfully");
      
      // Fetch the updated investments to refresh the UI
      const updatedInvestments = await PortfolioService.getExternalInvestments();
      return updatedInvestments;
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
      
      console.log('Fetched external investments:', data);
      
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
  
  saveExpenses: async (expenses: Expense[]): Promise<Expense[]> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not logged in');
        throw new Error('User not logged in');
      }
      
      console.log('Saving expenses:', expenses);
      
      // Clear existing expenses
      const { error: deleteError } = await supabase
        .from('regular_expenses')
        .delete()
        .eq('user_id', user.id);
        
      if (deleteError) {
        console.error('Error deleting existing expenses:', deleteError);
        toast.error('Failed to update expenses');
        throw deleteError;
      }
      
      // Only insert if there are expenses to save
      if (expenses.length > 0) {
        // Create an array of expenses to insert
        const expensesToInsert = expenses.map(expense => ({
          user_id: user.id,
          description: expense.name,
          amount: expense.amount,
          frequency: mapExpenseFrequencyForDb(expense.frequency),
          expense_type: mapExpenseTypeForDb(expense.type),
          notes: expense.notes || ''
        }));
        
        // Insert all expenses in a single request
        const { error: insertError } = await supabase
          .from('regular_expenses')
          .insert(expensesToInsert);
          
        if (insertError) {
          console.error('Error inserting expenses:', insertError);
          toast.error('Failed to save expenses');
          throw insertError;
        }
      }
      
      console.log("Expenses saved successfully");
      toast.success("Expenses saved successfully");
      
      // Fetch updated expenses to refresh the UI
      const updatedExpenses = await PortfolioService.getExpenses();
      return updatedExpenses;
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
      
      console.log('Fetched expenses:', data);
      
      return data.map(exp => ({
        id: exp.id,
        name: exp.description,
        type: exp.expense_type as ExpenseType,
        amount: exp.amount,
        frequency: exp.frequency.toLowerCase() as ExpenseFrequency,
        notes: exp.notes
      }));
    } catch (error) {
      console.error('Error fetching regular expenses:', error);
      return [];
    }
  },
  
  saveFutureExpenses: async (expenses: FutureExpense[]): Promise<FutureExpense[]> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not logged in');
        throw new Error('User not logged in');
      }
      
      console.log('Saving future expenses:', expenses);
      
      // Clear existing future expenses
      const { error: deleteError } = await supabase
        .from('future_expenses')
        .delete()
        .eq('user_id', user.id);
        
      if (deleteError) {
        console.error('Error deleting existing future expenses:', deleteError);
        toast.error('Failed to update future expenses');
        throw deleteError;
      }
      
      // Only insert if there are expenses to save
      if (expenses.length > 0) {
        // Create an array of future expenses to insert
        const expensesToInsert = expenses.map(expense => ({
          user_id: user.id,
          purpose: mapFuturePurposeForDb(expense.purpose),
          amount: expense.amount,
          timeframe: mapTimeFrameForDb(expense.timeframe),
          priority: mapPriorityLevelForDb(expense.priority),
          notes: expense.notes || ''
        }));
        
        // Insert all future expenses in a single request
        const { error: insertError } = await supabase
          .from('future_expenses')
          .insert(expensesToInsert);
          
        if (insertError) {
          console.error('Error inserting future expenses:', insertError);
          toast.error('Failed to save future expenses');
          throw insertError;
        }
      }
      
      console.log("Future expenses saved successfully");
      toast.success("Future expenses saved successfully");
      
      // Fetch updated future expenses to refresh the UI
      const updatedFutureExpenses = await PortfolioService.getFutureExpenses();
      return updatedFutureExpenses;
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
      
      console.log('Fetched future expenses:', data);
      
      return data.map(exp => {
        // Map database values to our application types
        let purpose: FuturePurpose = 'others';
        if (exp.purpose === 'House Purchase') purpose = 'home';
        else if (exp.purpose === 'Car Purchase') purpose = 'vehicle';
        else if (exp.purpose === 'Education') purpose = 'education';
        else if (exp.purpose === 'Wedding') purpose = 'wedding';
        else if (exp.purpose === 'Medical Treatment') purpose = 'healthcare';
        else if (exp.purpose === 'Vacation') purpose = 'vacation';
        
        let timeframe: TimeFrame = 'medium_term';
        if (exp.timeframe === '1 year' || exp.timeframe === '6 months' || exp.timeframe === '3 months') 
          timeframe = 'short_term';
        else if (exp.timeframe === '2 years' || exp.timeframe === '5 years') 
          timeframe = 'medium_term';
        else if (exp.timeframe === '10 years') 
          timeframe = 'long_term';
        
        let priority: PriorityLevel = 'medium';
        if (exp.priority === 'Low') priority = 'low';
        else if (exp.priority === 'Medium') priority = 'medium';
        else if (exp.priority === 'High') priority = 'high';
        
        return {
          id: exp.id,
          purpose,
          amount: exp.amount,
          timeframe,
          priority,
          notes: exp.notes
        };
      });
    } catch (error) {
      console.error('Error fetching future expenses:', error);
      return [];
    }
  },
  
  // Add fixed saveUserInfo function to ensure user info is saved correctly
  saveUserInfo: async (userInfo: UserInfo): Promise<UserInfo> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('User not logged in');
        throw new Error('User not logged in');
      }
      
      console.log('Saving user info:', userInfo);
      
      // Check if user info exists
      const { data: existingData, error: fetchError } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fetchError) {
        console.error('Error fetching existing user info:', fetchError);
      }
      
      // Prepare data for database
      const dbCity = mapCityToDbEnum(userInfo.city);
      const dbRiskTolerance = mapRiskToleranceForDb(userInfo.riskTolerance);
      
      if (existingData) {
        // Update existing user info
        const { error: updateError } = await supabase
          .from('personal_info')
          .update({
            age: userInfo.age,
            city: dbCity,
            risk_tolerance: dbRiskTolerance,
            financial_goals: userInfo.financialGoals || []
          })
          .eq('user_id', user.id);
          
        if (updateError) {
          console.error('Error updating user info:', updateError);
          toast.error('Failed to update personal information');
          throw updateError;
        }
      } else {
        // Insert new user info with a generated UUID
        const id = crypto.randomUUID();
        const { error: insertError } = await supabase
          .from('personal_info')
          .insert({
            id,
            user_id: user.id,
            age: userInfo.age,
            city: dbCity,
            risk_tolerance: dbRiskTolerance,
            financial_goals: userInfo.financialGoals || []
          });
          
        if (insertError) {
          console.error('Error inserting user info:', insertError);
          toast.error('Failed to save personal information');
          throw insertError;
        }
      }
      
      console.log("User info saved successfully");
      toast.success("Personal information saved successfully");
      
      // Immediately fetch updated user info to ensure UI consistency
      const updatedUserInfo = await PortfolioService.getUserInfo();
      return updatedUserInfo || userInfo;
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
      
      console.log('Fetched user info:', data);
      
      return {
        id: data.id,
        age: data.age,
        city: mapDbCityToUiEnum(data.city),
        riskTolerance: mapDbRiskToUiEnum(data.risk_tolerance),
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
      
      // Convert portfolioData to JSON type before insertion
      const portfolioDataJson = JSON.parse(JSON.stringify(portfolioData)) as Json;
      
      // Use direct insert with proper typing
      const { error } = await supabase
        .from('portfolio_snapshots')
        .insert({
          user_id: user.id,
          snapshot_data: portfolioDataJson
        });
      
      if (error) {
        console.error("Error taking portfolio snapshot:", error);
        throw error;
      } else {
        console.log("Portfolio snapshot saved successfully");
      }
      
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
      
      // Get the latest snapshot directly
      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !data) {
        console.error("Error fetching latest portfolio snapshot:", error);
        return null;
      }
      
      // Return the snapshot data as PortfolioData
      return data.snapshot_data as unknown as PortfolioData;
    } catch (error) {
      console.error("Error in getLatestPortfolioSnapshot:", error);
      return null;
    }
  },
  
  // Zerodha portfolio integration methods
  getZerodhaLoginUrl: async (): Promise<string | null> => {
    try {
      console.log("Requesting Zerodha login URL from edge function...");
      const { data, error } = await supabase.functions.invoke('zerodha-login-url');
      
      if (error) {
        console.error('Error getting Zerodha login URL:', error);
        return null;
      }
      
      console.log("Response received:", data);
      
      // Check if the response contains a login URL
      if (data && data.loginUrl) {
        console.log("Login URL received:", data.loginUrl);
        return data.loginUrl;
      } else {
        console.error("No login URL in response:", data);
        return null;
      }
    } catch (error) {
      console.error('Error in getZerodhaLoginUrl:', error);
      return null;
    }
  },
  
  exchangeZerodhaToken: async (requestToken: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('zerodha-exchange-token', {
        body: { request_token: requestToken }
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
