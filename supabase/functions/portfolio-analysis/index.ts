
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

      Please provide a comprehensive analysis with the following sections:
      1. Portfolio Summary and Overview
      2. Asset Allocation Analysis (current allocation and recommendations)
      3. Risk Assessment
      4. Performance Evaluation
      5. Expense Analysis and Budgeting
      6. Future Expense Planning
      7. Key Recommendations
      8. Action Items

      Structure the response in a JSON format with the following structure:
      {
        "summary": "Brief overview of the portfolio",
        "assetAllocation": {
          "current": "Current allocation analysis",
          "recommendations": "Recommended allocation changes"
        },
        "riskAssessment": "Analysis of portfolio risk",
        "performance": "Performance evaluation",
        "expenseAnalysis": "Analysis of expenses and budgeting",
        "futurePlanning": "Analysis of future expense planning",
        "keyRecommendations": ["List of key recommendations"],
        "actionItems": ["List of actionable steps"]
      }
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
