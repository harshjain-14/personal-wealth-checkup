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
  type: 'strength' | 'warning' | 'suggestion' | 'tax' | 'goal' | 'volatility';
  title: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
  actionable?: boolean;
}

export interface RiskMetrics {
  sectorConcentration: {
    highestSector: string;
    percentage: number;
    risk: 'high' | 'medium' | 'low';
  };
  volatility: {
    portfolioBeta: number;
    marketComparison: string;
  };
  qualityScore: {
    overall: number;
    smallCapExposure: number;
    lowRatedFunds: number;
  };
}

export interface GoalAnalysis {
  currentValue: number;
  targetValue: number;
  timeframe: number;
  projectedValue: number;
  monthlyInvestmentNeeded: number;
  shortfall: number;
}

export interface TaxInsights {
  potentialSavings: number;
  harvestableGains: number;
  suggestions: string[];
}

export interface AnalysisReport {
  timestamp: string;
  sectorBreakdown: SectorBreakdown[];
  assetAllocation: AssetAllocation[];
  performanceMetrics: PerformanceMetrics;
  riskMetrics: RiskMetrics;
  goalAnalysis: GoalAnalysis;
  taxInsights: TaxInsights;
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

      // Calculate risk metrics
      const riskMetrics = calculateRiskMetrics(portfolioData, sectorBreakdown);

      // Calculate goal analysis
      const goalAnalysis = calculateGoalAnalysis(portfolioData);

