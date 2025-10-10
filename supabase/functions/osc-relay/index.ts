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

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log('[OSC Relay] Client connected');
    socket.send(JSON.stringify({ type: 'connected', message: 'OSC relay ready' }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('[OSC Relay] Received from client:', message);

      // In a production environment, you would forward this to a UDP OSC server
      // For now, we echo back to simulate the connection
      // Real implementation would use Deno.DatagramConn to send UDP packets
      
      if (message.address) {
        console.log(`[OSC Relay] Would send to VDMX: ${message.address}`, message.args);
        
        // Echo back success
        socket.send(JSON.stringify({
          type: 'osc_sent',
          address: message.address,
          args: message.args,
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('[OSC Relay] Error processing message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  socket.onerror = (error) => {
    console.error('[OSC Relay] WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('[OSC Relay] Client disconnected');
  };

  return response;
});
