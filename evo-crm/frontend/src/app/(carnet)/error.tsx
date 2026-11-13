"use client";

import { EcranErreur } from "@/components/ecran-erreur";

export default function ErreurCarnet({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <EcranErreur error={error} reset={reset} />;
}
