import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/trading/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accounts — Gold Trading Terminal" },
      { name: "description", content: "Professional mobile trading dashboard for gold and FX positions." },
      { property: "og:title", content: "Accounts — Gold Trading Terminal" },
      { property: "og:description", content: "Professional mobile trading dashboard for gold and FX positions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <Dashboard />;
}
