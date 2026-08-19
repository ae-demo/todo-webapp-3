import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleCallback } from "../auth";

export function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    handleCallback()
      .then(() => {
        if (!cancelled) navigate("/", { replace: true });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Sign-in failed");
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="centered-message">
        <p>Sign-in failed: {error}</p>
      </div>
    );
  }

  return (
    <div className="centered-message">
      <p>Signing you in…</p>
    </div>
  );
}
