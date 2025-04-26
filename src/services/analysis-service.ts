// Analysis service to generate portfolio insights

import { toast } from "sonner";
import { PortfolioData } from "./portfolio-service";

// Types
export interface SectorBreakdown {
  sector: string;
  percentage: number;
  totalValue: number;
}

export interface AssetAllocation {
  type: string;
  percentage: number;
  totalValue: number;
}

export interface PerformanceMetrics {
  cagr?: number;
  irr?: number;
  sharpeRatio?: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface PortfolioInsight {
  type: 'strength' | 'warning' | 'suggestion';
  title: string;
  description: string;
}

export interface AnalysisReport {
  timestamp: string;
  sectorBreakdown: SectorBreakdown[];
  assetAllocation: AssetAllocation[];
  performanceMetrics: PerformanceMetrics;
  insights: PortfolioInsight[];
  liquidityAnalysis?: string;
  rebalancingRecommendations?: string[];
  projections?: {
    updatedCAGR: number;
    liquidityBuffer: number;
  };
}

const AnalysisService = {
  // Generate portfolio analysis
  generateAnalysis: async (portfolioData: PortfolioData): Promise<AnalysisReport> => {
    // Simulate API call delay to mimic AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Calculate sector breakdown
      const sectorBreakdown = calculateSectorBreakdown(portfolioData);
      
      // Calculate asset allocation
      const assetAllocation = calculateAssetAllocation(portfolioData);
      
      // Calculate performance metrics
      const performanceMetrics = calculatePerformanceMetrics(portfolioData);
      
      // Generate insights
      const insights = generateInsights(portfolioData, sectorBreakdown, assetAllocation);
      
      // Generate liquidity analysis
      const liquidityAnalysis = generateLiquidityAnalysis(portfolioData);
      
      // Generate rebalancing recommendations
      const rebalancingRecommendations = generateRebalancingRecommendations(sectorBreakdown, assetAllocation);
      
      // Generate projections
      const projections = {
        updatedCAGR: (performanceMetrics.cagr || 0) + 0.02, // Optimistic projection after rebalancing
        liquidityBuffer: calculateLiquidityBuffer(portfolioData),
      };
      
      const report: AnalysisReport = {
        timestamp: new Date().toISOString(),
        sectorBreakdown,
        assetAllocation,
        performanceMetrics,
        insights,
        liquidityAnalysis,
        rebalancingRecommendations,
        projections,
      };
      
      // Save report to history
      saveReportToHistory(report);
      
      return report;
    } catch (error) {
      console.error("Error generating analysis:", error);
      toast.error("Failed to generate portfolio analysis");
      throw error;
    }
  },
  
  // Get analysis history
  getAnalysisHistory: (): AnalysisReport[] => {
    try {
      const history = localStorage.getItem("analysis_history");
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error("Error loading analysis history:", error);
      return [];
    }
  },
  
  // Clear analysis history
  clearAnalysisHistory: () => {
    localStorage.removeItem("analysis_history");
  }
};

// Helper functions
function calculateSectorBreakdown(portfolioData: PortfolioData): SectorBreakdown[] {
  const { stocks } = portfolioData;
  const sectorMap = new Map<string, { value: number }>();
  let totalValue = 0;
  
  // Calculate value for each stock and aggregate by sector
  stocks.forEach(stock => {
    const value = stock.quantity * stock.currentPrice;
    totalValue += value;
    
    if (sectorMap.has(stock.sector)) {
      const sectorData = sectorMap.get(stock.sector)!;
      sectorData.value += value;
    } else {
      sectorMap.set(stock.sector, { value });
    }
  });
  
  // Convert map to array and calculate percentages
  const result: SectorBreakdown[] = Array.from(sectorMap.entries()).map(([sector, data]) => ({
    sector,
    totalValue: data.value,
    percentage: (data.value / totalValue) * 100,
  }));
  
  return result.sort((a, b) => b.percentage - a.percentage);
}

