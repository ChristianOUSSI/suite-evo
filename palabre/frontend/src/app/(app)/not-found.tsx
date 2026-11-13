import Link from "next/link";
import { Fleche } from "@/components/fleche";

export default function WorkspaceNotFound() {
  return (
    <div className="shell app-missing">
      <div className="app-missing__head">
        <span className="kicker">Feuille introuvable</span>
        <span className="stamp stamp--straight">Hors carnet</span>
      </div>
      <h1>Ce dossier n’est pas au carnet.</h1>
      <p>
        La référence a peut-être été recopiée de travers, ou la feuille a été
        retirée. Reprenez la liste des créances pour retrouver le bon dossier.
      </p>
      <p className="app-missing__note">
        Les créances réglées et les dossiers en litige restent dans le carnet.
        Rien n’est effacé.
      </p>
      <div className="app-missing__actions">
        <Link href="/app/creances" className="btn btn--ink">
          Retour aux créances
          <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
        </Link>
        <Link href="/app" className="text-link">
          Ouvrir le journal
        </Link>
      </div>
    </div>
  );
}
