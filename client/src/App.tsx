import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import QRSetup from "@/pages/qr-setup";
import { useQuery } from "@tanstack/react-query";

function AppContent() {
  // Check if there are any active sessions to determine initial view
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['/api/sessions'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const hasActiveSessions = (sessions as any)?.sessions?.some((s: any) => s.status === 'connected') || false;

  return (
    <Switch>
      <Route path="/setup" component={QRSetup} />
      <Route path="/" component={hasActiveSessions ? Dashboard : QRSetup} />
      <Route component={hasActiveSessions ? Dashboard : QRSetup} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
