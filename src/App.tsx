import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SplashScreen } from "@/components/SplashScreen";
import { SupplementNotificationToast } from "@/components/nutrition/SupplementNotificationToast";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MuscleDetail from "./pages/MuscleDetail";

const queryClient = new QueryClient();

// Redirect authenticated users away from auth page
const AuthRoute = () => {
  const { user, loading } = useAuth();
  
  // Show nothing while loading to prevent flash
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // If user is authenticated, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <Auth />;
};

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenSplash, setHasSeenSplash] = useState(false);

  useEffect(() => {
    // Check if user has seen splash this session
    const seen = sessionStorage.getItem('neo-splash-seen');
    if (seen) {
      setShowSplash(false);
      setHasSeenSplash(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasSeenSplash(true);
    sessionStorage.setItem('neo-splash-seen', 'true');
  };

  return (
    <>
      {showSplash && !hasSeenSplash && (
        <SplashScreen onComplete={handleSplashComplete} />
      )}
      <Routes>
        <Route path="/auth" element={<AuthRoute />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          }
        />
        <Route
          path="/muscle/:id"
          element={
            <ProtectedRoute>
              <MuscleDetail />
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ThemeInitializer />
        <Toaster />
        <Sonner />
        <SupplementNotificationToast />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
