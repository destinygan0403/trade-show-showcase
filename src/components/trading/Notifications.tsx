import { Bell, X, Newspaper, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { useMarketNews, getNewsReadAt, markNewsRead } from "@/lib/market-news";
import { useMarkNotificationsRead, useMyNotifications } from "@/lib/data";

type Item = {
  id: string;
  kind: "news" | "account";
  title: string;
  body: string;
  meta?: string;
  created_at: string;
  unread: boolean;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}

export function useNotificationItems(userId: string | undefined): Item[] {
  const news = useMarketNews();
  const notifs = useMyNotifications(userId);
  const readAt = getNewsReadAt();

  const items: Item[] = [
    ...news.map((n) => ({
      id: n.id,
      kind: "news" as const,
      title: n.title,
      body: n.body,
      meta: `${n.source} · ${n.tag}`,
      created_at: n.created_at,
      unread: new Date(n.created_at).getTime() > readAt,
    })),
    ...(notifs.data ?? []).map((n) => ({
      id: n.id,
      kind: "account" as const,
      title: n.title,
      body: n.body ?? "",
      created_at: n.created_at,
      unread: !n.read,
    })),
  ];
  items.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return items;
}

export function NotificationsPanel({
  userId,
  items,
  onClose,
}: {
  userId: string | undefined;
  items: Item[];
  onClose: () => void;
}) {
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    markNewsRead();
    if (userId) markRead.mutate(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end sm:justify-center">
      <button className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-label="Fermer" />
      <div className="relative mx-auto w-full max-w-md max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-border/60 bg-surface shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <h2 className="text-base font-semibold text-white">Notifications</h2>
          </div>
          <button onClick={onClose} className="p-1 -m-1 text-muted-foreground hover:text-white" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto">
          {items.length === 0 && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">Aucune notification</div>
          )}
          {items.map((n, i) => (
            <div key={n.id} className={`px-5 py-3.5 ${i > 0 ? "border-t border-border/40" : ""} ${n.unread ? "bg-primary/[0.06]" : ""}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 rounded-lg p-1.5 ${n.kind === "news" ? "bg-primary/15 text-primary" : "bg-[var(--color-profit)]/15 text-[var(--color-profit)]"}`}>
                  {n.kind === "news" ? <Newspaper size={14} /> : <TrendingUp size={14} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-white leading-snug">{n.title}</div>
                    {n.unread && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                  {n.body && <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{n.body}</p>}
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {n.meta ? `${n.meta} · ` : ""}{timeAgo(n.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
