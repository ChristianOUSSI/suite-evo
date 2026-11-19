import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Le lien de suivi partageable : /suivi/EVIO-XXXXXX mène à la page de
 * recherche pré-remplie. Une seule page à entretenir.
 */
export default async function PageSuiviNumero({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  redirect(`/suivi?numero=${encodeURIComponent(numero)}`);
}
