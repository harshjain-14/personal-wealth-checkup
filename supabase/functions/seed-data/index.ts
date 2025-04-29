
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    // Get the request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Check if the user exists
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (userError && userError.code !== "PGRST116") { // PGRST116 means no rows found
      throw userError;
    }
    
    // Create a profile if it doesn't exist
    if (!userData) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert([{ user_id: userId, additional_info: 'Seed profile' }]);
      
      if (profileError) {
        throw profileError;
      }
    }
    
    // Seed personal info
    const { error: personalInfoError } = await supabaseClient
      .from('personal_info')
      .upsert([
        {
          user_id: userId,
          age: 32,
          city: 'Mumbai',
          risk_tolerance: 'medium',
          financial_goals: ['Retirement', 'Home Purchase', 'Wealth Creation']
        }
      ]);
    
    if (personalInfoError) {
      throw personalInfoError;
    }
    
    // Seed external investments
    const externalInvestments = [
      {
        user_id: userId,
        investment_type: 'FD',
        investment_name: 'HDFC Bank Fixed Deposit',
        amount: 100000,
        notes: '5.5% interest for 3 years'
      },
      {
        user_id: userId,
        investment_type: 'Gold',
        investment_name: 'Digital Gold',
        amount: 50000,
        notes: 'Purchased through PhonePe'
      },
      {
        user_id: userId,
        investment_type: 'Real Estate',
        investment_name: 'Apartment in Pune',
        amount: 3000000,
        notes: 'Rental property'
      }
    ];
    
    // Delete existing external investments first
    await supabaseClient
      .from('external_investments')
      .delete()
      .eq('user_id', userId);
    
    // Insert new external investments
    const { error: investmentsError } = await supabaseClient
      .from('external_investments')
      .insert(externalInvestments);
    
    if (investmentsError) {
      throw investmentsError;
    }
    
    // Seed regular expenses
    const regularExpenses = [
      {
        user_id: userId,
        expense_type: 'Housing',
        description: 'Rent',
        amount: 25000,
        frequency: 'monthly',
        notes: 'Apartment in Bandra'
      },
      {
        user_id: userId,
        expense_type: 'Utilities',
        description: 'Electricity',
        amount: 3000,
        frequency: 'monthly',
        notes: 'Average bill'
      },
      {
        user_id: userId,
        expense_type: 'Transportation',
        description: 'Fuel',
        amount: 5000,
        frequency: 'monthly',
        notes: 'For personal vehicle'
      },
      {
        user_id: userId,
        expense_type: 'Insurance',
        description: 'Health Insurance Premium',
        amount: 15000,
        frequency: 'yearly',
        notes: 'Family floater policy'
      }
    ];
    
    // Delete existing regular expenses first
    await supabaseClient
      .from('regular_expenses')
      .delete()
      .eq('user_id', userId);
    
    // Insert new regular expenses
    const { error: expensesError } = await supabaseClient
      .from('regular_expenses')
      .insert(regularExpenses);
    
    if (expensesError) {
      throw expensesError;
    }
    
    // Seed future expenses
    const futureExpenses = [
      {
        user_id: userId,
        purpose: 'House Down Payment',
        amount: 1500000,
        timeframe: '3 years',
        priority: 'high',
        notes: 'For apartment in Mumbai'
      },
      {
        user_id: userId,
        purpose: 'Car Purchase',
        amount: 800000,
        timeframe: '1 year',
        priority: 'medium',
        notes: 'SUV'
      },
      {
        user_id: userId,
        purpose: 'Higher Education',
        amount: 1000000,
        timeframe: '5 years',
        priority: 'medium',
        notes: 'MBA program'
      },
      {
        user_id: userId,
        purpose: 'Wedding',
        amount: 2000000,
        timeframe: '2 years',
        priority: 'high',
        notes: 'Estimated expenses'
      }
    ];
    
    // Delete existing future expenses first
    await supabaseClient
      .from('future_expenses')
      .delete()
      .eq('user_id', userId);
    
    // Insert new future expenses
    const { error: futureExpensesError } = await supabaseClient
      .from('future_expenses')
      .insert(futureExpenses);
    
    if (futureExpensesError) {
      throw futureExpensesError;
    }
    
    // Seed Zerodha credentials
    const { error: zerodhaError } = await supabaseClient
      .from('zerodha_credentials')
      .upsert([
        {
          user_id: userId,
          zerodha_user_id: 'ZR12345'
        }
      ]);
    
    if (zerodhaError) {
      throw zerodhaError;
    }
    
    return new Response(
      JSON.stringify({ success: true, message: "Dummy data seeded successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error seeding data:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to seed data" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
