"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge, Empty, PageHeader, Table, Tabs, btn, btnPrimary, td, th } from "@/components/admin/ui";
import { dateTime } from "@/lib/format";

type Ticket = { id: string; email: string; subject: string; message: string; order_id: string | null; status: "open" | "resolved"; created_at: string };

export default function SupportAdmin() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: e } = await createClient().from("support_tickets").select("*").order("created_at", { ascending: false });
    if (e) setError(e.message); else setTickets((data ?? []) as Ticket[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function setStatus(id: string, status: Ticket["status"]) {
    const { data, error: e } = await createClient().from("support_tickets").update({ status }).eq("id", id).select("id");
    if (e || !data?.length) { setError(e?.message ?? "Nothing was changed. Are you signed in as an admin?"); return; }
    setTickets((t) => t.map((x) => (x.id === id ? { ...x, status } : x)));
  }
  const rows = tickets.filter((t) => t.status === tab);

  return (
    <>
      <PageHeader title="Support" sub="Messages from the contact form. Reply by email, then mark them resolved." />
      {error && <p role="alert" className="mb-4 border-l-2 border-alert pl-3 text-sm text-alert">{error}</p>}
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "open", label: "Open", count: tickets.filter((t) => t.status === "open").length },
        { id: "resolved", label: "Resolved", count: tickets.filter((t) => t.status === "resolved").length }]} />
      {rows.length === 0 ? <Empty>No tickets here.</Empty> : (
        <Table min="50rem">
          <thead><tr><th className={th}>Ticket</th><th className={th}>From</th><th className={th}>Subject</th><th className={th}>Order</th><th className={th}>Status</th><th className={th}>Actions</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((t) => (
              <tr key={t.id}>
                <td className={td}><p className="font-medium">{t.id}</p><p className="text-xs text-mute">{dateTime(t.created_at)}</p></td>
                <td className={td}><a href={`mailto:${t.email}?subject=${encodeURIComponent("Re: " + t.subject)}`} className="underline underline-offset-4">{t.email}</a></td>
                <td className={`${td} max-w-sm`}>
                  <p className="font-medium">{t.subject}</p>
                  <p className={`mt-1 whitespace-pre-wrap text-xs text-mute ${open === t.id ? "" : "line-clamp-2"}`}>{t.message}</p>
                  <button className="mt-1 text-xs underline underline-offset-4" onClick={() => setOpen(open === t.id ? null : t.id)}>{open === t.id ? "Show less" : "Read all"}</button>
                </td>
                <td className={td}>{t.order_id ?? ""}</td><td className={td}><Badge s={t.status === "open" ? "open" : "completed"} text={t.status} /></td>
                <td className={td}>{t.status === "open"
                  ? <button className={btnPrimary} onClick={() => setStatus(t.id, "resolved")}>Mark resolved</button>
                  : <button className={btn} onClick={() => setStatus(t.id, "open")}>Reopen</button>}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
