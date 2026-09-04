import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Firebase Auth builds action links (verify email, reset password) as
 * `https://owenis.me/?mode=...&oobCode=...` — real query-string params,
 * placed BEFORE any `#` fragment. Under HashRouter those never reach
 * react-router's useSearchParams (which only reads what's after the `#`).
 * This runs once on load, and if it finds Firebase's params in the real
 * query string, forwards them into the hash route so AuthAction.tsx's
 * normal useSearchParams() call picks them up.
 */
export function AuthActionBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const realSearch = window.location.search;
    if (!realSearch.includes("mode=")) return;

    navigate(`/auth/action${realSearch}`, { replace: true });

    // Tidy the address bar so the real query string doesn't linger
    // alongside the hash route.
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
