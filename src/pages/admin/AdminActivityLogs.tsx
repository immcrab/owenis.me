import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { Table, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { useActivityLogs } from "@/hooks/useAdminData";
import { formatDateTime } from "@/lib/utils";

export default function AdminActivityLogs() {
  const { logs, loading } = useActivityLogs();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter(
      (l) => l.action.toLowerCase().includes(term) || l.actorEmail?.toLowerCase().includes(term),
    );
  }, [logs, search]);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Activity logs" description="Server-recorded events across the platform." />

      <Input
        placeholder="Search by action or user…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        suffix={<Search size={16} className="text-[var(--color-text-tertiary)]" />}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No activity found" />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Action</Th>
              <Th>User</Th>
              <Th>When</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((log) => (
              <Tr key={log.id}>
                <Td className="font-medium">{log.action}</Td>
                <Td className="text-[var(--color-text-secondary)]">{log.actorEmail ?? "system"}</Td>
                <Td className="text-[var(--color-text-tertiary)]">{formatDateTime(log.createdAt?.toDate?.())}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