function calculateAssetAllocation(portfolioData: PortfolioData): AssetAllocation[] {
  const { stocks, mutualFunds, externalInvestments } = portfolioData;
  
  // Calculate total value of stocks
  const stocksValue = stocks.reduce((total, stock) => total + (stock.quantity * stock.currentPrice), 0);
  
  // Calculate total value of mutual funds
  const mutualFundsValue = mutualFunds.reduce((total, fund) => total + fund.currentValue, 0);
  
  // Calculate total value of external investments
  const externalValue = externalInvestments.reduce((total, investment) => total + investment.amount, 0);
  
  // Calculate total portfolio value
  const totalValue = stocksValue + mutualFundsValue + externalValue;
  
  // Create asset allocation array
  const assetAllocation: AssetAllocation[] = [
    {
      type: 'Stocks',
      totalValue: stocksValue,
      percentage: (stocksValue / totalValue) * 100,
    },
    {
      type: 'Mutual Funds',
      totalValue: mutualFundsValue,
      percentage: (mutualFundsValue / totalValue) * 100,
    }
  ];
  
  // Add external investments by type
  const externalByType = new Map<string, number>();
  externalInvestments.forEach(investment => {
    const currentValue = externalByType.get(investment.type) || 0;
    externalByType.set(investment.type, currentValue + investment.amount);
  });
  
  externalByType.forEach((value, type) => {
    assetAllocation.push({
      type,
      totalValue: value,
      percentage: (value / totalValue) * 100,
    });
  });
  
  return assetAllocation.sort((a, b) => b.percentage - a.percentage);
}

function calculatePerformanceMetrics(portfolioData: PortfolioData): PerformanceMetrics {
  const { stocks, mutualFunds } = portfolioData;
  
  // Calculate total invested value
  const investedInStocks = stocks.reduce((total, stock) => total + (stock.quantity * stock.averagePrice), 0);
  const investedInFunds = mutualFunds.reduce((total, fund) => total + fund.investedAmount, 0);
  const totalInvested = investedInStocks + investedInFunds;
  
  // Calculate current value
  const stocksValue = stocks.reduce((total, stock) => total + (stock.quantity * stock.currentPrice), 0);
  const fundsValue = mutualFunds.reduce((total, fund) => total + fund.currentValue, 0);
  const totalValue = stocksValue + fundsValue;
  
  // Calculate profit/loss
  const profitLoss = totalValue - totalInvested;
  const profitLossPercentage = (profitLoss / totalInvested) * 100;
  
  // Calculate CAGR (mock value since we don't have time periods)
  // In a real implementation, this would use actual investment dates
  const cagr = profitLossPercentage > 0 ? 12 + Math.random() * 5 : 8 + Math.random() * 4;
  
  // Mock IRR (in a real implementation, this would use cash flow dates)
  const irr = cagr - (1 + Math.random() * 3);
  
  // Mock Sharpe ratio
  const sharpeRatio = 0.8 + Math.random() * 0.8;
  
  return {
    cagr,
    irr,
    sharpeRatio,
    totalValue,
    profitLoss,
    profitLossPercentage,
  };
}

function generateInsights(
  portfolioData: PortfolioData, 
  sectorBreakdown: SectorBreakdown[], 
  assetAllocation: AssetAllocation[]
): PortfolioInsight[] {
  const insights: PortfolioInsight[] = [];
  
  // Check sector concentration
  const highestSector = sectorBreakdown[0];
  if (highestSector && highestSector.percentage > 30) {
    insights.push({
      type: 'warning',
      title: 'High Sector Concentration',
      description: `Your portfolio has ${highestSector.percentage.toFixed(1)}% exposure to the ${highestSector.sector} sector. Consider diversifying to reduce sector-specific risk.`
    });
  }
  
  // Check asset diversification
  if (assetAllocation.length < 3) {
    insights.push({
      type: 'suggestion',
      title: 'Limited Asset Diversification',
      description: 'Your portfolio could benefit from more asset class diversification. Consider adding different asset classes like bonds or gold for balanced returns.'
    });
  }
  
  // Check equity allocation based on age
  const userAge = portfolioData.userInfo?.age;
  const equityAllocation = assetAllocation.find(asset => asset.type === 'Stocks')?.percentage || 0;
  if (userAge && userAge > 50 && equityAllocation > 60) {
    insights.push({
      type: 'warning',
      title: 'High Equity Allocation for Age',
      description: `Your equity allocation (${equityAllocation.toFixed(1)}%) may be high for your age profile. Consider increasing allocation to more stable assets.`
    });
  } else if (userAge && userAge < 30 && equityAllocation < 50) {
    insights.push({
      type: 'suggestion',
      title: 'Conservative Allocation for Age',
      description: `At your age, you might consider increasing equity allocation (currently ${equityAllocation.toFixed(1)}%) for better long-term growth.`
    });
  }
  
  // Check mutual fund category diversification
  const mutualFundCategories = new Set(portfolioData.mutualFunds.map(fund => fund.category));
  if (mutualFundCategories.size < 2 && portfolioData.mutualFunds.length > 0) {
    insights.push({
      type: 'suggestion',
      title: 'Limited Mutual Fund Diversification',
      description: 'Consider diversifying your mutual fund investments across different categories (large cap, mid cap, small cap, etc.).'
    });
  }
  
  // Add at least one strength
  insights.push({
    type: 'strength',
    title: 'Regular Investments',
    description: 'Your portfolio shows consistent investment patterns, which is excellent for long-term wealth building through rupee-cost averaging.'
  });
  
  return insights;
}

