import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GOLD HOLDINGS — Trading Terminal" },
      { name: "description", content: "Access your professional gold trading account." },
      { property: "og:title", content: "GOLD HOLDINGS — Trading Terminal" },
      { property: "og:description", content: "Access your professional gold trading account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const { session, loading } = useSession();
  if (loading) return <div className="min-h-screen bg-background" />;
  return <Navigate to={session ? "/dashboard" : "/auth"} replace />;
}
