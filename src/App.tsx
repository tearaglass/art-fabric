import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useProjectStore } from "@/store/useProjectStore";
import { compileStrudel } from "@/lib/strudel/compile";
import { strudelEngine } from "@/lib/strudel/engine";
import Home from "./pages/Home";
import Workspace from "./pages/Workspace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function StrudelAutorun() {
  const { currentPatch } = useProjectStore();
  const { toast } = useToast();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Debounce compilation
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = window.setTimeout(async () => {
      try {
        const code = compileStrudel(currentPatch);
        await strudelEngine.run(code);
        strudelEngine.setBpm(currentPatch.bpm);
      } catch (err) {
        console.error('[Autorun] Compile error:', err);
        toast({
          title: 'Pattern compile error',
          description: String(err),
          variant: 'destructive',
        });
      }
    }, 100);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentPatch, toast]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <StrudelAutorun />
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

export default App;
