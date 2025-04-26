
// Portfolio service to handle portfolio data

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
}

export interface Expense {
  type: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  notes?: string;
}

export interface FutureExpense {
  purpose: string;
  amount: number;
  timeframe: string; // e.g., "6 months", "2 years"
  priority: 'low' | 'medium' | 'high';
  notes?: string;
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

// Mock data
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

// Portfolio service
const PortfolioService = {
  // Get Zerodha portfolio (simulated)
  getZerodhaPortfolio: async (): Promise<{ stocks: Stock[]; mutualFunds: MutualFund[] }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      stocks: [...mockStocks],
      mutualFunds: [...mockMutualFunds]
    };
  },
  
  // Simulate connecting to Zerodha
  connectToZerodha: async (username: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (!username || !password) {
      toast.error("Username and password are required");
      return false;
    }
    
    // Always succeed for demo purposes
    toast.success("Connected to Zerodha successfully");
    return true;
  },
  
  // Save portfolio data
  savePortfolioData: async (data: Partial<PortfolioData>): Promise<PortfolioData> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Get existing data
    const existingData = PortfolioService.getPortfolioData();
    
    // Merge with new data
    const updatedData: PortfolioData = {
      ...existingData,
      ...data,
      lastUpdated: new Date().toISOString()
    };
    
    // Save to local storage
    localStorage.setItem("portfolio_data", JSON.stringify(updatedData));
    
    return updatedData;
  },
  
  // Get portfolio data
  getPortfolioData: (): PortfolioData => {
    const defaultData: PortfolioData = {
      stocks: [],
      mutualFunds: [],
      externalInvestments: [],
      expenses: [],
      futureExpenses: [],
      lastUpdated: new Date().toISOString()
    };
    
    try {
      const savedData = localStorage.getItem("portfolio_data");
      return savedData ? JSON.parse(savedData) : defaultData;
    } catch (error) {
      console.error("Error loading portfolio data:", error);
      return defaultData;
    }
  }
};

export default PortfolioService;
