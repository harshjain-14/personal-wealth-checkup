
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const KITE_API_KEY = Deno.env.get("KITE_API_KEY") || "";
const REDIRECT_URI = Deno.env.get("REDIRECT_URI") || "";

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
    // Check if environment variables are set
    if (!KITE_API_KEY || !REDIRECT_URI) {
      console.error("Missing environment variables: KITE_API_KEY or REDIRECT_URI");
      return new Response(
        JSON.stringify({
          error: "Server configuration error. Please contact support."
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate Zerodha login URL
    const encodedRedirectUri = encodeURIComponent(REDIRECT_URI);
    const loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${KITE_API_KEY}&redirect_uri=${encodedRedirectUri}`;

    return new Response(
      JSON.stringify({ loginUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error generating Zerodha login URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate login URL" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
