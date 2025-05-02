
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
    // Verify environment variables
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

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      SUPABASE_URL, 
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user from token
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
    
    // Get the access token
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
          error: "No active Zerodha session found."
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const accessToken = credentials.access_token;

    try {
      // Call Zerodha logout endpoint
      const logoutResponse = await fetch(
        `https://api.kite.trade/session/token?api_key=${KITE_API_KEY}&access_token=${accessToken}`,
        {
          method: 'DELETE',
          headers: {
            'X-Kite-Version': '3'
          }
        }
      );

      const responseData = await logoutResponse.json();
      console.log("Zerodha logout response:", responseData);

      if (!logoutResponse.ok) {
        console.error("Zerodha logout failed:", responseData);
        return new Response(
          JSON.stringify({
            error: "Failed to invalidate Zerodha session: " + (responseData.message || "Unknown error")
          }),
          {
            status: logoutResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Clear access token in database
      const { error: updateError } = await supabaseAdmin
        .from('zerodha_credentials')
        .update({ access_token: null })
        .eq('user_id', user.id);

      if (updateError) {
        console.error("Error updating database:", updateError);
        return new Response(
          JSON.stringify({
            error: "Failed to update database: " + updateError.message,
            zerodhaSuccess: true
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Successfully logged out from Zerodha"
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } catch (fetchError: any) {
      console.error("Error calling Zerodha logout API:", fetchError);
      return new Response(
        JSON.stringify({
          error: `Error calling Zerodha logout API: ${fetchError.message || 'Unknown error'}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error: any) {
    console.error("Error logging out from Zerodha:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to log out: " + (error instanceof Error ? error.message : String(error))
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
