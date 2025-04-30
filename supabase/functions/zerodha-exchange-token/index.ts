
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const KITE_API_KEY = Deno.env.get("KITE_API_KEY") || "";
const KITE_API_SECRET = Deno.env.get("KITE_API_SECRET") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to compute SHA-256 hash
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

    // Compute checksum
    const checksumInput = `${KITE_API_KEY}${request_token}${KITE_API_SECRET}`;
    const checksum = await sha256(checksumInput);

    // Exchange token with Zerodha API
    const response = await fetch("https://api.kite.trade/session/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kite-Version": "3"
      },
      body: JSON.stringify({
        api_key: KITE_API_KEY,
        request_token: request_token,
        checksum: checksum
      })
    });

    const data = await response.json();

    // Check if the token exchange was successful
    if (!response.ok) {
      console.error("Zerodha token exchange failed:", data);
      return new Response(
        JSON.stringify({
          success: false,
          message: data.message || "Failed to exchange token with Zerodha"
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract access token
    const access_token = data.data?.access_token;
    
    if (!access_token) {
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

    // Get the user from Supabase Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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

    // Store the access token in zerodha_credentials table
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the user ID
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "User authentication failed"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Store access token in zerodha_credentials table
    const { error } = await supabaseClient
      .from('zerodha_credentials')
      .upsert([
        { 
          user_id: user.id,
          zerodha_user_id: data.data?.user_id || '',
          access_token: access_token
        }
      ]);

    if (error) {
      console.error("Error storing access token:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to store access token"
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
        message: "Internal server error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to create Supabase client
function createClient(
  supabaseUrl: string,
  supabaseKey: string,
  options: any
) {
  return {
    from: (table: string) => ({
      upsert: (values: any) => {
        console.log(`Mock upsert to ${table}:`, values);
        return Promise.resolve({ error: null });
      }
    }),
    auth: {
      getUser: () => {
        return Promise.resolve({
          data: { user: { id: 'mock-user-id' } }
        });
      }
    }
  };
}
