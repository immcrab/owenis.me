import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthCard } from "@/components/layout/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageSpinner } from "@/components/ui/Spinner";
import { auth } from "@/lib/firebase";
import { authErrorMessage } from "@/lib/authErrors";

type Status = "checking" | "verify-success" | "reset-form" | "reset-success" | "error";

export default function AuthAction() {
  const [params] = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function run() {
      if (!mode || !oobCode) {
        setError("This link is missing required parameters.");
        setStatus("error");
        return;
      }
      try {
        if (mode === "verifyEmail") {
          await applyActionCode(auth, oobCode);
          setStatus("verify-success");
        } else if (mode === "resetPassword") {
          const addr = await verifyPasswordResetCode(auth, oobCode);
          setEmail(addr);
          setStatus("reset-form");
        } else {
          setError("Unsupported action.");
          setStatus("error");
        }
      } catch (err) {
        setError(authErrorMessage(err));
        setStatus("error");
      }
    }
    run();
  }, [mode, oobCode]);

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!oobCode) return;
    setSubmitting(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStatus("reset-success");
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "checking") return <PageSpinner />;

  if (status === "error") {
    return (
      <AuthCard title="Link problem" footer={<Link to="/sign-in" className="font-medium text-[var(--color-accent)] hover:underline">Back to sign in</Link>}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <AlertCircle size={32} className="text-[var(--color-danger)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
        </div>
      </AuthCard>
    );
  }

  if (status === "verify-success") {
    return (
      <AuthCard title="Email verified" footer={<Link to="/dashboard" className="font-medium text-[var(--color-accent)] hover:underline">Go to dashboard</Link>}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 size={32} className="text-[var(--color-success)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Your email address has been verified.</p>
        </div>
      </AuthCard>
    );
  }

  if (status === "reset-success") {
    return (
      <AuthCard title="Password updated" footer={<Link to="/sign-in" className="font-medium text-[var(--color-accent)] hover:underline">Sign in</Link>}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 size={32} className="text-[var(--color-success)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">Your password has been reset. You can now sign in.</p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description={email ? `For ${email}` : undefined}>
      <form onSubmit={handleResetSubmit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          error={error ?? undefined}
        />
        <Button type="submit" className="w-full" loading={submitting}>
          Update password
        </Button>
      </form>
    </AuthCard>
  );
}
