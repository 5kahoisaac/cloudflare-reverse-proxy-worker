export default {
  async fetch(request, env) {
    // Define CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Adjust for specific origins in production
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
    };

    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Handle other requests (proxy logic)
    try {
      const url = new URL(request.url);
      const targetUrl = new URL(env.TARGET_URL); // Load from .env/env vars
      targetUrl.pathname = url.pathname;        // Preserve path
      targetUrl.search = url.search;            // Preserve query params

      // Prepare the request body
      let requestBody = null;
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        // Stream the body to handle large payloads efficiently
        requestBody = request.body;
      }

      // Create a new request to the target
      const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: requestBody,
        redirect: 'follow',
      });

      // Fetch from target
      const response = await fetch(proxyRequest);

      // Clone response to add CORS headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers), // Spread original headers
          ...corsHeaders, // Add CORS headers
        },
      });

      return newResponse;
    } catch (error) {
      // Handle errors (e.g., invalid body, network issues)
      return new Response('Error proxying request: ' + error.message, {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};
