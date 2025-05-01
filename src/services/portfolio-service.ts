// Updated Portfolio service to use Supabase

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

// Types that match our frontend UI components
export interface Stock {
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  sector: string;
}

export interface MutualFund {
  name: string;
  investedAmount: number;
  currentValue: number;
  category: string;
}

// Type that matches the database schema
type InvestmentType = Database["public"]["Enums"]["investment_type"];
type CityEnum = Database["public"]["Enums"]["city_enum"];

export interface ExternalInvestment {
  type: string;
  name: string;
  amount: number;
  notes?: string;
  id?: number;
}

type ExpenseType = Database["public"]["Enums"]["expense_type_enum"];
type ExpenseFrequency = Database["public"]["Enums"]["expense_frequency_enum"];

// Map frontend frequency to database enum
const mapFrequencyToEnum = (freq: string): ExpenseFrequency => {
  switch (freq.toLowerCase()) {
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
    case 'yearly': return 'Yearly';
    case 'one-time': return 'One-time';
    default: return 'Monthly'; // Default fallback
  }
};

// Map database enum to frontend frequency
const mapEnumToFrequency = (freq: ExpenseFrequency): 'monthly' | 'quarterly' | 'yearly' | 'one-time' => {
  switch (freq) {
    case 'Monthly': return 'monthly';
    case 'Quarterly': return 'quarterly';
    case 'Yearly': return 'yearly';
    case 'One-time': return 'one-time';
    default: return 'monthly'; // Default fallback
  }
};

export interface Expense {
  type: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  notes?: string;
  id?: number;
}

type PurposeType = Database["public"]["Enums"]["future_expense_enumm"];
type TimeframeType = Database["public"]["Enums"]["timeframe_enum"];
type PriorityType = Database["public"]["Enums"]["priority_enum"];

// Map frontend purpose to database enum
const mapPurposeToEnum = (purpose: string): PurposeType => {
  // Using a direct mapping approach to ensure exact matches with the database enum
  if (purpose === 'House Purchase') return 'House Purchase';
  if (purpose === 'Car Purchase') return 'Car Purchase';
  if (purpose === 'Education') return 'Education';
  if (purpose === 'Wedding') return 'Wedding';
  if (purpose === 'Medical Treatment') return 'Medical Treatment';
  if (purpose === 'Vacation') return 'Vacation';
  if (purpose === 'Home Renovation') return 'Home Renovation';
  if (purpose === 'Business Startup') return 'Business Startup';
  return 'Other'; // Default fallback
};

// Map timeframe to database enum
const mapTimeframeToEnum = (timeframe: string): TimeframeType => {
  if (timeframe === '3 months') return '3 months';
  if (timeframe === '6 months') return '6 months';
  if (timeframe === '1 year') return '1 year';
  if (timeframe === '2 years') return '2 years';
  if (timeframe === '5 years') return '5 years';
  if (timeframe === '10 years') return '10 years';
  return 'Other';
};

// Map priority to database enum
const mapPriorityToEnum = (priority: 'low' | 'medium' | 'high'): PriorityType => {
  if (priority === 'low') return 'Low';
  if (priority === 'medium') return 'Medium';
  if (priority === 'high') return 'High';
  return 'Medium'; // Default fallback
};

export interface FutureExpense {
  purpose: string;
  amount: number;
  timeframe: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  id?: number;
}

export interface UserInfo {
  age: number;
  city: string;
  riskTolerance?: 'low' | 'medium' | 'high';
  financialGoals?: string[];
}

export interface PortfolioData {
  stocks: Stock[];
  mutualFunds: MutualFund[];
  externalInvestments: ExternalInvestment[];
  expenses: Expense[];
  futureExpenses: FutureExpense[];
  userInfo?: UserInfo;
  lastUpdated: string;
}

// Map investment type string to database enum
const mapInvestmentTypeToEnum = (type: string): InvestmentType => {
  // Direct mapping based on the exact enum values from the screenshot
  if (type === 'Gold') return 'Gold';
  if (type === 'Fixed Deposit') return 'Fixed Deposit';
  if (type === 'Real Estate') return 'Real Estate';
  if (type === 'Bank Deposit') return 'Bank Deposit';
  if (type === 'PPF') return 'PPF';
  if (type === 'EPF') return 'EPF';
  if (type === 'National Pension Scheme') return 'National Pension Scheme';
  if (type === 'Bonds') return 'Bonds';
  return 'Others'; // Default fallback
};

