
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Get the user from Supabase Auth
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
          error: "User authentication failed"
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get the access token from zerodha_credentials table
    const { data: credentials, error: credentialsError } = await supabaseClient
      .from('zerodha_credentials')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    if (credentialsError || !credentials?.access_token) {
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
      "Authorization": `token ${access_token}`,
      "X-Kite-Version": "3"
    };

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
        holdings: holdingsData.data,
        positions: positionsData.data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error fetching Zerodha portfolio:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch portfolio data"
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
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: () => {
            console.log(`Mock query: SELECT ${columns} FROM ${table} WHERE ${column} = ${value}`);
            return Promise.resolve({
              data: { access_token: 'mock-access-token' },
              error: null
            });
          }
        })
      })
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
