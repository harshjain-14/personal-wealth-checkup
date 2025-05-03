
// Edge Function for Portfolio Analysis using Claude

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PortfolioData = {
  stocks: any[];
  mutualFunds: any[];
  externalInvestments: any[];
  expenses: any[];
  futureExpenses: any[];
  userInfo?: any;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { portfolioData } = await req.json() as { portfolioData: PortfolioData };
    console.log("Received portfolio data for analysis");

    if (!portfolioData) {
      return new Response(
        JSON.stringify({ error: 'Portfolio data is required' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 400 }
      );
    }

    // Get the Claude API key from environment variables
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({ error: 'Claude API key not configured' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 500 }
      );
    }

    // Mock the analysis response structure while we fix the Claude API integration
    const mockAnalysisResponse = generateMockAnalysis(portfolioData);
    
    // In production mode, we would use Claude API:
    // console.log("Sending request to Claude API...");
    // const analysisResponse = await getClaudeAnalysis(claudeApiKey, portfolioData);

    return new Response(
      JSON.stringify({ 
        analysis: mockAnalysisResponse,
        success: true 
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error(`Error processing analysis request: ${error.message}`);
    return new Response(
      JSON.stringify({ error: `Failed to analyze portfolio: ${error.message}` }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 500 }
    );
  }
});

async function getClaudeAnalysis(apiKey: string, portfolioData: PortfolioData) {
  try {
    // This is where we would send the data to Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `Analyze this portfolio data and provide a detailed financial analysis report:
            ${JSON.stringify(portfolioData, null, 2)}
            
            Format the response as a valid JSON with the following structure:
            {
              "portfolioOverview": {
                "title": "Portfolio Overview",
                "content": ["Summary point 1", "Summary point 2"],
                "recommendations": ["Recommendation 1", "Recommendation 2"]
              },
              "riskAnalysis": { ... similar structure ... },
              "taxEfficiency": { ... similar structure ... },
              "diversification": { ... similar structure ... },
              "assetAllocation": {
                "title": "Asset Allocation Analysis",
                "currentAllocation": {"Stocks": 40, "Bonds": 30, "Cash": 10, "Real Estate": 20},
                "recommendedAllocation": {"Stocks": 50, "Bonds": 25, "Cash": 5, "Real Estate": 20},
                "riskAssessment": "Your portfolio has a moderate risk profile..."
              },
              "recommendations": {
                "title": "Key Recommendations",
                "content": ["Recommendation 1", "Recommendation 2"]
              },
              "emergencyFund": {
                "title": "Emergency Fund Assessment",
                "content": ["Your emergency fund covers X months of expenses..."]
              },
              "scoring": {
                "title": "Portfolio Health Score",
                "scores": [
                  {"category": "Diversification", "score": 8, "maxScore": 10, "description": "Well diversified across asset classes"},
                  {"category": "Risk Management", "score": 7, "maxScore": 10, "description": "Good risk management but..."}
                ],
                "overallScore": 75,
                "overallMaxScore": 100
              },
              "performanceMetrics": {
                "totalValue": 1000000,
                "profitLoss": 50000,
                "profitLossPercentage": 5.0,
                "cagr": 12.5,
                "irr": 11.8,
                "sharpeRatio": 1.2
              },
              "sectorBreakdown": [
                {"sector": "Technology", "totalValue": 250000},
                {"sector": "Financial", "totalValue": 150000},
                {"sector": "Healthcare", "totalValue": 100000}
              ],
              "insights": [
                {
                  "type": "strength",
                  "title": "Strong Diversification",
                  "description": "Your portfolio is well-diversified across different asset classes, which helps reduce risk.",
                  "priority": "medium",
                  "actionable": false
                },
                {
                  "type": "warning",
                  "title": "Overexposure to Technology",
                  "description": "Your portfolio has 35% allocation to technology stocks, which may increase volatility.",
                  "priority": "high",
                  "actionable": true
                }
              ],
              "riskMetrics": {
                "volatility": {
                  "portfolioBeta": 1.2,
                  "marketComparison": "Your portfolio is 20% more volatile than the market"
                },
                "qualityScore": {
                  "overall": 72
                }
              },
              "taxInsights": {
                "potentialSavings": 15000,
                "suggestions": [
                  "Consider tax-loss harvesting by selling underperforming assets",
                  "Maximize tax-advantaged accounts like PPF and NPS"
                ]
              }
            }`
          }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error("Claude API error:", JSON.stringify(errorDetails));
      throw new Error(`Failed to get analysis from Claude API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    // Extract the JSON content from Claude's response
    const analysisText = data.content[0].text; 
    
    try {
      // Extract the JSON portion from Claude's response
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisText.match(/```\n([\s\S]*?)\n```/) ||
                       analysisText.match(/{[\s\S]*}/);
      
      const jsonContent = jsonMatch ? jsonMatch[0] : analysisText;
      // Clean up the content to make sure it's valid JSON
      const cleanJson = jsonContent
        .replace(/```json\n|```\n|```/g, '')
        .trim();
        
      return JSON.parse(cleanJson);
    } catch (jsonError) {
      console.error("Failed to parse Claude response as JSON:", jsonError);
      throw new Error("Failed to parse analysis results as JSON");
    }
  } catch (error) {
    console.error('Error getting analysis from Claude:', error);
    throw error;
  }
}

// Function to generate mock analysis data for testing
function generateMockAnalysis(portfolioData: PortfolioData) {
  // Calculate some basic metrics from the portfolio data
  const stocksValue = portfolioData.stocks.reduce((sum, stock) => sum + (stock.quantity * stock.currentPrice), 0);
  const mfValue = portfolioData.mutualFunds.reduce((sum, mf) => sum + mf.currentValue, 0);
  const externalValue = portfolioData.externalInvestments.reduce((sum, ext) => sum + ext.amount, 0);
  const totalValue = stocksValue + mfValue + externalValue;
  const stocksPercent = totalValue > 0 ? (stocksValue / totalValue) * 100 : 0;
  const mfPercent = totalValue > 0 ? (mfValue / totalValue) * 100 : 0;
  const externalPercent = totalValue > 0 ? (externalValue / totalValue) * 100 : 0;
  
  // Example profit calculation (just for demonstration)
  const costBasis = portfolioData.stocks.reduce((sum, stock) => sum + (stock.quantity * stock.averagePrice), 0) + 
    portfolioData.mutualFunds.reduce((sum, mf) => sum + mf.investedAmount, 0);
  const marketValue = stocksValue + mfValue;
  const profitLoss = marketValue - costBasis;
  const profitLossPercentage = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
  
  // Get risk tolerance from user info
  const riskTolerance = portfolioData.userInfo?.riskTolerance || 'moderate';
  const age = portfolioData.userInfo?.age || 35;
  
  // Build sector breakdown
  const sectorBreakdown = [];
  const sectorMap = new Map();
  
  portfolioData.stocks.forEach(stock => {
    if (!sectorMap.has(stock.sector)) {
      sectorMap.set(stock.sector, 0);
    }
    sectorMap.set(stock.sector, sectorMap.get(stock.sector) + (stock.quantity * stock.currentPrice));
  });
  
  sectorMap.forEach((value, sector) => {
    sectorBreakdown.push({ sector, totalValue: value });
  });
  
  // Add mock sector for mutual funds if they exist
  if (portfolioData.mutualFunds.length > 0) {
    sectorBreakdown.push({ sector: "Mutual Funds", totalValue: mfValue });
  }
  
  return {
    portfolioOverview: {
      title: "Portfolio Overview",
      content: [
        `Your portfolio is worth ₹${totalValue.toLocaleString('en-IN')}.`,
        `It consists of ${portfolioData.stocks.length} stocks, ${portfolioData.mutualFunds.length} mutual funds, and ${portfolioData.externalInvestments.length} other investments.`,
        `Overall, your portfolio has a ${riskTolerance} risk profile.`
      ],
      recommendations: [
        "Consider increasing your equity allocation for better long-term returns.",
        "Rebalance your portfolio quarterly to maintain your target allocation."
      ]
    },
    riskAnalysis: {
      title: "Risk Analysis",
      content: [
        `Based on your ${riskTolerance} risk tolerance, your current asset allocation appears ${riskTolerance === 'aggressive' ? 'appropriate' : 'somewhat conservative'}.`,
        `At age ${age}, you can generally afford to take ${age < 40 ? 'more' : 'moderate'} investment risk for better long-term returns.`
      ],
      recommendations: [
        `Consider ${riskTolerance === 'conservative' ? 'gradually increasing equity exposure' : 'maintaining your current risk level'}.`,
        "Diversify internationally to reduce country-specific risk."
      ]
    },
    taxEfficiency: {
      title: "Tax Efficiency Analysis",
      content: [
        "Your portfolio has room for improvement in tax efficiency.",
        "Consider moving high-yield investments to tax-advantaged accounts."
      ],
      recommendations: [
        "Maximize contributions to tax-advantaged accounts like EPF and PPF.",
        "Consider tax-loss harvesting for your equity investments."
      ]
    },
    diversification: {
      title: "Diversification Analysis",
      content: [
        `Your portfolio is ${portfolioData.stocks.length > 10 ? 'reasonably' : 'inadequately'} diversified across individual stocks.`,
        `You have exposure to ${sectorMap.size} different sectors, which is ${sectorMap.size > 5 ? 'good' : 'limited'}.`
      ],
      recommendations: [
        "Add exposure to international equities for geographical diversification.",
        "Consider adding index funds to broaden your market exposure."
      ]
    },
    assetAllocation: {
      title: "Asset Allocation Analysis",
      currentAllocation: {
        "Stocks": stocksPercent,
        "Mutual Funds": mfPercent,
        "Other Investments": externalPercent
      },
      recommendedAllocation: {
        "Stocks": 50,
        "Mutual Funds": 30,
        "Bonds": 10,
        "Cash": 5,
        "Other Investments": 5
      },
      riskAssessment: `Your current asset allocation has a ${riskTolerance} risk profile, which ${riskTolerance === 'moderate' ? 'aligns with' : 'differs from'} your stated risk tolerance.`
    },
    recommendations: {
      title: "Key Recommendations",
      content: [
        "Increase diversification across asset classes and geographies.",
        "Consider adding more equity exposure for long-term growth.",
        "Optimize tax efficiency by utilizing tax-advantaged accounts.",
        "Set up an automatic rebalancing schedule to maintain target allocations.",
        "Review and adjust insurance coverage to protect your financial assets."
      ]
    },
    emergencyFund: {
      title: "Emergency Fund Assessment",
      content: [
        `Based on your monthly expenses of approximately ₹${(portfolioData.expenses.reduce((sum, exp) => sum + exp.amount, 0)).toLocaleString('en-IN')}, you should aim for an emergency fund of ₹${(portfolioData.expenses.reduce((sum, exp) => sum + exp.amount, 0) * 6).toLocaleString('en-IN')}.`,
        "Keep your emergency fund in high-yield savings accounts or liquid funds for easy access."
      ]
    },
    scoring: {
      title: "Portfolio Health Score",
      scores: [
        {category: "Diversification", score: portfolioData.stocks.length > 10 ? 8 : 5, maxScore: 10, description: `${portfolioData.stocks.length > 10 ? 'Well' : 'Inadequately'} diversified across individual securities.`},
        {category: "Risk Management", score: 7, maxScore: 10, description: "Good risk management but could be improved with better asset allocation."},
        {category: "Return Potential", score: riskTolerance === 'aggressive' ? 8 : 6, maxScore: 10, description: `${riskTolerance === 'aggressive' ? 'Strong' : 'Moderate'} potential for long-term returns.`},
        {category: "Tax Efficiency", score: 5, maxScore: 10, description: "Room for improvement in tax planning and optimization."},
        {category: "Cost Efficiency", score: 7, maxScore: 10, description: "Generally cost-efficient but review fund expense ratios."}
      ],
      overallScore: 65,
      overallMaxScore: 100
    },
    generatedAt: new Date().toISOString(),
    performanceMetrics: {
      totalValue: totalValue,
      profitLoss: profitLoss,
      profitLossPercentage: profitLossPercentage,
      cagr: 9.5,  // Mock value
      irr: 8.7,   // Mock value
      sharpeRatio: 0.95 // Mock value
    },
    sectorBreakdown: sectorBreakdown,
    insights: [
      {
        type: "strength",
        title: "Strong Growth Potential",
        description: "Your portfolio has good exposure to growth sectors like technology.",
        priority: "medium",
        actionable: false
      },
      {
        type: "warning",
        title: riskTolerance === 'conservative' ? "Low Equity Allocation" : "High Sector Concentration",
        description: riskTolerance === 'conservative' ? "Your conservative allocation may limit long-term returns." : "Your portfolio may be too concentrated in a few sectors.",
        priority: "high",
        actionable: true
      },
      {
        type: "suggestion",
        title: "Consider Index Funds",
        description: "Adding low-cost index funds could improve diversification and returns.",
        priority: "medium",
        actionable: true
      },
      {
        type: "tax",
        title: "Tax Optimization Opportunity",
        description: "You could save on taxes by reorganizing some investments.",
        priority: "medium",
        actionable: true
      },
      {
        type: "goal",
        title: "Retirement Planning",
        description: `Based on your age (${age}), you should review your retirement savings strategy.`,
        priority: "high",
        actionable: true
      }
    ],
    riskMetrics: {
      volatility: {
        portfolioBeta: riskTolerance === 'aggressive' ? 1.2 : (riskTolerance === 'moderate' ? 0.9 : 0.7),
        marketComparison: riskTolerance === 'aggressive' ? 
          "Your portfolio is more volatile than the market, which aligns with your aggressive risk profile." :
          "Your portfolio is less volatile than the market, providing more stability."
      },
      qualityScore: {
        overall: riskTolerance === 'aggressive' ? 68 : (riskTolerance === 'moderate' ? 75 : 82)
      }
    },
    taxInsights: {
      potentialSavings: 25000,
      suggestions: [
        "Consider tax-loss harvesting by selling underperforming assets",
        "Maximize tax-advantaged accounts like PPF and NPS",
        "Review your equity holding period to qualify for long-term capital gains benefits"
      ]
    }
  };
}
