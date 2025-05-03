
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

      // Store the analysis in the database
      const { error } = await supabase
        .from('portfolio_analysis')
        .insert({
          user_id: user.id,
          analysis_data: analysis,
          generated_at: analysis.generatedAt
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

      // Query the latest analysis directly instead of using RPC
      const { data, error } = await supabase
        .from('portfolio_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching latest analysis:", error);
        return null;
      }

      if (!data) {
        return null;
      }

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

      // Get all analyses for the user
      const { data, error } = await supabase
        .from('portfolio_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false });

      if (error) {
        console.error("Error fetching analyses:", error);
        return [];
      }

      if (!data?.length) {
        return [];
      }

      return data.map(item => item.analysis_data as AnalysisReport);
    } catch (error) {
      console.error("Error in getAllAnalyses:", error);
      return [];
    }
  }
};

export default AnalysisService;
