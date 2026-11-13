import Link from "next/link";

import { Wordmark } from "@/components/brand";

export default function Inexistant() {
  return (
    <main className="shell incident">
      <Wordmark sous="page absente" />
      <h1 style={{ marginTop: "1.4rem" }}>Ce dossier n'est pas au cahier.</h1>
      <p>
        L'adresse demandée ne correspond à aucune page de la caisse. Le numéro
        de reçu, lui, se vérifie à part.
      </p>
      <div className="form-actions">
        <Link href="/app" className="btn btn--ink">
          Retour à la caisse
        </Link>
        <Link href="/" className="btn">
          Accueil
        </Link>
      </div>
    </main>
  );
}
