import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OTC BROKER" },
      { name: "description", content: "Plateforme de trading professionnelle pour l'or et le forex." },
      { property: "og:title", content: "OTC BROKER" },
      { property: "og:description", content: "Plateforme de trading professionnelle pour l'or et le forex." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://otcbroker.space/" },
      { property: "og:image", content: "https://otcbroker.space/otc-broker-og.jpg" },
      { property: "og:image:secure_url", content: "https://otcbroker.space/otc-broker-og.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "OTC BROKER" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "OTC BROKER" },
      { name: "twitter:description", content: "Plateforme de trading professionnelle pour l'or et le forex." },
      { name: "twitter:image", content: "https://otcbroker.space/otc-broker-og.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://otcbroker.space/" }],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const { session, loading } = useSession();
  if (loading) return <div className="min-h-screen bg-background" />;
  return <Navigate to={session ? "/dashboard" : "/auth"} replace />;
}
