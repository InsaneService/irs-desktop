const allowedOrigins = new Set([
  "https://insanerevenueservice.github.io",
  "https://insaneservice.github.io",
]);

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin") || "";
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const element = typeof body.element === "string" ? body.element.trim() : "";
    if (!element || element.length > 120) {
      return new Response("Invalid element", { status: 400, headers: corsHeaders });
    }

    // Country is recorded only when Supabase supplies Cloudflare's country header.
    // No IP address is read, looked up, or stored.
    const headerCountry = (request.headers.get("cf-ipcountry") || "").trim().toUpperCase();
    const country = /^[A-Z]{2}$/.test(headerCountry) && headerCountry !== "XX"
      ? headerCountry
      : null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response("Server configuration missing", { status: 500, headers: corsHeaders });
    }

    const result = await fetch(`${supabaseUrl}/rest/v1/rpc/record_element_click`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_element: element, p_country: country }),
    });

    if (!result.ok) {
      return new Response("Could not record click", { status: 502, headers: corsHeaders });
    }
    return new Response(null, { status: 204, headers: corsHeaders });
  } catch {
    return new Response("Invalid request", { status: 400, headers: corsHeaders });
  }
});
