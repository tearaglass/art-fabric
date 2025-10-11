import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Workspace from "./pages/Workspace";
import NotFound from "./pages/NotFound";
import { initMacroBridge } from "@/lib/macros/MacroBridge";
import { cosmosBus } from "@/lib/events/CosmosBus";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize CosmosBus integrations
    initMacroBridge();
    
    // Log initialization
    console.log('[App] CosmosBus initialized');
    console.log('[App] Access global state via window.cosmos');
    
    // Optional: Log first few events for debugging
    const unsub = cosmosBus.on('transport/tick', (event) => {
      if (event.bar === 0 && event.beat === 0 && event.tick16 === 0) {
        console.log('[CosmosBus] Transport started');
      }
    });
    
    return () => {
      unsub();
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/workspace" element={<Workspace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
