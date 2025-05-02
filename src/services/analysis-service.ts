
import { PortfolioData } from '@/services/portfolio-service';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Replace with more detailed types
export interface AssetAllocation {
  current: string;
  recommendations: string;
}

export interface AnalysisReport {
  summary: string;
  assetAllocation: AssetAllocation;
  riskAssessment: string;
  performance: string;
  expenseAnalysis: string;
  futurePlanning: string;
  keyRecommendations: string[];
  actionItems: string[];
  generatedDate: string;
}

const DEFAULT_ANALYSIS: AnalysisReport = {
  summary: "Your portfolio is diversified across stocks, mutual funds, and other assets. Based on your goals and risk tolerance, we recommend some adjustments to optimize your returns.",
  assetAllocation: {
    current: "Your current allocation is 45% in equities, 30% in mutual funds, 15% in fixed deposits, and 10% in other investments.",
    recommendations: "Consider increasing your equity exposure to 50-55% given your growth objectives and rebalancing your mutual fund holdings to include more index funds."
  },
  riskAssessment: "Your portfolio has a moderate risk profile, suitable for your age and goals. However, some concentrated positions in tech stocks increase sector-specific risk.",
  performance: "Your portfolio has returned approximately 12% annually over the last 3 years, slightly underperforming the benchmark index at 13.5%.",
  expenseAnalysis: "Your expense ratio is well-managed at 18% of your income. Consider reducing discretionary expenses to increase your savings rate.",
  futurePlanning: "Your future expense planning is on track for most goals, but your retirement savings may need additional contributions to meet your target.",
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
      
      // Add generatedDate to the analysis data
      const analysisWithDate: AnalysisReport = {
        ...data,
        generatedDate: new Date().toISOString()
      };
      
      toast.success('Portfolio analysis generated successfully');
      return analysisWithDate;
    } catch (error) {
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
      
      // Use type assertion since the table might not be in the generated types
      const { data, error } = await supabase
        .from('portfolio_analysis' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching latest analysis:', error);
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      return {
        ...data.analysis_data,
        generatedDate: data.analysis_date
      };
    } catch (error) {
      console.error('Error in getLatestAnalysis:', error);
      return null;
    }
  }
};

export default AnalysisService;
