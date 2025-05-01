
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.24.0";

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const KITE_API_KEY = Deno.env.get("KITE_API_KEY") || "";

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  console.log("Processing Zerodha logout request");
  
  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Extract the JWT token
    const token = authHeader.replace("Bearer ", "");
    
    // Get the user from the token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Authentication error:", userError);
      return new Response(
        JSON.stringify({ success: false, message: "Authentication failed" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get the user's Zerodha credentials
    const { data: credentials, error: credentialsError } = await supabaseAdmin
      .from("zerodha_credentials")
      .select("access_token")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (credentialsError) {
      console.error("Error fetching credentials:", credentialsError);
      return new Response(
        JSON.stringify({ success: false, message: "Failed to fetch Zerodha credentials" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (!credentials?.access_token) {
      console.log("No access token found for user");
      return new Response(
        JSON.stringify({ success: false, message: "No active Zerodha session found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call Zerodha API to invalidate the token
    const accessToken = credentials.access_token;
    const zerodhaUrl = `https://api.kite.trade/session/token?api_key=${KITE_API_KEY}&access_token=${accessToken}`;
    
    console.log("Sending logout request to Zerodha API");
    
    const zerodhaResponse = await fetch(zerodhaUrl, {
      method: "DELETE",
      headers: {
        "X-Kite-Version": "3",
      },
    });

    const zerodhaData = await zerodhaResponse.json();
    console.log("Zerodha logout response:", zerodhaData);
    
    if (!zerodhaResponse.ok) {
      console.error("Zerodha API error:", zerodhaData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Zerodha logout failed", 
          error: zerodhaData 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update database to remove the token
    const { error: updateError } = await supabaseAdmin
      .from("zerodha_credentials")
      .update({ access_token: null })
      .eq("user_id", user.id);
    
    if (updateError) {
      console.error("Error updating database:", updateError);
      // We still return success since the token was invalidated on Zerodha's side
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Zerodha logout successful", 
        data: zerodhaData 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing logout request:", error);
    return new Response(
      JSON.stringify({ success: false, message: `Internal server error: ${error.message}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
