
// Edge function for generating portfolio analysis with Claude API
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") || "";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS preflight handler
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Check for Claude API key
    if (!CLAUDE_API_KEY) {
      console.error("Missing CLAUDE_API_KEY environment variable");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing API key" }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Verify authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const portfolioData = body.portfolioData;
    
    if (!portfolioData) {
      console.error("No portfolio data provided");
      return new Response(
        JSON.stringify({ error: "Portfolio data is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log("Received portfolio data for analysis");
    
    // Prepare data for Claude
    const userInfo = portfolioData.userInfo || {};
    const stocks = portfolioData.stocks || [];
    const mutualFunds = portfolioData.mutualFunds || [];
    const externalInvestments = portfolioData.externalInvestments || [];
    const expenses = portfolioData.expenses || [];
    const futureExpenses = portfolioData.futureExpenses || [];
    const zerodhaHoldings = portfolioData.zerodhaHoldings || [];
    
    // Calculate portfolio metrics
    const totalStocksValue = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.currentPrice), 0);
    const totalMFValue = mutualFunds.reduce((sum, mf) => sum + mf.currentValue, 0);
    const totalExternalValue = externalInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPortfolioValue = totalStocksValue + totalMFValue + totalExternalValue;
    
    const monthlyExpenses = expenses
      .filter(expense => expense.frequency === 'monthly')
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    // Format the portfolio data for Claude
    const formattedPortfolio = {
      userProfile: {
        age: userInfo.age || "Unknown",
        riskTolerance: userInfo.riskTolerance || "moderate",
        financialGoals: userInfo.financialGoals || [],
        city: userInfo.city || "Unknown"
      },
      assets: {
        stocks: stocks.map(stock => ({
          name: stock.name,
          symbol: stock.symbol,
          quantity: stock.quantity,
          averagePrice: stock.averagePrice,
          currentPrice: stock.currentPrice,
          currentValue: stock.quantity * stock.currentPrice,
          profitLoss: (stock.currentPrice - stock.averagePrice) * stock.quantity,
          profitLossPercentage: ((stock.currentPrice - stock.averagePrice) / stock.averagePrice) * 100,
          sector: stock.sector
        })),
        mutualFunds: mutualFunds.map(mf => ({
          name: mf.name,
          investedAmount: mf.investedAmount,
          currentValue: mf.currentValue,
          profitLoss: mf.currentValue - mf.investedAmount,
          profitLossPercentage: ((mf.currentValue - mf.investedAmount) / mf.investedAmount) * 100,
          category: mf.category
        })),
        externalInvestments: externalInvestments.map(inv => ({
          name: inv.name,
          type: inv.type,
          amount: inv.amount
        })),
        zerodhaHoldings: zerodhaHoldings
      },
      liabilities: {
        monthlyExpenses: monthlyExpenses,
        regularExpenses: expenses.map(expense => ({
          name: expense.name,
          amount: expense.amount,
          frequency: expense.frequency,
          type: expense.type
        })),
        futureExpenses: futureExpenses.map(expense => ({
          purpose: expense.purpose,
          amount: expense.amount,
          timeframe: expense.timeframe,
          priority: expense.priority
        }))
      },
      summary: {
        totalStocksValue,
        totalMFValue,
        totalExternalValue,
        totalPortfolioValue,
        monthlyExpenses
      }
    };
    
    // Calculate portfolio allocations
    const assetAllocation = [];
    if (totalStocksValue > 0) {
      assetAllocation.push({
        type: "Equities",
        value: totalStocksValue,
        percentage: (totalStocksValue / totalPortfolioValue) * 100
      });
    }
    
    if (totalMFValue > 0) {
      assetAllocation.push({
        type: "Mutual Funds",
        value: totalMFValue,
        percentage: (totalMFValue / totalPortfolioValue) * 100
      });
    }
    
    // Group external investments by type
    const externalByType = externalInvestments.reduce((acc, inv) => {
      if (!acc[inv.type]) acc[inv.type] = 0;
      acc[inv.type] += inv.amount;
      return acc;
    }, {} as Record<string, number>);
    
    Object.keys(externalByType).forEach(type => {
      assetAllocation.push({
        type,
        value: externalByType[type],
        percentage: (externalByType[type] / totalPortfolioValue) * 100
      });
    });
    
    // Prepare sector breakdown
    const sectorData = stocks.reduce((acc, stock) => {
      const sector = stock.sector || "Unknown";
      if (!acc[sector]) acc[sector] = 0;
      acc[sector] += stock.quantity * stock.currentPrice;
      return acc;
    }, {} as Record<string, number>);
    
    const sectorBreakdown = Object.keys(sectorData).map(sector => ({
      sector,
      totalValue: sectorData[sector],
      percentage: (sectorData[sector] / totalStocksValue) * 100
    }));
    
    // Create the system message for Claude
    const systemMessage = `You are an expert financial advisor analyzing an investor's portfolio. 
    Use the provided portfolio data to generate a comprehensive analysis including:
    
    1. A summary of the portfolio's current state and overall health
    2. Performance metrics (total value, profit/loss, etc.)
    3. Asset allocation analysis and recommendations
    4. Risk assessment and volatility metrics
    5. Sector breakdown and diversification analysis
    6. Tax-saving opportunities and suggestions
    7. Key insights and recommendations for improvement
    8. Actionable steps the investor should take
    
    Format your response as a valid JSON object with the following structure:
    {
      "summary": "Overall portfolio summary",
      "assetAllocation": [
        { "type": "Asset type", "percentage": number, "value": number }
      ],
      "performanceMetrics": {
        "totalValue": number,
        "profitLoss": number,
        "profitLossPercentage": number,
        "cagr": number,
        "irr": number,
        "sharpeRatio": number
      },
      "sectorBreakdown": [
        { "sector": "Sector name", "totalValue": number, "percentage": number }
      ],
      "riskMetrics": {
        "volatility": {
          "portfolioBeta": number,
          "marketComparison": "Comparison text"
        },
        "qualityScore": {
          "overall": number,
          "stability": number,
          "growth": number,
          "value": number
        }
      },
      "insights": [
        {
          "type": "strength | warning | suggestion | tax | goal | volatility",
          "title": "Insight title",
          "description": "Insight description",
          "priority": "low | medium | high",
          "actionable": boolean
        }
      ],
      "taxInsights": {
        "potentialSavings": number,
        "suggestions": ["Tax suggestion 1", "Tax suggestion 2"]
      },
      "keyRecommendations": ["Recommendation 1", "Recommendation 2"],
      "actionItems": ["Action 1", "Action 2"]
    }
    
    Ensure your response is VALID JSON. Use realistic values based on the provided data.
    If certain data isn't available, make reasonable assumptions and note them in your analysis.
    Your analysis should be tailored to the user's age, risk tolerance, and financial goals.`;
    
    // Format user message with portfolio data
    const userMessage = `Please analyze this investment portfolio:
    
    User Profile:
    - Age: ${userInfo.age || "Unknown"}
    - Risk Tolerance: ${userInfo.riskTolerance || "moderate"}
    - Location: ${userInfo.city || "Unknown"}
    - Financial Goals: ${(userInfo.financialGoals || []).join(", ") || "Not specified"}
    
    Portfolio Summary:
    - Total Value: ${formatCurrency(totalPortfolioValue)}
    - Stocks Value: ${formatCurrency(totalStocksValue)} (${stocks.length} holdings)
    - Mutual Funds Value: ${formatCurrency(totalMFValue)} (${mutualFunds.length} funds)
    - External Investments: ${formatCurrency(totalExternalValue)} (${externalInvestments.length} investments)
    - Monthly Expenses: ${formatCurrency(monthlyExpenses)}
    
    Asset Allocation:
    ${assetAllocation.map(asset => `- ${asset.type}: ${formatCurrency(asset.value)} (${asset.percentage.toFixed(1)}%)`).join("\n")}
    
    ${stocks.length > 0 ? `
    Top Stocks:
    ${stocks.slice(0, 5).map(stock => 
      `- ${stock.name} (${stock.symbol}): ${formatCurrency(stock.quantity * stock.currentPrice)}`
    ).join("\n")}
    ` : ""}
    
    ${mutualFunds.length > 0 ? `
    Top Mutual Funds:
    ${mutualFunds.slice(0, 5).map(mf => 
      `- ${mf.name}: ${formatCurrency(mf.currentValue)}`
    ).join("\n")}
    ` : ""}
    
    ${externalInvestments.length > 0 ? `
    External Investments:
    ${externalInvestments.map(inv => 
      `- ${inv.name} (${inv.type}): ${formatCurrency(inv.amount)}`
    ).join("\n")}
    ` : ""}
    
    ${futureExpenses.length > 0 ? `
    Future Financial Goals:
    ${futureExpenses.map(exp => 
      `- ${exp.purpose} (${exp.timeframe}): ${formatCurrency(exp.amount)} (Priority: ${exp.priority})`
    ).join("\n")}
    ` : ""}
    
    Please provide a comprehensive analysis with actionable recommendations.`;
    
    console.log("Sending request to Claude API...");
    
    // Call Claude API
    const claudeResponse = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        system: systemMessage,
        messages: [
          { role: "user", content: userMessage }
        ]
      })
    });
    
    // Check for errors in Claude API response
    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.text();
      console.error("Claude API error:", errorData);
      return new Response(
        JSON.stringify({ error: `Claude API error: ${claudeResponse.status} ${claudeResponse.statusText}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Parse Claude's response
    const claudeData = await claudeResponse.json();
    
    if (!claudeData.content || !claudeData.content[0] || !claudeData.content[0].text) {
      console.error("Unexpected Claude API response format:", claudeData);
      return new Response(
        JSON.stringify({ error: "Invalid response from analysis service" }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Extract the content from Claude's response
    const analysisText = claudeData.content[0].text;
    
    console.log("Received response from Claude API, parsing JSON...");
    
    // Attempt to parse the response as JSON
    let analysisData;
    try {
      // Look for JSON content in the response - it might be wrapped in markdown code blocks
      const jsonMatch = analysisText.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) || 
                         analysisText.match(/({[\s\S]*})/) ||
                         analysisText.match(/<jsonContent>([\s\S]*?)<\/jsonContent>/);
      
      const jsonContent = jsonMatch ? jsonMatch[1] : analysisText;
      analysisData = JSON.parse(jsonContent);
      
      // Validate required fields
      const requiredFields = ['summary', 'assetAllocation', 'performanceMetrics', 'sectorBreakdown', 'insights'];
      const missingFields = requiredFields.filter(field => !analysisData[field]);
      
      if (missingFields.length > 0) {
        console.error("Missing required fields in parsed data:", missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
    } catch (error) {
      console.error("Error parsing Claude response:", error);
      console.log("Raw response:", analysisText);
      
      // Return a default analysis with error information
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse analysis results",
          rawResponse: analysisText.substring(0, 1000) // Truncate for logging
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log("Successfully parsed portfolio analysis");
    
    // Return the analysis data
    return new Response(
      JSON.stringify(analysisData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
