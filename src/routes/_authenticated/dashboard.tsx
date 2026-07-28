import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/trading/Dashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Accounts — GOLD HOLDINGS" },
      { name: "description", content: "Your live gold trading account overview." },
      { property: "og:title", content: "Accounts — GOLD HOLDINGS" },
      { property: "og:description", content: "Your live gold trading account overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Dashboard />,
});
