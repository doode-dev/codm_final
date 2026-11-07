"use client";

import { useState } from "react";
import { useAdmin } from "@/components/admin/store";
import { Empty, PageHeader, Search, Table, td, th } from "@/components/admin/ui";
import { dateTime } from "@/lib/format";

export default function AuditLog() {
  const { audit } = useAdmin();
  const [q, setQ] = useState("");
  const rows = audit.filter((a) => !q || `${a.action} ${a.target} ${a.note ?? ""} ${a.actor}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="Audit log" sub="Every admin action, newest first. Entries can't be edited." />
      <div className="mb-4"><Search value={q} onChange={setQ} placeholder="Search actions, targets or notes" /></div>
      {rows.length === 0 ? <Empty>No entries match.</Empty> : (
        <Table min="44rem">
          <thead><tr><th className={th}>When</th><th className={th}>Who</th><th className={th}>Action</th><th className={th}>Target</th><th className={th}>Note</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((a) => (
              <tr key={a.id}><td className={`${td} whitespace-nowrap text-mute`}>{dateTime(a.at)}</td><td className={td}>{a.actor}</td>
                <td className={td}>{a.action}</td><td className={td}>{a.target}</td><td className={`${td} text-mute`}>{a.note ?? ""}</td></tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
