
// This file contains the implementation of AnalysisService 
// for generating portfolio analysis reports using AI

import { supabase } from "@/integrations/supabase/client";
import { PortfolioData } from "./portfolio-service";
import { toast } from "sonner";

// Define the structure for analysis report
export interface AnalysisSection {
  title: string;
  content: string[];
  recommendations?: string[];
}

export interface AllocationSection {
  title: string;
  currentAllocation: Record<string, number>;
  recommendedAllocation?: Record<string, number>;
  riskAssessment?: string;
}

export interface ScoringSection {
  title: string;
  scores: {
    category: string;
    score: number;
    maxScore: number;
    description: string;
  }[];
  overallScore: number;
  overallMaxScore: number;
}

export interface AnalysisReport {
  id?: number;
  userId?: string;
  portfolioOverview: AnalysisSection;
  riskAnalysis: AnalysisSection;
  taxEfficiency: AnalysisSection;
  diversification: AnalysisSection;
  assetAllocation: AllocationSection;
  recommendations: AnalysisSection;
  emergencyFund: AnalysisSection;
  scoring: ScoringSection;
  generatedAt: string;
  // Additional fields needed by PortfolioAnalysisResult
  performanceMetrics: {
    totalValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    cagr: number;
    irr: number;
    sharpeRatio?: number;
  };
  sectorBreakdown: Array<{sector: string; totalValue: number}>;
  insights: Array<PortfolioInsight>;
  riskMetrics: {
    volatility: {
      portfolioBeta: number;
      marketComparison: string;
    };
    qualityScore: {
      overall: number;
    };
  };
  taxInsights: {
    potentialSavings: number;
    suggestions: string[];
  };
  timestamp?: string;
}

// Define types needed by the PortfolioAnalysisResult component
export interface PortfolioInsight {
  type: 'strength' | 'warning' | 'suggestion' | 'tax' | 'goal' | 'volatility';
  title: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
  actionable?: boolean;
}

export interface AssetAllocationItem {
  type: string;
  percentage: number;
}

// Define types for RPC function responses
interface SaveAnalysisResponse {
  success?: boolean;
  error?: string;
}

interface GetLatestAnalysisResponse {
  id?: number;
  analysis_data?: AnalysisReport;
  generated_at?: string;
}

interface GetAllAnalysesResponse {
  id?: number;
  analysis_data?: AnalysisReport;
  generated_at?: string;
}

// Create a service for portfolio analysis
const AnalysisService = {
  generateAnalysis: async (portfolioData: PortfolioData): Promise<AnalysisReport> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        throw new Error("User not authenticated");
      }

      toast.info("Analyzing your portfolio... This may take a moment.", {
        duration: 3000,
      });

      // Call the Supabase Edge Function to analyze the portfolio
      const { data, error } = await supabase.functions.invoke('portfolio-analysis', {
        body: { portfolioData }
      });

      if (error) {
        console.error("Analysis function error:", error);
        throw new Error(`Failed to generate analysis: ${error.message}`);
      }

      if (!data || !data.analysis) {
        throw new Error("No analysis data returned");
      }

      // Parse analysis response
      const analysis = data.analysis as AnalysisReport;
      
      // Add generation timestamp if not present
      if (!analysis.generatedAt) {
        analysis.generatedAt = new Date().toISOString();
      }
      
      // Save the analysis to Supabase
      await AnalysisService.saveAnalysis(analysis);

      return analysis;
    } catch (error: any) {
      console.error("Error analyzing portfolio:", error);
      throw error;
    }
  },
  
  saveAnalysis: async (analysis: AnalysisReport): Promise<void> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        console.error("Cannot save analysis: User not authenticated");
        return;
      }

      // Use properly typed parameters for the RPC function
      const { error } = await supabase.rpc('save_portfolio_analysis', {
        analysis_data: analysis,
        user_id_input: user.id,
        generated_at_input: analysis.generatedAt
      });

      if (error) {
        console.error("Error saving analysis:", error);
        throw error;
      }

      console.log("Analysis saved successfully");
    } catch (error) {
      console.error("Error saving analysis:", error);
    }
  },
  
  getLatestAnalysis: async (): Promise<AnalysisReport | null> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        console.log("Cannot get analysis: User not authenticated");
        return null;
      }

      // Use the correct typing for the RPC function call
      const { data, error } = await supabase.rpc('get_latest_portfolio_analysis', {
        user_id_input: user.id
      });

      if (error) {
        console.error("Error fetching latest analysis:", error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Handle the response structure correctly
      return data.analysis_data as AnalysisReport;
    } catch (error) {
      console.error("Error in getLatestAnalysis:", error);
      return null;
    }
  },
  
  getAllAnalyses: async (): Promise<AnalysisReport[]> => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        console.log("Cannot get analyses: User not authenticated");
        return [];
      }

      // Use the correct typing for the RPC function call
      const { data, error } = await supabase.rpc('get_all_portfolio_analyses', {
        user_id_input: user.id
      });

      if (error) {
        console.error("Error fetching analyses:", error);
        return [];
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
      }

      // Return the analyses with proper typing
      return data.map(item => item.analysis_data as AnalysisReport);
    } catch (error) {
      console.error("Error in getAllAnalyses:", error);
      return [];
    }
  }
};

export default AnalysisService;
