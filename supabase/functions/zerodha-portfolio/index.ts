
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const KITE_API_KEY = Deno.env.get("KITE_API_KEY") || "";

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
    // Verify environment variables are set
    if (!KITE_API_KEY) {
      console.error("Missing environment variable: KITE_API_KEY");
      return new Response(
        JSON.stringify({
          error: "Server configuration error. KITE_API_KEY is not set."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the authentication header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Authentication required"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with the auth header
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Get the user ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({
          error: "User authentication failed"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Getting Zerodha credentials for user: ${user.id}`);
    
    // Get the access token from zerodha_credentials table
    const { data: credentials, error: credentialsError } = await supabase
      .from('zerodha_credentials')
      .select('access_token')
      .eq('user_id', user.id)
      .maybeSingle();

    if (credentialsError) {
      console.error("Error fetching Zerodha credentials:", credentialsError);
      return new Response(
        JSON.stringify({
          error: `Error fetching Zerodha credentials: ${credentialsError.message}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!credentials || !credentials.access_token) {
      console.error("Zerodha access token not found for user:", user.id);
      return new Response(
        JSON.stringify({
          error: "Zerodha access token not found. Please connect your Zerodha account first."
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch portfolio data from Zerodha API
    const access_token = credentials.access_token;
    const headers = { 
      "Authorization": `token ${KITE_API_KEY}:${access_token}`,
      "X-Kite-Version": "3"
    };

    console.log("Fetching Zerodha portfolio with headers:", {
      authFormat: `token ${KITE_API_KEY}:[access_token]`,
      kiteVersion: "3"
    });

    try {
      // Fetch holdings and positions in parallel
      const [holdingsResponse, positionsResponse] = await Promise.all([
        fetch("https://api.kite.trade/portfolio/holdings", { 
          headers 
        }),
        fetch("https://api.kite.trade/portfolio/positions", { 
          headers 
        })
      ]);

      // Parse the responses
      const holdingsData = await holdingsResponse.json();
      const positionsData = await positionsResponse.json();

      // Debug logs
      console.log("Holdings response status:", holdingsResponse.status);
      console.log("Positions response status:", positionsResponse.status);
      console.log("Holdings data:", JSON.stringify(holdingsData).substring(0, 200) + "...");
      console.log("Positions data:", JSON.stringify(positionsData).substring(0, 200) + "...");

      // Check if the requests were successful
      if (!holdingsResponse.ok) {
        console.error("Zerodha holdings API error:", holdingsData);
        return new Response(
          JSON.stringify({
            error: holdingsData.message || "Failed to fetch holdings from Zerodha"
          }),
          {
            status: holdingsResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!positionsResponse.ok) {
        console.error("Zerodha positions API error:", positionsData);
        return new Response(
          JSON.stringify({
            error: positionsData.message || "Failed to fetch positions from Zerodha"
          }),
          {
            status: positionsResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Return the portfolio data
      return new Response(
        JSON.stringify({
          holdings: holdingsData.data || [],
          positions: positionsData.data || []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (fetchError) {
      console.error("Error fetching data from Zerodha API:", fetchError);
      return new Response(
        JSON.stringify({
          error: `Error fetching data from Zerodha API: ${fetchError.message || 'Unknown error'}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error("Error fetching Zerodha portfolio:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch portfolio data: " + (error instanceof Error ? error.message : String(error))
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
