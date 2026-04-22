import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NeoProfileProvider } from "@/contexts/NeoProfileContext";
import { SetValidationProvider } from "@/contexts/SetValidationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SupplementNotificationToast } from "@/components/nutrition/SupplementNotificationToast";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import MuscleDetail from "./pages/MuscleDetail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SolarLauncher from "./pages/SolarLauncher";
import Landing from "./pages/Landing";

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
  
  // If user is authenticated, redirect to app
  if (user) {
    return <Navigate to="/app" replace />;
  }
  
  return <Auth />;
};

const AppContent = () => {
  return (
    <>
      <SupplementNotificationToast />
      <Routes>
        <Route path="/auth" element={<AuthRoute />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<Landing />} />
        <Route path="/landing-preview" element={<Landing forcePreview />} />
        <Route
          path="/app"
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
        <Route
          path="/launcher"
          element={
            <ProtectedRoute>
              <SolarLauncher />
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
      <NeoProfileProvider>
        <SetValidationProvider>
          <TooltipProvider>
            <ThemeInitializer />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </SetValidationProvider>
      </NeoProfileProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
