
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const KITE_API_KEY = Deno.env.get("KITE_API_KEY") || "";
const KITE_API_SECRET = Deno.env.get("KITE_API_SECRET") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to generate SHA-256 checksum for Zerodha API
async function generateChecksum(apiKey: string, requestToken: string, apiSecret: string): Promise<string> {
  try {
    // Create the input string: api_key + request_token + api_secret
    const input = apiKey + requestToken + apiSecret;
    
    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error("Error generating checksum:", error);
    throw new Error(`Failed to generate checksum: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify required environment variables
    if (!KITE_API_KEY || !KITE_API_SECRET) {
      console.error("Missing required environment variables: KITE_API_KEY or KITE_API_SECRET");
      return new Response(
        JSON.stringify({ success: false, message: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body to get the request token
    let requestToken: string;
    try {
      const body = await req.json();
      requestToken = body.request_token;
      if (!requestToken) {
        throw new Error("No request token provided");
      }
      console.log("Received request token:", requestToken.substring(0, 5) + "***");
    } catch (error: any) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({ success: false, message: "Invalid request: " + error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from Supabase auth
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    // Check if token is present
    if (!token) {
      console.error("No authorization token provided");
      return new Response(
        JSON.stringify({ success: false, message: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({ success: false, message: "User authentication failed: " + (userError?.message || "Unknown error") }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Generate checksum for Zerodha API
    try {
      const checksum = await generateChecksum(KITE_API_KEY, requestToken, KITE_API_SECRET);
      console.log("Generated checksum (first 10 chars):", checksum.substring(0, 10) + "***");
      
      // Prepare body for Zerodha API request
      const formData = new URLSearchParams();
      formData.append("api_key", KITE_API_KEY);
      formData.append("request_token", requestToken);
      formData.append("checksum", checksum);

      // Exchange request token for access token with Zerodha
      console.log("Sending token exchange request to Zerodha...");
      const zerodhaResponse = await fetch("https://api.kite.trade/session/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Kite-Version": "3"
        },
        body: formData.toString()
      });

      const responseText = await zerodhaResponse.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
        console.log("Zerodha API response status:", zerodhaResponse.status);
        console.log("Zerodha API response:", JSON.stringify(responseData).substring(0, 200) + "...");
      } catch (e) {
        console.error("Failed to parse Zerodha response:", responseText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Failed to parse Zerodha response: ${zerodhaResponse.status}`,
            details: responseText
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!zerodhaResponse.ok) {
        console.error(`Zerodha API error: ${zerodhaResponse.status} - ${JSON.stringify(responseData)}`);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Zerodha API error: ${zerodhaResponse.status}`,
            details: responseData
          }),
          { status: zerodhaResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract access token from response
      if (!responseData.data || !responseData.data.access_token) {
        console.error("No access token in response:", responseData);
        return new Response(
          JSON.stringify({ success: false, message: "Access token not found in response" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const accessToken = responseData.data.access_token;
      const zerodhaUserId = responseData.data.user_id.toString();
      
      console.log(`Got access token for Zerodha user ID: ${zerodhaUserId}`);

      // Store token in database
      const { error: upsertError } = await supabaseAdmin
        .from('zerodha_credentials')
        .upsert({
          user_id: user.id,
          zerodha_user_id: zerodhaUserId,
          access_token: accessToken
        });

      if (upsertError) {
        console.error("Error storing credentials:", upsertError);
        return new Response(
          JSON.stringify({ success: false, message: `Failed to store credentials: ${upsertError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log("Successfully stored Zerodha credentials");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Successfully connected to Zerodha"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error("Error in token exchange process:", error);
      return new Response(
        JSON.stringify({ success: false, message: error.message || "Error during token exchange" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
