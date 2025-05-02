
import { PortfolioData } from '@/services/portfolio-service';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define types needed for the portfolio analysis
export interface PerformanceMetrics {
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  cagr?: number;
  irr?: number;
  sharpeRatio?: number;
}

export interface SectorBreakdown {
  sector: string;
  totalValue: number;
  percentage: number;
}

export interface AssetAllocationItem {
  type: string;
  percentage: number;
  value: number;
}

export interface RiskMetrics {
  volatility: {
    portfolioBeta: number;
    marketComparison: string;
  };
  qualityScore: {
    overall: number;
    stability?: number;
    growth?: number;
    value?: number;
  };
}

export interface TaxInsights {
  potentialSavings: number;
  suggestions: string[];
}

export interface PortfolioInsight {
  type: 'strength' | 'warning' | 'suggestion' | 'tax' | 'goal' | 'volatility';
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  actionable?: boolean;
}

// Define the structure of the analysis report
export interface AnalysisReport {
  summary: string;
  assetAllocation: AssetAllocationItem[];
  performanceMetrics: PerformanceMetrics;
  sectorBreakdown: SectorBreakdown[];
  riskMetrics: RiskMetrics;
  insights: PortfolioInsight[];
  taxInsights: TaxInsights;
  keyRecommendations: string[];
  actionItems: string[];
  timestamp: string;
  generatedDate: string;
}

// Default analysis report structure
const DEFAULT_ANALYSIS: AnalysisReport = {
  summary: "Your portfolio is diversified across stocks, mutual funds, and other assets. Based on your goals and risk tolerance, we recommend some adjustments to optimize your returns.",
  performanceMetrics: {
    totalValue: 100000,
    profitLoss: 12000,
    profitLossPercentage: 12,
    cagr: 8.5,
    irr: 9.2,
    sharpeRatio: 0.75
  },
  assetAllocation: [
    { type: "Equities", percentage: 45, value: 45000 },
    { type: "Mutual Funds", percentage: 30, value: 30000 },
    { type: "Fixed Deposits", percentage: 15, value: 15000 },
    { type: "Others", percentage: 10, value: 10000 }
  ],
  sectorBreakdown: [
    { sector: "Technology", totalValue: 30000, percentage: 30 },
    { sector: "Financial", totalValue: 25000, percentage: 25 },
    { sector: "Healthcare", totalValue: 20000, percentage: 20 },
    { sector: "Consumer Goods", totalValue: 15000, percentage: 15 },
    { sector: "Others", totalValue: 10000, percentage: 10 }
  ],
  riskMetrics: {
    volatility: {
      portfolioBeta: 0.85,
      marketComparison: "Your portfolio is less volatile than the market average"
    },
    qualityScore: {
      overall: 72,
      stability: 75,
      growth: 68,
      value: 72
    }
  },
  insights: [
    {
      type: "strength",
      title: "Strong Diversification",
      description: "Your portfolio has good diversification across different asset classes",
      priority: "medium"
    },
    {
      type: "warning",
      title: "High Tech Exposure",
      description: "Technology sector represents 30% of your equity investments, which may increase volatility",
      priority: "high",
      actionable: true
    },
    {
      type: "suggestion",
      title: "Increase Index Fund Allocation",
      description: "Consider increasing your index fund allocation to reduce fees and increase diversification",
      priority: "medium",
      actionable: true
    }
  ],
  taxInsights: {
    potentialSavings: 15000,
    suggestions: [
      "Utilize ELSS funds for tax-saving under section 80C",
      "Consider tax-free bonds for fixed income allocation",
      "Review holding periods to minimize capital gains taxes"
    ]
  },
  keyRecommendations: [
    "Increase equity exposure by 5-10%",
    "Diversify away from concentrated tech positions",
    "Consider tax-advantaged investment options",
    "Increase retirement contributions by 5%"
  ],
  actionItems: [
    "Rebalance portfolio by the end of this quarter",
    "Set up automatic monthly investments into index funds",
    "Review and optimize tax strategies with a financial advisor",
    "Create an emergency fund of 6 months' expenses"
  ],
  timestamp: new Date().toISOString(),
  generatedDate: new Date().toISOString()
};

// Analysis service using AI API
const AnalysisService = {
  generateAnalysis: async (portfolioData: PortfolioData): Promise<AnalysisReport> => {
    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('User not authenticated');
        toast.error('You must be logged in to generate analysis');
        return DEFAULT_ANALYSIS;
      }

      toast.info('Generating portfolio analysis...', {
        duration: 10000,
        id: 'generating-analysis'
      });
      
      // Call portfolio-analysis edge function
      const { data, error } = await supabase.functions.invoke('portfolio-analysis', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: { portfolioData }
      });
      
      // Remove the toast
      toast.dismiss('generating-analysis');
      
      if (error) {
        console.error('Error generating analysis:', error);
        toast.error(`Analysis generation failed: ${error.message}`);
        return DEFAULT_ANALYSIS;
      }
      
      if (!data) {
        console.error('No analysis data returned');
        toast.error('Failed to generate analysis');
        return DEFAULT_ANALYSIS;
      }
      
      // Add timestamp to the analysis data
      const analysisWithDate: AnalysisReport = {
        ...data,
        timestamp: new Date().toISOString(),
        generatedDate: new Date().toISOString()
      };
      
      toast.success('Portfolio analysis generated successfully');
      return analysisWithDate;
    } catch (error: any) {
      console.error('Error in generateAnalysis:', error);
      toast.error(`Analysis generation error: ${error.message || 'Unknown error'}`);
      return DEFAULT_ANALYSIS;
    }
  },
  
  // Get the latest analysis from the database
  getLatestAnalysis: async (): Promise<AnalysisReport | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return null;
      }
      
      // Need to perform a raw query since portfolio_analysis might not be in the types yet
      // This avoids the TypeScript errors by casting the result
      const { data, error } = await supabase
        .from('portfolio_analysis')
        .select('*')
        .eq('user_id', session.user.id)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();
        
      if (error) {
        console.error('Error fetching latest analysis:', error);
        return null;
      }
      
      // If no data is found, return null
      if (!data) {
        return null;
      }
      
      // Cast the data to have the expected properties
      const analysisData = data as unknown as {
        analysis_data: any;
        analysis_date: string;
      };
      
      return {
        ...analysisData.analysis_data,
        timestamp: analysisData.analysis_date,
        generatedDate: analysisData.analysis_date
      };
    } catch (error) {
      console.error('Error in getLatestAnalysis:', error);
      return null;
    }
  }
};

export default AnalysisService;
