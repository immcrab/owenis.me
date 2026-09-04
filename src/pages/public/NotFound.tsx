import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-[var(--color-accent)]">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">Page not found</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className={buttonVariants("secondary", "md", "mt-6")}>
        <ArrowLeft size={16} /> Back home
      </Link>
    </div>
  );
}
