import type { Metadata } from "next";
import Link from "next/link";

import { CsvImporter } from "@/components/csv-importer";
import { NewInvoiceForm } from "@/components/new-invoice-form";

import "../../../../styles/entree.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscrire une créance",
};

export default function ImportPage() {
  return (
    <div className="shell entree">
      <header className="page-head entree__head">
        <div className="page-head__main">
          <span className="kicker">Feuille 05 · L’entrée</span>
          <h1>Faire entrer une créance.</h1>
          <p className="page-head__lede">
            Une ligne à la main, ou tout un carnet par fichier. Le numéro, les
            dates de relance et le lien de paiement se préparent dans la même
            foulée. Rien n’entre sans être relu.
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/creances" className="btn">
            Voir le registre
          </Link>
        </div>
      </header>

      <div className="entree-grid">
        <div className="entree-main">
          <NewInvoiceForm />

          <section className="entry-flow" aria-labelledby="flow-title">
            <div className="section-head">
              <div>
                <span className="section-head__index">Dans l’ombre</span>
                <h2 id="flow-title">Ce que le carnet prépare.</h2>
              </div>
              <span className="section-head__aside">Sans autre saisie</span>
            </div>
            <ol className="entry-flow__steps">
              <li>
                <span className="entry-flow__index">01</span>
                <h3>Une référence</h3>
                <p>
                  Un numéro unique, dans la suite de l’année. Il suit le
                  dossier jusqu’au reçu.
                </p>
              </li>
              <li>
                <span className="entry-flow__index">02</span>
                <h3>Cinq dates</h3>
                <p>
                  Les relances se posent autour de l’échéance : J-3, J0, J+3,
                  J+7, J+14.
                </p>
              </li>
              <li>
                <span className="entry-flow__index">03</span>
                <h3>Un lien public</h3>
                <p>
                  Le client règle par Mobile Money sans créer de compte ni
                  appeler le comptoir.
                </p>
              </li>
            </ol>
          </section>
        </div>

        <aside className="entree-rail">
          <CsvImporter />
        </aside>
      </div>
    </div>
  );
}
