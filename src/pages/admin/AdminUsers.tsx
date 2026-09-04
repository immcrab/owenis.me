import { doc, updateDoc } from "firebase/firestore";
import { Search, ShieldOff, UserCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSpinner } from "@/components/ui/Spinner";
import { Table, Td, Th, Thead, Tr } from "@/components/ui/Table";
import { useToast } from "@/context/ToastContext";
import { useAllUsers } from "@/hooks/useAdminData";
import { logActivity } from "@/lib/activityLog";
import { db } from "@/lib/firebase";
import { formatDate, initials } from "@/lib/utils";

export default function AdminUsers() {
  const { users, loading } = useAllUsers();
  const { push } = useToast();
  const [search, setSearch] = useState("");
  const [pendingUid, setPendingUid] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) => u.email.toLowerCase().includes(term) || u.displayName?.toLowerCase().includes(term));
  }, [users, search]);

  async function toggleDisabled(uid: string, disabled: boolean) {
    setPendingUid(uid);
    try {
      // App-level disable only: without a paid Cloud Functions backend there's
      // no way to suspend the underlying Firebase Auth account. This blocks
      // their writes (via firestore.rules) and signs them out on next load.
      await updateDoc(doc(db, "users", uid), { disabled: !disabled });
      logActivity(!disabled ? "user_disabled" : "user_enabled", { uid });
      push({ kind: "success", title: !disabled ? "User disabled" : "User re-enabled" });
    } catch (err) {
      push({ kind: "error", title: "Action failed", description: err instanceof Error ? err.message : undefined });
    } finally {
      setPendingUid(null);
    }
  }

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description={`${users.length} registered`} />

      <Input
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        suffix={<Search size={16} className="text-[var(--color-text-tertiary)]" />}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No users found" />
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>User</Th>
              <Th>Joined</Th>
              <Th>AI calls today</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((u) => (
              <Tr key={u.uid}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-accent-subtle)] text-xs font-semibold text-[var(--color-accent)]">
                      {initials(u.displayName, u.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.displayName || "—"}</p>
                      <p className="truncate text-xs text-[var(--color-text-tertiary)]">{u.email}</p>
                    </div>
                    {u.isAdmin && <Badge tone="accent">Admin</Badge>}
                  </div>
                </Td>
                <Td className="text-[var(--color-text-secondary)]">{formatDate(u.createdAt?.toDate?.())}</Td>
                <Td className="text-[var(--color-text-secondary)]">{u.aiCallsToday ?? 0}</Td>
                <Td>
                  <Badge tone={u.disabled ? "danger" : "success"} dot>
                    {u.disabled ? "Disabled" : "Active"}
                  </Badge>
                </Td>
                <Td>
                  {!u.isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={pendingUid === u.uid}
                      onClick={() => toggleDisabled(u.uid, u.disabled)}
                      icon={u.disabled ? <UserCheck size={14} /> : <ShieldOff size={14} />}
                      className={u.disabled ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}
                    >
                      {u.disabled ? "Enable" : "Disable"}
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