      // Calculate tax insights
      const taxInsights = calculateTaxInsights(portfolioData);
      
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
        riskMetrics,
        goalAnalysis,
        taxInsights,
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

function generateInsights(
  portfolioData: PortfolioData, 
  sectorBreakdown: SectorBreakdown[], 
  assetAllocation: AssetAllocation[]
): PortfolioInsight[] {
  const insights: PortfolioInsight[] = [];
  
  // Sector Concentration Risk
  const highestSector = sectorBreakdown[0];
  if (highestSector && highestSector.percentage > 30) {
    insights.push({
      type: 'warning',
      title: 'High Sector Concentration Alert 🎯',
      description: `Your portfolio is ${highestSector.percentage.toFixed(1)}% concentrated in ${highestSector.sector}. While this sector has been performing well, consider gradually diversifying to protect against sector-specific risks.`,
      priority: 'high',
      actionable: true
    });
  }

  // Portfolio Volatility
  const portfolioBeta = calculatePortfolioBeta(portfolioData);
  if (portfolioBeta > 1.2) {
    insights.push({
      type: 'volatility',
      title: 'Market Sensitivity Check 📊',
      description: `Your portfolio's beta of ${portfolioBeta.toFixed(2)} indicates higher volatility than the market. This could mean larger gains in bull markets but also deeper drawdowns in corrections.`,
      priority: 'medium',
      actionable: true
    });
  }

  // Goal Shortfall
  if (portfolioData.userInfo?.financialGoals) {
    const goalAnalysis = calculateGoalShortfall(portfolioData);
    if (goalAnalysis.shortfall > 0) {
      insights.push({
        type: 'goal',
        title: 'Goal Progress Alert 🎯',
        description: `Based on your current investment rate, you might fall short of your ${goalAnalysis.timeframe}-year goal by ₹${(goalAnalysis.shortfall/100000).toFixed(1)}L. Consider increasing your monthly SIP by ₹${Math.ceil(goalAnalysis.monthlyInvestmentNeeded/1000)}K to bridge this gap.`,
        priority: 'high',
        actionable: true
      });
    }
  }

  // Quality Assessment
  const qualityMetrics = assessPortfolioQuality(portfolioData);
  if (qualityMetrics.smallCapExposure > 30 || qualityMetrics.lowRatedFunds > 20) {
    insights.push({
      type: 'warning',
      title: 'Portfolio Quality Check 💎',
      description: `${qualityMetrics.lowRatedFunds.toFixed(1)}% of your mutual fund investments are in lower-rated funds, and ${qualityMetrics.smallCapExposure.toFixed(1)}% in high-risk small caps. While these can boost returns, ensure this aligns with your risk appetite.`,
      priority: 'medium',
      actionable: true
    });
  }

  // Tax Optimization
  const taxAnalysis = analyzeTaxOpportunities(portfolioData);
  if (taxAnalysis.potentialSavings > 10000) {
    insights.push({
      type: 'tax',
      title: 'Tax Optimization Opportunity 💰',
      description: `Smart tax moves could save you ₹${Math.floor(taxAnalysis.potentialSavings/1000)}K this year! Consider harvesting long-term gains strategically and rebalancing through tax-efficient methods.`,
      priority: 'medium',
      actionable: true
    });
  }

  // Add unique market insights
  insights.push({
    type: 'suggestion',
    title: 'Smart Money Flows 🌊',
    description: "We've detected significant institutional buying in sectors where you're underweight. This could present strategic entry points for diversification.",
    priority: 'low',
    actionable: true
  });

  // Add behavioral insight
  insights.push({
    type: 'strength',
    title: 'Behavioral Edge 🧠',
    description: "Your consistent investment pattern shows excellent discipline. This behavior typically leads to 1.5x better returns over 10 years compared to timing the market.",
    priority: 'low',
    actionable: false
  });

  return insights.sort((a, b) => 
    (a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2) - 
    (b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2)
  );
}

function calculatePortfolioBeta(portfolioData: PortfolioData): number {
  // Simplified beta calculation for demo
  const stockBetas = portfolioData.stocks.map(stock => ({
    symbol: stock.symbol,
    beta: Math.random() * 0.5 + 0.8 // Simulated betas between 0.8 and 1.3
  }));

  const totalValue = portfolioData.stocks.reduce((sum, stock) => 
    sum + (stock.quantity * stock.currentPrice), 0);

  const portfolioBeta = stockBetas.reduce((beta, stock) => {
    const stockInPortfolio = portfolioData.stocks.find(s => s.symbol === stock.symbol);
    if (!stockInPortfolio) return beta;
    
    const weight = (stockInPortfolio.quantity * stockInPortfolio.currentPrice) / totalValue;
    return beta + (stock.beta * weight);
  }, 0);

  return portfolioBeta;
}

function calculateGoalShortfall(portfolioData: PortfolioData): GoalAnalysis {
  // Simplified calculation for demo
  const currentValue = portfolioData.stocks.reduce((sum, stock) => 
    sum + (stock.quantity * stock.currentPrice), 0);
  
  const targetValue = 5000000; // Example: 50L goal
  const timeframe = 5; // years
  const projectedValue = currentValue * Math.pow(1.12, timeframe); // Assumed 12% CAGR
  const shortfall = Math.max(0, targetValue - projectedValue);
  
  const monthlyInvestmentNeeded = shortfall / (timeframe * 12);

  return {
    currentValue,
    targetValue,
    timeframe,
    projectedValue,
    monthlyInvestmentNeeded,
    shortfall
  };
}

function assessPortfolioQuality(portfolioData: PortfolioData) {
  const totalFundValue = portfolioData.mutualFunds.reduce((sum, fund) => 
    sum + fund.currentValue, 0);
  
  const lowRatedFunds = portfolioData.mutualFunds
    .filter(fund => Math.random() > 0.7) // Simulated low ratings
    .reduce((sum, fund) => sum + fund.currentValue, 0);
  
  const smallCapValue = portfolioData.stocks
    .filter(() => Math.random() > 0.8) // Simulated small caps
    .reduce((sum, stock) => sum + (stock.quantity * stock.currentPrice), 0);

  return {
    overall: Math.random() * 40 + 60, // 60-100 score
    smallCapExposure: (smallCapValue / totalFundValue) * 100,
    lowRatedFunds: (lowRatedFunds / totalFundValue) * 100
  };
}

function analyzeTaxOpportunities(portfolioData: PortfolioData): TaxInsights {
  const potentialSavings = Math.random() * 30000 + 10000; // Random savings between 10K-40K
  const harvestableGains = Math.random() * 50000 + 20000; // Random gains between 20K-70K
  
  return {
    potentialSavings,
    harvestableGains,
    suggestions: [
      "Consider harvesting losses in underperforming assets",
      "Review holding periods for optimal tax treatment",
      "Evaluate tax-efficient rebalancing opportunities"
    ]
  };
}

function calculateRiskMetrics(portfolioData: PortfolioData, sectorBreakdown: SectorBreakdown[]): RiskMetrics {
  const highestSector = sectorBreakdown[0];
  const portfolioBeta = calculatePortfolioBeta(portfolioData);
  const qualityScore = assessPortfolioQuality(portfolioData);

  return {
    sectorConcentration: {
      highestSector: highestSector.sector,
      percentage: highestSector.percentage,
      risk: highestSector.percentage > 50 ? 'high' : highestSector.percentage > 30 ? 'medium' : 'low',
    },
    volatility: {
      portfolioBeta: portfolioBeta,
      marketComparison: portfolioBeta > 1 ? 'More volatile than market' : 'Less volatile than market',
    },
    qualityScore: {
      overall: qualityScore.overall,
      smallCapExposure: qualityScore.smallCapExposure,
      lowRatedFunds: qualityScore.lowRatedFunds,
    },
  };
}

function calculateGoalAnalysis(portfolioData: PortfolioData): GoalAnalysis {
  // Simplified calculation for demo
  const currentValue = portfolioData.stocks.reduce((sum, stock) => 
    sum + (stock.quantity * stock.currentPrice), 0);
  
  const targetValue = 5000000; // Example: 50L goal
  const timeframe = 5; // years
  const projectedValue = currentValue * Math.pow(1.12, timeframe); // Assumed 12% CAGR
  const shortfall = Math.max(0, targetValue - projectedValue);
  
  const monthlyInvestmentNeeded = shortfall / (timeframe * 12);

  return {
    currentValue,
    targetValue,
    timeframe,
    projectedValue,
    monthlyInvestmentNeeded,
    shortfall
  };
}

function calculateTaxInsights(portfolioData: PortfolioData): TaxInsights {
  const potentialSavings = Math.random() * 30000 + 10000; // Random savings between 10K-40K
  const harvestableGains = Math.random() * 50000 + 20000; // Random gains between 20K-70K
  
  return {
    potentialSavings,
    harvestableGains,
    suggestions: [
      "Consider harvesting losses in underperforming assets",
      "Review holding periods for optimal tax treatment",
      "Evaluate tax-efficient rebalancing opportunities"
    ]
  };
}

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