// Map expense type string to database enum
const mapExpenseTypeToEnum = (type: string): ExpenseType => {
  if (type === 'EMI') return 'EMI';
  if (type === 'Rent') return 'Rent';
  if (type === 'School Fees') return 'School Fees';
  if (type === 'Loan Payment') return 'Loan Payment';
  if (type === 'Insurance Premium') return 'Insurance Premium';
  if (type === 'Utility Bills') return 'Utility Bills';
  if (type === 'Medical') return 'Medical';
  return 'Others'; // Default fallback
};

// Map city to database enum to ensure it matches Supabase enum values
const mapCityToEnum = (city: string): CityEnum => {
  // Check if the city is already one of the valid enum values
  if (["Mumbai", "Delhi", "Hyderabad", "Bangalore", "Lucknow", "Other", 
       "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur"].includes(city)) {
    return city as CityEnum;
  }
  return 'Other'; // Default fallback if it doesn't match any valid option
};

// Portfolio service using Supabase
const PortfolioService = {
  // Get Zerodha portfolio
  getZerodhaPortfolio: async (): Promise<{ stocks: Stock[]; mutualFunds: MutualFund[] }> => {
    try {
      console.log("Fetching Zerodha portfolio data...");
      
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      // Call the Zerodha portfolio API via Supabase Edge Function with auth token
      const { data, error } = await supabase.functions.invoke('zerodha-portfolio', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (error) {
        console.error('Error fetching Zerodha portfolio:', error);
        toast.error(`Failed to fetch Zerodha portfolio: ${error.message}`);
        throw error;
      }
      
      console.log("Zerodha API response:", data);
      
      if (!data || (!data.holdings && !data.positions)) {
        console.error('No data returned from Zerodha API');
        toast.error('No data returned from Zerodha API');
        throw new Error('No data returned from Zerodha API');
      }

      // Process the portfolio data
      const stocks: Stock[] = [];
      const mutualFunds: MutualFund[] = [];
      
      // Save portfolio data to database for persistence
      try {
        await PortfolioService.savePortfolioToDb(data);
      } catch (saveError) {
        console.error('Error saving portfolio to database:', saveError);
        // Continue with processing even if save fails
      }
      
      // Convert Zerodha holdings to our Stock type
      if (Array.isArray(data.holdings)) {
        data.holdings.forEach((holding: any) => {
          // Check if it's a mutual fund or stock
          if (holding.tradingsymbol && holding.tradingsymbol.includes('MF')) {
            mutualFunds.push({
              name: holding.tradingsymbol,
              investedAmount: holding.average_price * holding.quantity,
              currentValue: holding.last_price * holding.quantity,
              category: 'Mutual Fund' // Zerodha API doesn't provide category, so we use a default
            });
          } else {
            stocks.push({
              symbol: holding.tradingsymbol,
              name: holding.tradingsymbol,
              quantity: holding.quantity,
              averagePrice: holding.average_price,
              currentPrice: holding.last_price,
              sector: holding.sector || 'N/A' // Use sector if available, otherwise N/A
            });
          }
        });
      }
      
      console.log(`Processed ${stocks.length} stocks and ${mutualFunds.length} mutual funds`);
      
      return {
        stocks,
        mutualFunds
      };
    } catch (error) {
      console.error('Error in getZerodhaPortfolio:', error);
      throw error;
    }
  },

  // Save portfolio data to database for persistence
  savePortfolioToDb: async (portfolioData: any): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('User not authenticated');
        return false;
      }

      const userId = session.user.id;
      const now = new Date().toISOString();
      
      // Store the raw portfolio data as JSON
      const { error } = await supabase
        .from('portfolio_snapshots')
        .insert({
          user_id: userId,
          snapshot_data: portfolioData,
          snapshot_date: now
        })
        .select();

      if (error) {
        console.error('Error saving portfolio snapshot:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving portfolio to database:', error);
      return false;
    }
  },
  
  // Get Zerodha login URL from edge function
  getZerodhaLoginUrl: async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('zerodha-login-url', {
        method: 'GET'
      });
      
      if (error) {
        console.error('Error getting Zerodha login URL:', error);
        toast.error(`Failed to get Zerodha login URL: ${error.message}`);
        return null;
      }
      
      if (!data || !data.loginUrl) {
        console.error('No login URL returned from function');
        toast.error('No login URL returned from function');
        return null;
      }
      
      return data.loginUrl;
    } catch (error: any) {
      console.error('Error in getZerodhaLoginUrl:', error);
      toast.error(`Error in getZerodhaLoginUrl: ${error.message || 'Unknown error'}`);
      return null;
    }
  },
  
  // Logout from Zerodha by invalidating the access token
  logoutFromZerodha: async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('User not authenticated');
        toast.error('You must be logged in to disconnect from Zerodha');
        return false;
      }

      // Call edge function to invalidate the token
      const { data, error } = await supabase.functions.invoke('zerodha-logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error logging out from Zerodha:', error);
        toast.error(`Logout failed: ${error.message}`);
        return false;
      }

      // Also remove token from our database
      const { error: dbError } = await supabase
        .from('zerodha_credentials')
        .update({ access_token: null })
        .eq('user_id', session.user.id);

      if (dbError) {
        console.error('Error removing token from database:', dbError);
        // We still consider this a success since the Zerodha token was invalidated
      }

      return true;
    } catch (error: any) {
      console.error('Error in logoutFromZerodha:', error);
      toast.error(`Error disconnecting: ${error.message || 'Unknown error'}`);
      return false;
    }
  },
  
  // Exchange Zerodha request token for access token
  exchangeZerodhaToken: async (requestToken: string): Promise<boolean> => {
    try {
      console.log(`Exchanging Zerodha token: ${requestToken.substring(0, 5)}...`);
      
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('User not authenticated');
        toast.error('You must be logged in to connect to Zerodha');
        return false;
      }
      
      // Call the edge function with auth token
      const { data, error } = await supabase.functions.invoke('zerodha-exchange-token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: { request_token: requestToken }
      });
      
      if (error) {
        console.error('Error exchanging Zerodha token:', error);
        toast.error(`Token exchange error: ${error.message || 'Unknown error'}`);
        return false;
      }
      
      console.log('Token exchange response:', data);
      
      if (!data || !data.success) {
        console.error('Token exchange failed:', data?.message || 'Unknown reason');
        toast.error(`Token exchange failed: ${data?.message || 'Unknown reason'}`);
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error('Error in exchangeZerodhaToken:', error);
      toast.error(`Error exchanging token: ${error.message || 'Unknown error'}`);
      return false;
    }
  },
  
  // Connect to Zerodha (legacy method for compatibility)
  connectToZerodha: async (username: string, password: string): Promise<boolean> => {
    toast.error("This method is deprecated. Please use the 'Login with Zerodha' button instead.");
    return false;
  },
  
  // Save external investments
  saveExternalInvestments: async (investments: ExternalInvestment[]): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to save investments");
        return false;
      }
      
      // First, delete existing investments for this user
      const { error: deleteError } = await supabase
        .from('external_investments')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.error("Delete error:", deleteError);
        toast.error("Failed to update investments");
        return false;
      }
      
      // Then insert new investments
      if (investments.length > 0) {
        // Insert investments one by one to avoid type errors with bulk insert
        for (const investment of investments) {
          const formattedInvestment = {
            user_id: user.id,
            investment_type: mapInvestmentTypeToEnum(investment.type),
            investment_name: investment.name,
            amount: investment.amount,
            notes: investment.notes || null
          };
          
          console.log("Saving investment:", formattedInvestment); // Debug logging
          
          const { error: insertError } = await supabase
            .from('external_investments')
            .insert(formattedInvestment);
          
          if (insertError) {
            console.error("Insert error:", insertError);
            toast.error("Failed to save investment: " + investment.name);
            return false;
          }
        }
      }
      
      toast.success("Investments saved successfully");
      return true;
    } catch (error) {
      console.error("Save investments error:", error);
      toast.error("Failed to save investments");
      return false;
    }
  },
  
  // Get external investments
  getExternalInvestments: async (): Promise<ExternalInvestment[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('external_investments')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Fetch error:", error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        type: item.investment_type,
        name: item.investment_name,
        amount: item.amount,
        notes: item.notes
      }));
    } catch (error) {
      console.error("Fetch investments error:", error);
      return [];
    }
  },
  
  // Save expenses
  saveExpenses: async (expenses: Expense[]): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to save expenses");
        return false;
      }
      
      // First, delete existing expenses for this user
      const { error: deleteError } = await supabase
        .from('regular_expenses')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.error("Delete error:", deleteError);
        toast.error("Failed to update expenses");
        return false;
      }
      
      // Then insert new expenses
      if (expenses.length > 0) {
        // Process each expense individually for better error handling
        for (const expense of expenses) {
          const formattedExpense = {
            user_id: user.id,
            expense_type: mapExpenseTypeToEnum(expense.type),
            description: expense.name,
            amount: expense.amount,
            frequency: mapFrequencyToEnum(expense.frequency),
            notes: expense.notes || null
          };
          
          console.log("Saving expense:", formattedExpense); // Debug logging
          
          const { error: insertError } = await supabase
            .from('regular_expenses')
            .insert(formattedExpense);
          
          if (insertError) {
            console.error("Insert error:", insertError);
            toast.error("Failed to save expense: " + expense.name);
            return false;
          }
        }
      }
      
      toast.success("Expenses saved successfully");
      return true;
    } catch (error) {
      console.error("Save expenses error:", error);
      toast.error("Failed to save expenses");
      return false;
    }
  },
  
  // Get expenses
  getExpenses: async (): Promise<Expense[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('regular_expenses')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Fetch error:", error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        type: item.expense_type,
        name: item.description,
        amount: item.amount,
        frequency: mapEnumToFrequency(item.frequency),
        notes: item.notes
      }));
    } catch (error) {
      console.error("Fetch expenses error:", error);
      return [];
    }
  },
  
  // Save future expenses
  saveFutureExpenses: async (futureExpenses: FutureExpense[]): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to save future expenses");
        return false;
      }
      
      // First, delete existing future expenses for this user
      const { error: deleteError } = await supabase
        .from('future_expenses')
        .delete()
        .eq('user_id', user.id);
      
      if (deleteError) {
        console.error("Delete error:", deleteError);
        toast.error("Failed to update future expenses");
        return false;
      }
      
      // Then insert new future expenses
      if (futureExpenses.length > 0) {
        // Process each expense individually for better error handling
        for (const expense of futureExpenses) {
          // Map to the database schema with proper enum types
          // Important: Use exact enum values as defined in the database
          const mappedPurpose = mapPurposeToEnum(expense.purpose);
          const mappedTimeframe = mapTimeframeToEnum(expense.timeframe);
          const mappedPriority = mapPriorityToEnum(expense.priority);
          
          const formattedExpense = {
            user_id: user.id,
            purpose: mappedPurpose,
            amount: expense.amount,
            timeframe: mappedTimeframe,
            priority: mappedPriority,
            notes: expense.notes || null
          };
          
          console.log("DEBUG - Saving future expense:", {
            original: expense,
            formatted: formattedExpense
          });
          
          const { error: insertError } = await supabase
            .from('future_expenses')
            .insert(formattedExpense);
          
          if (insertError) {
            console.error("Insert error:", insertError);
            toast.error("Failed to save future expense: " + expense.purpose);
            return false;
          }
        }
      }
      
      toast.success("Future expenses saved successfully");
      return true;
    } catch (error) {
      console.error("Save future expenses error:", error);
      toast.error("Failed to save future expenses");
      return false;
    }
  },
  
  // Get future expenses
  getFutureExpenses: async (): Promise<FutureExpense[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('future_expenses')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Fetch error:", error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        purpose: item.purpose,
        amount: item.amount,
        timeframe: item.timeframe,
        priority: item.priority.toLowerCase() as 'low' | 'medium' | 'high',
        notes: item.notes
      }));
    } catch (error) {
      console.error("Fetch future expenses error:", error);
      return [];
    }
  },
  
  // Save user info
  saveUserInfo: async (userInfo: UserInfo): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to save personal information");
        return false;
      }
      
      // For risk_tolerance, match the enum format in database
      let riskToleranceValue: Database["public"]["Enums"]["risk_tolerance_enum"] | null = null;
      if (userInfo.riskTolerance === 'low') {
        riskToleranceValue = "low - safety first";
      } else if (userInfo.riskTolerance === 'medium') {
        riskToleranceValue = "medium - balanced apporach";
      } else if (userInfo.riskTolerance === 'high') {
        riskToleranceValue = "high - growth focused";
      }
      
      // Ensure city is a valid enum value from the database
      const cityValue = mapCityToEnum(userInfo.city);
      
      console.log("DEBUG - Saving user info:", {
        userInfo,
        mappedRiskTolerance: riskToleranceValue,
        mappedCity: cityValue,
        financialGoals: userInfo.financialGoals
      });
      
      const dataToUpsert = {
        id: user.id, // Use user.id as the primary key
        user_id: user.id,
        age: userInfo.age,
        city: cityValue,
        risk_tolerance: riskToleranceValue,
        financial_goals: userInfo.financialGoals || []
      };
      
      console.log("DEBUG - Data to upsert:", dataToUpsert);
      
      const { error } = await supabase
        .from('personal_info')
        .upsert(dataToUpsert);
      
      if (error) {
        console.error("Upsert error:", error);
        toast.error("Failed to save personal information: " + error.message);
        return false;
      }
      
      toast.success("Personal information saved successfully");
      return true;
    } catch (error) {
      console.error("Save user info error:", error);
      toast.error("Failed to save personal information");
      return false;
    }
  },
  
  // Get user info
  getUserInfo: async (): Promise<UserInfo | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('personal_info')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is the error code for "no rows returned"
          console.error("Fetch error:", error);
        }
        return null;
      }
      
      // Map the risk_tolerance from db format to frontend format
      let riskTolerance: 'low' | 'medium' | 'high' | undefined;
      if (data.risk_tolerance === 'low - safety first') {
        riskTolerance = 'low';
      } else if (data.risk_tolerance === 'medium - balanced apporach') {
        riskTolerance = 'medium';
      } else if (data.risk_tolerance === 'high - growth focused') {
        riskTolerance = 'high';
      }
      
      return {
        age: data.age,
        city: data.city,
        riskTolerance: riskTolerance,
        financialGoals: data.financial_goals
      };
    } catch (error) {
      console.error("Fetch user info error:", error);
      return null;
    }
  },
  
  // Save portfolio data (legacy method for compatibility)
  savePortfolioData: async (data: Partial<PortfolioData>): Promise<PortfolioData> => {
    // Handle each data type separately
    if (data.externalInvestments) {
      await PortfolioService.saveExternalInvestments(data.externalInvestments);
    }
    
    if (data.expenses) {
      await PortfolioService.saveExpenses(data.expenses);
    }
    
    if (data.futureExpenses) {
      await PortfolioService.saveFutureExpenses(data.futureExpenses);
    }
    
    if (data.userInfo) {
      await PortfolioService.saveUserInfo(data.userInfo);
    }
    
    // Return get portfolio data to maintain compatibility
    return PortfolioService.getPortfolioData();
  },
  
  // Get portfolio data (legacy method for compatibility)
  getPortfolioData: async (): Promise<PortfolioData> => {
    try {
      // Get all data types
      const externalInvestments = await PortfolioService.getExternalInvestments();
      const expenses = await PortfolioService.getExpenses();
      const futureExpenses = await PortfolioService.getFutureExpenses();
      const userInfo = await PortfolioService.getUserInfo();
      
      // Check if user is connected to Zerodha
      const { data: { session } } = await supabase.auth.getSession();
      let stocks: Stock[] = [];
      let mutualFunds: MutualFund[] = [];
      
      if (session?.user) {
        try {
          // Check if the user has Zerodha credentials
          const { data: credentials, error } = await supabase
            .from('zerodha_credentials')
            .select('access_token')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          console.log('Zerodha credentials check:', { 
            hasCredentials: !!credentials, 
            hasToken: !!credentials?.access_token,
            error: error ? error.message : null 
          });
          
          if (!error && credentials?.access_token) {
            // User has Zerodha connected, fetch real data
            try {
              console.log('Fetching Zerodha portfolio...');
              const zerodhaData = await PortfolioService.getZerodhaPortfolio();
              stocks = zerodhaData.stocks;
              mutualFunds = zerodhaData.mutualFunds;
              console.log(`Retrieved ${stocks.length} stocks and ${mutualFunds.length} mutual funds`);
            } catch (zerodhaError: any) {
              console.error('Error fetching Zerodha portfolio:', zerodhaError);
              toast.error(`Failed to fetch Zerodha portfolio: ${zerodhaError.message || 'Unknown error'}. Please reconnect your account.`);
              // If there's an error fetching Zerodha data, we'll show an empty portfolio
              // This will prompt the user to reconnect their Zerodha account
            }
          } else {
            console.log('User not connected to Zerodha or missing access token');
          }
        } catch (credentialsError: any) {
          console.error('Error checking Zerodha credentials:', credentialsError);
        }
      }
      
      return {
        stocks,
        mutualFunds,
        externalInvestments,
        expenses,
        futureExpenses,
        userInfo: userInfo || undefined,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in getPortfolioData:', error);
      // Return empty data as fallback
      return {
        stocks: [],
        mutualFunds: [],
        externalInvestments: [],
        expenses: [],
        futureExpenses: [],
        lastUpdated: new Date().toISOString()
      };
    }
  }
};

export default PortfolioService;
