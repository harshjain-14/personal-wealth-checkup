
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
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

    // Get the authorization header and extract the token
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!authHeader || !token) {
      console.error("No authorization header present or token is empty");
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

    // Create Supabase admin client with service role
    const supabaseAdmin = createClient(
      SUPABASE_URL, 
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({
          error: "User authentication failed: " + (userError?.message || "Unknown error")
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Getting Zerodha credentials for user: ${user.id}`);
    
    // Get the access token from zerodha_credentials table
    const { data: credentials, error: credentialsError } = await supabaseAdmin
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

    // For debugging, let's first validate the access token
    try {
      const userProfileResponse = await fetch("https://api.kite.trade/user/profile", {
        headers
      });
      
      if (!userProfileResponse.ok) {
        const errorText = await userProfileResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { message: errorText };
        }
        
        console.error(`Invalid access token. Status: ${userProfileResponse.status}, Error:`, errorData);
        
        // If token is invalid, we should clear it and ask user to reconnect
        if (userProfileResponse.status === 403 || userProfileResponse.status === 401) {
          // Clear the invalid token
          await supabaseAdmin
            .from('zerodha_credentials')
            .update({ access_token: null })
            .eq('user_id', user.id);
            
          return new Response(
            JSON.stringify({
              error: "Your Zerodha session has expired. Please reconnect your account."
            }),
            {
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        
        return new Response(
          JSON.stringify({
            error: `Failed to validate Zerodha token: ${errorData.message || "Unknown error"}`
          }),
          {
            status: userProfileResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      const profileData = await userProfileResponse.json();
      console.log("User profile validated:", profileData.status === "success");
    } catch (error) {
      console.error("Error validating access token:", error);
      return new Response(
        JSON.stringify({
          error: `Error validating access token: ${error.message || "Unknown error"}`
        }),
        {
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

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
      const holdingsText = await holdingsResponse.text();
      const positionsText = await positionsResponse.text();
      
      let holdingsData, positionsData;
      
      try {
        holdingsData = JSON.parse(holdingsText);
      } catch (e) {
        console.error("Failed to parse holdings response:", holdingsText);
        holdingsData = { status: "error", message: "Failed to parse response" };
      }
      
      try {
        positionsData = JSON.parse(positionsText);
      } catch (e) {
        console.error("Failed to parse positions response:", positionsText);
        positionsData = { status: "error", message: "Failed to parse response" };
      }

      // Debug logs
      console.log("Holdings response status:", holdingsResponse.status);
      console.log("Positions response status:", positionsResponse.status);
      console.log("Holdings data status:", holdingsData.status);
      console.log("Positions data status:", positionsData.status);
      
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
    } catch (fetchError: any) {
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
  } catch (error: any) {
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