function generateLiquidityAnalysis(portfolioData: PortfolioData): string {
  const { futureExpenses, expenses } = portfolioData;
  const totalMonthlyExpenses = expenses
    .filter(e => e.frequency === 'monthly')
    .reduce((total, expense) => total + expense.amount, 0);
  
  // Sum up upcoming large expenses
  const upcomingExpenses = futureExpenses.reduce((total, expense) => total + expense.amount, 0);
  
  if (upcomingExpenses > 0) {
    // Check if there are imminent high-priority expenses
    const highPriorityExpenses = futureExpenses.filter(e => e.priority === 'high');
    
    if (highPriorityExpenses.length > 0) {
      return `You have significant high-priority expenses coming up totaling ₹${upcomingExpenses.toLocaleString()}. Consider keeping at least 6 months of expenses (₹${(totalMonthlyExpenses * 6).toLocaleString()}) in liquid assets and potentially reducing exposure to volatile investments.`;
    } else {
      return `You have upcoming expenses totaling ₹${upcomingExpenses.toLocaleString()}. Maintain adequate liquidity by having at least 3-6 months of expenses in easily accessible funds.`;
    }
  }
  
  return "Based on your current expense patterns, maintaining 3-6 months of expenses in liquid assets is recommended for financial security.";
}

function generateRebalancingRecommendations(sectorBreakdown: SectorBreakdown[], assetAllocation: AssetAllocation[]): string[] {
  const recommendations: string[] = [];
  
  // Check sector overconcentration
  sectorBreakdown.forEach(sector => {
    if (sector.percentage > 30) {
      recommendations.push(`Consider reducing exposure to the ${sector.sector} sector from ${sector.percentage.toFixed(1)}% to 20-25% of equity portfolio.`);
    }
  });
  
  // Check asset allocation
  const stocksAllocation = assetAllocation.find(asset => asset.type === 'Stocks')?.percentage || 0;
  const mutualFundsAllocation = assetAllocation.find(asset => asset.type === 'Mutual Funds')?.percentage || 0;
  
  if (stocksAllocation > 60) {
    recommendations.push(`Consider reducing direct equity exposure from ${stocksAllocation.toFixed(1)}% to 50-55% and increasing mutual fund or other asset allocations.`);
  }
  
  if (mutualFundsAllocation < 20 && mutualFundsAllocation > 0) {
    recommendations.push(`Consider increasing mutual fund allocation from ${mutualFundsAllocation.toFixed(1)}% to at least 25-30% for better professional diversification.`);
  }
  
  // Add a general recommendation if no specific ones
  if (recommendations.length === 0) {
    recommendations.push("Your current asset allocation appears reasonably balanced. Consider regular rebalancing every 6 months to maintain target allocations.");
  }
  
  return recommendations;
}

function calculateLiquidityBuffer(portfolioData: PortfolioData): number {
  // Calculate monthly expenses
  const monthlyExpenses = portfolioData.expenses
    .filter(e => e.frequency === 'monthly')
    .reduce((total, e) => total + e.amount, 0);
  
  // Convert other frequencies to monthly equivalent
  const otherExpenseMonthly = portfolioData.expenses
    .filter(e => e.frequency !== 'monthly')
    .reduce((total, e) => {
      switch (e.frequency) {
        case 'quarterly': return total + (e.amount / 3);
        case 'yearly': return total + (e.amount / 12);
        case 'one-time': return total;
        default: return total;
      }
    }, 0);
  
  // Total monthly expenses
  const totalMonthlyExpenses = monthlyExpenses + otherExpenseMonthly;
  
  // Calculate upcoming expenses in next 6 months
  const upcomingExpenses = portfolioData.futureExpenses
    .filter(e => e.timeframe.includes('month') || e.timeframe.includes('year') && parseInt(e.timeframe) <= 1)
    .reduce((total, e) => total + e.amount, 0);
  
  // Optimistic liquidity buffer
  return totalMonthlyExpenses * 6 - upcomingExpenses;
}

function saveReportToHistory(report: AnalysisReport) {
  try {
    // Get existing history
    const historyStr = localStorage.getItem("analysis_history");
    const history: AnalysisReport[] = historyStr ? JSON.parse(historyStr) : [];
    
    // Add new report (keep only last 10)
    history.unshift(report);
    if (history.length > 10) {
      history.pop();
    }
    
    // Save updated history
    localStorage.setItem("analysis_history", JSON.stringify(history));
  } catch (error) {
    console.error("Error saving report to history:", error);
  }
}

export default AnalysisService;
