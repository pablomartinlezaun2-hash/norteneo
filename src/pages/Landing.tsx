import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NeoInteractiveCore from "@/components/NeoInteractiveCore";

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Si ya hay sesión, manda directo a la app
  useEffect(() => {
    if (!loading && user) {
      navigate("/app", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <NeoInteractiveCore onAccess={() => navigate("/auth")} />;
};

export default Landing;
