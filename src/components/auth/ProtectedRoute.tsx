import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading, firebaseConfigured } = useAuth();
  const location = useLocation();

  if (!firebaseConfigured) return <>{children}</>;
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/sign-in" state={{ from: location }} replace />;

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading, firebaseConfigured } = useAuth();
  const location = useLocation();

  if (!firebaseConfigured) return <>{children}</>;
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/sign-in" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
