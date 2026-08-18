import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/trading/Dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Accounts — OTC BROKER" },
      { name: "description", content: "Your live gold trading account overview." },
      { property: "og:title", content: "Accounts — OTC BROKER" },
      { property: "og:description", content: "Your live gold trading account overview." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://otcbroker.space/dashboard" },
      { property: "og:image", content: "https://otcbroker.space/otc-broker-og.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Accounts — OTC BROKER" },
      { name: "twitter:description", content: "Your live gold trading account overview." },
      { name: "twitter:image", content: "https://otcbroker.space/otc-broker-og.png" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://otcbroker.space/dashboard" }],
  }),
  component: () => <Dashboard />,
});
