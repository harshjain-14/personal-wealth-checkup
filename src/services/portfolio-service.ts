
// Updated Portfolio service to use Supabase

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
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

export interface ExternalInvestment {
  type: string;
  name: string;
  amount: number;
  notes?: string;
  id?: number; // Adding ID to track existing records
}

export interface Expense {
  type: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  notes?: string;
  id?: number; // Adding ID to track existing records
}

export interface FutureExpense {
  purpose: string;
  amount: number;
  timeframe: string; // e.g., "6 months", "2 years"
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  id?: number; // Adding ID to track existing records
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

// Mock data for demo purposes
const mockStocks: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", quantity: 10, averagePrice: 2400, currentPrice: 2580, sector: "Energy" },
  { symbol: "INFY", name: "Infosys", quantity: 25, averagePrice: 1450, currentPrice: 1520, sector: "IT" },
  { symbol: "HDFCBANK", name: "HDFC Bank", quantity: 15, averagePrice: 1600, currentPrice: 1550, sector: "Finance" },
  { symbol: "TCS", name: "Tata Consultancy Services", quantity: 8, averagePrice: 3200, currentPrice: 3350, sector: "IT" },
  { symbol: "ICICIBANK", name: "ICICI Bank", quantity: 30, averagePrice: 700, currentPrice: 750, sector: "Finance" },
  { symbol: "ITC", name: "ITC Limited", quantity: 50, averagePrice: 350, currentPrice: 380, sector: "Consumer Goods" },
];

const mockMutualFunds: MutualFund[] = [
  { name: "HDFC Mid-Cap Opportunities Fund", investedAmount: 50000, currentValue: 58000, category: "Mid Cap" },
  { name: "Axis Bluechip Fund", investedAmount: 75000, currentValue: 82000, category: "Large Cap" },
  { name: "SBI Small Cap Fund", investedAmount: 40000, currentValue: 46000, category: "Small Cap" },
];

// Portfolio service using Supabase
const PortfolioService = {
  // Get Zerodha portfolio
  getZerodhaPortfolio: async (): Promise<{ stocks: Stock[]; mutualFunds: MutualFund[] }> => {
    // For now, continue to use mock data
    // In a real implementation, we would fetch this from Zerodha API via a Supabase Edge Function
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      stocks: [...mockStocks],
      mutualFunds: [...mockMutualFunds]
    };
  },
  
  // Connect to Zerodha
  connectToZerodha: async (username: string, password: string): Promise<boolean> => {
    try {
      // In a real implementation, we would verify credentials via Zerodha API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (!username || !password) {
        toast.error("Username and password are required");
        return false;
      }
      
      // Store Zerodha credentials in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to connect to Zerodha");
        return false;
      }
      
      const { error } = await supabase
        .from('zerodha_credentials')
        .upsert([
          { 
            user_id: user.id,
            zerodha_user_id: username
            // Note: We don't store passwords, in a real app we would use OAuth
          }
        ]);
      
      if (error) {
        console.error("Supabase error:", error);
        toast.error("Failed to connect to Zerodha");
        return false;
      }
      
      toast.success("Connected to Zerodha successfully");
      return true;
    } catch (error) {
      console.error("Zerodha connection error:", error);
      toast.error("Failed to connect to Zerodha");
      return false;
    }
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
        // Map investments to the database schema
        const formattedInvestments = investments.map(investment => ({
          user_id: user.id,
          investment_type: investment.type,
          investment_name: investment.name,
          amount: investment.amount,
          notes: investment.notes || null
        }));
        
        const { error: insertError } = await supabase
          .from('external_investments')
          .insert(formattedInvestments);
        
        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error("Failed to save investments");
          return false;
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
        // Map expenses to the database schema
        const formattedExpenses = expenses.map(expense => ({
          user_id: user.id,
          expense_type: expense.type,
          description: expense.name,
          amount: expense.amount,
          frequency: expense.frequency.toUpperCase(),
          notes: expense.notes || null
        }));
        
        const { error: insertError } = await supabase
          .from('regular_expenses')
          .insert(formattedExpenses);
        
        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error("Failed to save expenses");
          return false;
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
        frequency: item.frequency.toLowerCase(),
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
        const formattedExpenses = futureExpenses.map(expense => ({
          user_id: user.id,
          purpose: expense.purpose,
          amount: expense.amount,
          timeframe: expense.timeframe,
          priority: expense.priority,
          notes: expense.notes || null
        }));
        
        const { error: insertError } = await supabase
          .from('future_expenses')
          .insert(formattedExpenses);
        
        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error("Failed to save future expenses");
          return false;
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
        priority: item.priority,
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
      let riskToleranceValue: string | null = null;
      if (userInfo.riskTolerance === 'low') {
        riskToleranceValue = "low - safety first";
      } else if (userInfo.riskTolerance === 'medium') {
        riskToleranceValue = "medium - balanced apporach";
      } else if (userInfo.riskTolerance === 'high') {
        riskToleranceValue = "high - growth focused";
      }
      
      const { error } = await supabase
        .from('personal_info')
        .upsert([
          {
            id: user.id, // Use user.id as the primary key
            user_id: user.id,
            age: userInfo.age,
            city: userInfo.city,
            risk_tolerance: riskToleranceValue,
            financial_goals: userInfo.financialGoals || []
          }
        ]);
      
      if (error) {
        console.error("Upsert error:", error);
        toast.error("Failed to save personal information");
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
    // Get all data types
    const externalInvestments = await PortfolioService.getExternalInvestments();
    const expenses = await PortfolioService.getExpenses();
    const futureExpenses = await PortfolioService.getFutureExpenses();
    const userInfo = await PortfolioService.getUserInfo();
    
    // For now, continue to use mock data for stocks and mutual funds
    const { stocks, mutualFunds } = await PortfolioService.getZerodhaPortfolio();
    
    return {
      stocks,
      mutualFunds,
      externalInvestments,
      expenses,
      futureExpenses,
      userInfo: userInfo || undefined,
      lastUpdated: new Date().toISOString()
    };
  }
};

export default PortfolioService;
