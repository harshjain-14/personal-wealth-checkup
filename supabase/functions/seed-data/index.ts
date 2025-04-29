
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the request body
    const requestData = await req.json();
    const { userId } = requestData;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verify auth
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Clear existing user data
    await supabaseClient.from('external_investments').delete().eq('user_id', userId);
    await supabaseClient.from('regular_expenses').delete().eq('user_id', userId);
    await supabaseClient.from('future_expenses').delete().eq('user_id', userId);

    // Seed external investments
    const externalInvestments = [
      {
        user_id: userId,
        investment_type: "Gold",
        investment_name: "Gold ETF",
        amount: 250000,
        notes: "SBI Gold ETF"
      },
      {
        user_id: userId,
        investment_type: "Fixed Deposit",
        investment_name: "Bank FD",
        amount: 500000,
        notes: "Matures in 2026, 6.5% interest"
      },
      {
        user_id: userId,
        investment_type: "PPF",
        investment_name: "Public Provident Fund",
        amount: 350000,
        notes: "Tax-free investment"
      },
      {
        user_id: userId,
        investment_type: "Real Estate",
        investment_name: "Apartment",
        amount: 8000000,
        notes: "2BHK in Bangalore"
      }
    ];
    
    // Insert investments one by one to avoid type errors
    for (const investment of externalInvestments) {
      const { error: investmentError } = await supabaseClient
        .from('external_investments')
        .insert(investment);
      
      if (investmentError) {
        console.error("Error seeding investment:", investmentError);
        throw new Error(investmentError.message);
      }
    }
    
    // Seed regular expenses
    const regularExpenses = [
      {
        user_id: userId,
        expense_type: "EMI",
        description: "Home Loan EMI",
        amount: 35000,
        frequency: "Monthly",
        notes: "20-year loan, 7.5% interest"
      },
      {
        user_id: userId,
        expense_type: "Insurance Premium",
        description: "Health Insurance",
        amount: 25000,
        frequency: "Yearly",
        notes: "Family floater policy"
      },
      {
        user_id: userId,
        expense_type: "School Fees",
        description: "School Tuition",
        amount: 50000,
        frequency: "Quarterly",
        notes: "For two children"
      }
    ];
    
    // Insert expenses one by one
    for (const expense of regularExpenses) {
      const { error: expenseError } = await supabaseClient
        .from('regular_expenses')
        .insert(expense);
      
      if (expenseError) {
        console.error("Error seeding expense:", expenseError);
        throw new Error(expenseError.message);
      }
    }
    
    // Seed future expenses - updated to match the correct enum values
    const futureExpenses = [
      {
        user_id: userId,
        purpose: "Education",
        amount: 2000000,
        timeframe: "5 years",
        priority: "high",
        notes: "Children's college education"
      },
      {
        user_id: userId,
        purpose: "Vacation",
        amount: 300000,
        timeframe: "1 year",
        priority: "medium",
        notes: "Family trip to Europe"
      },
      {
        user_id: userId,
        purpose: "House Purchase",
        amount: 10000000,
        timeframe: "10 years",
        priority: "high",
        notes: "Retirement home"
      }
    ];
    
    // Insert future expenses one by one
    for (const futureExpense of futureExpenses) {
      const { error: futureExpenseError } = await supabaseClient
        .from('future_expenses')
        .insert(futureExpense);
      
      if (futureExpenseError) {
        console.error("Error seeding future expense:", futureExpenseError);
        throw new Error(futureExpenseError.message);
      }
    }
    
    // Seed personal info
    const personalInfo = {
      id: userId,
      user_id: userId,
      age: 35,
      city: "Mumbai",
      risk_tolerance: "medium - balanced apporach",
      financial_goals: ["Retirement", "Children's Education", "Wealth Creation", "Travel"]
    };
    
    const { error: personalInfoError } = await supabaseClient
      .from('personal_info')
      .upsert([personalInfo]);
    
    if (personalInfoError) {
      console.error("Error seeding personal info:", personalInfoError);
      throw new Error(personalInfoError.message);
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Sample data seeded successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error seeding data:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
