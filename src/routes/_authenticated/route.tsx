import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useSession();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth", replace: true });
  }, [loading, session, nav]);
  if (loading || !session) return <div className="min-h-screen bg-background" />;
  return <Outlet />;
}
