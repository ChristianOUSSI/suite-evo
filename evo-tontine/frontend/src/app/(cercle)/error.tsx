"use client";

import { EcranErreur } from "@/components/ecran-erreur";

export default function ErreurCercle({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <EcranErreur error={error} reset={reset} />;
}
