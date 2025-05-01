
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.0";

const KITE_API_KEY = Deno.env.get("KITE_API_KEY") || "";
const KITE_API_SECRET = Deno.env.get("KITE_API_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to create checksum using SHA-256
async function generateChecksum(apiKey: string, requestToken: string, apiSecret: string): Promise<string> {
  console.log(`Generating checksum with apiKey: ${apiKey}, requestToken: ${requestToken}, and apiSecret length: ${apiSecret.length}`);
  try {
    const data = apiKey + requestToken + apiSecret;
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(data);
    
    const hashBuffer = await crypto.subtle.digest("sha-256", messageBuffer);
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log(`Generated checksum: ${checksum.substring(0, 10)}...`);
    return checksum;
  } catch (error) {
    console.error("Error generating checksum:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if environment variables are set
    if (!KITE_API_KEY || !KITE_API_SECRET) {
      console.error("Missing environment variables: KITE_API_KEY or KITE_API_SECRET");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Server configuration error. Please contact support."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get request token from request body
    const { request_token } = await req.json();
    
    if (!request_token) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Request token is required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Processing request token: ${request_token}`);

    // Generate checksum for the request
    const checksum = await generateChecksum(KITE_API_KEY, request_token, KITE_API_SECRET);
    console.log(`Generated checksum for token exchange: ${checksum.substring(0, 10)}...`);

    // Exchange token with Zerodha API
    console.log(`Sending request to Zerodha API for token exchange`);
    const response = await fetch("https://api.kite.trade/session/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Kite-Version": "3"
      },
      body: new URLSearchParams({
        api_key: KITE_API_KEY,
        request_token: request_token,
        checksum: checksum
      }).toString()
    });

    const responseData = await response.json();
    console.log("Zerodha API response status:", response.status);
    console.log("Zerodha API response:", JSON.stringify(responseData));

    // Check if the token exchange was successful
    if (!response.ok) {
      console.error("Zerodha token exchange failed:", responseData);
      return new Response(
        JSON.stringify({
          success: false,
          message: responseData.message || "Failed to exchange token with Zerodha"
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract access token
    const access_token = responseData.data?.access_token;
    
    if (!access_token) {
      console.error("No access token in Zerodha response:", responseData);
      return new Response(
        JSON.stringify({
          success: false,
          message: "No access token in Zerodha response"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Received access token from Zerodha: ${access_token.substring(0, 5)}...`);

    // Get the auth header and extract token
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!authHeader || !token) {
      console.error("No authorization header present or token is empty");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Authentication required"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Get the user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "User authentication failed: " + (userError?.message || "Unknown error")
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Storing access token for user: ${user.id}`);

    // Store access token in zerodha_credentials table
    const { error: upsertError } = await supabaseAdmin
      .from('zerodha_credentials')
      .upsert([
        { 
          user_id: user.id,
          zerodha_user_id: responseData.data?.user_id || '',
          access_token: access_token
        }
      ]);

    if (upsertError) {
      console.error("Error storing access token:", upsertError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to store access token: " + upsertError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Successfully stored Zerodha access token for user: ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Token exchanged and stored successfully"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error exchanging Zerodha token:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal server error: " + (error instanceof Error ? error.message : String(error))
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
