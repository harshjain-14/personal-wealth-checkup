
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY") || "";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for required environment variables
    if (!CLAUDE_API_KEY) {
      console.error("CLAUDE_API_KEY environment variable not set");
      return new Response(
        JSON.stringify({
          error: "Server configuration error: CLAUDE_API_KEY not set"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase admin client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify the token and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user token" }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Parse the request body
    const { portfolioData } = await req.json();
    
    if (!portfolioData) {
      return new Response(
        JSON.stringify({ error: "Missing portfolio data" }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create a summarized portfolio for Claude
    const { 
      stocks = [], 
      mutualFunds = [], 
      externalInvestments = [], 
      expenses = [], 
      futureExpenses = [], 
      userInfo
    } = portfolioData;

    // Calculate total values for summary
    const stocksValue = stocks.reduce((total, stock) => total + (stock.quantity * stock.currentPrice), 0);
    const mutualFundsValue = mutualFunds.reduce((total, fund) => total + fund.currentValue, 0);
    const externalValue = externalInvestments.reduce((total, inv) => total + inv.amount, 0);
    const monthlyExpenses = expenses
      .filter(e => e.frequency === 'monthly')
      .reduce((total, e) => total + e.amount, 0);
    const quarterlyExpenses = expenses
      .filter(e => e.frequency === 'quarterly')
      .reduce((total, e) => total + e.amount, 0);
    const yearlyExpenses = expenses
      .filter(e => e.frequency === 'yearly')
      .reduce((total, e) => total + e.amount, 0);
    
    const totalPortfolioValue = stocksValue + mutualFundsValue + externalValue;
    const annualExpenses = monthlyExpenses * 12 + quarterlyExpenses * 4 + yearlyExpenses;
    const plannedFutureExpenses = futureExpenses.reduce((total, exp) => total + exp.amount, 0);

    console.log("Preparing portfolio analysis request to Claude API");
    
    // Create a structured request to Claude
    const message = `
      I need a detailed financial portfolio analysis based on the following data:

      ## User Information
      ${userInfo ? `
      - Age: ${userInfo.age}
      - City: ${userInfo.city}
      - Risk Tolerance: ${userInfo.riskTolerance || 'Not specified'}
      - Financial Goals: ${userInfo.financialGoals?.join(', ') || 'Not specified'}
      ` : 'No user information provided'}

      ## Portfolio Summary
      - Total Portfolio Value: ₹${totalPortfolioValue.toFixed(2)}
      - Annual Expenses: ₹${annualExpenses.toFixed(2)}
      - Planned Future Expenses: ₹${plannedFutureExpenses.toFixed(2)}

      ## Investments Breakdown
      - Stocks: ${stocks.length} holdings worth ₹${stocksValue.toFixed(2)}
      - Mutual Funds: ${mutualFunds.length} funds worth ₹${mutualFundsValue.toFixed(2)}
      - External Investments: ${externalInvestments.length} investments worth ₹${externalValue.toFixed(2)}

      ## Detailed Stock Holdings
      ${stocks.map(s => `- ${s.name} (${s.symbol}): ${s.quantity} shares at avg. price ₹${s.averagePrice}, current price ₹${s.currentPrice}, sector: ${s.sector}`).join('\n')}

      ## Detailed Mutual Fund Holdings
      ${mutualFunds.map(f => `- ${f.name}: invested ₹${f.investedAmount}, current value ₹${f.currentValue}, category: ${f.category}`).join('\n')}

      ## External Investments
      ${externalInvestments.map(i => `- ${i.name} (${i.type}): ₹${i.amount} ${i.notes ? `- ${i.notes}` : ''}`).join('\n')}

      ## Regular Expenses
      ${expenses.map(e => `- ${e.name} (${e.type}): ₹${e.amount} (${e.frequency}) ${e.notes ? `- ${e.notes}` : ''}`).join('\n')}

      ## Future Expenses
      ${futureExpenses.map(e => `- ${e.purpose}: ₹${e.amount} within ${e.timeframe}, priority: ${e.priority} ${e.notes ? `- ${e.notes}` : ''}`).join('\n')}

      Please provide a comprehensive analysis with the following sections structured exactly as specified:

      1. A summary overview of the portfolio
      2. Performance metrics that include totalValue (number), profitLoss (number), profitLossPercentage (number), cagr (number), irr (number), and sharpeRatio (number if available)
      3. Asset allocation as an array of items with type (string), percentage (number), and value (number)
      4. Sector breakdown as an array of items with sector (string), totalValue (number), and percentage (number)
      5. Risk metrics with volatility (containing portfolioBeta as number and marketComparison as string) and qualityScore (containing overall as number, and optionally stability, growth, and value as numbers)
      6. Insights as an array of items with type (one of: 'strength', 'warning', 'suggestion', 'tax', 'goal', 'volatility'), title (string), description (string), optional priority ('low', 'medium', or 'high'), and optional actionable (boolean)
      7. Tax insights with potentialSavings (number) and suggestions (array of strings)
      8. Key recommendations as an array of strings
      9. Action items as an array of strings

      Structure the response in a JSON format with this exact structure:
      {
        "summary": "Brief overview of the portfolio",
        "performanceMetrics": {
          "totalValue": 100000,
          "profitLoss": 5000,
          "profitLossPercentage": 5,
          "cagr": 8,
          "irr": 7,
          "sharpeRatio": 0.8
        },
        "assetAllocation": [
          {"type": "Equities", "percentage": 40, "value": 40000},
          {"type": "Mutual Funds", "percentage": 30, "value": 30000},
          {"type": "Fixed Deposits", "percentage": 20, "value": 20000},
          {"type": "Others", "percentage": 10, "value": 10000}
        ],
        "sectorBreakdown": [
          {"sector": "Technology", "totalValue": 25000, "percentage": 25},
          {"sector": "Financial", "totalValue": 30000, "percentage": 30},
          {"sector": "Healthcare", "totalValue": 15000, "percentage": 15},
          {"sector": "Consumer", "totalValue": 20000, "percentage": 20},
          {"sector": "Others", "totalValue": 10000, "percentage": 10}
        ],
        "riskMetrics": {
          "volatility": {
            "portfolioBeta": 0.85,
            "marketComparison": "Below market volatility"
          },
          "qualityScore": {
            "overall": 75,
            "stability": 80,
            "growth": 70,
            "value": 75
          }
        },
        "insights": [
          {
            "type": "strength",
            "title": "Good Diversification",
            "description": "Your portfolio is well diversified across sectors",
            "priority": "medium"
          },
          {
            "type": "warning",
            "title": "High Expense Ratio",
            "description": "Some of your mutual funds have high expense ratios",
            "priority": "high",
            "actionable": true
          }
        ],
        "taxInsights": {
          "potentialSavings": 12000,
          "suggestions": [
            "Consider tax-saving ELSS funds",
            "Review holding periods for better tax treatment"
          ]
        },
        "keyRecommendations": [
          "Increase equity exposure by 5%",
          "Reduce high-cost mutual funds"
        ],
        "actionItems": [
          "Rebalance portfolio quarterly",
          "Set up SIP for consistent investing"
        ]
      }

      Please ensure that the response is structured exactly as specified and contains only valid JSON. Do not include any explanatory text outside the JSON structure.
    `;

    // Call Claude API for analysis
    console.log("Sending request to Claude API");
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.5,
        system: "You are a financial advisor specializing in portfolio analysis. Provide insightful, accurate, and actionable financial advice. Only respond with valid JSON as specified in the user's message."
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze portfolio with Claude AI" }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const claudeData = await claudeResponse.json();
    console.log("Received response from Claude API");
    
    // Extract the analysis from Claude's response
    let analysis;
    try {
      // Get the JSON string from Claude's response content
      const responseContent = claudeData.content[0].text;
      
      // Extract JSON from the response (in case Claude adds any extra text)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseContent;
      
      analysis = JSON.parse(jsonString);
      
      // Save the analysis to the database
      const { error: saveError } = await supabase
        .from('portfolio_analysis')
        .insert({
          user_id: user.id,
          analysis_data: analysis,
          portfolio_data: portfolioData,
          analysis_date: new Date().toISOString()
        });
        
      if (saveError) {
        console.error("Error saving analysis to database:", saveError);
      }
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse portfolio analysis", 
          claudeResponse: claudeData.content[0].text 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return the analysis
    return new Response(
      JSON.stringify(analysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in portfolio analysis:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
